#!/bin/bash

# ClosetDB Azure Container Apps 배포 설정 스크립트 (Docker Hub 사용)
# 이 스크립트를 실행하기 전에 Azure CLI에 로그인하세요: az login

set -e

# 변수 설정
RESOURCE_GROUP="closetdb-rg"
LOCATION="eastus"
CONTAINER_APP_ENV="closetdb-env"
CONTAINER_APP_NAME="closetdb-app"

echo "🚀 ClosetDB Azure 배포 설정을 시작합니다... (Docker Hub 사용)"

# 1. 리소스 그룹 생성
echo "📦 리소스 그룹 생성 중..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# 2. Container Apps Environment 생성
echo "🌍 Container Apps Environment 생성 중..."
az containerapp env create \
  --name $CONTAINER_APP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

echo "✅ Azure 리소스 생성 완료!"
echo ""
echo "📋 설정 정보:"
echo "Resource Group: $RESOURCE_GROUP"
echo "Container App Environment: $CONTAINER_APP_ENV"
echo "Location: $LOCATION"
echo ""
echo "🔑 GitHub Secrets에 다음 값들을 추가하세요:"
echo "DOCKERHUB_USERNAME: (Docker Hub 사용자명)"
echo "DOCKERHUB_TOKEN: (Docker Hub Access Token)"
echo "AZURE_CREDENTIALS: (Service Principal JSON)"
echo ""
echo "⚠️  환경 변수 secrets 설정이 필요합니다:"
echo "다음 명령어를 실행하여 secrets을 설정하세요:"
echo ""
echo "# Supabase 설정"
echo "az containerapp secret set --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --secrets supabase-url='YOUR_SUPABASE_URL'"
echo "az containerapp secret set --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --secrets supabase-key='YOUR_SUPABASE_KEY'"
echo ""
echo "# R2 설정"
echo "az containerapp secret set --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --secrets r2-access-key-id='YOUR_R2_ACCESS_KEY_ID'"
echo "az containerapp secret set --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --secrets r2-secret-access-key='YOUR_R2_SECRET_ACCESS_KEY'"
echo "az containerapp secret set --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --secrets r2-endpoint-url='YOUR_R2_ENDPOINT_URL'"
echo "az containerapp secret set --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --secrets r2-bucket-name='YOUR_R2_BUCKET_NAME'"
echo ""
echo "# Flask 설정"
echo "az containerapp secret set --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --secrets flask-secret-key='YOUR_FLASK_SECRET_KEY'"