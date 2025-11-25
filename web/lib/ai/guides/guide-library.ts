/**
 * Guide Library
 * Pre-built AI-guided setup flows for common tasks
 */

import { AIGuide } from './guide-types';

export const GUIDE_LIBRARY: Record<string, AIGuide> = {
  'add-anthropic-key': {
    id: 'add-anthropic-key',
    title: 'Add Your Anthropic API Key',
    description: 'Connect your Anthropic account to enable unlimited AI features',
    estimatedTime: '2 minutes',
    difficulty: 'easy',
    category: 'setup',
    steps: [
      {
        title: 'Sign up for Anthropic',
        instruction: 'Create an Anthropic account if you don\'t have one',
        detailedHelp: 'Go to https://console.anthropic.com and click "Sign Up". You\'ll get $5 in free credits to start.',
        helpPrompt: `
          Guide the user through creating an Anthropic account.
          Explain:
          1. Where to go (https://console.anthropic.com)
          2. What to click (Sign Up button)
          3. What information they'll need (email, password)
          4. That they get $5 free credit to start
          5. That email verification is required

          Keep it simple and encouraging.
        `,
      },
      {
        title: 'Generate API Key',
        instruction: 'Create a new API key in the Anthropic Console',
        detailedHelp: 'In the Anthropic Console, click "API Keys" in the sidebar, then "Create Key". Give it a name like "CAIT Integration".',
        helpPrompt: `
          Walk the user through generating an API key:
          1. Where to find "API Keys" in the left sidebar
          2. Click "Create Key" button
          3. Suggest a name: "CAIT - [Client Name]" or "CAIT Integration"
          4. Explain that the key starts with "sk-ant-"
          5. IMPORTANT: Copy it now - they won't see it again
          6. Keep it secure - treat it like a password

          Be clear and step-by-step.
        `,
      },
      {
        title: 'Add Key to CAIT',
        instruction: 'Paste your API key into the field above',
        detailedHelp: 'Copy the key from Anthropic Console (starts with sk-ant-) and paste it into the API key field.',
        helpPrompt: `
          Help the user add their API key to CAIT:
          1. The key should look like: sk-ant-api03-...
          2. Make sure there are no extra spaces
          3. The key is encrypted before being saved
          4. We never see or store it in plain text
          5. They can test it by clicking "Save & Test"

          Reassure them about security.
        `,
        validationUrl: '/api/ai/validate-key',
        troubleshootingPrompt: `
          The API key test failed. Help troubleshoot:

          Common issues:
          1. Key was copied incorrectly (extra space at end?)
          2. Key was revoked or deleted in Anthropic Console
          3. Account doesn't have credits (check billing)
          4. Network/firewall blocking the API call

          Provide step-by-step troubleshooting based on the error.
        `,
      },
    ],
    nextSteps: [
      'You can now use unlimited AI features!',
      'Try generating a blog post or asking the AI assistant for help.',
    ],
  },

  'connect-ga4': {
    id: 'connect-ga4',
    title: 'Connect Google Analytics 4',
    description: 'Connect GA4 to track website traffic and conversions',
    estimatedTime: '5 minutes',
    difficulty: 'medium',
    category: 'integration',
    prerequisites: [
      'You have admin access to a Google Analytics 4 property',
      'You have a Google Cloud account (free)',
    ],
    steps: [
      {
        title: 'Create Google Cloud Project',
        instruction: 'Set up a new project in Google Cloud Console',
        detailedHelp: 'Go to https://console.cloud.google.com and create a new project. Name it something like "CAIT Analytics Integration".',
        helpPrompt: `
          Guide the user through creating a Google Cloud project:
          1. Go to https://console.cloud.google.com
          2. Click "Select a project" dropdown at the top
          3. Click "New Project"
          4. Name it: "CAIT Analytics Integration" or similar
          5. Leave organization as default (or select if applicable)
          6. Click "Create"
          7. Wait ~30 seconds for it to be created
          8. Make sure it's selected in the dropdown

          Be patient and clear - this is often confusing for first-timers.
        `,
      },
      {
        title: 'Enable GA4 Data API',
        instruction: 'Enable the Google Analytics Data API for your project',
        detailedHelp: 'In Cloud Console, go to "APIs & Services" > "Enable APIs and Services". Search for "Google Analytics Data API" and enable it.',
        helpPrompt: `
          Help enable the Analytics Data API:
          1. In Cloud Console, click the hamburger menu (☰) top-left
          2. Go to "APIs & Services" > "Library"
          3. Search for: "Google Analytics Data API"
          4. Click on it in the results
          5. Click the blue "Enable" button
          6. Wait for it to enable (~10 seconds)
          7. You should see "API enabled" confirmation

          If they can't find it, suggest searching for just "Analytics Data".
        `,
      },
      {
        title: 'Create Service Account',
        instruction: 'Create a service account for CAIT to access your GA4 data',
        detailedHelp: 'Go to "IAM & Admin" > "Service Accounts" > "Create Service Account". Name it "cait-analytics" and grant it "Viewer" role.',
        helpPrompt: `
          Walk through creating a service account:
          1. In Cloud Console menu, go to "IAM & Admin" > "Service Accounts"
          2. Click "+ Create Service Account" at top
          3. Service account name: "cait-analytics"
          4. Description: "CAIT platform analytics access"
          5. Click "Create and Continue"
          6. For role, search and select: "Viewer"
          7. Click "Continue" then "Done"
          8. You should see it in the list

          Explain that this is like a "robot account" that CAIT will use.
        `,
      },
      {
        title: 'Generate JSON Key',
        instruction: 'Download the service account credentials file',
        detailedHelp: 'Click on your service account, go to "Keys" tab, click "Add Key" > "Create new key" > "JSON". This will download a file.',
        helpPrompt: `
          Guide through creating the JSON key:
          1. Click on the service account you just created
          2. Click the "Keys" tab
          3. Click "Add Key" dropdown
          4. Select "Create new key"
          5. Choose "JSON" format (should be selected)
          6. Click "Create"
          7. A file will download (keep it safe!)
          8. The file name looks like: project-name-abc123.json

          IMPORTANT: This file contains credentials - keep it secure!
        `,
      },
      {
        title: 'Share GA4 Property',
        instruction: 'Grant the service account access to your GA4 property',
        detailedHelp: 'In GA4, go to Admin > Property Settings > Property Access Management. Add the service account email (from the JSON file) as a "Viewer".',
        helpPrompt: `
          Help share GA4 access with the service account:
          1. Open Google Analytics (analytics.google.com)
          2. Click Admin (gear icon, bottom left)
          3. In the Property column, click "Property Access Management"
          4. Click the blue "+" button (top right)
          5. Click "Add users"
          6. Paste the service account email:
             - It's in the JSON file as "client_email"
             - Looks like: cait-analytics@project-name.iam.gserviceaccount.com
          7. Role: Select "Viewer"
          8. Uncheck "Notify new users by email" (it's a bot, not a person!)
          9. Click "Add"

          Explain this allows CAIT to read (but not modify) their analytics data.
        `,
      },
      {
        title: 'Upload & Test',
        instruction: 'Upload the JSON key file to CAIT and test the connection',
        detailedHelp: 'Click the upload button above and select your JSON file. CAIT will test the connection to your GA4 property.',
        helpPrompt: `
          Final step - upload and test:
          1. Click the "Upload JSON Key" button
          2. Select the JSON file you downloaded
          3. CAIT will verify it's valid
          4. Select which GA4 property to use (if you have multiple)
          5. Click "Test Connection"
          6. If successful, you'll see your latest analytics data!

          If it fails, I'll help you troubleshoot.
        `,
        validationUrl: '/api/integrations/ga4/test',
        troubleshootingPrompt: `
          The GA4 connection test failed. Let's troubleshoot:

          Check these common issues:
          1. Service account email not added to GA4?
             - Go to GA4 Admin > Property Access Management
             - Verify the service account email is listed
          2. Wrong GA4 property selected?
             - Make sure you selected the right property
          3. API not enabled?
             - Go back to Google Cloud Console
             - Verify "Google Analytics Data API" is enabled
          4. JSON file corrupted?
             - Try downloading the key again
          5. Permissions wrong?
             - Service account needs "Viewer" role minimum

          Based on the error message, provide specific guidance.
        `,
      },
    ],
    nextSteps: [
      'GA4 is now connected! CAIT will sync your analytics data daily.',
      'You can view traffic, conversions, and more in your dashboard.',
      'Next: Connect Google Search Console for keyword ranking data.',
    ],
  },

  'connect-gsc': {
    id: 'connect-gsc',
    title: 'Connect Google Search Console',
    description: 'Track keyword rankings and search performance',
    estimatedTime: '3 minutes',
    difficulty: 'easy',
    category: 'integration',
    prerequisites: [
      'Your website is verified in Google Search Console',
      'You have "Owner" permission level',
    ],
    steps: [
      {
        title: 'Verify Site in GSC',
        instruction: 'Make sure your website is verified in Search Console',
        detailedHelp: 'Go to https://search.google.com/search-console and verify your website is listed and verified (green checkmark).',
        helpPrompt: `
          Help verify their site in Search Console:
          1. Go to https://search.google.com/search-console
          2. Check if their website is listed on the left
          3. Look for a green checkmark next to the domain
          4. If not verified, they need to verify ownership first:
             - Click "+ Add property"
             - Enter domain or URL prefix
             - Follow verification instructions (DNS, HTML file, or tag)
          5. This can take a few minutes to propagate

          If they need help with verification, provide specific guidance.
        `,
      },
      {
        title: 'Connect with OAuth',
        instruction: 'Click "Connect Google Search Console" and authorize CAIT',
        detailedHelp: 'You\'ll be redirected to Google to grant CAIT read-only access to your Search Console data.',
        helpPrompt: `
          Guide through OAuth connection:
          1. Click the "Connect Google Search Console" button above
          2. Select your Google account (use the same one as Search Console)
          3. Review permissions:
             - CAIT requests READ-ONLY access
             - We can see rankings, clicks, impressions
             - We CANNOT modify your site or settings
          4. Click "Allow" to grant access
          5. You'll be redirected back to CAIT
          6. Select which property to track (if you have multiple)

          Reassure about security - we only READ data, never modify.
        `,
      },
      {
        title: 'Select Property & Sync',
        instruction: 'Choose which Search Console property to track and run initial sync',
        detailedHelp: 'If you have multiple properties (like example.com and www.example.com), choose the one with the most data.',
        helpPrompt: `
          Help choose the right property:
          1. If you see multiple properties, choose the one you actively use
          2. Usually this is the www version (www.example.com)
          3. Click "Start Sync" to pull your keyword data
          4. This may take 1-2 minutes for the initial import
          5. You'll see:
             - Top keywords
             - Average position
             - Clicks and impressions
             - CTR data

          Explain that CAIT will auto-sync daily going forward.
        `,
        validationUrl: '/api/integrations/gsc/test',
      },
    ],
    nextSteps: [
      'Search Console connected! Keyword data will sync daily.',
      'Check your keyword rankings in the dashboard.',
      'CAIT will alert you when rankings change significantly.',
    ],
  },
};

/**
 * Get guide by ID
 */
export function getGuide(guideId: string): AIGuide | undefined {
  return GUIDE_LIBRARY[guideId];
}

/**
 * Get all guides for a category
 */
export function getGuidesByCategory(category: AIGuide['category']): AIGuide[] {
  return Object.values(GUIDE_LIBRARY).filter(guide => guide.category === category);
}

/**
 * Get recommended guides based on client status
 */
export function getRecommendedGuides(clientStatus: {
  hasAnthropicKey: boolean;
  hasGA4: boolean;
  hasGSC: boolean;
}): AIGuide[] {
  const recommended: AIGuide[] = [];

  if (!clientStatus.hasAnthropicKey) {
    recommended.push(GUIDE_LIBRARY['add-anthropic-key']);
  }

  if (!clientStatus.hasGA4) {
    recommended.push(GUIDE_LIBRARY['connect-ga4']);
  }

  if (!clientStatus.hasGSC) {
    recommended.push(GUIDE_LIBRARY['connect-gsc']);
  }

  return recommended;
}
