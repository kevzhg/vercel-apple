// Data types for social media posts and analytics

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
  };
  timestamp: string;
  campaign: string;
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
}

export interface AppleProduct {
  name: string;
  category: 'laptop' | 'phone' | 'tablet' | 'display' | 'accessory';
  price: number;
  keyFeatures: string[];
  targetSegment: 'entry' | 'mid' | 'premium';
}
