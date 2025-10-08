#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from supabase_utils import db

# Load environment variables
load_dotenv()

def check_item(item_id):
    """Check what's actually stored in the database for this item"""
    print(f"Checking item {item_id} in database...")
    
    try:
        # Get item from database
        item = db.get_item_by_id(item_id)
        
        if not item:
            print(f"ERROR: Item {item_id} not found in database")
            return
        
        print(f"SUCCESS: Found item {item_id}")
        print(f"Item data:")
        
        # Print key fields
        key_fields = ['item_id', 'name', 'brand', 'category', 'images', 'thumbnail_url', 'size', 'size_region']
        
        for field in key_fields:
            value = item.get(field)
            if field == 'images':
                if isinstance(value, list):
                    print(f"  {field}: {len(value)} images")
                    for i, img in enumerate(value):
                        print(f"    [{i}] {img}")
                else:
                    print(f"  {field}: {value} (type: {type(value)})")
            else:
                print(f"  {field}: {value}")
                
        print(f"\nAll fields in item:")
        for key, value in item.items():
            if key not in key_fields:
                print(f"  {key}: {value}")
                
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Check the specific item that's having issues
    item_id = 1759824435688
    check_item(item_id)