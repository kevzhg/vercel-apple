'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { FileUpload } from '@/components/ui/file-upload';
import { PostData, DataSourceType } from '@/lib/types';
import { useSnowflakeData } from '@/hooks/useSnowflakeAuth';

interface UploadedData {
  posts: PostData[];
  stats: {
    totalPosts: number;
    platformBreakdown: Record<string, number>;
    totalFollowers: number;
    totalViews: number;
    topCampaigns: Array<{ name: string; count: number }>;
  };
}

interface UploadSectionData {
  file: File | null;
  isLoading: boolean;
  uploadedData: UploadedData | null;
  error: string | null;
}

export default function UploadPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingStored, setIsLoadingStored] = useState(false);
  const [storedPostsCount, setStoredPostsCount] = useState<number | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Two separate upload sections
  const [monitoringData, setMonitoringData] = useState<UploadSectionData>({
    file: null,
    isLoading: false,
    uploadedData: null,
    error: null,
  });
  const [eventData, setEventData] = useState<UploadSectionData>({
    file: null,
    isLoading: false,
    uploadedData: null,
    error: null,
  });

  const { isAuthenticated, savePosts, loadPosts, getPostsCount, login } = useSnowflakeData();

  // Check for stored posts on mount
  useEffect(() => {
    checkStoredPosts();
    // Load data from sessionStorage on mount
    loadFromSessionStorage();
  }, [isAuthenticated]);

  const checkStoredPosts = async () => {
    if (isAuthenticated) {
      const count = await getPostsCount();
      setStoredPostsCount(count);
    }
  };

  const loadFromSessionStorage = () => {
    // Load monitoring data
    const monitoringPosts = sessionStorage.getItem('monitoringPosts');
    const monitoringStats = sessionStorage.getItem('monitoringPostsStats');
    if (monitoringPosts && monitoringStats) {
      try {
        setMonitoringData(prev => ({
          ...prev,
          uploadedData: {
            posts: JSON.parse(monitoringPosts),
            stats: JSON.parse(monitoringStats),
          },
        }));
      } catch (e) {
        console.error('Error loading monitoring data from sessionStorage:', e);
      }
    }

    // Load event data
    const eventPosts = sessionStorage.getItem('eventPosts');
    const eventStats = sessionStorage.getItem('eventPostsStats');
    if (eventPosts && eventStats) {
      try {
        setEventData(prev => ({
          ...prev,
          uploadedData: {
            posts: JSON.parse(eventPosts),
            stats: JSON.parse(eventStats),
          },
        }));
      } catch (e) {
        console.error('Error loading event data from sessionStorage:', e);
      }
    }
  };

  const handleLogin = async () => {
    const success = await login();
    if (success) {
      // Wait for token to be stored
      setTimeout(checkStoredPosts, 1000);
    }
  };

  const handleLoadFromSnowflake = async () => {
    if (!isAuthenticated) {
      await handleLogin();
      return;
    }

    setIsLoadingStored(true);
    setSaveMessage(null);

    try {
      // Try loading monitoring data
      const monitoringResult = await loadPosts(DataSourceType.MONITORING);
      if (monitoringResult && monitoringResult.posts && monitoringResult.posts.length > 0) {
        setMonitoringData({
          file: null,
          isLoading: false,
          error: null,
          uploadedData: {
            posts: monitoringResult.posts,
            stats: {
              totalPosts: monitoringResult.posts.length,
              platformBreakdown: monitoringResult.posts.reduce((acc: Record<string, number>, post: PostData) => {
                acc[post.platform] = (acc[post.platform] || 0) + 1;
                return acc;
              }, {}),
              totalFollowers: monitoringResult.posts.reduce((sum: number, post: PostData) => sum + (post.followers || 0), 0),
              totalViews: monitoringResult.posts.reduce((sum: number, post: PostData) => sum + post.metrics.views, 0),
              topCampaigns: [],
            },
          },
        });
      }

      // Try loading event data
      const eventResult = await loadPosts(DataSourceType.EVENT);
      if (eventResult && eventResult.posts && eventResult.posts.length > 0) {
        setEventData({
          file: null,
          isLoading: false,
          error: null,
          uploadedData: {
            posts: eventResult.posts,
            stats: {
              totalPosts: eventResult.posts.length,
              platformBreakdown: eventResult.posts.reduce((acc: Record<string, number>, post: PostData) => {
                acc[post.platform] = (acc[post.platform] || 0) + 1;
                return acc;
              }, {}),
              totalFollowers: eventResult.posts.reduce((sum: number, post: PostData) => sum + (post.followers || 0), 0),
              totalViews: eventResult.posts.reduce((sum: number, post: PostData) => sum + post.metrics.views, 0),
              topCampaigns: [],
            },
          },
        });
      }

      const totalPosts = (monitoringResult?.posts.length || 0) + (eventResult?.posts.length || 0);
      if (totalPosts > 0) {
        setSaveMessage({ type: 'success', text: `Loaded ${totalPosts} posts from Snowflake` });
      } else {
        setSaveMessage({ type: 'error', text: 'No stored posts found in Snowflake' });
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load posts from Snowflake' });
    } finally {
      setIsLoadingStored(false);
    }
  };

  const handleSaveToSnowflake = async (section: 'monitoring' | 'event' | 'both') => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      if (!isAuthenticated) {
        await handleLogin();
        // Try saving again after auth
        setTimeout(() => handleSaveToSnowflake(section), 1000);
        return;
      }

      let totalSaved = 0;
      let totalFailed = 0;

      if (section === 'monitoring' || section === 'both') {
        if (monitoringData.uploadedData) {
          const result = await savePosts(monitoringData.uploadedData.posts, DataSourceType.MONITORING);
          totalSaved += result.saved || result.success || 0;
          totalFailed += result.failed || result.failures || 0;
        }
      }

      if (section === 'event' || section === 'both') {
        if (eventData.uploadedData) {
          const result = await savePosts(eventData.uploadedData.posts, DataSourceType.EVENT);
          totalSaved += result.saved || result.success || 0;
          totalFailed += result.failed || result.failures || 0;
        }
      }

      setSaveMessage({
        type: 'success',
        text: `Saved ${totalSaved} posts to Snowflake${totalFailed > 0 ? ` (${totalFailed} failed)` : ''}`,
      });
      setStoredPostsCount(totalSaved);
    } catch (err) {
      setSaveMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save posts to Snowflake',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (selectedFile: File, section: 'monitoring' | 'event') => {
    const setData = section === 'monitoring' ? setMonitoringData : setEventData;

    setData(prev => ({
      ...prev,
      file: selectedFile,
      isLoading: true,
      error: null,
    }));

    try {
      // Read file content
      const text = await selectedFile.text();

      // Parse CSV
      const parseResult = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
      });

      if (parseResult.errors.length > 0) {
        throw new Error(
          `CSV parsing errors: ${parseResult.errors.map(e => e.message).join(', ')}`
        );
      }

      if (!parseResult.data || parseResult.data.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Validate required columns
      const headers = parseResult.meta.fields || [];
      const required = ['CHANNEL_NAME', 'PLATFORM', 'POST_URL', 'VIEWS_UNIVERSAL', 'PUBLISHED_DATETIME'];
      const missing = required.filter(col => !headers.includes(col));

      if (missing.length > 0) {
        throw new Error(`Missing required columns: ${missing.join(', ')}`);
      }

      // Parse posts using the parser
      const { parseCreatorPostsCSV, calculateCreatorPostsStats } = await import('@/lib/creator-posts-parser');
      let posts = parseCreatorPostsCSV(text);

      // Call Cortex API to analyze posts
      try {
        const cortexResponse = await fetch('/api/cortex/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ posts }),
        });

        if (cortexResponse.ok) {
          const { analyses } = await cortexResponse.json();

          // Merge analyses with posts
          posts = posts.map((post, index) => ({
            ...post,
            cortexAnalysis: analyses[index],
          }));
        } else {
          console.warn('Cortex analysis failed, continuing without AI analysis');
        }
      } catch (cortexError) {
        console.warn('Cortex analysis error:', cortexError);
        // Continue without AI analysis
      }

      const stats = calculateCreatorPostsStats(posts);

      // Store in sessionStorage
      const storageKeyPosts = section === 'monitoring' ? 'monitoringPosts' : 'eventPosts';
      const storageKeyStats = section === 'monitoring' ? 'monitoringPostsStats' : 'eventPostsStats';
      const storageKeySource = section === 'monitoring' ? 'dataSource_monitoring' : 'dataSource_event';

      sessionStorage.setItem(storageKeyPosts, JSON.stringify(posts));
      sessionStorage.setItem(storageKeyStats, JSON.stringify(stats));
      sessionStorage.setItem(storageKeySource, section === 'monitoring' ? 'Apple Monitoring' : 'Apple March 2026 Event');

      setData(prev => ({
        ...prev,
        uploadedData: { posts, stats },
      }));
    } catch (err) {
      setData(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to parse CSV file',
        uploadedData: null,
      }));
    } finally {
      setData(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const handleAnalyze = (section: 'monitoring' | 'event' | 'both') => {
    const hasMonitoringData = monitoringData.uploadedData !== null;
    const hasEventData = eventData.uploadedData !== null;

    if (section === 'monitoring' && hasMonitoringData) {
      router.push('/demo?section=monitoring');
    } else if (section === 'event' && hasEventData) {
      router.push('/demo?section=event');
    } else if (section === 'both' && (hasMonitoringData || hasEventData)) {
      router.push('/demo');
    }
  };

  const handleReset = (section: 'monitoring' | 'event') => {
    const setData = section === 'monitoring' ? setMonitoringData : setEventData;
    const storageKeyPosts = section === 'monitoring' ? 'monitoringPosts' : 'eventPosts';
    const storageKeyStats = section === 'monitoring' ? 'monitoringPostsStats' : 'eventPostsStats';
    const storageKeySource = section === 'monitoring' ? 'dataSource_monitoring' : 'dataSource_event';

    // Clear sessionStorage
    sessionStorage.removeItem(storageKeyPosts);
    sessionStorage.removeItem(storageKeyStats);
    sessionStorage.removeItem(storageKeySource);

    setData({
      file: null,
      isLoading: false,
      uploadedData: null,
      error: null,
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Helper component for upload section
  const UploadSection = ({
    title,
    description,
    section,
    data,
  }: {
    title: string;
    description: string;
    section: 'monitoring' | 'event';
    data: UploadSectionData;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>
        {data.uploadedData && (
          <button
            onClick={() => handleReset(section)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear
          </button>
        )}
      </div>

      {!data.uploadedData ? (
        <>
          {data.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {data.error}
            </div>
          )}

          <FileUpload
            onFileSelect={(file) => handleFileSelect(file, section)}
            accept=".csv"
            maxSize={10 * 1024 * 1024}
            label={`Drop ${section === 'monitoring' ? 'Monitoring' : 'Event'} CSV here or click to upload`}
            description="Maximum file size: 10MB"
            disabled={data.isLoading}
          />

          {data.isLoading && (
            <div className="mt-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Parsing CSV file...</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold mb-1">
                {data.uploadedData.stats.totalPosts.toLocaleString()}
              </div>
              <div className="text-xs opacity-90">Posts</div>
            </div>
            <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold mb-1">
                {formatNumber(data.uploadedData.stats.totalViews)}
              </div>
              <div className="text-xs opacity-90">Views</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold mb-1">
                {formatNumber(data.uploadedData.stats.totalFollowers)}
              </div>
              <div className="text-xs opacity-90">Followers</div>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold mb-1">
                {Object.keys(data.uploadedData.stats.platformBreakdown).length}
              </div>
              <div className="text-xs opacity-90">Platforms</div>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="mb-6">
            <div className="flex gap-2 flex-wrap">
              {Object.entries(data.uploadedData.stats.platformBreakdown).map(([platform, count]) => (
                <span
                  key={platform}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
                >
                  {platform}: {count}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleAnalyze(section)}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-secondary-700 transition-colors shadow-lg"
          >
            Analyze {section === 'monitoring' ? 'Monitoring' : 'Event'} Data →
          </button>
        </>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
            Upload Apple Social Data
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Upload CSV files for Apple Monitoring and Apple Event analysis
          </p>

          {/* OAuth Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm font-medium">
                {isAuthenticated ? 'Connected to Snowflake' : 'Not connected to Snowflake'}
              </span>
            </div>

            <button
              onClick={isAuthenticated ? () => { /* logout */ } : handleLogin}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isAuthenticated
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 shadow-lg'
              }`}
            >
              {isAuthenticated ? 'Connected ✓' : 'Connect to Snowflake'}
            </button>

            {isAuthenticated && storedPostsCount !== null && storedPostsCount > 0 && (
              <button
                onClick={handleLoadFromSnowflake}
                disabled={isLoadingStored}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                {isLoadingStored ? 'Loading...' : `Load ${storedPostsCount} Stored Posts`}
              </button>
            )}
          </div>
        </div>

        {/* Save/Load Messages */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            saveMessage.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {saveMessage.text}
          </div>
        )}

        {/* Two Upload Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <UploadSection
            title="Apple Monitoring"
            description="Ongoing creator monitoring data - displays creator profile cards ranked by followers"
            section="monitoring"
            data={monitoringData}
          />
          <UploadSection
            title="Apple March 2026 Event"
            description="Event-specific analysis - displays full event metrics and insights"
            section="event"
            data={eventData}
          />
        </div>

        {/* Combined Actions */}
        {(monitoringData.uploadedData || eventData.uploadedData) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              {(monitoringData.uploadedData || eventData.uploadedData) && (
                <button
                  onClick={() => handleAnalyze('both')}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-secondary-700 transition-colors shadow-lg"
                >
                  View Dashboard →
                </button>
              )}

              {isAuthenticated && (
                <button
                  onClick={() => handleSaveToSnowflake('both')}
                  disabled={isSaving}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save All to Snowflake
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Format Requirements */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4">Required CSV Format</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Both upload sections use the same CSV format with the following required columns:
          </p>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 text-primary-600">Required Columns:</h4>
              <code className="block bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                CHANNEL_NAME, PLATFORM, POST_URL, VIEWS_UNIVERSAL, PUBLISHED_DATETIME
              </code>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-primary-600">Optional Columns:</h4>
              <code className="block bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                FOLLOWERS, IS_SPONSORED, POST_DESCRIPTION, POST_SUMMARY, LIKES_PUBLIC, COMMENTS_PUBLIC, SHARES_PUBLIC
              </code>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
