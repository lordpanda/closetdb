import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

class SupabaseDB:
    def __init__(self):
        self.url = os.getenv('SUPABASE_URL')
        self.key = os.getenv('SUPABASE_KEY')
        self.headers = {
            'apikey': self.key,
            'Authorization': f'Bearer {self.key}',
            'Content-Type': 'application/json'
        }
    
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
            
            # REST API 호출
            url = f"{self.url}/rest/v1/closet_items"
            response = requests.post(url, headers=self.headers, json=data)
            
            if response.status_code == 201:
                return "Item added successfully!"
            else:
                return f"Error adding item: {response.status_code} - {response.text}"
                
        except Exception as e:
            print(f"Error adding item: {e}")
            return f"Error adding item: {str(e)}"
    
    def get_all_items(self):
        try:
            url = f"{self.url}/rest/v1/closet_items?select=*&order=created_at.desc"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error fetching items: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"Error fetching items: {e}")
            return []
    
    def get_items_by_category(self, category):
        try:
            # URL encode the category parameter properly
            import urllib.parse
            encoded_category = urllib.parse.quote(category)
            url = f"{self.url}/rest/v1/closet_items?select=*&category=eq.{encoded_category}&order=created_at.desc"
            print(f"Requesting URL: {url}")
            print(f"Looking for category: '{category}'")
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                items = response.json()
                print(f"Found {len(items)} items for category '{category}'")
                
                # Log first few items for debugging
                if items:
                    print(f"First item keys: {list(items[0].keys())}")
                    print(f"First item category: {items[0].get('category')}")
                    print(f"First item size: {items[0].get('size')}")
                    print(f"First item compositions: {items[0].get('compositions')}")
                    if len(items) > 1:
                        print(f"Second item category: {items[1].get('category')}")
                    
                    # Verify filtering worked correctly
                    wrong_categories = [item for item in items if item.get('category') != category]
                    if wrong_categories:
                        print(f"⚠️ WARNING: Found {len(wrong_categories)} items with wrong category!")
                        for wrong_item in wrong_categories[:3]:
                            print(f"   Wrong item: {wrong_item.get('item_id')} has category '{wrong_item.get('category')}' but expected '{category}'")
                    else:
                        print(f"✅ All {len(items)} items have correct category '{category}'")
                
                return items
            else:
                print(f"Error fetching items by category: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"Error fetching items by category: {e}")
            return []
    
    def get_item_by_id(self, item_id):
        try:
            url = f"{self.url}/rest/v1/closet_items?select=*&item_id=eq.{item_id}"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                data = response.json()
                return data[0] if data else None
            else:
                print(f"Error fetching item by id: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Error fetching item: {e}")
            return None
    
    def filter_items(self, filters):
        try:
            # 기본 URL - 최근 생성 순으로 정렬
            url = f"{self.url}/rest/v1/closet_items?select=*&order=created_at.desc"
            
            # 필터 조건들을 URL 파라미터로 추가
            filter_params = []
            
            if filters.get('category'):
                filter_params.append(f"category=eq.{filters['category']}")
            
            if filters.get('subcategory'):
                filter_params.append(f"subcategory=eq.{filters['subcategory']}")
            
            if filters.get('subcategory2'):
                filter_params.append(f"subcategory2=eq.{filters['subcategory2']}")
            
            if filters.get('brand'):
                filter_params.append(f"brand=ilike.*{filters['brand']}*")
            
            if filters.get('sizes') and len(filters['sizes']) > 0:
                # Multiple sizes - use 'in' operator
                sizes_list = ','.join(filters['sizes'])
                filter_params.append(f"size=in.({sizes_list})")
            elif filters.get('size'):
                # Single size (backward compatibility)
                filter_params.append(f"size=eq.{filters['size']}")
            
            if filters.get('size_region'):
                filter_params.append(f"size_region=eq.{filters['size_region']}")
            
            if filters.get('year'):
                filter_params.append(f"year=eq.{filters['year']}")
            
            if filters.get('season'):
                filter_params.append(f"season=eq.{filters['season']}")
            
            if filters.get('purchase_year'):
                filter_params.append(f"purchase_year=eq.{filters['purchase_year']}")
            
            # Composition 필터 처리 (JSON 필드에서 키 검색)
            if filters.get('composition'):
                composition_filters = filters['composition']
                for comp_name in composition_filters.keys():
                    # JSON 필드에서 특정 키가 존재하는지 확인
                    filter_params.append(f"compositions->>{comp_name}=not.is.null")
            
            # 필터 파라미터를 URL에 추가
            if filter_params:
                url += "&" + "&".join(filter_params)
            
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error filtering items: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"Error filtering items: {e}")
            return []
    
    def update_item(self, item_id, updated_data):
        """아이템 업데이트"""
        try:
            print(f"Starting update for item {item_id}")
            print(f"Raw updated_data: {updated_data}")
            
            # ID는 업데이트 데이터에서 제거
            if 'id' in updated_data:
                del updated_data['id']
            
            # composition 데이터 특별 처리
            if 'compositions' in updated_data:
                compositions = updated_data['compositions']
                print(f"Compositions in update data: {compositions} (type: {type(compositions)})")
                
                # composition은 빈 객체라도 유효한 업데이트로 처리 (기존 데이터 삭제/초기화 목적)
                if isinstance(compositions, (dict, list)):
                    print(f"Compositions data (including empty): {compositions}")
                else:
                    print(f"Invalid compositions type: {type(compositions)}")
                        
            # 빈 값들 제거 (None, 빈 문자열 제외)
            cleaned_data = {}
            for k, v in updated_data.items():
                if v is not None and v != '':
                    # compositions는 빈 객체라도 포함
                    if k == 'compositions':
                        cleaned_data[k] = v
                        print(f"Including compositions in cleaned data: {v}")
                    # 리스트나 딕셔너리는 별도 처리
                    elif isinstance(v, (list, dict)):
                        # images와 compositions는 빈 배열/객체도 유효한 업데이트로 처리
                        if k in ['images', 'compositions'] or v:
                            cleaned_data[k] = v
                    else:
                        cleaned_data[k] = v
                        
            print(f"Cleaned data for update: {cleaned_data}")
            
            # REST API 호출
            url = f"{self.url}/rest/v1/closet_items?item_id=eq.{item_id}"
            response = requests.patch(url, headers=self.headers, json=cleaned_data)
            
            if response.status_code in [200, 204]:  # Both 200 and 204 are success
                print(f"Item {item_id} updated successfully (status: {response.status_code})")
                
                # 204 No Content인 경우 업데이트된 데이터 다시 조회
                if response.status_code == 204:
                    updated_item = self.get_item_by_id(item_id)
                    if updated_item:
                        print(f"Updated result: {updated_item.get('item_id', 'no-id')}")
                        return updated_item
                    else:
                        print(f"Update successful but could not retrieve updated item")
                        return {'success': True}
                else:
                    # 200 OK인 경우
                    data = response.json()
                    if data:
                        print(f"Updated result: {data[0]}")
                        return data[0]
                    else:
                        return {'success': True}
            else:
                print(f"Update failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Error updating item {item_id}: {e}")
            raise e

# 전역 인스턴스
db = SupabaseDB()