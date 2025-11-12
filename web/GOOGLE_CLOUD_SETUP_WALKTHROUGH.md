# 🚀 Google Cloud Console Setup - Step-by-Step

**Time Required:** 10 minutes
**Difficulty:** Easy (with screenshots)
**What You Get:** GA4 + GSC + GBP integration working!

---

## ✅ What We're Setting Up

Your CAIT system will connect to:
- ✅ **Google Analytics 4** - Traffic metrics
- ✅ **Google Search Console** - Search performance
- ✅ **Google Business Profile** - Business locations

---

## 📋 Step 1: Go to Google Cloud Console

1. **Open:** https://console.cloud.google.com/
2. **Sign in** with your Google Workspace account

---

## 🏗️ Step 2: Create or Select Project

### Option A: Create New Project
1. Click the project dropdown (top-left, near "Google Cloud")
2. Click **"NEW PROJECT"**
3. **Project name:** `CAIT SEO Automation`
4. **Organization:** Select your domain
5. Click **CREATE**
6. Wait 10 seconds for project creation
7. Select your new project from the dropdown

### Option B: Use Existing Project
1. Select your existing project from dropdown
2. Continue to Step 3

---

## 🔌 Step 3: Enable Required APIs

You need to enable **4 APIs**. Here's how:

1. In the left sidebar, click: **APIs & Services** → **Library**
2. Enable these APIs one by one:

### API #1: Google Analytics Admin API
```
Search: "Analytics Admin API"
Click: "Google Analytics Admin API"
Click: "ENABLE"
Wait for "API enabled" message
```

### API #2: Google Analytics Data API
```
Search: "Analytics Data API"
Click: "Google Analytics Data API"
Click: "ENABLE"
Wait for "API enabled" message
```

### API #3: Google Search Console API
```
Search: "Search Console API"
Click: "Google Search Console API"
Click: "ENABLE"
Wait for "API enabled" message
```

### API #4: Google Business Profile APIs
```
Search: "My Business Account Management API"
Click: "My Business Account Management API"
Click: "ENABLE"

Then search: "My Business Business Information API"
Click: "My Business Business Information API"
Click: "ENABLE"
```

**✅ All 5 APIs enabled!**

---

## 🔐 Step 4: Configure OAuth Consent Screen

This is what users see when connecting Google.

1. Go to: **APIs & Services** → **OAuth consent screen**

2. **User Type:** Select **"Internal"** ✅
   - *(Because you have Google Workspace!)*
   - *(This skips app verification)*
   - Click **CREATE**

3. **App information:**
   ```
   App name: CAIT - SEO Automation
   User support email: [your email]
   App logo: (optional, skip for now)
   ```

4. **App domain:** (optional for now)
   ```
   Application home page: https://yourdomain.com
   (or leave blank)
   ```

5. **Developer contact:**
   ```
   Email: [your email]
   ```

6. Click **SAVE AND CONTINUE**

7. **Scopes:** Click **ADD OR REMOVE SCOPES**
   - Search and select these scopes:
   ```
   ✅ .../auth/analytics.readonly
   ✅ .../auth/webmasters.readonly
   ✅ .../auth/business.manage
   ✅ openid
   ✅ email
   ✅ profile
   ```
   - Click **UPDATE**
   - Click **SAVE AND CONTINUE**

8. **Summary:** Review and click **BACK TO DASHBOARD**

**✅ OAuth consent screen configured!**

---

## 🔑 Step 5: Create OAuth Client ID

This is what you'll add to `.env.local`:

1. Go to: **APIs & Services** → **Credentials**

2. Click: **+ CREATE CREDENTIALS** → **OAuth client ID**

3. **Application type:** Select **"Web application"**

4. **Name:** `CAIT Web Client`

5. **Authorized JavaScript origins:** (optional, can skip)

6. **Authorized redirect URIs:** Click **+ ADD URI**
   ```
   Add: http://localhost:3000/api/auth/google/callback
   ```

   *For production later, also add:*
   ```
   Add: https://yourdomain.com/api/auth/google/callback
   ```

7. Click **CREATE**

8. **Important:** Copy your credentials! 📝
   ```
   Client ID: xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
   Client secret: GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
   ```

   **Keep this window open!** You'll need these in the next step.

**✅ OAuth credentials created!**

---

## ⚙️ Step 6: Update Environment Variables

1. **Open** your `.env.local` file in CAIT:
   ```bash
   code /path/to/cait/web/.env.local
   ```

2. **Update** these lines:
   ```env
   GOOGLE_OAUTH_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret_here
   ```

3. **Paste** your actual credentials from Step 5

4. **Save** the file

**✅ Environment variables configured!**

---

## 🗄️ Step 7: Run Database Migration

You need to add the OAuth columns to your database:

### Option A: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click: **SQL Editor** in the left sidebar
4. Click: **+ New query**
5. **Copy/paste** the entire contents of:
   ```
   cait/web/supabase/migrations/002_google_oauth.sql
   ```
6. Click: **Run** (or press Cmd/Ctrl + Enter)
7. Look for: **"Success. No rows returned"** ✅

### Option B: Command Line (If you have Supabase CLI)

```bash
cd /path/to/cait/web
supabase db push
```

**✅ Database schema updated!**

---

## 🔄 Step 8: Restart Your Server

The server needs to reload the new environment variables:

1. **Stop** the current server (press Ctrl+C in the terminal running `npm run dev`)

2. **Start** it again:
   ```bash
   cd /path/to/cait/web
   npm run dev
   ```

3. **Wait** for: `✓ Ready in XXXXms`

**✅ Server restarted with new credentials!**

---

## 🧪 Step 9: Test the Connection

Time to see if it works!

1. **Open:** http://localhost:3000

2. **Login** to CAIT

3. **Go to:** Dashboard → Clients

4. **Open** a client (or create a test client)

5. **Look for:** "Connect Google" card

6. **Click:** "Connect Google Account" button

7. **You should see:** Google OAuth consent screen

8. **Select** your Google account

9. **Click:** "Allow" to grant permissions

10. **You're redirected back** to CAIT

11. **Success!** You should see:
    ```
    ✅ Google Connected

    Google Analytics 4 Properties
    - [Your GA4 properties listed]

    Search Console Sites
    - [Your GSC sites listed]

    Google Business Profile Locations
    - [Your GBP locations listed]
    ```

**✅ OAuth integration working!**

---

## 🎉 Success Checklist

Mark these off as you complete them:

- [ ] Google Cloud Console project created/selected
- [ ] All 5 APIs enabled (GA4 Admin, GA4 Data, GSC, GBP x2)
- [ ] OAuth consent screen configured (Internal)
- [ ] OAuth client ID created
- [ ] Credentials copied to `.env.local`
- [ ] Database migration applied
- [ ] Server restarted
- [ ] "Connect Google" button appears in CAIT
- [ ] OAuth flow completes successfully
- [ ] GA4 properties, GSC sites, and GBP locations discovered

**All checked?** 🎉 **You're done!**

---

## 🐛 Troubleshooting

### Error: "Redirect URI mismatch"

**Problem:** The redirect URI doesn't match what you configured

**Fix:**
1. Go to: Google Cloud Console → Credentials
2. Edit your OAuth client
3. Make sure you have: `http://localhost:3000/api/auth/google/callback`
4. Check for typos (no trailing slash!)

### Error: "Access blocked: This app's request is invalid"

**Problem:** OAuth consent screen not configured

**Fix:**
1. Go to: OAuth consent screen
2. Make sure "User Type" is "Internal"
3. Make sure all required fields are filled
4. Make sure scopes are added

### Error: "Google OAuth credentials not configured"

**Problem:** Environment variables not loaded

**Fix:**
1. Check `.env.local` has correct values
2. Restart the server (Ctrl+C, then `npm run dev`)
3. Make sure file is named `.env.local` (not `.env`)

### No Properties/Sites/Locations Found

**Problem:** Your Google account doesn't have access

**Fix:**
1. Make sure you logged in with the right Google account
2. Verify you have GA4/GSC/GBP access in those platforms
3. Try disconnecting and reconnecting

### Server Won't Start

**Problem:** Syntax error in `.env.local`

**Fix:**
1. Check for extra quotes or spaces
2. Make sure each line is: `KEY=value` (no spaces around `=`)
3. Make sure Client ID ends with `.apps.googleusercontent.com`

---

## 📊 What You Can Do Now

With Google connected, CAIT can:

✅ **Fetch GA4 metrics** for any connected property
✅ **Pull GSC data** for any connected site
✅ **Access GBP locations** for any connected business
✅ **Generate automated reports** using real data
✅ **Track performance** over time
✅ **Identify opportunities** in search data

---

## 🚀 Next Steps

1. **Test with real client:**
   - Create a real client in CAIT
   - Connect their Google account
   - Verify their properties appear

2. **Test automation:**
   - Run keyword research automation
   - Run technical audit automation
   - Generate a monthly report

3. **Deploy to production:**
   - Add production redirect URI to Google Cloud
   - Update `NEXT_PUBLIC_APP_URL` in production
   - Test OAuth flow in production

---

## 📞 Need Help?

**Check these first:**
- Server logs: Look at terminal running `npm run dev`
- Browser console: F12 → Console tab
- Supabase logs: Dashboard → Logs section

**Common issues:**
- APIs not enabled → Enable all 5 APIs
- Wrong redirect URI → Must match exactly
- Environment variables → Restart server after changing

---

**Status:** ✅ Ready to connect
**Time to complete:** 10 minutes
**Difficulty:** Easy
**Support:** Workspace makes this much simpler!

🎉 **Let's get Google connected!**
