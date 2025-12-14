# Clinical Recipe System - Complete Deployment Guide

## Overview

This guide will help you deploy the Clinical Recipe System to Azure with:
- Frontend on Azure Static Web Apps (Free)
- Backend on Azure Container Apps ($13-20/month)
- MongoDB Atlas (Free tier)
- Custom domain: clinical-recipes.askdogood.com

**Total Cost: ~$13-20/month**

---

## Prerequisites

✅ Azure subscription (ID: d7e6c9eb-e5ca-44b8-b3a3-2c3d9b9e4169)
✅ Resource group: askdogood-rg
✅ GitHub repository access
✅ MongoDB Atlas account
✅ Emergent LLM API key: sk-emergent-364Fd7c0d1cB024A64

---

## Step 1: Set Up MongoDB Atlas (Free)

### 1.1 Create Free Cluster

1. Go to https://cloud.mongodb.com
2. Log in to your account
3. Click "Build a Database"
4. Choose **M0 Free** tier
5. Select region closest to East US 2 (for Azure)
6. Cluster name: `clinical-recipes`
7. Click "Create"

### 1.2 Configure Database Access

1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Username: `clinical-recipes-app`
4. Password: Generate secure password (save it!)
5. Database User Privileges: "Read and write to any database"
6. Click "Add User"

### 1.3 Configure Network Access

1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is needed for Azure Container Apps
4. Click "Confirm"

### 1.4 Get Connection String

1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: Python, Version: 3.12 or later
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<dbname>` with `clinical_recipe_db`

Example:
```
mongodb+srv://clinical-recipes-app:YOUR_PASSWORD@clinical-recipes.xxxxx.mongodb.net/clinical_recipe_db?retryWrites=true&w=majority
```

**Save this connection string - you'll need it!**

---

## Step 2: Deploy Using Automated Script

### 2.1 Install Azure CLI (if not installed)

**macOS:**
```bash
brew install azure-cli
```

**Windows:**
Download from: https://aka.ms/installazurecliwindows

**Linux:**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### 2.2 Run Deployment Script

```bash
cd /path/to/clinical-recipe-system
./deploy-azure.sh
```

The script will:
1. Log you into Azure
2. Create Azure Container Registry
3. Build and push Docker images
4. Create Container Apps Environment
5. Deploy backend API
6. Create Static Web App for frontend
7. Configure custom domain

**When prompted:**
- Enter your MongoDB connection string (from Step 1.4)
- The script will use the Emergent LLM key automatically

---

## Step 3: Configure GitHub Secrets

After the deployment script completes, you need to add secrets to GitHub:

### 3.1 Get Azure Credentials

```bash
az ad sp create-for-rbac \
  --name "clinical-recipes-github" \
  --role contributor \
  --scopes /subscriptions/d7e6c9eb-e5ca-44b8-b3a3-2c3d9b9e4169/resourceGroups/askdogood-rg \
  --sdk-auth
```

Copy the entire JSON output.

### 3.2 Get ACR Credentials

```bash
az acr credential show --name askdogoodcr --resource-group askdogood-rg
```

### 3.3 Add to GitHub

1. Go to https://github.com/MooreTechnologyStrategists/clinical-recipe-system/settings/secrets/actions
2. Click "New repository secret"
3. Add these secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `AZURE_CREDENTIALS` | JSON from Step 3.1 | Service principal credentials |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | From deployment script output | SWA deployment token |
| `ACR_USERNAME` | From Step 3.2 | Container registry username |
| `ACR_PASSWORD` | From Step 3.2 | Container registry password |
| `MONGO_URL` | From Step 1.4 | MongoDB connection string |
| `EMERGENT_LLM_KEY` | sk-emergent-364Fd7c0d1cB024A64 | Already provided |

---

## Step 4: Configure DNS

### 4.1 Get Static Web App URL

```bash
az staticwebapp show \
  --name clinical-recipes \
  --resource-group askdogood-rg \
  --query defaultHostname \
  -o tsv
```

Example output: `happy-cliff-12345.azurestaticapps.net`

### 4.2 Add CNAME Record

In your DNS provider (where askdogood.com is hosted):

1. Add new CNAME record:
   - **Name:** `clinical-recipes`
   - **Type:** CNAME
   - **Value:** `happy-cliff-12345.azurestaticapps.net` (your SWA URL)
   - **TTL:** 3600

2. Wait 5-10 minutes for DNS propagation

### 4.3 Verify Custom Domain

```bash
az staticwebapp hostname set \
  --name clinical-recipes \
  --resource-group askdogood-rg \
  --hostname clinical-recipes.askdogood.com
```

---

## Step 5: Update AskDoGood.com Integration

### 5.1 Update Environment Variable

In your askdogood repository, update:

**File:** `client/src/config/clinicalRecipes.ts`

```typescript
export const DEFAULT_CLINICAL_RECIPE_APP_URL =
  "https://clinical-recipes.askdogood.com/";
```

### 5.2 Commit and Push

```bash
cd /path/to/askdogood
git add client/src/config/clinicalRecipes.ts
git commit -m "Update Clinical Recipe app URL to Azure hosting"
git push
```

---

## Step 6: Test Deployment

### 6.1 Test Backend API

```bash
curl https://clinical-recipes-api.azurecontainerapps.io/health
```

Expected response: `{"status":"healthy"}`

### 6.2 Test Frontend

1. Open https://clinical-recipes.askdogood.com
2. Should load without "wake up servers" button
3. Try generating a recipe
4. Should work within 10-15 seconds

### 6.3 Test from AskDoGood.com

1. Go to https://askdogood.com
2. Navigate to Clinical Recipes section
3. Verify it loads the new URL
4. Test recipe generation

---

## Step 7: Monitor and Maintain

### 7.1 View Logs

**Backend logs:**
```bash
az containerapp logs show \
  --name clinical-recipes-api \
  --resource-group askdogood-rg \
  --follow
```

**Frontend logs:**
```bash
az staticwebapp show \
  --name clinical-recipes \
  --resource-group askdogood-rg
```

### 7.2 Check Costs

```bash
az consumption usage list \
  --start-date 2024-12-01 \
  --end-date 2024-12-31
```

### 7.3 Scale Backend (if needed)

```bash
az containerapp update \
  --name clinical-recipes-api \
  --resource-group askdogood-rg \
  --min-replicas 1 \
  --max-replicas 5
```

---

## Troubleshooting

### Issue: Backend not responding

**Check health:**
```bash
az containerapp show \
  --name clinical-recipes-api \
  --resource-group askdogood-rg \
  --query properties.runningStatus
```

**Restart:**
```bash
az containerapp revision restart \
  --name clinical-recipes-api \
  --resource-group askdogood-rg
```

### Issue: Frontend not loading

**Check deployment status:**
```bash
az staticwebapp show \
  --name clinical-recipes \
  --resource-group askdogood-rg
```

**Redeploy:**
Push a new commit to trigger GitHub Actions

### Issue: MongoDB connection failed

1. Check IP whitelist in MongoDB Atlas
2. Verify connection string in secrets
3. Check backend logs for error details

### Issue: CORS errors

Update CORS origins:
```bash
az containerapp update \
  --name clinical-recipes-api \
  --resource-group askdogood-rg \
  --set-env-vars \
    CORS_ORIGINS=https://clinical-recipes.askdogood.com,https://askdogood.com
```

---

## Cost Optimization

### Current Setup (~$13-20/month)
- Azure Container Apps: $13-20/month
- Azure Static Web Apps: $0/month (Free tier)
- MongoDB Atlas: $0/month (M0 Free tier)
- Azure Container Registry: $5/month (Basic tier)

### To Reduce Costs:
1. Use smaller container instances (0.25 CPU, 0.5 GB RAM)
2. Reduce max replicas to 2
3. Use Azure Functions instead (requires code refactoring)

---

## Next Steps After Deployment

1. ✅ Monitor performance for 24-48 hours
2. ✅ Set up Azure Monitor alerts
3. ✅ Configure backup strategy for MongoDB
4. ✅ Add SSL certificate monitoring
5. ✅ Set up cost alerts in Azure
6. ✅ Document any custom configurations
7. ✅ Train team on new infrastructure

---

## Support

If you encounter issues:
1. Check logs (Step 7.1)
2. Review troubleshooting section
3. Contact Azure support if needed
4. Check GitHub Actions for deployment errors

---

## Summary

After completing these steps, you will have:

✅ Clinical Recipe app hosted on Azure
✅ Always-on backend (no sleep issues)
✅ Custom domain: clinical-recipes.askdogood.com
✅ Automatic deployments via GitHub Actions
✅ Free MongoDB database
✅ Professional, scalable infrastructure
✅ Total cost: ~$13-20/month

**The app will be accessible 24/7 with no "wake up" delays!**
