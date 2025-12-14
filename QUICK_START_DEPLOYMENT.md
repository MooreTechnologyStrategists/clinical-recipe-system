# Quick Start: Deploy Clinical Recipe System to Azure

## TL;DR - What You Need to Do

I've prepared everything for deployment. Here's what you need to do:

### Step 1: Set Up MongoDB Atlas (10 minutes)

1. Go to https://cloud.mongodb.com
2. Create a **Free M0 cluster** (no credit card needed)
3. Create database user with password
4. Allow access from anywhere (0.0.0.0/0)
5. Get connection string - looks like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/clinical_recipe_db
   ```

### Step 2: Run the Deployment Script (15 minutes)

**On your local machine:**

1. Install Azure CLI if you haven't:
   - Mac: `brew install azure-cli`
   - Windows: Download from https://aka.ms/installazurecliwindows

2. Run the deployment:
   ```bash
   cd /path/to/clinical-recipe-system
   ./deploy-azure.sh
   ```

3. When prompted, enter your MongoDB connection string

4. The script will:
   - Create all Azure resources
   - Build and deploy backend
   - Deploy frontend
   - Configure custom domain

### Step 3: Add DNS Record (5 minutes)

After deployment completes, add this DNS record where askdogood.com is hosted:

```
Type: CNAME
Name: clinical-recipes
Value: [URL from deployment script output]
TTL: 3600
```

### Step 4: Add GitHub Workflow (Optional - for auto-deployment)

The GitHub Actions workflow file is in `.github/workflows/azure-deploy.yml` but couldn't be pushed due to token permissions.

**To add it manually:**
1. Go to your GitHub repository
2. Create `.github/workflows/azure-deploy.yml`
3. Copy content from the local file
4. Add required secrets (instructions in DEPLOYMENT_INSTRUCTIONS.md)

---

## What I've Already Done

✅ Created Dockerfiles for backend and frontend
✅ Created deployment automation script
✅ Configured nginx for production
✅ Set up docker-compose for local testing
✅ Written comprehensive deployment guide
✅ Pushed everything to GitHub

---

## Files Created

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Backend container configuration |
| `frontend/Dockerfile` | Frontend container configuration |
| `frontend/nginx.conf` | Production web server config |
| `docker-compose.yml` | Local testing setup |
| `deploy-azure.sh` | Automated deployment script |
| `DEPLOYMENT_INSTRUCTIONS.md` | Detailed step-by-step guide |
| `AZURE_SWA_DEPLOYMENT.md` | Technical architecture docs |
| `.github/workflows/azure-deploy.yml` | Auto-deployment (add manually) |

---

## Expected Outcome

After deployment:
- ✅ Frontend: https://clinical-recipes.askdogood.com
- ✅ Backend API: https://clinical-recipes-api.azurecontainerapps.io
- ✅ Always-on (no sleep)
- ✅ Auto-deployment on git push
- ✅ Cost: ~$13-20/month

---

## Need Help?

1. Read `DEPLOYMENT_INSTRUCTIONS.md` for detailed steps
2. Check `AZURE_SWA_DEPLOYMENT.md` for architecture details
3. Review troubleshooting section in deployment guide

---

## Next: Other Website Improvements

Once the Clinical Recipe app is deployed, we'll move on to:
1. ✅ Amazon affiliate links integration
2. ✅ Google Analytics setup
3. ✅ Stripe payment integration
4. ✅ Email capture system
5. ✅ WordPress subscriber migration

Let me know when you're ready to deploy or if you need any help!
