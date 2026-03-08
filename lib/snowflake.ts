/**
 * Snowflake Connection and Cortex Analysis Utility
 *
 * This module provides functions to connect to Snowflake and use
 * Snowflake Cortex Complete for AI-powered content analysis.
 */

interface SnowflakeConfig {
  account: string;
  username: string;
  password: string;
  warehouse: string;
  database: string;
  schema: string;
}

export interface CortexAnalysisResult {
  isAppleRelated: boolean;
  confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number; // -1 to 1
  creativeArcs: string[];
  summary: string;
}

/**
 * Validates that all required Snowflake environment variables are set
 */
export async function connectToSnowflake(): Promise<boolean> {
  const required = [
    'SNOWFLAKE_ACCOUNT',
    'SNOWFLAKE_USER',
    'SNOWFLAKE_WAREHOUSE',
    'SNOWFLAKE_DATABASE',
    'SNOWFLAKE_SCHEMA'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`Missing Snowflake environment variables: ${missing.join(', ')}`);
    return false;
  }

  return true;
}

/**
 * Analyzes a social media post using Snowflake Cortex Complete
 *
 * This function sends the post content to Snowflake Cortex Complete AI
 * to determine if it's Apple-related, analyze sentiment, and extract creative themes.
 *
 * @param postContent - The text content of the post to analyze
 * @returns Analysis result with Apple relevance, sentiment, and creative arcs
 */
export async function analyzePostWithCortex(postContent: string): Promise<CortexAnalysisResult> {
  // Check if Snowflake credentials are configured
  const isConnected = await connectToSnowflake();

  if (!isConnected) {
    // Return mock data when Snowflake is not configured
    console.warn('Snowflake not configured, using mock analysis');
    return mockAnalysis(postContent);
  }

  // Check if we have password for authentication
  const hasPassword = process.env.SNOWFLAKE_PASSWORD && process.env.SNOWFLAKE_PASSWORD.length > 0;

  if (!hasPassword) {
    console.warn('SNOWFLAKE_PASSWORD not set - using mock analysis (OAuth/key-pair auth not yet implemented)');
    return mockAnalysis(postContent);
  }

  try {
    const config: SnowflakeConfig = {
      account: process.env.SNOWFLAKE_ACCOUNT!.replace('.snowflakecomputing.com', ''),
      username: process.env.SNOWFLAKE_USER!,
      password: process.env.SNOWFLAKE_PASSWORD || '',
      warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
      database: process.env.SNOWFLAKE_DATABASE!,
      schema: process.env.SNOWFLAKE_SCHEMA!,
    };

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

    // Execute the Cortex Complete query via Snowflake SQL API
    const query = `
SELECT PARSE_JSON(
  SNOWFLAKE.CORTEX.COMPLETE(
    '${process.env.SNOWFLAKE_CORTEX_MODEL || 'snowflake-arctic'}',
    '${prompt.replace(/'/g, "\\'")}',
    { 'temperature': 0.1, 'max_tokens': 500 }
  )
) as analysis
    `.trim();

    // Make request to Snowflake API
    // Account identifier can be in format: org-account or just account
    // For account locator like A1482149680571-BI54912, use it directly
    const accountIdentifier = config.account.includes('-')
      ? config.account
      : `${config.account}.snowflakecomputing.com`;

    const apiUrl = `https://${accountIdentifier}.snowflakecomputing.com/api/v2/statements`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64'),
        'X-Snowflake-Authorization-Token-Type': 'KEY_VALUE_PAIR',
      },
      body: JSON.stringify({
        statement: query,
        database: config.database,
        schema: config.schema,
        warehouse: config.warehouse,
        timeout: 60,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Snowflake API error:', errorText);
      return mockAnalysis(postContent);
    }

    const data = await response.json();

    // Snowflake async query handling
    if (data.status === 'running' || data.status === 'queued') {
      // Poll for results
      const result = await pollQueryResult(
        `https://${config.account}.snowflakecomputing.com/api/v2/statements/${data.queryId}`,
        config.username,
        config.password
      );
      return parseCortexResult(result, postContent);
    }

    return parseCortexResult(data, postContent);
  } catch (error) {
    console.error('Cortex analysis error:', error);
    return mockAnalysis(postContent);
  }
}

/**
 * Polls for async query results from Snowflake
 */
async function pollQueryResult(
  url: string,
  username: string,
  password: string,
  maxAttempts = 30
): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      },
    });

    const data = await response.json();

    if (data.status === 'success') {
      return data;
    }

    if (data.status === 'failed') {
      throw new Error('Query failed: ' + JSON.stringify(data));
    }

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Query timeout');
}

/**
 * Parses the Cortex result from Snowflake response
 */
function parseCortexResult(data: any, fallbackContent: string): CortexAnalysisResult {
  try {
    const rawResult = data.data?.[0]?.[0] || data.rowSet?.[0]?.[0];
    const parsed = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;

    return {
      isAppleRelated: parsed.isAppleRelated ?? true,
      confidence: parsed.confidence ?? 0.8,
      sentiment: parsed.sentiment ?? 'neutral',
      sentimentScore: parsed.sentimentScore ?? 0,
      creativeArcs: Array.isArray(parsed.creativeArcs) ? parsed.creativeArcs : ['uncategorized'],
      summary: parsed.summary || fallbackContent.substring(0, 100),
    };
  } catch (error) {
    console.error('Error parsing Cortex result:', error);
    return mockAnalysis(fallbackContent);
  }
}

/**
 * Mock analysis function for when Snowflake is not configured
 * Uses simple keyword matching as a fallback
 */
function mockAnalysis(postContent: string): CortexAnalysisResult {
  const content = postContent.toLowerCase();

  // Apple-related keywords
  const appleKeywords = [
    'apple', 'iphone', 'ipad', 'mac', 'macbook', 'imac',
    'apple watch', 'airpods', 'apple music', 'apple tv', 'tv+',
    'shot on iphone', 'shotoniPhone', 'ios', 'macos', 'airtag',
    'homepod', 'app store', 'icloud', 'facetime', 'imessage'
  ];

  const isAppleRelated = appleKeywords.some(keyword => content.includes(keyword));

  // Sentiment analysis (simple keyword-based)
  const positiveWords = ['amazing', 'awesome', 'great', 'love', 'best', 'excellent', 'incredible', 'beautiful', 'perfect'];
  const negativeWords = ['bad', 'terrible', 'worst', 'hate', 'awful', 'disappointing', 'poor'];

  const hasPositive = positiveWords.some(word => content.includes(word));
  const hasNegative = negativeWords.some(word => content.includes(word));

  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  let sentimentScore = 0;

  if (hasPositive && !hasNegative) {
    sentiment = 'positive';
    sentimentScore = 0.5;
  } else if (hasNegative && !hasPositive) {
    sentiment = 'negative';
    sentimentScore = -0.5;
  }

  // Creative arcs detection
  const creativeArcs: string[] = [];
  const arcPatterns = {
    unboxing: ['unbox', 'opening', 'first look', 'whats in the box'],
    review: ['review', 'thoughts', 'opinion', 'rating', 'verdict'],
    tutorial: ['how to', 'tutorial', 'guide', 'tips', 'tricks', 'learn'],
    lifestyle: ['lifestyle', 'day in', 'vlog', 'routine', 'my story'],
    performance: ['performance', 'speed', 'benchmark', 'test', 'gaming'],
    music: ['music', 'song', 'album', 'concert', 'performance', 'dance'],
    'behind-the-scenes': ['behind the scenes', 'bts', 'making of', 'exclusive'],
    announcement: ['announcement', 'announcing', 'new', 'coming soon', 'launch'],
    testimonial: ['testimonial', 'experience', 'my experience', 'story'],
    challenge: ['challenge', 'challenge accepted', 'try', 'attempt'],
  };

  for (const [arc, patterns] of Object.entries(arcPatterns)) {
    if (patterns.some(pattern => content.includes(pattern))) {
      creativeArcs.push(arc);
    }
  }

  if (creativeArcs.length === 0) {
    creativeArcs.push('uncategorized');
  }

  return {
    isAppleRelated,
    confidence: isAppleRelated ? 0.85 : 0.3,
    sentiment,
    sentimentScore,
    creativeArcs,
    summary: postContent.substring(0, 100) + (postContent.length > 100 ? '...' : ''),
  };
}

/**
 * Batch analyzes multiple posts
 */
export async function analyzePostsWithCortex(posts: Array<{ content: string; id?: string }>): Promise<Map<string, CortexAnalysisResult>> {
  const results = new Map<string, CortexAnalysisResult>();

  // Process posts in parallel batches to avoid overwhelming the API
  const batchSize = 10;
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async (post) => {
        const analysis = await analyzePostWithCortex(post.content);
        return { id: post.id, analysis };
      })
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const postId = batch[index].id || `post_${i + index}`;
        results.set(postId, result.value.analysis);
      }
    });
  }

  return results;
}

/**
 * Post data for insight generation
 */
export interface PostInsightData {
  content: {
    summary: string;
    transcript?: string;
    ocrText?: string;
  };
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate?: number;
  };
  creativeArcs?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  platform?: string;
  influencer?: string;
}

/**
 * Insight generation result
 */
export interface InsightResult {
  insight: string;
}

/**
 * Generates an AI insight about what worked/didn't work for a post
 *
 * This function analyzes a post's content, metrics, and metadata to generate
 * actionable insights about performance drivers.
 *
 * @param post - Post data including content, metrics, creative arcs, and sentiment
 * @returns AI-generated insight about what worked/didn't work
 */
export async function generatePostInsight(post: PostInsightData): Promise<InsightResult> {
  // Check if Snowflake credentials are configured
  const isConnected = await connectToSnowflake();

  if (!isConnected) {
    console.warn('Snowflake not configured, using mock insight');
    return generateMockInsight(post);
  }

  // Check if we have password for authentication
  const hasPassword = process.env.SNOWFLAKE_PASSWORD && process.env.SNOWFLAKE_PASSWORD.length > 0;

  if (!hasPassword) {
    console.warn('SNOWFLAKE_PASSWORD not set - using mock insight');
    return generateMockInsight(post);
  }

  try {
    const config: SnowflakeConfig = {
      account: process.env.SNOWFLAKE_ACCOUNT!.replace('.snowflakecomputing.com', ''),
      username: process.env.SNOWFLAKE_USER!,
      password: process.env.SNOWFLAKE_PASSWORD || '',
      warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
      database: process.env.SNOWFLAKE_DATABASE!,
      schema: process.env.SNOWFLAKE_SCHEMA!,
    };

    const engagementRate = post.metrics.engagementRate ||
      (post.metrics.views > 0
        ? ((post.metrics.likes + post.metrics.comments + post.metrics.shares) / post.metrics.views) * 100
        : 0);

    const prompt = `Analyze this social media post about Apple and provide a JSON response with a single field "insight" containing a brief, actionable explanation (2-3 sentences) of what worked or didn't work.

Post details:
- Platform: ${post.platform || 'unknown'}
- Views: ${post.metrics.views.toLocaleString()}
- Engagement Rate: ${engagementRate.toFixed(2)}%
- Creative Arcs: ${post.creativeArcs?.join(', ') || 'uncategorized'}
- Sentiment: ${post.sentiment || 'neutral'}
- Summary: ${post.content.summary}

Focus on explaining WHY the content performed well or poorly based on:
- Content format (e.g., unboxing, tutorial, review)
- Presentation style (e.g., dramatic reveal, ASMR, authentic)
- Apple product focus
- Audience reaction patterns

Respond with valid JSON only: {"insight": "your 2-3 sentence insight here"}.`;

    const query = `
SELECT PARSE_JSON(
  SNOWFLAKE.CORTEX.COMPLETE(
    '${process.env.SNOWFLAKE_CORTEX_MODEL || 'snowflake-arctic'}',
    '${prompt.replace(/'/g, "\\'")}',
    { 'temperature': 0.3, 'max_tokens': 300 }
  )
) as result
    `.trim();

    const accountIdentifier = config.account.includes('-')
      ? config.account
      : `${config.account}.snowflakecomputing.com`;

    const apiUrl = `https://${accountIdentifier}.snowflakecomputing.com/api/v2/statements`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64'),
        'X-Snowflake-Authorization-Token-Type': 'KEY_VALUE_PAIR',
      },
      body: JSON.stringify({
        statement: query,
        database: config.database,
        schema: config.schema,
        warehouse: config.warehouse,
        timeout: 60,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Snowflake API error:', errorText);
      return generateMockInsight(post);
    }

    const data = await response.json();

    // Snowflake async query handling
    if (data.status === 'running' || data.status === 'queued') {
      const result = await pollQueryResult(
        `https://${config.account}.snowflakecomputing.com/api/v2/statements/${data.queryId}`,
        config.username,
        config.password
      );
      return parseInsightResult(result, post);
    }

    return parseInsightResult(data, post);
  } catch (error) {
    console.error('Insight generation error:', error);
    return generateMockInsight(post);
  }
}

/**
 * Parses the insight result from Snowflake response
 */
function parseInsightResult(data: any, fallbackPost: PostInsightData): InsightResult {
  try {
    const rawResult = data.data?.[0]?.[0] || data.rowSet?.[0]?.[0];
    const parsed = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;

    return {
      insight: parsed.insight || generateMockInsight(fallbackPost).insight,
    };
  } catch (error) {
    console.error('Error parsing insight result:', error);
    return generateMockInsight(fallbackPost);
  }
}

/**
 * Mock insight function for when Snowflake is not configured
 * Uses template-based fallback
 */
function generateMockInsight(post: PostInsightData): InsightResult {
  const topArc = post.creativeArcs?.[0] || 'content';
  const engagementRate = post.metrics.engagementRate ||
    (post.metrics.views > 0
      ? ((post.metrics.likes + post.metrics.comments + post.metrics.shares) / post.metrics.views) * 100
      : 0);
  const isHighPerforming = engagementRate > 5;
  const isVeryHighPerforming = engagementRate > 10;

  if (isVeryHighPerforming) {
    return {
      insight: `This ${topArc}-style video significantly outperformed benchmarks with ${engagementRate.toFixed(1)}% engagement. The authentic presentation combined with Apple's brand resonance drove exceptional viral momentum through shares and comments.`,
    };
  }

  if (isHighPerforming) {
    return {
      insight: `This ${topArc}-style post showed strong engagement at ${engagementRate.toFixed(1)}%. The content format resonated well with the target audience, particularly through its focus on Apple product features and authentic delivery.`,
    };
  }

  return {
    insight: `This ${topArc}-style post reached ${formatInsightNumber(post.metrics.views)} views with solid engagement. The content effectively delivered its message to the target audience through Apple-focused messaging.`,
  };
}

/**
 * Formats a number for insight text
 */
function formatInsightNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
