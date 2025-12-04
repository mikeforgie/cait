/**
 * API Route: WordPress Connection Management
 *
 * POST /api/connections/wordpress - Test and save WordPress connection
 * GET /api/connections/wordpress?clientId=xxx - Get WordPress connection for client
 * DELETE /api/connections/wordpress?clientId=xxx - Remove WordPress connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { testWordPressConnection } from '@/lib/integrations/wordpress';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, siteUrl, username, appPassword } = body;

    if (!clientId || !siteUrl || !username || !appPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, siteUrl, username, appPassword' },
        { status: 400 }
      );
    }

    // Test the connection first
    const testResult = await testWordPressConnection(siteUrl, username, appPassword);

    if (!testResult.success) {
      return NextResponse.json({
        success: false,
        error: testResult.error,
      });
    }

    // Connection successful - save to database
    const supabase = await createClient();

    // Upsert the connection (update if exists, insert if not)
    const { data, error } = await supabase
      .from('wordpress_connections')
      .upsert({
        client_id: clientId,
        site_url: siteUrl,
        site_name: testResult.siteInfo?.name,
        wp_username: username,
        wp_app_password: appPassword, // TODO: Encrypt this in production
        status: 'connected',
        can_upload_files: testResult.capabilities?.canUploadMedia || false,
        can_edit_posts: testResult.capabilities?.canEditPosts || false,
        wordpress_version: testResult.siteInfo?.version,
        last_verified_at: new Date().toISOString(),
      }, {
        onConflict: 'client_id,site_url',
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to save connection to database',
      });
    }

    return NextResponse.json({
      success: true,
      connection: data,
      siteInfo: testResult.siteInfo,
      capabilities: testResult.capabilities,
    });

  } catch (error) {
    console.error('WordPress connection API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId parameter' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('wordpress_connections')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch WordPress connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connection: data,
      hasConnection: !!data,
    });

  } catch (error) {
    console.error('WordPress connection GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId parameter' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('wordpress_connections')
      .delete()
      .eq('client_id', clientId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete WordPress connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('WordPress connection DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
