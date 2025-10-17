# ClosetDB Azure Container Apps 배포 가이드

## 🚀 배포 개요

ClosetDB는 Docker Hub + Azure Container Apps를 사용하여 서버리스 컨테이너 환경에서 실행됩니다.

### 예상 비용
- **Docker Hub**: 무료 (Public 저장소)
- **Azure Container Apps**: 월 1,000-3,000원 (사용량에 따라)
- **미사용 시**: 0원 (서버리스 스케일링)

## 📋 사전 준비사항

1. **Azure CLI 설치**: [Azure CLI 설치 가이드](https://docs.microsoft.com/ko-kr/cli/azure/install-azure-cli)
2. **Azure 계정**: Azure 구독이 있어야 함
3. **Docker Hub 계정**: [Docker Hub 가입](https://hub.docker.com/) (무료)
4. **환경 변수**: Supabase, R2 계정 정보
5. **Docker 설치**: 로컬 테스트 및 수동 배포용

## 🛠️ 배포 단계

### 0단계: Docker Hub 설정

**⚠️ 중요**: 먼저 `DOCKER_HUB_SETUP.md` 파일을 읽고 Docker Hub를 설정하세요.

### 1단계: Azure 리소스 생성

```bash
# Azure 로그인
az login

# 스크립트 실행 권한 부여 (Linux/Mac)
chmod +x deploy-setup.sh
chmod +x create-containerapp.sh  
chmod +x set-secrets.sh

# Azure 리소스 생성 (ACR 없이)
./deploy-setup.sh
```

### 2단계: Container App 생성

✅ **이미 설정 완료**: `create-containerapp.sh`에 Docker Hub 이미지가 설정되어 있습니다:
```bash
DOCKERHUB_IMAGE="pandajoe/closetdb:latest"
```

```bash
# Container App 초기 생성
./create-containerapp.sh
```

### 3단계: 환경 변수 설정

```bash
# Secrets 및 환경 변수 설정
./set-secrets.sh
```

필요한 환경 변수:
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_KEY`: Supabase API 키
- `R2_ACCESS_KEY_ID`: Cloudflare R2 Access Key ID
- `R2_SECRET_ACCESS_KEY`: Cloudflare R2 Secret Access Key
- `R2_ENDPOINT_URL`: Cloudflare R2 Endpoint URL
- `R2_BUCKET_NAME`: R2 버킷 이름
- `FLASK_SECRET_KEY`: Flask 세션 키 (자동 생성 가능)

### 4단계: 앱 배포

#### 방법 A: GitHub Actions (자동 배포)

1. ✅ **이미 설정 완료**: `.github/workflows/deploy.yml`에 이미지 이름이 설정되어 있습니다:
   ```yaml
   env:
     IMAGE_NAME: pandajoe/closetdb
   ```

2. GitHub 저장소에 다음 Secrets 추가:
   ```
   DOCKERHUB_USERNAME: your_dockerhub_username
   DOCKERHUB_TOKEN: your_dockerhub_token
   AZURE_CREDENTIALS: (Service Principal JSON - 별도 생성 필요)
   ```

3. 코드를 main 브랜치에 push하면 자동 배포됩니다.

#### 방법 B: 수동 배포

```bash
# Docker Hub 로그인
docker login

# Docker 이미지 빌드 및 푸시
docker build -t pandajoe/closetdb:latest .
docker push pandajoe/closetdb:latest

# Container App 업데이트
az containerapp update \
  --name closetdb-app \
  --resource-group closetdb-rg \
  --image pandajoe/closetdb:latest \
  --target-port 8000
```

## 🌐 앱 URL 확인

```bash
# 배포된 앱 URL 확인
az containerapp show \
  --name closetdb-app \
  --resource-group closetdb-rg \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

## 📊 모니터링

```bash
# 앱 상태 확인
az containerapp show --name closetdb-app --resource-group closetdb-rg

# 로그 확인
az containerapp logs show --name closetdb-app --resource-group closetdb-rg

# 메트릭 확인
az monitor metrics list --resource /subscriptions/{subscription-id}/resourceGroups/closetdb-rg/providers/Microsoft.App/containerApps/closetdb-app
```

## 🔧 문제 해결

### 일반적인 문제들

1. **앱이 시작되지 않는 경우**:
   ```bash
   # 로그 확인
   az containerapp logs show --name closetdb-app --resource-group closetdb-rg --follow
   ```

2. **환경 변수 문제**:
   ```bash
   # Secrets 확인
   az containerapp secret list --name closetdb-app --resource-group closetdb-rg
   ```

3. **이미지 빌드 실패**:
   ```bash
   # 로컬에서 Docker 빌드 테스트
   docker build -t closetdb-test .
   docker run -p 8000:8000 closetdb-test
   ```

## 🗑️ 리소스 정리

배포를 완전히 제거하려면:

```bash
# 전체 리소스 그룹 삭제
az group delete --name closetdb-rg --yes --no-wait
```

## 📞 지원

배포 중 문제가 발생하면:
1. Azure Portal에서 Container App 로그 확인
2. GitHub Actions 로그 확인 (자동 배포 사용 시)
3. 이 가이드의 문제 해결 섹션 참조