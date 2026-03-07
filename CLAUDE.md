# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vercel-deployed web application for a social media agency presenting to Apple. The app visualizes social media campaign performance data, incorporating insights from Apple's recent product announcements.

### Core Purpose
Create an interactive presentation that demonstrates the agency's social media analysis technology, which:
- Ingests post summaries, transcripts, and OCR data
- Analyzes social media campaigns for organizations
- Detects trends and analyzes creative patterns
- Identifies consistent creative styles across influencer campaigns
- Visualizes engagement metrics (views, engagement numbers) across multiple posts

### Target Audience
Apple - leveraging context from their recent product event (March 2026) including:
- MacBook Neo ($599, A18 Pro, 13-inch)
- iPhone 17e ($599, 256GB base, MagSafe)
- M4 iPad Air (30% performance boost)
- Next-Gen Studio Displays ($1,599/$3,299)
- MacBook Pro M5 Pro/M5 Max (AI-optimized, Wi-Fi 7)
- M5 MacBook Air (512GB base, Wi-Fi 7, Bluetooth 6)

## Development Commands

### Installation & Setup
```bash
npm install
# or
bun install
# or
pnpm install
```

### Development
```bash
npm run dev
# Starts development server at http://localhost:3000
```

### Building & Production
```bash
npm run build
npm run start
```

### Deployment
```bash
vercel deploy
# or push to main branch for auto-deployment
```

### Code Quality
```bash
npm run lint
npm run type-check
```

## Technology Stack

This is a Next.js project with:
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS for rapid, consistent styling
- **Deployment**: Vercel (optimized for Next.js)
- **TypeScript**: Strict mode enabled for type safety

## Architecture

### Data Flow
1. **Input**: Post data with context, view counts, engagement metrics
2. **Processing**: Trend detection and creative pattern analysis
3. **Visualization**: Interactive charts and presentations

### Key Components
- **Data Ingestion Layer**: Accepts post data in multiple formats (JSON, CSV)
- **Analysis Engine**: Processes transcripts, OCR, and post summaries
- **Visualization Components**: Charts, graphs, and presentation slides
- **Apple Integration**: References Apple event data and product positioning

### Project Structure
```
app/                    # Next.js App Router pages
├── api/               # API routes for data processing
├── (presentation)/    # Presentation pages
├── layout.tsx         # Root layout with company branding
└── page.tsx           # Landing/home page

components/
├── charts/            # Data visualization components
├── presentation/      # Slide/presentation components
└── ui/                # Reusable UI components

lib/
├── analysis.ts        # Social media trend analysis logic
├── data-processing.ts # Data ingestion and parsing
└── utils.ts           # Helper functions

public/
├── company-logo.svg   # Company branding assets
└── apple-event/       # Apple event reference materials

styles/
└── globals.css        # Global styles and Tailwind directives
```

## Design Guidelines

### Brand Integration
- Use company-provided primary and secondary colors consistently
- Apply company logo and visual identity throughout
- Maintain professional, agency-quality presentation standards

### Apple Aesthetic
- Clean, minimalist design matching Apple's design language
- Ample whitespace, smooth animations
- High-quality typography (SF Pro or similar system fonts)
- Subtle gradients and shadows consistent with iOS/macOS

### Data Visualization
- Clear, readable charts with proper labels and legends
- Consistent color schemes across visualizations
- Interactive elements where appropriate
- Responsive design for various screen sizes

## Data Format

Expected input data structure for posts:
```typescript
interface PostData {
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
```

## Important Considerations

1. **Performance**: Charts and data processing should be optimized for smooth presentation flow
2. **Responsive**: Presentation should work on desktop (primary) and tablet (secondary)
3. **Offline**: Consider static data embedding for reliable presentation delivery
4. **Brand Colors**: Use environment variables or config for easy color scheme updates
5. **Apple Context**: Reference specific Apple products and features from the event data

## Company Context

This is a social media agency pitching their proprietary technology to Apple. The technology can:
- Analyze creative consistency across influencer campaigns
- Detect trending creative ideas and patterns
- Provide OCR-based content analysis
- Process transcripts for sentiment and messaging
- Aggregate and visualize campaign performance

The presentation should demonstrate this capability while showing understanding of Apple's recent product launches and brand positioning.
