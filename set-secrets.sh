#!/bin/bash

# ClosetDB Container App Secrets 설정 스크립트
# 실제 값들을 입력하고 실행하세요

set -e

# 변수 설정
RESOURCE_GROUP="closetdb-rg"
CONTAINER_APP_NAME="closetdb-app"

echo "🔑 ClosetDB Container App Secrets 설정 중..."

# 환경 변수 값들을 여기에 입력하세요
read -p "Supabase URL을 입력하세요: " SUPABASE_URL
read -p "Supabase Key를 입력하세요: " SUPABASE_KEY
read -p "R2 Access Key ID를 입력하세요: " R2_ACCESS_KEY_ID
read -s -p "R2 Secret Access Key를 입력하세요: " R2_SECRET_ACCESS_KEY
echo ""
read -p "R2 Endpoint URL을 입력하세요: " R2_ENDPOINT_URL
read -p "R2 Bucket Name을 입력하세요: " R2_BUCKET_NAME
read -s -p "Flask Secret Key를 입력하세요 (새로 생성하려면 Enter): " FLASK_SECRET_KEY
echo ""

# Flask Secret Key 자동 생성 (입력하지 않은 경우)
if [ -z "$FLASK_SECRET_KEY" ]; then
    FLASK_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    echo "Flask Secret Key 자동 생성됨: $FLASK_SECRET_KEY"
fi

echo "Secrets 설정 중..."

# Secrets 설정
az containerapp secret set \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --secrets \
    supabase-url="$SUPABASE_URL" \
    supabase-key="$SUPABASE_KEY" \
    r2-access-key-id="$R2_ACCESS_KEY_ID" \
    r2-secret-access-key="$R2_SECRET_ACCESS_KEY" \
    r2-endpoint-url="$R2_ENDPOINT_URL" \
    r2-bucket-name="$R2_BUCKET_NAME" \
    flask-secret-key="$FLASK_SECRET_KEY"

# 환경 변수 설정
echo "환경 변수 설정 중..."
az containerapp update \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars \
    SUPABASE_URL=secretref:supabase-url \
    SUPABASE_KEY=secretref:supabase-key \
    R2_ACCESS_KEY_ID=secretref:r2-access-key-id \
    R2_SECRET_ACCESS_KEY=secretref:r2-secret-access-key \
    R2_ENDPOINT_URL=secretref:r2-endpoint-url \
    R2_BUCKET_NAME=secretref:r2-bucket-name \
    FLASK_SECRET_KEY=secretref:flask-secret-key \
    FLASK_ENV=production \
    FLASK_DEBUG=False

echo "✅ Secrets 및 환경 변수 설정 완료!"
echo "🚀 이제 앱을 배포할 수 있습니다."