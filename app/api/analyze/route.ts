import { NextRequest, NextResponse } from 'next/server';
import { analyzeCampaign } from '@/lib/analysis';
import { PostData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const posts: PostData[] = await request.json();

    // Validate input
    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input: expected non-empty array of posts' },
        { status: 400 }
      );
    }

    // Analyze the campaign data
    const analysis = analyzeCampaign(posts);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze campaign data' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'POST your social media post data here to analyze campaigns',
    expectedFormat: {
      id: 'string',
      platform: 'instagram | tiktok | twitter',
      influencer: 'string',
      content: {
        summary: 'string',
        transcript: 'string (optional)',
        ocrText: 'string (optional)'
      },
      metrics: {
        views: 'number',
        likes: 'number',
        comments: 'number',
        shares: 'number'
      },
      timestamp: 'ISO date string',
      campaign: 'string'
    }
  });
}
