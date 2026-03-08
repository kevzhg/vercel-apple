import Papa from 'papaparse';
import { PostData } from './types';

/**
 * Raw Creator Monitored Post structure from CSV
 */
export interface ParsedCreatorPost {
  CHANNEL_NAME: string;
  FOLLOWERS?: string;
  IS_SPONSORED?: string;
  PLATFORM: string;
  POST_DESCRIPTION?: string;
  POST_SUMMARY?: string;
  POST_URL: string;
  VIEWS_UNIVERSAL: string;
  PUBLISHED_DATETIME: string;
  LIKES_PUBLIC?: string;
  COMMENTS_PUBLIC?: string;
  SHARES_PUBLIC?: string;
}

/**
 * Validation result for CSV columns
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Required columns for Creator Monitored Posts CSV
 */
const REQUIRED_COLUMNS = [
  'CHANNEL_NAME',
  'PLATFORM',
  'POST_URL',
  'VIEWS_UNIVERSAL',
  'PUBLISHED_DATETIME',
];

/**
 * Optional columns for Creator Monitored Posts CSV
 */
const OPTIONAL_COLUMNS = [
  'FOLLOWERS',
  'IS_SPONSORED',
  'POST_DESCRIPTION',
  'POST_SUMMARY',
  'LIKES_PUBLIC',
  'COMMENTS_PUBLIC',
  'SHARES_PUBLIC',
];

/**
 * Validates that the CSV has all required columns
 */
export function validateCreatorPostColumns(headers: string[]): ValidationResult {
  const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required columns: ${missing.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Normalizes platform string to standard format
 */
export function normalizePlatform(platform: string): 'instagram' | 'tiktok' | 'twitter' {
  const normalized = platform.toLowerCase().trim();
  if (normalized.includes('instagram')) return 'instagram';
  if (normalized.includes('tiktok')) return 'tiktok';
  if (normalized.includes('twitter') || normalized.includes('x')) return 'twitter';
  return 'instagram'; // default fallback
}

/**
 * Normalizes date string from CSV to ISO 8601 format
 * Input: "2025-11-10 16:02:48.000 -0800"
 * Output: "2025-11-10T16:02:48.000-08:00"
 */
export function normalizeDate(dateString: string): string {
  if (!dateString) return new Date().toISOString();

  try {
    // Remove extra spaces and normalize
    const cleaned = dateString.trim();

    // Try to parse the date
    const date = new Date(cleaned);

    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', dateString);
      return new Date().toISOString();
    }

    return date.toISOString();
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return new Date().toISOString();
  }
}

/**
 * Extracts post ID from URL or generates a unique ID
 */
function extractIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Instagram: /p/VIDEO_ID/ or /reel/VIDEO_ID/
    const instagramMatch = pathname.match(/\/(?:p|reel)\/([^\/]+)/);
    if (instagramMatch) return `ig_${instagramMatch[1]}`;

    // TikTok: /@user/video/VIDEO_ID
    const tiktokMatch = pathname.match(/\/video\/(\d+)/);
    if (tiktokMatch) return `tt_${tiktokMatch[1]}`;

    return null;
  } catch {
    return null;
  }
}

/**
 * Generates a unique ID for a post
 */
function generateId(): string {
  return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parses a follower count string (e.g., "5.6M", "1.2K", "1000000") to number
 */
function parseFollowerCount(followers?: string): number {
  if (!followers) return 0;

  const cleaned = followers.toString().toUpperCase().trim();

  // Handle suffixes
  const multipliers: Record<string, number> = {
    'K': 1000,
    'M': 1000000,
    'B': 1000000000,
  };

  for (const [suffix, multiplier] of Object.entries(multipliers)) {
    if (cleaned.endsWith(suffix)) {
      const number = parseFloat(cleaned.slice(0, -1));
      return isNaN(number) ? 0 : Math.round(number * multiplier);
    }
  }

  // Plain number
  const parsed = parseInt(cleaned.replace(/,/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Maps a parsed Creator Post to the standard PostData interface
 */
export function mapToPostData(post: ParsedCreatorPost): PostData {
  const id = extractIdFromUrl(post.POST_URL) || generateId();
  const followers = parseFollowerCount(post.FOLLOWERS);

  return {
    id,
    platform: normalizePlatform(post.PLATFORM),
    influencer: post.CHANNEL_NAME,
    content: {
      summary: post.POST_SUMMARY || post.POST_DESCRIPTION || '',
      transcript: undefined,
      ocrText: undefined,
    },
    metrics: {
      views: parseInt(post.VIEWS_UNIVERSAL) || 0,
      likes: parseInt(post.LIKES_PUBLIC || '0') || 0,
      comments: parseInt(post.COMMENTS_PUBLIC || '0') || 0,
      shares: parseInt(post.SHARES_PUBLIC || '0') || 0,
    },
    timestamp: normalizeDate(post.PUBLISHED_DATETIME),
    campaign: 'Creator Monitored Posts',
    // Additional metadata for Creator Posts
    followers,
    isSponsored: post.IS_SPONSORED === 'true' || post.IS_SPONSORED === 'TRUE',
    postUrl: post.POST_URL,
  } as PostData & { followers: number; isSponsored: boolean; postUrl: string };
}

/**
 * Parses Creator Monitored Posts CSV text
 * @param csvText The raw CSV text content
 * @returns Array of parsed and mapped PostData objects
 */
export function parseCreatorPostsCSV(csvText: string): PostData[] {
  // Parse CSV using papaparse
  const parseResult = Papa.parse<ParsedCreatorPost>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  if (parseResult.errors.length > 0) {
    console.error('CSV parsing errors:', parseResult.errors);
    throw new Error(
      `Failed to parse CSV: ${parseResult.errors.map(e => e.message).join(', ')}`
    );
  }

  if (!parseResult.data || parseResult.data.length === 0) {
    throw new Error('CSV file is empty or has no valid data rows');
  }

  // Validate columns
  const headers = parseResult.meta.fields || [];
  const validation = validateCreatorPostColumns(headers);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Map each row to PostData
  const posts = parseResult.data.map(mapToPostData);

  console.log(`Parsed ${posts.length} posts from Creator Monitored Posts CSV`);

  return posts;
}

/**
 * Calculates statistics from parsed posts
 */
export interface CreatorPostsStats {
  totalPosts: number;
  platformBreakdown: Record<string, number>;
  totalFollowers: number;
  totalViews: number;
  topCampaigns: Array<{ name: string; count: number }>;
}

export function calculateCreatorPostsStats(posts: PostData[]): CreatorPostsStats {
  // Platform breakdown
  const platformBreakdown: Record<string, number> = {};
  posts.forEach(post => {
    platformBreakdown[post.platform] = (platformBreakdown[post.platform] || 0) + 1;
  });

  // Total followers (unique creators)
  const uniqueFollowers = new Map<string, number>();
  posts.forEach(post => {
    const followerData = post as any;
    if (followerData.followers && !uniqueFollowers.has(post.influencer)) {
      uniqueFollowers.set(post.influencer, followerData.followers);
    }
  });
  const totalFollowers = Array.from(uniqueFollowers.values()).reduce((sum, val) => sum + val, 0);

  // Total views
  const totalViews = posts.reduce((sum, post) => sum + post.metrics.views, 0);

  // Extract campaigns/themes from summaries
  const campaignMap = new Map<string, number>();
  posts.forEach(post => {
    const summary = post.content.summary.toLowerCase();

    // Common Apple product campaigns
    if (summary.includes('iphone') || summary.includes('shot on')) {
      campaignMap.set('iPhone', (campaignMap.get('iPhone') || 0) + 1);
    }
    if (summary.includes('macbook') || summary.includes('mac')) {
      campaignMap.set('MacBook', (campaignMap.get('MacBook') || 0) + 1);
    }
    if (summary.includes('ipad')) {
      campaignMap.set('iPad', (campaignMap.get('iPad') || 0) + 1);
    }
    if (summary.includes('apple watch') || summary.includes('watch')) {
      campaignMap.set('Apple Watch', (campaignMap.get('Apple Watch') || 0) + 1);
    }
    if (summary.includes('airpods')) {
      campaignMap.set('AirPods', (campaignMap.get('AirPods') || 0) + 1);
    }
    if (summary.includes('music')) {
      campaignMap.set('Apple Music', (campaignMap.get('Apple Music') || 0) + 1);
    }
    if (summary.includes('tv+')) {
      campaignMap.set('Apple TV+', (campaignMap.get('Apple TV+') || 0) + 1);
    }
  });

  const topCampaigns = Array.from(campaignMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalPosts: posts.length,
    platformBreakdown,
    totalFollowers,
    totalViews,
    topCampaigns,
  };
}
