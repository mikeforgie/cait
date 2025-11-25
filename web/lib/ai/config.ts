/**
 * AI Configuration
 * Defines AI models, usage limits, and feature flags
 */

export const AI_MODELS = {
  chat: 'claude-3-5-haiku-20241022',      // Fast, cheap for conversations
  content: 'claude-3-5-sonnet-20241022',  // Quality for content generation
} as const;

export const AI_USAGE_LIMITS = {
  free: 10,           // 10 AI actions per month
  starter: 100,       // 100 AI actions per month
  professional: 500,  // 500 AI actions per month
  enterprise: -1,     // Unlimited
} as const;

export const AI_FEATURES = {
  chat: true,
  contentGeneration: true,
  guidedSetup: true,
  smartInputs: true,
} as const;

// Cost tracking (for internal monitoring)
export const AI_COSTS = {
  haiku_input: 0.25,   // per 1M tokens
  haiku_output: 1.25,  // per 1M tokens
  sonnet_input: 3.0,   // per 1M tokens
  sonnet_output: 15.0, // per 1M tokens
} as const;

export type PlanTier = keyof typeof AI_USAGE_LIMITS;
export type AIModel = keyof typeof AI_MODELS;
