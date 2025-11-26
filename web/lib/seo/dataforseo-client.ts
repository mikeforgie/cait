/**
 * DataForSEO API Client
 * For automated keyword ranking checks
 * Docs: https://docs.dataforseo.com/v3/serp/google/organic/live/advanced/
 */

export interface RankingResult {
  keyword: string;
  position: number | null;
  url: string;
  title: string;
  searchEngine: string;
  location: string;
  checkedAt: Date;
}

export interface DataForSEOCredentials {
  login: string;
  password: string;
}

/**
 * Check keyword ranking position using DataForSEO
 */
export async function checkKeywordRanking(
  keyword: string,
  targetDomain: string,
  credentials: DataForSEOCredentials,
  options: {
    searchEngine?: string;
    locationCode?: number; // US = 2840
    deviceType?: 'desktop' | 'mobile';
  } = {}
): Promise<RankingResult | null> {
  const {
    searchEngine = 'google',
    locationCode = 2840, // United States
    deviceType = 'desktop',
  } = options;

  try {
    const auth = Buffer.from(`${credentials.login}:${credentials.password}`).toString('base64');

    const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          keyword,
          location_code: locationCode,
          language_code: 'en',
          device: deviceType,
          depth: 100, // Check top 100 results
        },
      ]),
    });

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.tasks || data.tasks.length === 0) {
      throw new Error('No tasks returned from DataForSEO');
    }

    const task = data.tasks[0];
    if (task.status_code !== 20000) {
      throw new Error(`DataForSEO task failed: ${task.status_message}`);
    }

    const results = task.result?.[0]?.items || [];

    // Find our domain in the results
    const normalizedDomain = targetDomain.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.type !== 'organic') continue;

      const resultUrl = result.url || '';
      const resultDomain = resultUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

      if (resultDomain === normalizedDomain || resultUrl.includes(normalizedDomain)) {
        return {
          keyword,
          position: result.rank_group || (i + 1),
          url: resultUrl,
          title: result.title || '',
          searchEngine,
          location: locationCode === 2840 ? 'us' : `location_${locationCode}`,
          checkedAt: new Date(),
        };
      }
    }

    // Not found in top 100
    return {
      keyword,
      position: null, // Not ranking in top 100
      url: '',
      title: '',
      searchEngine,
      location: locationCode === 2840 ? 'us' : `location_${locationCode}`,
      checkedAt: new Date(),
    };
  } catch (error: any) {
    console.error(`Error checking ranking for "${keyword}":`, error.message);
    throw error;
  }
}

/**
 * Batch check multiple keywords
 */
export async function batchCheckRankings(
  keywords: Array<{ keyword: string; targetDomain: string }>,
  credentials: DataForSEOCredentials,
  options: {
    searchEngine?: string;
    locationCode?: number;
    deviceType?: 'desktop' | 'mobile';
  } = {}
): Promise<RankingResult[]> {
  const results: RankingResult[] = [];

  // DataForSEO allows up to 100 tasks per request, but let's batch in smaller groups
  const batchSize = 20;

  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize);

    // Process batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(({ keyword, targetDomain }) =>
        checkKeywordRanking(keyword, targetDomain, credentials, options)
      )
    );

    batchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    });

    // Rate limiting: wait 1 second between batches
    if (i + batchSize < keywords.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Get DataForSEO credentials from environment variables
 */
export function getDataForSEOCredentials(): DataForSEOCredentials | null {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    console.warn('DataForSEO credentials not configured');
    return null;
  }

  return { login, password };
}
