# Azure Static Web Apps Deployment Guide

## Overview

This guide explains how to deploy the Clinical Recipe System to Azure Static Web Apps with a custom domain.

## Architecture

The Clinical Recipe System has two components:
1. **Frontend** (React app) - Will be hosted on Azure SWA
2. **Backend** (FastAPI + MongoDB) - Needs separate hosting

## Important Note

**Azure Static Web Apps is designed for static frontends + serverless APIs.**

Your app currently has:
- React frontend ✅ (perfect for SWA)
- FastAPI backend ❌ (needs different hosting)
- MongoDB database ❌ (needs separate hosting)

## Deployment Options

### Option 1: Hybrid Approach (RECOMMENDED)

**Frontend on Azure SWA + Backend on Azure Container Apps**

#### Frontend (Azure SWA)
- Host: Azure Static Web Apps (Free tier)
- Domain: `clinical-recipes.askdogood.com`
- Cost: $0/month

#### Backend (Azure Container Apps)
- Host: Azure Container Apps or Azure App Service
- Cost: ~$13-20/month (Container Apps) or ~$13/month (App Service Basic)
- Always-on, no sleep

#### Database (MongoDB Atlas)
- Host: MongoDB Atlas (Free tier)
- Cost: $0/month (512MB storage, shared cluster)

**Total Cost: ~$13-20/month**

### Option 2: Convert to Serverless

Convert the FastAPI backend to Azure Functions (serverless) to use SWA's built-in API support.

**Pros:**
- Everything in one place
- Lower cost (~$0-5/month)
- Auto-scaling

**Cons:**
- Requires code refactoring
- Cold start delays
- May not support all FastAPI features

### Option 3: Full Azure App Service

Host everything on Azure App Service (not SWA).

**Cost:** ~$55/month (Standard tier for always-on)

## Recommended Implementation: Option 1

### Step 1: Deploy Frontend to Azure SWA

1. **Create Azure Static Web App**
```bash
# Using Azure CLI
az staticwebapp create \
  --name clinical-recipes \
  --resource-group askdogood-rg \
  --source https://github.com/MooreTechnologyStrategists/clinical-recipe-system \
  --location eastus2 \
  --branch main \
  --app-location "/frontend" \
  --output-location "build" \
  --login-with-github
```

2. **Configure Build**

Create `.github/workflows/azure-static-web-apps.yml`:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true

      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/frontend"
          api_location: ""
          output_location: "build"
        env:
          REACT_APP_BACKEND_URL: ${{ secrets.REACT_APP_BACKEND_URL }}

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

3. **Add Custom Domain**
```bash
az staticwebapp hostname set \
  --name clinical-recipes \
  --resource-group askdogood-rg \
  --hostname clinical-recipes.askdogood.com
```

4. **Update DNS**
Add CNAME record:
```
clinical-recipes.askdogood.com -> <your-swa-url>.azurestaticapps.net
```

### Step 2: Deploy Backend to Azure Container Apps

1. **Create Dockerfile** (if not exists)

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

2. **Deploy to Azure Container Apps**

```bash
# Create container app
az containerapp create \
  --name clinical-recipes-api \
  --resource-group askdogood-rg \
  --environment askdogood-env \
  --image <your-docker-image> \
  --target-port 8001 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars \
    MONGO_URL=<mongodb-connection-string> \
    EMERGENT_LLM_KEY=<your-key> \
    CORS_ORIGINS=https://clinical-recipes.askdogood.com
```

### Step 3: Set Up MongoDB Atlas (Free)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0)
3. Get connection string
4. Add to backend environment variables

### Step 4: Connect Frontend to Backend

Update frontend `.env`:
```bash
REACT_APP_BACKEND_URL=https://clinical-recipes-api.azurecontainerapps.io
```

## Cost Breakdown (Option 1)

| Service | Tier | Cost |
|---------|------|------|
| Azure Static Web Apps | Free | $0/month |
| Azure Container Apps | Consumption | ~$13-20/month |
| MongoDB Atlas | Free (M0) | $0/month |
| **Total** | | **~$13-20/month** |

## Alternative: Cheaper Serverless Option

If budget is tight, convert to fully serverless:

1. Keep frontend on Azure SWA (Free)
2. Convert FastAPI to Azure Functions ($0-5/month)
3. Use MongoDB Atlas Free tier ($0/month)

**Total: $0-5/month**

But requires code refactoring and may have cold starts.

## Next Steps

1. Choose deployment option
2. Set up Azure resources
3. Configure GitHub secrets
4. Deploy and test
5. Update askdogood.com to point to new URL

## Questions to Answer

1. **Budget preference?**
   - $0-5/month (serverless, some cold starts)
   - $13-20/month (always-on, fast)
   - $55+/month (premium, full control)

2. **Do you have Azure subscription?**
   - If not, need to create one

3. **MongoDB preference?**
   - MongoDB Atlas (free tier, cloud)
   - Azure Cosmos DB (more expensive but integrated)

Let me know your preferences and I'll proceed with the setup!
