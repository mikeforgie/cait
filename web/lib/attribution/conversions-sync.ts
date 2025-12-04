/**
 * Conversions Sync Service
 * Fetches GA4 conversion events and syncs to database
 */

import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/auth/google-oauth';
import { detectAITrafficSource } from './results-sync';

export interface GA4ConversionEvent {
  eventName: string;
  eventCount: number;
  eventValue: number;
  source: string;
  medium: string;
  landingPage: string;
}

export interface ConversionSummary {
  totalConversions: number;
  totalValue: number;
  byType: Record<string, { count: number; value: number }>;
  bySource: Record<string, { count: number; value: number }>;
  aiConversions: {
    total: number;
    byPlatform: Record<string, number>;
  };
}

/**
 * Map GA4 event names to conversion types
 */
function mapEventToConversionType(eventName: string): string {
  const eventLower = eventName.toLowerCase();

  if (eventLower.includes('form') || eventLower.includes('submit') || eventLower.includes('lead')) {
    return 'form_submission';
  }
  if (eventLower.includes('call') || eventLower.includes('phone') || eventLower.includes('click_to_call')) {
    return 'phone_call';
  }
  if (eventLower.includes('purchase') || eventLower.includes('transaction') || eventLower.includes('order')) {
    return 'purchase';
  }
  if (eventLower.includes('signup') || eventLower.includes('register')) {
    return 'signup';
  }
  if (eventLower.includes('download')) {
    return 'download';
  }
  if (eventLower.includes('contact')) {
    return 'contact';
  }
  if (eventLower.includes('book') || eventLower.includes('appointment') || eventLower.includes('schedule')) {
    return 'booking';
  }
  if (eventLower.includes('quote') || eventLower.includes('estimate')) {
    return 'quote_request';
  }
  if (eventLower.includes('chat')) {
    return 'chat_start';
  }

  return 'custom';
}

/**
 * Fetch conversion events from GA4
 */
export async function fetchGA4Conversions(
  propertyId: string,
  tokens: any,
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<GA4ConversionEvent[]> {
  const oauth2Client = getAuthenticatedClient(tokens);
  const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

  const propId = String(propertyId).startsWith('properties/')
    ? String(propertyId)
    : `properties/${String(propertyId)}`;

  // Fetch conversion events with source/medium breakdown
  const response: any = await analyticsData.properties.runReport({
    property: propId,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'eventName' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'landingPage' },
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'eventValue' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'isConversionEvent',
          stringFilter: {
            value: 'true',
          },
        },
      },
      limit: '1000',
    },
  });

  const events: GA4ConversionEvent[] = (response.data?.rows || []).map((row: any) => ({
    eventName: row.dimensionValues?.[0]?.value || '',
    source: row.dimensionValues?.[1]?.value || 'direct',
    medium: row.dimensionValues?.[2]?.value || 'none',
    landingPage: row.dimensionValues?.[3]?.value || '',
    eventCount: parseInt(row.metricValues?.[0]?.value || '0'),
    eventValue: parseFloat(row.metricValues?.[1]?.value || '0'),
  }));

  return events;
}

/**
 * Sync GA4 conversions to database
 */
export async function syncConversions(
  clientId: string,
  conversions: GA4ConversionEvent[],
  dateRange: { startDate: string; endDate: string }
): Promise<{ synced: number; skipped: number }> {
  const supabase = await createClient();

  let synced = 0;
  let skipped = 0;

  for (const conversion of conversions) {
    // Skip if no conversions
    if (conversion.eventCount === 0) {
      skipped++;
      continue;
    }

    // Detect if AI traffic
    const aiSource = detectAITrafficSource(conversion.source, conversion.medium);

    // Create conversion records (one per event count for granularity, or batch)
    const { error } = await supabase.from('conversions').insert({
      client_id: clientId,
      conversion_type: mapEventToConversionType(conversion.eventName),
      conversion_name: conversion.eventName,
      conversion_value: conversion.eventValue / conversion.eventCount, // Per-conversion value
      source: conversion.source,
      medium: conversion.medium,
      landing_page: conversion.landingPage,
      is_ai_traffic: !!aiSource,
      ai_source: aiSource,
      synced_from_ga4_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error syncing conversion:', error);
      skipped++;
    } else {
      synced++;
    }
  }

  return { synced, skipped };
}

/**
 * Get conversion summary for a client
 */
export async function getConversionSummary(
  clientId: string,
  days: number = 30
): Promise<ConversionSummary> {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: conversions } = await supabase
    .from('conversions')
    .select('*')
    .eq('client_id', clientId)
    .gte('converted_at', startDate.toISOString());

  const allConversions = conversions || [];

  // Calculate totals
  const totalConversions = allConversions.length;
  const totalValue = allConversions.reduce((sum, c) => sum + (c.conversion_value || 0), 0);

  // Group by type
  const byType: Record<string, { count: number; value: number }> = {};
  allConversions.forEach((c) => {
    const type = c.conversion_type;
    if (!byType[type]) {
      byType[type] = { count: 0, value: 0 };
    }
    byType[type].count++;
    byType[type].value += c.conversion_value || 0;
  });

  // Group by source
  const bySource: Record<string, { count: number; value: number }> = {};
  allConversions.forEach((c) => {
    const source = `${c.source}/${c.medium}`;
    if (!bySource[source]) {
      bySource[source] = { count: 0, value: 0 };
    }
    bySource[source].count++;
    bySource[source].value += c.conversion_value || 0;
  });

  // AI conversions
  const aiConversions = allConversions.filter((c) => c.is_ai_traffic);
  const byPlatform: Record<string, number> = {};
  aiConversions.forEach((c) => {
    const platform = c.ai_source || 'unknown';
    byPlatform[platform] = (byPlatform[platform] || 0) + 1;
  });

  return {
    totalConversions,
    totalValue,
    byType,
    bySource,
    aiConversions: {
      total: aiConversions.length,
      byPlatform,
    },
  };
}

/**
 * Get configured GA4 goals for a client
 */
export async function getConfiguredGoals(clientId: string) {
  const supabase = await createClient();

  const { data: goals } = await supabase
    .from('ga4_goals')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .order('goal_name');

  return goals || [];
}

/**
 * Configure a GA4 goal to track
 */
export async function configureGoal(
  clientId: string,
  eventName: string,
  goalName: string,
  goalType: string,
  defaultValue: number = 0
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ga4_goals')
    .upsert({
      client_id: clientId,
      event_name: eventName,
      goal_name: goalName,
      goal_type: goalType,
      has_value: defaultValue > 0,
      default_value: defaultValue,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
