#!/bin/bash

# ClosetDB Container App 초기 생성 스크립트 (Docker Hub 사용)
# deploy-setup.sh 실행 후에 이 스크립트를 실행하세요

set -e

# 변수 설정
RESOURCE_GROUP="closetdb-rg"
CONTAINER_APP_ENV="closetdb-env"
CONTAINER_APP_NAME="closetdb-app"
DOCKERHUB_IMAGE="pandajoe/closetdb:latest"

echo "🚀 ClosetDB Container App 생성 중... (Docker Hub 사용)"

# 1. 초기 Container App 생성
echo "📦 Container App 생성 중..."
az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENV \
  --image nginx:latest \
  --target-port 80 \
  --ingress external \
  --cpu 0.25 \
  --memory 0.5Gi \
  --min-replicas 0 \
  --max-replicas 3

echo "✅ Container App 생성 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. set-secrets.sh 실행하여 환경 변수 설정"
echo "2. Docker Hub에 이미지 푸시 후 배포:"
echo ""
echo "# Docker 이미지 빌드 및 푸시 (로컬에서)"
echo "docker build -t $DOCKERHUB_IMAGE ."
echo "docker push $DOCKERHUB_IMAGE"
echo ""
echo "# Container App 업데이트"
echo "az containerapp update \\"
echo "  --name $CONTAINER_APP_NAME \\"
echo "  --resource-group $RESOURCE_GROUP \\"
echo "  --image $DOCKERHUB_IMAGE \\"
echo "  --target-port 8000"
echo ""
echo "3. 또는 GitHub에서 코드를 push하여 자동 배포"
echo ""
echo "🌐 앱 URL 확인:"
echo "az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv"