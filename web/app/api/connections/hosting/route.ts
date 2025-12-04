/**
 * API Route: Hosting/FTP Connection Management
 *
 * POST /api/connections/hosting - Test and save hosting connection
 * GET /api/connections/hosting?clientId=xxx - Get hosting connection for client
 * DELETE /api/connections/hosting?clientId=xxx - Remove hosting connection
 *
 * Note: Actual FTP/SFTP testing would require a server-side FTP library.
 * For now, we validate the input and store it - actual file operations
 * would be handled by a separate deployment service.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, connectionType, host, port, username, password, rootPath } = body;

    if (!clientId || !connectionType || !host || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate connection type
    const validTypes = ['ftp', 'sftp', 'cpanel', 'ssh'];
    if (!validTypes.includes(connectionType)) {
      return NextResponse.json(
        { error: 'Invalid connection type' },
        { status: 400 }
      );
    }

    // For now, we'll save the connection without testing
    // In production, you'd want to actually test the FTP/SFTP connection
    // using a library like basic-ftp or ssh2-sftp-client

    const supabase = await createClient();

    // Upsert the connection
    const { data, error } = await supabase
      .from('hosting_connections')
      .upsert({
        client_id: clientId,
        connection_type: connectionType,
        host,
        port: port || (connectionType === 'sftp' ? 22 : connectionType === 'cpanel' ? 2083 : 21),
        username,
        password, // TODO: Encrypt this in production
        root_path: rootPath || '/public_html',
        status: 'pending', // Set to pending until we verify
        last_verified_at: null,
      }, {
        onConflict: 'client_id,host,connection_type',
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

    // In a real implementation, you would test the connection here
    // For now, we'll mark it as needing verification
    return NextResponse.json({
      success: true,
      connection: {
        ...data,
        password: undefined, // Don't return password
      },
      message: 'Connection saved. Will be verified on first deployment.',
    });

  } catch (error) {
    console.error('Hosting connection API error:', error);
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
      .from('hosting_connections')
      .select('id, client_id, connection_type, host, port, username, root_path, status, last_verified_at, created_at')
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch hosting connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connection: data,
      hasConnection: !!data,
    });

  } catch (error) {
    console.error('Hosting connection GET error:', error);
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
      .from('hosting_connections')
      .delete()
      .eq('client_id', clientId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete hosting connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Hosting connection DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
