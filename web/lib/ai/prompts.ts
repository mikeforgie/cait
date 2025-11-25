/**
 * AI Prompt Templates
 * Reusable prompts for content generation
 */

export interface BlogPostParams {
  keyword: string;
  businessName: string;
  service: string;
  location: string;
  wordCount: number;
  tone: 'professional' | 'casual' | 'authoritative' | 'friendly';
  includeIntro: boolean;
  includeConclusion: boolean;
  includeCTA: boolean;
}

export interface EmailOutreachParams {
  recipientName?: string;
  recipientWebsite: string;
  yourName: string;
  yourWebsite: string;
  yourBusiness: string;
  linkTarget: string; // The page you want backlink to
  tone: 'professional' | 'casual' | 'friendly';
  approach: 'guest_post' | 'resource_link' | 'broken_link' | 'collaboration';
}

export interface MetaDescriptionParams {
  pageUrl: string;
  pageTitle: string;
  targetKeyword: string;
  businessName: string;
  maxLength: number; // Usually 155-160 characters
}

/**
 * Generate blog post prompt
 */
export function generateBlogPostPrompt(params: BlogPostParams): string {
  return `You are an expert SEO content writer. Create a comprehensive, engaging blog post optimized for search engines and readers.

TARGET KEYWORD: "${params.keyword}"
BUSINESS: ${params.businessName} (${params.service})
LOCATION: ${params.location}
WORD COUNT: ~${params.wordCount} words
TONE: ${params.tone}

REQUIREMENTS:
1. Naturally incorporate the target keyword "${params.keyword}" throughout (aim for 1-2% density)
2. Use the keyword in:
   - Title (H1)
   - First paragraph
   - At least one H2 heading
   - Meta description (you'll write this separately)
3. Structure with clear H2 and H3 headings (use proper markdown: ## for H2, ### for H3)
4. Include relevant internal linking opportunities (mark as [INTERNAL LINK: /page-name])
5. Write in ${params.tone} tone
6. Focus on providing genuine value to readers
7. Include data, examples, or actionable tips where relevant
8. Optimize for featured snippets (use lists, tables, or clear definitions)
${params.includeIntro ? '9. Start with a compelling introduction that hooks the reader' : ''}
${params.includeConclusion ? '10. End with a strong conclusion that summarizes key points' : ''}
${params.includeCTA ? '11. Include a clear call-to-action at the end (e.g., contact, schedule consultation, etc.)' : ''}

FORMAT:
- Use markdown formatting
- Start with the H1 title
- Use ## for H2 headings, ### for H3 headings
- Use bullet points and numbered lists where appropriate
- Bold important terms with **text**
- Keep paragraphs concise (2-4 sentences)

AVOID:
- Keyword stuffing
- Generic fluff content
- Overly promotional language
- Duplicate or thin content

Write the complete blog post now:`;
}

/**
 * Generate email outreach prompt
 */
export function generateEmailOutreachPrompt(params: EmailOutreachParams): string {
  const approachContext = {
    guest_post: 'offering to write a high-quality guest post for their site',
    resource_link: 'suggesting your content as a valuable resource to add to their page',
    broken_link: 'notifying them of a broken link and offering your content as a replacement',
    collaboration: 'proposing a content collaboration or partnership',
  };

  return `You are an expert at writing effective, personalized outreach emails for SEO link building.

CONTEXT:
Your name: ${params.yourName}
Your website: ${params.yourWebsite}
Your business: ${params.yourBusiness}
Target page for backlink: ${params.linkTarget}

RECIPIENT:
${params.recipientName ? `Name: ${params.recipientName}` : 'Name: Unknown (keep it professional without name)'}
Website: ${params.recipientWebsite}

APPROACH: ${approachContext[params.approach]}
TONE: ${params.tone}

REQUIREMENTS:
1. Keep it SHORT (150-250 words max) - busy people won't read long emails
2. Personalize it - reference their website/content specifically
3. Lead with value for THEM, not you
4. Be genuine and human, not salesy or robotic
5. Clear, specific ask
6. Professional but ${params.tone}
7. Include a compelling subject line
8. Make it easy to say yes

STRUCTURE:
Subject: [Write compelling subject line]

[Greeting]

[1-2 sentences showing you've actually visited their site - mention specific content/page]

[Value proposition - what's in it for them - be specific]

[Your ask - be clear and simple]

[Easy next step]

[Professional closing]
${params.yourName}

AVOID:
- Generic templates
- Being pushy or salesy
- Talking too much about yourself
- Vague offers
- Multiple asks in one email
- Overly long emails

Write the complete outreach email now (include subject line):`;
}

/**
 * Generate meta description prompt
 */
export function generateMetaDescriptionPrompt(params: MetaDescriptionParams): string {
  return `You are an expert at writing SEO-optimized meta descriptions that drive clicks.

PAGE DETAILS:
URL: ${params.pageUrl}
Page Title: ${params.pageTitle}
Target Keyword: "${params.targetKeyword}"
Business: ${params.businessName}
Max Length: ${params.maxLength} characters

REQUIREMENTS:
1. Include the target keyword "${params.targetKeyword}" naturally
2. Stay under ${params.maxLength} characters (Google truncates longer ones)
3. Compel users to click - this is advertising copy
4. Accurately describe what's on the page
5. Include a benefit or value proposition
6. Use active voice
7. Consider including a call-to-action if space allows

BEST PRACTICES:
- Front-load important keywords
- Be specific, not generic
- Match search intent
- Make it unique (don't duplicate title tag)
- Use power words that drive action

AVOID:
- Keyword stuffing
- Quotation marks (they get cut off)
- Generic descriptions like "Learn more about..."
- Going over character limit

Write 3 different meta description options, each on a new line:

Option 1: [Benefit-focused]
Option 2: [Action-focused]
Option 3: [Question/curiosity-focused]

Each should be ${params.maxLength} characters or less. After each option, show the character count in parentheses.`;
}

/**
 * Generate content outline prompt (for preview before full generation)
 */
export function generateBlogOutlinePrompt(keyword: string, businessContext: string): string {
  return `Create a detailed blog post outline for the keyword: "${keyword}"

Business context: ${businessContext}

Provide:
1. Suggested blog post title (H1)
2. 5-7 main section headings (H2)
3. 2-3 subheadings under each H2 (H3)
4. Brief description of what each section should cover
5. Estimated word count for each section

Format as a structured outline with proper hierarchy.`;
}

/**
 * Improve/refine existing content prompt
 */
export function generateContentRefinementPrompt(content: string, instructions: string): string {
  return `You are an expert content editor. Improve the following content based on these instructions:

INSTRUCTIONS: ${instructions}

ORIGINAL CONTENT:
${content}

REQUIREMENTS:
- Maintain the original structure and key points
- Improve clarity, flow, and readability
- Strengthen SEO without keyword stuffing
- Fix any grammar or spelling issues
- Make it more engaging and actionable

Provide the improved version:`;
}
