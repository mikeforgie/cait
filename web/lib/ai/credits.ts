/**
 * AI Credits System
 * Fair usage tracking based on actual token consumption
 */

import { estimateTokens } from './anthropic-client';

/**
 * Credit pricing by action type
 * Credits are based on estimated token usage
 */
export const CREDIT_COSTS = {
  // Content Generation (variable by size)
  blog_post_1000: 5,   // ~50K tokens
  blog_post_1500: 8,   // ~75K tokens
  blog_post_2000: 10,  // ~100K tokens
  blog_post_2500: 13,  // ~125K tokens
  blog_post_3000: 15,  // ~150K tokens

  outreach_email: 2,   // ~10K tokens
  meta_description: 1, // ~5K tokens
  social_post: 1,      // ~5K tokens

  // Helpers & Chat
  content_outline: 1,  // ~5K tokens
  chat_message: 1,     // ~5K tokens
  guide_help: 1,       // ~5K tokens

  // Future features
  page_analysis: 3,    // ~15K tokens
  competitor_analysis: 5, // ~25K tokens
  seo_recommendations: 3, // ~15K tokens
} as const;

/**
 * Monthly credit limits by plan
 */
export const PLAN_CREDIT_LIMITS = {
  free: 50,           // ~10 blog posts or 25 emails
  starter: 200,       // ~25 blog posts or 100 emails
  professional: 500,  // ~60 blog posts or 250 emails
  enterprise: -1,     // Unlimited
} as const;

/**
 * Calculate credits for blog post based on word count
 */
export function calculateBlogPostCredits(wordCount: number): number {
  if (wordCount <= 1000) return CREDIT_COSTS.blog_post_1000;
  if (wordCount <= 1500) return CREDIT_COSTS.blog_post_1500;
  if (wordCount <= 2000) return CREDIT_COSTS.blog_post_2000;
  if (wordCount <= 2500) return CREDIT_COSTS.blog_post_2500;
  return CREDIT_COSTS.blog_post_3000;
}

/**
 * Calculate credits based on action type and parameters
 */
export function calculateCredits(params: {
  actionType: string;
  wordCount?: number;
  estimatedTokens?: number;
}): number {
  const { actionType, wordCount, estimatedTokens } = params;

  // Blog posts - calculate by word count
  if (actionType === 'blog_generation' && wordCount) {
    return calculateBlogPostCredits(wordCount);
  }

  // Emails
  if (actionType === 'email_generation') {
    return CREDIT_COSTS.outreach_email;
  }

  // Outlines
  if (actionType === 'outline_generation') {
    return CREDIT_COSTS.content_outline;
  }

  // Chat messages
  if (actionType === 'chat_message' || actionType === 'guide_help') {
    return CREDIT_COSTS.chat_message;
  }

  // Meta descriptions
  if (actionType === 'meta_generation') {
    return CREDIT_COSTS.meta_description;
  }

  // If we have estimated tokens, calculate proportionally
  if (estimatedTokens) {
    // 1 credit ≈ 5,000 tokens
    return Math.ceil(estimatedTokens / 5000);
  }

  // Default fallback
  return 1;
}

/**
 * Get credit cost breakdown for display
 */
export function getCreditCostBreakdown(actionType: string, params?: any) {
  let credits = 0;
  let description = '';
  let examples: string[] = [];

  switch (actionType) {
    case 'blog_generation':
      const wordCount = params?.wordCount || 1500;
      credits = calculateBlogPostCredits(wordCount);
      description = `Blog post (${wordCount} words)`;
      examples = [
        '1000 words = 5 credits',
        '1500 words = 8 credits',
        '2000 words = 10 credits',
        '2500 words = 13 credits',
      ];
      break;

    case 'email_generation':
      credits = CREDIT_COSTS.outreach_email;
      description = 'Outreach email';
      examples = ['One email = 2 credits'];
      break;

    case 'outline_generation':
      credits = CREDIT_COSTS.content_outline;
      description = 'Content outline';
      examples = ['One outline = 1 credit'];
      break;

    case 'chat_message':
      credits = CREDIT_COSTS.chat_message;
      description = 'Chat message';
      examples = ['One message = 1 credit'];
      break;

    default:
      credits = 1;
      description = 'AI action';
      examples = [];
  }

  return { credits, description, examples };
}

/**
 * Format credits for display
 */
export function formatCredits(credits: number): string {
  return `${credits} credit${credits === 1 ? '' : 's'}`;
}

/**
 * Get what user can generate with remaining credits
 */
export function getGenerationCapacity(remainingCredits: number) {
  return {
    blog_posts_1500: Math.floor(remainingCredits / CREDIT_COSTS.blog_post_1500),
    blog_posts_2500: Math.floor(remainingCredits / CREDIT_COSTS.blog_post_2500),
    emails: Math.floor(remainingCredits / CREDIT_COSTS.outreach_email),
    outlines: Math.floor(remainingCredits / CREDIT_COSTS.content_outline),
    chat_messages: Math.floor(remainingCredits / CREDIT_COSTS.chat_message),
  };
}

/**
 * Estimate credits from actual token usage (for accuracy)
 */
export function creditsFromTokens(inputTokens: number, outputTokens: number): number {
  const totalTokens = inputTokens + outputTokens;
  // 1 credit ≈ 5,000 tokens
  return Math.ceil(totalTokens / 5000);
}
