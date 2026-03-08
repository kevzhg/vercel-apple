import { NextRequest, NextResponse } from 'next/server';
import { generatePostInsight, PostInsightData } from '@/lib/snowflake';

export const runtime = 'edge';

/**
 * POST /api/cortex/insight
 *
 * Generates AI insights about what worked/didn't work for a post
 *
 * Request body:
 * {
 *   "post": {
 *     "content": { "summary": "...", "transcript": "...", "ocrText": "..." },
 *     "metrics": { "views": 15000000, "likes": 500000, "comments": 50000, "shares": 25000 },
 *     "creativeArcs": ["unboxing", "product-reveal"],
 *     "sentiment": "positive",
 *     "platform": "tiktok",
 *     "influencer": "Creator Name"
 *   }
 * }
 *
 * Response:
 * {
 *   "insight": "This unboxing-style video with dramatic product close-ups drove 3x higher..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post } = body;

    // Validate request
    if (!post) {
      return NextResponse.json(
        { error: 'Missing required field: post' },
        { status: 400 }
      );
    }

    // Validate post has required fields
    if (!post.content || !post.metrics) {
      return NextResponse.json(
        { error: 'Post must include content and metrics' },
        { status: 400 }
      );
    }

    // Generate insight
    const result = await generatePostInsight(post as PostInsightData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Insight API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insight', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cortex/insight
 *
 * Returns API information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cortex/insight',
    method: 'POST',
    description: 'Generate AI insights about post performance',
    requestBody: {
      post: {
        content: {
          summary: 'string (required)',
          transcript: 'string (optional)',
          ocrText: 'string (optional)',
        },
        metrics: {
          views: 'number (required)',
          likes: 'number (required)',
          comments: 'number (required)',
          shares: 'number (required)',
          engagementRate: 'number (optional)',
        },
        creativeArcs: 'array of strings (optional)',
        sentiment: 'string (optional)',
        platform: 'string (optional)',
        influencer: 'string (optional)',
      },
    },
    response: {
      insight: 'string - AI-generated explanation of what worked/didn\'t work',
    },
  });
}
