#!/usr/bin/env python3

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from supabase_utils import db

def check_item(item_id):
    print(f"Checking item: {item_id}")
    print("=" * 50)
    
    item = db.get_item_by_id(item_id)
    
    if not item:
        print("❌ Item not found in database")
        return
    
    print("✅ Item found!")
    print(f"Item ID: {item.get('item_id')}")
    print(f"Name: {item.get('name')}")
    print(f"Thumbnail URL: {item.get('thumbnail_url')}")
    print()
    
    images = item.get('images', [])
    print(f"Images array length: {len(images)}")
    
    if not images:
        print("❌ No images found in images array")
        return
    
    print("Images in array:")
    for i, img_url in enumerate(images):
        print(f"  {i+1}. {img_url}")
        if '_section_' in img_url:
            print(f"     -> ✅ Contains '_section_' (stitched)")
        else:
            print(f"     -> ❌ No '_section_' pattern")
    print()
    
    # Check if should be detected as stitched
    has_section = any('_section_' in url for url in images)
    print(f"Should be detected as stitched: {has_section}")
    
    if len(images) == 1:
        print("⚠️  Only 1 image - will go to single image path")
    elif has_section:
        print("✅ Multiple images with _section_ - should trigger stitching")
    else:
        print("✅ Multiple images without _section_ - should show gallery")

if __name__ == "__main__":
    check_item('supabase_1759062682888')