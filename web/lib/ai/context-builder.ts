/**
 * Context Builder
 * Builds context for AI based on client data, current page, etc.
 */

export interface ClientContext {
  clientId: string;
  clientName: string;
  domain: string;
  service: string;
  location: string;
  keywords?: Array<{
    keyword: string;
    volume: number;
    difficulty: number;
    intent: string;
  }>;
  metrics?: {
    traffic: number;
    sessions: number;
    keywords_tracked: number;
    backlinks: number;
  };
}

export interface AIContext {
  client?: ClientContext;
  page?: string;
  task?: string;
  userMessage?: string;
}

/**
 * Build system prompt with client context
 */
export function buildSystemPrompt(context: AIContext): string {
  let prompt = `You are CAIT (Core AI Tool), an expert SEO assistant helping users optimize their websites for search engines and AI platforms (Google, ChatGPT, Perplexity, etc.).

Your role is to:
- Provide actionable SEO advice
- Help users understand complex SEO concepts in simple terms
- Guide them through technical setup processes step-by-step
- Generate high-quality content optimized for their target keywords
- Explain what actions will drive specific results

Communication style:
- Be concise and actionable
- Use simple language, avoid jargon
- Be encouraging and supportive
- Focus on results and ROI
`;

  // Add client-specific context
  if (context.client) {
    prompt += `\n\nCurrent Client Context:
- Business: ${context.client.clientName}
- Website: ${context.client.domain}
- Service: ${context.client.service}
- Location: ${context.client.location}
`;

    if (context.client.keywords && context.client.keywords.length > 0) {
      const topKeywords = context.client.keywords.slice(0, 10);
      prompt += `\nTop Keywords:
${topKeywords.map(k => `- ${k.keyword} (${k.volume} searches/mo, difficulty: ${k.difficulty}, intent: ${k.intent})`).join('\n')}
`;
    }

    if (context.client.metrics) {
      prompt += `\nCurrent Performance:
- Monthly Traffic: ${context.client.metrics.traffic.toLocaleString()} visitors
- Sessions: ${context.client.metrics.sessions.toLocaleString()}
- Keywords Tracked: ${context.client.metrics.keywords_tracked}
- Backlinks: ${context.client.metrics.backlinks}
`;
    }
  }

  // Add page/task context
  if (context.page) {
    prompt += `\n\nCurrent Page: ${context.page}`;
  }

  if (context.task) {
    prompt += `\n\nCurrent Task: ${context.task}`;
  }

  return prompt;
}

/**
 * Build context from Supabase client data
 */
export function buildClientContext(clientData: any, keywords?: any[], metrics?: any): ClientContext {
  return {
    clientId: clientData.id,
    clientName: clientData.name,
    domain: clientData.domain,
    service: clientData.focus_service || 'their business',
    location: clientData.primary_location || 'their area',
    keywords: keywords?.map(k => ({
      keyword: k.keyword,
      volume: k.search_volume,
      difficulty: k.difficulty,
      intent: k.intent,
    })),
    metrics: metrics ? {
      traffic: metrics.traffic || 0,
      sessions: metrics.sessions || 0,
      keywords_tracked: keywords?.length || 0,
      backlinks: metrics.backlinks || 0,
    } : undefined,
  };
}

/**
 * Get context-aware greeting message
 */
export function getGreetingMessage(context: AIContext): string {
  if (context.client) {
    return `Hi! I'm CAIT, your AI SEO assistant. I'm here to help you optimize ${context.client.clientName}. What would you like to work on today?`;
  }

  return `Hi! I'm CAIT, your AI SEO assistant. How can I help you today?`;
}

/**
 * Get suggested prompts based on context
 */
export function getSuggestedPrompts(context: AIContext): string[] {
  const suggestions: string[] = [];

  if (context.client) {
    suggestions.push(
      `What are the best keywords to target for ${context.client.service} in ${context.client.location}?`,
      `How can I improve my website's rankings?`,
      `Generate a blog post about my top keyword`
    );

    if (context.client.keywords && context.client.keywords.length > 0) {
      const topKeyword = context.client.keywords[0];
      suggestions.push(
        `How do I rank for "${topKeyword.keyword}"?`
      );
    }
  }

  // Page-specific suggestions
  if (context.page === 'setup') {
    suggestions.push(
      `Help me connect Google Analytics`,
      `Walk me through setting up Search Console`,
      `How do I add my Anthropic API key?`
    );
  }

  if (context.page === 'content') {
    suggestions.push(
      `Generate a blog post for my top keyword`,
      `Write an outreach email for backlinks`,
      `Create optimized meta descriptions`
    );
  }

  return suggestions.slice(0, 4); // Return max 4 suggestions
}
