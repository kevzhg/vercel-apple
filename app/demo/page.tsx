'use client';

import { useEffect, useState } from 'react';
import { analyzeCampaign, groupByPlatform, findTopPerformingPosts } from '@/lib/analysis';
import { samplePosts } from '@/lib/sample-data';
import { CampaignAnalysis } from '@/lib/types';

export default function DemoPage() {
  const [analysis, setAnalysis] = useState<CampaignAnalysis | null>(null);

  useEffect(() => {
    // Analyze the sample data
    const result = analyzeCampaign(samplePosts);
    setAnalysis(result);
  }, []);

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing campaign data...</p>
        </div>
      </div>
    );
  }

  const platformGroups = groupByPlatform(samplePosts);
  const topPosts = findTopPerformingPosts(samplePosts, 3);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
            Campaign Analysis Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Apple March 2026 Event - Social Media Performance
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {analysis.totalPosts.toLocaleString()}
            </div>
            <div className="text-gray-600 dark:text-gray-300">Total Posts</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-secondary-600 mb-2">
              {(analysis.totalViews / 1000000).toFixed(1)}M
            </div>
            <div className="text-gray-600 dark:text-gray-300">Total Views</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {(analysis.totalEngagement / 1000000).toFixed(1)}M
            </div>
            <div className="text-gray-600 dark:text-gray-300">Total Engagement</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold text-secondary-600 mb-2">
              {analysis.averageEngagementRate.toFixed(2)}%
            </div>
            <div className="text-gray-600 dark:text-gray-300">Avg Engagement Rate</div>
          </div>
        </div>

        {/* Top Performing Posts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Top Performing Posts</h2>
          <div className="space-y-4">
            {topPosts.map((post, index) => (
              <div
                key={post.id}
                className="border-l-4 border-primary-500 pl-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">#{index + 1}</span>
                      <span className="font-semibold text-lg">{post.influencer}</span>
                      <span className="text-sm px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded">
                        {post.platform}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">{post.content.summary}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {(post.metrics.views / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-gray-500">views</div>
                  </div>
                </div>
              </div>
            ))}
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

            return (
              <div key={platform} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 capitalize">{platform}</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Posts</div>
                    <div className="text-2xl font-semibold">{posts.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Views</div>
                    <div className="text-2xl font-semibold">{(platformViews / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Engagement</div>
                    <div className="text-2xl font-semibold">{(platformEngagement / 1000000).toFixed(1)}M</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Creative Themes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Detected Creative Themes</h2>
          <div className="flex flex-wrap gap-3">
            {analysis.creativeThemes.map((theme) => (
              <span
                key={theme}
                className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full text-sm font-medium"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Top Influencers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Top Influencers by Engagement</h2>
          <div className="space-y-3">
            {analysis.topInfluencers.slice(0, 5).map((influencer, index) => (
              <div
                key={influencer.name}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-primary-600">#{index + 1}</div>
                  <div>
                    <div className="font-semibold">{influencer.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {(influencer.views / 1000000).toFixed(1)}M views
                    </div>
                  </div>
                </div>
                <div className="text-xl font-semibold text-secondary-600">
                  {(influencer.engagement / 1000).toFixed(0)}K
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
