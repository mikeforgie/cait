import { NextRequest, NextResponse } from 'next/server';
import { deleteGeneratedContent, getGeneratedContent } from '@/lib/ai/content-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const content = await getGeneratedContent(contentId);

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, content });
  } catch (error: any) {
    console.error('Get content error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get content' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const success = await deleteGeneratedContent(contentId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete content' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete content error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete content' },
      { status: 500 }
    );
  }
}
