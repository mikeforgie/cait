/**
 * Task Automation System
 *
 * Manages Month 0-12 automation tasks based on CAIT roadmap
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type TaskCategory = Database['public']['Tables']['tasks']['Row']['category']
type TaskStatus = Database['public']['Tables']['tasks']['Row']['status']

export interface TaskTemplate {
  month: number
  name: string
  description: string
  category: TaskCategory
  automated: boolean
  automation_config?: {
    api?: string
    endpoint?: string
    parameters?: Record<string, any>
  }
}

/**
 * Month 0-12 Task Templates
 * Based on CAIT plan PDF roadmap, original Notion export, and Site Setup Checklist
 */
export const TASK_TEMPLATES: TaskTemplate[] = [
  // Month 0: Onboarding & Foundation (Setup & Strategy)
  {
    month: 0,
    name: 'Client Interview & Onboarding',
    description: 'Send interview questionnaire and collect business information, goals, target audience',
    category: 'analytics',
    automated: false, // Manual for now, AI later
  },
  {
    month: 0,
    name: 'SSL Certificate Verification',
    description: 'Verify website has valid SSL certificate (https). Critical for security and SEO.',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'ssl_check',
    },
  },
  {
    month: 0,
    name: 'Favicon Setup',
    description: 'Ensure website has a proper favicon configured for branding',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'favicon_check',
    },
  },
  {
    month: 0,
    name: 'Keyword Research (100 keywords)',
    description: 'Research and compile 100 target keywords with search volume, difficulty, and intent',
    category: 'keyword_research',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'keyword_ideas',
      parameters: { limit: 100 },
    },
  },
  {
    month: 0,
    name: 'Competitor Analysis (3 competitors)',
    description: 'Analyze top 3 competitors for keyword overlap, backlink strategies, and content gaps',
    category: 'keyword_research',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'competitors_domain',
      parameters: { limit: 3 },
    },
  },
  {
    month: 0,
    name: 'Google Analytics 4 Setup',
    description: 'Verify GA4 tracking, set up goal conversions, and configure reports',
    category: 'analytics',
    automated: false,
  },
  {
    month: 0,
    name: 'Google Search Console Setup',
    description: 'Verify GSC access, submit sitemap, and configure performance tracking',
    category: 'analytics',
    automated: false,
  },
  {
    month: 0,
    name: 'Google Penalties Check',
    description: 'Check GSC for manual actions and algorithmic penalties affecting rankings',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'gsc',
      endpoint: 'manual_actions',
    },
  },
  {
    month: 0,
    name: 'Index Coverage Report Review',
    description: 'Review GSC Index Coverage report for errors, warnings, and excluded pages',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'gsc',
      endpoint: 'index_coverage',
    },
  },
  {
    month: 0,
    name: 'Core Web Vitals Audit',
    description: 'Audit LCP, FID/INP, and CLS scores for mobile and desktop via GSC/PageSpeed',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'core_web_vitals',
    },
  },
  {
    month: 0,
    name: 'Conversion Tracking Setup',
    description: 'Set up conversion tracking in GA4 for leads, sales, and key actions',
    category: 'analytics',
    automated: false,
  },
  {
    month: 0,
    name: 'GA4 Goal/Event Tracking',
    description: 'Configure custom events and goals in GA4 for user behavior tracking',
    category: 'analytics',
    automated: false,
  },
  {
    month: 0,
    name: 'Submit Sitemap to Google Search Console',
    description: 'Create XML sitemap and submit to GSC for indexing',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'gsc',
      endpoint: 'submit_sitemap',
    },
  },
  {
    month: 0,
    name: 'Request Indexing for Key Pages',
    description: 'Request indexing for homepage and key pages via GSC URL Inspection',
    category: 'technical_seo',
    automated: false,
  },
  {
    month: 0,
    name: 'Bing Webmaster Tools Setup',
    description: 'Set up Bing Webmaster Tools and submit sitemap for Bing search visibility',
    category: 'analytics',
    automated: false,
  },
  {
    month: 0,
    name: 'Microsoft Clarity Setup',
    description: 'Set up Microsoft Clarity for heatmaps, session recordings, and user behavior insights',
    category: 'analytics',
    automated: false,
  },
  {
    month: 0,
    name: 'Google Business Profile Optimization',
    description: 'Claim/verify GBP listing, optimize business info, add photos, set categories',
    category: 'local_seo',
    automated: false, // Partial automation via GBP API
  },
  {
    month: 0,
    name: 'NAP Consistency Audit',
    description: 'Audit Name, Address, Phone Number consistency across all online directories and listings',
    category: 'local_seo',
    automated: true,
    automation_config: {
      api: 'brightlocal',
      endpoint: 'nap_audit',
    },
  },
  {
    month: 0,
    name: 'Local Business Schema Implementation',
    description: 'Add LocalBusiness schema markup with address, hours, geo coordinates, and service areas',
    category: 'local_seo',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'local_schema_check',
    },
  },
  {
    month: 0,
    name: 'Google Map Embed on Contact Page',
    description: 'Embed Google Map on contact page with correct business location pin',
    category: 'local_seo',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'google_map_check',
    },
  },
  {
    month: 0,
    name: 'Backlink Profile Discovery',
    description: 'Discover and catalog all existing backlinks with DR/DA metrics',
    category: 'backlinks',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'backlinks',
      parameters: { limit: 1000 },
    },
  },
  {
    month: 0,
    name: 'Initial Strategy Document',
    description: 'Generate comprehensive SEO strategy based on audit findings',
    category: 'analytics',
    automated: true,
    automation_config: {
      api: 'claude',
      endpoint: 'generate_strategy',
    },
  },
  {
    month: 0,
    name: 'Create Topical Map',
    description: 'Develop topical authority map showing content clusters and pillar pages',
    category: 'content',
    automated: false, // AI-assisted later
  },
  {
    month: 0,
    name: 'Brand Alerts Setup',
    description: 'Set up Google Alerts for brand mentions and competitor monitoring',
    category: 'analytics',
    automated: false,
  },
  {
    month: 0,
    name: 'Social Media Links Integration',
    description: 'Link social media profiles to website and add social sharing buttons',
    category: 'technical_seo',
    automated: false,
  },
  {
    month: 0,
    name: 'Privacy Policy Page',
    description: 'Ensure website has compliant privacy policy page',
    category: 'content',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'privacy_policy_check',
    },
  },
  {
    month: 0,
    name: 'Terms of Service Page',
    description: 'Ensure website has terms of service/conditions page if applicable',
    category: 'content',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'terms_check',
    },
  },
  {
    month: 0,
    name: 'About Page Optimization',
    description: 'Optimize about page for E-E-A-T signals and brand credibility',
    category: 'content',
    automated: false,
  },
  {
    month: 0,
    name: 'URL Structure Audit',
    description: 'Review and optimize URL slugs for SEO best practices',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'url_structure_check',
    },
  },
  {
    month: 0,
    name: 'Mobile Responsiveness Check',
    description: 'Verify all pages are fully responsive on tablet and mobile devices',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'mobile_friendly',
    },
  },
  {
    month: 0,
    name: 'Page Speed Optimization Check',
    description: 'Run PageSpeed Insights and identify Core Web Vitals issues',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'lighthouse',
    },
  },
  {
    month: 0,
    name: 'Robots.txt Optimization',
    description: 'Create or optimize robots.txt for proper search engine crawling',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'robots_txt_check',
    },
  },
  {
    month: 0,
    name: '404 Error Page Setup',
    description: 'Ensure proper custom 404 error page is configured',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: '404_check',
    },
  },
  {
    month: 0,
    name: 'Canonical Tags Implementation',
    description: 'Implement canonical tags to avoid duplicate content issues',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'canonical_check',
    },
  },
  {
    month: 0,
    name: 'Schema Markup Implementation',
    description: 'Add structured data/schema markup for rich snippets (Organization, LocalBusiness, etc.)',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'schema_check',
    },
  },
  {
    month: 0,
    name: 'Image Alt Text Audit',
    description: 'Audit all images for proper alt text and file name optimization',
    category: 'content',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'alt_text_check',
    },
  },
  {
    month: 0,
    name: 'Breadcrumb Navigation Setup',
    description: 'Implement breadcrumb navigation for better UX and SEO',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'breadcrumb_check',
    },
  },
  {
    month: 0,
    name: 'ADA Accessibility Compliance',
    description: 'Ensure website is accessible and ADA compliant (WCAG guidelines)',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'accessibility_check',
    },
  },
  {
    month: 0,
    name: 'Cross-Browser Compatibility Check',
    description: 'Test and ensure website works properly across Chrome, Firefox, Safari, Edge',
    category: 'technical_seo',
    automated: false,
  },
  {
    month: 0,
    name: 'AMP Implementation (Mobile)',
    description: 'Implement Accelerated Mobile Pages for faster mobile page loads if applicable',
    category: 'technical_seo',
    automated: false,
  },
  {
    month: 0,
    name: 'Site Navigation Design',
    description: 'Design intuitive site navigation with minimal clicks to content',
    category: 'technical_seo',
    automated: false,
  },
  {
    month: 0,
    name: 'CTA Buttons Optimization',
    description: 'Ensure call-to-action buttons are clear, visible, and effective',
    category: 'content',
    automated: false,
  },
  {
    month: 0,
    name: 'Typography & Readability Optimization',
    description: 'Optimize fonts (max 2), text contrast, and reading experience',
    category: 'technical_seo',
    automated: false,
  },
  {
    month: 0,
    name: 'Pop-up Minimization',
    description: 'Review and minimize intrusive pop-ups that harm user experience',
    category: 'technical_seo',
    automated: false,
  },
  {
    month: 0,
    name: 'Form Optimization',
    description: 'Optimize all forms for user experience (minimize fields, clear labels)',
    category: 'technical_seo',
    automated: false,
  },

  // Month 1: Technical Foundation
  {
    month: 1,
    name: 'Technical SEO Audit',
    description: 'Comprehensive technical audit: crawlability, speed, mobile, schema, Core Web Vitals',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'technical_audit',
    },
  },
  {
    month: 1,
    name: 'On-Page Optimization (Homepage + 3 pages)',
    description: 'Optimize title tags, meta descriptions, headers, images, and internal links',
    category: 'technical_seo',
    automated: false,
  },
  {
    month: 1,
    name: 'Title Tags Optimization',
    description: 'Optimize title tags for all key pages (include target keyword, max 60 chars)',
    category: 'content',
    automated: false,
  },
  {
    month: 1,
    name: 'Meta Descriptions Optimization',
    description: 'Write compelling meta descriptions for all key pages (include keyword, max 160 chars)',
    category: 'content',
    automated: false,
  },
  {
    month: 1,
    name: 'Header Tags Optimization (H1/H2/H3)',
    description: 'Ensure proper header hierarchy: one H1 per page with keyword, logical H2/H3 structure',
    category: 'content',
    automated: false,
  },
  {
    month: 1,
    name: 'Internal Linking Strategy',
    description: 'Implement strategic internal linking to boost page authority and user navigation',
    category: 'content',
    automated: false,
  },
  {
    month: 1,
    name: '301 Redirects for Broken Links',
    description: 'Identify and fix broken links with proper 301 redirects',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'broken_links',
    },
  },
  {
    month: 1,
    name: 'Crawl Errors Audit',
    description: 'Audit and fix crawl errors from GSC and site scanner',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'gsc',
      endpoint: 'crawl_errors',
    },
  },
  {
    month: 1,
    name: 'Lazy Loading Implementation',
    description: 'Implement lazy loading for images and videos (except above-fold content)',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'scanner',
      endpoint: 'lazy_loading_check',
    },
  },
  {
    month: 1,
    name: 'E-E-A-T Optimization',
    description: 'Optimize content for Experience, Expertise, Authoritativeness, Trustworthiness signals',
    category: 'content',
    automated: false,
  },
  {
    month: 1,
    name: 'Featured Snippets Optimization',
    description: 'Optimize key pages for featured snippets (35% average CTR boost)',
    category: 'content',
    automated: false,
  },
  {
    month: 1,
    name: 'Authoritative Outbound Links',
    description: 'Add relevant authoritative outbound links to build topical trust',
    category: 'content',
    automated: false,
  },
  {
    month: 1,
    name: 'Video SEO for Embedded Content',
    description: 'Optimize embedded YouTube videos with proper schema and transcripts',
    category: 'content',
    automated: false,
  },
  {
    month: 1,
    name: 'Pillar Content & Topic Clusters',
    description: 'Develop pillar content pages with supporting topic cluster articles',
    category: 'content',
    automated: false,
  },
  {
    month: 1,
    name: 'GA4 Custom Alerts Setup',
    description: 'Set up custom alerts in Google Analytics for traffic drops and anomalies',
    category: 'analytics',
    automated: false,
  },
  {
    month: 1,
    name: 'Content Calendar Creation',
    description: 'Create 3-month content calendar based on keyword research and competitor gaps',
    category: 'content',
    automated: false, // AI-assisted later
  },
  {
    month: 1,
    name: 'Content Strategy (4 pieces)',
    description: 'Plan 4 content pieces targeting high-priority keywords with outlines',
    category: 'content',
    automated: false, // AI-assisted later
  },
  {
    month: 1,
    name: 'Local SEO Setup',
    description: 'Set up local citations, NAP consistency check, local schema markup',
    category: 'local_seo',
    automated: false,
  },
  {
    month: 1,
    name: 'Local Citations Building',
    description: 'Submit business to relevant local directories (Yelp, Yellow Pages, industry-specific)',
    category: 'local_seo',
    automated: false,
  },
  {
    month: 1,
    name: 'Review Generation Campaign',
    description: 'Set up system to encourage customers to leave Google and platform reviews',
    category: 'local_seo',
    automated: false,
  },
  {
    month: 1,
    name: 'Guest Posting Strategy',
    description: 'Identify 10+ relevant authoritative websites for guest posting opportunities',
    category: 'backlinks',
    automated: false,
  },
  {
    month: 1,
    name: 'Directory Submissions',
    description: 'Submit website to relevant industry and niche directories',
    category: 'backlinks',
    automated: false,
  },
  {
    month: 1,
    name: 'Social Media Strategy',
    description: 'Develop social media content strategy aligned with SEO goals',
    category: 'content',
    automated: false,
  },
  {
    month: 1,
    name: 'Rank Tracking Setup',
    description: 'Set up automated rank tracking for target keywords (via GSC + DataForSEO)',
    category: 'analytics',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'ranked_keywords',
    },
  },
  {
    month: 1,
    name: 'Backlink Tracker Setup',
    description: 'Set up backlink monitoring with DR/DA tracking and link health alerts',
    category: 'backlinks',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'backlinks_monitor',
    },
  },
  {
    month: 1,
    name: 'Site Architecture Optimization',
    description: 'Optimize site structure for crawlability, flat hierarchy, and logical URL paths',
    category: 'technical_seo',
    automated: false,
  },
  {
    month: 1,
    name: 'XML Sitemap Audit',
    description: 'Audit sitemap for errors, warnings, and ensure all important pages are included',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'gsc',
      endpoint: 'sitemap_status',
    },
  },
  {
    month: 1,
    name: 'Hreflang Tags Implementation',
    description: 'Implement hreflang tags for multi-language/region sites (if applicable)',
    category: 'technical_seo',
    automated: false,
  },
  {
    month: 1,
    name: 'JavaScript SEO Audit',
    description: 'Audit JavaScript rendering, ensure content is crawlable, check for JS-related issues',
    category: 'technical_seo',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'js_rendering',
    },
  },
  {
    month: 1,
    name: 'Google Sitelinks Optimization',
    description: 'Optimize site structure and navigation to earn Google Sitelinks in SERPs',
    category: 'content',
    automated: false,
  },
  {
    month: 1,
    name: 'Category/Archive Pages Optimization',
    description: 'Optimize category, tag, and archive pages with unique content and proper SEO',
    category: 'content',
    automated: false,
  },
  {
    month: 1,
    name: 'Long-Tail Keyword Targeting',
    description: 'Identify and create content targeting long-tail keyword opportunities',
    category: 'keyword_research',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'long_tail_keywords',
    },
  },
  {
    month: 1,
    name: 'Content Readability Optimization',
    description: 'Optimize content formatting, reading level, and scannability for users',
    category: 'content',
    automated: false,
  },
  {
    month: 1,
    name: 'GSC Performance Alerts Setup',
    description: 'Set up alerts for significant changes in GSC impressions, clicks, and rankings',
    category: 'analytics',
    automated: false,
  },

  // Month 2: Content Creation
  {
    month: 2,
    name: 'Content Creation (2 blog posts)',
    description: 'Write and publish 2 SEO-optimized blog posts',
    category: 'content',
    automated: false, // AI-assisted later
  },
  {
    month: 2,
    name: 'Internal Linking Optimization',
    description: 'Add strategic internal links to boost page authority',
    category: 'technical_seo',
    automated: false,
  },
  {
    month: 2,
    name: 'Monthly Performance Report',
    description: 'Generate and send monthly SEO performance report',
    category: 'analytics',
    automated: true,
    automation_config: {
      api: 'reporting',
      endpoint: 'monthly_report',
    },
  },
  {
    month: 2,
    name: 'Old Content Update',
    description: 'Update 2-3 pieces of old content with fresh information and improved optimization',
    category: 'content',
    automated: false,
  },
  {
    month: 2,
    name: 'Content Quality Audit',
    description: 'Audit content for quality, relevance, and user value',
    category: 'content',
    automated: false,
  },
  {
    month: 2,
    name: 'Exit Page Analysis',
    description: 'Analyze top exit pages and optimize to reduce bounce rate',
    category: 'analytics',
    automated: true,
    automation_config: {
      api: 'ga4',
      endpoint: 'exit_pages',
    },
  },
  {
    month: 2,
    name: 'Pages Ranking 10-30 Optimization',
    description: 'Identify and boost pages ranking in positions 10-30 (add internal links, update content, optimize for snippets)',
    category: 'keyword_research',
    automated: true,
    automation_config: {
      api: 'gsc',
      endpoint: 'ranking_opportunities',
    },
  },
  {
    month: 2,
    name: 'Keyword Performance Review',
    description: 'Review target keywords and adjust strategy based on ranking performance',
    category: 'keyword_research',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'keyword_performance',
    },
  },
  {
    month: 2,
    name: 'Social Signals Monitoring',
    description: 'Monitor social signals impact on SEO performance',
    category: 'analytics',
    automated: false,
  },
  {
    month: 2,
    name: 'Landing Page Refresh',
    description: 'Update key landing pages for relevancy and conversion optimization',
    category: 'content',
    automated: false,
  },
  {
    month: 2,
    name: 'Toxic Backlink Audit',
    description: 'Identify and disavow toxic/spammy backlinks that could hurt rankings',
    category: 'backlinks',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'toxic_backlinks',
    },
  },
  {
    month: 2,
    name: 'HARO/Connectively Outreach',
    description: 'Sign up and respond to HARO/Connectively queries for PR backlinks',
    category: 'backlinks',
    automated: false,
  },
  {
    month: 2,
    name: 'Brand Mention Monitoring',
    description: 'Set up monitoring for unlinked brand mentions and outreach for link conversion',
    category: 'backlinks',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'brand_mentions',
    },
  },
  {
    month: 2,
    name: 'Online Reputation Management',
    description: 'Monitor and respond to online reviews, manage brand reputation',
    category: 'local_seo',
    automated: false,
  },
  {
    month: 2,
    name: 'Content Repurposing Strategy',
    description: 'Repurpose top content into multiple formats (social, video, email, infographics)',
    category: 'content',
    automated: false,
  },
  {
    month: 2,
    name: 'Community/Forum Engagement',
    description: 'Participate in relevant Reddit, Facebook groups, and industry forums',
    category: 'content',
    automated: false,
  },
  {
    month: 2,
    name: 'Infographic/Visual Content Creation',
    description: 'Create shareable infographics and visual content for link building',
    category: 'content',
    automated: false,
  },
  {
    month: 2,
    name: 'Competitor Backlink Analysis',
    description: 'Analyze competitor backlinks for new link building opportunities',
    category: 'backlinks',
    automated: true,
    automation_config: {
      api: 'dataforseo',
      endpoint: 'competitor_backlinks',
    },
  },
  {
    month: 2,
    name: 'Broken Link Building',
    description: 'Find broken links on authority sites and offer your content as replacement',
    category: 'backlinks',
    automated: false,
  },
  {
    month: 2,
    name: 'Resource Page Link Building',
    description: 'Identify resource pages in your niche and pitch your content for inclusion',
    category: 'backlinks',
    automated: false,
  },
  {
    month: 2,
    name: 'Local Press/News Outreach',
    description: 'Pitch stories to local news outlets and press for coverage and backlinks',
    category: 'backlinks',
    automated: false,
  },
  {
    month: 2,
    name: 'Podcast Guest Appearances',
    description: 'Identify relevant podcasts and pitch yourself as a guest for backlinks and exposure',
    category: 'backlinks',
    automated: false,
  },

  // Months 3-12: Ongoing Optimization
  ...Array.from({ length: 10 }, (_, i) => {
    const month = i + 3
    return [
      {
        month,
        name: 'Content Creation (2 pieces)',
        description: 'Write and publish 2 SEO-optimized content pieces',
        category: 'content' as TaskCategory,
        automated: false,
      },
      {
        month,
        name: 'Old Content Update',
        description: 'Update 2-3 pieces of old content with fresh information',
        category: 'content' as TaskCategory,
        automated: false,
      },
      {
        month,
        name: 'Backlink Outreach',
        description: 'Identify and reach out for 5 quality backlink opportunities',
        category: 'backlinks' as TaskCategory,
        automated: false,
      },
      {
        month,
        name: 'Guest Posting Outreach',
        description: 'Pitch and secure 1-2 guest posts on relevant authoritative sites',
        category: 'backlinks' as TaskCategory,
        automated: false,
      },
      {
        month,
        name: 'HARO/PR Outreach',
        description: 'Respond to 5+ HARO/Connectively queries for PR opportunities',
        category: 'backlinks' as TaskCategory,
        automated: false,
      },
      {
        month,
        name: 'Link Audit',
        description: 'Audit backlink profile for new/lost links and toxic links',
        category: 'backlinks' as TaskCategory,
        automated: true,
        automation_config: {
          api: 'dataforseo',
          endpoint: 'backlink_audit',
        },
      },
      {
        month,
        name: 'Pages Ranking 10-30 Optimization',
        description: 'Boost pages in positions 10-30 with internal links and content updates',
        category: 'keyword_research' as TaskCategory,
        automated: true,
        automation_config: {
          api: 'gsc',
          endpoint: 'ranking_opportunities',
        },
      },
      {
        month,
        name: 'Rank Tracking & Analysis',
        description: 'Monitor keyword rankings and identify opportunities',
        category: 'analytics' as TaskCategory,
        automated: true,
        automation_config: {
          api: 'dataforseo',
          endpoint: 'ranked_keywords',
        },
      },
      {
        month,
        name: 'Monthly Performance Report',
        description: 'Generate and send monthly SEO performance report',
        category: 'analytics' as TaskCategory,
        automated: true,
        automation_config: {
          api: 'reporting',
          endpoint: 'monthly_report',
        },
      },
    ]
  }).flat(),

  // Quarterly strategy reviews
  {
    month: 3,
    name: 'Quarterly Strategy Review (Q1)',
    description: 'Review performance and adjust strategy for next quarter',
    category: 'analytics',
    automated: false,
  },
  {
    month: 6,
    name: 'Quarterly Strategy Review (Q2)',
    description: 'Review performance and adjust strategy for next quarter',
    category: 'analytics',
    automated: false,
  },
  {
    month: 9,
    name: 'Quarterly Strategy Review (Q3)',
    description: 'Review performance and adjust strategy for next quarter',
    category: 'analytics',
    automated: false,
  },
  {
    month: 12,
    name: 'Annual Strategy Review',
    description: 'Comprehensive annual review and planning for year 2',
    category: 'analytics',
    automated: false,
  },
]

/**
 * Initialize tasks for a new client
 */
export async function initializeClientTasks(clientId: string): Promise<void> {
  const supabase = await createClient()

  // Create all Month 0-12 tasks
  const tasks = TASK_TEMPLATES.map(template => ({
    client_id: clientId,
    month: template.month,
    name: template.name,
    description: template.description,
    category: template.category,
    automated: template.automated,
    automation_config: template.automation_config || null,
    status: 'pending' as TaskStatus,
  }))

  const { error } = await supabase.from('tasks').insert(tasks)

  if (error) {
    throw new Error(`Failed to initialize tasks: ${error.message}`)
  }
}

/**
 * Get tasks for specific month
 */
export async function getMonthTasks(
  clientId: string,
  month: number
): Promise<Database['public']['Tables']['tasks']['Row'][]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', clientId)
    .eq('month', month)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  return data || []
}

/**
 * Get all automated tasks that need to run
 */
export async function getAutomatedTasks(
  clientId: string,
  month?: number
): Promise<Database['public']['Tables']['tasks']['Row'][]> {
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('client_id', clientId)
    .eq('automated', true)
    .eq('status', 'pending')

  if (month !== undefined) {
    query = query.eq('month', month)
  }

  const { data, error } = await query.order('month', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch automated tasks: ${error.message}`)
  }

  return data || []
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  result?: any
): Promise<void> {
  const supabase = await createClient()

  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }

  if (result) {
    updates.automation_config = {
      ...(updates.automation_config || {}),
      last_result: result,
    }
  }

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`)
  }
}

/**
 * Get task completion percentage for client
 */
export async function getTaskProgress(
  clientId: string,
  month?: number
): Promise<{
  total: number
  completed: number
  in_progress: number
  pending: number
  percentage: number
}> {
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select('status')
    .eq('client_id', clientId)

  if (month !== undefined) {
    query = query.eq('month', month)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch task progress: ${error.message}`)
  }

  const tasks = data || []
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'completed').length
  const in_progress = tasks.filter(t => t.status === 'in_progress').length
  const pending = tasks.filter(t => t.status === 'pending').length

  return {
    total,
    completed,
    in_progress,
    pending,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

/**
 * Get next task to work on
 */
export async function getNextTask(
  clientId: string
): Promise<Database['public']['Tables']['tasks']['Row'] | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'pending')
    .order('month', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    throw new Error(`Failed to fetch next task: ${error.message}`)
  }

  return data || null
}
