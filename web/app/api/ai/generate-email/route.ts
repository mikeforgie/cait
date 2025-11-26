import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai/anthropic-client';
import { generateEmailOutreachPrompt, EmailOutreachParams } from '@/lib/ai/prompts';
import { saveGeneratedContent } from '@/lib/ai/content-storage';
import { trackAIUsage, checkUsageLimit } from '@/lib/ai/usage-tracking';
import { CREDIT_COSTS } from '@/lib/ai/credits';
import { getBusinessKnowledgeContext, buildContextPrompt } from '@/lib/intelligence/knowledge-context';

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
    if (!clientId || !recipientWebsite || !yourWebsite || !linkTarget) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate credits needed
    const creditsNeeded = CREDIT_COSTS.outreach_email;

    // Check usage limits
    const { allowed, usage } = await checkUsageLimit(clientId);
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Monthly credit limit reached',
          usage,
          message: `You've used ${usage.current_month_usage} of ${usage.monthly_limit} credits this month.`,
        },
        { status: 429 }
      );
    }

    // Check if user has enough credits
    if (usage.remaining < creditsNeeded) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          usage,
          creditsNeeded,
          message: `This email requires ${creditsNeeded} credits, but you only have ${usage.remaining} remaining.`,
        },
        { status: 429 }
      );
    }

    // Get business knowledge context
    const businessContext = await getBusinessKnowledgeContext(clientId);
    const contextPrompt = buildContextPrompt(businessContext);

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
    const basePrompt = generateEmailOutreachPrompt(params);

    // Inject business context into prompt
    const enhancedPrompt = contextPrompt
      ? `${contextPrompt}\n\n---\n\n${basePrompt}`
      : basePrompt;

    // Call AI
    const content = await generateAIResponse(
      [{ role: 'user', content: enhancedPrompt }],
      {
        model: 'content', // Use Sonnet for quality
        maxTokens: 1000, // Emails are short
        temperature: 0.8, // Slightly more creative for personalization
      }
    );

    // Extract subject line
    const lines = content.split('\n');
    const subjectLineMatch = lines[0].match(/Subject:\s*(.+)/i);
    const title = subjectLineMatch
      ? `Outreach: ${subjectLineMatch[1].substring(0, 50)}`
      : `Outreach to ${recipientWebsite}`;

    // Save to database
    const savedContent = await saveGeneratedContent({
      clientId,
      contentType: 'outreach_email',
      title,
      content,
      prompt: enhancedPrompt,
      modelUsed: 'claude-3-5-sonnet-20241022',
      metadata: { recipientWebsite, recipientName, approach, tone, linkTarget },
    });

    // Track usage with credits
    const { credits: actualCreditsUsed } = await trackAIUsage({
      clientId,
      actionType: 'email_generation',
      modelType: 'content',
      inputText: enhancedPrompt,
      outputText: content,
      context: { recipientWebsite, approach, tone },
      credits: creditsNeeded,
    });

    // Note: SEO action will be logged when email is actually sent
    // Use the markContentAsPublished() function to log the attribution action

    return NextResponse.json({
      success: true,
      content,
      contentId: savedContent?.id,
      metadata: {
        approach,
        tone,
        recipientWebsite,
      },
      credits: {
        used: actualCreditsUsed,
        total_used: usage.current_month_usage + actualCreditsUsed,
        limit: usage.monthly_limit,
        remaining: usage.remaining - actualCreditsUsed,
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
