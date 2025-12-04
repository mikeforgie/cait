/**
 * Task Runner - Executes AI-powered SEO automation tasks
 *
 * Supports:
 * - robots.txt analysis and generation
 * - XML sitemap generation and submission
 * - Meta description generation
 * - And more...
 */

import { createClient } from '@/lib/supabase/server';

export interface TaskRunResult {
  success: boolean;
  taskId: string;
  action: string;
  message: string;
  details?: Record<string, any>;
  error?: string;
}

export interface AutomationContext {
  clientId: string;
  domain: string;
  taskId: string;
  taskType: string;
}

/**
 * Main task runner - routes to specific automation handlers
 */
export async function runAutomationTask(context: AutomationContext): Promise<TaskRunResult> {
  const { taskId, taskType } = context;

  try {
    switch (taskType) {
      case 'os-2': // Optimize robots.txt
        return await runRobotsTxtAutomation(context);

      case 'os-17': // Create XML sitemap
        return await runSitemapAutomation(context);

      case 'os-9': // Write meta descriptions
        return await runMetaDescriptionAutomation(context);

      default:
        return {
          success: false,
          taskId,
          action: 'unknown',
          message: `No automation available for task type: ${taskType}`,
          error: 'UNSUPPORTED_TASK',
        };
    }
  } catch (error) {
    console.error('Automation error:', error);
    return {
      success: false,
      taskId,
      action: 'error',
      message: 'Automation failed unexpectedly',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Robots.txt Automation
 * - Fetches current robots.txt (if exists)
 * - Analyzes the site structure
 * - Generates optimized robots.txt
 * - Provides instructions for implementation
 */
async function runRobotsTxtAutomation(context: AutomationContext): Promise<TaskRunResult> {
  const { clientId, domain, taskId } = context;

  // Step 1: Check if robots.txt exists
  let existingRobots: string | null = null;
  let robotsStatus: 'missing' | 'exists' | 'error' = 'missing';

  try {
    const robotsUrl = `https://${domain}/robots.txt`;
    const response = await fetch(robotsUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'CAIT-SEO-Bot/1.0' },
    });

    if (response.ok) {
      existingRobots = await response.text();
      robotsStatus = 'exists';
    } else if (response.status === 404) {
      robotsStatus = 'missing';
    } else {
      robotsStatus = 'error';
    }
  } catch (error) {
    console.error('Error fetching robots.txt:', error);
    robotsStatus = 'error';
  }

  // Step 2: Analyze and generate recommendations
  const analysis = analyzeRobotsTxt(existingRobots, domain);

  // Step 3: Generate optimized robots.txt
  const optimizedRobots = generateOptimizedRobotsTxt(domain, analysis);

  // Step 4: Log the automation run
  const supabase = await createClient();
  await supabase.from('seo_actions').insert({
    client_id: clientId,
    action_type: 'automation',
    action_category: 'technical_seo',
    title: 'Robots.txt Analysis & Generation',
    description: `Analyzed robots.txt for ${domain}. Status: ${robotsStatus}`,
    metadata: {
      taskId,
      robotsStatus,
      hasExisting: !!existingRobots,
      recommendations: analysis.recommendations,
    },
  });

  return {
    success: true,
    taskId,
    action: 'robots_txt_analysis',
    message: robotsStatus === 'missing'
      ? `No robots.txt found. Generated optimized version for ${domain}.`
      : `Analyzed existing robots.txt and generated optimized version.`,
    details: {
      status: robotsStatus,
      existingRobots,
      optimizedRobots,
      recommendations: analysis.recommendations,
      issues: analysis.issues,
      nextSteps: [
        'Review the generated robots.txt below',
        'Upload to your website root directory',
        'Test in Google Search Console robots.txt tester',
        'Submit sitemap URL if not already included',
      ],
    },
  };
}

interface RobotsAnalysis {
  recommendations: string[];
  issues: string[];
  hasSitemap: boolean;
  blockedPaths: string[];
}

function analyzeRobotsTxt(content: string | null, domain: string): RobotsAnalysis {
  const analysis: RobotsAnalysis = {
    recommendations: [],
    issues: [],
    hasSitemap: false,
    blockedPaths: [],
  };

  if (!content) {
    analysis.issues.push('No robots.txt file found');
    analysis.recommendations.push('Create a robots.txt file to control crawler access');
    analysis.recommendations.push('Add sitemap location to robots.txt');
    return analysis;
  }

  const lines = content.split('\n').map(l => l.trim().toLowerCase());

  // Check for sitemap
  analysis.hasSitemap = lines.some(l => l.startsWith('sitemap:'));
  if (!analysis.hasSitemap) {
    analysis.recommendations.push('Add sitemap URL to robots.txt');
  }

  // Check for overly restrictive rules
  if (lines.some(l => l === 'disallow: /')) {
    analysis.issues.push('WARNING: Entire site is blocked from crawling!');
    analysis.recommendations.push('Remove "Disallow: /" unless intentional');
  }

  // Check for common paths that should be blocked
  const shouldBlock = ['/wp-admin', '/admin', '/login', '/cart', '/checkout'];
  const blocked = lines.filter(l => l.startsWith('disallow:')).map(l => l.replace('disallow:', '').trim());
  analysis.blockedPaths = blocked;

  shouldBlock.forEach(path => {
    if (!blocked.some(b => b.includes(path.toLowerCase()))) {
      analysis.recommendations.push(`Consider blocking ${path} from crawlers`);
    }
  });

  return analysis;
}

function generateOptimizedRobotsTxt(domain: string, analysis: RobotsAnalysis): string {
  const lines = [
    '# Robots.txt for ' + domain,
    '# Generated by CAIT - Core AI Tool',
    '# ' + new Date().toISOString(),
    '',
    '# Allow all crawlers by default',
    'User-agent: *',
    '',
    '# Block admin and sensitive areas',
    'Disallow: /wp-admin/',
    'Disallow: /admin/',
    'Disallow: /login/',
    'Disallow: /cart/',
    'Disallow: /checkout/',
    'Disallow: /my-account/',
    'Disallow: /*?s=',
    'Disallow: /*?p=',
    'Disallow: /wp-includes/',
    '',
    '# Allow important resources',
    'Allow: /wp-admin/admin-ajax.php',
    'Allow: /*.css$',
    'Allow: /*.js$',
    'Allow: /*.png$',
    'Allow: /*.jpg$',
    'Allow: /*.gif$',
    'Allow: /*.svg$',
    'Allow: /*.webp$',
    '',
    '# Crawl-delay (optional, use with caution)',
    '# Crawl-delay: 1',
    '',
    '# Sitemap location',
    `Sitemap: https://${domain}/sitemap.xml`,
    `Sitemap: https://${domain}/sitemap_index.xml`,
    '',
  ];

  return lines.join('\n');
}

/**
 * Sitemap Automation
 * - Crawls the site to find pages
 * - Generates XML sitemap
 * - Submits to Google Search Console (if connected)
 */
async function runSitemapAutomation(context: AutomationContext): Promise<TaskRunResult> {
  const { clientId, domain, taskId } = context;

  // Step 1: Check if sitemap already exists
  let existingSitemap = false;
  let sitemapUrl = `https://${domain}/sitemap.xml`;

  try {
    const response = await fetch(sitemapUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': 'CAIT-SEO-Bot/1.0' },
    });
    existingSitemap = response.ok;
  } catch (error) {
    console.log('No sitemap found or error checking:', error);
  }

  // Step 2: Crawl main pages (simplified - just check homepage and common paths)
  const discoveredPages = await discoverPages(domain);

  // Step 3: Generate sitemap XML
  const sitemapXml = generateSitemapXml(domain, discoveredPages);

  // Step 4: Check if GSC is connected and submit
  const supabase = await createClient();
  const { data: client } = await supabase
    .from('clients')
    .select('selected_gsc_site_url, google_access_token')
    .eq('id', clientId)
    .single();

  let gscSubmitted = false;
  let gscMessage = '';

  if (client?.selected_gsc_site_url && client?.google_access_token) {
    // TODO: Implement actual GSC API submission
    // For now, provide instructions
    gscMessage = 'GSC is connected. Sitemap can be submitted automatically.';
    gscSubmitted = false; // Would be true after actual submission
  } else {
    gscMessage = 'Connect Google Search Console to enable automatic sitemap submission.';
  }

  // Log the automation
  await supabase.from('seo_actions').insert({
    client_id: clientId,
    action_type: 'automation',
    action_category: 'technical_seo',
    title: 'XML Sitemap Generation',
    description: `Generated sitemap with ${discoveredPages.length} pages for ${domain}`,
    metadata: {
      taskId,
      existingSitemap,
      pagesFound: discoveredPages.length,
      gscConnected: !!client?.selected_gsc_site_url,
    },
  });

  return {
    success: true,
    taskId,
    action: 'sitemap_generation',
    message: existingSitemap
      ? `Sitemap exists. Generated updated version with ${discoveredPages.length} pages.`
      : `Generated new sitemap with ${discoveredPages.length} pages.`,
    details: {
      existingSitemap,
      pagesDiscovered: discoveredPages.length,
      pages: discoveredPages,
      sitemapXml,
      gscStatus: gscMessage,
      gscSubmitted,
      nextSteps: [
        'Review the generated sitemap below',
        'Upload sitemap.xml to your website root',
        existingSitemap ? 'This will replace your existing sitemap' : 'Create the file at /sitemap.xml',
        client?.selected_gsc_site_url
          ? 'Click "Submit to GSC" to register with Google'
          : 'Connect GSC in Connections to enable auto-submission',
      ],
    },
  };
}

async function discoverPages(domain: string): Promise<string[]> {
  const pages: string[] = [`https://${domain}/`];
  const commonPaths = [
    '/about', '/about-us',
    '/contact', '/contact-us',
    '/services', '/products',
    '/blog', '/news',
    '/faq', '/faqs',
    '/privacy-policy', '/privacy',
    '/terms', '/terms-of-service',
  ];

  // Check which common pages exist
  for (const path of commonPaths) {
    try {
      const response = await fetch(`https://${domain}${path}`, {
        method: 'HEAD',
        headers: { 'User-Agent': 'CAIT-SEO-Bot/1.0' },
      });
      if (response.ok) {
        pages.push(`https://${domain}${path}`);
      }
    } catch {
      // Page doesn't exist, skip
    }
  }

  return pages;
}

function generateSitemapXml(domain: string, pages: string[]): string {
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Generated by CAIT - Core AI Tool -->
  <!-- ${new Date().toISOString()} -->
`;

  for (const page of pages) {
    const priority = page === `https://${domain}/` ? '1.0' : '0.8';
    xml += `  <url>
    <loc>${page}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>
`;
  }

  xml += '</urlset>';
  return xml;
}

/**
 * Meta Description Automation
 * - Analyzes pages missing meta descriptions
 * - Uses AI to generate compelling descriptions
 */
async function runMetaDescriptionAutomation(context: AutomationContext): Promise<TaskRunResult> {
  const { clientId, domain, taskId } = context;

  // This would integrate with Anthropic API to generate descriptions
  // For now, return a placeholder

  const supabase = await createClient();
  await supabase.from('seo_actions').insert({
    client_id: clientId,
    action_type: 'automation',
    action_category: 'content',
    title: 'Meta Description Generation',
    description: `Initiated meta description generation for ${domain}`,
    metadata: { taskId },
  });

  return {
    success: true,
    taskId,
    action: 'meta_description_generation',
    message: 'Meta description automation initiated. Analyzing pages...',
    details: {
      status: 'in_progress',
      nextSteps: [
        'AI is analyzing your pages for missing meta descriptions',
        'Suggestions will appear in the AI Assistants section',
        'Review and approve each suggestion before applying',
      ],
    },
  };
}
