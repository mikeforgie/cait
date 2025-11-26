/**
 * Business Knowledge Context Injection
 * Retrieves and formats business knowledge for AI prompt enhancement
 */

import { createClient } from '@/lib/supabase/server';

export interface BusinessContext {
  brandVoice?: string;
  productsServices?: string;
  caseStudies?: string;
  targetAudience?: string;
  terminology?: string;
  painPoints?: string;
  uniqueValue?: string;
  hasKnowledge: boolean;
}

/**
 * Get business knowledge context for a client
 */
export async function getBusinessKnowledgeContext(
  clientId: string
): Promise<BusinessContext> {
  const supabase = await createClient();

  // Get all active business knowledge for this client
  const { data: knowledgeItems } = await supabase
    .from('business_knowledge')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .order('confidence_score', { ascending: false });

  if (!knowledgeItems || knowledgeItems.length === 0) {
    return { hasKnowledge: false };
  }

  const context: BusinessContext = { hasKnowledge: true };

  // Format each knowledge type
  for (const item of knowledgeItems) {
    switch (item.knowledge_type) {
      case 'brand_voice':
        context.brandVoice = formatBrandVoice(item.knowledge_data);
        break;
      case 'products_services':
        context.productsServices = formatProductsServices(item.knowledge_data);
        break;
      case 'case_studies':
        context.caseStudies = formatCaseStudies(item.knowledge_data);
        break;
      case 'target_audience':
        context.targetAudience = formatTargetAudience(item.knowledge_data);
        break;
      case 'terminology':
        context.terminology = formatTerminology(item.knowledge_data);
        break;
      case 'pain_points':
        context.painPoints = formatPainPoints(item.knowledge_data);
        break;
      case 'unique_value':
        context.uniqueValue = formatUniqueValue(item.knowledge_data);
        break;
    }
  }

  return context;
}

/**
 * Build context prompt section for AI content generation
 */
export function buildContextPrompt(context: BusinessContext): string {
  if (!context.hasKnowledge) {
    return '';
  }

  const sections: string[] = [];

  sections.push('# Business Context\n');
  sections.push(
    'Use the following information about this business to create authentic, on-brand content:\n'
  );

  if (context.brandVoice) {
    sections.push('## Brand Voice & Tone\n');
    sections.push(context.brandVoice);
    sections.push('');
  }

  if (context.productsServices) {
    sections.push('## Products & Services\n');
    sections.push(context.productsServices);
    sections.push('');
  }

  if (context.targetAudience) {
    sections.push('## Target Audience\n');
    sections.push(context.targetAudience);
    sections.push('');
  }

  if (context.painPoints) {
    sections.push('## Customer Pain Points\n');
    sections.push(context.painPoints);
    sections.push('');
  }

  if (context.caseStudies) {
    sections.push('## Case Studies & Success Stories\n');
    sections.push(context.caseStudies);
    sections.push('');
  }

  if (context.uniqueValue) {
    sections.push('## Unique Value Propositions\n');
    sections.push(context.uniqueValue);
    sections.push('');
  }

  if (context.terminology) {
    sections.push('## Industry Terminology\n');
    sections.push(context.terminology);
    sections.push('');
  }

  sections.push(
    '---\n\nIMPORTANT: Write content that matches this brand voice, addresses these pain points, and naturally incorporates relevant examples from the case studies and product information above.\n'
  );

  return sections.join('\n');
}

/**
 * Format brand voice knowledge
 */
function formatBrandVoice(data: any): string {
  const lines: string[] = [];

  if (data.formality) {
    lines.push(`- Formality Level: ${data.formality}`);
  }

  if (data.personality && data.personality.length > 0) {
    lines.push(`- Personality Traits: ${data.personality.join(', ')}`);
  }

  if (data.tone && data.tone.length > 0) {
    lines.push(`- Tone: ${data.tone.join(', ')}`);
  }

  if (data.sentence_style) {
    lines.push(`- Sentence Style: ${data.sentence_style}`);
  }

  if (data.reading_level) {
    lines.push(`- Reading Level: ${data.reading_level}`);
  }

  if (data.example_sentences && data.example_sentences.length > 0) {
    lines.push('\nExample Sentences:');
    data.example_sentences.forEach((sentence: string) => {
      lines.push(`  "${sentence}"`);
    });
  }

  return lines.join('\n');
}

/**
 * Format products/services knowledge
 */
function formatProductsServices(data: any): string {
  const products = data.products || [];

  if (products.length === 0) {
    return 'No specific products/services documented.';
  }

  const lines: string[] = [];

  products.forEach((product: any, index: number) => {
    lines.push(`${index + 1}. **${product.name}**`);

    if (product.description) {
      lines.push(`   Description: ${product.description}`);
    }

    if (product.benefits && product.benefits.length > 0) {
      lines.push(`   Benefits: ${product.benefits.join(', ')}`);
    }

    if (product.features && product.features.length > 0) {
      lines.push(`   Features: ${product.features.join(', ')}`);
    }

    if (product.pricing) {
      lines.push(`   Pricing: ${product.pricing}`);
    }

    if (product.target_customer) {
      lines.push(`   Target Customer: ${product.target_customer}`);
    }

    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Format case studies knowledge
 */
function formatCaseStudies(data: any): string {
  const studies = data.studies || [];

  if (studies.length === 0) {
    return 'No case studies available.';
  }

  const lines: string[] = [];

  studies.forEach((study: any, index: number) => {
    lines.push(`Case Study ${index + 1}:`);

    if (study.client) {
      lines.push(`- Client: ${study.client}`);
    }

    if (study.industry) {
      lines.push(`- Industry: ${study.industry}`);
    }

    if (study.challenge) {
      lines.push(`- Challenge: ${study.challenge}`);
    }

    if (study.solution) {
      lines.push(`- Solution: ${study.solution}`);
    }

    if (study.result) {
      lines.push(`- Result: ${study.result}`);
    }

    if (study.metrics && study.metrics.length > 0) {
      lines.push(`- Metrics: ${study.metrics.join(', ')}`);
    }

    if (study.timeframe) {
      lines.push(`- Timeframe: ${study.timeframe}`);
    }

    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Format target audience knowledge
 */
function formatTargetAudience(data: any): string {
  const segments = data.segments || [];

  if (segments.length === 0) {
    return 'No target audience segments identified.';
  }

  const lines: string[] = [];

  segments.forEach((segment: any, index: number) => {
    lines.push(`Segment ${index + 1}: ${segment.type}`);

    if (segment.description) {
      lines.push(`  ${segment.description}`);
    }

    if (segment.pain_points && segment.pain_points.length > 0) {
      lines.push(`  Pain Points: ${segment.pain_points.join(', ')}`);
    }

    if (segment.goals && segment.goals.length > 0) {
      lines.push(`  Goals: ${segment.goals.join(', ')}`);
    }

    if (segment.characteristics && segment.characteristics.length > 0) {
      lines.push(`  Characteristics: ${segment.characteristics.join(', ')}`);
    }

    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Format terminology knowledge
 */
function formatTerminology(data: any): string {
  const terms = data.terms || [];

  if (terms.length === 0) {
    return 'No specific terminology identified.';
  }

  return `Industry-specific terms: ${terms.join(', ')}`;
}

/**
 * Format pain points knowledge
 */
function formatPainPoints(data: any): string {
  const painPoints = data.pain_points || [];

  if (painPoints.length === 0) {
    return 'No pain points documented.';
  }

  const lines: string[] = [];
  painPoints.forEach((point: string) => {
    lines.push(`- ${point}`);
  });

  return lines.join('\n');
}

/**
 * Format unique value knowledge
 */
function formatUniqueValue(data: any): string {
  const uniqueValue = data.unique_value || [];

  if (uniqueValue.length === 0) {
    return 'No unique value propositions documented.';
  }

  const lines: string[] = [];
  uniqueValue.forEach((value: string) => {
    lines.push(`- ${value}`);
  });

  return lines.join('\n');
}

/**
 * Get a quick summary of available knowledge for display
 */
export async function getKnowledgeSummary(
  clientId: string
): Promise<{
  hasKnowledge: boolean;
  knowledgeTypes: string[];
  lastUpdated?: Date;
}> {
  const supabase = await createClient();

  const { data: knowledgeItems } = await supabase
    .from('business_knowledge')
    .select('knowledge_type, updated_at')
    .eq('client_id', clientId)
    .eq('is_active', true);

  if (!knowledgeItems || knowledgeItems.length === 0) {
    return { hasKnowledge: false, knowledgeTypes: [] };
  }

  const knowledgeTypes = knowledgeItems.map((item) => item.knowledge_type);
  const lastUpdated = knowledgeItems.reduce((latest, item) => {
    const itemDate = new Date(item.updated_at);
    return !latest || itemDate > latest ? itemDate : latest;
  }, null as Date | null);

  return {
    hasKnowledge: true,
    knowledgeTypes,
    lastUpdated: lastUpdated || undefined,
  };
}
