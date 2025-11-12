/**
 * Google OAuth Configuration
 *
 * Handles OAuth 2.0 flow for Google Analytics & Search Console
 */

import { google } from 'googleapis'

// OAuth scopes we need
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/business.manage',
  'openid',
  'email',
  'profile',
]

/**
 * Get OAuth2 client
 */
export function getOAuth2Client(redirectUri?: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const defaultRedirect = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    : 'http://localhost:3000/api/auth/google/callback'

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET')
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri || defaultRedirect
  )
}

/**
 * Generate authorization URL
 */
export function getAuthorizationUrl(clientId: string, state?: string) {
  const oauth2Client = getOAuth2Client()

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_SCOPES,
    state: state || clientId, // Pass client ID in state
    prompt: 'consent', // Force consent to get refresh token
  })
}

/**
 * Exchange auth code for tokens
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

/**
 * Get authenticated OAuth2 client from stored tokens
 */
export function getAuthenticatedClient(tokens: any) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials(tokens)
  return oauth2Client
}

/**
 * Discover GA4 properties
 */
export async function discoverGA4Properties(tokens: any) {
  const oauth2Client = getAuthenticatedClient(tokens)
  const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client })

  try {
    // First, list all Analytics accounts
    const accountsResponse = await analyticsAdmin.accountSummaries.list()
    const accountSummaries = accountsResponse.data.accountSummaries || []

    if (accountSummaries.length === 0) {
      console.log('No GA4 accounts found')
      return []
    }

    // Collect all properties from all accounts
    const allProperties: any[] = []

    for (const accountSummary of accountSummaries) {
      const propertySummaries = accountSummary.propertySummaries || []

      for (const propSummary of propertySummaries) {
        allProperties.push({
          property_id: propSummary.property?.split('/')[1] || '',
          display_name: propSummary.displayName || '',
          account_id: accountSummary.account?.split('/')[1] || '',
        })
      }
    }

    console.log(`Found ${allProperties.length} GA4 properties`)
    return allProperties
  } catch (error: any) {
    console.error('Error discovering GA4 properties:', error.message)
    return []
  }
}

/**
 * Discover Search Console sites
 */
export async function discoverGSCSites(tokens: any) {
  const oauth2Client = getAuthenticatedClient(tokens)
  const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client })

  try {
    const response = await webmasters.sites.list()
    return (response.data.siteEntry || []).map((site: any) => ({
      site_url: site.siteUrl || '',
      permission_level: site.permissionLevel || '',
    }))
  } catch (error: any) {
    console.error('Error discovering GSC sites:', error.message)
    return []
  }
}

/**
 * Discover Google Business Profile locations
 */
export async function discoverGBPLocations(tokens: any) {
  const oauth2Client = getAuthenticatedClient(tokens)
  const mybusiness = google.mybusinessaccountmanagement({ version: 'v1', auth: oauth2Client })

  try {
    // First, get all accounts
    const accountsResponse = await mybusiness.accounts.list()
    const accounts = accountsResponse.data.accounts || []

    if (accounts.length === 0) {
      console.log('No GBP accounts found')
      return []
    }

    // For each account, get locations
    const allLocations = []

    for (const account of accounts) {
      try {
        const mybusinessinfo = google.mybusinessbusinessinformation({
          version: 'v1',
          auth: oauth2Client
        })

        if (!account.name) {
          continue
        }

        const locationsResponse = await mybusinessinfo.accounts.locations.list({
          parent: account.name,
          readMask: 'name,title,storefrontAddress,websiteUri,phoneNumbers',
        })

        const locations = (locationsResponse.data.locations || []).map((loc: any) => ({
          location_id: loc.name?.split('/').pop() || '',
          title: loc.title || '',
          address: loc.storefrontAddress ?
            `${loc.storefrontAddress.addressLines?.[0] || ''}, ${loc.storefrontAddress.locality || ''}, ${loc.storefrontAddress.administrativeArea || ''}`.trim() :
            '',
          phone: loc.phoneNumbers?.primaryPhone || '',
          website: loc.websiteUri || '',
          account_name: account.name || '',
        }))

        allLocations.push(...locations)
      } catch (locError: any) {
        console.error(`Error fetching locations for account ${account.name}:`, locError.message)
      }
    }

    return allLocations
  } catch (error: any) {
    console.error('Error discovering GBP locations:', error.message)
    return []
  }
}
