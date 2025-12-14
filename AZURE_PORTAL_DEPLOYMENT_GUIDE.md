# Clinical Recipe System - Azure Portal Deployment Guide
## No Command Line Required - Visual Step-by-Step Guide

---

## Overview

This guide will walk you through deploying the Clinical Recipe System using only the Azure Portal web interface. No command line or Azure CLI needed!

**What you'll create:**
- Frontend: Azure Static Web App (Free)
- Backend: Azure Container App (~$13-20/month)
- Database: MongoDB Atlas (Free - already set up)
- Custom Domain: clinical-recipes.askdogood.com

**Total Time:** 30-45 minutes
**Total Cost:** ~$13-20/month

---

## Prerequisites

✅ Azure account (logged in via GitHub)
✅ Subscription ID: d7e6c9eb-e5ca-44b8-b3a3-2c3d9b9e4169
✅ Resource Group: askdogood-rg
✅ MongoDB connection string ready
✅ GitHub repository: https://github.com/MooreTechnologyStrategists/clinical-recipe-system

---

## Part 1: Create Azure Container Registry

### Step 1.1: Navigate to Container Registries

1. Go to https://portal.azure.com
2. In the search bar at the top, type **"Container registries"**
3. Click **"Container registries"** from the results
4. Click **"+ Create"** button

### Step 1.2: Configure Basic Settings

Fill in the form:

| Field | Value |
|-------|-------|
| **Subscription** | Select your subscription (d7e6c9eb...) |
| **Resource group** | askdogood-rg |
| **Registry name** | `askdogoodcr` (must be unique, lowercase, no spaces) |
| **Location** | East US 2 |
| **SKU** | Basic ($5/month) |

### Step 1.3: Enable Admin User

1. Click **"Review + create"**
2. Click **"Create"**
3. Wait for deployment (1-2 minutes)
4. Click **"Go to resource"**
5. In the left menu, click **"Access keys"**
6. Toggle **"Admin user"** to **Enabled**
7. **Copy and save:**
   - Username
   - password (either one)

**Save these credentials - you'll need them later!**

---

## Part 2: Build and Push Docker Images

Since we can't use command line, we'll use **Azure Container Registry Tasks** to build directly from GitHub.

### Step 2.1: Build Backend Image

1. In your Container Registry (askdogoodcr), click **"Tasks"** in the left menu
2. Click **"+ Quick task"**
3. Fill in:
   - **Task name:** `build-backend`
   - **Source location:** GitHub
   - **Repository:** `https://github.com/MooreTechnologyStrategists/clinical-recipe-system`
   - **Branch:** `main`
   - **Dockerfile:** `backend/Dockerfile`
   - **Image name:** `clinical-recipes-backend:latest`
   - **Context path:** `backend`
4. Click **"Run"**
5. Wait for build to complete (5-10 minutes)

### Step 2.2: Verify Image

1. In your Container Registry, click **"Repositories"** in left menu
2. You should see `clinical-recipes-backend`
3. Click it to verify the image exists

---

## Part 3: Create Container Apps Environment

### Step 3.1: Navigate to Container Apps

1. In Azure Portal search bar, type **"Container Apps"**
2. Click **"Container Apps"**
3. Click **"+ Create"**

### Step 3.2: Create Environment First

1. On the "Create Container App" page, under **Environment**, click **"Create new"**
2. Fill in:
   - **Environment name:** `askdogood-env`
   - **Zone redundancy:** Disabled (to save cost)
3. Click **"Create"**
4. Wait for environment creation (2-3 minutes)

---

## Part 4: Deploy Backend Container App

### Step 4.1: Configure Container App Basics

| Field | Value |
|-------|-------|
| **Subscription** | Your subscription |
| **Resource group** | askdogood-rg |
| **Container app name** | `clinical-recipes-api` |
| **Region** | East US 2 |
| **Container Apps Environment** | askdogood-env |

Click **"Next: Container"**

### Step 4.2: Configure Container

| Field | Value |
|-------|-------|
| **Name** | backend |
| **Image source** | Azure Container Registry |
| **Registry** | askdogoodcr.azurecr.io |
| **Image** | clinical-recipes-backend |
| **Image tag** | latest |
| **Registry login** | Admin credentials |
| **Username** | (from Step 1.3) |
| **Password** | (from Step 1.3) |

**CPU and Memory:**
- **CPU cores:** 0.5
- **Memory (Gi):** 1.0

Click **"Next: Bindings"** → **"Next: Ingress"**

### Step 4.3: Configure Ingress

| Field | Value |
|-------|-------|
| **Ingress** | Enabled |
| **Ingress traffic** | Accepting traffic from anywhere |
| **Ingress type** | HTTP |
| **Target port** | 8001 |

Click **"Next: Secrets"**

### Step 4.4: Add Secrets

Click **"+ Add"** for each secret:

**Secret 1:**
- **Key:** `mongo-url`
- **Value:** `mongodb+srv://askdogood:EsjVZTM8Y2V7rE5u@highwayzapp.mnvj9fh.mongodb.net/clinical_recipe_db?appName=HighwayzApp`

**Secret 2:**
- **Key:** `emergent-llm-key`
- **Value:** `sk-emergent-364Fd7c0d1cB024A64`

Click **"Next: Environment variables"**

### Step 4.5: Add Environment Variables

Click **"+ Add"** for each variable:

| Name | Source | Value/Reference |
|------|--------|-----------------|
| `MONGO_URL` | Reference a secret | mongo-url |
| `EMERGENT_LLM_KEY` | Reference a secret | emergent-llm-key |
| `DB_NAME` | Manual entry | clinical_recipe_db |
| `CORS_ORIGINS` | Manual entry | https://clinical-recipes.askdogood.com |

Click **"Next: Scale"**

### Step 4.6: Configure Scaling

| Field | Value |
|-------|-------|
| **Min replicas** | 1 |
| **Max replicas** | 3 |

Click **"Review + create"** → **"Create"**

Wait for deployment (3-5 minutes)

### Step 4.7: Get Backend URL

1. Once deployed, click **"Go to resource"**
2. In the **Overview** page, find **"Application Url"**
3. **Copy this URL** - it will look like:
   ```
   https://clinical-recipes-api.something.azurecontainerapps.io
   ```
4. **Save this URL - you'll need it for the frontend!**

### Step 4.8: Test Backend

1. Open a new browser tab
2. Go to: `[YOUR_BACKEND_URL]/health`
3. You should see: `{"status":"healthy"}`

If you see that, the backend is working! ✅

---

## Part 5: Deploy Frontend to Static Web Apps

### Step 5.1: Create Static Web App

1. In Azure Portal search, type **"Static Web Apps"**
2. Click **"Static Web Apps"**
3. Click **"+ Create"**

### Step 5.2: Configure Basics

| Field | Value |
|-------|-------|
| **Subscription** | Your subscription |
| **Resource group** | askdogood-rg |
| **Name** | `clinical-recipes` |
| **Plan type** | Free |
| **Region** | East US 2 |

### Step 5.3: Configure Deployment

| Field | Value |
|-------|-------|
| **Source** | GitHub |
| **GitHub Account** | (Click "Sign in with GitHub" if needed) |
| **Organization** | MooreTechnologyStrategists |
| **Repository** | clinical-recipe-system |
| **Branch** | main |

**Build Details:**
| Field | Value |
|-------|-------|
| **Build Presets** | React |
| **App location** | `/frontend` |
| **Api location** | (leave empty) |
| **Output location** | `build` |

### Step 5.4: Configure Environment Variable

1. Click **"Review + create"**
2. Click **"Create"**
3. Wait for deployment (2-3 minutes)
4. Click **"Go to resource"**

### Step 5.5: Add Backend URL to Frontend

1. In your Static Web App, click **"Configuration"** in left menu
2. Click **"Application settings"**
3. Click **"+ Add"**
4. Add this setting:
   - **Name:** `REACT_APP_BACKEND_URL`
   - **Value:** (Your backend URL from Step 4.7)
5. Click **"Save"**

### Step 5.6: Get Frontend URL

1. In the **Overview** page, find **"URL"**
2. It will look like: `https://happy-cliff-12345.azurestaticapps.net`
3. **Copy this URL**
4. Open it in a browser to test

The frontend should load! It might take a few minutes for the GitHub Actions deployment to complete.

---

## Part 6: Configure Custom Domain

### Step 6.1: Add Custom Domain in Azure

1. In your Static Web App, click **"Custom domains"** in left menu
2. Click **"+ Add"**
3. Select **"Custom domain on other DNS"**
4. Enter: `clinical-recipes.askdogood.com`
5. Click **"Next"**
6. Azure will show you a CNAME record to add

### Step 6.2: Add DNS Record

1. Go to your DNS provider (where askdogood.com is hosted)
2. Add a new CNAME record:
   - **Name/Host:** `clinical-recipes`
   - **Type:** CNAME
   - **Value:** (the value Azure showed you - your .azurestaticapps.net URL)
   - **TTL:** 3600

3. Save the DNS record
4. Wait 5-10 minutes for DNS propagation

### Step 6.3: Validate Domain

1. Back in Azure Portal, click **"Validate"**
2. If validation succeeds, click **"Add"**
3. Azure will automatically provision an SSL certificate (free)

Wait 10-15 minutes for SSL certificate to be issued.

### Step 6.4: Test Custom Domain

1. Open: `https://clinical-recipes.askdogood.com`
2. The app should load with a valid SSL certificate! ✅

---

## Part 7: Update AskDoGood.com Integration

### Step 7.1: Update Clinical Recipe URL

1. Go to your askdogood repository
2. Open: `client/src/config/clinicalRecipes.ts`
3. Change the URL to:
   ```typescript
   export const DEFAULT_CLINICAL_RECIPE_APP_URL =
     "https://clinical-recipes.askdogood.com/";
   ```
4. Commit and push the change

---

## Part 8: Verify Everything Works

### Test Checklist:

✅ **Backend Health Check**
- Go to: `[backend-url]/health`
- Should see: `{"status":"healthy"}`

✅ **Frontend Loads**
- Go to: `https://clinical-recipes.askdogood.com`
- Page loads without errors

✅ **Recipe Generation Works**
- Enter health conditions
- Click "Generate Recipe"
- Recipe appears within 10-15 seconds

✅ **No "Wake Up Servers" Button**
- App loads immediately
- No sleep delays

✅ **Integration with AskDoGood.com**
- Go to askdogood.com
- Navigate to Clinical Recipes section
- Embedded app loads correctly

---

## Troubleshooting

### Issue: Backend won't start

**Solution:**
1. Go to Container App → Logs
2. Check for errors
3. Verify environment variables are set correctly
4. Verify MongoDB connection string is correct

### Issue: Frontend shows "Failed to fetch"

**Solution:**
1. Check that REACT_APP_BACKEND_URL is set in Static Web App configuration
2. Verify backend URL is correct and accessible
3. Check CORS_ORIGINS in backend includes your frontend domain

### Issue: Custom domain not working

**Solution:**
1. Verify DNS record is correct (use https://dnschecker.org)
2. Wait longer - DNS can take up to 24 hours
3. Try clearing browser cache
4. Check SSL certificate status in Azure Portal

### Issue: Recipe generation fails

**Solution:**
1. Check backend logs for errors
2. Verify Emergent LLM API key is correct
3. Verify MongoDB connection is working
4. Test backend health endpoint

---

## Cost Summary

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Azure Static Web App | Free | $0 |
| Azure Container App | Consumption | $13-20 |
| Azure Container Registry | Basic | $5 |
| MongoDB Atlas | M0 Free | $0 |
| **Total** | | **$18-25/month** |

---

## Monitoring and Maintenance

### View Logs

**Backend Logs:**
1. Go to Container App
2. Click "Log stream" in left menu
3. View real-time logs

**Frontend Logs:**
1. Go to Static Web App
2. Click "Functions" → "Monitor"
3. View deployment logs

### Scale Backend

If you need more performance:
1. Go to Container App
2. Click "Scale"
3. Increase max replicas or CPU/memory

### Update Backend

1. Make code changes in GitHub
2. In Container Registry, run a new Quick Task
3. In Container App, click "Revision management"
4. Create new revision with updated image

### Update Frontend

1. Make code changes in GitHub
2. Push to main branch
3. GitHub Actions automatically rebuilds and deploys

---

## Success!

You now have:
✅ Always-on Clinical Recipe app
✅ Professional custom domain with SSL
✅ Automatic deployments from GitHub
✅ Scalable infrastructure
✅ No sleep issues

**Your app is live at:**
🌐 https://clinical-recipes.askdogood.com

---

## Next Steps

1. Monitor usage for first week
2. Check costs in Azure Cost Management
3. Set up alerts for errors
4. Consider adding Application Insights for detailed monitoring
5. Update askdogood.com marketing to promote the new app

---

## Support

If you encounter issues:
1. Check troubleshooting section above
2. Review Azure Portal logs
3. Check GitHub Actions deployment status
4. Contact Azure support if needed

---

**Deployment Guide Version:** 1.0
**Last Updated:** December 14, 2024
**Created by:** Manus AI Assistant
