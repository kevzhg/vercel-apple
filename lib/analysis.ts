import { PostData, CampaignAnalysis } from './types';

/**
 * Analyzes social media campaign data to extract insights
 * @param posts Array of post data
 * @returns Campaign analysis with metrics and trends
 */
export function analyzeCampaign(posts: PostData[]): CampaignAnalysis {
  const campaignName = posts[0]?.campaign || 'Unknown Campaign';

  // Calculate totals
  const totalPosts = posts.length;
  const totalViews = posts.reduce((sum, post) => sum + post.metrics.views, 0);
  const totalEngagement = posts.reduce(
    (sum, post) => sum + post.metrics.likes + post.metrics.comments + post.metrics.shares,
    0
  );

  // Calculate average engagement rate
  const averageEngagementRate = posts.length > 0
    ? (totalEngagement / totalViews) * 100
    : 0;

  // Find top influencers
  const influencerMap = new Map<string, { views: number; engagement: number }>();
  posts.forEach(post => {
    const current = influencerMap.get(post.influencer) || { views: 0, engagement: 0 };
    current.views += post.metrics.views;
    current.engagement += post.metrics.likes + post.metrics.comments + post.metrics.shares;
    influencerMap.set(post.influencer, current);
  });

  const topInfluencers = Array.from(influencerMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 10);

  // Extract creative themes from content
  const creativeThemes = extractCreativeThemes(posts);

  // Generate trend data grouped by date
  const trendMap = new Map<string, { views: number; engagement: number }>();
  posts.forEach(post => {
    const date = new Date(post.timestamp).toISOString().split('T')[0];
    const current = trendMap.get(date) || { views: 0, engagement: 0 };
    current.views += post.metrics.views;
    current.engagement += post.metrics.likes + post.metrics.comments + post.metrics.shares;
    trendMap.set(date, current);
  });

  const trendData = Array.from(trendMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    campaignName,
    totalPosts,
    totalViews,
    totalEngagement,
    averageEngagementRate,
    topInfluencers,
    creativeThemes,
    trendData,
  };
}

/**
 * Extracts creative themes from post content
 */
function extractCreativeThemes(posts: PostData[]): string[] {
  const themes = new Set<string>();

  posts.forEach(post => {
    // Extract keywords from summary
    const words = post.content.summary
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4);

    // Look for common creative patterns
    const creativeKeywords = [
      'behind', 'scenes', 'exclusive', 'first', 'look', 'reveal',
      'challenge', 'tutorial', 'transformation', 'story', 'journey',
      'unboxing', 'review', 'comparison', 'test', 'experience',
    ];

    creativeKeywords.forEach(keyword => {
      if (words.some(word => word.includes(keyword))) {
        themes.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

    // Check OCR text for visual themes
    if (post.content.ocrText) {
      const ocrWords = post.content.ocrText.toLowerCase().split(/\s+/);
      if (ocrWords.some(word => word.includes('apple'))) {
        themes.add('Apple Integration');
      }
    }
  });

  return Array.from(themes).slice(0, 8);
}

/**
 * Calculates engagement rate for a post
 */
export function calculateEngagementRate(post: PostData): number {
  const totalEngagement = post.metrics.likes + post.metrics.comments + post.metrics.shares;
  return (totalEngagement / post.metrics.views) * 100;
}

/**
 * Groups posts by platform
 */
export function groupByPlatform(posts: PostData[]): Map<string, PostData[]> {
  const platformMap = new Map<string, PostData[]>();
  posts.forEach(post => {
    const current = platformMap.get(post.platform) || [];
    current.push(post);
    platformMap.set(post.platform, current);
  });
  return platformMap;
}

/**
 * Finds top performing content
 */
export function findTopPerformingPosts(posts: PostData[], limit: number = 5): PostData[] {
  return [...posts]
    .sort((a, b) => {
      const rateA = calculateEngagementRate(a);
      const rateB = calculateEngagementRate(b);
      return rateB - rateA;
    })
    .slice(0, limit);
}
