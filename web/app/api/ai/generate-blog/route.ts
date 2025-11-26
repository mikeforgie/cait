import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai/anthropic-client';
import { generateBlogPostPrompt, BlogPostParams } from '@/lib/ai/prompts';
import { saveGeneratedContent } from '@/lib/ai/content-storage';
import { trackAIUsage, checkUsageLimit } from '@/lib/ai/usage-tracking';
import { calculateBlogPostCredits } from '@/lib/ai/credits';

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
    if (!keyword || !businessName || !clientId) {
      return NextResponse.json(
        { error: 'Missing required fields: keyword, businessName, and clientId' },
        { status: 400 }
      );
    }

    // Calculate credits needed for this generation
    const creditsNeeded = calculateBlogPostCredits(wordCount);

    // Check usage limits
    const { allowed, usage } = await checkUsageLimit(clientId);
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Monthly credit limit reached',
          usage,
          message: `You've used ${usage.current_month_usage} of ${usage.monthly_limit} credits this month. Upgrade your plan or add your own API key for unlimited usage.`,
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Check if user has enough credits for this specific generation
    if (usage.remaining < creditsNeeded) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          usage,
          creditsNeeded,
          message: `This blog post requires ${creditsNeeded} credits, but you only have ${usage.remaining} remaining. Try a shorter word count or upgrade your plan.`,
        },
        { status: 429 }
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

    // Extract title from content (first H1)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : `Blog Post: ${keyword}`;

    // Save to database
    const savedContent = await saveGeneratedContent({
      clientId,
      contentType: 'blog_post',
      title,
      content,
      prompt,
      modelUsed: 'claude-3-5-sonnet-20241022',
      metadata: { keyword, wordCount, tone, includeIntro, includeConclusion, includeCTA },
    });

    // Track usage with calculated credits
    const { credits: actualCreditsUsed } = await trackAIUsage({
      clientId,
      actionType: 'blog_generation',
      modelType: 'content',
      inputText: prompt,
      outputText: content,
      context: { keyword, wordCount, tone },
      credits: creditsNeeded,
    });

    // Note: SEO action will be logged when content is actually published
    // Use the markContentAsPublished() function to log the attribution action

    return NextResponse.json({
      success: true,
      content,
      contentId: savedContent?.id,
      metadata: {
        keyword,
        wordCount: content.split(/\s+/).length,
        tone,
        title,
      },
      credits: {
        used: actualCreditsUsed,
        total_used: usage.current_month_usage + actualCreditsUsed,
        limit: usage.monthly_limit,
        remaining: usage.remaining - actualCreditsUsed,
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
