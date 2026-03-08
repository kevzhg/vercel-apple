import { NextRequest, NextResponse } from 'next/server';
import { analyzePostWithCortex, connectToSnowflake } from '@/lib/snowflake';

/**
 * Test endpoint for Snowflake Cortex Complete
 *
 * GET /api/cortex/test - Test connection and run a simple analysis
 */
export async function GET(req: NextRequest) {
  const results = {
    connected: false,
    snowflakeConfigured: false,
    analysisResult: null as any,
    error: null as string | null,
  };

  // Check if Snowflake is configured
  try {
    results.snowflakeConfigured = await connectToSnowflake();

    if (results.snowflakeConfigured) {
      results.connected = true;

      // Test with a simple Apple-related post
      const testPost = "Just unboxed the new iPhone 17 Pro - the camera quality is absolutely amazing! Best smartphone I've ever used. #Apple #iPhone";

      const analysis = await analyzePostWithCortex(testPost);
      results.analysisResult = {
        input: testPost,
        isAppleRelated: analysis.isAppleRelated,
        confidence: analysis.confidence,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        creativeArcs: analysis.creativeArcs,
        summary: analysis.summary,
      };

      return NextResponse.json({
        success: true,
        ...results,
        message: 'Snowflake Cortex Complete is working!',
      });
    } else {
      return NextResponse.json({
        success: false,
        ...results,
        message: 'Snowflake environment variables not configured. Check .env file.',
        missingVars: ['SNOWFLAKE_ACCOUNT', 'SNOWFLAKE_USER', 'SNOWFLAKE_WAREHOUSE', 'SNOWFLAKE_DATABASE', 'SNOWFLAKE_SCHEMA']
          .filter(key => !process.env[key])
      });
    }
  } catch (error) {
    results.error = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      ...results,
      message: 'Failed to connect to Snowflake Cortex',
    }, { status: 500 });
  }
}

/**
 * POST /api/cortex/test - Test with custom content
 */
export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Missing "content" in request body' }, { status: 400 });
    }

    const analysis = await analyzePostWithCortex(content);

    return NextResponse.json({
      success: true,
      input: content,
      analysis: {
        isAppleRelated: analysis.isAppleRelated,
        confidence: analysis.confidence,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.sentimentScore,
        creativeArcs: analysis.creativeArcs,
        summary: analysis.summary,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
