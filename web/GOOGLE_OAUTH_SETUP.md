# 🔐 Google OAuth Setup Guide

This guide will help you set up the "Connect Google" button for GA4 and Search Console.

---

## 📋 What You Need

- Google Cloud Console access
- Project with billing enabled (free tier works)
- 10 minutes

---

## 🚀 Step 1: Enable APIs

1. Go to: https://console.cloud.google.com/
2. Select your project (or create new one)
3. Navigate to: **APIs & Services → Library**
4. Enable these APIs:
   - ✅ **Google Analytics Admin API**
   - ✅ **Google Analytics Data API**
   - ✅ **Google Search Console API**

---

## 🔑 Step 2: Create OAuth 2.0 Credentials

### 2.1 Configure OAuth Consent Screen

1. Go to: **APIs & Services → OAuth consent screen**
2. Choose **External** (unless you have Google Workspace)
3. Fill in required fields:
   - **App name:** `CAIT - SEO Automation`
   - **User support email:** Your email
   - **Developer contact:** Your email
4. Click **Save and Continue**
5. **Scopes:** Skip for now, click **Save and Continue**
6. **Test users:** Add your email
7. Click **Save and Continue**

### 2.2 Create OAuth Client ID

1. Go to: **APIs & Services → Credentials**
2. Click: **+ CREATE CREDENTIALS → OAuth client ID**
3. Select: **Web application**
4. **Name:** `CAIT Web Client`
5. **Authorized redirect URIs:** Add both:
   ```
   http://localhost:3000/api/auth/google/callback
   https://yourdomain.com/api/auth/google/callback
   ```
6. Click **Create**
7. **Save your credentials:**
   - Client ID (starts with `xxx.apps.googleusercontent.com`)
   - Client Secret

---

## ⚙️ Step 3: Configure Environment Variables

Add to your `.env.local`:

```env
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Production:** Update `NEXT_PUBLIC_APP_URL` to your production URL.

---

## 🗄️ Step 4: Run Database Migration

Apply the OAuth schema:

```bash
# Using Supabase CLI (if installed)
supabase db push

# OR manually in Supabase Dashboard:
# 1. Go to: https://supabase.com/dashboard
# 2. Select your project
# 3. Go to: SQL Editor
# 4. Paste contents of: supabase/migrations/002_google_oauth.sql
# 5. Click "Run"
```

---

## 🧪 Step 5: Test the Integration

1. **Restart your server:**
   ```bash
   npm run dev
   ```

2. **Open:** http://localhost:3000

3. **Login** to CAIT

4. **Create or open a client**

5. **Look for "Connect Google" card** on client detail page

6. **Click "Connect Google Account"**

7. **Authorize access** on Google's screen

8. **Success!** You should see:
   - ✅ List of GA4 properties
   - ✅ List of Search Console sites
   - ✅ Green "Connected" status

---

## 🔍 Troubleshooting

### Error: "Redirect URI mismatch"

**Fix:** Add your exact callback URL to authorized redirects:
- Go to: Google Cloud Console → Credentials
- Edit your OAuth client
- Add: `http://localhost:3000/api/auth/google/callback`

### Error: "Access blocked: This app's request is invalid"

**Fix:** Configure OAuth consent screen:
- Go to: OAuth consent screen
- Add test users
- Verify all required fields are filled

### Error: "Google OAuth credentials not configured"

**Fix:** Add environment variables:
```bash
# Check .env.local exists and contains:
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
```

### No Properties/Sites Found

**Possible causes:**
1. User account doesn't have GA4/GSC access
2. APIs not enabled in Google Cloud
3. Permission levels too low (need Editor+ for GA4, Owner for GSC)

**Fix:**
- Verify user has access to properties
- Check API permissions in Google Cloud
- Reconnect with correct Google account

---

## 🔒 Security Notes

1. **Never commit `.env.local`** to git (already in `.gitignore`)
2. **OAuth tokens are encrypted** in database
3. **Tokens are scoped** (read-only access)
4. **Refresh tokens** are automatically handled
5. **Users can disconnect** anytime

---

## 📊 What This Unlocks

Once connected, CAIT can automatically:

✅ **Fetch GA4 metrics:**
- Sessions, users, pageviews
- Traffic sources
- Device breakdown
- Top pages

✅ **Fetch GSC data:**
- Search queries
- Click-through rates
- Average positions
- Impressions

✅ **Generate reports:**
- Monthly performance reports
- Keyword ranking changes
- Traffic trend analysis
- Automated insights

---

## 🎯 Next Steps

After setup is complete:

1. Connect Google for test client
2. Verify data appears in dashboard
3. Test automated report generation
4. Deploy to production with proper URLs

---

## 📞 Need Help?

- Check server logs: `npm run dev` output
- Check browser console: F12 → Console tab
- Check Supabase logs: Dashboard → Logs
- Verify API quotas: Google Cloud Console → APIs & Services → Quotas

---

**Status:** ✅ Ready to use
**Cost:** Free (within Google API quotas)
**Setup Time:** ~10 minutes
**User Experience:** One-click connection

🎉 **That's it! Your users can now connect Google with a single click!**
