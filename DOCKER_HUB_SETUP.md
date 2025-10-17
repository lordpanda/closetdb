# Docker Hub 설정 가이드

## 🐳 Docker Hub 준비사항

### 1. Docker Hub 계정 생성
1. [Docker Hub](https://hub.docker.com/) 접속
2. 계정 생성 (무료)
3. 사용자명 기억 (예: `your-username`)

### 2. Access Token 생성
1. Docker Hub 로그인
2. **Account Settings** → **Security** → **Access Tokens**
3. **New Access Token** 클릭
4. 토큰 이름: `closetdb-deploy`
5. 권한: **Read, Write, Delete**
6. 생성된 토큰 복사 (한 번만 보여짐!)

### 3. 로컬 Docker 로그인
```bash
# Docker Hub 로그인
docker login

# 사용자명과 위에서 생성한 Access Token 입력
```

## 📝 설정 파일 수정

### ✅ 파일 수정 완료
다음 파일들이 이미 `pandajoe` 사용자명으로 업데이트되었습니다:

1. **`.github/workflows/deploy.yml`**:
```yaml
env:
  IMAGE_NAME: pandajoe/closetdb
```

2. **`create-containerapp.sh`**:
```bash
DOCKERHUB_IMAGE="pandajoe/closetdb:latest"
```

## 🔑 GitHub Secrets 설정

GitHub 저장소의 **Settings** → **Secrets and variables** → **Actions**에서 다음 추가:

1. **DOCKERHUB_USERNAME**: Docker Hub 사용자명
2. **DOCKERHUB_TOKEN**: 위에서 생성한 Access Token
3. **AZURE_CREDENTIALS**: Azure Service Principal JSON (별도 생성 필요)

## 🚀 수동 배포 (테스트용)

```bash
# 1. 이미지 빌드
docker build -t pandajoe/closetdb:latest .

# 2. Docker Hub에 푸시
docker push pandajoe/closetdb:latest

# 3. Azure Container App 업데이트
az containerapp update \
  --name closetdb-app \
  --resource-group closetdb-rg \
  --image pandajoe/closetdb:latest \
  --target-port 8000
```

## 💰 비용 정보

### Docker Hub (무료 계정)
- **Public 저장소**: 무제한 무료
- **Pull 제한**: 시간당 100회 (개인 사용 충분)
- **Private 저장소**: 1개 무료, 추가는 $5/월

### Azure Container Apps
- **미사용 시**: $0/월
- **사용 시**: 월 $1-3 (예상)

**총 예상 비용**: 월 1,000-3,000원 (Docker Hub 무료 사용 시)