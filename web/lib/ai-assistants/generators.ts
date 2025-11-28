/**
 * AI Assistant Generators
 * Uses Claude to generate SEO fixes based on page content
 */

import Anthropic from '@anthropic-ai/sdk';
import type { DetailedPageData, ImageWithContext } from '@/lib/scanning/detailed-scanner';
import type { BusinessContext } from '@/lib/intelligence/knowledge-context';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface GeneratedSuggestion {
  target_url: string;
  target_element?: string;
  suggested_content: string;
  original_content?: string;
  confidence_score: number;
  character_count: number;
  metadata?: Record<string, any>;
}

/**
 * Generate meta descriptions for multiple pages
 */
export async function generateMetaDescriptions(
  pages: DetailedPageData[],
  businessContext?: BusinessContext,
  options: {
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<GeneratedSuggestion[]> {
  const suggestions: GeneratedSuggestion[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    options.onProgress?.(i + 1, pages.length);

    try {
      const metaDescription = await generateMetaDescription(page, businessContext);
      suggestions.push(metaDescription);
    } catch (error) {
      console.error(`Error generating meta description for ${page.url}:`, error);
    }
  }

  return suggestions;
}

/**
 * Generate a single meta description
 */
async function generateMetaDescription(
  page: DetailedPageData,
  businessContext?: BusinessContext
): Promise<GeneratedSuggestion> {
  const contextSection = businessContext?.brandVoice
    ? `Brand Voice: ${businessContext.brandVoice}\n\n`
    : '';

  const prompt = `${contextSection}Write a compelling SEO meta description (150-160 characters) for this page:

Page Title: ${page.title}
URL: ${page.url}
${page.h1_tags.length > 0 ? `Main Heading: ${page.h1_tags[0]}` : ''}

Content Preview:
${page.main_content}

Requirements:
- Exactly 150-160 characters
- Include primary keyword naturally
- Compelling and action-oriented
- Accurate summary of page content
${businessContext?.brandVoice ? '- Match the brand voice described above' : ''}

Return ONLY the meta description text, no quotes or explanation.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const metaDescription = textContent.text.trim().replace(/^"|"$/g, '');

  return {
    target_url: page.url,
    suggested_content: metaDescription,
    original_content: page.meta_description,
    confidence_score: 0.9,
    character_count: metaDescription.length,
    metadata: {
      page_title: page.title,
      word_count: page.word_count,
    },
  };
}

/**
 * Generate alt text for multiple images
 */
export async function generateAltText(
  images: Array<ImageWithContext & { page_url: string }>,
  businessContext?: BusinessContext,
  options: {
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<GeneratedSuggestion[]> {
  const suggestions: GeneratedSuggestion[] = [];

  // Process in batches of 5
  for (let i = 0; i < images.length; i += 5) {
    const batch = images.slice(i, i + 5);

    options.onProgress?.(Math.min(i + 5, images.length), images.length);

    try {
      const batchResults = await generateAltTextBatch(batch, businessContext);
      suggestions.push(...batchResults);
    } catch (error) {
      console.error('Error generating alt text batch:', error);
    }
  }

  return suggestions;
}

/**
 * Generate alt text for a batch of images
 */
async function generateAltTextBatch(
  images: Array<ImageWithContext & { page_url: string }>,
  businessContext?: BusinessContext
): Promise<GeneratedSuggestion[]> {
  const contextSection = businessContext?.brandVoice
    ? `Brand Voice: ${businessContext.brandVoice}\n\n`
    : '';

  const imageDescriptions = images
    .map(
      (img, idx) => `
Image ${idx + 1}:
- URL: ${img.src}
- Current alt: "${img.alt}"
- Context: ${img.surrounding_text}
${img.parent_heading ? `- Section: ${img.parent_heading}` : ''}
${img.figure_caption ? `- Caption: ${img.figure_caption}` : ''}
`
    )
    .join('\n');

  const prompt = `${contextSection}Generate descriptive alt text for these images. Alt text should be:
- Descriptive and specific (what's in the image)
- Concise (under 125 characters)
- Include relevant keywords naturally
- Accessible for screen readers
${businessContext ? '- Match the brand voice' : ''}

${imageDescriptions}

Return a JSON array with format:
[
  { "index": 1, "alt_text": "description here" },
  { "index": 2, "alt_text": "description here" }
]

Return ONLY the JSON array, no additional text.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const results = JSON.parse(textContent.text.trim());

  return results.map((result: any, idx: number) => {
    const image = images[idx];
    return {
      target_url: image.page_url,
      target_element: image.src,
      suggested_content: result.alt_text,
      original_content: image.alt,
      confidence_score: 0.85,
      character_count: result.alt_text.length,
      metadata: {
        image_src: image.src,
        context: image.surrounding_text.substring(0, 100),
      },
    };
  });
}

/**
 * Generate H1 tags for pages missing them
 */
export async function generateH1Tags(
  pages: DetailedPageData[],
  businessContext?: BusinessContext,
  options: {
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<GeneratedSuggestion[]> {
  const suggestions: GeneratedSuggestion[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    options.onProgress?.(i + 1, pages.length);

    try {
      const h1Tag = await generateH1Tag(page, businessContext);
      suggestions.push(h1Tag);
    } catch (error) {
      console.error(`Error generating H1 for ${page.url}:`, error);
    }
  }

  return suggestions;
}

/**
 * Generate a single H1 tag
 */
async function generateH1Tag(
  page: DetailedPageData,
  businessContext?: BusinessContext
): Promise<GeneratedSuggestion> {
  const contextSection = businessContext?.brandVoice
    ? `Brand Voice: ${businessContext.brandVoice}\n\n`
    : '';

  const prompt = `${contextSection}Write a compelling H1 heading for this page:

Page Title: ${page.title}
URL: ${page.url}
${page.h2_tags.length > 0 ? `Subheadings: ${page.h2_tags.slice(0, 3).join(', ')}` : ''}

Content Preview:
${page.main_content}

Requirements:
- Clear and descriptive (40-70 characters)
- Include primary keyword
- Engaging and benefit-focused
- Appropriate for the page content
${businessContext?.brandVoice ? '- Match the brand voice' : ''}

Return ONLY the H1 text, no HTML tags or explanation.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const h1Text = textContent.text.trim().replace(/^<h1>|<\/h1>$/g, '');

  return {
    target_url: page.url,
    suggested_content: h1Text,
    original_content: page.h1_tags[0],
    confidence_score: 0.88,
    character_count: h1Text.length,
    metadata: {
      page_title: page.title,
      has_multiple_h1: page.issues.multiple_h1,
    },
  };
}

/**
 * Calculate credits needed for bulk generation
 */
export function calculateBulkCredits(
  type: 'meta_descriptions' | 'alt_text' | 'h1_tags',
  itemCount: number
): number {
  const creditsPerItem = {
    meta_descriptions: 1, // ~5K tokens per meta description
    alt_text: 0.5, // Batch processing, cheaper per item
    h1_tags: 0.5, // Quick generation
  };

  return Math.ceil(itemCount * creditsPerItem[type]);
}
