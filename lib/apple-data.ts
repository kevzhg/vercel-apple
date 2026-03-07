import { AppleProduct } from './types';

/**
 * Apple products from March 2026 event
 */
export const appleProducts: AppleProduct[] = [
  {
    name: 'MacBook Neo',
    category: 'laptop',
    price: 599,
    keyFeatures: [
      'A18 Pro chip (from iPhone 16 Pro)',
      '13-inch display',
      'Most affordable MacBook',
      'Colors: Blush, Indigo, Silver, Citrus',
      'Touch ID available as upgrade'
    ],
    targetSegment: 'entry'
  },
  {
    name: 'iPhone 17e',
    category: 'phone',
    price: 599,
    keyFeatures: [
      '256GB base storage (upgraded)',
      'MagSafe charging (first for e-series)',
      'A19 chip',
      'C1X modem for faster networking',
      'Entry-level smartphone'
    ],
    targetSegment: 'entry'
  },
  {
    name: 'M4 iPad Air',
    category: 'tablet',
    price: 599,
    keyFeatures: [
      'M4 chip (30% performance boost)',
      '11-inch and 13-inch sizes',
      'Touch ID',
      'C1X chip for Wi-Fi and 5G',
      'Available at $599 (11") and $799 (13")'
    ],
    targetSegment: 'mid'
  },
  {
    name: 'Studio Display',
    category: 'display',
    price: 1599,
    keyFeatures: [
      '27-inch size',
      'Improved camera',
      'Enhanced speakers',
      'Better port selection',
      'First update in 4 years'
    ],
    targetSegment: 'premium'
  },
  {
    name: 'Studio Display XDR',
    category: 'display',
    price: 3299,
    keyFeatures: [
      '5K resolution',
      'Higher brightness',
      'Advanced backlight technology',
      'Higher refresh rate',
      'Pro Display XDR replacement'
    ],
    targetSegment: 'premium'
  },
  {
    name: 'MacBook Pro M5 Pro/Max',
    category: 'laptop',
    price: 2199,
    keyFeatures: [
      'M5 Pro and M5 Max chips',
      'Optimized for local AI processing',
      'Wi-Fi 7 support',
      '14-inch ($2,199) and 16-inch ($2,699)',
      'Pro performance laptop'
    ],
    targetSegment: 'premium'
  },
  {
    name: 'M5 MacBook Air',
    category: 'laptop',
    price: 1099,
    keyFeatures: [
      'M5 base chip',
      'Wi-Fi 7 and Bluetooth 6',
      '512GB base storage (doubled)',
      '13-inch ($1,099) and 15-inch ($1,299)',
      'World\'s most popular laptop'
    ],
    targetSegment: 'mid'
  }
];

/**
 * Get products by target segment
 */
export function getProductsBySegment(segment: 'entry' | 'mid' | 'premium'): AppleProduct[] {
  return appleProducts.filter(product => product.targetSegment === segment);
}

/**
 * Get product by name
 */
export function getProductByName(name: string): AppleProduct | undefined {
  return appleProducts.find(product =>
    product.name.toLowerCase().includes(name.toLowerCase())
  );
}

/**
 * Get all product categories
 */
export function getProductCategories(): string[] {
  return Array.from(new Set(appleProducts.map(p => p.category)));
}
