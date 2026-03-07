import { PostData } from './types';

/**
 * Sample social media post data for demonstration
 * This simulates a campaign for Apple's new products
 */
export const samplePosts: PostData[] = [
  {
    id: 'post-1',
    platform: 'instagram',
    influencer: '@techcreator_daily',
    content: {
      summary: 'Unboxing the new MacBook Neo in Blush color - Apple\'s most affordable laptop starting at $599! The A18 Pro chip makes everything fly. Perfect for students and creators on a budget.',
      transcript: 'Hey everyone, today I\'m unboxing the new MacBook Neo. This is in Blush which is gorgeous. It starts at just $599 which is incredible for an Apple laptop.',
      ocrText: 'MacBook Neo $599 A18 Pro'
    },
    metrics: {
      views: 1250000,
      likes: 89000,
      comments: 2400,
      shares: 12000
    },
    timestamp: '2026-03-02T14:30:00Z',
    campaign: 'apple_march_2026'
  },
  {
    id: 'post-2',
    platform: 'tiktok',
    influencer: '@creative_studio',
    content: {
      summary: 'Behind the scenes of our MacBook Neo photoshoot! The new colors are stunning - Indigo, Silver, Citrus, and Blush. Can\'t believe this is $599.',
      transcript: 'So we\'re doing this photoshoot for the MacBook Neo and wait until you see these colors in person.',
      ocrText: 'MacBook Neo Behind the Scenes'
    },
    metrics: {
      views: 2800000,
      likes: 156000,
      comments: 5600,
      shares: 34000
    },
    timestamp: '2026-03-03T10:15:00Z',
    campaign: 'apple_march_2026'
  },
  {
    id: 'post-3',
    platform: 'instagram',
    influencer: '@gadget_reviewer',
    content: {
      summary: 'iPhone 17e first look - finally MagSafe comes to the e-series! And 256GB base storage is a game changer. The A19 chip is blazing fast.',
      transcript: 'The iPhone 17e is here and it\'s got MagSafe! Finally! Plus 256GB storage to start.',
      ocrText: 'iPhone 17e MagSafe 256GB'
    },
    metrics: {
      views: 980000,
      likes: 67000,
      comments: 1800,
      shares: 8900
    },
    timestamp: '2026-03-04T16:45:00Z',
    campaign: 'apple_march_2026'
  },
  {
    id: 'post-4',
    platform: 'tiktok',
    influencer: '@tech_lifestyle',
    content: {
      summary: 'Testing the new M4 iPad Air - 30% performance boost is real! The 13-inch model is perfect for creative work. C1X chip makes Wi-Fi blazing fast.',
      transcript: 'So I\'ve been using the M4 iPad Air for a week and the performance boost is noticeable.',
      ocrText: 'M4 iPad Air 30% faster'
    },
    metrics: {
      views: 1650000,
      likes: 92000,
      comments: 3100,
      shares: 18000
    },
    timestamp: '2026-03-05T12:00:00Z',
    campaign: 'apple_march_2026'
  },
  {
    id: 'post-5',
    platform: 'instagram',
    influencer: '@creative_studio',
    content: {
      summary: 'Tutorial: Setting up your new Studio Display XDR. The 5K resolution is insane for creative work. Perfect color accuracy for designers.',
      transcript: 'Let me show you how to set up your Studio Display XDR for the best creative workflow.',
      ocrText: 'Studio Display XDR 5K Tutorial'
    },
    metrics: {
      views: 450000,
      likes: 34000,
      comments: 890,
      shares: 4500
    },
    timestamp: '2026-03-06T09:30:00Z',
    campaign: 'apple_march_2026'
  },
  {
    id: 'post-6',
    platform: 'twitter',
    influencer: '@apple_insider',
    content: {
      summary: 'Hot take: The M5 MacBook Air with 512GB base storage and Wi-Fi 7 is the perfect laptop for 2026. The Bluetooth 6 support is future-proofing done right.',
      ocrText: 'M5 MacBook Air 512GB Wi-Fi 7'
    },
    metrics: {
      views: 3200000,
      likes: 189000,
      comments: 7200,
      shares: 56000
    },
    timestamp: '2026-03-07T08:00:00Z',
    campaign: 'apple_march_2026'
  },
  {
    id: 'post-7',
    platform: 'tiktok',
    influencer: '@techcreator_daily',
    content: {
      summary: 'Comparison: M5 MacBook Pro vs M5 Max. The local AI processing is incredible - both chips are optimized for on-device AI. Which would you choose?',
      transcript: 'Alright let\'s compare the M5 Pro and M5 Max chips in the new MacBook Pro.',
      ocrText: 'M5 Pro vs M5 Max AI'
    },
    metrics: {
      views: 2100000,
      likes: 123000,
      comments: 4500,
      shares: 28000
    },
    timestamp: '2026-03-08T15:20:00Z',
    campaign: 'apple_march_2026'
  },
  {
    id: 'post-8',
    platform: 'instagram',
    influencer: '@gadget_reviewer',
    content: {
      summary: 'First impressions: Studio Display (non-XDR) is perfect for most users. The updated camera and speakers make it worth the $1,599.',
      transcript: 'I\'ve been testing the regular Studio Display and honestly for most people this is all you need.',
      ocrText: 'Studio Display $1599'
    },
    metrics: {
      views: 780000,
      likes: 51000,
      comments: 1400,
      shares: 7200
    },
    timestamp: '2026-03-09T11:45:00Z',
    campaign: 'apple_march_2026'
  },
  {
    id: 'post-9',
    platform: 'tiktok',
    influencer: '@creative_studio',
    content: {
      summary: 'Challenge: Create content entirely on the new MacBook Neo. The A18 Pro chip handles 4K video editing like a champ. Budget-friendly creativity!',
      transcript: 'I challenged myself to create content using only the MacBook Neo and I\'m impressed.',
      ocrText: 'MacBook Neo 4K editing'
    },
    metrics: {
      views: 3400000,
      likes: 178000,
      comments: 6200,
      shares: 42000
    },
    timestamp: '2026-03-10T14:00:00Z',
    campaign: 'apple_march_2026'
  },
  {
    id: 'post-10',
    platform: 'instagram',
    influencer: '@tech_lifestyle',
    content: {
      summary: 'Exclusive reveal: Our campaign with Apple March 2026 products. The creative freedom is amazing. Check out our iPhone 17e content!',
      transcript: 'Excited to share our collaboration with Apple for the March event products.',
      ocrText: 'Apple Campaign March 2026 Exclusive'
    },
    metrics: {
      views: 5200000,
      likes: 234000,
      comments: 8900,
      shares: 67000
    },
    timestamp: '2026-03-11T10:30:00Z',
    campaign: 'apple_march_2026'
  }
];
