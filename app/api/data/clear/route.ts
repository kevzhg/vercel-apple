import { NextRequest, NextResponse } from 'next/server';
import { clearStoredPosts, getPostsCount } from '@/lib/snowflake-data-store';

/**
 * DELETE /api/data/clear
 *
 * Clears all stored posts from Snowflake
 */
export async function DELETE(req: NextRequest) {
  try {
    const account = process.env.SNOWFLAKE_ACCOUNT || '';
    const database = process.env.SNOWFLAKE_DATABASE || '';
    const schema = process.env.SNOWFLAKE_SCHEMA || '';
    const warehouse = process.env.SNOWFLAKE_WAREHOUSE || '';

    // Get count before clearing
    const count = await getPostsCount(account, database, schema, warehouse);

    // Clear posts
    const success = await clearStoredPosts(account, database, schema, warehouse);

    return NextResponse.json({
      success,
      cleared: count,
      message: success ? `Cleared ${count} stored posts` : 'Failed to clear posts',
    });
  } catch (error) {
    console.error('Error clearing posts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear posts',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Returns information about the clear endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/data/clear',
    method: 'DELETE',
    description: 'Clear all stored posts from Snowflake',
    warning: 'This will permanently delete all stored posts',
  });
}
