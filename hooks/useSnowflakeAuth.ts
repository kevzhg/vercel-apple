/**
 * React Hook for Snowflake OAuth Authentication
 */

import { useState, useEffect, useCallback } from 'react';

export interface SnowflakeToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  serverUrl: string;
  timestamp: number;
}

export function useSnowflakeAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<SnowflakeToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored token on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('snowflake_token');
    if (stored) {
      try {
        const tokenData = JSON.parse(stored);
        // Check if token is expired (1 hour default)
        const isExpired = Date.now() - tokenData.timestamp > (tokenData.expiresIn * 1000);

        if (!isExpired) {
          setToken(tokenData);
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem('snowflake_token');
        }
      } catch (error) {
        console.error('Error parsing stored token:', error);
        sessionStorage.removeItem('snowflake_token');
      }
    }
    setIsLoading(false);

    // Listen for OAuth success message from popup
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data.type === 'snowflake_oauth_success') {
        const tokenData = event.data.token;
        sessionStorage.setItem('snowflake_token', JSON.stringify(tokenData));
        setToken(tokenData);
        setIsAuthenticated(true);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const login = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/oauth');
      const data = await response.json();

      if (data.success && data.authUrl) {
        // Open popup for OAuth flow
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          data.authUrl,
          'snowflake-oauth',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        return !!popup;
      }
      return false;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('snowflake_token');
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    token,
    isLoading,
    login,
    logout,
  };
}

/**
 * Hook for Snowflake data operations (save/load posts)
 */
export function useSnowflakeData() {
  const { isAuthenticated, token, login } = useSnowflakeAuth();

  const savePosts = async (posts: any[], dataSource?: string) => {
    if (!isAuthenticated) {
      const loggedIn = await login();
      if (!loggedIn) {
        throw new Error('Authentication required');
      }
    }

    const response = await fetch('/api/data/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts, dataSource }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save posts');
    }

    return response.json();
  };

  const loadPosts = async (dataSource?: string) => {
    if (!isAuthenticated) {
      return null;
    }

    const url = dataSource
      ? `/api/data/load?dataSource=${encodeURIComponent(dataSource)}`
      : '/api/data/load';

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load posts');
    }

    return response.json();
  };

  const getPostsCount = async (dataSource?: string) => {
    if (!isAuthenticated) {
      return 0;
    }

    const url = dataSource
      ? `/api/data/count?dataSource=${encodeURIComponent(dataSource)}`
      : '/api/data/count';

    const response = await fetch(url);
    const data = await response.json();
    return data.count || 0;
  };

  const clearPosts = async () => {
    if (!isAuthenticated) {
      return false;
    }

    const response = await fetch('/api/data/clear', { method: 'DELETE' });
    const data = await response.json();
    return data.success;
  };

  return {
    isAuthenticated,
    savePosts,
    loadPosts,
    getPostsCount,
    clearPosts,
    login,
  };
}
