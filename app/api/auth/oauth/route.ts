import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/oauth
 *
 * Initiates the OAuth flow and returns the authorization URL
 */
export async function GET(req: NextRequest) {
  const account = process.env.SNOWFLAKE_ACCOUNT || '';
  const clientId = process.env.NEXT_PUBLIC_SNOWFLAKE_CLIENT_ID || '';

  if (!account || !clientId) {
    return NextResponse.json(
      { error: 'Snowflake OAuth not configured. Set SNOWFLAKE_ACCOUNT and NEXT_PUBLIC_SNOWFLAKE_CLIENT_ID' },
      { status: 500 }
    );
  }

  const redirectUri = process.env.NEXT_PUBLIC_SNOWFLAKE_REDIRECT_URI ||
    `${req.nextUrl.origin}/api/snowflake/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'session:role:sysadmin',
    state: crypto.randomUUID(),
  });

  const authUrl = `https://${account}.snowflakecomputing.com/oauth/auth?${params.toString()}`;

  return NextResponse.json({
    success: true,
    authUrl,
    redirectUri,
  });
}

/**
 * POST - Validate configuration and return the auth URL directly
 */
export async function POST(req: NextRequest) {
  const account = process.env.SNOWFLAKE_ACCOUNT || '';
  const clientId = process.env.NEXT_PUBLIC_SNOWFLAKE_CLIENT_ID || '';

  if (!account || !clientId) {
    return NextResponse.json(
      { error: 'Snowflake OAuth not configured' },
      { status: 500 }
    );
  }

  const redirectUri = process.env.NEXT_PUBLIC_SNOWFLAKE_REDIRECT_URI ||
    `${req.nextUrl.origin}/api/snowflake/callback`;

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'session:role:sysadmin',
    state,
  });

  const authUrl = `https://${account}.snowflakecomputing.com/oauth/auth?${params.toString()}`;

  return NextResponse.json({
    success: true,
    authUrl,
    state,
  });
}
