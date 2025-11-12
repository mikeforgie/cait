# CAIT Quick Reference

One-page cheat sheet for common tasks.

---

## 🚀 Start Development

```bash
cd cait/web
npm run dev
```

Visit: http://localhost:3000

---

## 📁 Key Files

### Configuration
- `.env.local` - Environment variables (Supabase, API keys)
- `middleware.ts` - Auth protection
- `components.json` - shadcn/ui config

### Database
- `supabase/migrations/001_initial_schema.sql` - Database schema
- `types/database.ts` - TypeScript types

### Auth
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client
- `app/login/page.tsx` - Login page
- `app/auth/signout/route.ts` - Sign out endpoint

### Dashboard
- `app/dashboard/page.tsx` - Client list
- `app/dashboard/clients/new/page.tsx` - Add client form
- `app/dashboard/layout.tsx` - Dashboard layout

---

## 🗄️ Database Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `clients` | Client info | name, domain, status |
| `tasks` | Month 0-12 tasks | client_id, month, status |
| `metrics` | Performance data | client_id, date, traffic |
| `keywords` | Keyword tracking | client_id, keyword, position |
| `content` | Content pieces | client_id, title, status |
| `backlinks` | Backlink monitoring | client_id, source_url, status |
| `reports` | Generated reports | client_id, month, year |
| `client_interviews` | AI questionnaires | client_id, questions, responses |

---

## 🔧 Common Commands

### Install new component
```bash
npx shadcn@latest add [component-name]
```

### Type check
```bash
npm run type-check
```

### Lint
```bash
npm run lint
```

### Build
```bash
npm run build
```

---

## 🔐 Environment Variables

Required in `.env.local`:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# API Keys (for Week 2+)
GOOGLE_ANALYTICS_CREDENTIALS=
GOOGLE_SEARCH_CONSOLE_CREDENTIALS=
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=
ANTHROPIC_API_KEY=
```

---

## 📊 Supabase Queries

### Get all clients
```sql
SELECT * FROM clients ORDER BY created_at DESC;
```

### Get client with tasks
```sql
SELECT c.*, t.*
FROM clients c
LEFT JOIN tasks t ON t.client_id = c.id
WHERE c.id = 'client-uuid';
```

### Get latest metrics
```sql
SELECT * FROM metrics
WHERE client_id = 'client-uuid'
ORDER BY date DESC
LIMIT 30;
```

### Get Month 0 tasks
```sql
SELECT * FROM tasks
WHERE client_id = 'client-uuid'
AND month = 0
ORDER BY created_at;
```

---

## 🛠️ Useful Code Snippets

### Create Supabase client (server component)
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data, error } = await supabase
  .from('clients')
  .select('*')
```

### Create Supabase client (client component)
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data, error } = await supabase
  .from('clients')
  .insert([{ name: 'Test' }])
```

### Get current user
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Redirect to login
```typescript
import { redirect } from 'next/navigation'
redirect('/login')
```

---

## 🎨 UI Components Available

From shadcn/ui:
- `Button` - Buttons with variants
- `Card` - Card containers
- `Input` - Form inputs
- `Label` - Form labels
- `Table` - Data tables
- `Badge` - Status badges

Usage:
```typescript
import { Button } from '@/components/ui/button'
<Button variant="outline">Click me</Button>
```

---

## 🐛 Debug Checklist

### Login not working?
1. Check Supabase URL in `.env.local`
2. Verify user exists and is confirmed
3. Check browser console for errors
4. Try creating new user with "Auto Confirm"

### Database query failing?
1. Check Supabase logs (Logs section)
2. Verify RLS policies allow access
3. Test query in SQL Editor
4. Check user is authenticated

### Page not loading?
1. Check terminal for Next.js errors
2. Look for TypeScript errors
3. Verify all imports are correct
4. Try `rm -rf .next && npm run dev`

### Build failing?
1. Run `npm run type-check`
2. Fix TypeScript errors
3. Run `npm run lint`
4. Fix linting errors

---

## 📱 Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Public | Redirects to dashboard |
| `/login` | Public | Login page |
| `/dashboard` | Protected | Client list |
| `/dashboard/clients/new` | Protected | Add client |
| `/dashboard/clients/[id]` | Protected | Client detail (TODO) |
| `/auth/callback` | Public | OAuth callback |
| `/auth/signout` | Public | Sign out |

---

## 🔒 Security Notes

### Safe to commit:
- `NEXT_PUBLIC_*` variables
- Supabase `anon` key (protected by RLS)
- All code files

### NEVER commit:
- `.env.local`
- Service role keys
- API secrets
- Passwords

### RLS is active on all tables
- Users can only access what RLS allows
- Current policy: All authenticated users can read/write
- Refine later for per-client access

---

## 📞 Quick Help

### Supabase not responding?
- Check project is not paused
- Verify internet connection
- Try refreshing dashboard

### Need to reset?
1. Delete all data: Supabase → Table Editor → Delete rows
2. Re-run migration: SQL Editor → Run migration file
3. Create new user: Authentication → Add user

### Port 3000 in use?
```bash
npm run dev -- -p 3001
```

---

## 🚀 Week 2 Preview

**Coming next:**
- `/lib/api/dataforseo.ts` - DataForSEO API client
- `/lib/automation/tasks.ts` - Task automation runner
- `/app/dashboard/clients/[id]/page.tsx` - Client detail page
- Month 0 automation scripts

**API endpoints to build:**
- POST `/api/automation/keyword-research`
- POST `/api/automation/technical-audit`
- POST `/api/automation/competitor-analysis`
- GET `/api/clients/[id]/metrics`

---

**Last Updated:** October 29, 2025
**Version:** 1.0 (Week 1 MVP)
**Status:** Production Ready 🚀
