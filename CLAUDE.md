# CAIT — Core AI Tool

- Command: `python3 cait/src/run.py`
- Validator: `python3 cait/src/validate.py`
- Config: `cait/config/cait_config.example.json` (copy and customize per deployment)

## How to use when I say "run CAIT"
1. Read this file and `cait/config/cait_config.example.json`.
2. Run validator: `python3 cait/src/validate.py`.
3. If valid, run: `python3 cait/src/run.py`.
4. Output artifacts go to a project-specific output directory (configured later).

## Docs
- Workflow PDF: `cait/docs/CAIT_Workflow.pdf` (or see original at the path in README)

---

# CAIT Web Dashboard Progress

## Current Status: Dashboard Rebuild Fresh Branch

**Branch:** `dashboard-rebuild-fresh`
**Last Updated:** December 2024

---

## Recently Completed Features

### 1. WordPress & Hosting Connections (File Deployment)

Enables CAIT to deploy files (robots.txt, sitemap.xml) directly to client sites.

#### Database Schema (Migration 013)
Location: `web/supabase/migrations/013_wordpress_hosting_connections.sql`

**New Tables:**
- `wordpress_connections` - Stores WordPress API credentials with Application Passwords
- `hosting_connections` - Stores FTP/SFTP/cPanel credentials
- `deployment_history` - Tracks all file deployments with rollback support

#### WordPress Integration
**Library:** `web/lib/integrations/wordpress.ts`

Features:
- Test WordPress connection via REST API
- Verify user capabilities (upload_files, edit_posts)
- Deploy robots.txt and sitemap.xml files
- Check/retrieve existing files before deployment
- Store previous content for rollback

**API Endpoints:**
- `POST /api/connections/wordpress` - Test and save WordPress connection
- `GET /api/connections/wordpress?clientId=xxx` - Get connection status
- `DELETE /api/connections/wordpress?clientId=xxx` - Remove connection

**UI Component:** `web/components/connections/WordPressConnectionModal.tsx`
- Step-by-step Application Password setup guide
- Direct link to WordPress admin profile
- Connection testing with visual feedback

#### Hosting/FTP Integration
**API Endpoints:** `web/app/api/connections/hosting/route.ts`

Supports:
- SFTP (port 22)
- FTP (port 21)
- cPanel (port 2083)
- SSH

**UI Component:** `web/components/connections/HostingConnectionModal.tsx`
- Connection type selector (SFTP/FTP/cPanel)
- "How do I find this?" expandable instructions for each type
- Links to hosting provider documentation (GoDaddy, Bluehost, SiteGround, HostGator, DreamHost)

#### File Deployment API
**Endpoint:** `web/app/api/deploy/route.ts`

- `POST /api/deploy` - Deploy robots.txt or sitemap.xml
- `GET /api/deploy?clientId=xxx` - Check deployment status and connection availability

Flow:
1. Checks for WordPress connection first
2. Falls back to Hosting/FTP connection
3. Logs all deployments to `deployment_history`
4. Returns success/failure with rollback info

#### Updated Components

**Connections Page:** `web/app/dashboard/clients/[id]/connections/page.tsx`
- Added WordPress Site card
- Added Hosting (FTP/SFTP) card
- Modals for both connection types
- Real-time connection status display

**Automation Result Modal:** `web/components/dashboard/AutomationResultModal.tsx`
- "Deploy to Site" button when connections are configured
- Shows which connection will be used (WordPress site name or hosting host)
- Fallback instructions when no connection configured
- Deployment progress and result feedback

---

### 2. AI Task Automation System

Enables clickable tasks that trigger AI-powered automations.

#### Task Runner
**Location:** `web/lib/automation/task-runner.ts`

Supported Automations:
- `review_robots_txt` - Analyze and optimize robots.txt
- `generate_sitemap` - Crawl site and generate XML sitemap
- `submit_sitemap_gsc` - Submit sitemap to Google Search Console
- More automations planned...

#### Task Detail Modal
**Location:** `web/components/dashboard/TaskDetailModal.tsx`

Features:
- Shows task details and AI recommendations
- "Run Automation" button for supported tasks
- Progress indicator during automation
- Links to automation results

---

### 3. Scanning System (In Progress)

**Migration:** `web/supabase/migrations/010_scanning_system.sql`

Features:
- Technical SEO scanning
- Auto-complete suggestions
- Todo generation from scan results

**Components:**
- `web/components/scanning/scan-dashboard.tsx`
- `web/components/scanning/scan-progress.tsx`
- `web/components/scanning/todo-list.tsx`

**Libraries:**
- `web/lib/scanning/technical-scanner.ts`
- `web/lib/scanning/auto-complete.ts`
- `web/lib/scanning/detailed-scanner.ts`

---

### 4. AI Assistants System (In Progress)

**Migration:** `web/supabase/migrations/011_ai_assistants.sql`

Features:
- Bulk AI content generation
- Suggestion review workflow
- Apply/reject AI suggestions

**Components:**
- `web/components/ai-assistants/ai-todo-assistant.tsx`
- `web/components/ai-assistants/suggestions-review.tsx`

**Library:** `web/lib/ai-assistants/generators.ts`

---

### 5. Conversions & Attribution System (In Progress)

**Migration:** `web/supabase/migrations/012_conversions_and_attribution.sql`

Features:
- Track conversions from SEO efforts
- AI-powered attribution engine
- Sync with analytics platforms

**Libraries:**
- `web/lib/attribution/ai-attribution-engine.ts`
- `web/lib/attribution/conversions-sync.ts`

---

## File Structure Overview

```
web/
├── app/
│   ├── api/
│   │   ├── connections/
│   │   │   ├── wordpress/route.ts    # WordPress connection management
│   │   │   └── hosting/route.ts      # FTP/SFTP connection management
│   │   ├── deploy/route.ts           # File deployment to client sites
│   │   ├── scanning/                 # Scanning API endpoints
│   │   ├── ai-assistants/            # AI assistant endpoints
│   │   └── attribution/              # Attribution tracking endpoints
│   └── dashboard/
│       └── clients/[id]/
│           ├── connections/page.tsx  # Platform connections UI
│           ├── scanning/page.tsx     # Scanning dashboard
│           └── attribution/page.tsx  # Attribution dashboard
├── components/
│   ├── connections/
│   │   ├── WordPressConnectionModal.tsx
│   │   ├── HostingConnectionModal.tsx
│   │   └── PlatformCard.tsx
│   ├── dashboard/
│   │   ├── AutomationResultModal.tsx # Shows automation results + deploy
│   │   ├── TaskDetailModal.tsx       # Task details + run automation
│   │   └── RecommendedActionsCard.tsx
│   ├── scanning/
│   │   ├── scan-dashboard.tsx
│   │   ├── scan-progress.tsx
│   │   └── todo-list.tsx
│   └── ai-assistants/
│       ├── ai-todo-assistant.tsx
│       └── suggestions-review.tsx
├── lib/
│   ├── integrations/
│   │   └── wordpress.ts              # WordPress REST API integration
│   ├── automation/
│   │   └── task-runner.ts            # AI task automation engine
│   ├── scanning/
│   │   ├── technical-scanner.ts
│   │   ├── auto-complete.ts
│   │   └── detailed-scanner.ts
│   ├── ai-assistants/
│   │   └── generators.ts
│   └── attribution/
│       ├── ai-attribution-engine.ts
│       └── conversions-sync.ts
└── supabase/
    └── migrations/
        ├── 010_scanning_system.sql
        ├── 011_ai_assistants.sql
        ├── 012_conversions_and_attribution.sql
        └── 013_wordpress_hosting_connections.sql
```

---

## Database Tables Summary

### Connection Tables
| Table | Purpose |
|-------|---------|
| `wordpress_connections` | WordPress API credentials & capabilities |
| `hosting_connections` | FTP/SFTP/cPanel credentials |
| `deployment_history` | Track all file deployments |

### Scanning Tables
| Table | Purpose |
|-------|---------|
| `scan_results` | Technical SEO scan results |
| `scan_todos` | Generated tasks from scans |

### AI Assistant Tables
| Table | Purpose |
|-------|---------|
| `ai_suggestions` | AI-generated content suggestions |
| `suggestion_history` | Track applied/rejected suggestions |

### Attribution Tables
| Table | Purpose |
|-------|---------|
| `conversions` | Tracked conversion events |
| `attribution_data` | SEO attribution analysis |

---

## API Endpoints Summary

### Connections
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/connections/wordpress` | Save WordPress connection |
| GET | `/api/connections/wordpress?clientId=xxx` | Get WordPress connection |
| DELETE | `/api/connections/wordpress?clientId=xxx` | Remove WordPress connection |
| POST | `/api/connections/hosting` | Save hosting connection |
| GET | `/api/connections/hosting?clientId=xxx` | Get hosting connection |
| DELETE | `/api/connections/hosting?clientId=xxx` | Remove hosting connection |

### Deployment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/deploy` | Deploy file to client site |
| GET | `/api/deploy?clientId=xxx` | Check deployment status |

### Scanning
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scanning/run-scan` | Start a scan |
| GET | `/api/scanning/todos?clientId=xxx` | Get scan-generated todos |

### AI Assistants
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai-assistants/generate-bulk` | Generate AI suggestions |
| POST | `/api/ai-assistants/apply-suggestions` | Apply AI suggestions |

---

## Next Steps / Roadmap

### Immediate
- [ ] Test WordPress deployment end-to-end
- [ ] Implement actual FTP/SFTP file upload (currently saves credentials only)
- [ ] Add deployment rollback functionality

### Short Term
- [ ] Complete scanning system integration
- [ ] AI assistant bulk generation UI
- [ ] Attribution dashboard visualization

### Long Term
- [ ] Automated scheduled deployments
- [ ] Multi-site deployment support
- [ ] Advanced rollback with version history

---

## For CTO Reference

### Key Architecture Decisions

1. **WordPress Integration via Application Passwords**
   - Uses built-in WP 5.6+ feature
   - No plugin required on client sites
   - Secure REST API authentication

2. **Hosting Fallback Pattern**
   - WordPress checked first (most reliable)
   - Falls back to FTP/SFTP if no WP connection
   - Manual instructions if no connection at all

3. **Deployment History**
   - All deployments logged
   - Previous content stored for rollback
   - Tracks connection type used

4. **Modular Task Runner**
   - Each automation is a separate function
   - Easy to add new automations
   - Results flow to modal with deploy option

### Security Considerations

- Credentials stored in Supabase with RLS policies
- Application Passwords recommended over admin passwords
- FTP passwords should be encrypted (TODO)
- Deployment history provides audit trail

---

*Last updated: December 4, 2024*
