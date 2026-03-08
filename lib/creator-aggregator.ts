import { PostData } from './types';

/**
 * Creator profile with aggregated metrics
 */
export interface CreatorProfile {
  name: string;
  followers: number;
  platforms: string[];
  totalPosts: number;
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  recentPosts: PostData[];
  topPost?: PostData;
  profileImage?: string;
  insight?: string; // AI-generated insight about what worked/didn't work
}

/**
 * Aggregates posts by creator to build creator profiles
 * @param posts Array of post data
 * @returns Array of creator profiles sorted by follower count
 */
export function aggregateByCreator(posts: PostData[]): CreatorProfile[] {
  const creatorMap = new Map<string, PostData[]>();

  // Group posts by creator name
  for (const post of posts) {
    const name = post.influencer;
    if (!creatorMap.has(name)) {
      creatorMap.set(name, []);
    }
    creatorMap.get(name)!.push(post);
  }

  // Build creator profiles
  const profiles: CreatorProfile[] = [];
  for (const [name, creatorPosts] of creatorMap.entries()) {
    const followers = creatorPosts[0]?.followers || 0;
    const platforms = [...new Set(creatorPosts.map(p => p.platform))];
    const totalViews = creatorPosts.reduce((sum, p) => sum + p.metrics.views, 0);
    const totalEngagement = creatorPosts.reduce(
      (sum, p) => sum + p.metrics.likes + p.metrics.comments + p.metrics.shares,
      0
    );

    // Calculate average engagement rate
    const engagementRates = creatorPosts
      .map(p => p.metrics.engagementRate || (p.metrics.views > 0
        ? ((p.metrics.likes + p.metrics.comments + p.metrics.shares) / p.metrics.views) * 100
        : 0))
      .filter(rate => rate > 0);
    const avgEngagementRate = engagementRates.length > 0
      ? engagementRates.reduce((sum, rate) => sum + rate, 0) / engagementRates.length
      : 0;

    // Get recent posts (sorted by date, most recent first)
    const recentPosts = [...creatorPosts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3);

    // Find top performing post
    const topPost = [...creatorPosts].sort((a, b) => {
      const engagementA = (a.metrics.likes + a.metrics.comments + a.metrics.shares) / (a.metrics.views || 1);
      const engagementB = (b.metrics.likes + b.metrics.comments + b.metrics.shares) / (b.metrics.views || 1);
      return engagementB - engagementA;
    })[0];

    profiles.push({
      name,
      followers,
      platforms,
      totalPosts: creatorPosts.length,
      totalViews,
      totalEngagement,
      avgEngagementRate,
      recentPosts,
      topPost,
    });
  }

  // Sort by follower count (descending)
  return profiles.sort((a, b) => b.followers - a.followers);
}

/**
 * Calculates engagement rate for a single post
 */
export function calculatePostEngagementRate(post: PostData): number {
  if (!post.metrics.views || post.metrics.views === 0) return 0;
  const engagement = post.metrics.likes + post.metrics.comments + post.metrics.shares;
  return (engagement / post.metrics.views) * 100;
}

/**
 * Formats a number for display (e.g., 1500000 -> 1.5M)
 */
export function formatCreatorNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

/**
 * Gets platform icon/color based on platform name
 */
export function getPlatformInfo(platform: string): { color: string; icon: string } {
  const normalized = platform.toLowerCase();
  switch (normalized) {
    case 'instagram':
      return { color: 'from-pink-500 to-purple-500', icon: '📸' };
    case 'tiktok':
      return { color: 'from-gray-800 to-gray-900', icon: '🎵' };
    case 'twitter':
      return { color: 'from-blue-400 to-blue-500', icon: '🐦' };
    default:
      return { color: 'from-gray-500 to-gray-600', icon: '📱' };
  }
}

/**
 * Time period information for a collection of posts
 */
export interface TimePeriod {
  days: number;
  startDate: string;
  endDate: string;
}

/**
 * Calculates the time period (date range) from a collection of posts
 * @param posts Array of post data
 * @returns Time period with days, start date, and end date
 */
export function calculateTimePeriod(posts: PostData[]): TimePeriod {
  if (posts.length === 0) return { days: 0, startDate: '-', endDate: '-' };

  const dates = posts.map(p => new Date(p.timestamp).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const days = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

  return {
    days,
    startDate: new Date(minDate).toLocaleDateString(),
    endDate: new Date(maxDate).toLocaleDateString(),
  };
}

/**
 * Creative arc recommendation with top creator
 */
export interface CreativeArcRecommendation {
  arc: string;
  postCount: number;
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topCreator: {
    name: string;
    followers: number;
    bestPostUrl?: string;
  };
}

/**
 * Gets creative arc recommendations with top creators for each arc
 * @param posts Array of post data
 * @returns Array of creative arc recommendations sorted by post count
 */
export function getCreativeArcRecommendations(
  posts: PostData[]
): CreativeArcRecommendation[] {
  const arcMap = new Map<string, PostData[]>();

  // Group posts by creative arc
  for (const post of posts) {
    const arcs = post.cortexAnalysis?.creativeArcs || ['uncategorized'];
    for (const arc of arcs) {
      if (!arcMap.has(arc)) arcMap.set(arc, []);
      arcMap.get(arc)!.push(post);
    }
  }

  // Build recommendations for each arc
  const recommendations: CreativeArcRecommendation[] = [];
  for (const [arc, arcPosts] of arcMap.entries()) {
    // Calculate metrics
    const totalViews = arcPosts.reduce((sum, p) => sum + p.metrics.views, 0);
    const totalEngagement = arcPosts.reduce(
      (sum, p) => sum + p.metrics.likes + p.metrics.comments + p.metrics.shares,
      0
    );
    const avgEngagement = arcPosts.length > 0
      ? (totalEngagement / totalViews) * 100
      : 0;

    // Find top creator by followers in this arc
    const creatorFollowers = new Map<string, number>();
    const creatorBestPosts = new Map<string, PostData>();

    for (const post of arcPosts) {
      if (post.followers !== undefined) {
        const currentFollowers = creatorFollowers.get(post.influencer) || 0;
        if (post.followers > currentFollowers) {
          creatorFollowers.set(post.influencer, post.followers);
        }
      }
      // Track best post by views for each creator
      const currentBest = creatorBestPosts.get(post.influencer);
      if (!currentBest || post.metrics.views > currentBest.metrics.views) {
        creatorBestPosts.set(post.influencer, post);
      }
    }

    // Get top creator by followers
    const topCreatorEntry = Array.from(creatorFollowers.entries())
      .sort((a, b) => b[1] - a[1])[0];

    const topCreatorName = topCreatorEntry?.[0] || arcPosts[0]?.influencer || 'Unknown';
    const topCreatorFollowers = topCreatorEntry?.[1] || 0;
    const bestPost = creatorBestPosts.get(topCreatorName);

    recommendations.push({
      arc,
      postCount: arcPosts.length,
      totalViews,
      totalEngagement,
      avgEngagementRate: avgEngagement,
      topCreator: {
        name: topCreatorName,
        followers: topCreatorFollowers,
        bestPostUrl: bestPost?.postUrl,
      },
    });
  }

  // Sort by post count and return top 5
  return recommendations
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 5);
}
