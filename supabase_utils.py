import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseDB:
    def __init__(self):
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_KEY')
        self.supabase: Client = create_client(url, key)
    
    def add_item(self, item):
        try:
            # itemID를 item_id로 변경하고 모든 필드 추가
            data = {
                'item_id': item.get('itemID'),
                'images': item.get('images', []),
                'thumbnail_url': item.get('thumbnail_url'),
                'category': item.get('category'),
                'subcategory': item.get('subcategory'),
                'subcategory2': item.get('subcategory2'),
                'brand': item.get('brand'),
                'name': item.get('name'),
                'size_region': item.get('sizeRegion'),
                'size': item.get('size'),
                'size_etc': item.get('sizeEtc'),
                'measurements': item.get('measurements'),
                'compositions': item.get('compositions'),
                'year': item.get('year'),
                'season': item.get('season'),
                'purchase_year': item.get('purchaseYear')
            }
            
            # None 값 제거 (Supabase에서 NULL로 처리됨)
            data = {k: v for k, v in data.items() if v is not None and v != ''}
            
            result = self.supabase.table('closet_items').insert(data).execute()
            return "Item added successfully!"
                
        except Exception as e:
            print(f"Error adding item: {e}")
            return f"Error adding item: {str(e)}"
    
    def get_all_items(self):
        try:
            result = self.supabase.table('closet_items').select("*").order('created_at', desc=True).execute()
            return result.data
                
        except Exception as e:
            print(f"Error fetching items: {e}")
            return []
    
    def get_item_by_id(self, item_id):
        try:
            result = self.supabase.table('closet_items').select("*").eq('item_id', item_id).execute()
            return result.data[0] if result.data else None
                
        except Exception as e:
            print(f"Error fetching item: {e}")
            return None
    
    def filter_items(self, filters):
        try:
            query = self.supabase.table('closet_items').select("*")
            
            # 카테고리 필터
            if filters.get('category'):
                query = query.eq('category', filters['category'])
            
            # 서브카테고리 필터
            if filters.get('subcategory'):
                query = query.eq('subcategory', filters['subcategory'])
            
            # 서브카테고리2 필터
            if filters.get('subcategory2'):
                query = query.eq('subcategory2', filters['subcategory2'])
            
            # 브랜드 필터 (부분 일치)
            if filters.get('brand'):
                query = query.ilike('brand', f"%{filters['brand']}%")
            
            # 사이즈 필터
            if filters.get('size'):
                query = query.eq('size', filters['size'])
            
            # 사이즈 리전 필터
            if filters.get('size_region'):
                query = query.eq('size_region', filters['size_region'])
            
            # 연도 필터
            if filters.get('year'):
                query = query.eq('year', filters['year'])
            
            # 시즌 필터
            if filters.get('season'):
                query = query.eq('season', filters['season'])
            
            # 구매 연도 필터
            if filters.get('purchase_year'):
                query = query.eq('purchase_year', filters['purchase_year'])
            
            # 조성 필터 (JSON 내부 검색)
            if filters.get('composition'):
                for comp_name, min_percentage in filters['composition'].items():
                    if min_percentage:
                        # JSON 컬럼에서 특정 조성이 최소 퍼센트 이상인 아이템 검색
                        query = query.filter('compositions', 'cs', f'{{"{comp_name}": {min_percentage}}}')
            
            result = query.order('created_at', desc=True).execute()
            return result.data
                
        except Exception as e:
            print(f"Error filtering items: {e}")
            return []
    
    def update_item(self, item_id, updated_data):
        """아이템 업데이트"""
        try:
            print(f"🔄 Starting update for item {item_id}")
            print(f"📊 Raw updated_data: {updated_data}")
            
            # ID는 업데이트 데이터에서 제거
            if 'id' in updated_data:
                del updated_data['id']
            
            # composition 데이터 특별 처리
            if 'compositions' in updated_data:
                compositions = updated_data['compositions']
                print(f"🧪 Compositions in update data: {compositions} (type: {type(compositions)})")
                
                # composition은 빈 객체라도 유효한 업데이트로 처리 (기존 데이터 삭제/초기화 목적)
                if isinstance(compositions, (dict, list)):
                    print(f"✅ Compositions data (including empty): {compositions}")
                else:
                    print(f"❌ Invalid compositions type: {type(compositions)}")
                        
            # 빈 값들 제거 (None, 빈 문자열 제외)
            cleaned_data = {}
            for k, v in updated_data.items():
                if v is not None and v != '':
                    # compositions는 빈 객체라도 포함
                    if k == 'compositions':
                        cleaned_data[k] = v
                        print(f"🧪 Including compositions in cleaned data: {v}")
                    # 리스트나 딕셔너리는 별도 처리
                    elif isinstance(v, (list, dict)):
                        if v:  # 빈 리스트나 딕셔너리가 아닌 경우만
                            cleaned_data[k] = v
                    else:
                        cleaned_data[k] = v
                        
            print(f"🧹 Cleaned data for update: {cleaned_data}")
            
            result = self.supabase.table('closet_items').update(cleaned_data).eq('item_id', item_id).execute()
            
            if result.data:
                print(f"✅ Item {item_id} updated successfully")
                print(f"📦 Updated result: {result.data[0]}")
                return result.data[0]
            else:
                print(f"❌ No item found with ID {item_id}")
                return None
                
        except Exception as e:
            print(f"❌ Error updating item {item_id}: {e}")
            raise e

# 전역 인스턴스
db = SupabaseDB()