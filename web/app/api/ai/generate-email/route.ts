import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai/anthropic-client';
import { generateEmailOutreachPrompt, EmailOutreachParams } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      recipientName,
      recipientWebsite,
      yourName,
      yourWebsite,
      yourBusiness,
      linkTarget,
      tone = 'professional',
      approach = 'guest_post',
    } = body;

    // Validate required fields
    if (!recipientWebsite || !yourWebsite || !linkTarget) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build prompt parameters
    const params: EmailOutreachParams = {
      recipientName,
      recipientWebsite,
      yourName: yourName || 'Your Name',
      yourWebsite,
      yourBusiness,
      linkTarget,
      tone,
      approach,
    };

    // Generate prompt
    const prompt = generateEmailOutreachPrompt(params);

    // Call AI
    const content = await generateAIResponse(
      [{ role: 'user', content: prompt }],
      {
        model: 'content', // Use Sonnet for quality
        maxTokens: 1000, // Emails are short
        temperature: 0.8, // Slightly more creative for personalization
      }
    );

    // TODO: Save to database
    // await saveGeneratedContent({
    //   clientId,
    //   contentType: 'outreach_email',
    //   prompt,
    //   content,
    //   metadata: { recipientWebsite, approach, tone },
    // });

    return NextResponse.json({
      success: true,
      content,
      metadata: {
        approach,
        tone,
        recipientWebsite,
      },
    });
  } catch (error: any) {
    console.error('Email generation error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate email',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
