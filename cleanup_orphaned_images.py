#!/usr/bin/env python3
"""
Orphaned 이미지 URL 정리 스크립트

데이터베이스에 저장된 이미지 URL 중 실제 R2 스토리지에 존재하지 않는 URL을 제거합니다.
"""

import json
import requests
import logging
from supabase_utils import SupabaseDB
from dotenv import load_dotenv
import os

# 환경 변수 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def check_image_exists(url):
    """이미지 URL이 실제로 접근 가능한지 확인"""
    try:
        response = requests.head(url, timeout=10)
        return response.status_code == 200
    except:
        return False

def clean_orphaned_images():
    """orphaned 이미지 URL 정리"""
    
    # Supabase 연결
    supabase_db = SupabaseDB()
    
    try:
        # 모든 아이템 조회
        items = supabase_db.get_all_items()
        logging.info(f"총 {len(items)}개 아이템 검사 시작")
        
        updated_count = 0
        total_removed_urls = 0
        
        for item in items:
            item_id = item.get('id')
            images = item.get('images')
            
            if not images:
                continue
                
            # 문자열인 경우 JSON 파싱
            if isinstance(images, str):
                try:
                    images = json.loads(images)
                except:
                    continue
            
            if not isinstance(images, list) or len(images) == 0:
                continue
                
            logging.info(f"아이템 {item_id}: {len(images)}개 이미지 URL 검사")
            
            # 각 이미지 URL 확인
            valid_images = []
            removed_images = []
            
            for img_url in images:
                if check_image_exists(img_url):
                    valid_images.append(img_url)
                    logging.info(f"  ✅ 유효: {img_url}")
                else:
                    removed_images.append(img_url)
                    logging.warning(f"  ❌ 제거: {img_url}")
            
            # 변경사항이 있으면 업데이트
            if len(removed_images) > 0:
                try:
                    # Supabase 업데이트
                    update_data = {
                        'images': json.dumps(valid_images) if valid_images else None
                    }
                    
                    # ID가 숫자인지 문자열인지 확인
                    if isinstance(item_id, str) and item_id.startswith('supabase_'):
                        # 문자열 ID인 경우 직접 쿼리 실행 (get_item_by_id가 작동하지 않으므로)
                        logging.info(f"문자열 ID {item_id} 업데이트 스킵 (구현 필요)")
                        continue
                    else:
                        # 숫자 ID인 경우
                        result = supabase_db.update_item(item_id, update_data)
                        if result:
                            updated_count += 1
                            total_removed_urls += len(removed_images)
                            logging.info(f"  📝 아이템 {item_id} 업데이트 완료: {len(removed_images)}개 URL 제거")
                        else:
                            logging.error(f"  ❌ 아이템 {item_id} 업데이트 실패")
                            
                except Exception as e:
                    logging.error(f"아이템 {item_id} 업데이트 중 오류: {e}")
        
        logging.info(f"🎉 정리 완료: {updated_count}개 아이템에서 총 {total_removed_urls}개 orphaned URL 제거")
        
    except Exception as e:
        logging.error(f"전체 프로세스 오류: {e}")
        raise

if __name__ == "__main__":
    clean_orphaned_images()