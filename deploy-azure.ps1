# Azure Deployment Script for Clinical Recipe System (PowerShell)
# Run this on Windows PowerShell

# Configuration
$SUBSCRIPTION_ID = "d7e6c9eb-e5ca-44b8-b3a3-2c3d9b9e4169"
$RESOURCE_GROUP = "askdogood-rg"
$LOCATION = "eastus2"
$ACR_NAME = "askdogoodcr"
$CONTAINER_APP_ENV = "askdogood-env"
$BACKEND_APP_NAME = "clinical-recipes-api"
$FRONTEND_APP_NAME = "clinical-recipes"
$CUSTOM_DOMAIN = "clinical-recipes.askdogood.com"

# MongoDB and API Key
$MONGO_URL = "mongodb+srv://askdogood:EsjVZTM8Y2V7rE5u@highwayzapp.mnvj9fh.mongodb.net/clinical_recipe_db?appName=HighwayzApp"
$EMERGENT_LLM_KEY = "sk-emergent-364Fd7c0d1cB024A64"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Clinical Recipe System - Azure Deployment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if Azure CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "Azure CLI is not installed." -ForegroundColor Red
    Write-Host "Please download and install from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Login to Azure
Write-Host "Logging in to Azure..." -ForegroundColor Yellow
az login

# Set subscription
Write-Host "Setting subscription..." -ForegroundColor Yellow
az account set --subscription $SUBSCRIPTION_ID

# Create Container Registry if it doesn't exist
Write-Host "Checking Azure Container Registry..." -ForegroundColor Yellow
$acrExists = az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP 2>$null
if (-not $acrExists) {
    Write-Host "Creating Azure Container Registry..." -ForegroundColor Yellow
    az acr create `
        --resource-group $RESOURCE_GROUP `
        --name $ACR_NAME `
        --sku Basic `
        --admin-enabled true
} else {
    Write-Host "Container Registry already exists" -ForegroundColor Green
}

# Get ACR credentials
Write-Host "Getting ACR credentials..." -ForegroundColor Yellow
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username -o tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv

# Create Container Apps Environment if it doesn't exist
Write-Host "Checking Container Apps Environment..." -ForegroundColor Yellow
$envExists = az containerapp env show --name $CONTAINER_APP_ENV --resource-group $RESOURCE_GROUP 2>$null
if (-not $envExists) {
    Write-Host "Creating Container Apps Environment..." -ForegroundColor Yellow
    az containerapp env create `
        --name $CONTAINER_APP_ENV `
        --resource-group $RESOURCE_GROUP `
        --location $LOCATION
} else {
    Write-Host "Container Apps Environment already exists" -ForegroundColor Green
}

# Build and push backend Docker image
Write-Host "Building and pushing backend Docker image..." -ForegroundColor Yellow
Set-Location backend
az acr build `
    --registry $ACR_NAME `
    --image clinical-recipes-backend:latest `
    --file Dockerfile `
    .
Set-Location ..

# Create or update backend container app
Write-Host "Deploying backend to Azure Container Apps..." -ForegroundColor Yellow
$appExists = az containerapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP 2>$null
if (-not $appExists) {
    az containerapp create `
        --name $BACKEND_APP_NAME `
        --resource-group $RESOURCE_GROUP `
        --environment $CONTAINER_APP_ENV `
        --image "$ACR_NAME.azurecr.io/clinical-recipes-backend:latest" `
        --target-port 8001 `
        --ingress external `
        --min-replicas 1 `
        --max-replicas 3 `
        --cpu 0.5 `
        --memory 1.0Gi `
        --registry-server "$ACR_NAME.azurecr.io" `
        --registry-username $ACR_USERNAME `
        --registry-password $ACR_PASSWORD `
        --secrets "mongo-url=$MONGO_URL" "emergent-llm-key=$EMERGENT_LLM_KEY" `
        --env-vars "MONGO_URL=secretref:mongo-url" "EMERGENT_LLM_KEY=secretref:emergent-llm-key" "DB_NAME=clinical_recipe_db" "CORS_ORIGINS=https://clinical-recipes.askdogood.com"
} else {
    az containerapp update `
        --name $BACKEND_APP_NAME `
        --resource-group $RESOURCE_GROUP `
        --image "$ACR_NAME.azurecr.io/clinical-recipes-backend:latest" `
        --set-env-vars "MONGO_URL=secretref:mongo-url" "EMERGENT_LLM_KEY=secretref:emergent-llm-key" "DB_NAME=clinical_recipe_db" "CORS_ORIGINS=https://clinical-recipes.askdogood.com"
}

# Get backend URL
$BACKEND_URL = az containerapp show `
    --name $BACKEND_APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --query properties.configuration.ingress.fqdn `
    -o tsv

Write-Host "Backend deployed at: https://$BACKEND_URL" -ForegroundColor Green

# Create Static Web App for frontend
Write-Host "Creating Azure Static Web App for frontend..." -ForegroundColor Yellow
$swaExists = az staticwebapp show --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP 2>$null
if (-not $swaExists) {
    az staticwebapp create `
        --name $FRONTEND_APP_NAME `
        --resource-group $RESOURCE_GROUP `
        --location $LOCATION `
        --source https://github.com/MooreTechnologyStrategists/clinical-recipe-system `
        --branch main `
        --app-location "/frontend" `
        --output-location "build" `
        --login-with-github
} else {
    Write-Host "Static Web App already exists" -ForegroundColor Green
}

# Get Static Web App deployment token
$SWA_TOKEN = az staticwebapp secrets list `
    --name $FRONTEND_APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --query properties.apiKey `
    -o tsv

Write-Host "Static Web App deployment token: $SWA_TOKEN" -ForegroundColor Green
Write-Host "Add this as AZURE_STATIC_WEB_APPS_API_TOKEN in GitHub secrets" -ForegroundColor Yellow

# Configure custom domain for Static Web App
Write-Host "Configuring custom domain..." -ForegroundColor Yellow
az staticwebapp hostname set `
    --name $FRONTEND_APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --hostname $CUSTOM_DOMAIN

# Get Static Web App URL
$FRONTEND_URL = az staticwebapp show `
    --name $FRONTEND_APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --query defaultHostname `
    -o tsv

Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Frontend URL: https://$FRONTEND_URL" -ForegroundColor Green
Write-Host "Custom Domain: https://$CUSTOM_DOMAIN" -ForegroundColor Green
Write-Host "Backend API: https://$BACKEND_URL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add CNAME record in DNS:"
Write-Host "   $CUSTOM_DOMAIN -> $FRONTEND_URL"
Write-Host "2. Add these GitHub secrets:"
Write-Host "   - AZURE_STATIC_WEB_APPS_API_TOKEN"
Write-Host "   - AZURE_CREDENTIALS"
Write-Host "   - ACR_USERNAME"
Write-Host "   - ACR_PASSWORD"
Write-Host "3. Update askdogood.com to point to: https://$CUSTOM_DOMAIN"
