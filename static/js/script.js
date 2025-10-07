// 새로운 로그인 핸들러 - 환경변수 패스워드 인증
document.addEventListener('DOMContentLoaded', function() {
    // Check if the login form exists
    var loginForm = document.querySelector('#login_form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            var formData = new FormData(this);
            fetch('/login', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('🔐 Login successful!', data);
                    
                    // 토큰이 있으면 저장
                    if (data.token) {
                        console.log('💾 Saving token:', data.token);
                        sessionStorage.setItem('userToken', data.token);
                    } else {
                        console.log('⚠️ No token in response, creating dummy token');
                        sessionStorage.setItem('userToken', 'logged_in_' + Date.now());
                    }
                    
                    // 로그인 전에 저장된 목표 URL이 있으면 그곳으로, 없으면 메인으로
                    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                    console.log('🔍 Checking for saved redirect URL:', redirectUrl);
                    
                    if (redirectUrl) {
                        console.log("🎯 Redirecting to saved URL:", redirectUrl);
                        sessionStorage.removeItem('redirectAfterLogin'); // 사용 후 제거
                        window.location.href = redirectUrl;
                    } else {
                        console.log("🏠 No saved URL, redirecting to main page");
                        window.location.href = '/';
                    }
                } else {
                    // Handle errors like invalid login
                    alert('Login error: ' + (data.error || 'Invalid password'));
                }
            })
            .catch(error => {
                console.error('Login failed:', error);
                alert('Login error: ' + error.message);
            });
        });
    }
});

function initializeAWS(token) {
    AWS.config.update({
        region: 'ap-northeast-2',
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: 'ap-northeast-2:840a26ac-eef9-4685-8f2a-b7b6f51a4d9d',
            Logins: {
                'cognito-idp.ap-northeast-2.amazonaws.com/ap-northeast-2_s5QgJ1Czf': token
            }
        })
    });

    AWS.config.credentials.get(function(err) {
        if (err) {
            console.log("Error retrieving credentials:", err);
            return;
        }
        console.log("Cognito Identity Id:", AWS.config.credentials.identityId);
    });
}

/* login */
document.addEventListener('DOMContentLoaded', function() {
    var submitButton = document.querySelector('#login_form input[type="submit"]');
    if (submitButton) {
        submitButton.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent the default form submission

            // Get the form data
            var form = this.form; // This will correctly reference the form containing the submit button
            var formData = new FormData(form);

            // Send the form data to your server using fetch or XMLHttpRequest
            fetch('/login', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    return response.json();  // Ensure response is OK before parsing JSON
                } else {
                    // Convert non-OK HTTP responses into structured errors.
                    return response.json().then(error => { throw new Error(error.message || 'Failed to log in'); });
                }
            })
            .then(data => {
                if (data.token) {
                    console.log("🔐 Login successful! Received token: ", data.token);

                    sessionStorage.setItem('userToken', data.token);  // Store token

                    // 로그인 전에 저장된 목표 URL이 있으면 그곳으로, 없으면 메인으로
                    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                    console.log('🔍 Checking for saved redirect URL:', redirectUrl);
                    
                    if (redirectUrl) {
                        console.log("🎯 Redirecting to saved URL:", redirectUrl);
                        sessionStorage.removeItem('redirectAfterLogin'); // 사용 후 제거
                        window.location.href = redirectUrl;
                    } else {
                        console.log("🏠 No saved URL, redirecting to main page");
                        window.location.href = '/'; // Redirect to the dashboard page
                    }
                } else {
                    // Handle errors like invalid login
                    alert('Login error: ' + data.error);
                }
            })
            .catch(error => {
                // Handle any errors that occur during fetching, response handling, or JSON parsing
                console.error('Error:', error);
                alert('An error occurred. Please try again later.');
            });
        });
    }
});

/* template */

function displayGlobalMenu(parm1) {
    var activeItem = [];
    for(var i = 0; i < 3; i++){
        if(i == parm1){
            activeItem[parm1] = "menu_selected";
        } else {
            activeItem[i] = "menu_unselected";
        }
    }
    document.write(`
    <div class="logo">
        <a href="#" id="logo-link"><h1>closetDB</h1></a>
    </div>
    <input type="checkbox" class="toggler">
    <div class="hamburger"><div></div></div>
    <ul class="menu">
        <li><a class="`+activeItem[0]+`" href="#" id="view-all-link">View all</a></li>
        <li><a class="`+activeItem[1]+`" href="#" id="filter-link">Filter items</a></li>
        <li><a class="`+activeItem[2]+`" href="#" id="add-new-link">Add new</a></li>
    </ul>
    `);
}

// 모든 메뉴 링크에 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Setting up menu link event listeners');
    
    // 현재 페이지가 로그인이 필요한 페이지인지 확인
    const currentPath = window.location.pathname;
    const protectedPages = ['/index.html', '/add.html', '/edit.html', '/filter.html', '/all.html', '/item.html'];
    const isProtectedPage = protectedPages.includes(currentPath);
    
    console.log('🔍 Current path:', currentPath);
    console.log('🔒 Is protected page:', isProtectedPage);
    
    if (isProtectedPage) {
        console.log('🔒 Protected page detected, checking login status...');
        const token = sessionStorage.getItem('userToken');
        console.log('🔑 Token check:', token ? 'EXISTS' : 'NOT_EXISTS');
        
        if (!token || (!token.startsWith('authenticated_') && !token.startsWith('google_auth_') && !token.startsWith('logged_in_'))) {
            console.log('❌ Not logged in on protected page, redirecting to landing');
            window.location.href = '/';
            return;
        } else {
            console.log('✅ User is logged in, allowing access to protected page');
        }
    }
    
    // 약간의 지연을 두고 링크를 찾음 (displayGlobalMenu가 실행된 후)
    setTimeout(() => {
        // closetDB 로고 링크
        const logoLink = document.getElementById('logo-link');
        if (logoLink) {
            console.log('✅ Found logo link, attaching event');
            logoLink.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🏠 Logo clicked!');
                checkLoginAndRedirect('/index.html');
            });
        }
        
        // View all 링크
        const viewAllLink = document.getElementById('view-all-link');
        if (viewAllLink) {
            console.log('✅ Found view all link, attaching event');
            viewAllLink.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('👀 View all clicked!');
                checkLoginAndRedirect('./all.html');
            });
        }
        
        // Filter 링크
        const filterLink = document.getElementById('filter-link');
        if (filterLink) {
            console.log('✅ Found filter link, attaching event');
            filterLink.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🔍 Filter clicked!');
                checkLoginAndRedirect('./filter.html');
            });
        }
        
        // Add new 링크
        const addNewLink = document.getElementById('add-new-link');
        if (addNewLink) {
            console.log('✅ Found Add new link, attaching event');
            addNewLink.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('➕ Add new clicked!');
                checkLoginAndRedirect('/add.html');
            });
        }
        
        console.log('🔧 All menu link event listeners set up');
    }, 100);
});

// 구글 로그인 시작 함수
function initiateGoogleLogin() {
    console.log('🔐 Starting Google OAuth login');
    
    // 현재 저장된 리다이렉트 URL 확인
    const savedRedirectUrl = sessionStorage.getItem('redirectAfterLogin');
    console.log('📋 Current saved redirect URL:', savedRedirectUrl);
    
    // 목표 URL이 없으면 기본값 설정
    if (!savedRedirectUrl) {
        console.log('📝 Setting default redirect URL to /add.html');
        sessionStorage.setItem('redirectAfterLogin', '/add.html');
    }
    
    // 구글 OAuth로 리다이렉트 (절대 경로 사용)
    console.log('🚀 Redirecting to Google OAuth');
    window.location.href = '/auth/google';
}

// 토큰 상태 디버깅 함수
function debugTokenStatus() {
    const token = sessionStorage.getItem('userToken');
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    console.log('=== TOKEN DEBUG ===');
    console.log('Token exists:', !!token);
    console.log('Token value:', token);
    console.log('Redirect URL:', redirectUrl);
    console.log('SessionStorage contents:', sessionStorage);
    console.log('==================');
}

// 로그인 체크 및 리다이렉트 함수
function checkLoginAndRedirect(targetUrl) {
    debugTokenStatus();
    
    // 세션에서 토큰 확인
    const token = sessionStorage.getItem('userToken');
    
    console.log('🔍 Checking login status for URL:', targetUrl);
    console.log('🔑 Token found:', token ? 'YES' : 'NO');
    console.log('🔑 Token value:', token);
    
    if (token && token.trim() !== '') {
        console.log('✅ Token exists, checking validity...');
        
        // 토큰이 유효한지 간단히 확인 (더미 토큰 형식 체크)
        if (token.startsWith('authenticated_') || token.startsWith('google_auth_') || token.startsWith('logged_in_')) {
            console.log('✅ Token format valid, redirecting to:', targetUrl);
            window.location.href = targetUrl;
        } else {
            console.log('❌ Invalid token format, clearing and redirecting to login');
            sessionStorage.removeItem('userToken');
            sessionStorage.setItem('redirectAfterLogin', targetUrl);
            window.location.href = '/login.html';
        }
    } else {
        // 토큰이 없으면 목표 URL을 저장하고 로그인 페이지로 이동
        console.log('❌ No token found, saving target URL and redirecting to login');
        sessionStorage.setItem('redirectAfterLogin', targetUrl);
        window.location.href = '/login.html';
    }
}

function displayRecentlyAdded() {
    var grid = document.querySelector(".grid_container"); 
    
    // Supabase에서 새로 추가된 아이템들 먼저 가져오기 (위쪽에 배치)
    fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            if (data.items && data.items.length > 0) {
                // 최대 8개까지만 표시
                const maxItems = Math.min(data.items.length, 8);
                
                for (let index = 0; index < maxItems; index++) {
                    const item = data.items[index];
                    const gridItem = document.createElement('div');
                    gridItem.className = 'grid_item clickable';
                    
                    const img = document.createElement('img');
                    img.loading = 'lazy'; // 브라우저 네이티브 lazy loading
                    
                    // 썸네일이 있으면 썸네일 사용, 없으면 원본 이미지, 그것도 없으면 기본 이미지
                    if (item.thumbnail_url) {
                        img.src = item.thumbnail_url;
                        console.log('Loading thumbnail:', item.thumbnail_url); // 디버깅용
                    } else if (item.images && item.images.length > 0) {
                        img.src = item.images[0];
                        console.log('Loading original image:', item.images[0]); // 디버깅용
                    } else {
                        // 기본 이미지
                        img.src = "/static/src/img/plus.png";
                        img.style.opacity = "0.3";
                        console.log('No images found for item:', item); // 디버깅용
                    }
                    
                    img.onerror = function() {
                        // 이미지 로드 실패시 기본 이미지
                        console.log('Image load failed:', this.src); // 디버깅용
                        this.src = "/static/src/img/plus.png";
                        this.style.opacity = "0.3";
                    };
                    
                    gridItem.appendChild(img);
                    
                    gridItem.addEventListener('click', function() {
                        location.href = './item.html?id=supabase_' + item.item_id;
                    });
                    
                    grid.appendChild(gridItem);
                }
                
                // Supabase 데이터가 8개보다 적으면 더미 데이터로 채우기
                const remainingSlots = 8 - maxItems;
                for (let i = 0; i < remainingSlots; i++) {
                    const item = document.createElement('div');
                    item.className = 'grid_item clickable';
                    
                    const img = document.createElement('img');
                    img.src = "/static/src/db/" + i + ".jpg";
                    item.appendChild(img);
                    
                    item.addEventListener('click', function() {
                        location.href = './item.html?id=' + i;
                    });
                    
                    grid.appendChild(item);
                }
            }
        })
        .catch(error => {
            console.error('Error loading items from Supabase:', error);
            
            // 에러 발생시 더미 데이터만 표시
            var numberOfItems = 8;
            for (let i = 0; i < numberOfItems; i++) {
                const item = document.createElement('div');
                item.className = 'grid_item clickable';
                
                const img = document.createElement('img');
                img.src = "/static/src/db/" + i + ".jpg";
                item.appendChild(img);
                
                item.addEventListener('click', function() {
                    location.href = './item.html?id=' + i;
                });
                
                grid.appendChild(item);
            }
        });
}

// all.html에서 사용할 모든 아이템 표시 함수
function displayAllItems() {
    var grid = document.querySelector(".grid_container"); 
    
    // Supabase에서 모든 아이템 가져오기
    fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            if (data.items && data.items.length > 0) {
                // 모든 아이템 표시 (제한 없음)
                data.items.forEach((item, index) => {
                    const gridItem = document.createElement('div');
                    gridItem.className = 'grid_item clickable';
                    
                    const img = document.createElement('img');
                    img.loading = 'lazy'; // 브라우저 네이티브 lazy loading
                    
                    // 썸네일이 있으면 썸네일 사용, 없으면 원본 이미지, 그것도 없으면 기본 이미지
                    if (item.thumbnail_url) {
                        img.src = item.thumbnail_url;
                        console.log('Loading thumbnail:', item.thumbnail_url); // 디버깅용
                    } else if (item.images && item.images.length > 0) {
                        img.src = item.images[0];
                        console.log('Loading original image:', item.images[0]); // 디버깅용
                    } else {
                        // 기본 이미지
                        img.src = "/static/src/img/plus.png";
                        img.style.opacity = "0.3";
                        console.log('No images found for item:', item); // 디버깅용
                    }
                    
                    img.onerror = function() {
                        // 이미지 로드 실패시 기본 이미지
                        console.log('Image load failed:', this.src); // 디버깅용
                        this.src = "/static/src/img/plus.png";
                        this.style.opacity = "0.3";
                    };
                    
                    gridItem.appendChild(img);
                    
                    gridItem.addEventListener('click', function() {
                        location.href = './item.html?id=supabase_' + item.item_id;
                    });
                    
                    grid.appendChild(gridItem);
                });
            }
        })
        .catch(error => {
            console.error('Error loading all items from Supabase:', error);
            var numberOfItems = 8;
            for (let i = 0; i < numberOfItems; i++) {
                const item = document.createElement('div');
                item.className = 'grid_item';
                item.className += ' clickable';
                
                const img = document.createElement('img');
                img.src = "/static/src/db/" + i + ".jpg";
                item.appendChild(img);
                
                item.addEventListener('click', function() {
                    location.href = './item.html?id=' + i;
                });
                
                grid.appendChild(item);
            }
        });
}


/* add */

window.onload = function() {
    // 새로운 이미지 모드 토글 설정
    setupImageModeToggle();
}

// 이미지 모드 토글 설정
function setupImageModeToggle() {
    const modeToggle = document.getElementById('image_mode_switch');
    const stitchedMode = document.getElementById('stitched_mode');
    const individualMode = document.getElementById('individual_mode');
    
    if (!modeToggle || !stitchedMode || !individualMode) return;
    
    // 토글 스위치 변경 이벤트
    modeToggle.addEventListener('change', function() {
        if (this.checked) {
            // Checked = Stitched Image mode
            stitchedMode.style.display = 'block';
            individualMode.style.display = 'none';
            
            // 기존 stitched 이미지가 있으면 + 버튼 숨기기
            const existingStitchedImage = stitchedMode.querySelector('.stitched_preview.existing_image');
            const stitchedAddButton = stitchedMode.querySelector('.add_image');
            if (existingStitchedImage && stitchedAddButton) {
                stitchedAddButton.style.display = 'none';
                console.log('🖼️ Hiding stitched add button - existing stitched image present');
            } else if (stitchedAddButton) {
                stitchedAddButton.style.display = 'block';
                console.log('➕ Showing stitched add button - no existing stitched image');
            }
        } else {
            // Unchecked = Individual Images mode
            stitchedMode.style.display = 'none';
            individualMode.style.display = 'block';
            
            // Individual 모드에서는 + 버튼을 항상 표시 (추가 이미지 업로드 가능)
            const individualAddButton = individualMode.querySelector('.add_image');
            if (individualAddButton) {
                individualAddButton.style.display = 'block';
                console.log('➕ Individual add button always visible - additional images can be uploaded');
            }
        }
    });
    
    // 섹션 수 변경 시 미리보기 업데이트
    const sectionRadios = document.querySelectorAll('input[name="section_count"]');
    sectionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const sectionInfo = document.querySelector('.section_info');
            if (sectionInfo) {
                sectionInfo.textContent = `${this.value} sections`;
            }
        });
    });
}


// Stitched 이미지 읽기
function readStitchedImage() {
    console.log('🖼️ readStitchedImage function called');
    const file = document.querySelector('.file_uploader_stitched').files[0];
    console.log('📁 Selected file:', file);
    if (!file) {
        console.log('❌ No file selected');
        return;
    }
    
    const container = document.querySelector('#stitched_mode');
    console.log('📦 Container found:', !!container);
    
    // 기존 미리보기 제거
    const existingPreview = container.querySelector('.stitched_preview');
    console.log('🔍 Existing preview found:', !!existingPreview);
    if (existingPreview) {
        existingPreview.remove();
        console.log('🗑️ Removed existing preview');
    }
    
    // + 버튼 숨기기
    const addButton = container.querySelector('.add_image');
    console.log('➕ Add button found:', !!addButton);
    if (addButton) {
        addButton.style.display = 'none';
        console.log('🙈 Add button hidden');
    }
    
    // 새로운 stitched 전용 미리보기 생성
    const preview = document.createElement('div');
    preview.className = 'stitched_preview';
    console.log('🆕 Created preview element');
    
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    console.log('🖼️ Created image with URL:', img.src);
    
    // 섹션 개수 정보 표시
    const sectionInfo = document.createElement('div');
    sectionInfo.className = 'section_info';
    const sectionCountElement = document.querySelector('input[name="section_count"]:checked');
    console.log('🔢 Section count element found:', !!sectionCountElement);
    const sectionCount = sectionCountElement ? sectionCountElement.value : '2';
    sectionInfo.textContent = `${sectionCount} sections`;
    console.log('🔢 Section count:', sectionCount);
    
    preview.appendChild(img);
    preview.appendChild(sectionInfo);
    console.log('📋 Appended image and section info to preview');
    
    // + 버튼이 있던 위치에 삽입
    if (addButton && addButton.parentNode) {
        addButton.parentNode.insertBefore(preview, addButton);
        console.log('✅ Preview inserted into DOM');
    } else {
        console.log('❌ Could not insert preview - add button or parent not found');
        container.appendChild(preview);
        console.log('📌 Appended preview to container instead');
    }
    
    // 클릭시 제거하고 + 버튼 다시 표시
    preview.addEventListener('click', () => {
        console.log('🖱️ Preview clicked - removing');
        preview.remove();
        if (addButton) {
            addButton.style.display = 'block';
            console.log('👁️ Add button shown again');
        }
        const fileInput = document.querySelector('.file_uploader_stitched');
        if (fileInput) {
            fileInput.value = '';
            console.log('🗑️ File input cleared');
        }
    });
}

// Individual 이미지 전역 변수
let individualImages = [];
let mainImageIndex = 0;

// 랜딩 페이지 캐러셀 초기화 함수
function initLandingCarousel() {
    console.log('🎠 Initializing landing page carousel...');
    
    fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            if (data.items && data.items.length > 0) {
                // 랜덤하게 아이템들을 섞기
                const shuffledItems = [...data.items].sort(() => 0.5 - Math.random());
                
                // 최대 8개 아이템만 사용 (무한 스크롤을 위해 복제할 예정)
                const maxItems = Math.min(8, shuffledItems.length);
                const selectedItems = shuffledItems.slice(0, maxItems);
                
                // 캐러셀 트랙 가져오기
                const carouselTrack = document.getElementById('carousel-track');
                if (!carouselTrack) {
                    console.error('Carousel track not found');
                    return;
                }
                
                // 기존 내용 제거
                carouselTrack.innerHTML = '';
                
                // 무한 스크롤을 위해 아이템들을 두 번 추가
                for (let round = 0; round < 2; round++) {
                    selectedItems.forEach((item, index) => {
                        const carouselItem = document.createElement('div');
                        carouselItem.className = 'carousel-item';
                        
                        const img = document.createElement('img');
                        img.loading = 'eager'; // 캐러셀은 즉시 로드
                        img.decoding = 'async'; // 비동기 디코딩
                        
                        // 썸네일 우선 사용 (성능 최적화)
                        if (item.thumbnail_url) {
                            img.src = item.thumbnail_url;
                        } else if (item.images && item.images.length > 0) {
                            img.src = item.images[0];
                        } else {
                            img.src = "/static/src/img/plus.png";
                            img.style.opacity = "0.3";
                        }
                        
                        // 이미지 로드 완료 시 부드러운 표시
                        img.onload = function() {
                            this.style.opacity = "1";
                            this.style.transition = "opacity 0.3s ease";
                        };
                        
                        img.onerror = function() {
                            this.src = "/static/src/img/plus.png";
                            this.style.opacity = "0.3";
                        };
                        
                        carouselItem.appendChild(img);
                        
                        // 캐러셀 아이템은 클릭 불가 (장식용)
                        
                        carouselTrack.appendChild(carouselItem);
                    });
                }
                
                console.log(`✅ Carousel initialized with ${selectedItems.length} items (duplicated for infinite scroll)`);
            } else {
                console.log('⚠️ No items found for carousel');
                showFallbackCarousel();
            }
        })
        .catch(error => {
            console.error('❌ Error loading carousel items:', error);
            showFallbackCarousel();
        });
}

// 대체 캐러셀 (데이터 로딩 실패시)
function showFallbackCarousel() {
    const carouselTrack = document.getElementById('carousel-track');
    if (!carouselTrack) return;
    
    carouselTrack.innerHTML = '';
    
    // 플레이스홀더 아이템들 생성
    for (let round = 0; round < 2; round++) {
        for (let i = 0; i < 4; i++) {
            const carouselItem = document.createElement('div');
            carouselItem.className = 'carousel-item';
            
            const img = document.createElement('img');
            img.src = "/static/src/img/plus.png";
            img.style.opacity = "0.3";
            
            carouselItem.appendChild(img);
            carouselTrack.appendChild(carouselItem);
        }
    }
    
    console.log('📦 Fallback carousel created');
}

// Edit 페이지로 이동하는 함수
function editItem() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    
    if (itemId) {
        window.location.href = `/edit.html?id=${itemId}`;
    } else {
        alert('아이템 ID를 찾을 수 없습니다.');
    }
}

// Edit 페이지 초기화 함수
function initEditPage() {
    console.log('🔧 Initializing edit page...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    
    if (!itemId) {
        alert('편집할 아이템 ID가 없습니다.');
        window.location.href = '/all.html';
        return;
    }
    
    // 아이템 데이터 로드
    fetch(`/api/items/${itemId}`)
        .then(response => response.json())
        .then(data => {
            if (data.item) {
                populateEditForm(data.item);
            } else {
                alert('아이템을 찾을 수 없습니다.');
                window.location.href = '/all.html';
            }
        })
        .catch(error => {
            console.error('Error loading item for edit:', error);
            alert('아이템 로딩 중 오류가 발생했습니다.');
        });
}

// 편집 폼에 기존 데이터 채우기
function populateEditForm(item) {
    console.log('📝 Populating edit form with item data:', item);
    
    // 삭제된 이미지 배열 초기화
    window.deletedImageUrls = [];
    
    // 브랜드 입력
    const brandInput = document.getElementById('brand_search');
    if (brandInput && item.brand) {
        brandInput.value = item.brand;
    }
    
    // 카테고리 선택
    if (item.category) {
        setTimeout(() => {
            const categoryRadio = document.querySelector(`input[name="category_input"][value="${item.category}"]`);
            if (categoryRadio) {
                categoryRadio.checked = true;
                categoryRadio.dispatchEvent(new Event('change'));
                // Edit 페이지에서는 click 이벤트도 dispatch하여 measurement 필드 생성
                categoryRadio.dispatchEvent(new Event('click'));
                
                // 서브카테고리 필드 명시적으로 생성
                console.log('🔧 Generating subcategory fields for:', item.category);
                
                // 카테고리에 따라 서브카테고리 영역 표시 여부 결정
                const subCategoryElement = document.querySelector('.sub_category');
                if (subCategoryElement) {
                    const hasSubcategories = ["dress", "top", "outer", "skirt", "pants", "etc.", "etc"].includes(item.category);
                    if (hasSubcategories) {
                        subCategoryElement.classList.add('show_sub');
                        console.log('✅ Subcategory area shown for category:', item.category);
                        
                        // 서브카테고리 필드 생성
                        displayFilterSubCategory(item.category);
                        console.log('✅ Subcategory fields generated');
                    } else {
                        subCategoryElement.classList.remove('show_sub');
                        console.log('ℹ️ No subcategories for category:', item.category);
                    }
                }
            }
        }, 100);
    }
    
    // 서브카테고리 선택 (카테고리 설정 후 충분한 시간 뒤에)
    if (item.subcategory) {
        setTimeout(() => {
            console.log('🔍 Looking for subcategory:', item.subcategory);
            
            // 서브카테고리 영역이 표시되어 있는지 확인
            const subCategoryElement = document.querySelector('.sub_category');
            const isSubcategoryVisible = subCategoryElement && subCategoryElement.classList.contains('show_sub');
            console.log('🔍 Subcategory area visible:', isSubcategoryVisible);
            
            if (isSubcategoryVisible) {
                const subcategoryRadio = document.querySelector(`input[name="sub_category_input"][value="${item.subcategory}"]`);
                console.log('🔍 Found subcategory radio:', !!subcategoryRadio);
                if (subcategoryRadio) {
                    subcategoryRadio.checked = true;
                    console.log('✅ Subcategory set:', item.subcategory);
                } else {
                    console.log('❌ Subcategory radio not found for:', item.subcategory);
                    // 모든 서브카테고리 라디오 버튼 확인
                    const allSubcategoryRadios = document.querySelectorAll('input[name="sub_category_input"]');
                    console.log('🔍 Available subcategory options:', Array.from(allSubcategoryRadios).map(r => r.value));
                }
            } else {
                console.log('⚠️ Subcategory area not visible, skipping subcategory selection');
            }
        }, 500); // 더 많은 시간 여유로 변경
    }
    
    // 서브카테고리2 선택 (dress 카테고리의 경우)
    if (item.subcategory2) {
        setTimeout(() => {
            console.log('🔍 Looking for subcategory2:', item.subcategory2);
            const subcategory2Radio = document.querySelector(`input[name="sub_category_input_2"][value="${item.subcategory2}"]`);
            console.log('🔍 Found subcategory2 radio:', !!subcategory2Radio);
            if (subcategory2Radio) {
                subcategory2Radio.checked = true;
                console.log('✅ Subcategory2 set:', item.subcategory2);
            } else {
                console.log('❌ Subcategory2 radio not found for:', item.subcategory2);
            }
        }, 450); // 서브카테고리 설정 후 약간의 여유 시간
    }
    
    // 사이즈 정보 설정
    if (item.size_region && item.size) {
        setTimeout(() => {
            // 사이즈 지역 선택
            const sizeRegionButton = document.querySelector('.size_region_selected');
            if (sizeRegionButton) {
                sizeRegionButton.textContent = item.size_region;
                selectedSizeRegion(item.size_region);
                displaySizesByRegion(item.size_region);
                
                // 사이즈 선택
                setTimeout(() => {
                    if (item.size_region === 'etc') {
                        const etcInput = document.getElementById('size_etc_input');
                        if (etcInput) {
                            etcInput.value = item.size;
                            etcInput.style.display = 'inline-block';
                        }
                    } else {
                        const sizeRadio = document.querySelector(`input[name="size_key"][value="${item.size}"]`);
                        if (sizeRadio) {
                            sizeRadio.checked = true;
                        }
                    }
                }, 300);
            }
        }, 100);
    }
    
    // 측정 데이터 입력
    if (item.measurements) {
        let measurements = item.measurements;
        if (typeof measurements === 'string') {
            try {
                measurements = JSON.parse(measurements);
            } catch (e) {
                console.error('Error parsing measurements:', e);
            }
        }
        
        setTimeout(() => {
            const measurementInputs = document.querySelectorAll('.measurement_input');
            measurementInputs.forEach(input => {
                const label = input.parentElement.querySelector('.part');
                if (label && measurements[label.textContent]) {
                    input.value = measurements[label.textContent];
                }
            });
        }, 500);
    }
    
    // 소재 정보 입력
    if (item.compositions) {
        console.log('🧪 Populating compositions:', item.compositions);
        let compositions = item.compositions;
        if (typeof compositions === 'string') {
            try {
                compositions = JSON.parse(compositions);
                console.log('🧪 Parsed compositions from string:', compositions);
            } catch (e) {
                console.error('Error parsing compositions:', e);
            }
        }
        
        setTimeout(() => {
            const compositionInputs = document.querySelectorAll('.composition_input');
            console.log('🧪 Found composition inputs for population:', compositionInputs.length);
            
            if (Array.isArray(compositions)) {
                console.log('🧪 Populating array-type compositions:', compositions);
                // 배열 형태 (순서대로)
                compositions.forEach((material, index) => {
                    console.log(`🧪 Processing array item ${index}: ${material}`);
                    // 해당 material의 input 찾기
                    compositionInputs.forEach(input => {
                        const label = input.parentElement.querySelector('.part');
                        if (label && label.textContent.trim() === material) {
                            input.value = String.fromCharCode(97 + index); // a, b, c...
                            console.log(`✅ Set ${material} to ${input.value}`);
                        }
                    });
                });
            } else if (typeof compositions === 'object' && compositions !== null) {
                console.log('🧪 Populating object-type compositions:', compositions);
                // 객체 형태 (퍼센테이지)
                compositionInputs.forEach(input => {
                    const label = input.parentElement.querySelector('.part');
                    if (label) {
                        const material = label.textContent.trim();
                        if (compositions[material]) {
                            input.value = compositions[material];
                            console.log(`✅ Set ${material} to ${compositions[material]}%`);
                        }
                    }
                });
            } else {
                console.log('❌ Invalid compositions format:', typeof compositions, compositions);
            }
        }, 400); // 약간 더 긴 지연
    } else {
        console.log('ℹ️ No compositions data in item');
    }
    
    // 시즌 정보
    if (item.year) {
        const yearInput = document.querySelectorAll('.season_input')[0];
        if (yearInput) yearInput.value = item.year;
    }
    
    if (item.season && item.season !== 'N/A') {
        const seasonButton = document.querySelector('.season_selected');
        if (seasonButton) {
            seasonButton.textContent = item.season;
        }
    }
    
    if (item.purchase_year) {
        const purchaseYearInput = document.querySelectorAll('.season_input')[1];
        if (purchaseYearInput) purchaseYearInput.value = item.purchase_year;
    }
    
    // 기존 이미지 표시 (미리보기로)
    if (item.images && item.images.length > 0) {
        displayExistingImages(item.images);
    }
}

// 기존 이미지 미리보기 표시
function displayExistingImages(images) {
    const stitchedMode = document.getElementById('stitched_mode');
    const individualMode = document.getElementById('individual_mode');
    
    if (isStitchedImage(images)) {
        // Stitched 모드로 표시 (toggle switch를 stitched로 설정)
        const imageModeToggle = document.getElementById('image_mode_switch');
        if (imageModeToggle) imageModeToggle.checked = true;
        stitchedMode.style.display = 'block';
        individualMode.style.display = 'none';
        
        const addImage = stitchedMode.querySelector('.add_image');
        const preview = document.createElement('div');
        preview.className = 'stitched_preview existing_image';
        preview.setAttribute('data-image-urls', JSON.stringify(images));
        preview.innerHTML = `
            <img src="${images[0]}" alt="Stitched image preview">
            <div class="section_info">Stitched Image (${images.length} sections) - Click to remove</div>
        `;
        
        // + 업로드 버튼 숨기기 (기존 이미지가 있으므로)
        addImage.style.display = 'none';
        console.log('🖼️ Hiding add image button - existing stitched image displayed');
        
        // 클릭 이벤트 추가: stitched 이미지 삭제 기능
        preview.addEventListener('click', () => {
            // 모든 섹션 이미지 제거
            const imageUrls = JSON.parse(preview.getAttribute('data-image-urls'));
            
            // 삭제된 이미지들을 전역 배열에 추가
            if (!window.deletedImageUrls) window.deletedImageUrls = [];
            window.deletedImageUrls.push(...imageUrls);
            
            // 원본 images 배열에서 모든 이미지 제거
            imageUrls.forEach(url => {
                const imageIndex = images.indexOf(url);
                if (imageIndex > -1) {
                    images.splice(imageIndex, 1);
                }
            });
            
            // + 업로드 버튼 다시 표시 (이미지 삭제 후)
            addImage.style.display = 'block';
            console.log('➕ Showing add image button - stitched image removed');
            
            preview.remove();
            console.log('🗑️ Existing stitched images removed:', imageUrls);
        });
        
        addImage.before(preview);
    } else {
        // Individual 모드로 표시 (toggle switch unchecked)
        const imageModeToggle = document.getElementById('image_mode_switch');
        if (imageModeToggle) imageModeToggle.checked = false;
        stitchedMode.style.display = 'none';
        individualMode.style.display = 'block';
        
        const addImage = individualMode.querySelector('.add_image');
        
        // Individual 모드에서는 기존 이미지가 있어도 + 버튼을 유지 (추가 이미지 업로드 가능)
        console.log('🖼️ Keeping add image button visible - additional individual images can be uploaded');
        
        images.forEach((imageUrl, index) => {
            const preview = document.createElement('div');
            preview.className = 'preview_image existing_image';
            preview.setAttribute('data-image-url', imageUrl);
            if (index === 0) preview.classList.add('main_image');
            
            const img = document.createElement('img');
            img.src = imageUrl;
            
            const badge = document.createElement('div');
            badge.className = 'main_image_badge';
            badge.textContent = 'MAIN';
            badge.style.display = index === 0 ? 'block' : 'none';
            
            preview.appendChild(img);
            preview.appendChild(badge);
            
            // 클릭 이벤트 추가: 기존 이미지 삭제 기능
            preview.addEventListener('click', () => {
                if (preview.classList.contains('main_image') && images.length > 1) {
                    // 메인 이미지가 여러 개 중 하나라면 삭제 후 다른 이미지를 메인으로 설정
                    const container = preview.parentElement;
                    const allPreviews = container.querySelectorAll('.preview_image');
                    
                    // 다음 이미지를 메인으로 설정
                    let nextMain = null;
                    for (let i = 0; i < allPreviews.length; i++) {
                        if (allPreviews[i] !== preview) {
                            nextMain = allPreviews[i];
                            break;
                        }
                    }
                    
                    if (nextMain) {
                        nextMain.classList.add('main_image');
                        const nextBadge = nextMain.querySelector('.main_image_badge');
                        if (nextBadge) nextBadge.style.display = 'block';
                    }
                }
                
                // 기존 이미지 제거
                const removedUrl = preview.getAttribute('data-image-url');
                const imageIndex = images.indexOf(removedUrl);
                if (imageIndex > -1) {
                    images.splice(imageIndex, 1);
                }
                
                // 삭제된 이미지를 전역 배열에 추가
                if (!window.deletedImageUrls) window.deletedImageUrls = [];
                window.deletedImageUrls.push(removedUrl);
                
                preview.remove();
                console.log('🗑️ Existing image removed:', removedUrl);
                
                // 만약 모든 이미지가 제거되었다면 토글을 기본값으로 되돌리기 (+ 버튼은 항상 표시됨)
                if (images.length === 0 && !window.individualFiles?.length) {
                    const imageModeToggle = document.getElementById('image_mode_switch');
                    if (imageModeToggle) imageModeToggle.checked = true;
                    stitchedMode.style.display = 'block';
                    individualMode.style.display = 'none';
                }
            });
            
            addImage.before(preview);
        });
    }
}

// 편집 폼 제출 함수
function submitEditForm(event) {
    event.preventDefault();
    
    console.log('🔄 Edit form submission started');
    
    const urlParams = new URLSearchParams(window.location.search);
    let itemId = urlParams.get('id');
    
    if (!itemId) {
        alert('아이템 ID를 찾을 수 없습니다.');
        return;
    }
    
    // supabase_ 접두사 제거 (실제 DB에는 숫자만 저장됨)
    if (itemId.startsWith('supabase_')) {
        itemId = itemId.replace('supabase_', '');
        console.log('🔄 Removed supabase_ prefix, actual item_id:', itemId);
    }
    
    console.log('📝 Collecting edit form data...');
    
    // 기존 submitForm 로직을 재사용하되, 업데이트용으로 수정
    const formData = collectEditFormData();
    
    if (!formData) {
        return; // 유효성 검사 실패
    }
    
    // 아이템 ID 추가
    formData.append('item_id', itemId);
    
    // FormData 내용 디버깅
    console.log('🔍 Final FormData contents:');
    for (let [key, value] of formData.entries()) {
        console.log(`   ${key}: ${value}`);
    }
    
    // 서버로 업데이트 요청
    fetch('/update_item', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Update success:', data);
        alert('아이템이 성공적으로 업데이트되었습니다!');
        // 아이템 상세 페이지로 돌아가기 (supabase_ 접두사 추가)
        const redirectId = itemId.toString().startsWith('supabase_') ? itemId : `supabase_${itemId}`;
        console.log('🔄 Redirecting to item page with ID:', redirectId);
        window.location.href = `/item.html?id=${redirectId}`;
    })
    .catch(error => {
        console.error('Update error:', error);
        alert('업데이트 중 오류가 발생했습니다: ' + error.message);
    });
}

// 삭제된 이미지를 추적하기 위한 전역 변수
window.deletedImageUrls = window.deletedImageUrls || [];

// 편집 폼 데이터 수집 (submitForm과 유사하지만 이미지는 선택사항)
function collectEditFormData() {
    console.log('🔍 Starting collectEditFormData for edit mode');
    const formData = new FormData();
    
    // 이미지 모드 확인 (새 이미지가 있는 경우에만 추가)
    const imageModeToggle = document.getElementById('image_mode_switch');
    const mode = imageModeToggle && imageModeToggle.checked ? 'stitched' : 'individual';
    
    console.log('📸 Image mode:', mode);
    
    let hasNewImages = false;
    
    if (mode === 'stitched') {
        const stitchedFile = document.querySelector('.file_uploader_stitched').files[0];
        if (stitchedFile) {
            formData.append('stitched_image', stitchedFile);
            const sectionCount = document.querySelector('input[name="section_count"]:checked').value;
            formData.append('section_count', sectionCount);
            formData.append('image_mode', mode);
            hasNewImages = true;
        }
    } else {
        if (window.individualFiles && window.individualFiles.length > 0) {
            for (let i = 0; i < window.individualFiles.length; i++) {
                formData.append('individual_images', window.individualFiles[i]);
            }
            formData.append('main_image_index', mainImageIndex || 0);
            formData.append('image_mode', mode);
            hasNewImages = true;
        } else {
            const individualFiles = document.querySelector('.file_uploader').files;
            if (individualFiles.length > 0) {
                for (let i = 0; i < individualFiles.length; i++) {
                    formData.append('individual_images', individualFiles[i]);
                }
                formData.append('main_image_index', mainImageIndex || 0);
                formData.append('image_mode', mode);
                hasNewImages = true;
            }
        }
    }
    
    // 기본 데이터 수집 (submitForm과 동일한 로직 사용)
    const categoryInput = document.querySelector('input[name="category_input"]:checked');
    const category = categoryInput ? categoryInput.value : '';
    
    const subcategoryInput = document.querySelector('input[name="sub_category_input"]:checked');
    const subcategory = subcategoryInput ? subcategoryInput.value : '';
    
    const subcategory2Input = document.querySelector('input[name="sub_category_input_2"]:checked');
    const subcategory2 = subcategory2Input ? subcategory2Input.value : '';
    
    const brand = document.getElementById('brand_search') ? document.getElementById('brand_search').value : '';
    
    // 사이즈 데이터
    const sizeRegionElement = document.querySelector('.size_region_selected');
    let sizeRegion = sizeRegionElement ? sizeRegionElement.textContent.trim() : '';
    if (sizeRegion === 'Select') sizeRegion = '';
    
    let size = '';
    let sizeEtc = '';
    
    if (sizeRegion === 'etc') {
        const sizeEtcInput = document.getElementById('size_etc_input');
        sizeEtc = sizeEtcInput ? sizeEtcInput.value.trim() : '';
        size = sizeEtc;
    } else {
        const sizeInput = document.querySelector('input[name="size_key"]:checked');
        size = sizeInput ? sizeInput.value : '';
    }
    
    // 측정 데이터
    const measurements = {};
    const measurementInputs = document.querySelectorAll('.measurement_input');
    measurementInputs.forEach((input, index) => {
        if (input.value) {
            const label = input.parentElement.querySelector('.part');
            if (label) {
                measurements[label.textContent] = input.value;
            }
        }
    });
    
    // Composition 데이터 수집 (다중 세트 모드 지원)
    console.log('🧪 Collecting composition data for edit mode');
    let compositions;
    
    if (window.usingMultiSets && window.compositionSets && window.compositionSets.length > 0) {
        console.log('🧪 Using multi-set mode for data collection');
        // 다중 세트 구조로 수집
        const validSets = window.compositionSets.filter(set => 
            set.compositions && Object.keys(set.compositions).length > 0
        );
        
        if (validSets.length > 0) {
            compositions = {};
            validSets.forEach(set => {
                const setName = set.name && set.name.trim() !== '' ? set.name : '';
                compositions[setName] = set.compositions;
            });
            console.log('🧪 Final compositions (multi-set mode):', compositions);
        } else {
            compositions = {};
        }
    } else {
        console.log('🧪 Using single-set mode for data collection');
        // 기존 방식 (단일 세트)
        const compositionInputs = document.querySelectorAll('.composition_input');
        const compositionEntries = [];
        const compositionPercentages = {};
        
        compositionInputs.forEach((input, index) => {
            if (input.value && input.value.trim()) {
                const label = input.parentElement.querySelector('.part');
                if (label) {
                    const value = input.value.trim().toLowerCase();
                    const material = label.textContent.trim();
                    
                    if (/^[a-z]$/.test(value)) {
                        compositionEntries.push({
                            material: material,
                            order: value
                        });
                    } else {
                        const percentage = parseInt(value);
                        if (!isNaN(percentage) && percentage >= 1 && percentage <= 100) {
                            compositionPercentages[material] = percentage;
                        }
                    }
                }
            }
        });
        
        if (compositionEntries.length > 0) {
            compositionEntries.sort((a, b) => a.order.localeCompare(b.order));
            compositions = compositionEntries.map(entry => entry.material);
        } else {
            compositions = compositionPercentages;
        }
    }
    
    // 시즌 데이터
    const seasonInputs = document.querySelectorAll('.season_input');
    const year = seasonInputs[0] ? seasonInputs[0].value : '';
    const season = document.querySelector('.season_selected') ? document.querySelector('.season_selected').textContent : '';
    const purchaseYear = seasonInputs[1] ? seasonInputs[1].value : '';
    
    // 필수 데이터 유효성 검사 (이미지는 선택사항)
    console.log('✅ Validating form data for edit mode (images optional)');
    console.log('📊 Form data:', { category, brand, sizeRegion, size, compositions, hasNewImages });
    
    const missingFields = [];
    
    if (!category) missingFields.push('카테고리');
    
    // 브랜드/사이즈/소재 중 하나는 반드시 있어야 함
    const hasBrand = brand && brand.trim() !== '';
    const hasSize = (sizeRegion && sizeRegion !== 'Select') && (size && size.trim() !== '');
    const hasComposition = window.usingMultiSets 
        ? (typeof compositions === 'object' && compositions !== null && Object.keys(compositions).length > 0 && Object.values(compositions).some(set => Object.keys(set).length > 0))
        : ((Array.isArray(compositions) && compositions.length > 0) || (typeof compositions === 'object' && compositions !== null && Object.keys(compositions).length > 0));
    console.log('🧪 Composition validation:', { hasComposition, compositions, usingMultiSets: window.usingMultiSets });
    
    if (!hasBrand && !hasSize && !hasComposition) {
        missingFields.push('브랜드, 사이즈, 소재 중 최소 하나');
    }
    
    console.log('🔍 Missing fields check:', missingFields);
    
    if (missingFields.length > 0) {
        console.log('❌ Validation failed, missing fields:', missingFields);
        alert(`❌ 다음 필수 항목을 입력해주세요:\n${missingFields.join(', ')}`);
        return null;
    }
    
    console.log('✅ Edit form validation passed (no image requirement)');
    
    // FormData에 추가
    if (category) formData.append('category', category);
    if (subcategory) formData.append('subcategory', subcategory);
    if (subcategory2) formData.append('subcategory2', subcategory2);
    if (brand) formData.append('brand', brand);
    if (sizeRegion && sizeRegion !== 'Select') formData.append('sizeRegion', sizeRegion);
    if (size && size.trim() !== '') formData.append('size', size);
    if (sizeEtc && sizeEtc.trim() !== '') formData.append('sizeEtc', sizeEtc);
    if (Object.keys(measurements).length > 0) formData.append('measurements', JSON.stringify(measurements));
    // Composition 데이터 추가 (배열이거나 객체일 수 있음)
    console.log('🧪 Final composition data check:', { 
        compositions, 
        type: typeof compositions, 
        isArray: Array.isArray(compositions),
        length: Array.isArray(compositions) ? compositions.length : Object.keys(compositions || {}).length,
        stringified: JSON.stringify(compositions)
    });
    
    const hasCompositionData = window.usingMultiSets 
        ? (typeof compositions === 'object' && compositions !== null && Object.keys(compositions).length > 0 && Object.values(compositions).some(set => Object.keys(set).length > 0))
        : ((Array.isArray(compositions) && compositions.length > 0) || (typeof compositions === 'object' && compositions !== null && Object.keys(compositions).length > 0));
    console.log('🧪 Has composition data:', hasCompositionData);
    
    if (hasCompositionData) {
        const compositionJson = JSON.stringify(compositions);
        console.log('✅ Adding composition data to FormData:', compositionJson);
        formData.append('compositions', compositionJson);
        
        // FormData에 실제로 추가되었는지 확인
        console.log('🔍 FormData compositions value:', formData.get('compositions'));
    } else {
        console.log('❌ No composition data to add - compositions is empty or null');
        console.log('🔍 Compositions value details:', {
            isArray: Array.isArray(compositions),
            isObject: typeof compositions === 'object',
            isNull: compositions === null,
            isUndefined: compositions === undefined,
            keys: compositions ? Object.keys(compositions) : 'N/A'
        });
        
        // Edit 모드에서는 빈 composition이라도 일단 전송 (기존 데이터 삭제 목적일 수 있음)
        console.log('🔧 Adding empty compositions for edit mode');
        formData.append('compositions', JSON.stringify({}));
    }
    if (year) formData.append('year', year);
    if (season) formData.append('season', season);
    if (purchaseYear) formData.append('purchaseYear', purchaseYear);
    
    // 삭제된 이미지 정보 추가
    if (window.deletedImageUrls && window.deletedImageUrls.length > 0) {
        console.log('🗑️ Adding deleted images info to FormData:', window.deletedImageUrls);
        formData.append('deleted_images', JSON.stringify(window.deletedImageUrls));
    }
    
    return formData;
}

function readImages() {
    var files = document.querySelector('input[class="file_uploader"]').files;
    var container = document.querySelector("#individual_mode");
    
    // Individual 모드인지 확인
    const isIndividualMode = container && container.style.display !== 'none';
    
    if (isIndividualMode) {
        // Individual 모드: 대표 이미지 선택 기능 포함
        if (!window.individualFiles) {
            window.individualFiles = [];
        }
        // 기존 파일들에 새로운 파일들 추가
        window.individualFiles.push(...Array.from(files));
        mainImageIndex = 0; // 첫 번째가 기본 메인
        
        for (let i = 0; i < files.length; i++) {
            const preview = document.createElement('div');
            preview.className = "preview_image";
            if (i === 0) preview.classList.add('main_image');

            const currentImageUrl = URL.createObjectURL(files[i]);
            const img = document.createElement("img");
            img.src = currentImageUrl;
            
            // 메인 이미지 배지 추가
            const badge = document.createElement('div');
            badge.className = 'main_image_badge';
            badge.textContent = 'MAIN';
            badge.style.display = i === 0 ? 'block' : 'none';
            
            preview.appendChild(img);
            preview.appendChild(badge);
            
            // Individual mode에서는 해당 컨테이너 내의 add_image 앞에 추가
            const addImage = container.querySelector(".add_image");
            addImage.before(preview);
            
            // 클릭 이벤트: 대표 이미지 설정 또는 제거
            preview.addEventListener('click', () => {
                if (preview.classList.contains('main_image') && files.length > 1) {
                    // 메인 이미지가 아닌 다른 이미지를 메인으로 설정하기 위한 토글
                    return;
                } else {
                    // 대표 이미지로 설정
                    setMainImageFromPreview(preview, i);
                }
            });
        }
    } else {
        // 기존 일반 모드
        for (let i = 0; i < files.length; i++) {
            const preview = document.createElement('div');
            preview.className = "preview_image";

            const currentImageUrl = URL.createObjectURL(files[i]);
            const img = document.createElement("img");
            img.src = currentImageUrl;
            
            preview.appendChild(img);
            if (document.querySelector(".preview_image")){
                document.querySelector(".add_image").before(preview);
            } else {
                document.querySelector(".add_image").before(preview);
            }
            
            preview.addEventListener('click', () => {
                preview.remove();
            });
        }
    }
}

// 미리보기에서 메인 이미지 설정
function setMainImageFromPreview(clickedPreview, index) {
    mainImageIndex = index;
    
    const container = document.querySelector('#individual_mode');
    const previews = container.querySelectorAll('.preview_image');
    
    previews.forEach((preview, i) => {
        const badge = preview.querySelector('.main_image_badge');
        if (preview === clickedPreview) {
            preview.classList.add('main_image');
            badge.style.display = 'block';
        } else {
            preview.classList.remove('main_image');
            badge.style.display = 'none';
        }
    });
}


function showSub() {
    document.querySelector(".sub_category").classList.add("show_sub");
}
function hideSub() {
    document.querySelector(".sub_category").classList.remove("show_sub");
}
function displayFilterCategory() {
    var grid = document.querySelector(".grid_container_category"); 
    for (var i = 0; i < categoryList.length; i++) {
        const item = document.createElement('div');
        item.className = "grid_category";
        item.innerHTML = `<input type="radio" name="category_input" class="category_image" id="category_list_`+i+`" value="`+categoryList[i]+`"/><label for="category_list_`+i+`">`+categoryList[i]+`</label></input>`;
        grid.appendChild(item);
        const temp = categoryList[i];
        if (temp == "dress" || temp == "top" || temp == "outer" || temp == "skirt" || temp == "pants" || temp == "etc." || temp == "etc") {
            item.addEventListener('click', showSub);
        } else {
            item.addEventListener('click', hideSub);
        }
        //     
        // } else {
        //     document.querySelector(".sub_category").style.display = "none";
        // }
        item.addEventListener('click', function() {
            displayFilterSubCategory(temp);}, false);
        item.addEventListener('click', function() {
            displayMeasurementInput(temp);}, false);
        
        }
    
}

function displayFilterSubCategory(cat) {
    console.log('🔧 displayFilterSubCategory called with category:', cat);
    var grid = document.querySelector(".grid_container_sub_category");
    if (!grid) {
        console.log('❌ Subcategory grid not found');
        return;
    }
    grid.innerHTML = ``;
    console.log('🧹 Subcategory grid cleared');

    if (cat == "dress" || cat == "top" || cat == "outer") {
        for (var i = 3; i < 5; i++) {
            const item = document.createElement('div');
            item.className = "grid_sub_category";
            item.innerHTML = `<input type="radio" name="sub_category_input" class="category_image" id="sub_category_list_`+i+`" value="` + subCategoryList[i] + `"/><label for="sub_category_list_`+i+`">`+subCategoryList[i]+`</label></input>`;
            grid.appendChild(item);
        } 
    } if (cat == "dress") {
        for (var i = 0; i < 3; i++) {
            const item = document.createElement('div');
            item.className = "grid_sub_category";
            item.innerHTML = `<input type="radio" name="sub_category_input_2" class="category_image" id="sub_category_list_`+i+`" value="` + subCategoryList[i] + `" /><label for="sub_category_list_`+i+`">`+subCategoryList[i]+`</label></input>`;
            grid.appendChild(item);
        } 
    } else if (cat == "skirt") {
        for (var i = 0; i < 3; i++) {
            const item = document.createElement('div');
            item.className = "grid_sub_category";
            item.innerHTML = `<input type="radio" name="sub_category_input" class="category_image" id="sub_category_list_`+i+`" value="` + subCategoryList[i] + `" /><label for="sub_category_list_`+i+`">`+subCategoryList[i]+`</label></input>`;
            grid.appendChild(item);
        } 
    } else if (cat == "pants") {
        for (var i = 5; i < 7; i++) {
            const item = document.createElement('div');
            item.className = "grid_sub_category";
            item.innerHTML = `<input type="radio" name="sub_category_input" class="category_image" id="sub_category_list_`+i+`" value="` + subCategoryList[i] + `" /><label for="sub_category_list_`+i+`">`+subCategoryList[i]+`</label></input>`;
            grid.appendChild(item);
        } 
    } else if (cat == "etc." || cat == "etc") {
        console.log('🎯 Creating etc category subcategories');
        // etc 카테고리의 서브카테고리: bag, socks, belt, hat, etc (인덱스 7-11)
        for (var i = 7; i < 12; i++) {
            const item = document.createElement('div');
            item.className = "grid_sub_category";
            item.innerHTML = `<input type="radio" name="sub_category_input" class="category_image" id="sub_category_list_`+i+`" value="` + subCategoryList[i] + `" /><label for="sub_category_list_`+i+`">`+subCategoryList[i]+`</label></input>`;
            grid.appendChild(item);
            console.log('➕ Added subcategory:', subCategoryList[i]);
        }
        console.log('✅ Etc subcategories created');
    } else {
        console.log('ℹ️ No subcategories for category:', cat);
    }
}

// Filter 페이지에서 사이즈 필터 표시
function displayFilterSize() {
    var grid = document.querySelector(".filter_size");
    if (!grid) return;
    
    // Size Region 필터 생성
    const regionContainer = document.createElement('div');
    regionContainer.innerHTML = '<h3 style="margin: 10px 0; font-size: 1.1em;">Region</h3>';
    regionContainer.style.marginBottom = '20px';
    
    const regionGrid = document.createElement('div');
    regionGrid.style.display = 'grid';
    regionGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(60px, 1fr))';
    regionGrid.style.gap = '10px';
    regionGrid.style.marginBottom = '20px';
    
    for (let i = 0; i < sizeRegionList.length; i++) {
        const item = document.createElement('div');
        item.innerHTML = `<input type="radio" name="size_region_input" class="category_image" id="size_region_${i}" value="${sizeRegionList[i]}"/><label for="size_region_${i}">${sizeRegionList[i]}</label>`;
        regionGrid.appendChild(item);
    }
    
    regionContainer.appendChild(regionGrid);
    grid.appendChild(regionContainer);
    
    // Size 값 필터 생성 (일반적인 사이즈들)
    const sizeContainer = document.createElement('div');
    sizeContainer.innerHTML = '<h3 style="margin: 10px 0; font-size: 1.1em;">Size</h3>';
    
    const sizeGrid = document.createElement('div');
    sizeGrid.style.display = 'grid';
    sizeGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(50px, 1fr))';
    sizeGrid.style.gap = '10px';
    
    // 일반적인 사이즈 목록
    const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '34', '36', '38', '40', '42', '44', '46', '48', '50'];
    
    for (let i = 0; i < commonSizes.length; i++) {
        const item = document.createElement('div');
        item.innerHTML = `<input type="radio" name="size_input" class="category_image" id="size_${i}" value="${commonSizes[i]}"/><label for="size_${i}">${commonSizes[i]}</label>`;
        sizeGrid.appendChild(item);
    }
    
    sizeContainer.appendChild(sizeGrid);
    grid.appendChild(sizeContainer);
}

/* myFunction toggles between adding and removing the show class, which is used to hide and show the dropdown content */
function show() {
    document.querySelector(".size_region_dropdown").classList.toggle("show");
}

// Season dropdown 함수들
function showSeasonDropdown() {
    document.querySelector(".season_dropdown").classList.toggle("show");
}

function selectSeason(season) {
    document.querySelector(".season_selected").textContent = season;
    document.querySelector(".season_dropdown").classList.remove("show");
}


function displaySizeRegionDropdown() {
    var drop = document.querySelector(".size_region_dropdown"); 
    for (var i = 0; i < sizeRegionList.length; i++) {
        
        const item = document.createElement('button');
        item.className = "size_region";
        item.innerHTML = sizeRegionList[i]+`</button>`;
        item.value = sizeRegionList[i];
        drop.appendChild(item);
        item.addEventListener('click', function() {
            displaySizesByRegion(this.value);}, false);
        item.addEventListener('click', show);
        item.addEventListener('click', function() {
            selectedSizeRegion(this.value);}, false);
    }
}

function displaySizesByRegion(region) {

    var accordingSizes = [];
    var grid = document.querySelector(".size_key_container");
    grid.innerHTML = ``;
    
    if (region == "etc") {
        // etc region 선택 시 텍스트 입력창만 표시
        let etcInput = document.getElementById('size_etc_input');
        console.log('🔍 etc region selected, finding input:', etcInput);
        
        if (!etcInput) {
            // 입력창이 없으면 새로 생성
            etcInput = document.createElement('input');
            etcInput.type = 'text';
            etcInput.id = 'size_etc_input';
            etcInput.name = 'size_etc';
            etcInput.className = 'size_etc_input';
            console.log('🔧 Created new etc input element');
        }
        
        etcInput.style.display = 'inline-block';
        grid.appendChild(etcInput);
        etcInput.focus();
        console.log('✅ etc input displayed and focused');
        return;
    }
    
    // 기존 region들의 사이즈 목록
    if (region == "US") {
        accordingSizes.push("00", "0", "2");
    } else if (region == "UK") {
        accordingSizes.push(4, 6, 8, 10);
    } else if (region == "EU") {
        accordingSizes.push(35, 35.5, 36, 36.5, 37);
    } else if (region == "FR") {
        accordingSizes.push(32, 34, 36);
    }else if (region == "DE") {
        accordingSizes.push(32, 34, 36);
    } else if (region == "IT") {
        accordingSizes.push(34, 36, 38);
    } else if (region == "WW") {
        accordingSizes.push("one size", "XXS", "XXS", "XS", "S", "M", "L", "XL");
    } else if (region == "KR") {
        accordingSizes.push(230, 235, 240);
    } else if (region == "Kids") {
        accordingSizes.push("10Y", "11Y", "12Y", "13Y", "14Y", "15Y", "16Y", "130cm", "140cm", "150cm");
    } else if (region == "Ring") {
        accordingSizes.push(48, 50, 52, 4, 5, 6, "KR 7", "KR 8", "KR 9", "KR 10", "KR 11", "I", "J");
    }
    
    // 일반 region들의 사이즈 버튼들 생성
    for (var i = 0; i < accordingSizes.length; i++) {
        const item = document.createElement('div');
        item.className = "size_key";
        item.innerHTML = `<input type="radio" name="size_key" id="size_key_`+i+`" value="` + accordingSizes[i] + `"/><label for="size_key_`+i+`">`+accordingSizes[i]+`</label></input>`;
        grid.appendChild(item);
    }
    var cont = document.querySelector(".grid_container_size");
    if (accordingSizes.length > 5){
        cont.style.height = "120px";
    } else if (accordingSizes.length > 10){
        cont.style.height = "180px";
    } else {
        cont.style.height = "80px";
    }
}
function selectedSizeRegion(region){
    var button = document.querySelector(".size_region_selected");
    button.innerHTML = region;
}

function autocomplete (inp, arr) {
    var currentFocus;
    
    // 브라우저 기본 자동완성 비활성화
    inp.setAttribute('autocomplete', 'off');
    
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value.trim();
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val || val.length === 0) { 
            return false;
        }
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "_autocomplete_list");
        a.setAttribute("class", "brand_autocomplete_items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        for (i = 0; i < arr.length; i++) {
          /*check if the item starts with the same letters as the text field value:*/
          if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
            /*create a DIV element for each matching element:*/
            b = document.createElement("DIV");
            /*make the matching letters bold:*/
            b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
            b.innerHTML += arr[i].substr(val.length);
            /*insert a input field that will hold the current array item's value:*/
            b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
            /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function(e) {
                /*insert the value for the autocomplete text field:*/
                inp.value = this.getElementsByTagName("input")[0].value;
                /*close the list of autocompleted values,
                (or any other open lists of autocompleted values:*/
                closeAllLists();
            });
            a.appendChild(b);
            console.log(b);
          }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "_autocomplete_list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
          /*If the arrow DOWN key is pressed,
          increase the currentFocus variable:*/
          currentFocus++;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 38) { //up
          /*If the arrow UP key is pressed,
          decrease the currentFocus variable:*/
          currentFocus--;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 13) {
          /*If the ENTER key is pressed, prevent the form from being submitted,*/
          e.preventDefault();
          if (currentFocus > -1) {
            /*and simulate a click on the "active" item:*/
            if (x) x[currentFocus].click();
          }
        }
    });
    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("brand_autocomplete_active");
      }
      function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
          x[i].classList.remove("brand_autocomplete_active");
        }
      }
      function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("brand_autocomplete_items");
        for (var i = 0; i < x.length; i++) {
          if (elmnt != x[i] && elmnt != inp) {
          x[i].parentNode.removeChild(x[i]);
        }
      }
    }
}

function displayMeasurementInput(selectedCategory) {
    var selected = selectedCategory;
    var accordingSizes = [];

    
    if (selected == "top" || selected == "dress" || selected == "outer") {
        accordingSizes.push("chest", "shoulder", "sleeve", "sleeve opening", "armhole", "waist", "length");
    } else if (selected == "pants") {
        accordingSizes = ["허리둘레", "엉덩이둘레", "밑위", "밑단", "총장"];
    } else if (selected == "skirt") {
        accordingSizes = ["허리둘레", "엉덩이둘레", "총장"];
    } else if (selected == "shoes") {
        accordingSizes = ["굽높이"];
    } else if (selected == "jewerly" || selected == "etc." || selected == "etc") {
        accordingSizes = ["가로", "세로", "길이", "높이", "둘레"];
    }
    
    // Edit 페이지에서는 기존 measurement 데이터 보존
    const isEditPage = document.getElementById('edit_item_form') !== null;
    let existingMeasurements = {};
    
    if (isEditPage) {
        // 기존 measurement 데이터 저장
        const existingInputs = document.querySelectorAll('.measurement_input');
        existingInputs.forEach(input => {
            const label = input.parentElement.querySelector('.part');
            if (label && input.value) {
                existingMeasurements[label.textContent] = input.value;
            }
        });
    }
    
    var grid = document.querySelector(".grid_container_measurement"); 
    grid.innerHTML = ``;
    for (var i = 0; i < accordingSizes.length; i++) {
        const item = document.createElement('div');
        item.className = "label_with_input";
        item.innerHTML = `<div class="part">`+accordingSizes[i]+`</div> <input type="number" id="measurementInput`+i+`" class="measurement_input"></div>`;
        grid.appendChild(item);
        
        // Edit 페이지에서 기존 데이터 복원
        if (isEditPage && existingMeasurements[accordingSizes[i]]) {
            const newInput = item.querySelector('.measurement_input');
            if (newInput) {
                newInput.value = existingMeasurements[accordingSizes[i]];
            }
        }
    }
}

function displayCompositionInput() {
    console.log('🧪 displayCompositionInput called');
    var grid = document.querySelector(".composition_sets_container");
    console.log('🧪 Composition grid found:', !!grid);
    
    // compositionList가 정의되지 않은 경우 기본값 사용
    if (typeof compositionList === 'undefined') {
        console.log('⚠️ compositionList not defined, using default list');
        window.compositionList = ["cotton", "silk", "wool", "cashmere", "leather", "viscose", "polyester", "polyamide"];
    }
    
    console.log('🧪 Composition list length:', compositionList.length);
    
    // 기존 항목들 제거
    if (grid) {
        grid.innerHTML = '';
    }
    
    // 기본 composition 그리드 생성 (원래 방식)
    const basicGrid = document.createElement('div');
    basicGrid.className = 'grid_container_composition';
    basicGrid.id = 'basic_composition_grid';
    
    for (var i = 0; i < compositionList.length; i++) {
        const item = document.createElement('div');
        item.className = "label_with_input";
        item.innerHTML = `<div class="part">${compositionList[i]}</div><input type="text" id="compositionInput${i}" class="composition_input">`;
        basicGrid.appendChild(item);
        console.log(`🧪 Added composition input for: ${compositionList[i]}`);
    }
    
    grid.appendChild(basicGrid);
    
    // composition sets 초기화 (아직 사용하지 않음)
    window.compositionSets = [];
    window.usingMultiSets = false;
}

// + 버튼 클릭시 다중 세트 모드로 전환
function addCompositionSet(setName = '') {
    console.log('🧪 Adding new composition set - transitioning to multi-set mode');
    
    // compositionList 확인
    if (typeof compositionList === 'undefined') {
        window.compositionList = ["cotton", "silk", "wool", "cashmere", "leather", "viscose", "polyester", "polyamide"];
    }
    
    const container = document.getElementById('composition_sets_container');
    if (!container) {
        console.error('❌ Composition sets container not found');
        return;
    }
    
    // 첫 번째 + 버튼 클릭인지 확인
    if (!window.usingMultiSets) {
        console.log('🔄 Converting to multi-set mode');
        window.usingMultiSets = true;
        
        // 기존 단일 그리드의 값들 저장
        const existingValues = {};
        const basicInputs = document.querySelectorAll('#basic_composition_grid .composition_input');
        basicInputs.forEach((input, index) => {
            if (input.value && input.value.trim()) {
                const label = input.parentElement.querySelector('.part');
                if (label) {
                    existingValues[label.textContent.trim()] = input.value.trim();
                }
            }
        });
        
        // 기존 그리드 제거
        container.innerHTML = '';
        
        // composition sets 초기화
        window.compositionSets = [];
        
        // 기존 데이터로 첫 번째 세트 생성 (이름 있음)
        createCompositionSet(0, '겉감', existingValues);
        
        // 새로운 세트 추가 (이름 있음)
        createCompositionSet(1, setName || '안감');
    } else {
        // 이미 다중 세트 모드인 경우 새 세트만 추가
        const setIndex = window.compositionSets.length;
        createCompositionSet(setIndex, setName || `Set ${setIndex + 1}`);
    }
}

// 실제 composition 세트 생성 함수
function createCompositionSet(setIndex, setName, existingValues = {}) {
    const container = document.getElementById('composition_sets_container');
    
    // 새 세트 객체 생성
    const newSet = {
        id: setIndex,
        name: setName,
        compositions: { ...existingValues }
    };
    
    window.compositionSets.push(newSet);
    
    // HTML 생성
    const setDiv = document.createElement('div');
    setDiv.className = 'composition_set';
    setDiv.id = `composition_set_${setIndex}`;
    
    setDiv.innerHTML = `
        <div class="composition_set_header">
            <input type="text" 
                   class="composition_set_name" 
                   placeholder="Set name (e.g., 겉감, 안감)" 
                   value="${setName}"
                   onchange="updateCompositionSetName(${setIndex}, this.value)">
            ${setIndex > 0 ? `<button type="button" class="remove_composition_set_btn" onclick="removeCompositionSet(${setIndex})">×</button>` : ''}
        </div>
        <div class="grid_container_composition" id="composition_grid_${setIndex}">
        </div>
    `;
    
    container.appendChild(setDiv);
    
    // composition 입력 필드들 생성
    const grid = document.getElementById(`composition_grid_${setIndex}`);
    for (let i = 0; i < compositionList.length; i++) {
        const material = compositionList[i];
        const existingValue = existingValues[material] || '';
        
        const item = document.createElement('div');
        item.className = "label_with_input";
        item.innerHTML = `
            <div class="part">${material}</div>
            <input type="text" 
                   id="compositionInput_${setIndex}_${i}" 
                   class="composition_input"
                   value="${existingValue}"
                   onchange="updateCompositionValue(${setIndex}, '${material}', this.value)">
        `;
        grid.appendChild(item);
    }
    
    console.log(`✅ Created composition set ${setIndex}: ${setName}`);
}

// composition 세트 제거
function removeCompositionSet(setIndex) {
    console.log(`🗑️ Removing composition set ${setIndex}`);
    
    if (!window.compositionSets || setIndex >= window.compositionSets.length) {
        console.error('❌ Invalid composition set index');
        return;
    }
    
    // HTML 요소 제거
    const setElement = document.getElementById(`composition_set_${setIndex}`);
    if (setElement) {
        setElement.remove();
    }
    
    // 배열에서 제거
    window.compositionSets.splice(setIndex, 1);
    
    // 나머지 세트들의 인덱스 업데이트
    refreshCompositionSets();
}

// composition 세트들 새로고침 (인덱스 재정렬)
function refreshCompositionSets() {
    const container = document.getElementById('composition_sets_container');
    if (!container) return;
    
    // 기존 HTML 전체 제거
    container.innerHTML = '';
    
    // 세트들 다시 생성
    const sets = [...window.compositionSets];
    window.compositionSets = [];
    
    sets.forEach((set, index) => {
        addCompositionSet(set.name);
        // 기존 데이터 복원
        Object.keys(set.compositions).forEach(material => {
            const input = document.getElementById(`compositionInput_${index}_${compositionList.indexOf(material)}`);
            if (input) {
                input.value = set.compositions[material];
                updateCompositionValue(index, material, set.compositions[material]);
            }
        });
    });
}

// composition 세트 이름 업데이트
function updateCompositionSetName(setIndex, newName) {
    if (window.compositionSets && window.compositionSets[setIndex]) {
        window.compositionSets[setIndex].name = newName;
        console.log(`📝 Updated set ${setIndex} name to: ${newName}`);
    }
}

// composition 값 업데이트
function updateCompositionValue(setIndex, material, value) {
    if (window.compositionSets && window.compositionSets[setIndex]) {
        if (value && value.trim() !== '') {
            window.compositionSets[setIndex].compositions[material] = value.trim();
        } else {
            delete window.compositionSets[setIndex].compositions[material];
        }
        console.log(`📝 Updated ${material} in set ${setIndex} to: ${value}`);
    }
}

// 기존 composition 데이터를 다중 세트 구조로 로드
function loadExistingCompositions(compositionsData) {
    console.log('🧪 Loading existing compositions:', compositionsData);
    
    if (!compositionsData) return;
    
    // 기존 세트들 초기화
    window.compositionSets = [];
    const container = document.getElementById('composition_sets_container');
    if (container) {
        container.innerHTML = '';
    }
    
    let loadedSets = [];
    
    if (typeof compositionsData === 'string') {
        try {
            compositionsData = JSON.parse(compositionsData);
        } catch (e) {
            console.error('❌ Failed to parse compositions string:', e);
            return;
        }
    }
    
    // 새로운 다중 세트 구조 확인
    if (typeof compositionsData === 'object' && compositionsData !== null) {
        // 다중 세트 구조인지 확인 (각 키가 세트 이름이고 값이 객체인지)
        const keys = Object.keys(compositionsData);
        const isMultiSet = keys.length > 0 && keys.every(key => 
            typeof compositionsData[key] === 'object' && 
            compositionsData[key] !== null &&
            !Array.isArray(compositionsData[key])
        );
        
        if (isMultiSet) {
            console.log('🧪 Loading multi-set compositions');
            Object.entries(compositionsData).forEach(([setName, setCompositions]) => {
                addCompositionSet(setName);
                const setIndex = window.compositionSets.length - 1;
                // 데이터 복원
                Object.entries(setCompositions).forEach(([material, value]) => {
                    const input = document.getElementById(`compositionInput_${setIndex}_${compositionList.indexOf(material)}`);
                    if (input) {
                        input.value = value;
                        updateCompositionValue(setIndex, material, value);
                    }
                });
            });
        } else {
            console.log('🧪 Loading single-set compositions (legacy format)');
            // 기존 단일 세트 구조를 기본 세트로 변환
            addCompositionSet('');
            const setIndex = 0;
            Object.entries(compositionsData).forEach(([material, value]) => {
                const input = document.getElementById(`compositionInput_${setIndex}_${compositionList.indexOf(material)}`);
                if (input) {
                    input.value = value;
                    updateCompositionValue(setIndex, material, value);
                }
            });
        }
    } else if (Array.isArray(compositionsData)) {
        console.log('🧪 Loading array-type compositions (legacy format)');
        // 배열 형태는 기본 세트로 변환 (비어있는 값들)
        addCompositionSet('');
        // 배열의 경우 실제 값이 없으므로 빈 세트로 둠
    }
    
    console.log(`✅ Loaded ${window.compositionSets.length} composition sets`);
}

function displayCompositionFilter() {
    var grid = document.querySelector(".filter_composition_container");
    for (var i = 0; i < compositionList.length; i++) {
        const item = document.createElement('div');
        item.className = "filter_composition";
        item.innerHTML = `<input type="checkbox" name="composition_filter" id="composition_`+i+`"/><label for="composition_`+i+`">`+compositionList[i]+`</label></input>`;
        grid.appendChild(item);
    }
}

function displayItemImage() {
    console.log('🔧 Loading item data for item view page...');
    
    let query = window.location.search;
    let param = new URLSearchParams(query);
    let id = param.get('id');

    if (!id) {
        console.error('❌ No item ID found in URL');
        return;
    }

    console.log('🔍 Loading item with ID:', id);

    // Supabase에서 실제 아이템 데이터 로드
    fetch(`/api/items/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.item) {
                console.log('✅ Item data loaded:', data.item);
                populateItemView(data.item);
            } else {
                console.error('❌ Item not found');
                // Fallback으로 기존 이미지 로드 시도
                const placeHolder = document.querySelector(".view_item_image");
                const item = document.createElement('img');
                item.src = `/static/src/db/${id}.jpg`;
                item.onerror = () => {
                    placeHolder.innerHTML = '<div class="no-image">이미지를 찾을 수 없습니다</div>';
                };
                placeHolder.appendChild(item);
            }
        })
        .catch(error => {
            console.error('❌ Error loading item data:', error);
            // Fallback으로 기존 이미지 로드 시도
            const placeHolder = document.querySelector(".view_item_image");
            const item = document.createElement('img');
            item.src = `/static/src/db/${id}.jpg`;
            item.onerror = () => {
                placeHolder.innerHTML = '<div class="no-image">이미지를 찾을 수 없습니다</div>';
            };
            placeHolder.appendChild(item);
        });
}

// 아이템 뷰 페이지에 데이터를 채우는 함수
function populateItemView(item) {
    console.log('🖼️ Populating item view with data:', item);
    
    // 브랜드와 카테고리 정보 표시
    const brandElement = document.getElementById('item-brand');
    const categoryElement = document.getElementById('item-category');
    
    if (brandElement) {
        brandElement.textContent = item.brand || 'Brand Name';
    }
    
    if (categoryElement) {
        const categoryText = [item.subcategory, item.subcategory2, item.category]
            .filter(c => c && c.trim() !== '')
            .join(' ') || 'category';
        categoryElement.textContent = categoryText;
    }
    
    // 이미지 표시
    const imageContainer = document.querySelector(".view_item_image");
    if (imageContainer && item.images && item.images.length > 0) {
        imageContainer.innerHTML = ''; // 기존 내용 제거
        
        if (isStitchedImage(item.images)) {
            console.log('🧩 Displaying stitched images as carousel');
            displayStitchedImagesAsCarousel(item.images, imageContainer);
        } else {
            console.log('🖼️ Displaying individual images');
            // 첫 번째 이미지만 표시 (또는 갤러리 형태로)
            const img = document.createElement('img');
            img.src = item.images[0];
            img.style.maxWidth = '100%';
            img.style.borderRadius = '30px';
            img.onerror = () => {
                imageContainer.innerHTML = '<div class="no-image">이미지를 로드할 수 없습니다</div>';
            };
            imageContainer.appendChild(img);
        }
    }
    
    // Size 정보 표시
    const sizeElement = document.querySelector('.view_size');
    if (sizeElement && item.size) {
        const sizeText = item.size_region ? `${item.size_region} ${item.size}` : item.size;
        sizeElement.textContent = sizeText;
        sizeElement.style.display = 'block';
    }
    
    // Measurement 표시
    if (item.measurements && item.category) {
        const measurementContainer = document.getElementById('measurement_container');
        if (measurementContainer) {
            measurementContainer.innerHTML = ''; // 기존 내용 제거
            console.log('📏 Creating measurements for category:', item.category);
            
            // 카테고리별 measurement 생성
            if (item.category === 'top') {
                // Top 카테고리 - 서브카테고리에 따라 분기
                const subcategory = item.subcategory || '';
                if (subcategory.toLowerCase().includes('long sleeve')) {
                    createTopLongSleeveMeasurement(measurementContainer, item.measurements);
                } else {
                    createTopMeasurement(measurementContainer, item.measurements);
                }
            } else if (item.category === 'dress') {
                // Dress 카테고리 - 서브카테고리 전달
                createDressMeasurement(measurementContainer, item.measurements, item.subcategory);
            }
            // 다른 카테고리들도 필요시 추가
        }
    }
    
    // Composition 표시
    updateCompositionDisplay(item);
    
    console.log('✅ Item view populated successfully');
}

function input(){
    // var pic = document.getElementById('myFile').files[0].name;
    var category =document.querySelector('input[name="category_input"]:checked').value;
    var name = document.getElementById('myName').value;
    var age = document.getElementById('myAge').value;
    window.prompt("아래 내용을 복사 하세요", 'addItem("'+name+'","'+age+'","./img/'+pic+'");');
}

function setupEventListeners() {
    // Edit page인지 확인
    const isEditPage = document.getElementById('edit_item_form') !== null;
    
    const submitButton = document.querySelector('.submit_button button');
    if (submitButton && !isEditPage) {
        // Add page에서만 submitForm 함수 연결
        submitButton.addEventListener('click', submitForm);
    }
}
// S3 객체 생성
// var s3 = new AWS.S3({
//     apiVersion: '2006-03-01',
//     params: {Bucket: 'closetdb'}
// });


function submitForm(event) {
    event.preventDefault(); // 폼 기본 제출 동작 방지

    // 폼 데이터 수집
    const formData = new FormData();
    
    // 이미지 모드 확인 및 파일 추가
    const imageModeToggle = document.getElementById('image_mode_switch');
    const mode = imageModeToggle && imageModeToggle.checked ? 'stitched' : 'individual';
    
    formData.append('image_mode', mode);
    
    let hasImages = false;
    
    if (mode === 'stitched') {
        // Stitched 이미지 모드
        const stitchedFile = document.querySelector('.file_uploader_stitched').files[0];
        if (stitchedFile) {
            formData.append('stitched_image', stitchedFile);
            const sectionCount = document.querySelector('input[name="section_count"]:checked').value;
            formData.append('section_count', sectionCount);
            hasImages = true;
        }
    } else {
        // Individual 이미지 모드
        // copy & paste와 파일 선택 둘 다 지원
        if (window.individualFiles && window.individualFiles.length > 0) {
            // copy & paste로 추가된 이미지들 사용
            for (let i = 0; i < window.individualFiles.length; i++) {
                formData.append('individual_images', window.individualFiles[i]);
            }
            console.log('📤 Sending', window.individualFiles.length, 'individual files (copy&paste + file select)');
            hasImages = true;
        } else {
            // 기존 파일 선택 방식
            const individualFiles = document.querySelector('.file_uploader').files;
            if (individualFiles.length > 0) {
                for (let i = 0; i < individualFiles.length; i++) {
                    formData.append('individual_images', individualFiles[i]);
                }
                console.log('📤 Sending', individualFiles.length, 'individual files (file select only)');
                hasImages = true;
            }
        }
        formData.append('main_image_index', mainImageIndex || 0);
    }
    
    // 이미지 유효성 검사
    if (!hasImages) {
        alert('❌ 이미지를 추가해주세요!');
        return;
    }
    
    // 카테고리 데이터 수집
    const categoryInput = document.querySelector('input[name="category_input"]:checked');
    const category = categoryInput ? categoryInput.value : '';
    
    const subcategoryInput = document.querySelector('input[name="sub_category_input"]:checked');
    const subcategory = subcategoryInput ? subcategoryInput.value : '';
    
    const subcategory2Input = document.querySelector('input[name="sub_category_input_2"]:checked');
    const subcategory2 = subcategory2Input ? subcategory2Input.value : '';
    
    // 브랜드와 아이템명
    const brand = document.getElementById('brand_search') ? document.getElementById('brand_search').value : '';
    
    // 사이즈 데이터
    const sizeRegionElement = document.querySelector('.size_region_selected');
    let sizeRegion = sizeRegionElement ? sizeRegionElement.textContent.trim() : '';
    if (sizeRegion === 'Select') sizeRegion = '';
    
    let size = '';
    let sizeEtc = '';
    
    if (sizeRegion === 'etc') {
        // etc region 선택 시 텍스트 입력창의 값을 사용
        const sizeEtcInput = document.getElementById('size_etc_input');
        sizeEtc = sizeEtcInput ? sizeEtcInput.value.trim() : '';
        size = sizeEtc; // etc 입력값을 size로 사용
    } else {
        // 일반 region들의 사이즈 버튼에서 선택
        const sizeInput = document.querySelector('input[name="size_key"]:checked');
        size = sizeInput ? sizeInput.value : '';
    }
    
    // 측정 데이터 (measurement)
    const measurements = {};
    const measurementInputs = document.querySelectorAll('.measurement_input');
    measurementInputs.forEach((input, index) => {
        if (input.value) {
            const label = input.parentElement.querySelector('.part');
            if (label) {
                measurements[label.textContent] = input.value;
            }
        }
    });
    
    // Composition 데이터 수집 (다중 세트 모드 지원)
    console.log('🧪 Collecting composition data for add mode');
    let compositions;
    
    if (window.usingMultiSets && window.compositionSets && window.compositionSets.length > 0) {
        console.log('🧪 Using multi-set mode for data collection');
        // 다중 세트 구조로 수집
        const validSets = window.compositionSets.filter(set => 
            set.compositions && Object.keys(set.compositions).length > 0
        );
        
        if (validSets.length > 0) {
            compositions = {};
            validSets.forEach(set => {
                const setName = set.name && set.name.trim() !== '' ? set.name : '';
                compositions[setName] = set.compositions;
            });
            console.log('🧪 Final compositions (multi-set mode):', compositions);
        } else {
            compositions = {};
        }
    } else {
        console.log('🧪 Using single-set mode for data collection');
        // 기존 방식 (단일 세트)
        const compositionInputs = document.querySelectorAll('.composition_input');
        const compositionEntries = [];
        const compositionPercentages = {};
        
        compositionInputs.forEach((input, index) => {
            if (input.value && input.value.trim()) {
                const label = input.parentElement.querySelector('.part');
                if (label) {
                    const value = input.value.trim().toLowerCase();
                    const material = label.textContent.trim();
                    
                    // 알파벳 소문자인지 확인 (a, b, c 등)
                    if (/^[a-z]$/.test(value)) {
                        compositionEntries.push({
                            material: material,
                            order: value
                        });
                    } else {
                        // 숫자인 경우 퍼센테이지로 처리
                        const percentage = parseInt(value);
                        if (percentage >= 1 && percentage <= 100) {
                            compositionPercentages[material] = percentage;
                        }
                    }
                }
            }
        });
        
        if (compositionEntries.length > 0) {
            // 알파벳 순서로 정렬해서 배열로 저장
            compositionEntries.sort((a, b) => a.order.localeCompare(b.order));
            compositions = compositionEntries.map(entry => entry.material);
        } else {
            // 퍼센테이지 객체로 저장
            compositions = compositionPercentages;
        }
    }
    
    // 시즌 데이터
    const seasonInputs = document.querySelectorAll('.season_input');
    const year = seasonInputs[0] ? seasonInputs[0].value : '';
    const season = document.querySelector('.season_selected') ? document.querySelector('.season_selected').textContent : '';
    const purchaseYear = seasonInputs[1] ? seasonInputs[1].value : '';
    
    // 필수 데이터 유효성 검사
    const missingFields = [];
    
    if (!category) missingFields.push('카테고리');
    
    // 브랜드/사이즈/소재 중 하나는 반드시 있어야 함
    const hasBrand = brand && brand.trim() !== '';
    const hasSize = (sizeRegion && sizeRegion !== 'Select') && (size && size.trim() !== '');
    const hasComposition = window.usingMultiSets 
        ? (typeof compositions === 'object' && compositions !== null && Object.keys(compositions).length > 0 && Object.values(compositions).some(set => Object.keys(set).length > 0))
        : (compositions.length > 0 || (typeof compositions === 'object' && Object.keys(compositions).length > 0));
    
    if (!hasBrand && !hasSize && !hasComposition) {
        missingFields.push('브랜드, 사이즈, 소재 중 최소 하나');
    }
    
    if (missingFields.length > 0) {
        alert(`❌ 다음 필수 항목을 입력해주세요:\n${missingFields.join(', ')}`);
        return;
    }
    
    // FormData에 추가
    if (category) formData.append('category', category);
    if (subcategory) formData.append('subcategory', subcategory);
    if (subcategory2) formData.append('subcategory2', subcategory2);
    if (brand) formData.append('brand', brand);
    if (sizeRegion && sizeRegion !== 'Select') formData.append('sizeRegion', sizeRegion);
    if (size && size.trim() !== '') formData.append('size', size);
    if (sizeEtc && sizeEtc.trim() !== '') formData.append('sizeEtc', sizeEtc);
    if (Object.keys(measurements).length > 0) formData.append('measurements', JSON.stringify(measurements));
    if (window.usingMultiSets) {
        if (Object.keys(compositions).length > 0) formData.append('compositions', JSON.stringify(compositions));
    } else {
        if (compositions.length > 0) formData.append('compositions', JSON.stringify(compositions));
    }
    if (year) formData.append('year', year);
    if (season) formData.append('season', season);
    if (purchaseYear) formData.append('purchaseYear', purchaseYear);
    
    
    // Flask 서버로 전송
    fetch('/add_item', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Item added successfully!');
        // view all로 리다이렉트
        window.location.href = '/all.html';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred: ' + error.message);
    });
}

// 이미지 파일 업로드 로직
function uploadFiles(files) {
    const uploads = Array.from(files).map(file => {
        const fileName = `${Date.now()}_${file.name}`;
        const upload = new AWS.S3.ManagedUpload({
            params: {
                Bucket: 'closetdb', // replace with your bucket name
                Key: fileName,
                Body: file,
                ACL: 'public-read'
            }
        });
        return upload.promise();
    });

    return Promise.all(uploads);
}

// 데이터 저장 로직
function saveFormDataToDynamoDB(imageUrls) {
    const db = new AWS.DynamoDB.DocumentClient();
    const formData = collectFormData();
    formData.imageURLs = imageUrls; // Add the URLs of uploaded images

    const params = {
        TableName: 'closet',
        Item: formData
    };

    return new Promise((resolve, reject) => {
        db.put(params, function(err, data) {
            if (err) {
                console.error('Error saving data to DynamoDB:', err);
                reject(err);
            } else {
                console.log('Data saved to DynamoDB successfully');
                resolve();
            }
        });
    });
}

// 폼 데이터 수집 로직
function collectFormData() {
    var categoryInput = document.querySelector('input[name="category_input"]:checked');
    var category = categoryInput ? categoryInput.value : null;
    var subcategory = document.querySelector('input[name="sub_category_input"]:checked') ? document.querySelector('input[name="sub_category_input"]:checked').value : null;
    var subcategory2 = (category === "dress") ? (document.querySelector('input[name="sub_category_input_2"]:checked') ? document.querySelector('input[name="sub_category_input_2"]:checked').value : null) : null;
    var brand = document.getElementById('brand_search').value;

    var sizeRegion = document.querySelector('.size_region_selected').textContent.trim();
    if (sizeRegion == "Select"){
        sizeRegion = null;
    }    
    var size = document.querySelector('input[name="size_key"]:checked') ? document.querySelector('input[name="size_key"]:checked').value : null;

    var cotton = document.getElementById('compositionInput0').value ? document.getElementById('compositionInput0').value : null;


    return {
        category: category,
        subcategory: subcategory,
        subcategory2 : subcategory2,
        brand: brand,
        sizeRegion: sizeRegion,
        size : size,
        composition : composition,
        cotton : cotton
    }
};

// Item detail page logic
function loadItemDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    
    console.log('🔍 Loading item with ID:', itemId);
    
    if (itemId && itemId.startsWith('supabase_')) {
        fetch(`/api/items/${itemId}`)
            .then(response => response.json())
            .then(data => {
                console.log('📦 Raw API response:', data);
                if (data.item) {
                    const item = data.item;
                    console.log('🔍 DEBUGGING ITEM DATA:');
                    console.log('   - Item ID:', item.item_id);
                    console.log('   - Name:', item.name);
                    console.log('   - Thumbnail URL:', item.thumbnail_url);
                    console.log('   - Images array:', item.images);
                    console.log('   - Images length:', item.images ? item.images.length : 'undefined');
                    
                    if (item.images) {
                        console.log('🖼️  Analyzing each image:');
                        
                        // URL 수정 시도 및 fallback 처리
                        const originalImages = [...item.images];
                        let fixedImages = item.images.map(url => {
                            // 패턴: itemID_index_itemID_section_N.jpg -> itemID_section_N.jpg
                            const urlParts = url.split('/');
                            const filename = urlParts[urlParts.length - 1];
                            
                            // 이중 item_id 패턴 감지 및 수정
                            const regex = /(\d+)_\d+_(\1_section_\d+\.jpg)/;
                            const match = filename.match(regex);
                            
                            if (match) {
                                const fixedFilename = match[2]; // 두 번째 그룹 (올바른 부분)
                                const fixedUrl = url.replace(filename, fixedFilename);
                                console.log(`   🔧 Trying fixed URL: ${filename} -> ${fixedFilename}`);
                                return { fixed: fixedUrl, original: url };
                            }
                            return { fixed: url, original: url };
                        });
                        
                        // 첫 번째 이미지로 URL 접근성 테스트
                        console.log('🔍 Testing URL accessibility...');
                        const testImg = new Image();
                        let urlTestComplete = false;
                        
                        testImg.onload = () => {
                            console.log('✅ Fixed URLs are accessible');
                            // 수정된 URL 사용
                            item.images = fixedImages.map(img => img.fixed);
                            urlTestComplete = true;
                            
                            const viewContainer = document.querySelector('.view_item_image');
                            console.log('🔍 View container children count:', viewContainer.children.length);
                            console.log('🔍 View container content:', viewContainer.innerHTML);
                            
                            if (viewContainer.children.length === 0) {
                                console.log('✅ Container is empty, calling updateItemDisplay');
                                updateItemDisplay(item);
                            } else {
                                console.log('⚠️ Container not empty, skipping updateItemDisplay to avoid duplicates');
                                // 중복 호출 방지 - 이미 populateItemView에서 처리됨
                            }
                        };
                        
                        testImg.onerror = () => {
                            console.log('❌ Fixed URLs not accessible, using original URLs');
                            // 원본 URL 사용
                            item.images = originalImages;
                            fixedImages = originalImages.map(url => ({ fixed: url, original: url }));
                            urlTestComplete = true;
                            console.log('🔄 URL test failed, but skipping updateItemDisplay to avoid duplicates');
                            // updateItemDisplay은 이미 populateItemView에서 호출되었음
                        };
                        
                        testImg.src = fixedImages[0].fixed;
                        
                        // 테스트 타임아웃 (1초 후 원본 URL 사용)
                        setTimeout(() => {
                            if (!urlTestComplete) {
                                console.log('⏰ URL test timeout, using original URLs');
                                item.images = originalImages;
                                urlTestComplete = true;
                                console.log('🔄 URL test timeout, but skipping updateItemDisplay to avoid duplicates');
                                // updateItemDisplay은 이미 populateItemView에서 호출되었음
                            }
                        }, 1000);
                        
                        // 로그를 위한 분석 (비동기 테스트 후에는 실행하지 않음)
                        console.log('   Initial analysis of URLs:');
                        fixedImages.forEach((urlObj, index) => {
                            const hasSection = urlObj.fixed.includes('_section_');
                            console.log(`   ${index + 1}. ${urlObj.fixed} -> Has _section_: ${hasSection}`);
                        });
                        
                        // updateItemDisplay는 위의 비동기 테스트에서 조건부로 호출됨
                        // 여기서는 호출하지 않음
                    } else {
                        // 이미지가 없는 경우에만 바로 업데이트
                        updateItemDisplay(item);
                    }
                } else {
                    console.error('❌ No item data in response');
                }
            })
            .catch(error => {
                console.error('❌ Error loading item details:', error);
            });
    } else {
        console.log('❌ Invalid or missing item ID');
    }
}

function updateItemDisplay(item) {
    // 브랜드 이름 업데이트
    const brandElement = document.getElementById('item-brand');
    if (brandElement && item.brand) {
        brandElement.textContent = item.brand;
        
        // 한글이 포함된 브랜드명에는 GmarketSans Bold 폰트 적용
        const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(item.brand);
        if (hasKorean) {
            brandElement.style.fontFamily = 'GmarketSansBold, GmarketSans, -apple-system, BlinkMacSystemFont, sans-serif';
            brandElement.style.fontWeight = '700'; // 두꺼운 폰트
        }
    }
    
    // 카테고리 업데이트
    const categoryElement = document.getElementById('item-category');
    if (categoryElement) {
        const categoryText = [item.subcategory, item.category].filter(Boolean).join(' ');
        if (categoryText) {
            categoryElement.textContent = categoryText;
        }
    }
    
    // 이미지 처리는 populateItemView에서만 수행하도록 중복 제거
    console.log('📍 updateItemDisplay: Skipping image processing to avoid duplicates');
    
    // 사이즈 정보 업데이트
    updateSizeDisplay(item);
    
    // Composition 정보 업데이트
    updateCompositionDisplay(item);
    
    // Measurement 처리는 populateItemView에서만 수행하도록 중복 제거
    console.log('📍 updateItemDisplay: Skipping measurement processing to avoid duplicates');
}

// 사이즈 정보 업데이트 함수
function updateSizeDisplay(item) {
    const sizeElement = document.querySelector('.view_size');
    if (sizeElement) {
        let sizeText = '';
        
        // size_etc가 있으면 "Size [value]" 형식으로 표시
        if (item.size_etc && item.size_etc.trim()) {
            sizeText = `Size ${item.size_etc}`;
        } else if (item.size_region && item.size && item.size.trim() !== '' && item.size !== 'null' && item.size !== null) {
            // WW인 경우에도 "Size [value]" 형식으로 표시
            if (item.size_region.toUpperCase() === 'WW') {
                sizeText = `Size ${item.size}`;
            } else {
                // 일반적인 사이즈 정보 표시 (원본 케이스 유지)
                sizeText = `${item.size_region} ${item.size}`;
            }
        }
        
        if (sizeText) {
            console.log('🔍 Size data debug:', {
                size_region: item.size_region,
                size: item.size,
                size_etc: item.size_etc,
                final_sizeText: sizeText
            });
            sizeElement.textContent = sizeText;
            sizeElement.style.fontFamily = 'Sequel85, sans-serif';
            sizeElement.style.display = 'block';
            console.log('Updated size display:', sizeText);
        } else {
            // 사이즈 정보가 없으면 숨김
            sizeElement.style.display = 'none';
            console.log('No size information, hiding size element');
        }
    }
}

// Composition 정보 업데이트 함수
function updateCompositionDisplay(item) {
    const compositionContainer = document.querySelector('.view_composition');
    if (compositionContainer && item.compositions) {
        try {
            // 기존 composition 항목들 제거 (사이즈는 view_size 클래스로 구분)
            const existingComps = compositionContainer.querySelectorAll('.label_with_value');
            existingComps.forEach(comp => comp.remove());
            
            // 하드코딩된 더미 데이터도 제거
            const dummyData = compositionContainer.querySelectorAll('.comp_label, .comp_value');
            dummyData.forEach(dummy => {
                if (dummy.parentElement && dummy.parentElement.classList.contains('label_with_value')) {
                    dummy.parentElement.remove();
                }
            });
            
            // compositions가 문자열이면 JSON 파싱
            let compositions = item.compositions;
            if (typeof compositions === 'string') {
                compositions = JSON.parse(compositions);
            }
            
            // 배열 형태로 저장된 composition을 순서대로 표시
            if (Array.isArray(compositions)) {
                compositions.forEach(material => {
                    if (material) {
                        const compDiv = document.createElement('div');
                        compDiv.className = 'label_with_value';
                        compDiv.style.display = 'block'; // 세로로 나열
                        compDiv.style.marginBottom = '8px';
                        
                        const labelDiv = document.createElement('div');
                        labelDiv.className = 'comp_label';
                        labelDiv.textContent = material;
                        labelDiv.style.fontSize = '1.1em';
                        labelDiv.style.color = '#333';
                        
                        compDiv.appendChild(labelDiv);
                        compositionContainer.appendChild(compDiv);
                    }
                });
            } else {
                // 기존 객체 형태 호환성 유지 (percentage 표시)
                Object.entries(compositions).forEach(([material, percentage]) => {
                    if (material && percentage) {
                        const compDiv = document.createElement('div');
                        compDiv.className = 'label_with_value';
                        
                        const labelDiv = document.createElement('div');
                        labelDiv.className = 'comp_label';
                        labelDiv.textContent = material;
                        
                        const valueDiv = document.createElement('div');
                        valueDiv.className = 'comp_value';
                        valueDiv.textContent = `${percentage}%`;
                        
                        compDiv.appendChild(labelDiv);
                        compDiv.appendChild(valueDiv);
                        compositionContainer.appendChild(compDiv);
                    }
                });
            }
            
            console.log('Updated composition display:', compositions);
        } catch (error) {
            console.error('Error updating composition:', error);
        }
    }
}

// Measurement 정보 업데이트 함수 - 카테고리별 동적 생성
function updateMeasurementDisplay(item) {
    const measurementContainer = document.getElementById('measurement_container');
    if (!measurementContainer) return;
    
    // 기존 내용 제거
    measurementContainer.innerHTML = '';
    
    // 카테고리 확인 (기본값: top)
    const category = item.category || 'top';
    
    try {
        // measurements가 문자열이면 JSON 파싱
        let measurements = item.measurements;
        if (typeof measurements === 'string') {
            measurements = JSON.parse(measurements);
        }
        
        // 카테고리별 measurement 구성
        if (category === 'top' || category === 'outer') {
            // 서브카테고리 확인 (long sleeve 여부)
            const subcategory = item.subcategory || '';
            if (subcategory.toLowerCase().includes('long sleeve')) {
                createTopLongSleeveMeasurement(measurementContainer, measurements);
            } else {
                createTopMeasurement(measurementContainer, measurements);
            }
        } else if (category === 'dress') {
            createDressMeasurement(measurementContainer, measurements, item.subcategory);
        } else {
            // 기본값으로 top 사용
            createTopMeasurement(measurementContainer, measurements);
        }
        
        console.log('Updated measurement display for category:', category, measurements);
    } catch (error) {
        console.error('Error updating measurements:', error);
    }
}

// Top/Outer 카테고리 measurement 생성
function createTopMeasurement(container, measurements) {
    // 베이스 이미지
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement_top.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // measurement 데이터와 가이드라인 이미지 매핑
    const measurementMap = [
        { key: 'chest', label: '가슴', guideline: 'measurement_top_chest.svg' },
        { key: 'shoulder', label: '어깨', guideline: 'measurement_top_shoulder.svg' },
        { key: 'sleeve', label: '소매', guideline: 'measurement_top_sleeve.svg' },
        { key: 'sleeveOpening', label: '소매단', guideline: 'measurement_top_sleeveOpening.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_top_length.svg' },
        { key: 'waist', label: '허리', guideline: 'measurement_top_waist.svg' }
    ];
    
    measurementMap.forEach(item => {
        if (measurements && measurements[item.key]) {
            // 수치 박스 생성
            const box = document.createElement('div');
            box.className = `box ${item.key}`;
            box.textContent = measurements[item.key];
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', item.key);
            container.appendChild(guidelineImg);
        }
    });
}

// Top Long Sleeve 카테고리 measurement 생성
function createTopLongSleeveMeasurement(container, measurements) {
    // 베이스 이미지 (long sleeve용)
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/top_long.png';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // long sleeve measurement 데이터와 가이드라인 이미지 매핑
    const measurementMap = [
        { key: 'chest', label: '가슴', guideline: 'measurement_top_long_chest.svg' },
        { key: 'shoulder', label: '어깨', guideline: 'measurement_top_long_shoulder.svg' },
        { key: 'sleeve', label: '소매', guideline: 'measurement_top_long_sleeve.svg' },
        { key: 'sleeveOpening', label: '소매단', guideline: 'measurement_top_long_sleeveOpening.svg' },
        { key: 'armhole', label: '암홀', guideline: 'measurement_top_long_armhole.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_top_long_length.svg' },
        { key: 'waist', label: '허리', guideline: 'measurement_top_long_waist.svg' }
    ];
    
    measurementMap.forEach(item => {
        if (measurements && measurements[item.key]) {
            // 수치 박스 생성
            const box = document.createElement('div');
            box.className = `box ${item.key} long-sleeve`;
            box.textContent = measurements[item.key];
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', item.key);
            container.appendChild(guidelineImg);
        }
    });
}

// Dress 카테고리 measurement 생성 - 서브카테고리별 분기
function createDressMeasurement(container, measurements, subcategory) {
    const subcategoryLower = (subcategory || '').toLowerCase();
    
    if (subcategoryLower.includes('short sleeve') && subcategoryLower.includes('mini')) {
        createDressShortSleeveMiniMeasurement(container, measurements);
    } else {
        // 기본 dress 처리 (현재는 top과 동일)
        createTopMeasurement(container, measurements);
    }
}

// Short Sleeve Mini Dress 카테고리 measurement 생성
function createDressShortSleeveMiniMeasurement(container, measurements) {
    // 베이스 이미지
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/dress_short sleeve, mini.png';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // short sleeve mini dress measurement 데이터와 가이드라인 이미지 매핑
    const measurementMap = [
        { key: 'chest', label: '가슴', guideline: 'measurement_dress_short sleeve, mini_chest.svg' },
        { key: 'shoulder', label: '어깨', guideline: 'measurement_dress_short sleeve, mini_shoulder.svg' },
        { key: 'sleeve', label: '소매', guideline: 'measurement_dress_short sleeve, mini_sleeve.svg' },
        { key: 'sleeveOpening', label: '소매단', guideline: 'measurement_dress_short sleeve, mini_sleeveOpening.svg' },
        { key: 'armhole', label: '암홀', guideline: 'measurement_dress_short sleeve, mini_armhole.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_dress_short sleeve, mini_length.svg' },
        { key: 'waist', label: '허리', guideline: 'measurement_dress_short sleeve, mini_waist.svg' }
    ];
    
    measurementMap.forEach(item => {
        if (measurements && measurements[item.key]) {
            // 수치 박스 생성
            const box = document.createElement('div');
            box.className = `box ${item.key} short-sleeve-mini-dress`;
            box.textContent = measurements[item.key];
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', item.key);
            container.appendChild(guidelineImg);
        }
    });
}

// Stitched 이미지인지 판단 (파일명에 'section'이 포함되어 있으면 Stitched)
function isStitchedImage(imageUrls) {
    const hasSection = imageUrls.some(url => url.includes('_section_'));
    console.log('Checking if stitched image:', imageUrls, 'Has section:', hasSection);
    return hasSection;
}

// Stitched 이미지들을 다시 합치는 함수
function stitchImagesBack(imageUrls, container) {
    console.log('Starting stitchImagesBack with urls:', imageUrls);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const loadedImages = [];
    let loadedCount = 0;
    
    // 모든 이미지를 로드
    imageUrls.forEach((url, index) => {
        console.log(`Loading image ${index + 1}/${imageUrls.length}:`, url);
        
        // CORS 문제 해결을 위해 바로 프록시 사용
        const proxyUrl = `/proxy_image?url=${encodeURIComponent(url)}`;
        console.log(`Using proxy URL:`, proxyUrl);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            console.log(`Image ${index + 1} loaded successfully via proxy, size: ${img.width}x${img.height}`);
            loadedImages[index] = img;
            loadedCount++;
            
            // 모든 이미지가 로드되면 합치기
            if (loadedCount === imageUrls.length) {
                console.log('All images loaded via proxy, combining now...');
                combineImages(loadedImages, canvas, ctx, container);
            }
        };
        img.onerror = function(error) {
            console.error('Failed to load image via proxy:', proxyUrl, error);
            loadedCount++; // Count failed loads to prevent hanging
            
            // 프록시로도 실패한 경우 원본 URL로 fallback 이미지 표시
            if (index === 0) {
                console.log('Using fallback original image display for first image');
                const fallbackImg = document.createElement('img');
                fallbackImg.src = url; // 원본 URL 사용
                fallbackImg.style.maxWidth = '100%';
                fallbackImg.style.height = 'auto';
                fallbackImg.style.borderRadius = '30px';
                container.appendChild(fallbackImg);
            }
            
            // Check if we should proceed with partial images
            if (loadedCount === imageUrls.length) {
                console.log('All images processed (some failed), attempting to combine loaded images');
                const validImages = loadedImages.filter(img => img); // Remove undefined/null
                if (validImages.length > 0) {
                    combineImages(validImages, canvas, ctx, container);
                } else {
                    console.log('No valid images to combine, falling back to horizontal carousel');
                    displayStitchedImagesAsCarousel(imageUrls, container);
                }
            }
        };
        
        img.src = proxyUrl;
    });
}


// Stitched 이미지들을 carousel로 표시하는 함수 (제대로 된 버전)
function displayStitchedImagesAsCarousel(imageUrls, container) {
    console.log('Displaying stitched images as horizontal carousel with proper structure');
    
    // 외부 패딩 컨테이너 (40px padding)
    const paddingContainer = document.createElement('div');
    paddingContainer.style.padding = '40px';
    paddingContainer.style.height = '800px';
    paddingContainer.style.maxHeight = '800px';
    paddingContainer.style.width = '100%';
    paddingContainer.style.boxSizing = 'border-box';
    paddingContainer.style.overflowY = 'visible'; // 위아래 스크롤 허용
    
    // 내부 carousel 컨테이너 (좌우 스크롤)
    const carouselContainer = document.createElement('div');
    carouselContainer.style.display = 'flex';
    carouselContainer.style.flexDirection = 'row';
    carouselContainer.style.gap = '20px';
    carouselContainer.style.height = '100%';
    carouselContainer.style.overflowX = 'auto';
    carouselContainer.style.overflowY = 'hidden';
    carouselContainer.style.alignItems = 'flex-start';
    carouselContainer.style.justifyContent = 'flex-start';
    carouselContainer.style.width = '100%';
    
    // 스크롤바 숨기기
    carouselContainer.style.scrollbarWidth = 'none'; // Firefox
    carouselContainer.style.msOverflowStyle = 'none'; // IE
    
    // Webkit 브라우저용 스크롤바 숨기기
    const style = document.createElement('style');
    style.textContent = `
        .horizontal-carousel::-webkit-scrollbar {
            display: none;
        }
    `;
    document.head.appendChild(style);
    carouselContainer.className = 'horizontal-carousel';
    
    // 이미지에서만 좌우 스크롤, 빈 공간에서는 위아래 스크롤 허용
    carouselContainer.addEventListener('wheel', (e) => {
        // 이벤트 타겟이 이미지인 경우에만 좌우 스크롤
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            carouselContainer.scrollLeft += e.deltaY;
        }
        // 빈 공간에서는 기본 위아래 스크롤 허용 (preventDefault 하지 않음)
    });
    
    // 이미지들 추가
    imageUrls.forEach((url, index) => {
        const img = document.createElement('img');
        // 직접 URL 사용
        img.src = url;
        img.style.height = '100%';
        img.style.maxHeight = '800px';
        img.style.width = 'auto';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '30px';
        img.style.flexShrink = '0';
        img.style.cursor = 'pointer';
        
        // 클릭 시 확대
        img.onclick = () => {
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.zIndex = '1000';
            modal.onclick = () => document.body.removeChild(modal);
            
            const modalImg = document.createElement('img');
            modalImg.src = url;
            modalImg.style.maxWidth = '90%';
            modalImg.style.maxHeight = '90%';
            modalImg.style.borderRadius = '30px';
            
            modal.appendChild(modalImg);
            document.body.appendChild(modal);
        };
        
        img.onload = function() {
            console.log(`✅ Carousel image ${index + 1} loaded successfully`);
            console.log(`📐 Image dimensions: ${this.naturalWidth}x${this.naturalHeight}`);
            console.log(`🎨 Image styles: height=${this.style.height}, width=${this.style.width}`);
        };
        
        img.onerror = function() {
            console.log(`❌ Carousel image ${index + 1} failed to load: ${url}`);
            console.log(`⚠️ This image may not exist in R2 bucket`);
            // 플레이스홀더로 대체하되 더 명확한 메시지
            img.src = '/static/src/img/plus.png';
            img.style.opacity = '0.3';
            img.title = 'Image not found in storage';
        };
        
        carouselContainer.appendChild(img);
    });
    
    // 구조: paddingContainer > carouselContainer > images
    paddingContainer.appendChild(carouselContainer);
    container.appendChild(paddingContainer);
    
    console.log(`✅ Displayed ${imageUrls.length} stitched sections as proper horizontal carousel`);
    console.log(`🏗️ Container structure:`);
    console.log(`   📦 Main container:`, container);
    console.log(`   📦 Padding container:`, paddingContainer);
    console.log(`   📦 Carousel container:`, carouselContainer);
    console.log(`   🖼️ Total images in carousel:`, carouselContainer.children.length);
}

// 이미지들을 Canvas에서 가로로 합치기
function combineImages(images, canvas, ctx, container) {
    console.log('combineImages called with', images.length, 'images');
    if (images.length === 0) {
        console.log('No images to combine');
        return;
    }
    
    // 첫 번째 이미지의 높이를 기준으로 캔버스 크기 설정
    const height = images[0].height;
    const totalWidth = images.reduce((width, img) => width + img.width, 0);
    
    console.log(`Setting canvas size: ${totalWidth}x${height}`);
    canvas.width = totalWidth;
    canvas.height = height;
    
    // 이미지들을 가로로 이어붙이기
    let currentX = 0;
    images.forEach((img, index) => {
        console.log(`Drawing image ${index + 1} at position ${currentX}, size: ${img.width}x${img.height}`);
        ctx.drawImage(img, currentX, 0);
        currentX += img.width;
    });
    
    // Canvas를 이미지로 변환하여 표시
    try {
        const combinedImg = document.createElement('img');
        combinedImg.src = canvas.toDataURL('image/jpeg', 0.9);
        combinedImg.style.maxWidth = '100%';
        combinedImg.style.height = 'auto';
        combinedImg.style.borderRadius = '30px';
        
        console.log('Appending combined image to container');
        container.appendChild(combinedImg);
        console.log('Successfully stitched', images.length, 'sections back together');
    } catch (error) {
        console.error('CORS error or Canvas issue:', error);
        console.log('Falling back to gallery display for stitched images');
        
        // CORS 오류 시 horizontal carousel로 표시
        console.log('CORS error - displaying as horizontal carousel instead');
        
        // 외부 패딩 컨테이너
        const paddingContainer = document.createElement('div');
        paddingContainer.style.padding = '40px';
        paddingContainer.style.height = '800px';
        paddingContainer.style.width = '100%';
        paddingContainer.style.boxSizing = 'border-box';
        
        // 내부 carousel 컨테이너 
        const carouselContainer = document.createElement('div');
        carouselContainer.style.display = 'flex';
        carouselContainer.style.flexDirection = 'row';
        carouselContainer.style.gap = '20px';
        carouselContainer.style.height = '100%';
        carouselContainer.style.overflowX = 'auto';
        carouselContainer.style.overflowY = 'hidden';
        carouselContainer.style.alignItems = 'center';
        carouselContainer.style.width = '100%';
        
        // 스크롤바 숨기기
        carouselContainer.style.scrollbarWidth = 'none'; // Firefox
        carouselContainer.style.msOverflowStyle = 'none'; // IE
        
        // Webkit 브라우저용 스크롤바 숨기기
        const style = document.createElement('style');
        style.textContent = `
            .horizontal-carousel::-webkit-scrollbar {
                display: none;
            }
        `;
        document.head.appendChild(style);
        carouselContainer.className = 'horizontal-carousel';
        
        // 이미지 영역에서만 좌우 스크롤 이벤트 추가
        carouselContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            carouselContainer.scrollLeft += e.deltaY;
        });
        
        images.forEach((img, index) => {
            const displayImg = document.createElement('img');
            displayImg.src = img.src;
            displayImg.style.height = '100%';
            displayImg.style.width = 'auto';
            displayImg.style.objectFit = 'contain';
            displayImg.style.borderRadius = '15px';
            displayImg.style.flexShrink = '0';
            
            carouselContainer.appendChild(displayImg);
        });
        
        // 구조: paddingContainer > carouselContainer > images
        paddingContainer.appendChild(carouselContainer);
        container.appendChild(paddingContainer);
        console.log('Displayed', images.length, 'sections as horizontal carousel with proper padding');
    }
}

// Filter form submission handler
function submitFilterForm(event) {
    event.preventDefault();
    
    console.log('🔍 Filter form submitted');
    
    // 카테고리 필터 수집
    const selectedCategory = document.querySelector('input[name="category_input"]:checked');
    const selectedSubCategory = document.querySelector('input[name="sub_category_input"]:checked');
    const selectedSubCategory2 = document.querySelector('input[name="sub_category2_input"]:checked');
    
    // 브랜드 필터
    const brandInput = document.getElementById('brand_search');
    const brand = brandInput ? brandInput.value.trim() : '';
    
    // 사이즈 필터
    const selectedSizeRegion = document.querySelector('input[name="size_region_input"]:checked');
    const selectedSize = document.querySelector('input[name="size_input"]:checked');
    
    // 조성 필터 수집
    const compositionFilters = {};
    const compositionCheckboxes = document.querySelectorAll('input[name="composition_filter"]:checked');
    compositionCheckboxes.forEach(checkbox => {
        const label = document.querySelector(`label[for="${checkbox.id}"]`);
        if (label) {
            const compositionName = label.textContent.trim();
            compositionFilters[compositionName] = 1; // 최소 1% 이상
        }
    });
    
    // 필터 객체 생성
    const filters = {};
    
    if (selectedCategory) {
        filters.category = selectedCategory.value;
    }
    
    if (selectedSubCategory) {
        filters.subcategory = selectedSubCategory.value;
    }
    
    if (selectedSubCategory2) {
        filters.subcategory2 = selectedSubCategory2.value;
    }
    
    if (brand) {
        filters.brand = brand;
    }
    
    if (selectedSizeRegion) {
        filters.size_region = selectedSizeRegion.value;
    }
    
    if (selectedSize) {
        filters.size = selectedSize.value;
    }
    
    if (Object.keys(compositionFilters).length > 0) {
        filters.composition = compositionFilters;
    }
    
    console.log('📋 Collected filters:', filters);
    
    // API 호출
    fetch('/api/filter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('✅ Filter results:', data);
        displayFilterResults(data.items, data.count);
    })
    .catch(error => {
        console.error('❌ Filter error:', error);
        alert('검색 중 오류가 발생했습니다: ' + error.message);
    });
}

// 필터 결과 표시 함수
function displayFilterResults(items, count) {
    console.log(`📊 Displaying ${count} filtered items`);
    
    // 기존 내용 정리
    const contentSection = document.querySelector('.content.narrow');
    if (contentSection) {
        // 결과 컨테이너가 이미 있으면 제거
        const existingResults = contentSection.querySelector('.filter-results');
        if (existingResults) {
            existingResults.remove();
        }
        
        // 새 결과 컨테이너 생성
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'filter-results';
        resultsContainer.innerHTML = `
            <div class="subheader">
                <h1>Results (${count})</h1>
            </div>
            <div class="results-grid"></div>
        `;
        
        const resultsGrid = resultsContainer.querySelector('.results-grid');
        resultsGrid.style.display = 'grid';
        resultsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        resultsGrid.style.gap = '20px';
        resultsGrid.style.marginTop = '20px';
        
        // 각 아이템 표시
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'filter-result-item';
            itemElement.style.cursor = 'pointer';
            itemElement.style.borderRadius = '15px';
            itemElement.style.overflow = 'hidden';
            itemElement.style.backgroundColor = '#f8f9fa';
            itemElement.style.transition = 'transform 0.3s ease';
            
            // 이미지 표시
            const imageUrl = item.thumbnail_url || (item.images && item.images[0]) || '/static/src/img/placeholder.jpg';
            
            itemElement.innerHTML = `
                <img src="${imageUrl}" 
                     style="width: 100%; height: 200px; object-fit: cover;" 
                     onerror="this.src='/static/src/img/placeholder.jpg'">
                <div style="padding: 15px;">
                    <h3 style="margin: 0; font-size: 1.1em; color: #333;">${item.brand || 'Unknown Brand'}</h3>
                    <p style="margin: 5px 0; color: #666; font-size: 0.9em;">${item.name || 'No Name'}</p>
                    <p style="margin: 5px 0; color: #888; font-size: 0.8em;">${item.category || ''} ${item.subcategory || ''}</p>
                    ${item.size && item.size.trim() !== '' && item.size !== 'null' && item.size !== null ? 
                        `<p style="margin: 5px 0; color: #888; font-size: 0.8em;">Size: ${item.size}</p>` : 
                        ''}
                </div>
            `;
            
            // 클릭 시 상세 페이지로 이동
            itemElement.addEventListener('click', () => {
                window.location.href = `/item.html?id=supabase_${item.item_id}`;
            });
            
            // 호버 효과
            itemElement.addEventListener('mouseenter', () => {
                itemElement.style.transform = 'scale(1.02)';
            });
            
            itemElement.addEventListener('mouseleave', () => {
                itemElement.style.transform = 'scale(1)';
            });
            
            resultsGrid.appendChild(itemElement);
        });
        
        // 결과 없음 메시지
        if (items.length === 0) {
            resultsGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                    <h3>검색 결과가 없습니다</h3>
                    <p>다른 조건으로 다시 검색해보세요.</p>
                </div>
            `;
        }
        
        contentSection.appendChild(resultsContainer);
        
        // 결과 영역으로 스크롤
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// Add event listener to form submission button
document.addEventListener('DOMContentLoaded', function() {
    // Edit page인지 확인
    const isEditPage = document.getElementById('edit_item_form') !== null;
    
    var submitButton = document.querySelector('.submit_button button');
    if(submitButton && !isEditPage){
        // Add page에서만 submitForm 함수 연결
        submitButton.addEventListener('click', submitForm);
    }
    
    // Filter page에서 Apply filters 버튼 처리
    const filterButton = document.querySelector('.generate_script');
    if (filterButton) {
        filterButton.addEventListener('click', submitFilterForm);
    }
    
    // Item detail page인지 확인하고 데이터 로드
    if (window.location.pathname.includes('item.html')) {
        loadItemDetails();
    }
    
    // Add page에서 copy & paste, drag & drop 기능 초기화
    if (window.location.pathname.includes('add.html')) {
        setupImagePasteAndDrop();
        loadExistingBrandsForAutocomplete();
    }
});

// 기존 저장된 브랜드들을 가져와서 자동완성 리스트에 추가
function loadExistingBrandsForAutocomplete() {
    console.log('🔍 Loading existing brands for autocomplete');
    
    fetch('/api/items')
    .then(response => response.json())
    .then(data => {
        if (data.items && Array.isArray(data.items)) {
            console.log('📦 Retrieved', data.items.length, 'items from database');
            
            // 기존 brandList를 복사
            const existingBrands = new Set(brandList);
            
            // 저장된 아이템들에서 브랜드 추출
            data.items.forEach(item => {
                if (item.brand && item.brand.trim()) {
                    const brand = item.brand.trim();
                    existingBrands.add(brand);
                }
            });
            
            // brandList를 업데이트 (중복 제거된 전체 브랜드 목록)
            brandList.length = 0; // 기존 배열 비우기
            brandList.push(...Array.from(existingBrands).sort()); // 정렬해서 추가
            
            console.log('✅ Updated brandList with', brandList.length, 'brands');
            console.log('📋 First 10 brands:', brandList.slice(0, 10));
        }
    })
    .catch(error => {
        console.error('❌ Error loading existing brands:', error);
    });
}

// Copy & Paste, Drag & Drop 기능 설정
function setupImagePasteAndDrop() {
    console.log('🖼️ Setting up image paste and drop functionality');
    
    // 전역 paste 이벤트 리스너
    document.addEventListener('paste', function(e) {
        // individual 모드가 아니면 무시
        const individualMode = document.getElementById('individual_mode');
        if (!individualMode || individualMode.style.display === 'none') {
            return;
        }
        
        e.preventDefault();
        
        const items = e.clipboardData.items;
        const imageFiles = [];
        
        console.log('📋 Paste event detected, checking clipboard items:', items.length);
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            console.log('📋 Clipboard item type:', item.type);
            
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    console.log('🖼️ Found image in clipboard:', file.name || 'pasted-image.png');
                    imageFiles.push(file);
                }
            }
        }
        
        if (imageFiles.length > 0) {
            console.log('✅ Adding', imageFiles.length, 'pasted images');
            addImageFiles(imageFiles);
        } else {
            console.log('❌ No images found in clipboard');
            alert('클립보드에 이미지가 없습니다. 웹페이지에서 이미지를 우클릭 → 복사한 후 다시 시도해보세요.');
        }
    });
    
    // 전역 drag & drop 이벤트 리스너
    const container = document.querySelector('#individual_mode');
    if (container) {
        // 드래그 오버 효과 (시각적 효과 제거)
        container.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        container.addEventListener('drop', function(e) {
            e.preventDefault();
            
            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            console.log('🎯 Drop event detected, found', imageFiles.length, 'image files');
            
            if (imageFiles.length > 0) {
                addImageFiles(imageFiles);
            } else {
                alert('이미지 파일만 업로드할 수 있습니다.');
            }
        });
    }
}

// 이미지 파일들을 individual 모드에 추가하는 함수
function addImageFiles(files) {
    console.log('📁 Adding', files.length, 'image files to individual mode');
    
    // Individual 모드의 컨테이너를 정확히 찾기
    const container = document.querySelector('#individual_mode');
    console.log('🔍 Individual container found:', container);
    if (!container) {
        console.error('❌ Individual container not found!');
        return;
    }
    
    // Individual 모드가 활성화되어 있는지 확인
    if (container.style.display === 'none') {
        console.error('❌ Individual mode is not active!');
        alert('Individual 이미지 모드를 먼저 선택해주세요.');
        return;
    }
    
    files.forEach((file, index) => {
        // 파일명 생성 (붙여넣기한 이미지는 기본 이름 부여)
        const fileName = file.name || `pasted-image-${Date.now()}-${index}.png`;
        console.log('🖼️ Processing file:', fileName);
        
        // FileReader로 이미지 미리보기 생성
        const reader = new FileReader();
        reader.onload = function(e) {
            // 새 File 객체 생성 (이름 설정)
            const namedFile = new File([file], fileName, { type: file.type });
            
            // 기존 individual 파일 목록에 추가
            if (!window.individualFiles) {
                window.individualFiles = [];
            }
            window.individualFiles.push(namedFile);
            
            // 미리보기 요소 생성
            const preview = document.createElement('div');
            preview.className = 'preview_image';
            preview.style.position = 'relative';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            
            preview.appendChild(img);
            
            // 첫 번째 이미지면 메인 이미지로 설정
            const isFirst = window.individualFiles.length === 1;
            if (isFirst) {
                preview.classList.add('main_image');
                const badge = document.createElement('div');
                badge.className = 'main_image_badge';
                badge.textContent = 'MAIN';
                preview.appendChild(badge);
                console.log('👑 Set as main image:', fileName);
            }
            
            // 클릭 이벤트: 대표 이미지 설정 또는 제거
            preview.addEventListener('click', () => {
                if (preview.classList.contains('main_image') && window.individualFiles.length > 1) {
                    // 메인 이미지가 아닌 다른 이미지를 메인으로 설정하기 위한 토글
                    return;
                }
                
                if (!preview.classList.contains('main_image')) {
                    // 기존 메인 이미지 해제
                    const currentMain = container.querySelector('.preview_image.main_image');
                    if (currentMain) {
                        currentMain.classList.remove('main_image');
                        const existingBadge = currentMain.querySelector('.main_image_badge');
                        if (existingBadge) existingBadge.remove();
                    }
                    
                    // 새 메인 이미지 설정
                    preview.classList.add('main_image');
                    const badge = document.createElement('div');
                    badge.className = 'main_image_badge';
                    badge.textContent = 'MAIN';
                    preview.appendChild(badge);
                    
                    // individualFiles 배열에서 해당 파일을 첫 번째로 이동
                    const fileIndex = Array.from(container.querySelectorAll('.preview_image')).indexOf(preview);
                    if (fileIndex > 0) {
                        const file = window.individualFiles.splice(fileIndex, 1)[0];
                        window.individualFiles.unshift(file);
                    }
                    
                    console.log('👑 Main image changed to:', fileName);
                } else if (window.individualFiles.length > 1) {
                    // 메인 이미지 제거 (2개 이상일 때만)
                    const fileIndex = Array.from(container.querySelectorAll('.preview_image')).indexOf(preview);
                    window.individualFiles.splice(fileIndex, 1);
                    preview.remove();
                    
                    // 새로운 첫 번째 이미지를 메인으로 설정
                    const firstPreview = container.querySelector('.preview_image:not(.main_image)');
                    if (firstPreview) {
                        firstPreview.classList.add('main_image');
                        const badge = document.createElement('div');
                        badge.className = 'main_image_badge';
                        badge.textContent = 'MAIN';
                        firstPreview.appendChild(badge);
                    }
                    
                    console.log('🗑️ Removed image:', fileName);
                }
            });
            
            // add_image 요소 앞에 삽입
            const addButton = container.querySelector('.add_image');
            console.log('🔍 Add button found:', addButton);
            console.log('🔍 Preview element created:', preview);
            console.log('🔍 Container children before insert:', container.children.length);
            
            if (addButton) {
                container.insertBefore(preview, addButton);
                console.log('✅ Inserted preview before add button');
            } else {
                container.appendChild(preview);
                console.log('✅ Appended preview to container');
            }
            
            console.log('🔍 Container children after insert:', container.children.length);
            console.log('✅ Image added successfully:', fileName);
            console.log('📊 Total individual files now:', window.individualFiles.length);
        };
        
        reader.readAsDataURL(file);
    });
}
