# CAIT Setup Guide

Complete step-by-step guide to get CAIT running on your machine.

## ⏱️ Estimated Time: 20 minutes

---

## Step 1: Install Node.js (5 min)

1. Check if Node.js is installed:
   ```bash
   node --version
   ```

2. If not installed or version < 18, download from [nodejs.org](https://nodejs.org/)

3. Verify installation:
   ```bash
   node --version  # Should show v18 or higher
   npm --version   # Should show v9 or higher
   ```

---

## Step 2: Set Up Supabase (10 min)

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New project"
3. Fill in:
   - **Name:** CAIT
   - **Database Password:** (create a strong password)
   - **Region:** Choose closest to you
4. Wait 2-3 minutes for project creation

### Get API Credentials

1. Go to **Project Settings** (gear icon)
2. Click **API** in sidebar
3. Copy these values (save them somewhere):
   - **Project URL** (under Project URL)
   - **anon public** key (under Project API keys)

### Create Database Schema

1. Go to **SQL Editor** in sidebar
2. Click **+ New query**
3. Open `supabase/migrations/001_initial_schema.sql` from this project
4. Copy entire file content
5. Paste into Supabase SQL editor
6. Click **Run** (bottom right)
7. Wait for "Success. No rows returned"

### Create First User

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Fill in:
   - **Email:** your email
   - **Password:** your password
   - Check "Auto Confirm User"
4. Click **Create user**

---

## Step 3: Configure CAIT (5 min)

### Clone/Navigate to Project

```bash
cd /path/to/ClaudeCode-Agency/cait/web
```

### Install Dependencies

```bash
npm install
```

Wait for installation to complete (2-3 minutes)

### Set Up Environment Variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` in your text editor

3. Fill in Supabase credentials (from Step 2):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

4. Leave other API keys empty for now (we'll add them later)

---

## Step 4: Run CAIT (1 min)

### Start Development Server

```bash
npm run dev
```

You should see:
```
✓ Ready in 2.5s
○ Local:   http://localhost:3000
```

### Open in Browser

1. Open [http://localhost:3000](http://localhost:3000)
2. You'll be redirected to `/login`
3. Sign in with credentials from Step 2
4. You should see the CAIT dashboard!

---

## ✅ Verification Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase project created
- [ ] Database schema migrated (8 tables created)
- [ ] User account created
- [ ] Dependencies installed
- [ ] `.env.local` configured
- [ ] Development server running
- [ ] Can log in and see dashboard

---

## 🎉 Success!

You now have CAIT running locally. Next steps:

1. **Add your first client:**
   - Click "Add Client" on dashboard
   - Fill in client details
   - Save

2. **Explore the database:**
   - Go to Supabase → Table Editor
   - You'll see your client in the `clients` table

3. **Next: API Integration (Week 2)**
   - Google Analytics 4
   - Google Search Console
   - DataForSEO
   - Anthropic (Claude)

---

## 🐛 Troubleshooting

### "Module not found" errors

**Solution:** Delete node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Invalid login credentials"

**Solutions:**
1. Check email/password are correct
2. Ensure user is confirmed in Supabase Dashboard
3. Try creating a new user with "Auto Confirm User" checked

### "Failed to fetch" or network errors

**Solutions:**
1. Check `.env.local` has correct Supabase URL
2. Ensure URL starts with `https://`
3. Verify project is not paused in Supabase

### Database tables not found

**Solution:** Re-run the migration
1. Go to Supabase SQL Editor
2. Delete all queries
3. Create new query with migration file
4. Run it again

### Port 3000 already in use

**Solution:** Use a different port
```bash
npm run dev -- -p 3001
```

Then visit [http://localhost:3001](http://localhost:3001)

---

## 📞 Need Help?

1. Check browser console (F12) for errors
2. Check terminal for server errors
3. Check Supabase logs (Logs section in dashboard)
4. Contact the development team

---

## 🔒 Security Notes

- **Never commit `.env.local`** to git (it's in `.gitignore`)
- Keep your Supabase password secure
- The `anon` key is safe to expose (it's protected by RLS)
- Service role key (when you get one) must be kept secret

---

## 🚀 Next: Production Deployment

Once you're ready to deploy:

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

See README.md for deployment instructions.
