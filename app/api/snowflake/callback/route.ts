import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Callback Handler for Snowflake
 *
 * This endpoint receives the OAuth callback from Snowflake after user authentication
 * The access token is returned in the URL fragment (hash) which we need to handle client-side
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/demo?error=${encodeURIComponent(error)}`, req.url)
    );
  }

  // Redirect to the demo page with success state
  // The actual token will be handled client-side from the URL fragment
  return new NextResponse(`
<!DOCTYPE html>
<html>
<head>
  <title>Authentication Successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .success-box {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
    }
    h1 { color: #10b981; margin: 0 0 10px 0; }
    p { color: #666; }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="success-box">
    <h1>✓ Authentication Successful</h1>
    <p>Redirecting you back...</p>
    <div class="spinner"></div>
  </div>
  <script>
    // Parse the token from the URL fragment (hash)
    const fragment = window.location.hash.substring(1);
    const params = new URLSearchParams(fragment);

    const accessToken = params.get('access_token');
    const serverUrl = params.get('server_url');

    if (accessToken) {
      // Store the token for API calls
      const tokenData = {
        accessToken,
        tokenType: params.get('token_type') || 'Bearer',
        expiresIn: parseInt(params.get('expires_in') || '3600'),
        serverUrl: serverUrl ? decodeURIComponent(serverUrl) : '',
        timestamp: Date.now()
      };

      // Store in sessionStorage
      sessionStorage.setItem('snowflake_token', JSON.stringify(tokenData));

      // Notify parent window (if opened as popup)
      if (window.opener) {
        window.opener.postMessage({ type: 'snowflake_oauth_success', token: tokenData }, '*');
        window.close();
      } else {
        // Redirect to demo page
        window.location.href = '/demo?authenticated=true';
      }
    } else {
      // No token found, redirect with error
      window.location.href = '/demo?error=no_token';
    }
  </script>
</body>
</html>
  `, {
    headers: { 'Content-Type': 'text/html' },
  });
}
