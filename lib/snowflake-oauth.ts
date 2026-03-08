/**
 * Snowflake OAuth 2.0 Browser-based Authentication
 *
 * This module handles OAuth flow for Snowflake using browser-based authentication
 * which supports Google SSO and other federated authentication methods.
 */

// OAuth configuration - these should be in your environment variables
const OAUTH_CONFIG = {
  // Snowflake OAuth endpoint
  authUrl: (account: string) => `https://${account}.snowflakecomputing.com/oauth/auth`,
  tokenUrl: (account: string) => `https://${account}.snowflakecomputing.com/oauth/token-request`,
  // Your integration's redirect URI - must match what's configured in Snowflake
  redirectUri: process.env.NEXT_PUBLIC_SNOWFLAKE_REDIRECT_URI || 'http://localhost:3000/api/snowflake/callback',
  // OAuth client credentials (from Snowflake security integration)
  clientId: process.env.NEXT_PUBLIC_SNOWFLAKE_CLIENT_ID || '',
  // Scopes needed
  scope: 'session:role:sysadmin',
};

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  serverUrl: string;
}

/**
 * Initiates the OAuth flow by redirecting the user to Snowflake's authorization page
 * This will show the browser's authentication (including Google SSO if configured)
 */
export function initiateOAuthFlow(account: string, state?: string) {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    response_type: 'token', // Implicit flow for browser-based auth
    scope: OAUTH_CONFIG.scope,
    state: state || crypto.randomUUID(),
  });

  const authUrl = `${OAUTH_CONFIG.authUrl(account)}?${params.toString()}`;

  // Open in popup window
  const width = 600;
  const height = 700;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  const popup = window.open(
    authUrl,
    'snowflake-oauth',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );

  return popup;
}

/**
 * Handles the OAuth callback from the redirect
 * Parses the token from the URL fragment (implicit flow)
 */
export function handleOAuthCallback(): TokenResponse | null {
  const fragment = window.location.hash.substring(1);
  const params = new URLSearchParams(fragment);

  const accessToken = params.get('access_token');
  const tokenType = params.get('token_type');
  const expiresIn = parseInt(params.get('expires_in') || '3600');
  const serverUrl = params.get('server_url') || '';

  if (!accessToken) {
    return null;
  }

  // Store the token in sessionStorage
  const tokenData: TokenResponse = {
    accessToken,
    tokenType: tokenType || 'Bearer',
    expiresIn,
    serverUrl: decodeURIComponent(serverUrl),
  };

  sessionStorage.setItem('snowflake_token', JSON.stringify(tokenData));

  return tokenData;
}

/**
 * Gets the stored OAuth token from sessionStorage
 */
export function getStoredToken(): TokenResponse | null {
  const stored = sessionStorage.getItem('snowflake_token');
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Clears the stored OAuth token (logout)
 */
export function clearStoredToken(): void {
  sessionStorage.removeItem('snowflake_token');
}

/**
 * Checks if we have a valid OAuth token
 */
export function hasValidToken(): boolean {
  const token = getStoredToken();
  return token !== null && token.accessToken.length > 0;
}

/**
 * Executes a SQL query using OAuth token authentication
 */
export async function executeQueryWithOAuth(
  account: string,
  database: string,
  schema: string,
  warehouse: string,
  query: string
): Promise<any> {
  const token = getStoredToken();

  if (!token) {
    throw new Error('No OAuth token found. Please authenticate first.');
  }

  const serverUrl = token.serverUrl || `https://${account}.snowflakecomputing.com`;
  const apiUrl = `${serverUrl}/api/v2/statements`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.accessToken}`,
      'X-Snowflake-Authorization-Token-Type': 'OAUTH',
    },
    body: JSON.stringify({
      statement: query,
      database,
      schema,
      warehouse,
      timeout: 60,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Snowflake API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Handle async query execution
  if (data.status === 'running' || data.status === 'queued') {
    return await pollQueryResult(account, data.queryId || data.rowSet?.[0]?.['queryId'], token.accessToken);
  }

  return data;
}

/**
 * Polls for async query results
 */
async function pollQueryResult(account: string, queryId: string, accessToken: string, maxAttempts = 30): Promise<any> {
  const token = getStoredToken();
  const serverUrl = token?.serverUrl || `https://${account}.snowflakecomputing.com`;
  const apiUrl = `${serverUrl}/api/v2/statements/${queryId}`;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (data.status === 'success') {
      return data;
    }

    if (data.status === 'failed') {
      throw new Error('Query failed: ' + JSON.stringify(data));
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Query timeout');
}

/**
 * Analyzes a post using Snowflake Cortex with OAuth authentication
 */
export async function analyzeWithCortexOAuth(
  account: string,
  database: string,
  schema: string,
  warehouse: string,
  postContent: string
): Promise<any> {
  const model = process.env.SNOWFLAKE_CORTEX_MODEL || 'snowflake-arctic';

  const prompt = `Analyze this social media post and provide a JSON response with the following structure:
{
  "isAppleRelated": boolean (true if mentions Apple, iPhone, iPad, Mac, MacBook, Apple Watch, AirPods, Apple Music, Apple TV+, etc.),
  "confidence": number (0-1, how confident are you in the Apple relevance),
  "sentiment": "positive" | "negative" | "neutral" (overall sentiment),
  "sentimentScore": number (-1 to 1, where negative is negative sentiment),
  "creativeArcs": array of strings (categorize the content type: pick from ["unboxing", "review", "tutorial", "lifestyle", "performance", "music", "behind-the-scenes", "announcement", "testimonial", "challenge"]),
  "summary": string (brief 1-sentence summary of what the post is about)
}

Post content: ${postContent}

Respond with valid JSON only, no markdown formatting.`;

  const query = `
SELECT PARSE_JSON(
  SNOWFLAKE.CORTEX.COMPLETE('${model}', '${prompt.replace(/'/g, "\\'")}', {'temperature': 0.1, 'max_tokens': 500}))
) as analysis
  `.trim();

  const result = await executeQueryWithOAuth(account, database, schema, warehouse, query);

  // Parse the result
  const rawResult = result.data?.[0]?.[0] || result.rowSet?.[0]?.[0];
  const parsed = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;

  return {
    isAppleRelated: parsed.isAppleRelated ?? true,
    confidence: parsed.confidence ?? 0.8,
    sentiment: parsed.sentiment ?? 'neutral',
    sentimentScore: parsed.sentimentScore ?? 0,
    creativeArcs: Array.isArray(parsed.creativeArcs) ? parsed.creativeArcs : ['uncategorized'],
    summary: parsed.summary || postContent.substring(0, 100),
  };
}
