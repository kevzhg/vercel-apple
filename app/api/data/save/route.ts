import { NextRequest, NextResponse } from 'next/server';
import { savePosts, createPostsTable } from '@/lib/snowflake-data-store';
import { DataSourceType } from '@/lib/types';

/**
 * POST /api/data/save
 *
 * Saves analyzed posts to Snowflake for persistence
 *
 * Request body:
 * {
 *   posts: PostData[],
 *   dataSource?: 'monitoring' | 'event' | 'sample'
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { posts, dataSource } = await req.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input: expected non-empty array of posts' },
        { status: 400 }
      );
    }

    // Validate data source if provided
    let sourceType = DataSourceType.SAMPLE;
    if (dataSource) {
      if (dataSource === 'monitoring') sourceType = DataSourceType.MONITORING;
      else if (dataSource === 'event') sourceType = DataSourceType.EVENT;
      else if (dataSource === 'sample') sourceType = DataSourceType.SAMPLE;
      else {
        return NextResponse.json(
          { error: 'Invalid dataSource: must be "monitoring", "event", or "sample"' },
          { status: 400 }
        );
      }
    }

    // Get environment configuration
    const account = process.env.SNOWFLAKE_ACCOUNT || '';
    const database = process.env.SNOWFLAKE_DATABASE || '';
    const schema = process.env.SNOWFLAKE_SCHEMA || '';
    const warehouse = process.env.SNOWFLAKE_WAREHOUSE || '';

    // Ensure table exists
    await createPostsTable(account, database, schema, warehouse);

    // Save posts with data source
    const result = await savePosts(account, database, schema, warehouse, posts, sourceType);

    return NextResponse.json({
      success: true,
      saved: result.success,
      failed: result.failed,
      total: posts.length,
      dataSource: sourceType,
    });
  } catch (error) {
    console.error('Error saving posts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save posts',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Returns information about the save endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/data/save',
    method: 'POST',
    description: 'Save analyzed posts to Snowflake for persistence',
    requestBody: {
      posts: 'Array of PostData objects with cortexAnalysis',
    },
    note: 'Requires OAuth authentication (use browser popup to sign in)',
  });
}
