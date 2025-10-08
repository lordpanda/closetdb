import os
import time
import logging
import json
from dotenv import load_dotenv

from flask import Flask, render_template, request, send_from_directory, url_for, jsonify, session, redirect
from authlib.integrations.flask_client import OAuth

load_dotenv()

try:
    from supabase_utils import db
    print("Successfully imported db:", type(db))
    # Quick test
    test_items = db.get_all_items()
    print("DB connection test:", len(test_items), "items")
except Exception as e:
    print("Error importing supabase_utils:", e)
    import traceback
    traceback.print_exc()
    db = None

from r2_utils import r2
from image_utils import ImageProcessor

app = Flask(__name__)

# Security Configuration
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-change-this')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['SESSION_COOKIE_SECURE'] = os.getenv('FLASK_ENV') == 'production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour

# Logging Configuration
log_level = logging.DEBUG if os.getenv('FLASK_DEBUG') == 'True' else logging.INFO
logging.basicConfig(level=log_level)

# Security Headers
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    if os.getenv('FLASK_ENV') == 'production':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# OAuth 설정
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    refresh_token_url=None,
    client_kwargs={
        'scope': 'email profile',
        'token_endpoint_auth_method': 'client_secret_post',
    },
)

@app.route('/static/<path:filename>')
def send_static(filename):
    return send_from_directory('static', filename)


# Landing page (새로운 메인 페이지)
@app.route('/')
def landing():
    return render_template('landing.html')

# Main page (로그인 후 메인 페이지)
@app.route('/index.html')
def index():
    return render_template('index.html')

@app.route('/item.html')
def item():
    item_id = request.args.get('id')
    # Here you can pass the item_id to your template if needed
    return render_template('item.html', item_id=item_id)

@app.route('/add.html')
def add():
    return render_template('add.html')

@app.route('/edit.html')
def edit_item():
    return render_template('edit.html')

@app.route('/filter.html')
def filter_items():
    return render_template('filter.html')

@app.route('/login.html')
def login_page():
    return render_template('login.html')

@app.route('/all.html')  # New route for all.html
def view_all():
    # Add logic here to retrieve and pass data to the all.html template if needed
    return render_template('all.html')

@app.route('/api/items')
def get_items():
    try:
        logging.info("🔍 API request for all items")
        print(f"🔍 DB object type: {type(db)}")
        
        if db is None:
            logging.error("❌ DB object is None")
            return jsonify({'items': [], 'error': 'Database not initialized'}), 500
            
        items = db.get_all_items()
        logging.info(f"📊 Retrieved {len(items)} items from database")
        print(f"📊 Retrieved {len(items)} items from database")
        
        # 첫 번째 아이템 로깅 (있다면)
        if items:
            logging.info(f"📝 First item: {items[0].get('item_id', 'no-id')} - {items[0].get('brand', 'no-brand')}")
            print(f"📝 First item: {items[0].get('item_id', 'no-id')} - {items[0].get('brand', 'no-brand')}")
        
        return jsonify({'items': items}), 200
    except Exception as e:
        logging.error(f"Error fetching items: {e}")
        print(f"❌ Error fetching items: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/items/<item_id>')
def get_item(item_id):
    try:
        # Supabase 아이템인지 확인
        if item_id.startswith('supabase_'):
            actual_id = item_id.replace('supabase_', '')
            logging.info(f"🔍 Getting item with actual_id: {actual_id}")
            item = db.get_item_by_id(actual_id)
            
            if item:
                logging.info(f"✅ Found item: {item.get('item_id', 'no-id')}")
                logging.info(f"🖼️ Item images: {item.get('images', [])} (length: {len(item.get('images', []))})")
                logging.info(f"🖼️ Item thumbnail: {item.get('thumbnail_url', 'None')}")
                return jsonify({'item': item}), 200
            else:
                logging.warning(f"❌ Item {actual_id} not found in database")
                return jsonify({'error': 'Item not found'}), 404
        else:
            # 기존 더미 데이터는 빈 응답
            return jsonify({'item': None}), 200
    except Exception as e:
        logging.error(f"Error fetching item {item_id}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500    

@app.route('/api/image-proxy/<filename>')
def image_proxy(filename):
    """R2 이미지를 프록시하여 CORS 문제 해결"""
    try:
        import requests
        r2_url = f"https://pub-d30acb5ff7c3432aad2e05bfbfd34c6d.r2.dev/{filename}"
        
        response = requests.get(r2_url, stream=True)
        
        if response.status_code == 200:
            from flask import Response
            return Response(
                response.content,
                content_type=response.headers.get('content-type', 'image/jpeg'),
                headers={
                    'Cache-Control': 'public, max-age=3600',
                    'Access-Control-Allow-Origin': '*'
                }
            )
        else:
            return "Image not found", 404
            
    except Exception as e:
        logging.error(f"Image proxy error: {e}")
        return "Proxy error", 500

@app.route('/api/filter', methods=['POST'])
def api_filter_items():
    try:
        filters = request.json
        logging.info(f"Applying filters: {filters}")
        
        # Supabase에서 필터링된 아이템 가져오기
        filtered_items = db.filter_items(filters)
        return jsonify({
            'items': filtered_items,
            'count': len(filtered_items)
        })
    except Exception as e:
        logging.error(f"Error filtering items: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/login', methods=['POST'])
def login():
    # Admin password login disabled - use Google OAuth instead
    logging.info("Admin password login disabled, redirecting to Google OAuth")
    return jsonify({'error': 'Admin password login disabled. Please use Google OAuth.'}), 401

@app.route('/auth/google')
def google_login():
    try:
        logging.info("Google login route accessed")
        redirect_uri = url_for('google_callback', _external=True)
        logging.info(f"Redirect URI: {redirect_uri}")
        return google.authorize_redirect(redirect_uri)
    except Exception as e:
        logging.error(f"Google login error: {str(e)}")
        return f"Google login error: {str(e)}", 500

@app.route('/auth/google/callback')
def google_callback():
    try:
        # ID 토큰 검증 없이 access token만 받기
        token = google.authorize_access_token(claims_options={"iss": {"essential": False}})
        
        # Google userinfo API를 직접 호출
        resp = google.get('https://www.googleapis.com/oauth2/v2/userinfo', token=token)
        user_info = resp.json()
        
        logging.info(f"Received user info: {user_info}")
        
        if user_info and user_info.get('email'):
            session['authenticated'] = True
            session['user_info'] = {
                'email': user_info['email'],
                'name': user_info.get('name', 'User'),
                'picture': user_info.get('picture')
            }
            # 토큰 생성
            auth_token = f"google_auth_{int(time.time())}"
            logging.info(f"Google authentication successful for: {user_info['email']}")
            
            # JavaScript로 토큰 설정하고 리다이렉트하는 HTML 렌더링
            return f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Login Success</title>
            </head>
            <body>
                <script>
                    console.log('🔐 Google login successful, setting token and redirecting');
                    sessionStorage.setItem('userToken', '{auth_token}');
                    
                    // 저장된 리다이렉트 URL 확인
                    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                    console.log('🔍 Checking redirect URL:', redirectUrl);
                    
                    if (redirectUrl) {{
                        console.log('🎯 Redirecting to saved URL:', redirectUrl);
                        sessionStorage.removeItem('redirectAfterLogin');
                        window.location.href = redirectUrl;
                    }} else {{
                        console.log('🏠 No saved URL, redirecting to main page');
                        window.location.href = '/index.html';
                    }}
                </script>
                <p>Login successful! Redirecting...</p>
            </body>
            </html>
            """
        else:
            logging.error(f"No email in user info: {user_info}")
            return redirect('/login.html?error=no_email')
    except Exception as e:
        logging.error(f"Google OAuth error: {str(e)}")
        import traceback
        traceback.print_exc()
        return redirect('/login.html?error=oauth_failed')

def require_auth(f):
    def decorated_function(*args, **kwargs):
        # Flask session 확인
        session_auth = session.get('authenticated')
        logging.info(f"🔍 Flask session authenticated: {session_auth}")
        logging.info(f"🔍 Session data: {dict(session) if session else 'empty'}")
        
        if session_auth:
            logging.info("✅ Flask session authentication valid")
            return f(*args, **kwargs)
        
        # Authorization 헤더 확인
        auth_header = request.headers.get('Authorization')
        logging.info(f"🔍 Auth header: {auth_header}")
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]  # "Bearer " 제거
            logging.info(f"🔐 Auth token received: {token[:20]}...")
            
            # 토큰이 유효한지 간단히 확인 (google_auth로 시작하는지)
            if token and (token.startswith('google_auth_') or token.startswith('logged_in_')):
                logging.info("✅ Valid auth token found")
                return f(*args, **kwargs)
            else:
                logging.warning(f"❌ Invalid token format: {token[:20]}...")
        
        logging.warning("❌ No valid authentication found")
        
        # Ajax 요청인 경우 JSON 오류 응답
        if request.headers.get('Content-Type', '').startswith('multipart/form-data') or request.method == 'POST':
            return jsonify({'error': 'Authentication required'}), 401
        
        # 일반 요청인 경우 로그인 페이지로 리다이렉트
        return redirect('/login.html')
    decorated_function.__name__ = f.__name__
    return decorated_function





@app.route('/add_item', methods=['POST'])
@require_auth
def add_item():
    try:
        # Use the current time in milliseconds as the itemID
        itemID = int(time.time() * 1000)

        # 이미지 모드 확인
        image_mode = request.form.get('image_mode', 'stitched')
        image_urls = []
        
        logging.info(f"Image mode: {image_mode}")
        logging.info(f"Form files: {list(request.files.keys())}")
        
        if image_mode == 'stitched':
            # Stitched 이미지 처리
            stitched_file = request.files.get('stitched_image')
            if stitched_file and stitched_file.filename:
                try:
                    section_count = int(request.form.get('section_count', 2))
                    
                    # 이미지 분할
                    sections = ImageProcessor.split_stitched_image(stitched_file, section_count)
                    if sections:
                        # 분할된 이미지들을 파일 객체로 변환
                        file_objects = ImageProcessor.create_file_objects(sections, itemID)
                        
                        # 첫 번째 섹션으로 썸네일 생성
                        first_section = file_objects[0]
                        result = r2.upload_with_thumbnail(first_section, itemID, 0)
                        image_urls = []
                        thumbnail_url = None
                        
                        if result['original_url']:
                            image_urls.append(result['original_url'])
                            thumbnail_url = result['thumbnail_url']
                        
                        # 나머지 섹션들 업로드
                        remaining_sections = file_objects[1:]
                        remaining_urls = r2.upload_multiple_images(remaining_sections, itemID)
                        image_urls.extend(remaining_urls)
                        
                        logging.info(f"Successfully uploaded {len(image_urls)} stitched sections with thumbnail")
                        
                except Exception as e:
                    logging.error(f"Error processing stitched image: {e}")
                    image_urls = []
                    thumbnail_url = None
            else:
                logging.warning("No stitched image found")
                image_urls = []
                thumbnail_url = None
        else:
            # Individual 이미지 처리
            individual_files = request.files.getlist('individual_images')
            logging.info(f"Individual files found: {len(individual_files)}")
            logging.info(f"Individual files with filenames: {[f.filename for f in individual_files if f.filename]}")
            
            if individual_files and any(file.filename for file in individual_files):
                try:
                    main_image_index = int(request.form.get('main_image_index', 0))
                    logging.info(f"Main image index: {main_image_index}")
                    
                    # 메인 이미지를 첫 번째로 재배열
                    processed_files = ImageProcessor.process_individual_images(individual_files, main_image_index)
                    
                    image_urls = []
                    thumbnail_url = None
                    
                    # 첫 번째 이미지(메인 이미지)는 썸네일과 함께 업로드
                    if processed_files:
                        first_file = processed_files[0]
                        result = r2.upload_with_thumbnail(first_file, itemID, 0)
                        if result['original_url']:
                            image_urls.append(result['original_url'])
                            thumbnail_url = result['thumbnail_url']
                        
                        # 나머지 이미지들은 일반 업로드
                        for i, file in enumerate(processed_files[1:], 1):
                            if file.filename:
                                filename = f"{itemID}_{i}_{file.filename}"
                                url = r2.upload_image(file, filename)
                                if url:
                                    image_urls.append(url)
                    
                    logging.info(f"Successfully uploaded {len(image_urls)} individual images with thumbnail")
                    
                except Exception as e:
                    logging.error(f"Error processing individual images: {e}")
                    image_urls = []
                    thumbnail_url = None
            else:
                logging.warning("No individual images found or all files have empty filenames")
                thumbnail_url = None

        # 폼 데이터 처리 (multipart/form-data)
        data = request.form.to_dict()
        
        category = data.get('category')
        subcategory = data.get('subcategory')
        subcategory2 = data.get('subcategory2')
        brand = data.get('brand')
        name = data.get('name')
        sizeRegion = data.get('sizeRegion')
        size = data.get('size')
        sizeEtc = data.get('sizeEtc')
        
        # JSON 데이터 파싱
        measurements = data.get('measurements')
        if measurements:
            try:
                measurements = json.loads(measurements)
            except:
                measurements = None
                
        compositions = data.get('compositions') 
        if compositions:
            try:
                compositions = json.loads(compositions)
            except:
                compositions = None
        
        year = data.get('year')
        season = data.get('season')
        purchaseYear = data.get('purchaseYear')

        item = {'itemID': itemID}

        # Add fields to the item dictionary if they are provided
        if image_urls:
            item['images'] = image_urls
        if 'thumbnail_url' in locals() and thumbnail_url:
            item['thumbnail_url'] = thumbnail_url
        if category:
            item['category'] = category
        if subcategory:
            item['subcategory'] = subcategory
        if subcategory2:
            item['subcategory2'] = subcategory2
        if brand:
            item['brand'] = brand
        if name:
            item['name'] = name
        if sizeRegion:
            item['sizeRegion'] = sizeRegion
        if size:
            item['size'] = size
        if sizeEtc:
            item['sizeEtc'] = sizeEtc
        if measurements:
            item['measurements'] = measurements
        if compositions:
            item['compositions'] = compositions
        if year:
            item['year'] = year
        if season:
            item['season'] = season
        if purchaseYear:
            item['purchaseYear'] = purchaseYear
        

        # Call the function to add the item to Supabase
        response = db.add_item(item)
        return jsonify({'message': response}), 200
        
    except Exception as e:
        app.logger.error(f"Error adding item: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/proxy_image')
def proxy_image():
    """R2 이미지에 대한 CORS 프록시"""
    image_url = request.args.get('url')
    logging.info(f"🖼️ Proxy request for URL: {image_url}")
    
    if not image_url:
        logging.error("❌ Missing URL parameter")
        return "Missing URL parameter", 400
    
    # R2 URL인지 확인 (보안상)
    r2_public_url = os.getenv('R2_PUBLIC_URL', '')
    logging.info(f"🔍 Checking URL against R2_PUBLIC_URL: {r2_public_url}")
    
    if not image_url.startswith(r2_public_url):
        logging.error(f"❌ Invalid URL - doesn't start with {r2_public_url}")
        return "Invalid URL", 403
    
    try:
        import requests
        logging.info(f"🔄 Fetching image from: {image_url}")
        
        # User-Agent 헤더 추가
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(image_url, timeout=10, headers=headers)
        response.raise_for_status()
        logging.info(f"✅ Image fetched successfully, status: {response.status_code}, size: {len(response.content)} bytes")
        
        # 적절한 Content-Type 헤더 설정
        content_type = response.headers.get('Content-Type', 'image/jpeg')
        logging.info(f"📄 Content-Type: {content_type}")
        
        from flask import Response
        return Response(
            response.content,
            mimetype=content_type,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Cache-Control': 'public, max-age=3600'  # 1시간 캐시
            }
        )
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ Request error proxying image: {e}")
        logging.error(f"❌ URL that failed: {image_url}")
        return f"Request error: {str(e)}", 500
    except Exception as e:
        logging.error(f"❌ Unexpected error proxying image: {e}")
        logging.error(f"❌ URL that failed: {image_url}")
        import traceback
        traceback.print_exc()
        return f"Unexpected error: {str(e)}", 500

@app.route('/update_item', methods=['POST'])
@require_auth
def update_item():
    try:
        logging.info("Update item request received")
        
        # 아이템 ID 가져오기
        item_id = request.form.get('item_id')
        if not item_id:
            return jsonify({'error': 'Item ID is required'}), 400
            
        logging.info(f"🔍 Updating item with ID: '{item_id}' (type: {type(item_id)})")
        
        # item_id를 정수로 변환 시도 (DB에 숫자로 저장된 경우를 대비)
        try:
            item_id_int = int(item_id)
            logging.info(f"🔍 Converted item_id to integer: {item_id_int}")
        except ValueError:
            item_id_int = None
            logging.info(f"🔍 Could not convert item_id to integer, using as string")
        
        # 기존 아이템 정보 가져오기 (문자열과 정수 둘 다 시도)
        existing_item = db.get_item_by_id(item_id)
        if not existing_item and item_id_int is not None:
            logging.info(f"🔍 Trying with integer item_id: {item_id_int}")
            existing_item = db.get_item_by_id(item_id_int)
            if existing_item:
                item_id = item_id_int  # 성공한 ID로 업데이트
        
        logging.info(f"🔍 Found existing item: {existing_item is not None}")
        
        if not existing_item:
            # 디버깅을 위해 모든 아이템 ID 조회
            all_items = db.get_all_items()
            item_ids = [item.get('item_id') for item in all_items[:5]]  # 처음 5개만
            logging.error(f"❌ Item not found. Searched for: '{item_id}'. Available item_ids (sample): {item_ids}")
            return jsonify({'error': 'Item not found'}), 404
        
        # 이미지 처리 (새 이미지가 있는 경우에만)
        image_urls = existing_item.get('images', [])
        thumbnail_url = existing_item.get('thumbnail_url')
        
        image_mode = request.form.get('image_mode')
        logging.info(f"🖼️ Image mode received: '{image_mode}'")
        
        if image_mode:  # 새 이미지가 업로드된 경우
            logging.info(f"🖼️ Processing new images in {image_mode} mode")
            if image_mode == 'stitched':
                stitched_file = request.files.get('stitched_image')
                logging.info(f"🖼️ Stitched file received: {stitched_file is not None}")
                logging.info(f"🖼️ Stitched filename: {stitched_file.filename if stitched_file else 'None'}")
                
                if stitched_file and stitched_file.filename:
                    section_count = int(request.form.get('section_count', 2))
                    logging.info(f"🖼️ Section count: {section_count}")
                    
                    # 기존 이미지 삭제 (필요시)
                    
                    # Stitched 이미지 처리
                    try:
                        logging.info(f"🔄 Starting stitched image processing with {section_count} sections")
                        sections = ImageProcessor.split_stitched_image(stitched_file, section_count)
                        logging.info(f"📐 Image split into {len(sections)} sections")
                        
                        file_objects = ImageProcessor.create_file_objects(sections, item_id)
                        logging.info(f"📁 Created {len(file_objects)} file objects")
                        
                        # 첫 번째 섹션으로 썸네일 생성 및 업로드
                        new_image_urls = []
                        new_thumbnail_url = None
                        upload_successes = []
                        upload_failures = []
                        
                        if file_objects:
                            # 첫 번째 섹션 (썸네일 포함)
                            logging.info(f"📤 Uploading first section (with thumbnail): {file_objects[0].filename}")
                            first_file = file_objects[0]
                            result = r2.upload_with_thumbnail(first_file, item_id, 0)
                            
                            if result['original_url']:
                                new_image_urls.append(result['original_url'])
                                new_thumbnail_url = result['thumbnail_url']
                                upload_successes.append(f"section_0: {result['original_url']}")
                                logging.info(f"✅ First stitched section uploaded: {result['original_url']}")
                                logging.info(f"🖼️ Thumbnail created: {result['thumbnail_url']}")
                            else:
                                upload_failures.append("section_0: Upload failed")
                                logging.error(f"❌ First section upload failed")
                            
                            # 나머지 섹션들 개별 업로드 (상세 로깅)
                            remaining_sections = file_objects[1:]
                            logging.info(f"📤 Uploading {len(remaining_sections)} remaining sections...")
                            
                            for i, file_obj in enumerate(remaining_sections, 1):
                                section_name = f"section_{i}"
                                logging.info(f"📤 Uploading {section_name}: {file_obj.filename}")
                                
                                try:
                                    url = r2.upload_image(file_obj, file_obj.filename)
                                    if url:
                                        new_image_urls.append(url)
                                        upload_successes.append(f"{section_name}: {url}")
                                        logging.info(f"✅ {section_name} uploaded: {url}")
                                    else:
                                        upload_failures.append(f"{section_name}: Upload returned None")
                                        logging.error(f"❌ {section_name} upload failed: returned None")
                                except Exception as e:
                                    upload_failures.append(f"{section_name}: {str(e)}")
                                    logging.error(f"❌ {section_name} upload error: {e}")
                            
                            # 업로드 결과 요약
                            logging.info(f"📊 Upload Summary:")
                            logging.info(f"   ✅ Successful uploads ({len(upload_successes)}): {upload_successes}")
                            if upload_failures:
                                logging.error(f"   ❌ Failed uploads ({len(upload_failures)}): {upload_failures}")
                            
                            logging.info(f"📝 Total URLs collected: {len(new_image_urls)}")
                            
                            # 업로드가 성공한 경우에만 기존 이미지 URL 교체
                            if new_image_urls:
                                image_urls = new_image_urls
                                thumbnail_url = new_thumbnail_url
                                logging.info(f"✅ Updated image URLs: {image_urls}")
                            else:
                                logging.error("❌ No stitched images were uploaded successfully")
                                
                    except Exception as e:
                        logging.error(f"❌ Error processing stitched image for update: {e}")
                        import traceback
                        traceback.print_exc()
                        
            elif image_mode == 'individual':
                individual_files = request.files.getlist('individual_images')
                main_image_index = int(request.form.get('main_image_index', 0))
                
                if individual_files and any(f.filename for f in individual_files):
                    # 기존 이미지 삭제 (필요시)
                    
                    try:
                        processed_files = ImageProcessor.process_individual_images(individual_files, main_image_index)
                        
                        new_image_urls = []
                        new_thumbnail_url = None
                        
                        # 첫 번째 이미지(메인 이미지)는 썸네일과 함께 업로드
                        if processed_files:
                            first_file = processed_files[0]
                            result = r2.upload_with_thumbnail(first_file, item_id, 0)
                            if result['original_url']:
                                new_image_urls.append(result['original_url'])
                                new_thumbnail_url = result['thumbnail_url']
                                logging.info(f"✅ Main individual image uploaded: {result['original_url']}")
                            
                            # 나머지 이미지들은 일반 업로드
                            for i, file in enumerate(processed_files[1:], 1):
                                if file.filename:
                                    filename = f"{item_id}_{i}_{file.filename}"
                                    url = r2.upload_image(file, filename)
                                    if url:
                                        new_image_urls.append(url)
                                        logging.info(f"✅ Additional individual image uploaded: {url}")
                            
                            logging.info(f"✅ All individual images uploaded. Total: {len(new_image_urls)}")
                            
                            # 업로드가 성공한 경우에만 기존 이미지 URL 교체
                            if new_image_urls:
                                image_urls = new_image_urls
                                thumbnail_url = new_thumbnail_url
                            else:
                                logging.error("❌ No individual images were uploaded successfully")
                                    
                    except Exception as e:
                        logging.error(f"❌ Error processing individual images for update: {e}")
                        import traceback
                        traceback.print_exc()

        # 폼 데이터 처리
        data = request.form.to_dict()
        logging.info(f"🔍 Raw form data received: {data}")
        logging.info(f"🔍 All form keys: {list(data.keys())}")
        
        # 업데이트할 아이템 데이터 구성
        updated_item = {}
        
        # 기본 정보 (데이터베이스 컬럼명에 맞춰 매핑)
        if data.get('category'):
            updated_item['category'] = data.get('category')
            logging.info(f"✅ Category: {data.get('category')}")
        if data.get('subcategory'):
            updated_item['subcategory'] = data.get('subcategory')
        if data.get('subcategory2'):
            updated_item['subcategory2'] = data.get('subcategory2')
        if data.get('brand'):
            updated_item['brand'] = data.get('brand')
            logging.info(f"✅ Brand: {data.get('brand')}")
        if data.get('name'):
            updated_item['name'] = data.get('name')
        if data.get('sizeRegion'):
            updated_item['size_region'] = data.get('sizeRegion')  # 데이터베이스 컬럼명
            logging.info(f"✅ Size region: {data.get('sizeRegion')}")
        if data.get('size'):
            updated_item['size'] = data.get('size')
            logging.info(f"✅ Size: {data.get('size')}")
        if data.get('sizeEtc'):
            updated_item['size_etc'] = data.get('sizeEtc')  # 데이터베이스 컬럼명
            
        # JSON 데이터 파싱
        measurements = data.get('measurements')
        logging.info(f"📏 Measurements data received: {measurements}")
        if measurements:
            try:
                updated_item['measurements'] = json.loads(measurements)
                logging.info(f"✅ Measurements parsed successfully")
            except Exception as e:
                logging.error(f"❌ Error parsing measurements: {e}")
                pass
                
        compositions = data.get('compositions') 
        logging.info(f"📊 Compositions data received: '{compositions}' (type: {type(compositions)})")
        logging.info(f"📊 Compositions raw value: {repr(compositions)}")
        
        if compositions is not None and compositions != '':
            logging.info(f"🔍 Compositions is not empty, attempting to parse...")
            try:
                parsed_compositions = json.loads(compositions)
                # 빈 객체나 빈 배열도 유효한 업데이트로 처리 (기존 데이터 삭제 목적일 수 있음)
                updated_item['compositions'] = parsed_compositions
                logging.info(f"✅ Compositions parsed successfully: {parsed_compositions}")
            except Exception as e:
                logging.error(f"❌ Error parsing compositions: {e}")
                logging.error(f"❌ Compositions string that failed: {repr(compositions)}")
        else:
            logging.warning(f"⚠️ No compositions data received or compositions is empty")
            logging.warning(f"⚠️ Form data keys containing 'comp': {[k for k in data.keys() if 'comp' in k.lower()]}")
            # 빈 composition으로 업데이트 (기존 데이터 클리어)
            updated_item['compositions'] = {}
        
        if data.get('year'):
            updated_item['year'] = data.get('year')
        if data.get('season'):
            updated_item['season'] = data.get('season')
        if data.get('purchaseYear'):
            updated_item['purchase_year'] = data.get('purchaseYear')  # 데이터베이스 컬럼명
            
        # 삭제된 이미지 처리
        deleted_images_json = request.form.get('deleted_images')
        if deleted_images_json:
            try:
                deleted_image_urls = json.loads(deleted_images_json)
                logging.info(f"🗑️ Processing deleted images: {deleted_image_urls}")
                
                # R2에서 삭제된 이미지들 삭제
                for url in deleted_image_urls:
                    try:
                        # URL에서 파일명 추출
                        filename = url.split('/')[-1]
                        r2_deleted = r2.delete_image(filename)
                        logging.info(f"🗑️ Deleted from R2: {filename} - Success: {r2_deleted}")
                    except Exception as e:
                        logging.error(f"Error deleting image from R2: {e}")
                
                # 기존 images 배열에서 삭제된 이미지들 제거
                if existing_item.get('images'):
                    remaining_images = [img for img in existing_item['images'] if img not in deleted_image_urls]
                    if image_urls:
                        # 새 이미지가 있으면 새 이미지로 교체
                        updated_item['images'] = image_urls
                    else:
                        # 새 이미지가 없으면 남은 기존 이미지들 유지
                        updated_item['images'] = remaining_images
                    logging.info(f"🗑️ Updated images after deletion: {updated_item.get('images', [])}")
                
            except Exception as e:
                logging.error(f"Error processing deleted images: {e}")
        else:
            # 삭제된 이미지가 없고 새 이미지가 있는 경우
            if image_urls:
                updated_item['images'] = image_urls
        
        # 썸네일 URL 업데이트
        if thumbnail_url:
            updated_item['thumbnail_url'] = thumbnail_url
        
        # Supabase 업데이트
        logging.info(f"📝 Final updated_item data: {updated_item}")
        response = db.update_item(item_id, updated_item)
        logging.info(f"✅ Update response from database: {response}")
        logging.info(f"✅ Database response type: {type(response)}")
        
        # 업데이트 후 아이템 재조회로 확인
        updated_item_check = db.get_item_by_id(item_id)
        if updated_item_check:
            logging.info(f"🔍 Updated item verification - Images: {updated_item_check.get('images', [])}")
            logging.info(f"🔍 Updated item verification - Thumbnail: {updated_item_check.get('thumbnail_url', 'None')}")
        else:
            logging.warning("❌ Could not retrieve updated item for verification")
        
        # 응답 객체가 JSON 직렬화 가능한지 확인
        try:
            json_response = {'message': 'Item updated successfully', 'response': response}
            json.dumps(json_response)  # 직렬화 테스트
            logging.info(f"✅ Response is JSON serializable")
        except Exception as json_error:
            logging.error(f"❌ Response serialization error: {json_error}")
            # 직렬화 불가능한 객체를 문자열로 변환
            json_response = {'message': 'Item updated successfully', 'response': str(response)}
        
        return jsonify(json_response), 200
        
    except Exception as e:
        app.logger.error(f"Error updating item: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': f'Update failed: {str(e)}',
            'details': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)