# 🧪 CAIT Automation Testing Guide

Complete guide to test the Week 2 automation features.

## ⚠️ Prerequisites

Before you can test the automation system, you need:

### 1. Supabase Configuration

The app requires environment variables to connect to Supabase:

```bash
# In /cait/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Status:** ⚠️ NOT CONFIGURED

**To Configure:**
1. Follow `SETUP.md` Steps 1-3
2. Create `.env.local` from `.env.local.example`
3. Fill in Supabase credentials
4. Restart dev server

### 2. API Keys (Optional for Basic Testing)

For full automation testing, you'll need:

```bash
# Optional: For keyword research automation
DATAFORSEO_LOGIN=your_dataforseo_login
DATAFORSEO_PASSWORD=your_dataforseo_password

# Optional: For analytics data
GOOGLE_ANALYTICS_CREDENTIALS=path_to_ga4_credentials.json
GOOGLE_SEARCH_CONSOLE_CREDENTIALS=path_to_gsc_credentials.json

# Optional: For AI features
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**What works without API keys:**
- ✅ Creating clients
- ✅ Task initialization (creates 54 tasks per client)
- ✅ Task status management
- ✅ UI and database operations

**What requires API keys:**
- ❌ Keyword research automation (needs DataForSEO)
- ❌ Technical audit automation (needs DataForSEO)
- ❌ Analytics data (needs Google APIs)

---

## 🎯 Test Plan

### Phase 1: Basic Functionality (No API Keys Required)

**Test 1: Server Startup**
```bash
cd /cait/web
npm run dev
```
**Expected:** Server starts on http://localhost:3000

**Test 2: Login**
1. Navigate to http://localhost:3000
2. Sign in with Supabase credentials
**Expected:** Redirects to /dashboard

**Test 3: Create Client**
1. Click "Add Client"
2. Fill in:
   - Business Name: "Test Company"
   - Domain: "testcompany.com"
   - Industry: "Technology"
   - Primary Location: "United States"
3. Save
**Expected:** Client appears in dashboard

**Test 4: View Client Detail**
1. Click on the test client
**Expected:** See client detail page with:
   - 4 stat cards (tasks, keywords, backlinks, rank)
   - Business information
   - Google integrations section
   - Empty task list

**Test 5: Initialize Tasks**
1. On client detail page, look for task initialization option
2. OR use API directly:
```bash
curl -X POST http://localhost:3000/api/automation/initialize-tasks \
  -H "Content-Type: application/json" \
  -d '{"clientId": "your-client-id-from-database"}'
```
**Expected:** Returns `{"success": true, "message": "Tasks initialized successfully"}`

**Test 6: Verify Tasks Created**
1. Refresh client detail page
2. OR check database:
```sql
SELECT month, COUNT(*)
FROM tasks
WHERE client_id = 'your-client-id'
GROUP BY month
ORDER BY month;
```
**Expected:** See 54 tasks across Months 0-12:
- Month 0: 10 tasks (onboarding)
- Month 1: 5 tasks
- Month 2: 5 tasks
- ...etc

**Test 7: View Tasks by Month**
1. On client detail page, scroll to Tasks section
2. See tasks grouped by month
3. Check task counts per month
**Expected:**
- Month 0 shows 10 tasks
- Automated tasks are marked
- Each task shows name, description, category

### Phase 2: API Integration Tests (Requires API Keys)

**Test 8: Keyword Research Automation**

Prerequisites:
- DataForSEO account with API credentials
- Credits in DataForSEO account (~$0.20 for test)
- Environment variables configured

```bash
curl -X POST http://localhost:3000/api/automation/keyword-research \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "your-client-id",
    "taskId": "your-month-0-keyword-task-id"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "keywords": [
      {
        "keyword": "seo services",
        "search_volume": 12000,
        "difficulty": 65,
        "cpc": 15.20,
        "competition": 0.85,
        "intent": "commercial",
        "priority": "high"
      },
      // ... 99 more keywords
    ],
    "stats": {
      "total": 100,
      "high_priority": 25,
      "medium_priority": 50,
      "low_priority": 25
    }
  }
}
```

**Verify:**
1. Task status changes to "completed"
2. Keywords saved to database
3. Check `keywords` table for new entries

**Test 9: Technical Audit Automation**

Prerequisites:
- DataForSEO account with API credentials
- Environment variables configured

```bash
curl -X POST http://localhost:3000/api/automation/technical-audit \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "your-client-id",
    "taskId": "your-month-0-audit-task-id"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "domain": "testcompany.com",
    "overall_score": 75,
    "critical_issues": 3,
    "warnings": 5,
    "notices": 2,
    "issues": {
      "broken_links": 2,
      "missing_titles": 1,
      "missing_descriptions": 3,
      "slow_pages": 2
    },
    "recommendations": [
      {
        "priority": "high",
        "category": "Links",
        "issue": "Found 2 broken links",
        "fix": "Fix or remove all broken links...",
        "impact": "Broken links hurt user experience..."
      }
    ]
  }
}
```

**Verify:**
1. Task status changes to "completed"
2. Report saved to database
3. Check `reports` table

---

## 🏗️ Current System Architecture

### API Clients (lib/api/)
- ✅ `dataforseo.ts` - 12 methods for SEO data
- ✅ `google-analytics.ts` - 8 methods for GA4 data
- ✅ `google-search-console.ts` - 9 methods for GSC data

### Automation (lib/automation/)
- ✅ `tasks.ts` - Task template system, 54 pre-defined tasks
- ✅ `keyword-research.ts` - Automated keyword discovery
- ✅ `technical-audit.ts` - Automated site auditing

### API Routes (app/api/automation/)
- ✅ `/initialize-tasks` - Create Month 0-12 tasks
- ✅ `/keyword-research` - Run keyword automation
- ✅ `/technical-audit` - Run technical audit

### UI Pages
- ✅ `/dashboard` - Client list
- ✅ `/dashboard/clients/new` - Add client
- ✅ `/dashboard/clients/[id]` - Client detail with tasks

---

## 📊 What We Built (Week 2)

### Files Created: 13
1. `lib/api/dataforseo.ts` (450 lines)
2. `lib/api/google-analytics.ts` (300 lines)
3. `lib/api/google-search-console.ts` (350 lines)
4. `lib/automation/tasks.ts` (350 lines)
5. `lib/automation/keyword-research.ts` (200 lines)
6. `lib/automation/technical-audit.ts` (250 lines)
7. `app/dashboard/clients/[id]/page.tsx` (280 lines)
8. `app/api/automation/initialize-tasks/route.ts` (45 lines)
9. `app/api/automation/keyword-research/route.ts` (50 lines)
10. `app/api/automation/technical-audit/route.ts` (55 lines)
11. `WEEK_2_PROGRESS.md` (450 lines)
12. `SESSION_COMPLETE.md` (500 lines)
13. `TESTING_GUIDE.md` (this file)

### Total Lines of Code: 4,130+

### API Methods: 29
- DataForSEO: 12 methods
- Google Analytics: 8 methods
- Google Search Console: 9 methods

### Pre-defined Tasks: 54
- Month 0: 10 tasks (onboarding)
- Months 1-12: 44 tasks (ongoing optimization)

---

## 💰 Cost Breakdown

### Development
- **Week 1:** Foundation & database ($0)
- **Week 2:** API integration & automation ($0)
- **Total Dev Time:** ~16 hours of planning + implementation

### Operating Costs (Per Client/Month)
- **DataForSEO:**
  - Keyword research: $0.20 one-time
  - Technical audit: $0.15 per month
  - Backlink monitoring: $0.10 per month
  - **Subtotal:** ~$0.45/month

- **Google APIs:** Free (OAuth access)

- **Anthropic Claude:**
  - Content generation: ~$0.50/month
  - Report generation: ~$0.20/month
  - **Subtotal:** ~$0.70/month

**Total per client:** ~$1.15/month

**10 clients:** ~$11.50/month

**vs. Manual Work:**
- Keyword research: 2-4 hours × $75/hr = $150-300
- Technical audit: 4-6 hours × $75/hr = $300-450
- Monthly reports: 2 hours × $75/hr = $150

**ROI:** ~$600-900/month labor saved per client

---

## ✅ Testing Checklist

### Basic Tests (No API Keys)
- [ ] Server starts successfully
- [ ] Can log in to dashboard
- [ ] Can create new client
- [ ] Can view client detail page
- [ ] Can initialize tasks via API
- [ ] 54 tasks created correctly
- [ ] Tasks grouped by month in UI
- [ ] Automated tasks marked correctly

### API Integration Tests (Requires Keys)
- [ ] DataForSEO credentials configured
- [ ] Keyword research automation runs
- [ ] 100+ keywords discovered and saved
- [ ] Technical audit automation runs
- [ ] Audit report generated and saved
- [ ] Task status updates to "completed"
- [ ] Data visible in Supabase database

### Edge Cases
- [ ] Handles missing API keys gracefully
- [ ] Shows error message on API failure
- [ ] Validates client domain format
- [ ] Prevents duplicate task initialization
- [ ] Handles large keyword datasets

---

## 🐛 Known Issues

1. **Build Warning:** Turbopack workspace root detection
   - **Impact:** None, cosmetic warning
   - **Fix:** Set `turbopack.root` in next.config.ts

2. **Middleware Deprecation:** Using "middleware" instead of "proxy"
   - **Impact:** None, still works
   - **Fix:** Rename to proxy.ts in future

3. **Mobile & Schema Detection:** Returns 0 in technical audits
   - **Impact:** Incomplete audit data
   - **Fix:** Add mobile responsiveness check and schema validator

---

## 🚀 Next Steps

### Immediate (Can Test Now)
1. Configure Supabase (see SETUP.md)
2. Run basic tests (no API keys)
3. Verify task system works

### Week 3 Features (Not Built Yet)
1. Content automation (AI-generated blog posts)
2. Backlink monitoring
3. Competitor tracking
4. Monthly report generation

### Week 4 Features (Not Built Yet)
1. Client portal (view-only dashboard)
2. PDF report export
3. Email notifications
4. Analytics dashboard with charts

---

## 📞 Support

### If Tests Fail

1. **Check logs:**
   - Browser console (F12)
   - Terminal where `npm run dev` is running
   - Supabase logs

2. **Verify environment:**
   - `.env.local` exists and has correct values
   - Supabase project is running (not paused)
   - Database migration completed

3. **Common fixes:**
   - Restart dev server
   - Clear browser cache
   - Delete `.next` folder and rebuild

### Database Queries for Debugging

```sql
-- Check if tasks were created
SELECT client_id, month, COUNT(*) as task_count
FROM tasks
GROUP BY client_id, month
ORDER BY client_id, month;

-- Check task automation flags
SELECT category, COUNT(*) as total,
       SUM(CASE WHEN automated THEN 1 ELSE 0 END) as automated_count
FROM tasks
GROUP BY category;

-- Check keyword data
SELECT client_id, COUNT(*) as keyword_count
FROM keywords
GROUP BY client_id;

-- Check reports
SELECT client_id, report_type, created_at
FROM reports
ORDER BY created_at DESC;
```

---

## 🎉 Success Criteria

You'll know the system is working when:

1. ✅ Server starts without errors
2. ✅ Dashboard loads and shows clients
3. ✅ Client detail page shows stats and tasks
4. ✅ Task initialization creates 54 tasks
5. ✅ Tasks are grouped correctly by month
6. ✅ Automation flags are set correctly

**With API keys:**
7. ✅ Keyword research returns 100+ keywords
8. ✅ Technical audit generates recommendations
9. ✅ Data persists to database
10. ✅ Tasks mark as completed automatically

---

**Ready to test?** Start with SETUP.md to configure Supabase, then come back here!
