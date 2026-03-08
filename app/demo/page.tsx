'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { analyzeCampaign, groupByPlatform, findTopPerformingPosts, filterApplePosts, getCreativeArcsBreakdown } from '@/lib/analysis';
import { aggregateByCreator, formatCreatorNumber, calculateTimePeriod, getCreativeArcRecommendations } from '@/lib/creator-aggregator';
import { samplePosts } from '@/lib/sample-data';
import { CampaignAnalysis, PostData, DataSourceType } from '@/lib/types';
import { useSnowflakeData } from '@/hooks/useSnowflakeAuth';
import { CreatorProfileCard } from '@/components/creator-profile-card';
import { CreatorCarousel } from '@/components/creator-carousel';
import { CreativeArcPerformanceChart } from '@/components/charts/creative-arc-chart';
import { CreatorScatterChart } from '@/components/charts/creator-scatter-chart';
import { SentimentTrendChart } from '@/components/charts/sentiment-trend-chart';

function DemoPageContent() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section') as 'monitoring' | 'event' | null;

  const [analysis, setAnalysis] = useState<CampaignAnalysis | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostData[]>([]);
  const [nonApplePosts, setNonApplePosts] = useState<PostData[]>([]);
  const [dataSource, setDataSource] = useState<string>('Sample Data');
  const [showNonApple, setShowNonApple] = useState<boolean>(false);
  const [isLoadingSnowflake, setIsLoadingSnowflake] = useState(false);

  // Monitoring-specific state
  const [creatorProfiles, setCreatorProfiles] = useState<any[]>([]);
  const [creativeArcRecommendations, setCreativeArcRecommendations] = useState<any[]>([]);

  // Data source states
  const [hasMonitoringData, setHasMonitoringData] = useState(false);
  const [hasEventData, setHasEventData] = useState(false);
  const [activeSection, setActiveSection] = useState<'monitoring' | 'event' | 'both'>('both');

  const { isAuthenticated, loadPosts, getPostsCount } = useSnowflakeData();

  useEffect(() => {
    loadData();
    // Set active section from URL param
    if (sectionParam === 'monitoring' || sectionParam === 'event') {
      setActiveSection(sectionParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionParam]);

  const loadData = async () => {
    try {
      // First, check for Snowflake stored data if authenticated
      if (isAuthenticated) {
        try {
          const count = await getPostsCount();
          if (count > 0) {
            setIsLoadingSnowflake(true);
            const result = await loadPosts();
            if (result && result.posts && result.posts.length > 0) {
              const postsFromSnowflake = result.posts;
              setPosts(postsFromSnowflake);
              setDataSource('Snowflake Stored Data');
              processPosts(postsFromSnowflake);
              setIsLoadingSnowflake(false);
              return;
            }
          }
        } catch (error) {
          console.error('Error loading from Snowflake:', error);
        }
        setIsLoadingSnowflake(false);
      }

      // Check for both data sources in sessionStorage
      const monitoringPosts = sessionStorage.getItem('monitoringPosts');
      const eventPosts = sessionStorage.getItem('eventPosts');
      const monitoringSource = sessionStorage.getItem('dataSource_monitoring');
      const eventSource = sessionStorage.getItem('dataSource_event');

      let postsToAnalyze = samplePosts;
      let dataLoaded = false;

      // Check which data sources are available
      if (monitoringPosts) {
        setHasMonitoringData(true);
        if (activeSection === 'monitoring' || (activeSection === 'both' && !eventPosts)) {
          try {
            postsToAnalyze = JSON.parse(monitoringPosts);
            setDataSource(monitoringSource || 'Apple Monitoring');
            dataLoaded = true;
          } catch (error) {
            console.error('Error parsing monitoring data:', error);
          }
        }
      }

      if (eventPosts) {
        setHasEventData(true);
        if (activeSection === 'event' || (activeSection === 'both' && !dataLoaded)) {
          try {
            postsToAnalyze = JSON.parse(eventPosts);
            setDataSource(eventSource || 'Apple March 2026 Event');
            dataLoaded = true;
          } catch (error) {
            console.error('Error parsing event data:', error);
          }
        }
      }

      // Fall back to sample data if nothing else loaded
      if (!dataLoaded) {
        setDataSource('Sample Data');
      }

      setPosts(postsToAnalyze);
      processPosts(postsToAnalyze);
    } catch (error) {
      console.error('Error in loadData:', error);
      // Set sample data as fallback
      setPosts(samplePosts);
      processPosts(samplePosts);
    }
  };

  const processPosts = (postsToAnalyze: PostData[]) => {
    try {
      // Filter Apple-related posts based on Cortex analysis
      const { appleRelated, nonAppleRelated } = filterApplePosts(postsToAnalyze);
      setFilteredPosts(appleRelated);
      setNonApplePosts(nonAppleRelated);

      // Aggregate creators for monitoring section
      const creators = aggregateByCreator(postsToAnalyze);
      setCreatorProfiles(creators);

      // Get creative arc recommendations
      const recommendations = getCreativeArcRecommendations(postsToAnalyze);
      setCreativeArcRecommendations(recommendations);

      // Analyze the data (use filtered posts for metrics)
      const result = analyzeCampaign(appleRelated);
      setAnalysis(result);
    } catch (error) {
      console.error('Error in processPosts:', error);
      // Set empty analysis to prevent infinite loading
      setAnalysis({
        campaignName: 'Error',
        totalPosts: 0,
        totalViews: 0,
        totalEngagement: 0,
        averageEngagementRate: 0,
        topInfluencers: [],
        creativeThemes: [],
        trendData: []
      });
    }
  };

  const switchSection = (section: 'monitoring' | 'event') => {
    try {
      setActiveSection(section);
      // Reload data for the selected section
      const storageKey = section === 'monitoring' ? 'monitoringPosts' : 'eventPosts';
      const sourceKey = section === 'monitoring' ? 'dataSource_monitoring' : 'dataSource_event';
      const data = sessionStorage.getItem(storageKey);
      const source = sessionStorage.getItem(sourceKey);

      if (data) {
        const postsToAnalyze = JSON.parse(data);
        setPosts(postsToAnalyze);
        setDataSource(source || (section === 'monitoring' ? 'Apple Monitoring' : 'Apple March 2026 Event'));
        processPosts(postsToAnalyze);
      }
    } catch (error) {
      console.error('Error in switchSection:', error);
    }
  };

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary-500 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 font-semibold">
            {isLoadingSnowflake ? 'Loading from Snowflake...' : 'Analyzing campaign data...'}
          </p>
          {isLoadingSnowflake && isAuthenticated && (
            <p className="text-sm text-gray-500 mt-2">Fetching your stored posts...</p>
          )}
        </div>
      </div>
    );
  }

  // Check which sections to display
  const isMonitoringView = activeSection === 'monitoring' || (activeSection === 'both' && dataSource.includes('Monitoring'));
  const isEventView = activeSection === 'event' || (activeSection === 'both' && dataSource.includes('Event'));
  const showBothSections = activeSection === 'both' && hasMonitoringData && hasEventData;

  const platformGroups = groupByPlatform(filteredPosts);
  const topPosts = findTopPerformingPosts(filteredPosts, 3);
  const creativeArcsBreakdown = analysis?.creativeArcsBreakdown ? Array.from(analysis.creativeArcsBreakdown.entries()) : [];
  const overallSentiment = analysis?.overallSentiment || 'neutral';
  const sentimentScore = analysis?.sentimentScore || 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold" style={{ color: '#ff005c' }}>
              Apple Analytics Dashboard
            </h1>
            {dataSource !== 'Sample Data' && (
              <span className="px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full text-sm font-bold shadow-lg">
                {dataSource}
              </span>
            )}
          </div>

          {/* Section Switcher */}
          {(hasMonitoringData || hasEventData) && (
            <div className="flex justify-center gap-4 mb-6">
              {hasMonitoringData && (
                <button
                  onClick={() => switchSection('monitoring')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    activeSection === 'monitoring'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
                  }`}
                >
                  📊 Apple Monitoring
                </button>
              )}
              {hasEventData && (
                <button
                  onClick={() => switchSection('event')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    activeSection === 'event'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
                  }`}
                >
                  📅 Apple March 2026 Event
                </button>
              )}
            </div>
          )}

          {/* Reload from Snowflake button */}
          {isAuthenticated && (
            <button
              onClick={loadData}
              disabled={isLoadingSnowflake}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoadingSnowflake ? 'Loading...' : 'Reload from Snowflake'}
            </button>
          )}
        </div>

        {/* Section 1: Apple Monitoring - Creator Rankings */}
        {(isMonitoringView || showBothSections) && (
          <section className="mb-16">
            {creatorProfiles.length > 0 ? (
              <>
                {/* Aggregated Stats Section */}
                {posts.length > 0 && (
                  <div className="rounded-2xl shadow-xl p-8 mb-8 text-white" style={{ backgroundColor: '#ff005c' }}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold">Monitoring Overview</h3>
                        <p className="text-blue-100">
                          {calculateTimePeriod(posts).days} days analyzed ({calculateTimePeriod(posts).startDate} - {calculateTimePeriod(posts).endDate})
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-3xl font-bold">{posts.length.toLocaleString()}</div>
                        <div className="text-blue-100 text-sm">Total Posts</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-3xl font-bold">{formatCreatorNumber(posts.reduce((sum, p) => sum + p.metrics.views, 0))}</div>
                        <div className="text-blue-100 text-sm">Total Views</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-3xl font-bold">{formatCreatorNumber(posts.reduce((sum, p) => sum + p.metrics.likes + p.metrics.comments + p.metrics.shares, 0))}</div>
                        <div className="text-blue-100 text-sm">Total Engagement</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-3xl font-bold">
                          {posts.reduce((sum, p) => sum + p.metrics.views, 0) > 0
                            ? ((posts.reduce((sum, p) => sum + p.metrics.likes + p.metrics.comments + p.metrics.shares, 0) /
                                posts.reduce((sum, p) => sum + p.metrics.views, 0)) * 100).toFixed(2)
                            : '0.00'}%
                        </div>
                        <div className="text-blue-100 text-sm">Engagement Rate</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Creator Rankings - Carousel View */}
                <CreatorCarousel creators={creatorProfiles} maxCreators={10} />

                {/* Show more creators link if there are more than 10 */}
                {creatorProfiles.length > 10 && (
                  <div className="text-center mt-6">
                    <p className="text-gray-500">
                      Showing top 10 of {creatorProfiles.length} creators
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Monitoring Data</h3>
                <p className="text-gray-600 mb-6">Upload Apple Monitoring data to see creator rankings</p>
                <a
                  href="/upload"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-colors"
                >
                  Go to Upload Page
                </a>
              </div>
            )}
          </section>
        )}

        {/* Creative Arcs Recommendations - shown for monitoring view */}
        {(isMonitoringView || showBothSections) && creativeArcRecommendations.length > 0 && (
          <section className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Creative Arcs & Top Creators</h3>
            <p className="text-gray-600 mt-2 mb-6">Content themes and patterns driving performance across creator posts</p>
            <div className="grid md:grid-cols-2 gap-6">
              {creativeArcRecommendations.map((rec) => (
                <div key={rec.arc} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold capitalize text-gray-900">{rec.arc}</h4>
                      <p className="text-gray-500 text-sm">{rec.postCount} posts</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{formatCreatorNumber(rec.totalViews)}</div>
                      <div className="text-gray-500 text-xs">views</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      #
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">Top Creator</div>
                      <div className="font-semibold text-gray-900">{rec.topCreator.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{formatCreatorNumber(rec.topCreator.followers)}</div>
                      <div className="text-xs text-gray-400">followers</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-4">
                    <div className="text-sm text-gray-500">
                      {formatCreatorNumber(rec.totalEngagement)} engagements
                    </div>
                    <div className="text-xs text-gray-400">
                      {rec.avgEngagementRate.toFixed(2)}% avg engagement
                    </div>
                  </div>
                  {rec.topCreator.bestPostUrl && (
                    <a
                      href={rec.topCreator.bestPostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      View Best Post →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Data Visualizations Section */}
        {(isMonitoringView || showBothSections) && creatorProfiles.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent" style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: '#9333ea'
            }}>
              Performance Visualizations
            </h2>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Creative Arc Performance Chart */}
              {creativeArcsBreakdown.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <CreativeArcPerformanceChart
                    creativeArcsBreakdown={new Map(creativeArcsBreakdown)}
                    metric="views"
                  />
                </div>
              )}

              {/* Creator Scatter Plot */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <CreatorScatterChart creators={creatorProfiles} maxCreators={15} />
              </div>
            </div>

            {/* Sentiment Trend Chart - Full Width */}
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <SentimentTrendChart posts={filteredPosts} />
            </div>
          </section>
        )}

        {/* Divider */}
        {showBothSections && (
          <div className="flex items-center justify-center my-12">
            <div className="h-px bg-gray-300 flex-1"></div>
            <span className="px-4 text-gray-400 font-semibold">OR</span>
            <div className="h-px bg-gray-300 flex-1"></div>
          </div>
        )}

        {/* Section 2: Apple March 2026 Event - Event Analysis */}
        {(isEventView || showBothSections) && (
          <section>
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent" style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: '#9900cc'
              }}>
                Apple March 2026 Event
              </h2>
              <p className="text-gray-600 mt-2">Event performance analysis with metrics, sentiment, and creative insights</p>
            </div>
          </section>
        )}

        {/* Event Analysis Content - shown for event view or both sections */}
        {(isEventView || showBothSections) && (
          <>
        {/* Non-Apple Posts Notice */}
        {nonApplePosts.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-8 rounded-r-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-amber-800 mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Non-Apple Related Posts Detected
                </h3>
                <p className="text-amber-700">
                  {nonApplePosts.length} post{nonApplePosts.length !== 1 ? 's were' : ' was'} filtered out as not being Apple-related.
                </p>
              </div>
              <button
                onClick={() => setShowNonApple(!showNonApple)}
                className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-medium transition-colors"
              >
                {showNonApple ? 'Hide' : 'Show'} Filtered Posts
              </button>
            </div>
            {showNonApple && (
              <div className="mt-4 space-y-2">
                {nonApplePosts.slice(0, 5).map(post => (
                  <div key={post.id} className="text-sm bg-white/50 p-3 rounded">
                    <span className="font-medium">{post.influencer}</span>
                    <span className="text-gray-500 ml-2">• {post.content.summary.substring(0, 80)}...</span>
                  </div>
                ))}
                {nonApplePosts.length > 5 && (
                  <p className="text-sm text-amber-600">...and {nonApplePosts.length - 5} more</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Overall Sentiment Indicator */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-extrabold mb-6 bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent dark:from-pink-400 dark:to-orange-400" style={{
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: '#ff005c'
          }}>Overall Campaign Sentiment</h2>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className={`text-7xl ${
              overallSentiment === 'positive' ? 'animate-pulse' :
              overallSentiment === 'negative' ? '' : 'grayscale opacity-70'
            }`}>
              {overallSentiment === 'positive' ? '😊' : overallSentiment === 'negative' ? '😞' : '😐'}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className={`text-3xl font-bold capitalize mb-2 ${
                overallSentiment === 'positive' ? 'text-green-600' :
                overallSentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {overallSentiment === 'positive' ? 'Positive' :
                 overallSentiment === 'negative' ? 'Negative' : 'Neutral'} Sentiment
              </div>
              <div className="text-gray-600 mb-4">
                Sentiment Score: <span className={`font-bold ${
                  sentimentScore > 0.2 ? 'text-green-600' :
                  sentimentScore < -0.2 ? 'text-red-600' : 'text-gray-600'
                }`}>{sentimentScore.toFixed(2)}</span>
                <span className="text-gray-400 ml-2">(range: -1 to +1)</span>
              </div>
              {/* Sentiment bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    sentimentScore > 0 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                    sentimentScore < 0 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                    'bg-gray-400'
                  }`}
                  style={{
                    width: `${Math.abs(sentimentScore) * 50}%`,
                    marginLeft: sentimentScore < 0 ? 'auto' : sentimentScore >= 0 ? '50%' : '0',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1 border-l-4 border-primary-500">
            <div className="text-4xl md:text-5xl font-extrabold text-primary-500 mb-3">
              {analysis.totalPosts.toLocaleString()}
            </div>
            <div className="text-gray-600 font-semibold text-lg">Total Posts</div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1 border-l-4 border-secondary-500">
            <div className="text-4xl md:text-5xl font-extrabold text-secondary-500 mb-3">
              {(analysis.totalViews / 1000000).toFixed(1)}M
            </div>
            <div className="text-gray-600 font-semibold text-lg">Total Views</div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1 border-l-4 border-tertiary-500">
            <div className="text-4xl md:text-5xl font-extrabold text-tertiary-500 mb-3">
              {(analysis.totalEngagement / 1000000).toFixed(1)}M
            </div>
            <div className="text-gray-600 font-semibold text-lg">Total Engagement</div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1 border-l-4 border-primary-500">
            <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent dark:from-pink-400 dark:to-orange-400 mb-3" style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: '#ff005c'
            }}>
              {analysis.averageEngagementRate.toFixed(2)}%
            </div>
            <div className="text-gray-600 font-semibold text-lg">Avg Engagement Rate</div>
          </div>
        </div>

        {/* Top Performing Posts */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent dark:from-pink-400 dark:to-orange-400" style={{
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: '#ff005c'
          }}>Top Performing Posts</h2>
          <div className="space-y-4">
            {topPosts.map((post, index) => {
              const sentiment = post.cortexAnalysis?.sentiment || 'neutral';
              const sentimentEmoji = sentiment === 'positive' ? '😊' : sentiment === 'negative' ? '😞' : '😐';
              const creativeArcs = post.cortexAnalysis?.creativeArcs || [];

              return (
                <div
                  key={post.id}
                  className="border-l-4 border-primary-500 pl-6 py-4 hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent transition-all rounded-r-lg"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-3xl font-extrabold bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent dark:from-pink-400 dark:to-orange-400" style={{
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          color: '#ff005c'
                        }}>#{index + 1}</span>
                        <span className="font-extrabold text-xl text-gray-900">{post.influencer}</span>
                        <span className="text-sm px-3 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full font-bold">
                          {post.platform}
                        </span>
                        {post.cortexAnalysis && (
                          <span
                            className={`text-lg px-2 py-1 rounded-full font-medium ${
                              sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                              sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}
                            title={`Sentiment: ${sentiment}`}
                          >
                            {sentimentEmoji}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{post.content.summary}</p>
                      {creativeArcs.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {creativeArcs.slice(0, 3).map(arc => (
                            <span key={arc} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full capitalize">
                              {arc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right sm:text-left">
                      <div className="text-3xl font-extrabold text-primary-500">
                        {(post.metrics.views / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-sm text-gray-500 font-medium">views</div>
                      {post.metrics.engagementRate && (
                        <div className="text-sm text-gray-400">
                          {post.metrics.engagementRate.toFixed(2)}% engagement
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {Array.from(platformGroups.entries()).map(([platform, posts]) => {
            const platformViews = posts.reduce((sum, p) => sum + p.metrics.views, 0);
            const platformEngagement = posts.reduce(
              (sum, p) => sum + p.metrics.likes + p.metrics.comments + p.metrics.shares,
              0
            );
            const gradientClass =
              platform === 'tiktok'
                ? 'from-primary-500 to-primary-600'
                : platform === 'instagram'
                ? 'from-secondary-500 to-secondary-600'
                : 'from-tertiary-500 to-tertiary-600';

            return (
              <div key={platform} className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className={`w-12 h-12 bg-gradient-to-br ${gradientClass} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold capitalize mb-6 text-gray-900">{platform}</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Posts</span>
                    <span className="text-2xl font-extrabold text-gray-900">{posts.length}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Views</span>
                    <span className="text-2xl font-extrabold text-primary-500">{(platformViews / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Engagement</span>
                    <span className="text-2xl font-extrabold text-secondary-500">{(platformEngagement / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Creative Arcs Breakdown */}
        {creativeArcsBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-3xl font-extrabold mb-6 bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent dark:from-pink-400 dark:to-orange-400" style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: '#ff005c'
            }}>Creative Arcs Analysis</h2>
            <p className="text-gray-600 mb-6">
              AI-detected content patterns and themes across all posts
            </p>
            <div className="space-y-4">
              {creativeArcsBreakdown
                .sort((a, b) => b[1].count - a[1].count)
                .map(([arc, data]) => (
                  <div key={arc} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl font-bold capitalize text-gray-900">
                            {arc === 'uncategorized' ? 'Other' : arc}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                            {data.count} post{data.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-6 text-sm">
                          <span className="text-gray-600">
                            <span className="font-semibold text-primary-600">{(data.totalViews / 1000000).toFixed(1)}M</span> total views
                          </span>
                          <span className="text-gray-600">
                            <span className="font-semibold text-secondary-600">{data.avgEngagementRate.toFixed(2)}%</span> avg engagement
                          </span>
                        </div>
                      </div>
                      <div className="w-full sm:w-48 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                          style={{
                            width: `${(data.count / filteredPosts.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Creative Themes */}
        <div className="bg-gradient-to-br from-primary-500 via-secondary-500 to-tertiary-500 rounded-2xl shadow-xl p-10 mb-12">
          <h2 className="text-3xl font-extrabold mb-8 text-white">Detected Creative Themes</h2>
          <div className="flex flex-wrap gap-4">
            {analysis.creativeThemes.map((theme) => (
              <span
                key={theme}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full text-base font-bold border-2 border-white/30 hover:bg-white/30 transition-all"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Top Influencers */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent dark:from-pink-400 dark:to-orange-400" style={{
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: '#ff005c'
          }}>Top Influencers by Engagement</h2>
          <div className="space-y-4">
            {analysis.topInfluencers.slice(0, 5).map((influencer, index) => {
              const influencerPost = posts.find((p) => p.influencer === influencer.name);
              const followerData = influencerPost as any;
              const followers = followerData?.followers;

              return (
                <div
                  key={influencer.name}
                  className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-extrabold bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent dark:from-pink-400 dark:to-orange-400 w-12" style={{
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: '#ff005c'
                    }}>#{index + 1}</div>
                    <div>
                      <div className="font-extrabold text-lg text-gray-900">{influencer.name}</div>
                      <div className="text-sm text-gray-600 font-medium">
                        {(influencer.views / 1000000).toFixed(1)}M views
                        {followers && (
                          <span className="ml-2">
                            •{' '}
                            {followers >= 1000000
                              ? (followers / 1000000).toFixed(1) + 'M'
                              : followers >= 1000
                              ? (followers / 1000).toFixed(1) + 'K'
                              : followers}{' '}
                            followers
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-secondary-500">
                    {(influencer.engagement / 1000).toFixed(0)}K
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          </>
        )}
      </div>
    </main>
  );
}

// Loading fallback for Suspense
function DemoPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary-500 mx-auto mb-6"></div>
        <p className="text-xl text-gray-600 font-semibold">Loading dashboard...</p>
      </div>
    </div>
  );
}

// Default export with Suspense boundary for useSearchParams
export default function DemoPage() {
  return (
    <Suspense fallback={<DemoPageLoading />}>
      <DemoPageContent />
    </Suspense>
  );
}
