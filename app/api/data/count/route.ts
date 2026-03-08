import { NextRequest, NextResponse } from 'next/server';
import { getPostsCount, createPostsTable } from '@/lib/snowflake-data-store';
import { DataSourceType } from '@/lib/types';

/**
 * GET /api/data/count?dataSource=monitoring|event|sample
 *
 * Gets the count of stored posts in Snowflake, optionally filtered by data source
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

    const account = process.env.SNOWFLAKE_ACCOUNT || '';
    const database = process.env.SNOWFLAKE_DATABASE || '';
    const schema = process.env.SNOWFLAKE_SCHEMA || '';
    const warehouse = process.env.SNOWFLAKE_WAREHOUSE || '';

    // Ensure table exists
    await createPostsTable(account, database, schema, warehouse);

    const count = await getPostsCount(account, database, schema, warehouse, sourceType);

    return NextResponse.json({
      success: true,
      count,
      dataSource: sourceType,
    });
  } catch (error) {
    console.error('Error getting posts count:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get count',
      },
      { status: 500 }
    );
  }
}
