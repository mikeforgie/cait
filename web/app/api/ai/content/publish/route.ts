import { NextRequest, NextResponse } from 'next/server';
import { markContentAsPublished } from '@/lib/ai/content-storage';

/**
 * Mark AI-generated content as published/sent and log as SEO action
 * POST /api/ai/content/publish
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      contentId,
      clientId,
      usageLocation, // 'wordpress', 'manual_copy', 'email_sent', etc.
      publishedUrl, // Optional: URL where content was published
    } = body;

    // Validate required fields
    if (!contentId || !clientId || !usageLocation) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, clientId, usageLocation' },
        { status: 400 }
      );
    }

    // Mark content as published and log SEO action
    const updatedContent = await markContentAsPublished({
      contentId,
      clientId,
      usageLocation,
      publishedUrl,
    });

    if (!updatedContent) {
      return NextResponse.json(
        { error: 'Failed to mark content as published' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content: updatedContent,
      message: 'Content marked as published and SEO action logged for attribution tracking',
    });
  } catch (error: any) {
    console.error('Publish content error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to mark content as published',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
