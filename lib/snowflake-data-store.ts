/**
 * Snowflake Data Store for Persisting Analyzed Posts
 *
 * This module handles saving and loading analyzed posts to/from Snowflake
 */

import { PostData, CortexAnalysis, DataSourceType } from './types';
import { executeQueryWithOAuth, getStoredToken } from './snowflake-oauth';

const TABLE_NAME = 'SOCIAL_POSTS_ANALYSIS';

/**
 * Creates the posts table in Snowflake if it doesn't exist
 */
export async function createPostsTable(
  account: string,
  database: string,
  schema: string,
  warehouse: string
): Promise<boolean> {
  try {
    const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${database}.${schema}.${TABLE_NAME} (
  ID VARCHAR,
  DATA_SOURCE VARCHAR,
  PLATFORM VARCHAR,
  INFLUENCER VARCHAR,
  CONTENT_SUMMARY VARCHAR,
  CONTENT_TRANSCRIPT VARIANT,
  CONTENT_OCR_TEXT VARIANT,
  METRICS_VIEWS NUMBER,
  METRICS_LIKES NUMBER,
  METRICS_COMMENTS NUMBER,
  METRICS_SHARES NUMBER,
  METRICS_ENGAGEMENT_RATE FLOAT,
  TIMESTAMP TIMESTAMP_NTZ,
  CAMPAIGN VARCHAR,
  FOLLOWERS NUMBER,
  IS_SPONSORED BOOLEAN,
  POST_URL VARCHAR,
  CORTEX_IS_APPLE_RELATED BOOLEAN,
  CORTEX_CONFIDENCE FLOAT,
  CORTEX_SENTIMENT VARCHAR,
  CORTEX_SENTIMENT_SCORE FLOAT,
  CORTEX_CREATIVE_ARCS ARRAY,
  CORTEX_SUMMARY VARCHAR,
  UPLOADED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  UPDATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (ID, DATA_SOURCE)
);

-- Create a variant column for easier querying
ALTER TABLE ${database}.${schema}.${TABLE_NAME} ADD COLUMN IF NOT EXISTS METRICS VARIANT;
ALTER TABLE ${database}.${schema}.${TABLE_NAME} ADD COLUMN IF NOT EXISTS CORTEX_ANALYSIS VARIANT;
    `.trim();

    await executeQueryWithOAuth(account, database, schema, warehouse, createTableSQL);
    console.log('Posts table created/verified');
    return true;
  } catch (error) {
    console.error('Error creating posts table:', error);
    return false;
  }
}

/**
 * Saves a single post to Snowflake
 */
export async function savePost(
  account: string,
  database: string,
  schema: string,
  warehouse: string,
  post: PostData,
  dataSource: DataSourceType = DataSourceType.SAMPLE
): Promise<boolean> {
  try {
    const cortex = post.cortexAnalysis;

    const insertSQL = `
INSERT INTO ${database}.${schema}.${TABLE_NAME} (
  ID, DATA_SOURCE, PLATFORM, INFLUENCER, CONTENT_SUMMARY, CONTENT_TRANSCRIPT, CONTENT_OCR_TEXT,
  METRICS_VIEWS, METRICS_LIKES, METRICS_COMMENTS, METRICS_SHARES, METRICS_ENGAGEMENT_RATE,
  TIMESTAMP, CAMPAIGN, FOLLOWERS, IS_SPONSORED, POST_URL,
  CORTEX_IS_APPLE_RELATED, CORTEX_CONFIDENCE, CORTEX_SENTIMENT, CORTEX_SENTIMENT_SCORE,
  CORTEX_CREATIVE_ARCS, CORTEX_SUMMARY,
  UPDATED_AT
) VALUES (
  '${post.id}',
  '${dataSource}',
  '${post.platform}',
  '${post.influencer.replace(/'/g, "''")}',
  '${post.content.summary.replace(/'/g, "''")}',
  ${post.content.transcript ? `'${post.content.transcript.replace(/'/g, "''")}'` : 'NULL'},
  ${post.content.ocrText ? `'${post.content.ocrText.replace(/'/g, "''")}'` : 'NULL'},
  ${post.metrics.views},
  ${post.metrics.likes},
  ${post.metrics.comments},
  ${post.metrics.shares},
  ${post.metrics.engagementRate || 0},
  '${post.timestamp}',
  '${post.campaign.replace(/'/g, "''")}',
  ${post.followers || 'NULL'},
  ${post.isSponsored ? 'TRUE' : 'FALSE'},
  ${post.postUrl ? `'${post.postUrl}'` : 'NULL'},
  ${cortex?.isAppleRelated ? 'TRUE' : 'FALSE'},
  ${cortex?.confidence || 0},
  '${cortex?.sentiment || 'neutral'}',
  ${cortex?.sentimentScore || 0},
  ${cortex?.creativeArcs ? `ARRAY_CONSTRUCT(${cortex.creativeArcs.map(a => `'${a}'`).join(', ')})` : 'ARRAY_CONSTRUCT()'},
  ${cortex?.summary ? `'${cortex.summary.replace(/'/g, "''")}'` : 'NULL'},
  CURRENT_TIMESTAMP()
)
ON CONFLICT (ID, DATA_SOURCE) DO UPDATE SET
  CORTEX_IS_APPLE_RELATED = ${cortex?.isAppleRelated ? 'TRUE' : 'FALSE'},
  CORTEX_CONFIDENCE = ${cortex?.confidence || 0},
  CORTEX_SENTIMENT = '${cortex?.sentiment || 'neutral'}',
  CORTEX_SENTIMENT_SCORE = ${cortex?.sentimentScore || 0},
  CORTEX_CREATIVE_ARCS = ${cortex?.creativeArcs ? `ARRAY_CONSTRUCT(${cortex.creativeArcs.map(a => `'${a}'`).join(', ')})` : 'ARRAY_CONSTRUCT()'},
  CORTEX_SUMMARY = ${cortex?.summary ? `'${cortex.summary.replace(/'/g, "''")}'` : 'NULL'},
  UPDATED_AT = CURRENT_TIMESTAMP();
    `.trim();

    await executeQueryWithOAuth(account, database, schema, warehouse, insertSQL);
    return true;
  } catch (error) {
    console.error(`Error saving post ${post.id}:`, error);
    return false;
  }
}

/**
 * Saves multiple posts to Snowflake in batch
 */
export async function savePosts(
  account: string,
  database: string,
  schema: string,
  warehouse: string,
  posts: PostData[],
  dataSource: DataSourceType = DataSourceType.SAMPLE
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const post of posts) {
    const result = await savePost(account, database, schema, warehouse, post, dataSource);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Loads all posts from Snowflake
 * @param dataSource Optional data source filter
 */
export async function loadPosts(
  account: string,
  database: string,
  schema: string,
  warehouse: string,
  dataSource?: DataSourceType
): Promise<PostData[]> {
  try {
    const dataSourceFilter = dataSource ? `WHERE DATA_SOURCE = '${dataSource}'` : '';
    const selectSQL = `
SELECT
  ID, DATA_SOURCE, PLATFORM, INFLUENCER, CONTENT_SUMMARY, CONTENT_TRANSCRIPT, CONTENT_OCR_TEXT,
  METRICS_VIEWS, METRICS_LIKES, METRICS_COMMENTS, METRICS_SHARES, METRICS_ENGAGEMENT_RATE,
  TIMESTAMP, CAMPAIGN, FOLLOWERS, IS_SPONSORED, POST_URL,
  CORTEX_IS_APPLE_RELATED, CORTEX_CONFIDENCE, CORTEX_SENTIMENT, CORTEX_SENTIMENT_SCORE,
  CORTEX_CREATIVE_ARCS, CORTEX_SUMMARY
FROM ${database}.${schema}.${TABLE_NAME}
${dataSourceFilter}
ORDER BY TIMESTAMP DESC
    `.trim();

    const result = await executeQueryWithOAuth(account, database, schema, warehouse, selectSQL);

    // Parse the result
    const rows = result.data?.[0] || result.rowSet || [];
    const posts: PostData[] = [];

    for (const row of rows) {
      // Handle both array format and object format
      const data = Array.isArray(row) ? {
        ID: row[0], DATA_SOURCE: row[1], PLATFORM: row[2], INFLUENCER: row[3],
        CONTENT_SUMMARY: row[4], CONTENT_TRANSCRIPT: row[5], CONTENT_OCR_TEXT: row[6],
        METRICS_VIEWS: row[7], METRICS_LIKES: row[8], METRICS_COMMENTS: row[9],
        METRICS_SHARES: row[10], METRICS_ENGAGEMENT_RATE: row[11], TIMESTAMP: row[12],
        CAMPAIGN: row[13], FOLLOWERS: row[14], IS_SPONSORED: row[15], POST_URL: row[16],
        CORTEX_IS_APPLE_RELATED: row[17], CORTEX_CONFIDENCE: row[18], CORTEX_SENTIMENT: row[19],
        CORTEX_SENTIMENT_SCORE: row[20], CORTEX_CREATIVE_ARCS: row[21], CORTEX_SUMMARY: row[22],
      } : row;

      posts.push({
        id: data.ID,
        platform: data.PLATFORM?.toLowerCase() || 'instagram',
        influencer: data.INFLUENCER,
        content: {
          summary: data.CONTENT_SUMMARY || '',
          transcript: data.CONTENT_TRANSCRIPT || undefined,
          ocrText: data.CONTENT_OCR_TEXT || undefined,
        },
        metrics: {
          views: data.METRICS_VIEWS || 0,
          likes: data.METRICS_LIKES || 0,
          comments: data.METRICS_COMMENTS || 0,
          shares: data.METRICS_SHARES || 0,
          engagementRate: data.METRICS_ENGAGEMENT_RATE || undefined,
        },
        timestamp: data.TIMESTAMP,
        campaign: data.CAMPAIGN || 'Stored Posts',
        followers: data.FOLLOWERS || undefined,
        isSponsored: data.IS_SPONSORED === true,
        postUrl: data.POST_URL || undefined,
        cortexAnalysis: data.CORTEX_IS_APPLE_RELATED !== null ? {
          isAppleRelated: data.CORTEX_IS_APPLE_RELATED,
          confidence: data.CORTEX_CONFIDENCE || 0,
          sentiment: data.CORTEX_SENTIMENT || 'neutral',
          sentimentScore: data.CORTEX_SENTIMENT_SCORE || 0,
          creativeArcs: Array.isArray(data.CORTEX_CREATIVE_ARCS) ? data.CORTEX_CREATIVE_ARCS : [],
          summary: data.CORTEX_SUMMARY || '',
        } : undefined,
      });
    }

    return posts;
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
}

/**
 * Gets the count of posts in storage
 * @param dataSource Optional data source filter
 */
export async function getPostsCount(
  account: string,
  database: string,
  schema: string,
  warehouse: string,
  dataSource?: DataSourceType
): Promise<number> {
  try {
    const dataSourceFilter = dataSource ? `WHERE DATA_SOURCE = '${dataSource}'` : '';
    const countSQL = `
SELECT COUNT(*) as count FROM ${database}.${schema}.${TABLE_NAME} ${dataSourceFilter}
    `.trim();

    const result = await executeQueryWithOAuth(account, database, schema, warehouse, countSQL);
    const count = result.data?.[0]?.[0]?.count || result.rowSet?.[0]?.[0]?.count || 0;
    return typeof count === 'number' ? count : parseInt(count) || 0;
  } catch (error) {
    console.error('Error getting posts count:', error);
    return 0;
  }
}

/**
 * Clears all stored posts
 */
export async function clearStoredPosts(
  account: string,
  database: string,
  schema: string,
  warehouse: string
): Promise<boolean> {
  try {
    const deleteSQL = `TRUNCATE TABLE ${database}.${schema}.${TABLE_NAME}`;
    await executeQueryWithOAuth(account, database, schema, warehouse, deleteSQL);
    return true;
  } catch (error) {
    console.error('Error clearing posts:', error);
    return false;
  }
}
