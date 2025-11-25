import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai/anthropic-client';
import { generateBlogOutlinePrompt } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, businessContext } = body;

    // Validate required fields
    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing required field: keyword' },
        { status: 400 }
      );
    }

    // Generate prompt
    const prompt = generateBlogOutlinePrompt(
      keyword,
      businessContext || 'General business'
    );

    // Call AI (use Haiku for speed since outlines are quick)
    const outline = await generateAIResponse(
      [{ role: 'user', content: prompt }],
      {
        model: 'chat', // Use Haiku for fast response
        maxTokens: 1500,
        temperature: 0.7,
      }
    );

    return NextResponse.json({
      success: true,
      outline,
      keyword,
    });
  } catch (error: any) {
    console.error('Outline generation error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate outline',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
