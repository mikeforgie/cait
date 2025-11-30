# Implementation Task: SEO Attribution Analytics System

## Overview
Build a comprehensive SEO Attribution & Analytics system that tracks all SEO activities and shows which actions drove ranking improvements. This is a **new section** at `/dashboard/[clientId]/attribution`.

---

## Part 1: Database Migration

**File:** `web/supabase/migrations/008_rankings_tracking.sql`

Create 3 new tables:

### Table 1: `keyword_rankings`
Tracks daily/weekly position for keywords.

```sql
CREATE TABLE keyword_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  position INTEGER, -- Current SERP position (1-100+, NULL if not ranking)
  previous_position INTEGER, -- Last recorded position
  position_change INTEGER, -- Calculated: previous - current (positive = improvement)
  search_engine TEXT DEFAULT 'google', -- google, bing, chatgpt, perplexity, claude
  search_volume INTEGER,
  ctr DECIMAL(5,4), -- Click-through rate if available
  url TEXT, -- Which page is ranking
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_keyword_rankings_client ON keyword_rankings(client_id);
CREATE INDEX idx_keyword_rankings_keyword ON keyword_rankings(keyword);
CREATE INDEX idx_keyword_rankings_recorded ON keyword_rankings(recorded_at);
```

### Table 2: `tracked_keywords`
Keywords user is actively monitoring.

```sql
CREATE TABLE tracked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  target_url TEXT, -- Page we want to rank
  baseline_position INTEGER, -- Position when tracking started
  current_position INTEGER,
  best_position INTEGER,
  worst_position INTEGER,
  search_volume INTEGER,
  difficulty INTEGER, -- 0-100
  priority TEXT DEFAULT 'medium', -- high, medium, low
  is_active BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, keyword)
);

CREATE INDEX idx_tracked_keywords_client ON tracked_keywords(client_id);
```

### Table 3: `backlink_tracking`
Tracks backlinks with attribution to SEO actions.

```sql
CREATE TABLE backlink_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL, -- Where the link is from
  target_url TEXT NOT NULL, -- Which page on our site
  anchor_text TEXT,
  link_type TEXT DEFAULT 'dofollow', -- dofollow, nofollow, ugc, sponsored
  domain_authority INTEGER, -- DA score 0-100
  page_authority INTEGER, -- PA score 0-100
  is_indexed BOOLEAN DEFAULT false, -- Is Google indexing this backlink?
  indexed_at TIMESTAMPTZ,
  acquisition_method TEXT, -- guest_post, outreach, directory, press_release, organic
  seo_action_id UUID REFERENCES seo_actions(id), -- Links to the action that created it
  status TEXT DEFAULT 'active', -- active, lost, broken
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backlink_tracking_client ON backlink_tracking(client_id);
CREATE INDEX idx_backlink_tracking_target ON backlink_tracking(target_url);
CREATE INDEX idx_backlink_tracking_action ON backlink_tracking(seo_action_id);
```

### Table 4: `seo_actions` (if not exists)
Log of all SEO activities performed.

```sql
CREATE TABLE IF NOT EXISTS seo_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- content, on_page, off_page, technical
  action_subtype TEXT, -- backlink_acquired, guest_post, content_published, meta_updated, etc.
  title TEXT NOT NULL, -- Brief description
  description TEXT, -- Detailed notes
  target_url TEXT, -- Which page was affected
  source_url TEXT, -- For backlinks: where the link came from
  anchor_text TEXT, -- For backlinks
  domain_authority INTEGER, -- For backlinks
  word_count INTEGER, -- For content actions
  metadata JSONB DEFAULT '{}', -- Flexible additional data
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  performed_by UUID, -- User who logged the action
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seo_actions_client ON seo_actions(client_id);
CREATE INDEX idx_seo_actions_type ON seo_actions(action_type);
CREATE INDEX idx_seo_actions_target ON seo_actions(target_url);
CREATE INDEX idx_seo_actions_performed ON seo_actions(performed_at);
```

Add RLS policies to all tables (same pattern as existing tables).

---

## Part 2: Attribution Dashboard Page

**File:** `web/app/dashboard/[clientId]/attribution/page.tsx`

### Layout Structure:
```
┌─────────────────────────────────────────────────────────────┐
│  SEO Attribution & Analytics                    [+ Log Action] │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Actions  │ │ Keywords │ │ Backlinks│ │ Rankings Movement│ │
│  │ 24       │ │ 45       │ │ 32 (28)  │ │ ↑12  ↓3          │ │
│  │ this mo  │ │ tracked  │ │ indexed  │ │ improved/dropped │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Action Categories                                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Content    ████████████░░░░░░░░  12 actions (40%)       │ │
│  │ On-Page    ██████░░░░░░░░░░░░░░   6 actions (20%)       │ │
│  │ Off-Page   ████████░░░░░░░░░░░░   8 actions (27%)       │ │
│  │ Technical  ████░░░░░░░░░░░░░░░░   4 actions (13%)       │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  [Attribution Timeline] [Page Attribution] [Action Logger]   │
│  ─────────────────────────────────────────────────────────── │
│  (Tab content renders below based on selection)              │
└─────────────────────────────────────────────────────────────┘
```

### Features:
1. **Overview Stats Cards** - 4 cards showing key metrics
2. **Action Categories** - Progress bars showing distribution
3. **Tabbed Content** - Timeline, Page Attribution, Action Logger

---

## Part 3: Components

### Component 1: Action Logger
**File:** `web/components/attribution/action-logger.tsx`

A form to manually log SEO actions. Uses a modal or slide-out panel.

**Fields by Action Type:**

**Off-Page Actions:**
- Subtype: backlink, guest_post, press_release, directory_submission
- Source URL (where link is from)
- Target URL (which page on our site)
- Anchor text
- Domain Authority (0-100)
- Notes

**Content Actions:**
- Subtype: blog_published, content_updated, page_created
- Target URL
- Word count added
- Notes

**On-Page Actions:**
- Subtype: meta_updated, internal_links_added, schema_added, images_optimized
- Target URL
- Notes

**Technical Actions:**
- Subtype: speed_improvement, https_migration, crawl_fix, mobile_optimization
- Notes

On submit: POST to `/api/attribution/log-action`

---

### Component 2: Attribution Timeline
**File:** `web/components/attribution/attribution-timeline.tsx`

Chronological view showing actions AND ranking changes interleaved.

**Display Format:**
```
📅 February 2025

Feb 15  🔗 Backlink acquired from authority-site.com (DA 65)
        → /best-seo-tools

Feb 12  📝 Content updated: /best-seo-tools
        +800 words added

Feb 10  📈 Ranking improved: "best SEO tools"
        Position: 15 → 7 (+8)

Feb 5   🔧 Technical: Site speed improvement
        Core Web Vitals passed

📅 January 2025
...
```

**Data Sources:**
- `seo_actions` table for actions
- `keyword_rankings` table for ranking changes (where position_change != 0)
- Combine and sort by date descending

---

### Component 3: Page Attribution View
**File:** `web/components/attribution/page-attribution-view.tsx`

Shows WHY a specific page improved. User selects a page URL, then sees:

```
Page: /best-seo-tools

📊 Performance
Current position: 7 (was 23)
Improvement: +16 positions over 60 days

🎯 Actions That Contributed

Off-Page (3 actions)
├─ Feb 15: Backlink from authority-site.com (DA 65) ✓ Indexed
├─ Feb 8: Backlink from seo-blog.com (DA 45) ✓ Indexed
└─ Jan 20: Guest post on marketing-weekly.com (DA 55) ○ Not indexed

Content (2 actions)
├─ Feb 12: Content updated (+800 words)
└─ Jan 15: New FAQ section added (+300 words)

On-Page (1 action)
└─ Jan 10: Meta title & description optimized

Technical (1 action)
└─ Jan 5: Image optimization (saved 2.1MB)

💡 Correlation Summary
This page received 7 SEO actions over 60 days.
3 backlinks acquired (2 indexed, total DA: 165)
+1,100 words of content added
Strong correlation between backlink acquisition and ranking improvement.
```

**Data:** GET from `/api/attribution/page-actions?url=/best-seo-tools`

---

## Part 4: API Endpoints

### Endpoint 1: Log Action
**File:** `web/app/api/attribution/log-action/route.ts`

```typescript
// POST /api/attribution/log-action
// Body: {
//   clientId: string,
//   actionType: 'content' | 'on_page' | 'off_page' | 'technical',
//   actionSubtype: string,
//   title: string,
//   description?: string,
//   targetUrl?: string,
//   sourceUrl?: string,
//   anchorText?: string,
//   domainAuthority?: number,
//   wordCount?: number,
//   metadata?: object
// }

// 1. Insert into seo_actions table
// 2. If off_page backlink action, also insert into backlink_tracking
// 3. Return the created action
```

### Endpoint 2: Page Actions
**File:** `web/app/api/attribution/page-actions/route.ts`

```typescript
// GET /api/attribution/page-actions?clientId=xxx&url=/page-path

// 1. Fetch all seo_actions where target_url matches
// 2. Fetch all backlink_tracking where target_url matches
// 3. Fetch keyword_rankings for keywords targeting this URL
// 4. Return combined data for the Page Attribution View
```

---

## Part 5: Types

**Add to:** `web/types/database.ts`

```typescript
export interface KeywordRanking {
  id: string;
  client_id: string;
  keyword: string;
  position: number | null;
  previous_position: number | null;
  position_change: number | null;
  search_engine: string;
  search_volume: number | null;
  ctr: number | null;
  url: string | null;
  recorded_at: string;
  created_at: string;
}

export interface TrackedKeyword {
  id: string;
  client_id: string;
  keyword: string;
  target_url: string | null;
  baseline_position: number | null;
  current_position: number | null;
  best_position: number | null;
  worst_position: number | null;
  search_volume: number | null;
  difficulty: number | null;
  priority: 'high' | 'medium' | 'low';
  is_active: boolean;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BacklinkTracking {
  id: string;
  client_id: string;
  source_url: string;
  target_url: string;
  anchor_text: string | null;
  link_type: 'dofollow' | 'nofollow' | 'ugc' | 'sponsored';
  domain_authority: number | null;
  page_authority: number | null;
  is_indexed: boolean;
  indexed_at: string | null;
  acquisition_method: string | null;
  seo_action_id: string | null;
  status: 'active' | 'lost' | 'broken';
  discovered_at: string;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeoAction {
  id: string;
  client_id: string;
  action_type: 'content' | 'on_page' | 'off_page' | 'technical';
  action_subtype: string | null;
  title: string;
  description: string | null;
  target_url: string | null;
  source_url: string | null;
  anchor_text: string | null;
  domain_authority: number | null;
  word_count: number | null;
  metadata: Record<string, unknown>;
  performed_at: string;
  performed_by: string | null;
  created_at: string;
}
```

---

## Part 6: Navigation

Add link to the attribution page in the client detail layout or navigation:

```tsx
// In client detail page or sidebar
<Link href={`/dashboard/${clientId}/attribution`}>
  SEO Attribution
</Link>
```

---

## Implementation Order

1. **Database first** - Create migration 008_rankings_tracking.sql
2. **Types** - Add interfaces to database.ts
3. **API endpoints** - log-action and page-actions routes
4. **Components** - action-logger, attribution-timeline, page-attribution-view
5. **Page** - Attribution dashboard page
6. **Navigation** - Add link from client detail

---

## UI Notes

- Use existing shadcn/ui components (Card, Button, Input, Select, Tabs, Badge)
- Use Lucide icons for visual elements
- Match existing dashboard styling
- Use the existing chart color palette from `lib/charts/config.ts`
- Make it responsive (works on mobile)

---

## Success Criteria

- [ ] Migration runs without errors
- [ ] Can log all 4 action types via Action Logger
- [ ] Timeline shows actions and ranking changes chronologically
- [ ] Page Attribution shows all actions for a specific URL
- [ ] Stats cards show accurate counts
- [ ] Action categories show correct distribution
