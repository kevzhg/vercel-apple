import { NextRequest, NextResponse } from 'next/server';
import { analyzePostWithCortex, analyzePostsWithCortex } from '@/lib/snowflake';
import { PostData } from '@/lib/types';

/**
 * POST /api/cortex/analyze
 *
 * Analyzes social media posts using Snowflake Cortex Complete AI
 *
 * Request body:
 * - posts: Array of posts with content to analyze
 *   - Each post should have: { id?: string, content: string }
 *
 * Returns:
 * - analyses: Array of analysis results for each post
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { posts } = body;

    // Validate input
    if (!Array.isArray(posts)) {
      return NextResponse.json(
        { error: 'Invalid input: expected array of posts' },
        { status: 400 }
      );
    }

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'No posts provided for analysis' },
        { status: 400 }
      );
    }

    // Extract content from posts - handle both PostData and simple objects
    const postsToAnalyze = posts.map((post: any) => ({
      id: post.id,
      content: post.content?.summary || post.content?.transcript || post.summary || post.content || '',
    }));

    // Analyze all posts
    const analysesMap = await analyzePostsWithCortex(postsToAnalyze);

    // Convert map to array matching input order
    const analyses = posts.map((post: any, index: number) => {
      const postId = post.id || `post_${index}`;
      return {
        postId,
        ...analysesMap.get(postId),
      };
    });

    return NextResponse.json({
      success: true,
      analyses,
      totalAnalyzed: analyses.length,
    });
  } catch (error) {
    console.error('Cortex analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cortex/analyze
 *
 * Returns information about the Cortex analysis endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cortex/analyze',
    method: 'POST',
    description: 'Analyze social media posts using Snowflake Cortex Complete AI',
    requestBody: {
      posts: 'Array of posts to analyze',
      postFormat: {
        id: 'string (optional)',
        content: 'string | { summary: string, transcript?: string, ocrText?: string }',
      },
    },
    response: {
      success: 'boolean',
      analyses: 'Array of analysis results',
      analysisFormat: {
        postId: 'string',
        isAppleRelated: 'boolean',
        confidence: 'number (0-1)',
        sentiment: "'positive' | 'negative' | 'neutral'",
        sentimentScore: 'number (-1 to 1)',
        creativeArcs: 'string[]',
        summary: 'string',
      },
    },
    note: 'If Snowflake is not configured, returns mock analysis based on keyword matching',
  });
}
