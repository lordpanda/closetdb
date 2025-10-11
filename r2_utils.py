import os
import boto3
import urllib.parse
import re
from dotenv import load_dotenv

load_dotenv()

class CloudflareR2:
    def __init__(self):
        self.account_id = os.getenv('R2_ACCOUNT_ID')
        self.access_key_id = os.getenv('R2_ACCESS_KEY_ID')
        self.secret_access_key = os.getenv('R2_SECRET_ACCESS_KEY')
        self.bucket_name = os.getenv('R2_BUCKET_NAME')
        self.public_url = os.getenv('R2_PUBLIC_URL')
        
        # 환경변수 확인
        if not all([self.account_id, self.access_key_id, self.secret_access_key, self.bucket_name]):
            print(f"Missing R2 config: account_id={bool(self.account_id)}, access_key={bool(self.access_key_id)}, secret_key={bool(self.secret_access_key)}, bucket={bool(self.bucket_name)}")
            raise ValueError("Missing R2 configuration in environment variables")
        
        # boto3 세션을 명시적으로 생성
        session = boto3.Session(
            aws_access_key_id=self.access_key_id,
            aws_secret_access_key=self.secret_access_key,
            region_name='us-east-1'
        )
        
        # R2는 S3 호환이므로 boto3 사용
        self.s3_client = session.client(
            's3',
            endpoint_url=f'https://{self.account_id}.r2.cloudflarestorage.com'
        )
    
    def sanitize_filename(self, filename):
        """
        클라우드 스토리지에 안전한 파일명으로 변환
        한글, 특수문자, 공백 등을 URL-safe 문자로 변환
        """
        if not filename:
            return filename
        
        # 파일명과 확장자 분리
        name, ext = os.path.splitext(filename)
        
        # 한글 및 특수문자를 URL 인코딩으로 변환
        # 단, 언더스코어(_), 하이픈(-), 점(.)은 유지
        safe_name = ""
        for char in name:
            if char.isalnum() or char in '-_.':
                safe_name += char
            else:
                # URL 인코딩하되 %를 _로 대체 (% 자체도 문제가 될 수 있음)
                encoded = urllib.parse.quote(char, safe='')
                safe_encoded = encoded.replace('%', '_')
                safe_name += safe_encoded
        
        # 최종 파일명 생성
        safe_filename = safe_name + ext
        
        # 길이 제한 (최대 200자)
        if len(safe_filename) > 200:
            # 확장자를 보존하면서 이름 부분만 줄임
            max_name_length = 200 - len(ext)
            safe_filename = safe_name[:max_name_length] + ext
        
        print(f"🔧 Filename sanitized: '{filename}' -> '{safe_filename}'")
        return safe_filename
    
    def upload_image(self, file, filename):
        """
        이미지 파일을 R2에 업로드하고 공개 URL 반환
        """
        try:
            print(f"Starting upload: {filename}")
            
            # 파일명 안전화
            safe_filename = self.sanitize_filename(filename)
            
            # 파일 객체 타입 확인 및 처리
            if hasattr(file, 'stream'):
                # ImageProcessor에서 생성된 파일 객체
                file_obj = file.stream
                print(f"Using stream from ImageProcessor file object")
            elif hasattr(file, 'read'):
                # Flask 파일 객체 또는 일반 파일 객체
                file_obj = file
                print(f"Using direct file object")
            else:
                raise ValueError("Invalid file object")
            
            # 파일 크기 확인 (가능한 경우)
            if hasattr(file_obj, 'seek') and hasattr(file_obj, 'tell'):
                current_pos = file_obj.tell()
                file_obj.seek(0, 2)  # 끝으로 이동
                file_size = file_obj.tell()
                file_obj.seek(current_pos)  # 원래 위치로 복원
                print(f"File size: {file_size:,} bytes")
            
            print(f"Uploading to R2 bucket: {self.bucket_name}")
            
            # 파일을 R2에 업로드 (안전화된 파일명 사용)
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                safe_filename,
                ExtraArgs={'ContentType': 'image/jpeg'}  # 기본값, 실제로는 파일 타입에 따라 변경 가능
            )
            
            print(f"Upload successful to R2")
            
            # 공개 URL 생성 (R2 Public Development URL - 안전화된 파일명 사용)
            public_url = f"{self.public_url}/{safe_filename}"
            print(f"Generated public URL: {public_url}")
            
            return public_url
            
        except Exception as e:
            print(f"Error uploading to R2: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def upload_multiple_images(self, files, item_id):
        """
        여러 이미지를 업로드하고 URL 리스트 반환
        """
        image_urls = []
        
        for i, file in enumerate(files):
            if file.filename:
                # 파일명 처리 (stitched 이미지의 경우 _section_ 패턴 보존)
                if '_section_' in file.filename:
                    # Stitched 이미지: 이미 올바른 형태의 파일명
                    filename = file.filename
                    print(f"Stitched image upload: {filename}")
                else:
                    # 개별 이미지인 경우: itemID_index_원본파일명
                    filename = f"{item_id}_{i}_{file.filename}"
                    print(f"Individual image upload: {filename}")
                # 파일명은 upload_image 메소드 내에서 sanitize됨
                url = self.upload_image(file, filename)
                if url:
                    image_urls.append(url)
                    print(f"Successfully uploaded: {url}")
                else:
                    print(f"Failed to upload: {filename}")
        
        return image_urls
    
    def upload_with_thumbnail(self, file, item_id, index=0):
        """
        원본 이미지와 썸네일을 모두 업로드
        """
        from image_utils import ImageProcessor
        
        result = {
            'original_url': None,
            'thumbnail_url': None
        }
        
        try:
            # 원본 이미지 업로드 (stitched 이미지의 경우 파일명 보존)
            if '_section_' in file.filename:
                original_filename = file.filename
                print(f"Uploading stitched section with original filename: {original_filename}")
            else:
                original_filename = f"{item_id}_{index}_{file.filename}"
                print(f"Uploading individual image with modified filename: {original_filename}")
            
            original_url = self.upload_image(file, original_filename)
            if original_url:
                result['original_url'] = original_url
                print(f"Successfully uploaded original: {original_url}")
            else:
                print(f"Failed to upload original: {original_filename}")
            
            # 파일 포인터를 처음으로 되돌리기
            if hasattr(file, 'seek'):
                file.seek(0)
            elif hasattr(file, 'stream') and hasattr(file.stream, 'seek'):
                file.stream.seek(0)
            
            # 썸네일 생성 및 업로드
            thumbnail_buffer = ImageProcessor.create_thumbnail(file)
            if thumbnail_buffer:
                # 썸네일은 WebP 또는 JPEG로 저장되므로 확장자 통일
                base_filename = os.path.splitext(file.filename)[0]
                thumbnail_filename = f"{item_id}_{index}_thumb_{base_filename}.webp"
                
                # 썸네일 파일 객체 생성
                thumbnail_file = type('FileObject', (), {
                    'filename': thumbnail_filename,
                    'stream': thumbnail_buffer,
                    'read': thumbnail_buffer.read,
                    'seek': thumbnail_buffer.seek
                })()
                
                thumbnail_url = self.upload_image(thumbnail_file, thumbnail_filename)
                if thumbnail_url:
                    result['thumbnail_url'] = thumbnail_url
            
            return result
            
        except Exception as e:
            print(f"Error uploading with thumbnail: {e}")
            return result
    
    def delete_image(self, filename):
        """
        R2에서 이미지 삭제
        """
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=filename)
            return True
        except Exception as e:
            print(f"Error deleting from R2: {e}")
            return False

# 전역 인스턴스
r2 = CloudflareR2()