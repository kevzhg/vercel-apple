// Data types for social media posts and analytics

/**
 * Data source types for distinguishing between different datasets
 */
export enum DataSourceType {
  MONITORING = 'monitoring',
  EVENT = 'event',
  SAMPLE = 'sample'
}

export interface DataSource {
  type: DataSourceType;
  name: string;
  posts: PostData[];
  stats?: any;
}

export interface CortexAnalysis {
  isAppleRelated: boolean;
  confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number; // -1 to 1
  creativeArcs: string[];
  summary: string;
}

export interface PostData {
  id: string;
  platform: 'instagram' | 'tiktok' | 'twitter';
  influencer: string;
  content: {
    summary: string;
    transcript?: string;
    ocrText?: string;
  };
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate?: number; // Calculated as (likes + comments + shares) / views * 100
  };
  timestamp: string;
  campaign: string;
  // Creator Posts specific fields (optional)
  followers?: number;
  isSponsored?: boolean;
  postUrl?: string;
  // Snowflake Cortex Analysis (optional)
  cortexAnalysis?: CortexAnalysis;
}

export interface CampaignAnalysis {
  campaignName: string;
  totalPosts: number;
  totalViews: number;
  totalEngagement: number;
  averageEngagementRate: number;
  topInfluencers: Array<{
    name: string;
    views: number;
    engagement: number;
  }>;
  creativeThemes: string[];
  trendData: Array<{
    date: string;
    views: number;
    engagement: number;
  }>;
  // Cortex Analysis fields
  overallSentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  creativeArcsBreakdown?: Map<string, {
    count: number;
    avgEngagementRate: number;
    totalViews: number;
  }>;
  nonApplePostCount?: number;
}

export interface AppleProduct {
  name: string;
  category: 'laptop' | 'phone' | 'tablet' | 'display' | 'accessory';
  price: number;
  keyFeatures: string[];
  targetSegment: 'entry' | 'mid' | 'premium';
}
