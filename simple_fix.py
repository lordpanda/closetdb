#!/usr/bin/env python3
import json
from supabase_utils import SupabaseDB

# Supabase 연결
supabase_db = SupabaseDB()

try:
    # 모든 아이템 조회하여 1760531443116 포함된 아이템 찾기
    items = supabase_db.get_all_items()
    
    for item in items:
        images = item.get('images')
        if images and '1760531443116' in str(images):
            item_id = item.get('id')
            brand = item.get('brand')
            
            print(f"Target item found - ID: {item_id}, Brand: {brand}")
            print(f"Current images: {images}")
            
            # 이미지 배열을 None으로 업데이트
            update_data = {'images': None}
            
            # 브랜드로 업데이트 시도 (ID가 None이므로)
            if brand:
                # supabase_db의 supabase 인스턴스에 직접 접근
                result = supabase_db.supabase.table('items').update(update_data).eq('brand', brand).execute()
                
                if result.data:
                    print("Successfully updated - images cleared")
                else:
                    print("Update failed")
            break
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()