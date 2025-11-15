# CAIT — Core AI Tool

**AI Assistant Instructions for Working with the CAIT Codebase**

---

## 🎯 Project Overview

**CAIT** is a comprehensive SEO automation platform that helps agencies manage multiple clients efficiently. It replaces expensive SEO tools ($200-1000/month per client) with API-driven automation ($1-2/month per client), implementing a 12-month SEO roadmap.

**Current Status:** Week 2 in Progress | Week 1 MVP Complete ✅

---

## 📋 Quick Command Reference

### When User Says "Run CAIT"

1. **Read these files first:**
   - This file (`CLAUDE.md`)
   - `cait/config/cait_config.example.json` (configuration structure)
   - `cait/docs/CAIT_Workflow.pdf` (if available)

2. **Validate the configuration:**
   ```bash
   python3 cait/src/validate.py
   ```

3. **If validation passes, execute:**
   ```bash
   python3 cait/src/run.py
   ```

4. **Output Location:**
   - Artifacts go to project-specific output directory (configured in config file)
   - Check for timestamped reports in the configured output path

### Web Application Commands

```bash
# Development
cd cait/web
npm install              # Install dependencies (first time only)
npm run dev             # Start dev server at http://localhost:3000

# Production
npm run build           # Build for production
npm start               # Start production server

# Validation
npm run lint            # Run ESLint
npx tsc --noEmit        # Type check (no explicit script)
```

---

## 🏗️ Repository Structure

```
/home/user/cait/
├── cait/                          # Python automation scripts
│   ├── src/
│   │   ├── run.py                # Main execution script
│   │   └── validate.py           # Configuration validator
│   ├── config/
│   │   └── cait_config.example.json  # Configuration template
│   └── docs/
│       └── CAIT_Workflow.pdf     # Workflow documentation
│
├── web/                          # Next.js web application
│   ├── app/                      # Next.js App Router pages
│   │   ├── dashboard/           # Protected dashboard routes
│   │   ├── login/              # Authentication
│   │   ├── auth/               # OAuth callbacks
│   │   └── api/                # API endpoints
│   │       ├── analytics/      # GA4, GSC, GBP, Bing, Clarity
│   │       ├── automation/     # Task automation endpoints
│   │       └── auth/          # OAuth flows
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── charts/             # Chart components (Recharts)
│   │   └── [DataCards].tsx     # Analytics display components
│   ├── lib/
│   │   ├── supabase/           # Database clients
│   │   ├── api/                # API integration clients
│   │   ├── automation/         # Automation logic
│   │   └── auth/              # OAuth handlers
│   ├── supabase/
│   │   └── migrations/         # Database schema migrations
│   ├── types/
│   │   └── database.ts         # TypeScript database types (411 lines)
│   └── middleware.ts           # Auth middleware
│
├── README.md                    # Project quick reference
├── START_HERE.md               # Getting started guide (410 lines)
├── CLAUDE.md                   # This file - AI assistant instructions
└── cait-plan.pdf              # Master project plan (397KB)
```

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.x** - Type safety
- **Tailwind CSS 4.x** - Styling
- **shadcn/ui** - Component library (Radix UI primitives)
- **Recharts 3.3.0** - Data visualization

### Backend & Database
- **Supabase** - PostgreSQL + Auth + Real-time
- **PostgreSQL** - Primary database (8 core tables, 101 columns)
- **Row Level Security (RLS)** - Active on all tables

### Integrations
- **Google APIs** (`googleapis ^164.1.0`)
  - Google Analytics 4 (`@google-analytics/data ^5.2.1`)
  - Google Search Console
  - Google Business Profile
- **Bing Webmaster Tools**
- **Microsoft Clarity**
- **DataForSEO** (keyword research & technical audits)

### Python Backend
- Python 3.x for automation scripts
- Config-driven execution

---

## 📊 Database Schema (8 Core Tables)

### 1. `clients` - Client Management
```sql
-- Key columns: id, name, domain, ga4_property_id, gsc_url,
-- focus_service, primary_location, status, onboarding_completed
```

### 2. `tasks` - Month 0-12 Automation Tasks
```sql
-- Key columns: id, client_id, month (0-12), name, description,
-- category (keyword_research|content|technical_seo|backlinks|local_seo|analytics),
-- automated, automation_config, status (pending|in_progress|completed|blocked)
```

### 3. `metrics` - Performance Data
```sql
-- Key columns: id, client_id, date, period_type (daily|weekly|monthly),
-- traffic, sessions, bounce_rate, ranking_avg, top_10_keywords,
-- backlinks_count, gbp_views, gbp_actions
```

### 4. `keywords` - Keyword Tracking
```sql
-- Key columns: id, client_id, keyword, search_volume, difficulty,
-- current_position, best_position, target_url, intent, priority
```

### 5. `content` - Content Management
```sql
-- Key columns: id, client_id, title, url, type, status,
-- target_keyword, word_count, ai_generated, published_at
```

### 6. `backlinks` - Backlink Monitoring
```sql
-- Key columns: id, client_id, source_url, target_url, anchor_text,
-- source_domain_rating, link_type, status, discovered_at
```

### 7. `reports` - Generated Reports
```sql
-- Key columns: id, client_id, month, year, report_type,
-- pdf_url, report_data, status, sent_at
```

### 8. `client_interviews` - AI Questionnaires
```sql
-- Key columns: id, client_id, interview_type, questions,
-- responses, ai_analysis, status, completed_at
```

**Location:** `web/supabase/migrations/001_initial_schema.sql` (311 lines)

---

## 🔄 Development Workflows

### Daily Development Workflow

1. **Start the development server:**
   ```bash
   cd cait/web
   npm run dev  # Runs on http://localhost:3000
   ```

2. **Make changes:**
   - Edit files in `app/`, `components/`, `lib/`
   - Hot reload shows changes instantly

3. **Type checking (before commits):**
   ```bash
   npx tsc --noEmit
   ```

4. **Lint (before commits):**
   ```bash
   npm run lint
   ```

5. **Test locally:**
   - Sign in at http://localhost:3000
   - Verify changes in browser

6. **Commit changes:**
   ```bash
   git add .
   git commit -m "descriptive message"
   git push -u origin <branch-name>
   ```

### Adding New Features Workflow

1. **Read relevant documentation:**
   - `web/QUICK_REFERENCE.md` - Common patterns
   - `web/README.md` - Full project docs
   - Existing similar code for examples

2. **Understand database schema:**
   - Check `web/types/database.ts` for table structures
   - Review `web/supabase/migrations/` for schema

3. **Use existing patterns:**
   - Server components: Import from `@/lib/supabase/server`
   - Client components: Import from `@/lib/supabase/client`
   - UI: Use shadcn/ui components from `@/components/ui/`

4. **Write TypeScript with proper types:**
   - Import types from `@/types/database`
   - Use type annotations consistently

5. **Test thoroughly:**
   - Test with real Supabase data
   - Check browser console for errors
   - Verify mobile responsiveness

6. **Update documentation:**
   - Add to relevant README if significant change
   - Update QUICK_REFERENCE.md if new pattern

---

## 💻 Code Conventions & Patterns

### File Naming
- **Components:** PascalCase (e.g., `ClientChartsSection.tsx`)
- **Pages:** lowercase (e.g., `page.tsx`, `layout.tsx`)
- **API routes:** lowercase (e.g., `route.ts`)
- **Utilities:** camelCase (e.g., `googleAnalytics.ts`)

### Component Structure

**Server Component Pattern:**
```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch data
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Render UI */}
    </div>
  )
}
```

**Client Component Pattern:**
```typescript
// components/SomeInteractiveComponent.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function SomeInteractiveComponent() {
  const [data, setData] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    // Fetch data
  }, [])

  return <div>{/* Render */}</div>
}
```

**API Route Pattern:**
```typescript
// app/api/something/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Process request
  const body = await request.json()

  // Return response
  return NextResponse.json({ success: true, data: result })
}
```

### Import Conventions
```typescript
// Use @ alias for imports
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

// Group imports logically
// 1. React/Next.js
// 2. Third-party libraries
// 3. Internal components
// 4. Internal utilities
// 5. Types
```

### Database Query Patterns

**Fetching data:**
```typescript
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .order('created_at', { ascending: false })

if (error) {
  console.error('Error fetching clients:', error)
  return []
}
```

**With joins:**
```typescript
const { data } = await supabase
  .from('clients')
  .select(`
    *,
    tasks (
      id,
      name,
      status,
      month
    )
  `)
  .eq('id', clientId)
  .single()
```

**Inserting data:**
```typescript
const { data, error } = await supabase
  .from('clients')
  .insert([{
    name: 'Test Client',
    domain: 'example.com'
  }])
  .select()
  .single()
```

---

## 🧪 Testing & Validation

### Before Every Commit

1. **Type check:**
   ```bash
   npx tsc --noEmit
   ```

2. **Lint:**
   ```bash
   npm run lint
   ```

3. **Build test:**
   ```bash
   npm run build
   ```

### Manual Testing Checklist

- [ ] Sign in works
- [ ] Dashboard loads
- [ ] Can add client
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All links work

### Python Validation

```bash
python3 cait/src/validate.py
```

**What it checks:**
- Config file exists
- Credential file paths are valid
- Output directory exists or can be created
- Required credential files are present

---

## 🔐 Security & Best Practices

### Environment Variables

**Safe to commit:**
- `NEXT_PUBLIC_*` variables (client-side)
- Supabase `anon` key (protected by RLS)
- All code files

**NEVER commit:**
- `.env.local` or `.env*` files
- Service role keys
- API secrets
- Passwords
- Any file matching `*_config.json` (except examples)

### Row Level Security (RLS)

- **Active on ALL tables**
- Current policy: Authenticated users can read/write all data
- **TODO:** Refine for per-client/per-team access control

### Data Sanitization

- Always validate user input
- Use parameterized queries (Supabase handles this)
- Sanitize data before displaying in UI
- Be cautious with `dangerouslySetInnerHTML`

---

## 📁 Important File Locations

### Configuration
| File | Purpose |
|------|---------|
| `web/.env.local` | Environment variables (CREATE THIS - not in repo) |
| `web/middleware.ts` | Auth protection for routes |
| `web/components.json` | shadcn/ui component config |
| `cait/config/cait_config.example.json` | Python automation config template |

### Entry Points
| File | Purpose |
|------|---------|
| `web/app/page.tsx` | Home page (redirects to dashboard) |
| `web/app/dashboard/page.tsx` | Main dashboard |
| `web/app/login/page.tsx` | Login page |
| `cait/src/run.py` | Python automation runner |
| `cait/src/validate.py` | Configuration validator |

### Database
| File | Purpose |
|------|---------|
| `web/supabase/migrations/001_initial_schema.sql` | Core schema (8 tables) |
| `web/supabase/migrations/002_google_oauth.sql` | Google OAuth tables |
| `web/supabase/migrations/003_ga4_reports.sql` | GA4 reporting tables |
| `web/supabase/migrations/004_bing_clarity_integrations.sql` | Bing/Clarity tables |
| `web/types/database.ts` | TypeScript type definitions |

### Key Libraries
| File | Purpose |
|------|---------|
| `web/lib/supabase/server.ts` | Server-side database client |
| `web/lib/supabase/client.ts` | Client-side database client |
| `web/lib/supabase/middleware.ts` | Auth middleware logic |
| `web/lib/api/google-analytics.ts` | GA4 API client |
| `web/lib/automation/tasks.ts` | Task automation logic |

### Documentation
| File | Purpose |
|------|---------|
| `START_HERE.md` | Getting started guide (410 lines) |
| `web/SETUP.md` | Step-by-step setup (20 min) |
| `web/QUICK_REFERENCE.md` | One-page cheat sheet |
| `web/README.md` | Full project documentation |
| `WEEK_1_COMPLETE.md` | Week 1 completion summary |

---

## 🚀 Common Tasks for AI Assistants

### Task: Add a New Client

1. Navigate to dashboard at http://localhost:3000/dashboard
2. Click "Add Client"
3. Enter required fields (name, domain)
4. Optionally set GA4 property ID, focus service, location
5. Client is inserted into `clients` table with UUID

### Task: Create Month 0 Tasks for a Client

```typescript
// Use POST /api/automation/initialize-tasks
const response = await fetch('/api/automation/initialize-tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ clientId })
})
```

### Task: Fetch GA4 Data

```typescript
// Use POST /api/analytics/ga4/fetch
const response = await fetch('/api/analytics/ga4/fetch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientId,
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  })
})
```

### Task: Add a New Page

1. Create file: `web/app/your-route/page.tsx`
2. Export default async function (server component) or 'use client' component
3. Add to navigation in `web/app/dashboard/layout.tsx` if needed
4. Protected routes automatically handled by middleware

### Task: Add a New API Endpoint

1. Create: `web/app/api/your-endpoint/route.ts`
2. Export `GET`, `POST`, `PUT`, or `DELETE` function
3. Use server Supabase client
4. Check auth first
5. Return `NextResponse.json()`

### Task: Add a New Component

1. Create: `web/components/YourComponent.tsx`
2. Use PascalCase naming
3. Add 'use client' if needs interactivity
4. Import shadcn/ui components from `@/components/ui/`
5. Export as named or default export

### Task: Run Keyword Research

```bash
# Via API
POST /api/automation/keyword-research
{
  "clientId": "uuid",
  "seedKeywords": ["seo", "marketing"]
}
```

### Task: Generate Report

```bash
# TODO: Not yet implemented
# Will be POST /api/automation/generate-report
```

---

## 🔍 Troubleshooting Guide

### "Module not found" errors
```bash
rm -rf node_modules .next
npm install
npm run dev
```

### "Invalid login credentials"
- Verify user exists in Supabase → Authentication → Users
- Check user is confirmed (or create with "Auto Confirm User" checked)
- Verify `.env.local` has correct Supabase URL and anon key

### "Failed to fetch" / Network errors
- Check Supabase project is not paused
- Verify `.env.local` Supabase credentials are correct
- Test internet connection
- Check Supabase logs in dashboard

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### TypeScript errors
```bash
npx tsc --noEmit  # See all type errors
```

### Database query failing
- Test query in Supabase SQL Editor
- Check RLS policies allow access
- Verify user is authenticated
- Check Supabase logs for details

### Build failing
```bash
npm run lint       # Check linting errors
npx tsc --noEmit   # Check type errors
```

---

## 🎯 Current Project Status & Roadmap

### ✅ Week 1 Complete (Foundation)
- [x] Next.js 16 + React 19 app
- [x] Supabase authentication
- [x] 8-table database schema
- [x] Dashboard UI with client list
- [x] Protected routes with middleware
- [x] shadcn/ui component library
- [x] Responsive design

### 🚧 Week 2 In Progress (Automation)
- [ ] Task automation system (Month 0-12)
- [ ] Google Analytics 4 integration
- [ ] Google Search Console integration
- [ ] DataForSEO API integration
- [ ] Keyword research automation
- [ ] Technical audit automation
- [ ] PDF report generation

### 📅 Week 3 Planned (Team Features)
- [ ] Multi-user support
- [ ] Team member roles
- [ ] Client interview system
- [ ] Email questionnaires
- [ ] AI response analysis

### 📅 Week 4 Planned (Launch)
- [ ] Testing & bug fixes
- [ ] Production deployment
- [ ] Team training
- [ ] Launch with 3 pilot clients

---

## 📞 Quick Reference Links

**Essential Files:**
- Getting Started: `START_HERE.md`
- Setup Guide: `web/SETUP.md`
- Cheat Sheet: `web/QUICK_REFERENCE.md`
- Full Docs: `web/README.md`

**Database:**
- Schema: `web/supabase/migrations/001_initial_schema.sql`
- Types: `web/types/database.ts`

**Authentication:**
- Server Client: `web/lib/supabase/server.ts`
- Browser Client: `web/lib/supabase/client.ts`
- Middleware: `web/lib/supabase/middleware.ts`

**API Integration:**
- Google Analytics: `web/lib/api/google-analytics.ts`
- Automation: `web/lib/automation/tasks.ts`

---

## 🎓 Development Guidelines for AI Assistants

### When Making Changes

1. **Always read relevant files first** before making changes
2. **Follow existing patterns** - check similar code for examples
3. **Maintain type safety** - use TypeScript types consistently
4. **Test locally** before committing
5. **Update documentation** if changing significant functionality

### When Adding Features

1. **Plan before coding** - understand requirements fully
2. **Check database schema** - ensure tables support the feature
3. **Use existing utilities** - don't reinvent the wheel
4. **Follow file structure conventions**
5. **Add error handling** - never assume success

### When Debugging

1. **Check browser console** (F12) for client-side errors
2. **Check terminal** for server-side errors
3. **Check Supabase logs** for database errors
4. **Test queries** in Supabase SQL Editor
5. **Verify environment variables** in `.env.local`

### Code Quality Standards

- ✅ TypeScript types for all functions
- ✅ Error handling for all async operations
- ✅ Consistent formatting (Prettier)
- ✅ Meaningful variable names
- ✅ Comments for complex logic
- ✅ No console.logs in production code (use proper logging)

---

**Last Updated:** November 15, 2025
**Version:** 2.0 (Comprehensive AI Assistant Guide)
**Status:** Week 2 In Progress 🚀
**Next Milestone:** Month 0 Automation Complete
