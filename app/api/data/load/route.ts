import { NextRequest, NextResponse } from 'next/server';
import { loadPosts, getPostsCount, createPostsTable } from '@/lib/snowflake-data-store';
import { DataSourceType } from '@/lib/types';

/**
 * GET /api/data/load?dataSource=monitoring|event|sample
 *
 * Loads stored posts from Snowflake, optionally filtered by data source
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dataSourceParam = searchParams.get('dataSource');

    // Validate data source if provided
    let sourceType: DataSourceType | undefined = undefined;
    if (dataSourceParam) {
      if (dataSourceParam === 'monitoring') sourceType = DataSourceType.MONITORING;
      else if (dataSourceParam === 'event') sourceType = DataSourceType.EVENT;
      else if (dataSourceParam === 'sample') sourceType = DataSourceType.SAMPLE;
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

    // Get count first
    const count = await getPostsCount(account, database, schema, warehouse, sourceType);

    if (count === 0) {
      return NextResponse.json({
        success: true,
        posts: [],
        count: 0,
        dataSource: sourceType,
        message: 'No stored posts found',
      });
    }

    // Load posts
    const posts = await loadPosts(account, database, schema, warehouse, sourceType);

    return NextResponse.json({
      success: true,
      posts,
      count: posts.length,
      dataSource: sourceType,
    });
  } catch (error) {
    console.error('Error loading posts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load posts',
      },
      { status: 500 }
    );
  }
}
