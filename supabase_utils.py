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
                'purchase_year': item.get('purchaseYear'),
                'tags': item.get('tags'),
                'color': item.get('color')
            }
            
            # None 값 제거 (Supabase에서 NULL로 처리됨)
            data = {k: v for k, v in data.items() if v is not None and v != ''}
            
            # Color 디버깅 로깅
            print(f"🔍 [SUPABASE] Color in original item: {item.get('color')}")
            print(f"🔍 [SUPABASE] Color in filtered data: {data.get('color')}")
            print(f"🔍 [SUPABASE] Data keys being sent: {list(data.keys())}")
            
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
    
    def get_ootds(self):
        """Get all saved OOTDs from Supabase"""
        try:
            response = requests.get(
                f'{self.url}/rest/v1/ootd?select=*&order=date.desc',
                headers=self.headers
            )
            
            if response.status_code == 200:
                ootds = response.json()
                print(f"✅ Retrieved {len(ootds)} OOTDs from Supabase")
                return ootds
            else:
                print(f"❌ Failed to get OOTDs: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ Error getting OOTDs: {e}")
            return []
    
    def get_ootd_by_date(self, date):
        """Get OOTD for specific date from Supabase"""
        try:
            response = requests.get(
                f'{self.url}/rest/v1/ootd?date=eq.{date}&select=*',
                headers=self.headers
            )
            
            if response.status_code == 200:
                ootds = response.json()
                if ootds:
                    ootd = ootds[0]  # Should be only one per date
                    print(f"✅ Retrieved OOTD for {date}: {ootd}")
                    return ootd
                else:
                    print(f"📅 No OOTD found for date: {date}")
                    return None
            else:
                print(f"❌ Failed to get OOTD for {date}: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error getting OOTD for {date}: {e}")
            return None
    
    def save_ootd(self, ootd_data):
        """Save OOTD data to Supabase"""
        try:
            # Prepare data for Supabase
            data = {
                'date': ootd_data.get('date'),
                'location': ootd_data.get('location'),
                'weather': ootd_data.get('weather'),
                'temp_min': ootd_data.get('temp_min'),
                'temp_max': ootd_data.get('temp_max'),
                'precipitation': ootd_data.get('precipitation'),
                'items': ootd_data.get('items', []),
                'uploaded_image': ootd_data.get('uploaded_image'),
                'created_at': ootd_data.get('created_at')
            }
            
            # Remove None values
            data = {k: v for k, v in data.items() if v is not None}
            
            print(f"💾 Saving OOTD to Supabase: {data}")
            
            # Use Supabase's built-in upsert with proper syntax
            date_to_save = data.get('date')
            print(f"🔍 Attempting upsert for date: {date_to_save}")
            
            # Supabase upsert: POST with Prefer header and on_conflict
            upsert_headers = {
                **self.headers,
                'Prefer': 'resolution=merge-duplicates'
            }
            
            response = requests.post(
                f'{self.url}/rest/v1/ootd',
                headers=upsert_headers,
                json=data
            )
            
            print(f"📡 Upsert response status: {response.status_code}")
            print(f"📡 Upsert response headers: {dict(response.headers)}")
            
            # If upsert fails with duplicate key, delete and recreate
            if response.status_code == 409 or (response.status_code == 500 and "23505" in response.text):
                print(f"🔄 Upsert failed with duplicate key, deleting and recreating...")
                
                # Delete existing record
                delete_response = requests.delete(
                    f'{self.url}/rest/v1/ootd',
                    headers=self.headers,
                    params={'date': f'eq.{date_to_save}'}
                )
                print(f"📡 Delete response status: {delete_response.status_code}")
                
                if delete_response.status_code in [200, 204]:
                    # Insert new record
                    response = requests.post(
                        f'{self.url}/rest/v1/ootd',
                        headers=self.headers,
                        json=data
                    )
                    print(f"📡 Insert response status: {response.status_code}")
                else:
                    print(f"❌ Failed to delete existing record: {delete_response.text}")
                    # Try update anyway
                    response = requests.patch(
                        f'{self.url}/rest/v1/ootd',
                        headers=self.headers,
                        json=data,
                        params={'date': f'eq.{date_to_save}'}
                    )
                    print(f"📡 Fallback update response status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                print("✅ OOTD saved successfully to Supabase")
                try:
                    # Supabase may return empty response for successful upserts
                    response_text = response.text
                    if response_text:
                        return response.json()
                    else:
                        print("📝 Empty response from Supabase (normal for upserts)")
                        return {'success': True, 'message': 'OOTD saved'}
                except ValueError as json_error:
                    print(f"⚠️ Non-JSON response: {response_text}")
                    return {'success': True, 'message': 'OOTD saved', 'response': response_text}
            else:
                print(f"❌ Failed to save OOTD: {response.status_code} - {response.text}")
                raise Exception(f"Failed to save OOTD: {response.text}")
                
        except Exception as e:
            print(f"❌ Error saving OOTD: {e}")
            raise e
    
    def add_item_wear_log(self, item_id, wear_date, min_temp=None, max_temp=None, ootd_image_url=None, location=None, weather=None, precipitation=None):
        """아이템 착용 로그 추가"""
        try:
            data = {
                'item_id': item_id,
                'wear_date': wear_date,
                'min_temp': min_temp,
                'max_temp': max_temp,
                'ootd_image_url': ootd_image_url,
                'location': location,
                'weather': weather,
                'precipitation': precipitation
            }
            
            # None 값 제거
            data = {k: v for k, v in data.items() if v is not None}
            
            print(f"💾 Adding wear log: item {item_id} on {wear_date}")
            
            # Upsert을 사용해서 같은 날짜에 착용 기록이 있으면 업데이트
            upsert_headers = {
                **self.headers,
                'Prefer': 'resolution=merge-duplicates'
            }
            
            response = requests.post(
                f'{self.url}/rest/v1/item_wear_logs',
                headers=upsert_headers,
                json=data
            )
            
            # 중복 키 에러가 발생하면 기존 레코드 업데이트
            if response.status_code == 409 or (response.status_code == 500 and "23505" in response.text):
                print(f"🔄 Duplicate wear log found, updating existing record...")
                response = requests.patch(
                    f'{self.url}/rest/v1/item_wear_logs',
                    headers=self.headers,
                    json=data,
                    params={'item_id': f'eq.{item_id}', 'wear_date': f'eq.{wear_date}'}
                )
            
            if response.status_code in [200, 201, 204]:
                print(f"✅ Wear log added/updated for item {item_id}")
                return True
            else:
                print(f"❌ Failed to add wear log: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error adding wear log: {e}")
            return False
    
    def get_item_wear_logs(self, item_id):
        """특정 아이템의 착용 로그 조회"""
        try:
            response = requests.get(
                f'{self.url}/rest/v1/item_wear_logs?item_id=eq.{item_id}&order=wear_date.desc',
                headers=self.headers
            )
            
            if response.status_code == 200:
                logs = response.json()
                print(f"✅ Retrieved {len(logs)} wear logs for item {item_id}")
                return logs
            else:
                print(f"❌ Failed to get wear logs: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ Error getting wear logs: {e}")
            return []
    
    def get_item_wear_stats(self, item_id):
        """아이템 착용 통계 분석"""
        try:
            logs = self.get_item_wear_logs(item_id)
            
            if not logs:
                return {
                    'total_wears': 0,
                    'last_worn': None,
                    'avg_temp_range': None,
                    'most_common_temp_range': None,
                    'yearly_wears': {},
                    'ootd_images': []
                }
            
            # 기본 통계
            total_wears = len(logs)
            last_worn = logs[0]['wear_date']  # 이미 내림차순 정렬됨
            
            # 기온 관련 통계
            temp_data = [(log['min_temp'], log['max_temp']) for log in logs 
                        if log.get('min_temp') is not None and log.get('max_temp') is not None]
            
            avg_temp_range = None
            most_common_temp_range = None
            
            if temp_data:
                avg_min = sum(t[0] for t in temp_data) / len(temp_data)
                avg_max = sum(t[1] for t in temp_data) / len(temp_data)
                avg_temp_range = (round(avg_min, 1), round(avg_max, 1))
                
                # 가장 많이 입었던 기온대 (5도 단위로 그룹화)
                temp_ranges = {}
                for min_t, max_t in temp_data:
                    avg_temp = (min_t + max_t) / 2
                    temp_group = round(avg_temp / 5) * 5  # 5도 단위로 그룹화
                    temp_ranges[temp_group] = temp_ranges.get(temp_group, 0) + 1
                
                if temp_ranges:
                    most_common_temp = max(temp_ranges.keys(), key=lambda k: temp_ranges[k])
                    most_common_temp_range = (most_common_temp - 2, most_common_temp + 2)
            
            # 연도별 착용 횟수
            yearly_wears = {}
            for log in logs:
                year = log['wear_date'][:4]  # YYYY 추출
                yearly_wears[year] = yearly_wears.get(year, 0) + 1
            
            # OOTD 이미지들
            ootd_images = [log['ootd_image_url'] for log in logs 
                          if log.get('ootd_image_url')]
            
            return {
                'total_wears': total_wears,
                'last_worn': last_worn,
                'avg_temp_range': avg_temp_range,
                'most_common_temp_range': most_common_temp_range,
                'yearly_wears': yearly_wears,
                'ootd_images': ootd_images
            }
            
        except Exception as e:
            print(f"❌ Error getting wear stats: {e}")
            return {}
    
    def log_ootd_items_wear(self, ootd_data):
        """OOTD 저장 시 각 아이템의 착용 로그 기록"""
        try:
            wear_date = ootd_data.get('date')
            min_temp = ootd_data.get('temp_min')
            max_temp = ootd_data.get('temp_max')
            ootd_image_url = ootd_data.get('uploaded_image')
            location = ootd_data.get('full_location') or ootd_data.get('location')  # 착용 로그용은 전체 주소 사용
            weather = ootd_data.get('weather')
            precipitation = ootd_data.get('precipitation')
            items = ootd_data.get('items', [])
            
            if not wear_date or not items:
                print("⚠️ Missing date or items for wear logging")
                return False
            
            success_count = 0
            
            for item in items:
                # item이 문자열(item_id)인지 딕셔너리인지 확인
                if isinstance(item, str):
                    item_id = item
                elif isinstance(item, dict):
                    item_id = item.get('item_id') or item.get('id')
                else:
                    print(f"⚠️ Unknown item format: {item}")
                    continue
                
                if item_id:
                    if self.add_item_wear_log(item_id, wear_date, min_temp, max_temp, ootd_image_url, location, weather, precipitation):
                        success_count += 1
                    else:
                        print(f"❌ Failed to log wear for item {item_id}")
            
            print(f"✅ Logged wear for {success_count}/{len(items)} items")
            return success_count == len(items)
            
        except Exception as e:
            print(f"❌ Error logging OOTD items wear: {e}")
            return False
    
    def add_item_combinations(self, ootd_data):
        """OOTD 저장 시 아이템 간의 조합을 기록"""
        try:
            items = ootd_data.get('items', [])
            wear_date = ootd_data.get('date')
            
            if len(items) < 2:
                print("⚠️ Need at least 2 items to create combinations")
                return True  # 에러는 아니므로 True 반환
            
            # 모든 아이템 쌍 조합 생성
            combinations_added = 0
            
            for i in range(len(items)):
                for j in range(i + 1, len(items)):
                    item1_id = items[i].get('item_id') if isinstance(items[i], dict) else items[i]
                    item2_id = items[j].get('item_id') if isinstance(items[j], dict) else items[j]
                    
                    if item1_id and item2_id:
                        # 알파벳 순으로 정렬하여 일관성 유지 (A-B와 B-A가 같은 조합이 되도록)
                        if item1_id > item2_id:
                            item1_id, item2_id = item2_id, item1_id
                        
                        combination_data = {
                            'item_a': item1_id,
                            'item_b': item2_id,
                            'wear_date': wear_date,
                            'created_at': ootd_data.get('created_at')
                        }
                        
                        if self._add_single_combination(combination_data):
                            combinations_added += 1
            
            print(f"✅ Added {combinations_added} item combinations")
            return True
            
        except Exception as e:
            print(f"❌ Error adding item combinations: {e}")
            return False
    
    def _add_single_combination(self, combination_data):
        """단일 아이템 조합 추가"""
        try:
            # REST API 호출
            url = f"{self.url}/rest/v1/item_combinations"
            response = requests.post(url, headers=self.headers, json=combination_data)
            
            if response.status_code in [200, 201]:
                return True
            else:
                print(f"❌ Failed to add combination: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error adding single combination: {e}")
            return False
    
    def get_item_recommendations(self, selected_items, limit=10):
        """선택된 아이템들과 함께 착용된 다른 아이템들 추천"""
        try:
            if not selected_items:
                return []
            
            # 선택된 아이템들과 조합된 모든 아이템 찾기
            recommendations = {}
            
            for item_id in selected_items:
                # item_a 또는 item_b로 저장된 조합 모두 검색
                url1 = f"{self.url}/rest/v1/item_combinations?item_a=eq.{item_id}&select=item_b,wear_date"
                url2 = f"{self.url}/rest/v1/item_combinations?item_b=eq.{item_id}&select=item_a,wear_date"
                
                response1 = requests.get(url1, headers=self.headers)
                response2 = requests.get(url2, headers=self.headers)
                
                if response1.status_code == 200:
                    combinations1 = response1.json()
                    for combo in combinations1:
                        partner_item = combo['item_b']
                        if partner_item not in selected_items:
                            recommendations[partner_item] = recommendations.get(partner_item, 0) + 1
                
                if response2.status_code == 200:
                    combinations2 = response2.json()
                    for combo in combinations2:
                        partner_item = combo['item_a']
                        if partner_item not in selected_items:
                            recommendations[partner_item] = recommendations.get(partner_item, 0) + 1
            
            # 빈도 순으로 정렬하여 상위 추천 아이템 반환
            sorted_recommendations = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)
            
            # 실제 아이템 정보 가져오기
            recommended_items = []
            for item_id, frequency in sorted_recommendations[:limit]:
                item = self.get_item_by_id(item_id)
                if item:
                    item['recommendation_frequency'] = frequency
                    recommended_items.append(item)
            
            print(f"✅ Found {len(recommended_items)} recommendations")
            return recommended_items
            
        except Exception as e:
            print(f"❌ Error getting recommendations: {e}")
            return []

# 전역 인스턴스
db = SupabaseDB()