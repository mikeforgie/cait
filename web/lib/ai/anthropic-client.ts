/**
 * Anthropic Client
 * Wrapper for Claude API with streaming support
 */

import Anthropic from '@anthropic-ai/sdk';
import { AI_MODELS } from './config';

export type AIModelType = 'chat' | 'content';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  model?: AIModelType;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  stream?: boolean;
}

/**
 * Get Anthropic client instance
 */
export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
  }

  return new Anthropic({
    apiKey,
  });
}

/**
 * Generate AI response
 */
export async function generateAIResponse(
  messages: AIMessage[],
  options: GenerateOptions = {}
): Promise<string> {
  const anthropic = getAnthropicClient();

  const modelType = options.model || 'chat';
  const model = AI_MODELS[modelType];

  const response = await anthropic.messages.create({
    model,
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature || 0.7,
    system: options.systemPrompt || 'You are a helpful SEO assistant.',
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  });

  const textContent = response.content.find(c => c.type === 'text');
  return textContent && textContent.type === 'text' ? textContent.text : '';
}

/**
 * Generate streaming AI response
 */
export async function* generateAIResponseStream(
  messages: AIMessage[],
  options: GenerateOptions = {}
): AsyncGenerator<string> {
  const anthropic = getAnthropicClient();

  const modelType = options.model || 'chat';
  const model = AI_MODELS[modelType];

  const stream = await anthropic.messages.create({
    model,
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature || 0.7,
    system: options.systemPrompt || 'You are a helpful SEO assistant.',
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    stream: true,
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      yield chunk.delta.text;
    }
  }
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Estimate cost for a generation
 */
export function estimateCost(inputTokens: number, outputTokens: number, modelType: AIModelType): number {
  const costs = {
    chat: {
      input: 0.25 / 1_000_000,  // $0.25 per 1M tokens
      output: 1.25 / 1_000_000, // $1.25 per 1M tokens
    },
    content: {
      input: 3.0 / 1_000_000,   // $3 per 1M tokens
      output: 15.0 / 1_000_000, // $15 per 1M tokens
    },
  };

  const modelCosts = costs[modelType];
  return (inputTokens * modelCosts.input) + (outputTokens * modelCosts.output);
}
