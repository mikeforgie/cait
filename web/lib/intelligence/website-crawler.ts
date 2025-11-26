/**
 * Website Crawler for Business Intelligence
 * Extracts content from key pages for AI analysis
 */

import * as cheerio from 'cheerio';

export interface CrawlProgress {
  status: 'discovering' | 'crawling' | 'analyzing' | 'completed' | 'error';
  currentPage?: string;
  pagesFound: number;
  pagesCrawled: number;
  message: string;
}

export interface CrawledPage {
  url: string;
  title: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  paragraphs: string[];
  lists: string[];
  links: Array<{ text: string; href: string }>;
  images: Array<{ alt: string; src: string }>;
  metaDescription?: string;
  wordCount: number;
  pageType: 'homepage' | 'about' | 'services' | 'case_study' | 'blog' | 'contact' | 'other';
}

export interface CrawlResult {
  baseUrl: string;
  pages: CrawledPage[];
  totalPages: number;
  crawledAt: Date;
}

/**
 * Crawl a website and extract content from key pages
 */
export async function crawlWebsite(
  url: string,
  options: {
    maxPages?: number;
    onProgress?: (progress: CrawlProgress) => void;
  } = {}
): Promise<CrawlResult> {
  const { maxPages = 30, onProgress } = options;

  const baseUrl = normalizeUrl(url);
  const discoveredUrls = new Set<string>([baseUrl]);
  const crawledPages: CrawledPage[] = [];
  const visited = new Set<string>();

  // Priority pages to crawl first
  const priorityPatterns = [
    '', // Homepage
    '/about',
    '/services',
    '/products',
    '/case-studies',
    '/testimonials',
    '/blog',
    '/portfolio',
    '/work',
  ];

  try {
    // Progress: Discovering pages
    onProgress?.({
      status: 'discovering',
      pagesFound: 1,
      pagesCrawled: 0,
      message: 'Discovering pages...',
    });

    // Start with homepage to discover more URLs
    const homepageContent = await fetchPage(baseUrl);
    if (homepageContent) {
      const links = extractLinks(homepageContent, baseUrl);
      links.forEach((link) => {
        if (isRelevantUrl(link, baseUrl)) {
          discoveredUrls.add(link);
        }
      });
    }

    // Sort URLs by priority
    const urlsToCrawl = Array.from(discoveredUrls).sort((a, b) => {
      const aPriority = getPriority(a, baseUrl, priorityPatterns);
      const bPriority = getPriority(b, baseUrl, priorityPatterns);
      return bPriority - aPriority; // Higher priority first
    });

    onProgress?.({
      status: 'crawling',
      pagesFound: urlsToCrawl.length,
      pagesCrawled: 0,
      message: `Found ${urlsToCrawl.length} pages to analyze`,
    });

    // Crawl pages (limit to maxPages)
    for (let i = 0; i < Math.min(urlsToCrawl.length, maxPages); i++) {
      const pageUrl = urlsToCrawl[i];

      if (visited.has(pageUrl)) continue;
      visited.add(pageUrl);

      onProgress?.({
        status: 'crawling',
        currentPage: pageUrl,
        pagesFound: urlsToCrawl.length,
        pagesCrawled: i,
        message: `Analyzing ${getPageName(pageUrl, baseUrl)}...`,
      });

      try {
        const html = await fetchPage(pageUrl);
        if (!html) continue;

        const page = extractPageContent(pageUrl, html, baseUrl);
        crawledPages.push(page);

        // Small delay to be respectful
        await sleep(500);
      } catch (error) {
        console.error(`Error crawling ${pageUrl}:`, error);
        // Continue with other pages
      }
    }

    onProgress?.({
      status: 'completed',
      pagesFound: urlsToCrawl.length,
      pagesCrawled: crawledPages.length,
      message: `Successfully analyzed ${crawledPages.length} pages`,
    });

    return {
      baseUrl,
      pages: crawledPages,
      totalPages: crawledPages.length,
      crawledAt: new Date(),
    };
  } catch (error: any) {
    onProgress?.({
      status: 'error',
      pagesFound: discoveredUrls.size,
      pagesCrawled: crawledPages.length,
      message: `Error: ${error.message}`,
    });
    throw error;
  }
}

/**
 * Fetch HTML content from a URL
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CAIT-Business-Intelligence-Bot/1.0',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/html')) {
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Extract content from HTML page
 */
function extractPageContent(url: string, html: string, baseUrl: string): CrawledPage {
  const $ = cheerio.load(html);

  // Remove script, style, nav, footer elements
  $('script, style, nav, footer, header').remove();

  // Extract title
  const title = $('title').text().trim() || $('h1').first().text().trim();

  // Extract meta description
  const metaDescription = $('meta[name="description"]').attr('content')?.trim();

  // Extract headings
  const h1 = $('h1')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h2 = $('h2')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h3 = $('h3')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  // Extract paragraphs (meaningful text)
  const paragraphs = $('p')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((text) => text.length > 20); // Skip short/meaningless paragraphs

  // Extract lists
  const lists = $('li')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((text) => text.length > 5);

  // Extract links
  const links = $('a')
    .map((_, el) => ({
      text: $(el).text().trim(),
      href: $(el).attr('href') || '',
    }))
    .get()
    .filter((link) => link.text && link.href)
    .slice(0, 50); // Limit links

  // Extract images with alt text
  const images = $('img')
    .map((_, el) => ({
      alt: $(el).attr('alt')?.trim() || '',
      src: $(el).attr('src') || '',
    }))
    .get()
    .filter((img) => img.alt)
    .slice(0, 20); // Limit images

  // Calculate word count
  const allText = [...paragraphs, ...lists].join(' ');
  const wordCount = allText.split(/\s+/).filter(Boolean).length;

  // Determine page type
  const pageType = classifyPageType(url, title, h1, baseUrl);

  return {
    url,
    title,
    headings: { h1, h2, h3 },
    paragraphs,
    lists,
    links,
    images,
    metaDescription,
    wordCount,
    pageType,
  };
}

/**
 * Extract links from HTML
 */
function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    try {
      const absoluteUrl = new URL(href, baseUrl).href;
      links.push(absoluteUrl);
    } catch {
      // Invalid URL, skip
    }
  });

  return links;
}

/**
 * Check if URL is relevant to crawl
 */
function isRelevantUrl(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseObj = new URL(baseUrl);

    // Must be same domain
    if (urlObj.hostname !== baseObj.hostname) return false;

    // Skip common non-content URLs
    const path = urlObj.pathname.toLowerCase();
    const skipPatterns = [
      '/wp-admin',
      '/wp-content',
      '/wp-json',
      '/feed',
      '/cart',
      '/checkout',
      '/account',
      '/login',
      '/register',
      '/tag/',
      '/category/',
      '/author/',
      '.xml',
      '.pdf',
      '.jpg',
      '.png',
      '.gif',
    ];

    return !skipPatterns.some((pattern) => path.includes(pattern));
  } catch {
    return false;
  }
}

/**
 * Get priority score for URL
 */
function getPriority(url: string, baseUrl: string, priorityPatterns: string[]): number {
  const path = url.replace(baseUrl, '').toLowerCase();

  for (let i = 0; i < priorityPatterns.length; i++) {
    if (path === priorityPatterns[i] || path.startsWith(priorityPatterns[i] + '/')) {
      return 100 - i; // Higher score for earlier patterns
    }
  }

  return 0;
}

/**
 * Get readable page name
 */
function getPageName(url: string, baseUrl: string): string {
  const path = url.replace(baseUrl, '');
  if (!path || path === '/') return 'Homepage';

  return path
    .split('/')
    .filter(Boolean)
    .join(' > ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Classify page type based on URL and content
 */
function classifyPageType(
  url: string,
  title: string,
  h1: string[],
  baseUrl: string
): CrawledPage['pageType'] {
  const path = url.replace(baseUrl, '').toLowerCase();
  const content = [title, ...h1].join(' ').toLowerCase();

  if (path === '' || path === '/') return 'homepage';
  if (path.includes('/about') || content.includes('about us')) return 'about';
  if (path.includes('/service') || path.includes('/product')) return 'services';
  if (path.includes('/case-stud') || path.includes('/portfolio') || path.includes('/work')) {
    return 'case_study';
  }
  if (path.includes('/blog') || path.includes('/article')) return 'blog';
  if (path.includes('/contact')) return 'contact';

  return 'other';
}

/**
 * Normalize URL
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove trailing slash
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname.replace(/\/$/, '')}`;
  } catch {
    // If URL parsing fails, try adding https://
    if (!url.startsWith('http')) {
      return normalizeUrl(`https://${url}`);
    }
    throw new Error('Invalid URL');
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
