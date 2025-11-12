# CAIT Web - Core AI Tool for SEO Automation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A Supabase account (free tier works)
- API keys for:
  - Google Analytics 4
  - Google Search Console
  - DataForSEO
  - Anthropic (Claude)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and anon key

### 3. Create Database Schema

1. Go to Supabase SQL Editor
2. Run the migration file: `supabase/migrations/001_initial_schema.sql`
3. This creates all tables, indexes, and RLS policies

### 4. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# API Keys
GOOGLE_ANALYTICS_CREDENTIALS=path_to_ga4_credentials.json
GOOGLE_SEARCH_CONSOLE_CREDENTIALS=path_to_gsc_credentials.json
DATAFORSEO_LOGIN=your_dataforseo_login
DATAFORSEO_PASSWORD=your_dataforseo_password
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 5. Create Your First User

In Supabase Dashboard:
1. Go to Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Confirm the user

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in!

## 📁 Project Structure

```
cait/web/
├── app/
│   ├── dashboard/           # Main dashboard
│   │   ├── clients/        # Client management
│   │   └── page.tsx        # Client list
│   ├── login/              # Authentication
│   └── auth/               # Auth callbacks
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── supabase/           # Supabase clients
│   └── utils.ts            # Utilities
├── types/
│   └── database.ts         # TypeScript types
├── supabase/
│   └── migrations/         # Database schemas
└── middleware.ts           # Auth middleware
```

## 🗄️ Database Schema

### Core Tables

- **clients** - Client information and Google integrations
- **tasks** - Month 0-12 automation tasks
- **metrics** - Daily/weekly/monthly performance data
- **keywords** - Keyword tracking and rankings
- **content** - Content pieces and SEO data
- **backlinks** - Backlink monitoring
- **reports** - Generated PDF reports
- **client_interviews** - AI questionnaire system

## 🎯 Features

### ✅ Phase 1 (Week 1) - COMPLETE

- [x] Next.js 14 + TypeScript setup
- [x] Supabase authentication
- [x] Database schema with 8 tables
- [x] Dashboard layout
- [x] Client list view
- [x] Add/edit clients
- [x] Responsive UI with shadcn/ui

### 🔜 Phase 2 (Week 2) - Next Up

- [ ] Month 0 task automation
- [ ] Month 1 task automation
- [ ] Google Analytics 4 integration
- [ ] Google Search Console integration
- [ ] DataForSEO API integration
- [ ] PDF report generation

### 🔜 Phase 3 (Week 3)

- [ ] Multi-user support
- [ ] Client interview system
- [ ] Email questionnaires
- [ ] AI response analysis

### 🔜 Phase 4 (Week 4)

- [ ] Testing & bug fixes
- [ ] Documentation
- [ ] Deploy to production
- [ ] Launch with 3 pilot clients

## 🔐 Authentication

Authentication is handled by Supabase Auth with middleware protection:

- `/dashboard/*` - Protected routes (requires login)
- `/login` - Public login page
- `/auth/callback` - OAuth callback handler
- `/auth/signout` - Sign out endpoint

## 🛠️ Development

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

Vercel will automatically:
- Build the Next.js app
- Configure middleware
- Set up Edge Functions

### Environment Variables in Production

In Vercel dashboard, add all environment variables from `.env.local`

## 📊 Task Automation Roadmap

Based on the CAIT plan PDF, here's the 12-month automation sequence:

### Month 0 (Onboarding)
- Client interview
- Keyword research (100 keywords)
- Competitor analysis (3 competitors)
- Technical audit
- Analytics setup

### Month 1
- Content strategy (4 pieces)
- On-page optimization
- Local SEO setup
- Backlink discovery

### Months 2-12
- Ongoing content creation
- Backlink monitoring
- Rank tracking
- Monthly reporting
- Quarterly strategy reviews

## 🤝 Contributing

This is an internal tool for Next Step Connect. Development priorities:

1. **Automation** - Minimize manual work
2. **Cost Efficiency** - Use APIs, not expensive tools
3. **Data Accuracy** - Real-time metrics from Google
4. **Scalability** - Support 10+ clients with ease

## 📝 Next Steps

1. **Immediate (Week 2)**
   - Build Month 0 automation
   - Integrate GA4 and GSC APIs
   - Generate first automated report

2. **Short Term (Week 3-4)**
   - Add team collaboration
   - Build client interview system
   - Polish UI/UX

3. **Long Term (Month 2+)**
   - AI content generation
   - Advanced automation
   - Custom reporting templates

---

**Built with:**
- [Next.js 14](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

**Status:** Week 1 MVP Complete ✅ | Next: Month 0 Automation 🚀
