#!/usr/bin/env python3

from supabase_utils import db

def check_thumbnails():
    try:
        print("🔍 썸네일 상태 체크 중...")
        items = db.get_all_items()
        
        if not items:
            print("❌ 아이템이 없습니다")
            return
            
        print(f"📊 총 {len(items)} 개 아이템 발견")
        
        with_thumbnail = 0
        without_thumbnail = 0
        
        print("\n=== 아이템별 썸네일 상태 ===")
        for item in items[:10]:  # 처음 10개만 체크
            item_id = item.get('item_id', 'Unknown')
            thumbnail_url = item.get('thumbnail_url')
            
            if thumbnail_url:
                with_thumbnail += 1
                print(f"✅ ID {item_id}: 썸네일 있음")
                print(f"   URL: {thumbnail_url[:80]}...")
            else:
                without_thumbnail += 1
                print(f"❌ ID {item_id}: 썸네일 없음")
                
                # 원본 이미지가 있는지 체크
                images = item.get('images', [])
                if images:
                    print(f"   원본 이미지: {len(images)}개 있음")
                else:
                    print(f"   원본 이미지: 없음")
        
        print(f"\n📈 결과 요약:")
        print(f"   썸네일 있음: {with_thumbnail}개")
        print(f"   썸네일 없음: {without_thumbnail}개")
        
        if without_thumbnail > 0:
            print(f"\n💡 썸네일이 없는 {without_thumbnail}개 아이템에 대해 썸네일 생성이 필요합니다.")
            print("   새로운 아이템부터는 자동으로 썸네일이 생성됩니다.")
        
    except Exception as e:
        print(f"❌ 에러 발생: {e}")

if __name__ == "__main__":
    check_thumbnails()