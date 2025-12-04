/**
 * API Route: Deploy Files to Client Sites
 *
 * POST /api/deploy
 *
 * Deploys files (robots.txt, sitemap.xml, etc.) to client sites
 * via WordPress or FTP/SFTP connections.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deployRobotsTxt, deploySitemap, WordPressConnection } from '@/lib/integrations/wordpress';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, fileType, content } = body;

    if (!clientId || !fileType || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, fileType, content' },
        { status: 400 }
      );
    }

    // Validate file type
    const validFileTypes = ['robots', 'sitemap'];
    if (!validFileTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Must be "robots" or "sitemap"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check for WordPress connection first
    const { data: wpConnection } = await supabase
      .from('wordpress_connections')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'connected')
      .maybeSingle();

    if (wpConnection) {
      // Deploy via WordPress
      const connection: WordPressConnection = {
        id: wpConnection.id,
        client_id: wpConnection.client_id,
        site_url: wpConnection.site_url,
        site_name: wpConnection.site_name,
        wp_username: wpConnection.wp_username,
        wp_app_password: wpConnection.wp_app_password,
        status: wpConnection.status,
        can_upload_files: wpConnection.can_upload_files,
      };

      let result;
      if (fileType === 'robots') {
        result = await deployRobotsTxt(connection, content);
      } else {
        result = await deploySitemap(connection, content);
      }

      // Log deployment
      await supabase.from('deployment_history').insert({
        client_id: clientId,
        deployment_type: fileType === 'robots' ? 'robots_txt' : 'sitemap',
        file_path: fileType === 'robots' ? '/robots.txt' : '/sitemap.xml',
        file_content: content,
        connection_type: 'wordpress',
        connection_id: wpConnection.id,
        status: result.success ? 'deployed' : 'failed',
        error_message: result.error,
        deployed_at: result.success ? new Date().toISOString() : null,
        previous_content: result.previousContent,
      });

      return NextResponse.json(result);
    }

    // Check for Hosting/FTP connection
    const { data: hostingConnection } = await supabase
      .from('hosting_connections')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'connected')
      .maybeSingle();

    if (hostingConnection) {
      // For now, we'll return a message that FTP deployment is not yet implemented
      // In a real implementation, you'd use a library like basic-ftp or ssh2-sftp-client

      // Log the attempt
      await supabase.from('deployment_history').insert({
        client_id: clientId,
        deployment_type: fileType === 'robots' ? 'robots_txt' : 'sitemap',
        file_path: fileType === 'robots' ? '/robots.txt' : '/sitemap.xml',
        file_content: content,
        connection_type: 'hosting',
        connection_id: hostingConnection.id,
        status: 'pending',
        error_message: 'FTP/SFTP deployment requires server-side implementation',
      });

      return NextResponse.json({
        success: false,
        error: 'FTP/SFTP deployment is not yet implemented. Please use WordPress or deploy manually.',
        message: 'FTP deployment coming soon',
      });
    }

    // No connection found
    return NextResponse.json({
      success: false,
      error: 'No deployment connection configured. Please connect WordPress or Hosting in the Connections page.',
    });

  } catch (error) {
    console.error('Deploy API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Deployment failed',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check deployment status
export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing clientId parameter' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Get recent deployments
  const { data: deployments, error } = await supabase
    .from('deployment_history')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deployment history' },
      { status: 500 }
    );
  }

  // Check connection status
  const { data: wpConnection } = await supabase
    .from('wordpress_connections')
    .select('id, site_url, site_name, status')
    .eq('client_id', clientId)
    .maybeSingle();

  const { data: hostingConnection } = await supabase
    .from('hosting_connections')
    .select('id, host, connection_type, status')
    .eq('client_id', clientId)
    .maybeSingle();

  return NextResponse.json({
    deployments,
    connections: {
      wordpress: wpConnection ? {
        connected: wpConnection.status === 'connected',
        siteName: wpConnection.site_name,
        siteUrl: wpConnection.site_url,
      } : null,
      hosting: hostingConnection ? {
        connected: hostingConnection.status === 'connected',
        type: hostingConnection.connection_type,
        host: hostingConnection.host,
      } : null,
    },
    canDeploy: !!(wpConnection?.status === 'connected' || hostingConnection?.status === 'connected'),
  });
}
