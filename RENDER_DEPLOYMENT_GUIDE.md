# Clinical Recipe System - Render.com Deployment Guide
## Simple, Fast, and Free/Low-Cost Deployment

---

## Why Render.com?

✅ **Simple** - Deploy in 10 minutes with just clicks
✅ **Free tier available** - Start at $0/month
✅ **Always-on option** - $7/month for no sleep
✅ **Builds from GitHub** - No Docker registry needed
✅ **Auto-deploy** - Push to GitHub = automatic deployment
✅ **Free SSL** - HTTPS included
✅ **Easy to use** - Web interface, no command line

**Cost Comparison:**
- Render.com: $0-7/month
- Azure: $18-25/month
- **You save: $11-25/month!**

---

## Part 1: Deploy Backend to Render.com

### Step 1.1: Create Render Account

1. Go to https://render.com
2. Click **"Get Started"**
3. Sign up with your **GitHub account** (easiest option)
4. Authorize Render to access your GitHub repositories

### Step 1.2: Create Web Service

1. Once logged in, click **"New +"** in the top right
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select: **`MooreTechnologyStrategists/clinical-recipe-system`**
5. Click **"Connect"**

### Step 1.3: Configure Service

Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | `clinical-recipes-api` |
| **Region** | Oregon (US West) or Ohio (US East) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn server:app --host 0.0.0.0 --port $PORT` |

### Step 1.4: Choose Plan

**Free Tier (Recommended to start):**
- Cost: $0/month
- Spins down after 15 minutes of inactivity
- Spins back up in ~30 seconds when accessed
- 750 hours/month free

**OR - Starter Plan (Always-on):**
- Cost: $7/month
- Always running (no sleep)
- Better for production

**Choose Free for now** - you can upgrade anytime!

### Step 1.5: Add Environment Variables

Scroll down to **"Environment Variables"** section.

Click **"Add Environment Variable"** for each:

| Key | Value |
|-----|-------|
| `MONGO_URL` | `mongodb+srv://askdogood:EsjVZTM8Y2V7rE5u@highwayzapp.mnvj9fh.mongodb.net/clinical_recipe_db?appName=HighwayzApp` |
| `EMERGENT_LLM_KEY` | `sk-emergent-364Fd7c0d1cB024A64` |
| `DB_NAME` | `clinical_recipe_db` |
| `CORS_ORIGINS` | `https://clinical-recipes.askdogood.com,https://askdogood.com` |
| `PORT` | `8001` |

### Step 1.6: Deploy!

1. Click **"Create Web Service"** at the bottom
2. Render will:
   - Clone your repository
   - Install dependencies
   - Start your server
3. Watch the logs as it deploys (takes 2-3 minutes)
4. When you see "Deploy live" - it's ready! ✅

### Step 1.7: Get Your Backend URL

1. At the top of the page, you'll see your service URL
2. It will look like: `https://clinical-recipes-api.onrender.com`
3. **Copy this URL** - you'll need it for the frontend!

### Step 1.8: Test Backend

1. Open a new browser tab
2. Go to: `https://clinical-recipes-api.onrender.com/health`
3. You should see: `{"status":"healthy"}`

**If you see that, your backend is live!** ✅

---

## Part 2: Deploy Frontend

You have two options for the frontend:

### Option A: Vercel (Recommended - Easiest)

**Step 2A.1: Create Vercel Account**

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Sign up with **GitHub**
4. Authorize Vercel

**Step 2A.2: Import Project**

1. Click **"Add New..."** → **"Project"**
2. Find **`clinical-recipe-system`**
3. Click **"Import"**

**Step 2A.3: Configure**

| Field | Value |
|-------|-------|
| **Framework Preset** | Create React App |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |

**Step 2A.4: Add Environment Variable**

Click **"Environment Variables"**:
- **Name:** `REACT_APP_BACKEND_URL`
- **Value:** `https://clinical-recipes-api.onrender.com` (your Render URL)

**Step 2A.5: Deploy**

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your frontend is live!

**Step 2A.6: Get Frontend URL**

Your URL will be: `https://clinical-recipe-system.vercel.app`

---

### Option B: Azure Static Web Apps (If you prefer Azure)

**Step 2B.1: Create Static Web App**

1. Go to Azure Portal: https://portal.azure.com
2. Search **"Static Web Apps"**
3. Click **"+ Create"**

**Step 2B.2: Configure**

| Field | Value |
|-------|-------|
| **Subscription** | Your subscription |
| **Resource group** | askdogood-rg |
| **Name** | `clinical-recipes` |
| **Plan type** | Free |
| **Region** | East US 2 |
| **Source** | GitHub |
| **Repository** | clinical-recipe-system |
| **Branch** | main |
| **App location** | `/frontend` |
| **Output location** | `build` |

**Step 2B.3: Add Environment Variable**

After deployment:
1. Go to your Static Web App
2. Click **"Configuration"**
3. Add:
   - **Name:** `REACT_APP_BACKEND_URL`
   - **Value:** `https://clinical-recipes-api.onrender.com`

---

## Part 3: Configure Custom Domain

### Step 3.1: For Vercel

1. In Vercel project, click **"Settings"**
2. Click **"Domains"**
3. Enter: `clinical-recipes.askdogood.com`
4. Vercel will show you DNS records to add

### Step 3.2: For Azure Static Web Apps

1. In Static Web App, click **"Custom domains"**
2. Click **"+ Add"**
3. Enter: `clinical-recipes.askdogood.com`
4. Azure will show you DNS records to add

### Step 3.3: Add DNS Records

1. Go to your DNS provider (where askdogood.com is hosted)
2. Add the CNAME record shown by Vercel or Azure
3. Wait 5-10 minutes for DNS propagation
4. Your app will be live at: `https://clinical-recipes.askdogood.com`

---

## Part 4: Update AskDoGood.com

### Step 4.1: Update Configuration

1. In your askdogood repository
2. Edit: `client/src/config/clinicalRecipes.ts`
3. Change URL to:
   ```typescript
   export const DEFAULT_CLINICAL_RECIPE_APP_URL =
     "https://clinical-recipes.askdogood.com/";
   ```
4. Commit and push

---

## Part 5: Handle Free Tier Sleep (Optional)

If you chose Render's free tier, the backend sleeps after 15 minutes of inactivity.

### Option 1: Upgrade to Paid ($7/month)

1. In Render dashboard, go to your service
2. Click **"Settings"**
3. Under **"Instance Type"**, select **"Starter"**
4. Click **"Save Changes"**
5. Now always-on! No sleep.

### Option 2: Add Keep-Alive Ping (Stay Free)

Create a simple cron job to ping your backend every 14 minutes:

**Using cron-job.org (Free):**

1. Go to https://cron-job.org
2. Sign up (free)
3. Create new cron job:
   - **URL:** `https://clinical-recipes-api.onrender.com/health`
   - **Schedule:** Every 14 minutes
   - **Method:** GET
4. Save

This keeps your free tier awake during business hours!

### Option 3: Accept the Sleep

- First request after sleep takes ~30 seconds
- Subsequent requests are instant
- Good enough for low-traffic sites
- Completely free!

---

## Cost Comparison

### Render.com Setup:

| Service | Tier | Cost |
|---------|------|------|
| Backend (Render) | Free | $0/month |
| Frontend (Vercel) | Free | $0/month |
| MongoDB Atlas | Free | $0/month |
| **Total** | | **$0/month** |

**OR with always-on backend:**

| Service | Tier | Cost |
|---------|------|------|
| Backend (Render) | Starter | $7/month |
| Frontend (Vercel) | Free | $0/month |
| MongoDB Atlas | Free | $0/month |
| **Total** | | **$7/month** |

**vs Azure Setup:**

| Service | Tier | Cost |
|---------|------|------|
| Backend (Container Apps) | Consumption | $13-20/month |
| Container Registry | Basic | $5/month |
| Frontend (SWA) | Free | $0/month |
| **Total** | | **$18-25/month** |

**You save $11-25/month with Render!**

---

## Troubleshooting

### Backend won't start

1. Check Render logs (click "Logs" tab)
2. Verify environment variables are set correctly
3. Check MongoDB connection string

### Frontend can't connect to backend

1. Verify `REACT_APP_BACKEND_URL` is set correctly
2. Check CORS_ORIGINS includes your frontend domain
3. Test backend health endpoint directly

### Free tier sleeping too much

1. Upgrade to Starter plan ($7/month)
2. Or add keep-alive ping service
3. Or accept 30-second wake-up time

### Custom domain not working

1. Verify DNS records are correct
2. Wait longer (can take up to 24 hours)
3. Check SSL certificate status

---

## Monitoring

### View Backend Logs

1. Go to Render dashboard
2. Click your service
3. Click **"Logs"** tab
4. See real-time logs

### View Metrics

1. In Render service, click **"Metrics"**
2. See:
   - CPU usage
   - Memory usage
   - Response times
   - Request count

### Set Up Alerts

1. In Render, click **"Settings"**
2. Scroll to **"Notifications"**
3. Add email for deploy failures

---

## Updating Your App

### Backend Updates

1. Make changes in GitHub
2. Push to main branch
3. Render automatically rebuilds and deploys
4. Watch logs to confirm deployment

### Frontend Updates

1. Make changes in GitHub
2. Push to main branch
3. Vercel/Azure automatically rebuilds
4. Live in 2-3 minutes

---

## Success Checklist

✅ Backend deployed to Render
✅ Backend health check returns `{"status":"healthy"}`
✅ Frontend deployed to Vercel or Azure
✅ Frontend loads without errors
✅ Recipe generation works
✅ Custom domain configured (optional)
✅ AskDoGood.com integration updated

---

## Next Steps

1. ✅ Test recipe generation thoroughly
2. ✅ Monitor for 24-48 hours
3. ✅ Decide if free tier works or upgrade to $7/month
4. ✅ Add custom domain
5. ✅ Update askdogood.com marketing
6. ✅ Share with users!

---

## Support

**Render Support:**
- Docs: https://render.com/docs
- Community: https://community.render.com
- Email: support@render.com

**Vercel Support:**
- Docs: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions

---

**Deployment Complete!** 🎉

Your Clinical Recipe app is now:
- ✅ Always accessible (or quick wake-up on free tier)
- ✅ Automatically deployed from GitHub
- ✅ Free or very low cost ($0-7/month)
- ✅ Simple to manage
- ✅ Professional and scalable

**Total deployment time: 10-15 minutes**
**Total cost: $0-7/month**
**Savings vs Azure: $11-25/month**

---

**Guide Version:** 1.0
**Last Updated:** December 14, 2024
**Created by:** Manus AI Assistant
