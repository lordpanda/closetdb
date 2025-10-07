#!/usr/bin/env python3

import os
import sys
import re
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from supabase_utils import db

def fix_stitched_urls():
    """
    잘못된 stitched 이미지 URL을 올바른 형태로 수정
    
    잘못된 형태: 1759062682888_0_1759062682888_section_0.jpg
    올바른 형태: 1759062682888_section_0.jpg
    """
    print("=" * 60)
    print("Fixing stitched image URLs")
    print("=" * 60)
    
    # 모든 아이템 가져오기
    items = db.get_all_items()
    print(f"Found {len(items)} items to check")
    
    for item in items:
        item_id = item.get('item_id')
        images = item.get('images', [])
        
        if not images:
            continue
            
        print(f"\nChecking item: {item_id}")
        print(f"Current images: {images}")
        
        # 이미지 URL 패턴 수정
        fixed_images = []
        changed = False
        
        for url in images:
            # 잘못된 패턴 감지 및 수정
            # 패턴: itemID_index_itemID_section_N.jpg -> itemID_section_N.jpg
            pattern = rf'{item_id}_\d+_({item_id}_section_\d+\.jpg)'
            match = re.search(pattern, url)
            
            if match:
                # 올바른 파일명 추출
                correct_filename = match.group(1)
                # URL에서 파일명 부분만 교체
                fixed_url = url.replace(url.split('/')[-1], correct_filename)
                fixed_images.append(fixed_url)
                changed = True
                print(f"  Fixed: {url.split('/')[-1]} -> {correct_filename}")
            else:
                fixed_images.append(url)
        
        if changed:
            print(f"  Updating database for item {item_id}")
            print(f"  New images: {fixed_images}")
            
            # 데이터베이스 업데이트
            try:
                result = db.supabase.table('closet_items').update({
                    'images': fixed_images
                }).eq('item_id', item_id).execute()
                
                if result.data:
                    print(f"  ✅ Successfully updated item {item_id}")
                else:
                    print(f"  ❌ Failed to update item {item_id}")
                    
            except Exception as e:
                print(f"  ❌ Error updating item {item_id}: {e}")
        else:
            print(f"  No changes needed for item {item_id}")

if __name__ == "__main__":
    fix_stitched_urls()