/**
 * Business Knowledge Context
 * Gathers contextual information about a client's business for AI generation
 */

import { createClient } from '@/lib/supabase/server';

export interface BusinessKnowledgeContext {
  businessName: string;
  industry: string;
  services: string[];
  targetAudience: string;
  brandVoice: string;
  competitorKeywords: string[];
  topPerformingPages: string[];
  uniqueSellingPoints: string[];
  location?: string;
  additionalContext?: string;
}

// Alias for backward compatibility
export type BusinessContext = BusinessKnowledgeContext;

/**
 * Get business knowledge context for a client
 * Used to provide context to AI generators for better, more relevant suggestions
 */
export async function getBusinessKnowledgeContext(
  clientId: string
): Promise<BusinessKnowledgeContext> {
  const supabase = await createClient();

  // Get client data
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (!client) {
    throw new Error('Client not found');
  }

  // Get client settings for additional context
  const { data: settings } = await supabase
    .from('client_settings')
    .select('*')
    .eq('client_id', clientId)
    .single();

  // Get top performing pages from traffic results
  const { data: topPages } = await supabase
    .from('traffic_results')
    .select('page_path, sessions')
    .eq('client_id', clientId)
    .order('sessions', { ascending: false })
    .limit(10);

  // Get tracked keywords for context
  const { data: keywords } = await supabase
    .from('tracked_keywords')
    .select('keyword, priority')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .order('priority', { ascending: true })
    .limit(20);

  // Build context from available data
  const context: BusinessKnowledgeContext = {
    businessName: client.name || 'Business',
    industry: client.industry || settings?.industry || 'General',
    services: extractServices(client, settings),
    targetAudience: settings?.target_audience || 'general audience',
    brandVoice: settings?.brand_voice || 'professional and informative',
    competitorKeywords: keywords?.map((k) => k.keyword) || [],
    topPerformingPages: topPages?.map((p) => p.page_path) || [],
    uniqueSellingPoints: settings?.unique_selling_points || [],
    location: client.location || settings?.primary_location,
    additionalContext: settings?.ai_context_notes,
  };

  return context;
}

/**
 * Extract services from client data
 */
function extractServices(client: any, settings: any): string[] {
  const services: string[] = [];

  if (settings?.services) {
    if (Array.isArray(settings.services)) {
      services.push(...settings.services);
    } else if (typeof settings.services === 'string') {
      services.push(...settings.services.split(',').map((s: string) => s.trim()));
    }
  }

  if (client.services) {
    if (Array.isArray(client.services)) {
      services.push(...client.services);
    } else if (typeof client.services === 'string') {
      services.push(...client.services.split(',').map((s: string) => s.trim()));
    }
  }

  // Deduplicate
  return [...new Set(services)];
}

/**
 * Format context for AI prompt
 */
export function formatContextForPrompt(context: BusinessKnowledgeContext): string {
  const parts: string[] = [
    `Business: ${context.businessName}`,
    `Industry: ${context.industry}`,
  ];

  if (context.services.length > 0) {
    parts.push(`Services: ${context.services.join(', ')}`);
  }

  if (context.targetAudience) {
    parts.push(`Target Audience: ${context.targetAudience}`);
  }

  if (context.brandVoice) {
    parts.push(`Brand Voice: ${context.brandVoice}`);
  }

  if (context.location) {
    parts.push(`Location: ${context.location}`);
  }

  if (context.uniqueSellingPoints.length > 0) {
    parts.push(`Key Differentiators: ${context.uniqueSellingPoints.join(', ')}`);
  }

  if (context.additionalContext) {
    parts.push(`Additional Context: ${context.additionalContext}`);
  }

  return parts.join('\n');
}
