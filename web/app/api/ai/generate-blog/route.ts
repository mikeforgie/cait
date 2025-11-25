import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai/anthropic-client';
import { generateBlogPostPrompt, BlogPostParams } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      keyword,
      businessName,
      service,
      location,
      wordCount = 1500,
      tone = 'professional',
      includeIntro = true,
      includeConclusion = true,
      includeCTA = true,
    } = body;

    // Validate required fields
    if (!keyword || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields: keyword and businessName' },
        { status: 400 }
      );
    }

    // Build prompt parameters
    const params: BlogPostParams = {
      keyword,
      businessName,
      service: service || 'their business',
      location: location || 'their area',
      wordCount,
      tone,
      includeIntro,
      includeConclusion,
      includeCTA,
    };

    // Generate prompt
    const prompt = generateBlogPostPrompt(params);

    // Call AI
    const content = await generateAIResponse(
      [{ role: 'user', content: prompt }],
      {
        model: 'content', // Use Sonnet for quality
        maxTokens: Math.ceil(wordCount * 1.5), // Estimate tokens needed
        temperature: 0.7,
      }
    );

    // TODO: Save to database
    // await saveGeneratedContent({
    //   clientId,
    //   contentType: 'blog_post',
    //   prompt,
    //   content,
    //   metadata: { keyword, wordCount, tone },
    // });

    // TODO: Track usage
    // await trackAIUsage(clientId, 'blog_generation', estimateTokens(prompt + content));

    return NextResponse.json({
      success: true,
      content,
      metadata: {
        keyword,
        wordCount: content.split(/\s+/).length,
        tone,
      },
    });
  } catch (error: any) {
    console.error('Blog generation error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate blog post',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
