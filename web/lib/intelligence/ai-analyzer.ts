/**
 * AI-Powered Business Knowledge Analyzer
 * Uses Claude to extract structured business intelligence from website content
 */

import Anthropic from '@anthropic-ai/sdk';
import type { CrawledPage } from './website-crawler';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface BrandVoiceKnowledge {
  formality: 'very_formal' | 'formal' | 'neutral' | 'casual' | 'very_casual';
  personality: string[]; // e.g., ["friendly", "helpful", "confident"]
  reading_level: string; // e.g., "8th grade", "college level"
  sentence_style: string; // e.g., "short and punchy", "detailed and descriptive"
  tone: string[]; // e.g., ["professional", "warm", "authoritative"]
  example_sentences: string[];
}

export interface ProductService {
  name: string;
  description: string;
  benefits: string[];
  features?: string[];
  pricing?: string;
  target_customer?: string;
}

export interface CaseStudy {
  client?: string; // May be anonymized
  industry?: string;
  challenge: string;
  solution: string;
  result: string;
  metrics?: string[]; // e.g., ["300% increase in traffic", "50% cost reduction"]
  timeframe?: string;
}

export interface TargetAudienceSegment {
  type: string; // e.g., "Small business owners", "Enterprise IT directors"
  description?: string;
  pain_points: string[];
  goals: string[];
  characteristics?: string[];
}

export interface BusinessKnowledge {
  brand_voice?: BrandVoiceKnowledge;
  products_services?: ProductService[];
  case_studies?: CaseStudy[];
  target_audience?: TargetAudienceSegment[];
  terminology?: string[]; // Industry-specific terms
  pain_points?: string[]; // Customer problems they solve
  competitors?: string[];
  unique_value?: string[]; // Differentiators
}

export interface AnalysisProgress {
  stage: 'brand_voice' | 'products' | 'case_studies' | 'audience' | 'completed';
  message: string;
  itemsFound?: number;
}

/**
 * Analyze crawled website content to extract business knowledge
 */
export async function analyzeBusinessKnowledge(
  pages: CrawledPage[],
  options: {
    onProgress?: (progress: AnalysisProgress) => void;
  } = {}
): Promise<BusinessKnowledge> {
  const { onProgress } = options;
  const knowledge: BusinessKnowledge = {};

  try {
    // 1. Analyze Brand Voice (from homepage and about page)
    onProgress?.({
      stage: 'brand_voice',
      message: 'Analyzing brand voice and tone...',
    });

    const brandPages = pages.filter(
      (p) => p.pageType === 'homepage' || p.pageType === 'about'
    );
    if (brandPages.length > 0) {
      knowledge.brand_voice = await analyzeBrandVoice(brandPages);
    }

    // 2. Analyze Products/Services
    onProgress?.({
      stage: 'products',
      message: 'Extracting products and services...',
    });

    const servicePages = pages.filter(
      (p) => p.pageType === 'services' || p.pageType === 'homepage'
    );
    if (servicePages.length > 0) {
      knowledge.products_services = await analyzeProductsServices(servicePages);
      onProgress?.({
        stage: 'products',
        message: 'Extracting products and services...',
        itemsFound: knowledge.products_services.length,
      });
    }

    // 3. Analyze Case Studies
    onProgress?.({
      stage: 'case_studies',
      message: 'Finding case studies and success stories...',
    });

    const caseStudyPages = pages.filter(
      (p) => p.pageType === 'case_study' || p.pageType === 'blog'
    );
    if (caseStudyPages.length > 0) {
      knowledge.case_studies = await analyzeCaseStudies(caseStudyPages);
      onProgress?.({
        stage: 'case_studies',
        message: 'Finding case studies and success stories...',
        itemsFound: knowledge.case_studies.length,
      });
    }

    // 4. Analyze Target Audience
    onProgress?.({
      stage: 'audience',
      message: 'Understanding target audience...',
    });

    const allPages = pages.slice(0, 10); // Use top pages for audience analysis
    if (allPages.length > 0) {
      knowledge.target_audience = await analyzeTargetAudience(allPages);
    }

    // 5. Extract additional insights
    knowledge.terminology = extractTerminology(pages);
    knowledge.pain_points = extractPainPoints(pages);
    knowledge.unique_value = extractUniqueValue(pages);

    onProgress?.({
      stage: 'completed',
      message: 'Analysis complete',
    });

    return knowledge;
  } catch (error) {
    console.error('Error analyzing business knowledge:', error);
    throw error;
  }
}

/**
 * Analyze brand voice and tone from content
 */
async function analyzeBrandVoice(pages: CrawledPage[]): Promise<BrandVoiceKnowledge> {
  const content = pages
    .slice(0, 3)
    .map((p) => p.paragraphs.slice(0, 10).join('\n\n'))
    .join('\n\n---\n\n');

  const prompt = `Analyze the following website content and extract the brand's voice and tone characteristics.

Content:
${content}

Provide a JSON response with:
{
  "formality": "very_formal | formal | neutral | casual | very_casual",
  "personality": ["trait1", "trait2", ...], // e.g., friendly, professional, innovative
  "reading_level": "description", // e.g., "8th grade", "college level"
  "sentence_style": "description", // e.g., "short and punchy", "detailed and descriptive"
  "tone": ["tone1", "tone2", ...], // e.g., professional, warm, authoritative
  "example_sentences": ["sentence1", "sentence2", ...] // 3-5 representative sentences
}

Focus on concrete observations. Return ONLY the JSON object, no additional text.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return JSON.parse(textContent.text);
}

/**
 * Extract products and services
 */
async function analyzeProductsServices(pages: CrawledPage[]): Promise<ProductService[]> {
  const content = pages
    .map((p) => {
      const headings = [...p.headings.h1, ...p.headings.h2, ...p.headings.h3];
      const text = p.paragraphs.slice(0, 15).join('\n\n');
      return `${headings.join('\n')}\n\n${text}`;
    })
    .join('\n\n---\n\n');

  const prompt = `Analyze the following website content and extract all products and services offered.

Content:
${content}

Provide a JSON response with an array of products/services:
{
  "products": [
    {
      "name": "Product/Service Name",
      "description": "Brief description",
      "benefits": ["benefit1", "benefit2", ...],
      "features": ["feature1", "feature2", ...], // optional
      "pricing": "pricing info if mentioned", // optional
      "target_customer": "who this is for" // optional
    }
  ]
}

Focus on main offerings. Return ONLY the JSON object, no additional text.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const result = JSON.parse(textContent.text);
  return result.products || [];
}

/**
 * Extract case studies and success stories
 */
async function analyzeCaseStudies(pages: CrawledPage[]): Promise<CaseStudy[]> {
  const caseStudies: CaseStudy[] = [];

  // Analyze each case study page individually (limit to 5)
  for (const page of pages.slice(0, 5)) {
    const content = [
      ...page.headings.h1,
      ...page.headings.h2,
      ...page.paragraphs.slice(0, 20),
    ].join('\n\n');

    const prompt = `Analyze the following case study/success story and extract structured information.

Content:
${content}

Provide a JSON response:
{
  "client": "Client name if mentioned (or 'Anonymous')",
  "industry": "Industry if mentioned",
  "challenge": "What problem/challenge was addressed",
  "solution": "What solution was implemented",
  "result": "What results were achieved",
  "metrics": ["specific metric 1", "specific metric 2", ...], // e.g., "300% traffic increase"
  "timeframe": "How long it took if mentioned"
}

If this doesn't appear to be a case study, return null. Return ONLY the JSON object or null, no additional text.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content[0];
      if (textContent.type !== 'text') {
        continue;
      }

      const result = textContent.text.trim();
      if (result !== 'null') {
        caseStudies.push(JSON.parse(result));
      }
    } catch (error) {
      console.error('Error analyzing case study page:', error);
      // Continue with other pages
    }
  }

  return caseStudies;
}

/**
 * Analyze target audience
 */
async function analyzeTargetAudience(
  pages: CrawledPage[]
): Promise<TargetAudienceSegment[]> {
  const content = pages
    .slice(0, 5)
    .map((p) => p.paragraphs.slice(0, 10).join('\n\n'))
    .join('\n\n---\n\n');

  const prompt = `Analyze the following website content and identify the target audience segments.

Content:
${content}

Provide a JSON response with audience segments:
{
  "segments": [
    {
      "type": "Segment name", // e.g., "Small business owners", "Enterprise CIOs"
      "description": "Brief description",
      "pain_points": ["pain1", "pain2", ...], // Problems they face
      "goals": ["goal1", "goal2", ...], // What they want to achieve
      "characteristics": ["char1", "char2", ...] // Demographics, firmographics, etc.
    }
  ]
}

Return ONLY the JSON object, no additional text.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1536,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const result = JSON.parse(textContent.text);
  return result.segments || [];
}

/**
 * Extract industry-specific terminology
 */
function extractTerminology(pages: CrawledPage[]): string[] {
  // Find repeated technical/industry terms (simple heuristic)
  const allText = pages
    .flatMap((p) => p.paragraphs)
    .join(' ')
    .toLowerCase();

  const words = allText.match(/\b[a-z]{4,}\b/g) || [];
  const wordCounts = new Map<string, number>();

  words.forEach((word) => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });

  // Common terms that appear multiple times but aren't generic
  const commonWords = new Set([
    'about',
    'contact',
    'services',
    'products',
    'company',
    'business',
    'customer',
    'team',
    'work',
    'help',
    'provide',
  ]);

  return Array.from(wordCounts.entries())
    .filter(([word, count]) => count >= 5 && !commonWords.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

/**
 * Extract pain points mentioned
 */
function extractPainPoints(pages: CrawledPage[]): string[] {
  const painPoints: string[] = [];

  // Look for sentences with pain point indicators
  const painIndicators = [
    'struggling with',
    'problem',
    'challenge',
    'difficult',
    'frustrated',
    'waste time',
    'cost too much',
    'hard to',
  ];

  pages.forEach((page) => {
    page.paragraphs.forEach((para) => {
      const lowerPara = para.toLowerCase();
      if (painIndicators.some((indicator) => lowerPara.includes(indicator))) {
        // Extract the sentence
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [];
        sentences.forEach((sentence) => {
          if (
            painIndicators.some((indicator) => sentence.toLowerCase().includes(indicator))
          ) {
            painPoints.push(sentence.trim());
          }
        });
      }
    });
  });

  return painPoints.slice(0, 10);
}

/**
 * Extract unique value propositions
 */
function extractUniqueValue(pages: CrawledPage[]): string[] {
  const uniqueValues: string[] = [];

  // Look for unique value indicators in headings
  const valueIndicators = [
    'why choose',
    'what makes us',
    'different',
    'unique',
    'unlike',
    'only',
    'exclusive',
    'proprietary',
  ];

  pages.forEach((page) => {
    const allHeadings = [
      ...page.headings.h1,
      ...page.headings.h2,
      ...page.headings.h3,
    ];

    allHeadings.forEach((heading) => {
      if (
        valueIndicators.some((indicator) => heading.toLowerCase().includes(indicator))
      ) {
        uniqueValues.push(heading);
      }
    });

    // Also check paragraphs near these headings
    page.paragraphs.forEach((para) => {
      if (
        valueIndicators.some((indicator) => para.toLowerCase().includes(indicator))
      ) {
        uniqueValues.push(para);
      }
    });
  });

  return uniqueValues.slice(0, 5);
}
