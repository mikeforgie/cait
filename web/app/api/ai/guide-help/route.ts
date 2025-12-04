/**
 * AI Guide Help API Route
 * POST endpoint that provides AI-generated help for guide steps
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai/anthropic-client';

interface GuideHelpRequest {
  guideId: string;
  stepIndex: number;
  helpPrompt: string;
  stepTitle: string;
  stepInstruction: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GuideHelpRequest = await request.json();

    // Validate required fields
    if (!body.helpPrompt || !body.stepTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: helpPrompt and stepTitle' },
        { status: 400 }
      );
    }

    // Build the system prompt for contextual help
    const systemPrompt = `You are a helpful AI assistant guiding users through setup tasks in CAIT (Core AI Tool), an SEO automation platform.

Your role is to provide clear, step-by-step guidance that is:
- Concise but thorough
- Friendly and encouraging
- Technical but accessible
- Action-oriented

Current Context:
- Guide Step: ${body.stepTitle}
- Instruction: ${body.stepInstruction}

Format your response as clear, numbered steps when appropriate. Use simple language and avoid jargon unless necessary.`;

    // Generate the AI response
    const help = await generateAIResponse(
      [
        {
          role: 'user',
          content: body.helpPrompt,
        },
      ],
      {
        model: 'chat',
        systemPrompt,
        maxTokens: 1024,
        temperature: 0.7,
      }
    );

    return NextResponse.json({ help });
  } catch (error) {
    console.error('Guide help error:', error);

    // Check if it's an API key error
    if (error instanceof Error && error.message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        {
          error: 'AI features are not configured. Please add your Anthropic API key.',
          code: 'NO_API_KEY',
        },
        { status: 503 }
      );
    }

    // Check for rate limiting
    if (error instanceof Error && error.message.includes('rate')) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait a moment and try again.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to get AI help. Please try again.',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}
