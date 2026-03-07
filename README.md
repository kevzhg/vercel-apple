# Social Media Analytics Presentation Platform

A Next.js application for visualizing social media campaign performance data, designed for presenting to Apple.

## Project Overview

This platform demonstrates advanced social media analytics capabilities including:
- Post analysis using summaries, transcripts, and OCR data
- Trend detection across campaigns
- Creative pattern recognition
- Interactive data visualization

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm, bun, or pnpm package manager

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
```

## Deployment

This project is optimized for Vercel deployment:

```bash
vercel deploy
```

Or connect your Git repository to Vercel for automatic deployments.

## Data Format

To analyze your social media data, provide it in this format:

```json
[
  {
    "id": "post-1",
    "platform": "instagram",
    "influencer": "creator_name",
    "content": {
      "summary": "Post description here",
      "transcript": "Optional transcript",
      "ocrText": "Optional OCR extracted text"
    },
    "metrics": {
      "views": 1000000,
      "likes": 50000,
      "comments": 1000,
      "shares": 500
    },
    "timestamp": "2026-03-01T10:00:00Z",
    "campaign": "spring_launch"
  }
]
```

## Brand Customization

### Colors
Update `tailwind.config.ts` with your company's primary and secondary colors:

```typescript
colors: {
  primary: {
    // Your primary color palette
  },
  secondary: {
    // Your secondary color palette
  },
}
```

### Logo
Place your company logo in `public/company-logo.svg`

## Project Structure

- `app/` - Next.js App Router pages
- `components/` - Reusable React components
- `lib/` - Utility functions and business logic
- `styles/` - Global styles and Tailwind configuration

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Language**: TypeScript
- **Deployment**: Vercel

## License

Proprietary - All rights reserved
