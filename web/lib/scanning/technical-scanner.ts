/**
 * Technical SEO Scanner
 * Checks websites for common SEO issues
 */

import * as cheerio from 'cheerio';

export interface ScanProgress {
  stage: string;
  message: string;
  progress: number;
  currentUrl?: string;
}

export interface ScanResult {
  has_ssl: boolean;
  has_sitemap: boolean;
  has_robots_txt: boolean;

  issues: SEOIssue[];
  pages_scanned: number;

  meta_description_stats: {
    total_pages: number;
    missing: number;
    duplicate: number;
  };

  alt_text_stats: {
    total_images: number;
    missing_alt: number;
  };

  broken_links: {
    total_links: number;
    broken_count: number;
  };

  performance: {
    avg_response_time_ms: number;
    slow_pages: number;
  };
}

export interface SEOIssue {
  issue_type: string;
  severity: 'critical' | 'warning' | 'recommendation';
  title: string;
  description: string;
  affected_url?: string;
  affected_element?: string;
  fix_suggestion: string;
  fix_complexity: 'easy' | 'medium' | 'hard';
  issue_data?: Record<string, any>;
}

/**
 * Run comprehensive technical SEO scan
 */
export async function runTechnicalScan(
  websiteUrl: string,
  options: {
    maxPages?: number;
    onProgress?: (progress: ScanProgress) => void;
  } = {}
): Promise<ScanResult> {
  const { maxPages = 20, onProgress } = options;

  const baseUrl = normalizeUrl(websiteUrl);
  const issues: SEOIssue[] = [];
  const scannedPages: PageScanResult[] = [];
  const allLinks = new Set<string>();
  const allImages: ImageData[] = [];

  // Stage 1: Check SSL
  onProgress?.({
    stage: 'ssl',
    message: 'Checking SSL/HTTPS configuration...',
    progress: 5,
  });

  const hasSSL = await checkSSL(baseUrl);
  if (!hasSSL) {
    issues.push({
      issue_type: 'no_ssl',
      severity: 'critical',
      title: 'Website not using HTTPS',
      description: 'Your website is not using HTTPS encryption, which is critical for security and SEO rankings.',
      affected_url: baseUrl,
      fix_suggestion: 'Install an SSL certificate and redirect all HTTP traffic to HTTPS.',
      fix_complexity: 'medium',
    });
  }

  // Stage 2: Check Sitemap
  onProgress?.({
    stage: 'sitemap',
    message: 'Checking for XML sitemap...',
    progress: 10,
  });

  const hasSitemap = await checkSitemap(baseUrl);
  if (!hasSitemap) {
    issues.push({
      issue_type: 'missing_sitemap',
      severity: 'warning',
      title: 'XML Sitemap missing',
      description: 'No XML sitemap found at /sitemap.xml or /sitemap_index.xml',
      affected_url: baseUrl,
      fix_suggestion: 'Create an XML sitemap and submit it to Google Search Console.',
      fix_complexity: 'easy',
    });
  }

  // Stage 3: Check robots.txt
  onProgress?.({
    stage: 'robots',
    message: 'Checking robots.txt...',
    progress: 15,
  });

  const hasRobotsTxt = await checkRobotsTxt(baseUrl);
  if (!hasRobotsTxt) {
    issues.push({
      issue_type: 'missing_robots_txt',
      severity: 'recommendation',
      title: 'robots.txt missing',
      description: 'No robots.txt file found.',
      affected_url: baseUrl,
      fix_suggestion: 'Create a robots.txt file to control search engine crawling.',
      fix_complexity: 'easy',
    });
  }

  // Stage 4: Crawl pages for content issues
  onProgress?.({
    stage: 'crawling',
    message: 'Scanning pages for SEO issues...',
    progress: 20,
  });

  // Discover URLs to scan
  const urlsToScan = await discoverUrls(baseUrl, maxPages);

  for (let i = 0; i < urlsToScan.length; i++) {
    const url = urlsToScan[i];

    onProgress?.({
      stage: 'crawling',
      message: `Scanning page ${i + 1} of ${urlsToScan.length}...`,
      progress: 20 + (i / urlsToScan.length) * 60,
      currentUrl: url,
    });

    try {
      const startTime = Date.now();
      const html = await fetchPage(url);
      const responseTime = Date.now() - startTime;

      if (!html) continue;

      const pageResult = await scanPage(url, html, baseUrl);
      pageResult.response_time_ms = responseTime;
      scannedPages.push(pageResult);

      // Collect links and images
      pageResult.links.forEach(link => allLinks.add(link));
      allImages.push(...pageResult.images);

      // Add page-specific issues
      if (!pageResult.meta_description) {
        issues.push({
          issue_type: 'missing_meta_description',
          severity: 'warning',
          title: 'Missing meta description',
          description: `Page "${pageResult.title || url}" is missing a meta description.`,
          affected_url: url,
          fix_suggestion: 'Add a unique meta description (150-160 characters) for this page.',
          fix_complexity: 'easy',
        });
      }

      if (!pageResult.h1 || pageResult.h1.length === 0) {
        issues.push({
          issue_type: 'missing_h1',
          severity: 'warning',
          title: 'Missing H1 tag',
          description: `Page "${pageResult.title || url}" is missing an H1 heading.`,
          affected_url: url,
          fix_suggestion: 'Add a single, descriptive H1 tag to this page.',
          fix_complexity: 'easy',
        });
      } else if (pageResult.h1.length > 1) {
        issues.push({
          issue_type: 'duplicate_h1',
          severity: 'recommendation',
          title: 'Multiple H1 tags',
          description: `Page has ${pageResult.h1.length} H1 tags. Best practice is to have exactly one.`,
          affected_url: url,
          fix_suggestion: 'Use only one H1 tag per page for the main heading.',
          fix_complexity: 'easy',
        });
      }

      if (pageResult.word_count < 300) {
        issues.push({
          issue_type: 'thin_content',
          severity: 'recommendation',
          title: 'Thin content',
          description: `Page has only ${pageResult.word_count} words. Pages with more content tend to rank better.`,
          affected_url: url,
          fix_suggestion: 'Expand the content to at least 300-500 words with valuable information.',
          fix_complexity: 'medium',
        });
      }

      // Small delay to be respectful
      await sleep(300);
    } catch (error) {
      console.error(`Error scanning ${url}:`, error);
    }
  }

  // Stage 5: Check for broken links
  onProgress?.({
    stage: 'links',
    message: 'Checking for broken links...',
    progress: 85,
  });

  const brokenLinks = await checkBrokenLinks(Array.from(allLinks).slice(0, 50)); // Limit to 50 links
  brokenLinks.forEach(link => {
    issues.push({
      issue_type: 'broken_link',
      severity: 'warning',
      title: 'Broken link detected',
      description: `Link returns ${link.status_code} error.`,
      affected_url: link.source_url,
      affected_element: link.link_url,
      fix_suggestion: 'Update or remove this broken link.',
      fix_complexity: 'easy',
      issue_data: { status_code: link.status_code },
    });
  });

  // Stage 6: Check images for alt text
  onProgress?.({
    stage: 'images',
    message: 'Checking images for alt text...',
    progress: 90,
  });

  const missingAltImages = allImages.filter(img => !img.alt || img.alt.trim() === '');
  missingAltImages.slice(0, 20).forEach(img => { // Limit to 20 individual issues
    issues.push({
      issue_type: 'missing_alt_text',
      severity: 'recommendation',
      title: 'Image missing alt text',
      description: 'Image is missing descriptive alt text for accessibility and SEO.',
      affected_url: img.page_url,
      affected_element: img.src,
      fix_suggestion: 'Add descriptive alt text to this image.',
      fix_complexity: 'easy',
    });
  });

  // Stage 7: Check performance
  onProgress?.({
    stage: 'performance',
    message: 'Analyzing performance...',
    progress: 95,
  });

  const avgResponseTime = scannedPages.reduce((sum, p) => sum + (p.response_time_ms || 0), 0) / scannedPages.length;
  const slowPages = scannedPages.filter(p => (p.response_time_ms || 0) > 3000);

  slowPages.forEach(page => {
    issues.push({
      issue_type: 'slow_page_speed',
      severity: 'warning',
      title: 'Slow page load time',
      description: `Page took ${page.response_time_ms}ms to load (>3s is slow).`,
      affected_url: page.url,
      fix_suggestion: 'Optimize images, enable compression, and use browser caching.',
      fix_complexity: 'medium',
      issue_data: { response_time_ms: page.response_time_ms },
    });
  });

  // Calculate stats
  const metaDescriptionStats = {
    total_pages: scannedPages.length,
    missing: scannedPages.filter(p => !p.meta_description).length,
    duplicate: findDuplicateMetaDescriptions(scannedPages),
  };

  const altTextStats = {
    total_images: allImages.length,
    missing_alt: missingAltImages.length,
  };

  onProgress?.({
    stage: 'completed',
    message: 'Scan completed',
    progress: 100,
  });

  return {
    has_ssl: hasSSL,
    has_sitemap: hasSitemap,
    has_robots_txt: hasRobotsTxt,
    issues,
    pages_scanned: scannedPages.length,
    meta_description_stats: metaDescriptionStats,
    alt_text_stats: altTextStats,
    broken_links: {
      total_links: allLinks.size,
      broken_count: brokenLinks.length,
    },
    performance: {
      avg_response_time_ms: Math.round(avgResponseTime),
      slow_pages: slowPages.length,
    },
  };
}

// Helper types
interface PageScanResult {
  url: string;
  title?: string;
  meta_description?: string;
  h1: string[];
  word_count: number;
  links: string[];
  images: ImageData[];
  response_time_ms?: number;
}

interface ImageData {
  src: string;
  alt: string;
  page_url: string;
}

interface BrokenLink {
  link_url: string;
  source_url: string;
  status_code: number;
}

/**
 * Check if website uses SSL/HTTPS
 */
async function checkSSL(url: string): Promise<boolean> {
  return url.startsWith('https://');
}

/**
 * Check for XML sitemap
 */
async function checkSitemap(baseUrl: string): Promise<boolean> {
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Continue checking other locations
    }
  }

  return false;
}

/**
 * Check for robots.txt
 */
async function checkRobotsTxt(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/robots.txt`, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Discover URLs to scan
 */
async function discoverUrls(baseUrl: string, maxPages: number): Promise<string[]> {
  const urls = new Set<string>([baseUrl]);

  try {
    // Try to get URLs from sitemap first
    const sitemapUrls = await extractUrlsFromSitemap(baseUrl);
    sitemapUrls.slice(0, maxPages).forEach(url => urls.add(url));
  } catch (error) {
    // Fallback to crawling homepage
  }

  // If we don't have enough URLs, crawl homepage for links
  if (urls.size < maxPages) {
    const html = await fetchPage(baseUrl);
    if (html) {
      const $ = cheerio.load(html);
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && urls.size < maxPages) {
          try {
            const absoluteUrl = new URL(href, baseUrl).href;
            const baseUrlObj = new URL(baseUrl);
            const linkUrlObj = new URL(absoluteUrl);

            // Only add same-domain URLs
            if (linkUrlObj.hostname === baseUrlObj.hostname) {
              urls.add(absoluteUrl);
            }
          } catch (e) {
            // Invalid URL, skip
          }
        }
      });
    }
  }

  return Array.from(urls).slice(0, maxPages);
}

/**
 * Extract URLs from sitemap
 */
async function extractUrlsFromSitemap(baseUrl: string): Promise<string[]> {
  const urls: string[] = [];

  try {
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    const response = await fetch(sitemapUrl, { signal: AbortSignal.timeout(5000) });

    if (!response.ok) return urls;

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    $('url > loc').each((_, el) => {
      const url = $(el).text().trim();
      if (url) urls.push(url);
    });
  } catch (error) {
    // Sitemap not available or invalid
  }

  return urls;
}

/**
 * Fetch page HTML
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CAIT-SEO-Scanner/1.0' },
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
 * Scan individual page
 */
async function scanPage(url: string, html: string, baseUrl: string): Promise<PageScanResult> {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $('script, style, nav, footer, header').remove();

  // Extract title
  const title = $('title').text().trim() || $('h1').first().text().trim();

  // Extract meta description
  const metaDescription = $('meta[name="description"]').attr('content')?.trim();

  // Extract H1 tags
  const h1 = $('h1').map((_, el) => $(el).text().trim()).get();

  // Count words
  const bodyText = $('body').text();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // Extract links
  const links: string[] = [];
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        links.push(absoluteUrl);
      } catch (e) {
        // Invalid URL
      }
    }
  });

  // Extract images
  const images: ImageData[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    if (src) {
      images.push({ src, alt, page_url: url });
    }
  });

  return {
    url,
    title,
    meta_description: metaDescription,
    h1,
    word_count: wordCount,
    links,
    images,
  };
}

/**
 * Check for broken links
 */
async function checkBrokenLinks(links: string[]): Promise<BrokenLink[]> {
  const brokenLinks: BrokenLink[] = [];

  // Check a sample of links (don't overwhelm the server)
  for (const link of links.slice(0, 20)) {
    try {
      const response = await fetch(link, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok && response.status >= 400) {
        brokenLinks.push({
          link_url: link,
          source_url: link,
          status_code: response.status,
        });
      }
    } catch (error) {
      // Link is broken or unreachable
      brokenLinks.push({
        link_url: link,
        source_url: link,
        status_code: 0,
      });
    }
  }

  return brokenLinks;
}

/**
 * Find duplicate meta descriptions
 */
function findDuplicateMetaDescriptions(pages: PageScanResult[]): number {
  const descriptions = new Map<string, number>();

  pages.forEach(page => {
    if (page.meta_description) {
      descriptions.set(
        page.meta_description,
        (descriptions.get(page.meta_description) || 0) + 1
      );
    }
  });

  let duplicateCount = 0;
  descriptions.forEach(count => {
    if (count > 1) duplicateCount += count;
  });

  return duplicateCount;
}

/**
 * Normalize URL
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname.replace(/\/$/, '')}`;
  } catch {
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
  return new Promise(resolve => setTimeout(resolve, ms));
}
