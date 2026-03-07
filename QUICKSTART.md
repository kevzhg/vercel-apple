# Quick Start Guide

## Project Status: ✅ Ready for Development

Your Vercel Apple Presentation platform is now set up and ready to use!

## What's Included

### ✅ Core Infrastructure
- Next.js 15 with App Router
- TypeScript configuration
- Tailwind CSS with custom brand colors
- Production-ready build system
- Vercel deployment configuration

### ✅ Data Analysis Engine
- Campaign analysis functions (`lib/analysis.ts`)
- Post data processing and metrics calculation
- Trend detection and creative theme extraction
- Top influencer identification

### ✅ Apple Event Data
- Complete product catalog from March 2026 event
- Product categorization by segment (entry/mid/premium)
- Helper functions for product queries

### ✅ Sample Data & Demo
- 10 sample social media posts demonstrating campaign analytics
- Interactive demo dashboard at `/demo`
- API endpoint at `/api/analyze`

## How to Use

### 1. Start Development Server
```bash
npm run dev
```
Visit http://localhost:3000

### 2. View Demo Dashboard
Navigate to http://localhost:3000/demo

See the analysis engine in action with sample Apple March 2026 event data.

### 3. Test API Endpoint
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '[
    {
      "id": "test-1",
      "platform": "instagram",
      "influencer": "@test_user",
      "content": {
        "summary": "Test post about Apple products"
      },
      "metrics": {
        "views": 100000,
        "likes": 5000,
        "comments": 200,
        "shares": 100
      },
      "timestamp": "2026-03-01T10:00:00Z",
      "campaign": "test"
    }
  ]'
```

### 4. Customize Brand Colors
Edit `tailwind.config.ts`:
```typescript
colors: {
  primary: {
    500: '#YOUR_PRIMARY_COLOR',
    // ... adjust other shades
  },
  secondary: {
    500: '#YOUR_SECONDARY_COLOR',
    // ... adjust other shades
  },
}
```

### 5. Add Your Logo
Place your company logo at:
```
public/company-logo.svg
```

## Project Structure

```
vercel-apple/
├── app/
│   ├── api/analyze/         # Data analysis API endpoint
│   ├── demo/                # Demo dashboard page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── charts/              # Chart components (to be added)
│   ├── presentation/        # Presentation components (to be added)
│   └── ui/                  # Reusable UI components (to be added)
├── lib/
│   ├── analysis.ts          # Core analysis functions
│   ├── apple-data.ts        # Apple product data
│   ├── sample-data.ts       # Sample social media posts
│   └── types.ts             # TypeScript type definitions
├── public/                  # Static assets
├── styles/
│   └── globals.css          # Global styles
├── CLAUDE.md                # Claude Code guidance
├── README.md                # Project documentation
└── package.json
```

## Next Steps

1. **Brand Integration**: Add your company colors and logo
2. **Data Ingestion**: Prepare your social media data in the specified format
3. **Presentation Flow**: Design your presentation narrative
4. **Apple Integration**: Reference specific products/features from March 2026 event
5. **Deploy to Vercel**: `vercel deploy` when ready

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
```

## Deployment

The project is optimized for Vercel:

1. Push to Git repository
2. Import to Vercel
3. Deploy automatically

Or use CLI:
```bash
vercel deploy --prod
```

## Sample Data

The demo uses 10 sample posts covering:
- MacBook Neo ($599)
- iPhone 17e (MagSafe, 256GB)
- M4 iPad Air (30% boost)
- Studio Displays
- M5 MacBook Pro & Air

Demonstrating 23.4M+ total views across Instagram, TikTok, and Twitter.

## Need Help?

- Check `CLAUDE.md` for architecture guidance
- Review `README.md` for detailed documentation
- Examine sample data in `lib/sample-data.ts`
- Test analysis functions with `/api/analyze`

---

**Status**: Development server running at http://localhost:3000
