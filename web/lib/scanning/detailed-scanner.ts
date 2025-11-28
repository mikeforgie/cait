/**
 * Detailed Scanner for AI Assistant Data Collection
 * Collects comprehensive page data for AI-powered bulk fixes
 */

import * as cheerio from 'cheerio';

export interface DetailedPageData {
  url: string;
  title: string;
  meta_description?: string;
  h1_tags: string[];
  h2_tags: string[];

  // Content for context
  first_paragraph: string;
  main_content: string;
  word_count: number;

  // Images with context
  images: ImageWithContext[];

  // Links with context
  links: LinkWithContext[];

  // SEO issues
  issues: {
    missing_meta_description: boolean;
    missing_h1: boolean;
    multiple_h1: boolean;
    thin_content: boolean;
  };
}

export interface ImageWithContext {
  src: string;
  alt: string;
  title?: string;
  surrounding_text: string; // Text around the image for context
  parent_heading?: string; // Nearest heading above the image
  figure_caption?: string; // If inside <figure>, get <figcaption>
}

export interface LinkWithContext {
  href: string;
  text: string;
  surrounding_text: string;
  is_broken: boolean;
  status_code?: number;
}

/**
 * Scan pages in detail for AI assistant data collection
 */
export async function scanPagesDetailed(
  urls: string[],
  options: {
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<DetailedPageData[]> {
  const results: DetailedPageData[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    options.onProgress?.(i + 1, urls.length);

    try {
      const html = await fetchPage(url);
      if (!html) continue;

      const pageData = extractDetailedPageData(url, html);
      results.push(pageData);

      // Small delay to be respectful
      await sleep(300);
    } catch (error) {
      console.error(`Error scanning ${url}:`, error);
    }
  }

  return results;
}

/**
 * Extract detailed page data from HTML
 */
function extractDetailedPageData(url: string, html: string): DetailedPageData {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $('script, style, nav, footer, header, iframe, noscript').remove();

  // Extract title
  const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';

  // Extract meta description
  const metaDescription = $('meta[name="description"]').attr('content')?.trim();

  // Extract headings
  const h1Tags = $('h1')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  const h2Tags = $('h2')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  // Extract first paragraph
  const firstParagraph = $('p')
    .first()
    .text()
    .trim()
    .substring(0, 300);

  // Extract main content (first 3 paragraphs)
  const mainContent = $('p')
    .slice(0, 3)
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .join(' ')
    .substring(0, 500);

  // Count words
  const bodyText = $('body').text();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // Extract images with context
  const images: ImageWithContext[] = [];
  $('img').each((_, el) => {
    const $img = $(el);
    const src = $img.attr('src');
    if (!src) return;

    // Get alt text
    const alt = $img.attr('alt') || '';
    const imageTitle = $img.attr('title');

    // Get surrounding text (50 words before and after)
    const parent = $img.parent();
    const surroundingText = parent.text().trim().substring(0, 200);

    // Get nearest heading
    const nearestHeading = $img.prevAll('h1, h2, h3, h4').first().text().trim();

    // Get figure caption if inside figure
    const figureCaption = $img.closest('figure').find('figcaption').text().trim();

    images.push({
      src,
      alt,
      title: imageTitle,
      surrounding_text: surroundingText,
      parent_heading: nearestHeading || undefined,
      figure_caption: figureCaption || undefined,
    });
  });

  // Extract links with context
  const links: LinkWithContext[] = [];
  $('a').each((_, el) => {
    const $link = $(el);
    const href = $link.attr('href');
    if (!href) return;

    const text = $link.text().trim();
    const parent = $link.parent();
    const surroundingText = parent.text().trim().substring(0, 150);

    links.push({
      href,
      text,
      surrounding_text: surroundingText,
      is_broken: false, // Will be checked separately
    });
  });

  // Identify issues
  const issues = {
    missing_meta_description: !metaDescription,
    missing_h1: h1Tags.length === 0,
    multiple_h1: h1Tags.length > 1,
    thin_content: wordCount < 300,
  };

  return {
    url,
    title,
    meta_description: metaDescription,
    h1_tags: h1Tags,
    h2_tags: h2Tags,
    first_paragraph: firstParagraph,
    main_content: mainContent,
    word_count: wordCount,
    images,
    links,
    issues,
  };
}

/**
 * Fetch page HTML
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CAIT-AI-Assistant/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/html')) return null;

    return await response.text();
  } catch (error) {
    return null;
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cache page data to database
 */
export async function cachePageData(
  clientId: string,
  pageData: DetailedPageData,
  supabase: any
): Promise<void> {
  await supabase.from('page_content_cache').upsert(
    {
      client_id: clientId,
      page_url: pageData.url,
      title: pageData.title,
      meta_description: pageData.meta_description,
      h1_tags: pageData.h1_tags,
      body_text: pageData.main_content,
      images: pageData.images,
      links: pageData.links.slice(0, 50), // Limit links
      word_count: pageData.word_count,
      last_fetched_at: new Date().toISOString(),
      cache_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    },
    { onConflict: 'client_id,page_url' }
  );
}

/**
 * Get cached page data or fetch fresh
 */
export async function getCachedPageData(
  clientId: string,
  url: string,
  supabase: any
): Promise<DetailedPageData | null> {
  // Try cache first
  const { data: cached } = await supabase
    .from('page_content_cache')
    .select('*')
    .eq('client_id', clientId)
    .eq('page_url', url)
    .gt('cache_expires_at', new Date().toISOString())
    .single();

  if (cached) {
    // Return from cache
    return {
      url: cached.page_url,
      title: cached.title,
      meta_description: cached.meta_description,
      h1_tags: cached.h1_tags || [],
      h2_tags: [],
      first_paragraph: '',
      main_content: cached.body_text || '',
      word_count: cached.word_count || 0,
      images: cached.images || [],
      links: cached.links || [],
      issues: {
        missing_meta_description: !cached.meta_description,
        missing_h1: !cached.h1_tags || cached.h1_tags.length === 0,
        multiple_h1: cached.h1_tags && cached.h1_tags.length > 1,
        thin_content: cached.word_count < 300,
      },
    };
  }

  // Fetch fresh
  const html = await fetchPage(url);
  if (!html) return null;

  const pageData = extractDetailedPageData(url, html);

  // Cache it
  await cachePageData(clientId, pageData, supabase);

  return pageData;
}
