#!/bin/bash

# Azure Deployment Script for Clinical Recipe System
# This script sets up all Azure resources needed for the application

set -e

# Configuration
SUBSCRIPTION_ID="d7e6c9eb-e5ca-44b8-b3a3-2c3d9b9e4169"
RESOURCE_GROUP="askdogood-rg"
LOCATION="eastus2"
ACR_NAME="askdogoodcr"
CONTAINER_APP_ENV="askdogood-env"
BACKEND_APP_NAME="clinical-recipes-api"
FRONTEND_APP_NAME="clinical-recipes"
CUSTOM_DOMAIN="clinical-recipes.askdogood.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Clinical Recipe System - Azure Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Login to Azure
echo -e "${YELLOW}Logging in to Azure...${NC}"
az login

# Set subscription
echo -e "${YELLOW}Setting subscription...${NC}"
az account set --subscription $SUBSCRIPTION_ID

# Create Container Registry if it doesn't exist
echo -e "${YELLOW}Checking Azure Container Registry...${NC}"
if ! az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}Creating Azure Container Registry...${NC}"
    az acr create \
        --resource-group $RESOURCE_GROUP \
        --name $ACR_NAME \
        --sku Basic \
        --admin-enabled true
else
    echo -e "${GREEN}Container Registry already exists${NC}"
fi

# Get ACR credentials
echo -e "${YELLOW}Getting ACR credentials...${NC}"
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

# Create Container Apps Environment if it doesn't exist
echo -e "${YELLOW}Checking Container Apps Environment...${NC}"
if ! az containerapp env show --name $CONTAINER_APP_ENV --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}Creating Container Apps Environment...${NC}"
    az containerapp env create \
        --name $CONTAINER_APP_ENV \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION
else
    echo -e "${GREEN}Container Apps Environment already exists${NC}"
fi

# Build and push backend Docker image
echo -e "${YELLOW}Building and pushing backend Docker image...${NC}"
cd backend
az acr build \
    --registry $ACR_NAME \
    --image clinical-recipes-backend:latest \
    --file Dockerfile \
    .
cd ..

# Prompt for MongoDB URL
echo -e "${YELLOW}Please enter your MongoDB connection string:${NC}"
read -s MONGO_URL

# Prompt for Emergent LLM Key (or use provided)
EMERGENT_LLM_KEY="sk-emergent-364Fd7c0d1cB024A64"

# Create or update backend container app
echo -e "${YELLOW}Deploying backend to Azure Container Apps...${NC}"
if ! az containerapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    az containerapp create \
        --name $BACKEND_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --environment $CONTAINER_APP_ENV \
        --image $ACR_NAME.azurecr.io/clinical-recipes-backend:latest \
        --target-port 8001 \
        --ingress external \
        --min-replicas 1 \
        --max-replicas 3 \
        --cpu 0.5 \
        --memory 1.0Gi \
        --registry-server $ACR_NAME.azurecr.io \
        --registry-username $ACR_USERNAME \
        --registry-password $ACR_PASSWORD \
        --secrets \
            mongo-url="$MONGO_URL" \
            emergent-llm-key="$EMERGENT_LLM_KEY" \
        --env-vars \
            MONGO_URL=secretref:mongo-url \
            EMERGENT_LLM_KEY=secretref:emergent-llm-key \
            DB_NAME=clinical_recipe_db \
            CORS_ORIGINS=https://clinical-recipes.askdogood.com
else
    az containerapp update \
        --name $BACKEND_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --image $ACR_NAME.azurecr.io/clinical-recipes-backend:latest \
        --set-env-vars \
            MONGO_URL=secretref:mongo-url \
            EMERGENT_LLM_KEY=secretref:emergent-llm-key \
            DB_NAME=clinical_recipe_db \
            CORS_ORIGINS=https://clinical-recipes.askdogood.com
fi

# Get backend URL
BACKEND_URL=$(az containerapp show \
    --name $BACKEND_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query properties.configuration.ingress.fqdn \
    -o tsv)

echo -e "${GREEN}Backend deployed at: https://$BACKEND_URL${NC}"

# Create Static Web App for frontend
echo -e "${YELLOW}Creating Azure Static Web App for frontend...${NC}"
if ! az staticwebapp show --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    az staticwebapp create \
        --name $FRONTEND_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --source https://github.com/MooreTechnologyStrategists/clinical-recipe-system \
        --branch main \
        --app-location "/frontend" \
        --output-location "build" \
        --login-with-github
else
    echo -e "${GREEN}Static Web App already exists${NC}"
fi

# Get Static Web App deployment token
SWA_TOKEN=$(az staticwebapp secrets list \
    --name $FRONTEND_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query properties.apiKey \
    -o tsv)

echo -e "${GREEN}Static Web App deployment token: $SWA_TOKEN${NC}"
echo -e "${YELLOW}Add this as AZURE_STATIC_WEB_APPS_API_TOKEN in GitHub secrets${NC}"

# Configure custom domain for Static Web App
echo -e "${YELLOW}Configuring custom domain...${NC}"
az staticwebapp hostname set \
    --name $FRONTEND_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --hostname $CUSTOM_DOMAIN

# Get Static Web App URL
FRONTEND_URL=$(az staticwebapp show \
    --name $FRONTEND_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query defaultHostname \
    -o tsv)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Frontend URL: https://$FRONTEND_URL${NC}"
echo -e "${GREEN}Custom Domain: https://$CUSTOM_DOMAIN${NC}"
echo -e "${GREEN}Backend API: https://$BACKEND_URL${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Add CNAME record in DNS:"
echo "   $CUSTOM_DOMAIN -> $FRONTEND_URL"
echo "2. Add these GitHub secrets:"
echo "   - AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "   - AZURE_CREDENTIALS"
echo "   - ACR_USERNAME"
echo "   - ACR_PASSWORD"
echo "3. Update askdogood.com to point to: https://$CUSTOM_DOMAIN"
