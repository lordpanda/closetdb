#!/usr/bin/env python3
"""
특정 아이템의 orphaned 이미지 URL 정리
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

def fix_specific_item():
    """특정 아이템의 orphaned URL 수정"""
    
    # Supabase 연결
    supabase_db = SupabaseDB()
    
    try:
        # 모든 아이템 조회
        items = supabase_db.get_all_items()
        
        target_item = None
        for item in items:
            images = item.get('images')
            if images and '1760531443116' in str(images):
                target_item = item
                break
        
        if not target_item:
            print("1760531443116 관련 아이템을 찾을 수 없습니다.")
            return
            
        item_id = target_item.get('id')
        brand = target_item.get('brand')
        images = target_item.get('images')
        
        print(f"대상 아이템: ID={item_id}, Brand={brand}")
        
        if isinstance(images, str):
            images = json.loads(images)
        
        print(f"현재 이미지들: {images}")
        
        # 각 이미지 URL 확인
        valid_images = []
        invalid_images = []
        
        for img_url in images:
            if check_image_exists(img_url):
                valid_images.append(img_url)
                print(f"✅ 유효: {img_url}")
            else:
                invalid_images.append(img_url)
                print(f"❌ 무효: {img_url}")
        
        if invalid_images:
            print(f"\\n{len(invalid_images)}개의 무효한 이미지 URL 제거 중...")
            
            # Supabase에서 직접 쿼리 실행
            from supabase import create_client
            
            supabase_url = os.getenv('SUPABASE_URL')
            supabase_key = os.getenv('SUPABASE_KEY')
            supabase = create_client(supabase_url, supabase_key)
            
            # 아이템 업데이트 (빈 이미지 배열로 설정)
            update_data = {
                'images': json.dumps([]) if len(valid_images) == 0 else json.dumps(valid_images)
            }
            
            # brand로 해당 아이템 찾아서 업데이트
            result = supabase.table('items').update(update_data).eq('brand', brand).execute()
            
            if result.data:
                print(f"✅ 아이템 업데이트 성공: {len(invalid_images)}개 URL 제거")
                print(f"남은 유효한 이미지: {valid_images}")
            else:
                print("❌ 아이템 업데이트 실패")
        else:
            print("모든 이미지 URL이 유효합니다.")
        
    except Exception as e:
        print(f"오류: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    fix_specific_item()