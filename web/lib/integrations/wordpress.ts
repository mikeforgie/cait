/**
 * WordPress REST API Integration
 *
 * Enables CAIT to deploy files and manage content on WordPress sites
 * using Application Passwords for authentication.
 *
 * Required: WordPress 5.6+ with Application Passwords enabled
 */

export interface WordPressConnection {
  id: string;
  client_id: string;
  site_url: string;
  site_name?: string;
  wp_username: string;
  wp_app_password: string;
  status: 'pending' | 'connected' | 'error' | 'disconnected';
  last_error?: string;
  can_upload_files?: boolean;
  can_edit_posts?: boolean;
  wordpress_version?: string;
  last_verified_at?: string;
}

export interface WordPressTestResult {
  success: boolean;
  siteInfo?: {
    name: string;
    description: string;
    url: string;
    version: string;
  };
  capabilities?: {
    canUploadMedia: boolean;
    canEditPosts: boolean;
    canManageOptions: boolean;
  };
  error?: string;
}

export interface WordPressDeployResult {
  success: boolean;
  message: string;
  fileUrl?: string;
  previousContent?: string;
  error?: string;
}

/**
 * Test WordPress connection and retrieve site info
 */
export async function testWordPressConnection(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<WordPressTestResult> {
  try {
    // Normalize URL
    const baseUrl = siteUrl.replace(/\/$/, '');

    // Create Basic Auth header
    const authHeader = 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64');

    // Test connection by fetching site info
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: 'Invalid username or application password. Please check your credentials.',
        };
      }
      if (response.status === 404) {
        return {
          success: false,
          error: 'WordPress REST API not found. Make sure the site is WordPress 5.6+ with REST API enabled.',
        };
      }
      return {
        success: false,
        error: `Connection failed: ${response.status} ${response.statusText}`,
      };
    }

    const userData = await response.json();

    // Get site info
    const siteResponse = await fetch(`${baseUrl}/wp-json`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    let siteInfo = {
      name: 'WordPress Site',
      description: '',
      url: baseUrl,
      version: 'Unknown',
    };

    if (siteResponse.ok) {
      const siteData = await siteResponse.json();
      siteInfo = {
        name: siteData.name || 'WordPress Site',
        description: siteData.description || '',
        url: siteData.url || baseUrl,
        version: siteData.gmt_offset ? 'WordPress 5.0+' : 'Unknown',
      };
    }

    // Check capabilities based on user roles
    const capabilities = {
      canUploadMedia: userData.capabilities?.upload_files || false,
      canEditPosts: userData.capabilities?.edit_posts || false,
      canManageOptions: userData.capabilities?.manage_options || false,
    };

    return {
      success: true,
      siteInfo,
      capabilities,
    };
  } catch (error) {
    console.error('WordPress connection test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to WordPress site',
    };
  }
}

/**
 * Deploy a file to WordPress site root via the REST API
 * This uses a custom endpoint or media upload workaround
 */
export async function deployFileToWordPress(
  connection: WordPressConnection,
  filename: string,
  content: string
): Promise<WordPressDeployResult> {
  try {
    const baseUrl = connection.site_url.replace(/\/$/, '');
    const authHeader = 'Basic ' + Buffer.from(
      `${connection.wp_username}:${connection.wp_app_password}`
    ).toString('base64');

    // For robots.txt and sitemap.xml, we need a custom approach
    // Option 1: Check if CAIT Deploy plugin is installed
    // Option 2: Use a workaround via wp_options or custom endpoint

    // Try custom CAIT endpoint first (if plugin installed)
    const deployResponse = await fetch(`${baseUrl}/wp-json/cait/v1/deploy-file`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        content,
      }),
    });

    if (deployResponse.ok) {
      const result = await deployResponse.json();
      return {
        success: true,
        message: `Successfully deployed ${filename} to ${baseUrl}`,
        fileUrl: `${baseUrl}/${filename}`,
        previousContent: result.previous_content,
      };
    }

    // If custom endpoint not available, check if it's 404 (plugin not installed)
    if (deployResponse.status === 404) {
      return {
        success: false,
        error: 'CAIT Deploy plugin not installed. Please install the plugin to enable file deployment, or deploy manually.',
        message: 'WordPress connected but file deployment requires the CAIT Deploy plugin.',
      };
    }

    // Handle other errors
    const errorData = await deployResponse.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.message || `Deployment failed: ${deployResponse.status}`,
      message: 'Failed to deploy file to WordPress',
    };

  } catch (error) {
    console.error('WordPress deployment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed',
      message: 'Failed to connect to WordPress for deployment',
    };
  }
}

/**
 * Create or update robots.txt via WordPress
 */
export async function deployRobotsTxt(
  connection: WordPressConnection,
  content: string
): Promise<WordPressDeployResult> {
  return deployFileToWordPress(connection, 'robots.txt', content);
}

/**
 * Create or update sitemap.xml via WordPress
 */
export async function deploySitemap(
  connection: WordPressConnection,
  content: string
): Promise<WordPressDeployResult> {
  return deployFileToWordPress(connection, 'sitemap.xml', content);
}

/**
 * Get current robots.txt content from WordPress site
 */
export async function getCurrentRobotsTxt(siteUrl: string): Promise<string | null> {
  try {
    const baseUrl = siteUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/robots.txt`);

    if (response.ok) {
      return await response.text();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get current sitemap.xml content from WordPress site
 */
export async function getCurrentSitemap(siteUrl: string): Promise<string | null> {
  try {
    const baseUrl = siteUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/sitemap.xml`);

    if (response.ok) {
      return await response.text();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate WordPress Application Password instructions
 */
export function getAppPasswordInstructions(siteUrl: string): string[] {
  return [
    `Log in to your WordPress admin at ${siteUrl}/wp-admin`,
    'Go to Users → Profile (or click your username)',
    'Scroll down to "Application Passwords" section',
    'Enter "CAIT SEO Tool" as the application name',
    'Click "Add New Application Password"',
    'Copy the generated password (it will only be shown once)',
    'Paste it in the field below',
  ];
}
