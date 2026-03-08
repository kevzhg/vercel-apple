import { NextRequest, NextResponse } from 'next/server';
import { analyzeCampaign } from '@/lib/analysis';
import { PostData } from '@/lib/types';
import { parseCreatorPostsCSV, calculateCreatorPostsStats } from '@/lib/creator-posts-parser';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    // Handle CSV file upload
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const csvFile = formData.get('csv') as File;

      if (!csvFile) {
        return NextResponse.json(
          { error: 'No CSV file provided' },
          { status: 400 }
        );
      }

      // Validate file type
      if (!csvFile.name.endsWith('.csv')) {
        return NextResponse.json(
          { error: 'Invalid file type. Please upload a CSV file.' },
          { status: 400 }
        );
      }

      // Read and parse CSV
      const csvText = await csvFile.text();
      const posts = parseCreatorPostsCSV(csvText);
      const stats = calculateCreatorPostsStats(posts);

      // Analyze the campaign data
      const analysis = analyzeCampaign(posts);

      return NextResponse.json({
        ...analysis,
        dataSource: 'Creator Monitored Posts',
        totalPostsUploaded: posts.length,
        stats,
      });
    }

    // Handle JSON input (existing behavior)
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
      {
        error: 'Failed to analyze campaign data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'POST your social media post data here to analyze campaigns',
    supports: {
      json: 'Array of PostData objects',
      csv: 'Creator Monitored Posts CSV file (multipart/form-data with "csv" field)',
    },
    jsonFormat: {
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
    },
    csvFormat: {
      requiredColumns: [
        'CHANNEL_NAME',
        'PLATFORM',
        'POST_URL',
        'VIEWS_UNIVERSAL',
        'PUBLISHED_DATETIME'
      ],
      optionalColumns: [
        'FOLLOWERS',
        'IS_SPONSORED',
        'POST_DESCRIPTION',
        'POST_SUMMARY',
        'LIKES_PUBLIC',
        'COMMENTS_PUBLIC',
        'SHARES_PUBLIC'
      ]
    }
  });
}
