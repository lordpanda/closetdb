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
                    // 토큰이 있으면 저장
                    if (data.token) {
                        localStorage.setItem('userToken', data.token);
                    } else {
                        localStorage.setItem('userToken', 'logged_in_' + Date.now());
                    }
                    
                    // 로그인 전에 저장된 목표 URL이 있으면 그곳으로, 없으면 메인으로
                    const redirectUrl = localStorage.getItem('redirectAfterLogin');
                    
                    if (redirectUrl) {
                        localStorage.removeItem('redirectAfterLogin'); // 사용 후 제거
                        window.location.href = redirectUrl;
                    } else {
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
                    localStorage.setItem('userToken', data.token);  // Store token

                    // 로그인 전에 저장된 목표 URL이 있으면 그곳으로, 없으면 메인으로
                    const redirectUrl = localStorage.getItem('redirectAfterLogin');
                    
                    if (redirectUrl) {
                        localStorage.removeItem('redirectAfterLogin'); // 사용 후 제거
                        window.location.href = redirectUrl;
                    } else {
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
        <a href="#" id="logo_link"><h1>closetDB</h1></a>
    </div>
    <input type="checkbox" class="toggler">
    <div class="hamburger"><div></div></div>
    <ul class="menu">
        <li><a class="`+activeItem[0]+`" href="#" id="view_all_link">View all</a></li>
        <li><a class="`+activeItem[2]+`" href="#" id="add_new_link">Add</a></li>
        <li><a class="`+activeItem[1]+`" href="#" id="filter_link">Filter</a></li>
    </ul>
    `);
}

// 모든 메뉴 링크에 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
    
    // 이미지 파일 배열 초기화
    window.individualFiles = [];
    selectedFiles = [];
    
    // 현재 페이지가 로그인이 필요한 페이지인지 확인
    const currentPath = window.location.pathname;
    const protectedPages = ['/index.html', '/add.html', '/edit.html', '/filter.html', '/all.html', '/item.html'];
    const isProtectedPage = protectedPages.includes(currentPath);
    
    
    // 필터 페이지나 all 페이지에서 브라우저 뒤로가기로 온 경우 저장된 필터 상태 복원
    if (currentPath.includes('/index.html') || currentPath.includes('/all.html') || currentPath.includes('/filter.html')) {
        setTimeout(() => {
            restoreFilterState();
            
            // all.html과 index.html에서 검색 상태 복원
            if (currentPath.includes('/all.html') || currentPath.includes('/index.html')) {
                const searchState = restoreSearchState();
                if (searchState && searchState.query) {
                    const searchInput = document.querySelector('.search_input');
                    if (searchInput) {
                        searchInput.value = searchState.query;
                        window.isRestoringSearch = true; // 복원 모드 설정
                        
                        if (currentPath.includes('/all.html')) {
                            performSearchForAll(searchState.query);
                        } else if (currentPath.includes('/index.html')) {
                            // index.html에서는 해당 페이지의 검색 함수 사용
                            performSearch(searchState.query);
                        }
                        
                        window.isRestoringSearch = false; // 복원 모드 해제
                    }
                }
            }
        }, 1500); // 페이지 로드 완료 후 복원
    }
    
    if (isProtectedPage) {
        const token = localStorage.getItem('userToken');
        
        if (!token || (!token.startsWith('authenticated_') && !token.startsWith('google_auth_') && !token.startsWith('logged_in_'))) {
            window.location.href = '/';
            return;
        }
    }
    
    // 약간의 지연을 두고 링크를 찾음 (displayGlobalMenu가 실행된 후)
    setTimeout(() => {
        // closetDB 로고 링크
        const logoLink = document.getElementById('logo_link');
        if (logoLink) {
            logoLink.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 로고 클릭은 명시적으로 메인으로 이동하려는 의도이므로 검색 상태 삭제
                clearSearchState();
                checkLoginAndRedirect('/index.html');
            });
        }
        
        // View all 링크
        const viewAllLink = document.getElementById('view_all_link');
        if (viewAllLink) {
            viewAllLink.addEventListener('click', function(e) {
                e.preventDefault();
                
                // View all 클릭은 명시적으로 모든 아이템을 보려는 의도이므로 검색 상태 삭제
                clearSearchState();
                checkLoginAndRedirect('./all.html');
            });
        }
        
        // Filter 링크
        const filterLink = document.getElementById('filter_link');
        if (filterLink) {
            filterLink.addEventListener('click', function(e) {
                e.preventDefault();
                openFilterPanel();
            });
        }
        
        // Add new 링크
        const addNewLink = document.getElementById('add_new_link');
        if (addNewLink) {
            addNewLink.addEventListener('click', function(e) {
                e.preventDefault();
                checkLoginAndRedirect('/add.html');
            });
        }
        
    }, 100);
});

// 구글 로그인 시작 함수
function initiateGoogleLogin() {
    
    // 현재 저장된 리다이렉트 URL 확인
    const savedRedirectUrl = localStorage.getItem('redirectAfterLogin');
    
    // 목표 URL이 없으면 기본값 설정
    if (!savedRedirectUrl) {
        localStorage.setItem('redirectAfterLogin', '/add.html');
    }
    
    // 구글 OAuth로 리다이렉트 (절대 경로 사용)
    window.location.href = '/auth/google';
}

// 토큰 상태 디버깅 함수
function debugTokenStatus() {
    const token = localStorage.getItem('userToken');
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
}

// 로그인 체크 및 리다이렉트 함수
function checkLoginAndRedirect(targetUrl) {
    debugTokenStatus();
    
    // 세션에서 토큰 확인
    const token = localStorage.getItem('userToken');
    
    
    if (token && token.trim() !== '') {
        
        // 토큰이 유효한지 간단히 확인 (더미 토큰 형식 체크)
        if (token.startsWith('authenticated_') || token.startsWith('google_auth_') || token.startsWith('logged_in_')) {
            window.location.href = targetUrl;
        } else {
            localStorage.removeItem('userToken');
            localStorage.setItem('redirectAfterLogin', targetUrl);
            window.location.href = '/login.html';
        }
    } else {
        // 토큰이 없으면 목표 URL을 저장하고 로그인 페이지로 이동
        localStorage.setItem('redirectAfterLogin', targetUrl);
        window.location.href = '/login.html';
    }
}

// 전역 변수로 페이지네이션 상태 관리
let currentOffset = 0;
let allItems = [];
let isLoading = false;

function displayRecentlyAdded() {
    var grid = document.querySelector(".grid_container"); 
    
    // 검색 결과 클래스 제거 (원래 상태로 복원)
    const subheader = document.querySelector('.subheader');
    if (subheader) {
        subheader.classList.remove('search-results');
    }
    
    // Load More 버튼 다시 보이기 (초기 상태로 돌아갈 때만)
    const loadMoreBtn = document.getElementById('load_more_btn');
    if (loadMoreBtn && !isSearchMode) {
        loadMoreBtn.classList.remove('hide');
        loadMoreBtn.classList.add('show');
    }
    
    // Supabase에서 모든 아이템들 가져오기
    fetch('/api/items')
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data.items && data.items.length > 0) {
                allItems = data.items; // 전체 아이템 저장
                currentOffset = 0; // 초기화
                
                // 첫 24개 표시
                const maxItems = Math.min(data.items.length, 24);
                
                for (let index = 0; index < maxItems; index++) {
                    const item = data.items[index];
                    createAndAppendGridItem(item, grid);
                }
                
                currentOffset = maxItems; // 현재 로드된 아이템 수 업데이트
                
                // Load More 버튼 표시/숨김 관리
                updateLoadMoreButton();
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

// Grid item 생성 및 추가 헬퍼 함수
function createAndAppendGridItem(item, grid) {
    const gridItem = document.createElement('div');
    gridItem.className = 'grid_item clickable';
    
    // a 태그로 감싸서 기본 브라우저 동작(Shift+Click, 우클릭) 지원
    const link = document.createElement('a');
    link.href = './item.html?id=supabase_' + item.item_id;
    link.className = 'grid_item_link';
    
    const img = document.createElement('img');
    img.loading = 'lazy'; // 브라우저 네이티브 lazy loading
    
    // 썸네일이 있으면 썸네일 사용, 없으면 원본 이미지, 그것도 없으면 기본 이미지
    if (item.thumbnail_url) {
        img.src = item.thumbnail_url;
    } else if (item.images && item.images.length > 0) {
        img.src = item.images[0];
    } else {
        // 기본 이미지 (short sleeve top measurement)
        img.src = "/static/src/img/measurement/measurement_top.svg";
        img.classList.add('image_placeholder');
    }
    
    img.onerror = function() {
        // 이미지 로드 실패시 기본 이미지
        this.src = "/static/src/img/measurement/measurement_top.svg";
        this.classList.add('image_placeholder');
    };
    
    link.appendChild(img);
    gridItem.appendChild(link);
    grid.appendChild(gridItem);
}

// Load More 버튼 상태 업데이트
function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('load_more_btn');
    if (!loadMoreBtn) return;
    
    // 검색 모드일 때는 버튼을 숨김
    if (isSearchMode) {
        loadMoreBtn.classList.remove('show', 'inline-block');
        loadMoreBtn.classList.add('hide');
        loadMoreBtn.style.display = 'none';
        return;
    }
    
    if (currentOffset >= allItems.length) {
        loadMoreBtn.classList.remove('show', 'inline-block');
        loadMoreBtn.classList.add('hide');
    } else {
        loadMoreBtn.classList.remove('hide');
        loadMoreBtn.classList.add('inline-block');
        loadMoreBtn.textContent = 'Load More';
    }
}

// Load More 버튼 클릭 핸들러
function loadMoreItems() {
    if (isLoading || currentOffset >= allItems.length) return;
    
    isLoading = true;
    const loadMoreBtn = document.getElementById('load_more_btn');
    if (loadMoreBtn) {
        loadMoreBtn.textContent = 'Loading...';
        loadMoreBtn.disabled = true;
    }
    
    const grid = document.querySelector('.grid_container');
    const nextBatch = allItems.slice(currentOffset, currentOffset + 12);
    
    
    // 약간의 딜레이로 로딩 상태 표시
    setTimeout(() => {
        nextBatch.forEach(item => {
            createAndAppendGridItem(item, grid);
        });
        
        currentOffset += nextBatch.length;
        isLoading = false;
        
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
        }
        
        updateLoadMoreButton();
        
    }, 300);
}

// all.html에서 사용할 모든 아이템 표시 함수
function displayAllItems() {
    var grid = document.querySelector(".grid_container"); 
    
    // 검색 결과 클래스 제거 (원래 상태로 복원)
    const subheader = document.querySelector('.subheader');
    if (subheader) {
        subheader.classList.remove('search-results');
    }
    
    // Supabase에서 모든 아이템 가져오기
        fetch('/api/items')
        .then(response => {
            return response.json();
        })
        .then(data => {
                                    if (data.items && data.items.length > 0) {
                // 모든 아이템 표시 (제한 없음)
                data.items.forEach((item, index) => {
                    const gridItem = document.createElement('div');
                    gridItem.className = 'grid_item clickable';
                    
                    // a 태그로 감싸서 기본 브라우저 동작(Shift+Click, 우클릭) 지원
                    const link = document.createElement('a');
                    link.href = './item.html?id=supabase_' + item.item_id;
                    link.className = 'grid_item_link';
                    
                    const img = document.createElement('img');
                    img.loading = 'lazy'; // 브라우저 네이티브 lazy loading
                    
                    // 썸네일이 있으면 썸네일 사용, 없으면 원본 이미지, 그것도 없으면 기본 이미지
                    if (item.thumbnail_url) {
                        img.src = item.thumbnail_url;
                                    } else if (item.images && item.images.length > 0) {
                        img.src = item.images[0];
                                    } else {
                        // 기본 이미지 (short sleeve top measurement)
                        img.src = "/static/src/img/measurement/measurement_top.svg";
                        img.classList.add('image_placeholder');
                                    }
                    
                    img.onerror = function() {
                        // 이미지 로드 실패시 기본 이미지
                                        this.src = "/static/src/img/measurement/measurement_top.svg";
                        this.classList.add('image_placeholder');
                    };
                    
                    link.appendChild(img);
                    gridItem.appendChild(link);
                    
                    grid.appendChild(gridItem);
                });
            }
        })
        .catch(error => {
            console.error('Error loading all items from Supabase:', error);
            var numberOfItems = 8;
            for (let i = 0; i < numberOfItems; i++) {
                const item = document.createElement('div');
                item.className = 'grid_item clickable';
                
                // a 태그로 감싸서 기본 브라우저 동작(Shift+Click, 우클릭) 지원
                const link = document.createElement('a');
                link.href = './item.html?id=' + i;
                link.className = 'grid_item_link';
                
                const img = document.createElement('img');
                img.src = "/static/src/db/" + i + ".jpg";
                link.appendChild(img);
                item.appendChild(link);
                
                grid.appendChild(item);
            }
        });
}


/* add */

window.onload = function() {
    // 이미지 모드 토글 설정 (중복 호출 방지를 위해 조건부)
    const modeToggle = document.getElementById('image_mode_switch');
    if (modeToggle && !modeToggle.hasAttribute('data-initialized')) {
        setupImageModeToggle();
        modeToggle.setAttribute('data-initialized', 'true');
    }
}

// 이미지 모드 토글 설정
function setupImageModeToggle() {
    const modeToggle = document.getElementById('image_mode_switch');
    const stitchedMode = document.getElementById('stitched_mode');
    const individualMode = document.getElementById('individual_mode');
    
    if (!modeToggle || !stitchedMode || !individualMode) return;
    
    // 초기 상태 설정 (default: stitched mode)
    stitchedMode.classList.remove('hidden');
    individualMode.classList.add('hidden');
    modeToggle.checked = true; // checked = stitched mode
    modeToggle.setAttribute('data-initialized', 'true');
    
    // Stitched 모드의 + 버튼이 보이도록 확실히 설정
    const stitchedAddButton = stitchedMode.querySelector('.add_image');
    if (stitchedAddButton) {
        stitchedAddButton.classList.remove('hidden');
    }
    
    // 토글 스위치 변경 이벤트
    modeToggle.addEventListener('change', function() {
        if (this.checked) {
            // Checked = Stitched Image mode
            stitchedMode.classList.remove('hidden');
            individualMode.classList.add('hidden');
            
            // 기존 stitched 이미지가 있으면 + 버튼 숨기기
            const existingStitchedImage = stitchedMode.querySelector('.stitched_preview.existing_image');
            const stitchedAddButton = stitchedMode.querySelector('.add_image');
            if (existingStitchedImage && stitchedAddButton) {
                stitchedAddButton.classList.add('hidden');
                } else if (stitchedAddButton) {
                stitchedAddButton.classList.remove('hidden');
            }
        } else {
            // Unchecked = Individual Images mode
            stitchedMode.classList.add('hidden');
            individualMode.classList.remove('hidden');
            
            // Individual 모드에서는 + 버튼을 항상 표시 (추가 이미지 업로드 가능)
            const individualAddButton = individualMode.querySelector('.add_image');
            if (individualAddButton) {
                individualAddButton.classList.remove('hidden');
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
        const file = document.querySelector('.file_uploader_stitched').files[0];
        if (!file) {
        return;
    }
    
    const container = document.querySelector('#stitched_mode');
        
    // 기존 미리보기 제거
    const existingPreview = container.querySelector('.stitched_preview');
        if (existingPreview) {
        existingPreview.remove();
    }
    
    // + 버튼 숨기기
    const addButton = container.querySelector('.add_image');
    if (addButton) {
        addButton.classList.add('hidden');
    }
    
    // 새로운 stitched 전용 미리보기 생성
    const preview = document.createElement('div');
    preview.className = 'stitched_preview';
    
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    
    // 섹션 개수 정보 표시
    const sectionInfo = document.createElement('div');
    sectionInfo.className = 'section_info';
    const sectionCountElement = document.querySelector('input[name="section_count"]:checked');
    const sectionCount = sectionCountElement ? sectionCountElement.value : '2';
    sectionInfo.textContent = `${sectionCount} sections`;
    
    preview.appendChild(img);
    preview.appendChild(sectionInfo);
    
    // + 버튼이 있던 위치에 삽입
    if (addButton && addButton.parentNode) {
        addButton.parentNode.insertBefore(preview, addButton);
    } else {
        container.appendChild(preview);
    }
    
    // section 선택 UI 표시
    const stitchedInfo = container.querySelector('.stitched_info');
    if (stitchedInfo) {
        stitchedInfo.style.display = 'block';
        stitchedInfo.classList.remove('hidden');
    }
    
    // 클릭시 제거하고 + 버튼 다시 표시
    preview.addEventListener('click', () => {
        preview.remove();
        if (addButton) {
            addButton.classList.remove('hidden');
        }
        // section 선택 UI 숨기기
        const stitchedInfo = container.querySelector('.stitched_info');
        if (stitchedInfo) {
            stitchedInfo.style.display = 'none';
            stitchedInfo.classList.add('hidden');
        }
        const fileInput = document.querySelector('.file_uploader_stitched');
        if (fileInput) {
            fileInput.value = '';
        }
    });
}

// Individual 이미지 전역 변수
let individualImages = [];
let mainImageIndex = 0;

// 랜딩 페이지 캐러셀 초기화 함수
function initLandingCarousel() {
    
    // fallback 데이터 (API 실패시에만 사용)
    const fallbackData = {
        items: [
            {
                item_id: 1,
                brand: 'Item 1',
                images: [],
                thumbnail_url: null
            },
            {
                item_id: 2,
                brand: 'Item 2', 
                images: [],
                thumbnail_url: null
            },
            {
                item_id: 3,
                brand: 'Item 3',
                images: [],
                thumbnail_url: null
            },
            {
                item_id: 4,
                brand: 'Item 4',
                images: [],
                thumbnail_url: null
            }
        ]
    };
    
    // 실제 API 호출 시도
    fetch('/api/items')
        .then(response => {
            console.log('API response status:', response.status);
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            processCarouselData(data);
        })
        .catch(error => {
            console.error('❌ API failed, using fallback data:', error);
            processCarouselData(fallbackData);
        });
}

function processCarouselData(data) {
            if (data.items && data.items.length > 0) {
                // 랜덤하게 아이템들을 섞기
                const shuffledItems = [...data.items].sort(() => 0.5 - Math.random());
                
                // 최대 8개 아이템만 사용 (무한 스크롤을 위해 복제할 예정)
                const maxItems = Math.min(8, shuffledItems.length);
                const selectedItems = shuffledItems.slice(0, maxItems);
                
                // 캐러셀 트랙 가져오기
                const carouselTrack = document.getElementById('carousel_track');
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
                        carouselItem.className = 'carousel_item';
                        
                        const img = document.createElement('img');
                        img.loading = 'eager'; // 캐러셀은 즉시 로드
                        img.decoding = 'async'; // 비동기 디코딩
                        
                        // 이미지 URL 결정
                        let imageUrl = null;
                        if (item.thumbnail_url) {
                            imageUrl = item.thumbnail_url;
                            console.log(`Using thumbnail for item ${item.item_id}:`, imageUrl);
                        } else if (item.images && item.images.length > 0) {
                            imageUrl = item.images[0];
                            console.log(`Using first image for item ${item.item_id}:`, imageUrl);
                        }
                        
                        if (imageUrl && imageUrl !== '/static/src/img/measurement/measurement_top.svg') {
                            // R2 이미지는 프록시를 통해 로드
                            if (imageUrl.includes('pub-d30acb5ff7c3432aad2e05bfbfd34c6d.r2.dev')) {
                                const filename = imageUrl.split('/').pop();
                                img.src = `/api/image-proxy/${filename}`;
                            } else {
                                img.src = imageUrl;
                            }
                        } else {
                            console.log(`No real image found for item ${item.item_id}, using color background`);
                            // 이미지가 없거나 measurement_top.svg이면 색상 배경 사용
                            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#8b4513'];
                            const colorIndex = index % colors.length; // 인덱스 기반으로 일관된 색상
                            carouselItem.classList.add(`color-bg-${['red', 'teal', 'blue', 'brown'][colorIndex]}`);
                            img.classList.add('hidden');
                        }
                        
                        // 이미지 로드 완료 시 부드러운 표시
                        img.onload = function() {
                            this.classList.add('image-loaded');
                        };
                        
                        img.onerror = function() {
                            console.error('❌ Landing carousel image failed to load:', this.src);
                            console.error('Error event details:', event);
                            
                            // CORS 문제일 수 있으니 crossOrigin 설정 시도
                            if (this.src.includes('pub-d30acb5ff7c3432aad2e05bfbfd34c6d.r2.dev') && !this.crossOrigin) {
                                console.log('Trying with crossOrigin="anonymous"');
                                this.crossOrigin = 'anonymous';
                                this.src = this.src; // 다시 로드 시도
                                return;
                            }
                            
                            // 다른 이미지가 있으면 시도
                            if (item.images && item.images.length > 1) {
                                for (let i = 1; i < item.images.length; i++) {
                                    if (this.src !== item.images[i]) {
                                        console.log(`Trying image ${i + 1}:`, item.images[i]);
                                        this.src = item.images[i];
                                        return;
                                    }
                                }
                            }
                            
                            // 모든 이미지 실패시 색상 배경
                            console.log('All images failed, showing colored placeholder');
                            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#8b4513'];
                            const colorIndex = index % colors.length;
                            this.parentElement.classList.add(`color-bg-${['red', 'teal', 'blue', 'brown'][colorIndex]}`);
                            this.classList.add('hidden');
                        };
                        
                        carouselItem.appendChild(img);
                        
                        // 캐러셀 아이템은 클릭 불가 (장식용)
                        
                        carouselTrack.appendChild(carouselItem);
                    });
                }
                
                
            } else {
                showFallbackCarousel();
            }
}

// setupInfiniteScroll 함수 제거됨 - CSS animation 사용

// 대체 캐러셀 (데이터 로딩 실패시)
function showFallbackCarousel() {
    const carouselTrack = document.getElementById('carousel_track');
    if (!carouselTrack) return;
    
    carouselTrack.innerHTML = '';
    
        
    // 플레이스홀더 아이템들 생성 (외부 이미지 사용)
    const placeholderImages = [
        'https://via.placeholder.com/300x400/ff6b6b/ffffff?text=Closet+1',
        'https://via.placeholder.com/300x400/4ecdc4/ffffff?text=Closet+2', 
        'https://via.placeholder.com/300x400/45b7d1/ffffff?text=Closet+3',
        'https://via.placeholder.com/300x400/f9ca24/ffffff?text=Closet+4'
    ];
    
    for (let round = 0; round < 2; round++) {
        placeholderImages.forEach((imgSrc, i) => {
            const carouselItem = document.createElement('div');
            carouselItem.className = 'carousel_item';
            
            const img = document.createElement('img');
            img.src = imgSrc;
            img.classList.add('small_radius');
            
            img.onload = function() {
            };
            
            img.onerror = function() {
                console.error('❌ Fallback image failed:', this.src);
                // 최후의 수단: 색상 박스
                this.classList.add('fallback-carousel_item', `color-bg-${['red', 'teal', 'blue', 'brown'][i % 4]}`);
                this.alt = `Placeholder ${i + 1}`;
            };
            
            carouselItem.appendChild(img);
            carouselTrack.appendChild(carouselItem);
        });
    }
    
    
}

// 검색 기능 초기화
// 검색 최적화를 위한 변수들
let searchCache = null;
let searchDebounceTimer = null;
let isSearchMode = false; // 검색 모드 상태 추적
const SEARCH_DEBOUNCE_DELAY = 300; // 300ms 디바운싱

function initializeSearch() {
    const searchInput = document.getElementById('form1');
    if (!searchInput) return;
    
    
    // 아이템 데이터 미리 로드
    preloadSearchData();
    
    // 검색 입력 이벤트 리스너 (디바운싱 적용)
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        // 기존 타이머 제거
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        
        if (query.length > 0) {
            // 디바운싱 적용: 300ms 후에 검색 실행
            searchDebounceTimer = setTimeout(() => {
                isSearchMode = true; // 검색 모드 설정
                performSearchOptimized(query);
            }, SEARCH_DEBOUNCE_DELAY);
        } else {
            // 검색어가 없으면 즉시 원래 아이템들 표시
            isSearchMode = false; // 검색 모드 해제
            displayRecentlyAdded();
        }
    });
    
    // Enter 키 이벤트 (즉시 실행)
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query.length > 0) {
                // Enter 키는 디바운싱 없이 즉시 실행
                if (searchDebounceTimer) {
                    clearTimeout(searchDebounceTimer);
                }
                isSearchMode = true; // 검색 모드 설정
                performSearchOptimized(query);
            }
        }
    });
}

// 검색 데이터 미리 로드 (캐싱)
function preloadSearchData() {
    if (searchCache !== null) {
        return Promise.resolve(searchCache);
    }
    
    return fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            if (data.items) {
                searchCache = data.items;
                return searchCache;
            }
            return [];
        })
        .catch(error => {
            console.error('❌ Failed to preload search data:', error);
            return [];
        });
}

// 최적화된 검색 함수 (캐시된 데이터 사용)
function performSearchOptimized(query) {
    
    // 캐시된 데이터가 있으면 즉시 검색, 없으면 로드
    const searchPromise = searchCache ? Promise.resolve(searchCache) : preloadSearchData();
    
    // UK/DE 검색 디버깅
    if ((query.toLowerCase().includes('uk') || query.toLowerCase().includes('de')) && searchCache && Array.isArray(searchCache)) {
        const searchRegion = query.toLowerCase().includes('uk') ? 'uk' : 'de';
        const regionItems = searchCache.filter(item => (item.sizeRegion || item.size_region)?.toLowerCase() === searchRegion);
    }
    
    searchPromise.then(items => {
        if (items && items.length > 0) {
            // 향상된 검색 필터링 (캐시된 데이터 사용)
            const filteredItems = items.filter(item => {
                const searchText = query.toLowerCase();
                const searchTerms = searchText.split(/\s+/).filter(term => term.length > 0);
                
                // 검색어를 타입별로 분류
                const measurementTerms = [];
                const compositionTerms = [];
                const generalTerms = [];
                
                searchTerms.forEach(term => {
                    const measurementMatch = checkMeasurementCondition(term, item);
                    const compositionMatch = checkCompositionSearch(term, item);
                    const colorMatch = checkColorSearch(term, item);
                    
                    if (measurementMatch !== null) {
                        measurementTerms.push({term, match: measurementMatch});
                    } else if (compositionMatch !== null) {
                        compositionTerms.push({term, match: compositionMatch});
                    } else if (colorMatch !== null) {
                        compositionTerms.push({term, match: colorMatch}); // color도 composition처럼 처리
                    } else {
                        generalTerms.push(term);
                    }
                });
                
                // 모든 measurement 조건이 만족되어야 함
                const measurementValid = measurementTerms.length === 0 || measurementTerms.every(m => m.match);
                
                // composition/color 조건 중 하나라도 만족하면 됨 (OR 조건)
                const compositionValid = compositionTerms.length === 0 || compositionTerms.some(c => c.match);
                
                // 일반 검색어들이 모두 포함되어야 함 (AND 조건)
                const generalValid = generalTerms.every(term => {
                    const lowerTerm = term.toLowerCase();
                    
                    // 카테고리는 정확한 매치를 위해 별도 처리
                    const categoryMatch = (() => {
                        const itemCategory = item.category?.toLowerCase() || '';
                        // 카테고리명에 대한 정확한 매치
                        if (lowerTerm === itemCategory) {
                            return true;
                        }
                        // 단어 경계를 고려한 매치 (카테고리가 복합어인 경우)
                        const categoryWords = itemCategory.split(/[\s_-]+/);
                        return categoryWords.includes(lowerTerm);
                    })();
                    
                    // 기본 필드 검색 (category 제외) - 디버그 로그 추가
                    const subcategoryMatch = item.subcategory?.toLowerCase().includes(lowerTerm);
                    const subcategory2Match = item.subcategory2?.toLowerCase().includes(lowerTerm);
                    const brandMatch = item.brand?.toLowerCase().includes(lowerTerm);
                    const sizeMatch = item.size?.toLowerCase().includes(lowerTerm);
                    const sizeRegionMatch = (item.sizeRegion || item.size_region)?.toLowerCase().includes(lowerTerm);
                    const tagsMatch = item.tags?.toLowerCase().includes(lowerTerm);
                    const colorMatch = item.color?.toLowerCase().includes(lowerTerm);
                    
                    const matches = [
                        categoryMatch,
                        subcategoryMatch,
                        subcategory2Match,
                        brandMatch,
                        sizeMatch,
                        sizeRegionMatch,
                        tagsMatch,
                        colorMatch,
                        // Season 처리는 별도로 진행
                    ];
                    
                    // Season 특별 처리: season 관련 검색어에만 매치
                    const seasonMatch = (() => {
                        const itemSeason = item.season?.toLowerCase() || '';
                        // "!all" 검색의 경우: "all"이 아닌 season만 매치
                        if (lowerTerm === '!all') {
                            return itemSeason !== 'all' && itemSeason !== '';
                        }
                        // season 관련 검색어들 - 실제 DB 값과 검색어 매핑
                        const seasonMapping = {
                            'spring': ['Spring/Fall', 'FW'], 
                            'fall': ['Spring/Fall', 'FW'],
                            'autumn': ['Spring/Fall', 'FW'],
                            'summer': ['Summer', 'Midsummer'],
                            'midsummer': ['Midsummer'],
                            'fw': ['FW'],
                            'winter': ['Winter', 'FW'],
                            'all': ['All']
                        };
                        const seasonKeywords = Object.keys(seasonMapping);
                        if (!seasonKeywords.includes(lowerTerm)) {
                            return false; // season 관련 검색어가 아니면 매치하지 않음
                        }
                        // "All" season은 "all" 검색어에만 매치
                        if (itemSeason === 'all') {
                            return lowerTerm === 'all';
                        }
                        // 일반 season 매치 - 매핑된 값들과 비교
                        const mappedSeasons = seasonMapping[lowerTerm] || [];
                        return mappedSeasons.some(season => itemSeason.toLowerCase() === season.toLowerCase());
                    })();
                    
                    matches.push(seasonMatch);
                    
                    // Region+Size 조합 검색 추가 (공백 있는 버전과 없는 버전 모두 확인)
                    const regionSizeCombinationSpaced = `${item.sizeRegion || item.size_region || ''} ${item.size || ''}`.toLowerCase();
                    const regionSizeCombinationNoSpace = `${item.sizeRegion || item.size_region || ''}${item.size || ''}`.toLowerCase();
                    matches.push(regionSizeCombinationSpaced.includes(lowerTerm));
                    matches.push(regionSizeCombinationNoSpace.includes(lowerTerm));
                    
                    // 'dress' 검색 시 어떤 필드가 매치되는지 디버깅
                    if (lowerTerm === 'dress') {
                        const anyMatch = matches.some(match => match);
                        if (anyMatch) {
                            const matchingFields = matches.map((match, index) => ({
                                field: ['category', 'subcategory', 'subcategory2', 'brand', 'size', 'sizeRegion', 'tags', 'color', 'season', 'regionSizeSpaced', 'regionSizeNoSpace'][index],
                                match
                            })).filter(f => f.match);
                            
                            // 잘못된 매치 상세 로그 (dress가 아닌 카테고리)
                            if (item.category !== 'dress') {
                                console.warn(`❌ 잘못된 매치! ${item.category} 아이템이 dress 검색에 매치됨:`, {
                                    item_id: item.item_id,
                                    category: item.category,
                                    brand: item.brand,
                                    subcategory: item.subcategory,
                                    size: item.size,
                                    sizeRegion: item.sizeRegion || item.size_region,
                                    tags: item.tags,
                                    color: item.color,
                                    season: item.season,
                                    매치된필드들: matchingFields.map(f => `${f.field}: ${f.match}`).join(', ')
                                });
                            }
                        }
                    }
                    
                    return matches.some(match => match);
                });
                
                return measurementValid && compositionValid && generalValid;
            });
            
            
            displaySearchResults(filteredItems, query);
        } else {
            displaySearchResults([], query);
        }
    }).catch(error => {
        console.error('❌ Search error:', error);
        displaySearchResults([], query);
    });
}

// All.html 페이지용 검색 초기화 (최적화 적용)
function initializeSearchForAll() {
    const searchInput = document.getElementById('form1');
    if (!searchInput) return;
    
    
    // 아이템 데이터 미리 로드
    preloadSearchData();
    
    // 검색 입력 이벤트 리스너 (디바운싱 적용)
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        // 기존 타이머 제거
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        
        if (query.length > 0) {
            // 디바운싱 적용: 300ms 후에 검색 실행
            searchDebounceTimer = setTimeout(() => {
                isSearchMode = true; // 검색 모드 설정
                performSearchForAllOptimized(query);
            }, SEARCH_DEBOUNCE_DELAY);
        } else {
            // 검색어가 없으면 즉시 모든 아이템 표시
            isSearchMode = false; // 검색 모드 해제
            displayAllItems();
        }
    });
    
    // Enter 키 이벤트 (즉시 실행)
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query.length > 0) {
                // Enter 키는 디바운싱 없이 즉시 실행
                if (searchDebounceTimer) {
                    clearTimeout(searchDebounceTimer);
                }
                isSearchMode = true; // 검색 모드 설정
                performSearchForAllOptimized(query);
            }
        }
    });
}

// All.html용 최적화된 검색 함수 (캐시된 데이터 사용)
function performSearchForAllOptimized(query) {
    
    // 캐시된 데이터가 있으면 즉시 검색, 없으면 로드
    const searchPromise = searchCache ? Promise.resolve(searchCache) : preloadSearchData();
    
    searchPromise.then(items => {
        if (items && items.length > 0) {
            // 향상된 검색 필터링 (캐시된 데이터 사용)
            const filteredItems = items.filter(item => {
                const searchText = query.toLowerCase();
                const searchTerms = searchText.split(/\s+/).filter(term => term.length > 0);
                
                // 검색어를 타입별로 분류
                const measurementTerms = [];
                const compositionTerms = [];
                const generalTerms = [];
                
                searchTerms.forEach(term => {
                    const measurementMatch = checkMeasurementCondition(term, item);
                    const compositionMatch = checkCompositionSearch(term, item);
                    const colorMatch = checkColorSearch(term, item);
                    
                    if (measurementMatch !== null) {
                        measurementTerms.push({term, match: measurementMatch});
                    } else if (compositionMatch !== null) {
                        compositionTerms.push({term, match: compositionMatch});
                    } else if (colorMatch !== null) {
                        compositionTerms.push({term, match: colorMatch}); // color도 composition처럼 처리
                    } else {
                        generalTerms.push(term);
                    }
                });
                
                // 모든 measurement 조건이 만족되어야 함
                const measurementValid = measurementTerms.length === 0 || measurementTerms.every(m => m.match);
                
                // composition/color 조건 중 하나라도 만족하면 됨 (OR 조건)
                const compositionValid = compositionTerms.length === 0 || compositionTerms.some(c => c.match);
                
                // 일반 검색어들이 모두 포함되어야 함 (AND 조건)
                const generalValid = generalTerms.every(term => {
                    const lowerTerm = term.toLowerCase();
                    
                    // 카테고리는 정확한 매치를 위해 별도 처리
                    const categoryMatch = (() => {
                        const itemCategory = item.category?.toLowerCase() || '';
                        // 카테고리명에 대한 정확한 매치
                        if (lowerTerm === itemCategory) {
                            return true;
                        }
                        // 단어 경계를 고려한 매치 (카테고리가 복합어인 경우)
                        const categoryWords = itemCategory.split(/[\s_-]+/);
                        return categoryWords.includes(lowerTerm);
                    })();
                    
                    // 기본 필드 검색 (category 제외) - 디버그 로그 추가
                    const subcategoryMatch = item.subcategory?.toLowerCase().includes(lowerTerm);
                    const subcategory2Match = item.subcategory2?.toLowerCase().includes(lowerTerm);
                    const brandMatch = item.brand?.toLowerCase().includes(lowerTerm);
                    const sizeMatch = item.size?.toLowerCase().includes(lowerTerm);
                    const sizeRegionMatch = (item.sizeRegion || item.size_region)?.toLowerCase().includes(lowerTerm);
                    const tagsMatch = item.tags?.toLowerCase().includes(lowerTerm);
                    const colorMatch = item.color?.toLowerCase().includes(lowerTerm);
                    
                    const matches = [
                        categoryMatch,
                        subcategoryMatch,
                        subcategory2Match,
                        brandMatch,
                        sizeMatch,
                        sizeRegionMatch,
                        tagsMatch,
                        colorMatch,
                        // Season 처리는 별도로 진행
                    ];
                    
                    // Season 특별 처리: season 관련 검색어에만 매치
                    const seasonMatch = (() => {
                        const itemSeason = item.season?.toLowerCase() || '';
                        // "!all" 검색의 경우: "all"이 아닌 season만 매치
                        if (lowerTerm === '!all') {
                            return itemSeason !== 'all' && itemSeason !== '';
                        }
                        // season 관련 검색어들 - 실제 DB 값과 검색어 매핑
                        const seasonMapping = {
                            'spring': ['Spring/Fall', 'FW'], 
                            'fall': ['Spring/Fall', 'FW'],
                            'autumn': ['Spring/Fall', 'FW'],
                            'summer': ['Summer', 'Midsummer'],
                            'midsummer': ['Midsummer'],
                            'fw': ['FW'],
                            'winter': ['Winter', 'FW'],
                            'all': ['All']
                        };
                        const seasonKeywords = Object.keys(seasonMapping);
                        if (!seasonKeywords.includes(lowerTerm)) {
                            return false; // season 관련 검색어가 아니면 매치하지 않음
                        }
                        // "All" season은 "all" 검색어에만 매치
                        if (itemSeason === 'all') {
                            return lowerTerm === 'all';
                        }
                        // 일반 season 매치 - 매핑된 값들과 비교
                        const mappedSeasons = seasonMapping[lowerTerm] || [];
                        return mappedSeasons.some(season => itemSeason.toLowerCase() === season.toLowerCase());
                    })();
                    
                    matches.push(seasonMatch);
                    
                    // Region+Size 조합 검색 추가 (공백 있는 버전과 없는 버전 모두 확인)
                    const regionSizeCombinationSpaced = `${item.sizeRegion || item.size_region || ''} ${item.size || ''}`.toLowerCase();
                    const regionSizeCombinationNoSpace = `${item.sizeRegion || item.size_region || ''}${item.size || ''}`.toLowerCase();
                    matches.push(regionSizeCombinationSpaced.includes(lowerTerm));
                    matches.push(regionSizeCombinationNoSpace.includes(lowerTerm));
                    
                    // 'dress' 검색 시 어떤 필드가 매치되는지 디버깅
                    if (lowerTerm === 'dress') {
                        const anyMatch = matches.some(match => match);
                        if (anyMatch) {
                            const matchingFields = matches.map((match, index) => ({
                                field: ['category', 'subcategory', 'subcategory2', 'brand', 'size', 'sizeRegion', 'tags', 'color', 'season', 'regionSizeSpaced', 'regionSizeNoSpace'][index],
                                match
                            })).filter(f => f.match);
                            
                            // 잘못된 매치 상세 로그 (dress가 아닌 카테고리)
                            if (item.category !== 'dress') {
                                console.warn(`❌ 잘못된 매치! ${item.category} 아이템이 dress 검색에 매치됨:`, {
                                    item_id: item.item_id,
                                    category: item.category,
                                    brand: item.brand,
                                    subcategory: item.subcategory,
                                    size: item.size,
                                    sizeRegion: item.sizeRegion || item.size_region,
                                    tags: item.tags,
                                    color: item.color,
                                    season: item.season,
                                    매치된필드들: matchingFields.map(f => `${f.field}: ${f.match}`).join(', ')
                                });
                            }
                        }
                    }
                    
                    return matches.some(match => match);
                });
                
                return measurementValid && compositionValid && generalValid;
            });
            
            displaySearchResultsForAll(filteredItems, query);
        } else {
            displaySearchResultsForAll([], query);
        }
    }).catch(error => {
        console.error('❌ Search error:', error);
        displaySearchResultsForAll([], query);
    });
}

// 검색 캐시 초기화 함수 (새 아이템 추가 시 호출)
function clearSearchCache() {
    searchCache = null;
}

// 검색 상태 저장 함수
function saveSearchState(query) {
    const searchState = {
        query: query,
        timestamp: Date.now(),
        currentPage: window.location.pathname
    };
    localStorage.setItem('searchState', JSON.stringify(searchState));
}

// 검색 상태 복원 함수
function restoreSearchState() {
    const savedState = localStorage.getItem('searchState');
    if (savedState) {
        try {
            const searchState = JSON.parse(savedState);
            // 5분 이내의 검색 상태만 복원
            if (Date.now() - searchState.timestamp < 5 * 60 * 1000) {
                return searchState;
            } else {
                localStorage.removeItem('searchState');
            }
        } catch (error) {
            console.error('❌ 검색 상태 복원 실패:', error);
            localStorage.removeItem('searchState');
        }
    }
    return null;
}

// 검색 상태 삭제 함수
function clearSearchState() {
    localStorage.removeItem('searchState');
}

// 검색 캐시 강제 새로고침
function refreshSearchCache() {
    searchCache = null;
    return preloadSearchData();
}

// All.html용 검색 수행 (다중 키워드 및 region+size 조합 포함)
function performSearchForAll(query) {
    
    // 새로운 검색 시작 시 이전 검색 상태 삭제 (자동 복원이 아닌 경우)
    if (!window.isRestoringSearch) {
        clearSearchState();
    }
    
    fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            if (data.items) {
                // 향상된 검색 필터링 (measurement 조건, composition OR 조건, 다중 키워드 및 region+size 조합 포함)
                const filteredItems = data.items.filter(item => {
                    const searchText = query.toLowerCase();
                    const searchTerms = searchText.split(/\s+/).filter(term => term.length > 0);
                    
                    // 검색어를 타입별로 분류
                    const measurementTerms = [];
                    const compositionTerms = [];
                    const generalTerms = [];
                    
                    searchTerms.forEach(term => {
                        const measurementMatch = checkMeasurementCondition(term, item);
                        const compositionMatch = checkCompositionSearch(term, item);
                        const colorMatch = checkColorSearch(term, item);
                        
                        if (measurementMatch !== null) {
                            measurementTerms.push({term, match: measurementMatch});
                        } else if (compositionMatch !== null) {
                            compositionTerms.push({term, match: compositionMatch});
                        } else if (colorMatch !== null) {
                            compositionTerms.push({term, match: colorMatch}); // color도 composition처럼 처리
                        } else {
                            generalTerms.push(term);
                        }
                    });
                    
                    // Measurement 조건들은 모두 만족해야 함 (AND)
                    const measurementResult = measurementTerms.length === 0 || 
                        measurementTerms.every(mt => mt.match);
                    
                    // Composition 조건들은 하나라도 만족하면 됨 (OR)
                    const compositionResult = compositionTerms.length === 0 || 
                        compositionTerms.some(ct => ct.match);
                    
                    // 일반 검색어들은 모두 만족해야 함 (AND)
                    const generalResult = generalTerms.length === 0 || generalTerms.every(term => {
                        // 각 검색어가 어떤 필드든 하나라도 매치하면 됨
                        const fieldMatch = (
                            (item.brand && item.brand.toLowerCase().includes(term)) ||
                            (item.category && item.category.toLowerCase().includes(term)) ||
                            (item.subcategory && item.subcategory.toLowerCase().includes(term)) ||
                            (item.subcategory2 && item.subcategory2.toLowerCase().includes(term)) ||
                            (item.size && item.size.toLowerCase().includes(term)) ||
                            ((item.size_region || item.sizeRegion) && (item.size_region || item.sizeRegion).toLowerCase().includes(term))
                        );
                        
                        // Season 특별 처리: "all" season은 모든 검색에 포함, "!all"로 제외 가능
                        const seasonMatch = (() => {
                            const itemSeason = item.season?.toLowerCase() || '';
                            // "!all" 검색의 경우: "all"이 아닌 season만 매치
                            if (term === '!all') {
                                return itemSeason !== 'all' && itemSeason !== '';
                            }
                            // "all" season은 항상 매치 (단, "!all" 검색이 아닌 경우)
                            if (itemSeason === 'all') {
                                return true;
                            }
                            // 일반 season 매치 - 검색어를 실제 DB 값과 매핑
                            const seasonMapping = {
                                'spring': ['Spring/Fall', 'FW'], 
                                'fall': ['Spring/Fall', 'FW'],
                                'autumn': ['Spring/Fall', 'FW'],
                                'summer': ['Summer', 'Midsummer'],
                                'midsummer': ['Midsummer'],
                                'fw': ['FW'],
                                'winter': ['Winter', 'FW'],
                                'all': ['All']
                            };
                            const mappedSeasons = seasonMapping[term.toLowerCase()] || [];
                            return mappedSeasons.some(season => itemSeason.toLowerCase() === season.toLowerCase()) || 
                                   itemSeason.includes(term);
                        })();
                        
                        // Region+Size 조합 검색 (예: "IT38", "US2", "KR240")
                        const regionSizeMatch = (item.size_region || item.sizeRegion) && item.size && 
                            ((item.size_region || item.sizeRegion) + item.size).toLowerCase().includes(term);
                        
                        return fieldMatch || seasonMatch || regionSizeMatch;
                    });
                    
                    return measurementResult && compositionResult && generalResult;
                });
                
                console.log(`📊 Found ${filteredItems.length} items matching "${query}"`);
                displaySearchResultsForAll(filteredItems, query);
            }
        })
        .catch(error => {
            console.error('❌ Search error:', error);
        });
}

// All.html용 검색 결과 표시
function displaySearchResultsForAll(items, query) {
    const container = document.querySelector('.grid_container');
    const subheader = document.querySelector('.subheader h1');
    
    if (!container) return;
    
    // 헤더 업데이트
    if (subheader) {
        subheader.textContent = `search results for "${query}"`;
        // 400px 이하에서 검색 결과 헤더 숨김을 위한 클래스 추가
        subheader.closest('.subheader')?.classList.add('search-results');
    }
    
    // 기존 내용 제거
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = '<div class="no_items_message">No items found</div>';
        // Load More 버튼 숨기기
        const loadMoreBtn = document.getElementById('load_more_btn');
        if (loadMoreBtn) {
            loadMoreBtn.classList.remove('show', 'inline-block');
            loadMoreBtn.classList.add('hide');
        }
        return;
    }
    
    // 검색 모드에서는 Load More 버튼 숨기기 (검색 결과는 한번에 모두 표시)
    const loadMoreBtn = document.getElementById('load_more_btn');
    if (loadMoreBtn) {
        loadMoreBtn.classList.remove('show', 'inline-block');
        loadMoreBtn.classList.add('hide');
        loadMoreBtn.style.display = 'none'; // 강제로 숨기기
    } else {
    }
    
    // 검색 결과 아이템들 표시
    items.forEach(item => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid_item';
        
        const link = document.createElement('a');
        link.href = `/item.html?id=supabase_${item.item_id}`;
        
        // 검색 결과에서 아이템 클릭 시 검색 상태 저장
        link.addEventListener('click', function(e) {
            saveSearchState(query);
        });
        
        const img = document.createElement('img');
        
        // 이미지 URL 결정
        if (item.thumbnail_url) {
            img.src = item.thumbnail_url;
        } else if (item.images && item.images.length > 0) {
            img.src = item.images[0];
        } else {
            img.src = '/static/src/img/measurement/measurement_top.svg';
            img.classList.add('image_placeholder');
        }
        
        img.alt = item.brand || 'Item';
        img.loading = 'lazy';
        
        link.appendChild(img);
        gridItem.appendChild(link);
        container.appendChild(gridItem);
    });
}

// 검색 수행 (다중 키워드 및 region+size 조합 포함)
function performSearch(query) {
    
    // 새로운 검색 시작 시 이전 검색 상태 삭제 (자동 복원이 아닌 경우)
    if (!window.isRestoringSearch) {
        clearSearchState();
    }
    
    fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            if (data.items) {
                // 향상된 검색 필터링 (measurement 조건, composition OR 조건, 다중 키워드 및 region+size 조합 포함)
                const filteredItems = data.items.filter(item => {
                    const searchText = query.toLowerCase();
                    const searchTerms = searchText.split(/\s+/).filter(term => term.length > 0);
                    
                    // 검색어를 타입별로 분류
                    const measurementTerms = [];
                    const compositionTerms = [];
                    const generalTerms = [];
                    
                    searchTerms.forEach(term => {
                        const measurementMatch = checkMeasurementCondition(term, item);
                        const compositionMatch = checkCompositionSearch(term, item);
                        const colorMatch = checkColorSearch(term, item);
                        
                        if (measurementMatch !== null) {
                            measurementTerms.push({term, match: measurementMatch});
                        } else if (compositionMatch !== null) {
                            compositionTerms.push({term, match: compositionMatch});
                        } else if (colorMatch !== null) {
                            compositionTerms.push({term, match: colorMatch}); // color도 composition처럼 처리
                        } else {
                            generalTerms.push(term);
                        }
                    });
                    
                    // Measurement 조건들은 모두 만족해야 함 (AND)
                    const measurementResult = measurementTerms.length === 0 || 
                        measurementTerms.every(mt => mt.match);
                    
                    // Composition 조건들은 하나라도 만족하면 됨 (OR)
                    const compositionResult = compositionTerms.length === 0 || 
                        compositionTerms.some(ct => ct.match);
                    
                    // 일반 검색어들은 모두 만족해야 함 (AND)
                    const generalResult = generalTerms.length === 0 || generalTerms.every(term => {
                        // 각 검색어가 어떤 필드든 하나라도 매치하면 됨
                        const fieldMatch = (
                            (item.brand && item.brand.toLowerCase().includes(term)) ||
                            (item.category && item.category.toLowerCase().includes(term)) ||
                            (item.subcategory && item.subcategory.toLowerCase().includes(term)) ||
                            (item.subcategory2 && item.subcategory2.toLowerCase().includes(term)) ||
                            (item.size && item.size.toLowerCase().includes(term)) ||
                            ((item.size_region || item.sizeRegion) && (item.size_region || item.sizeRegion).toLowerCase().includes(term))
                        );
                        
                        // Season 특별 처리: "all" season은 모든 검색에 포함, "!all"로 제외 가능
                        const seasonMatch = (() => {
                            const itemSeason = item.season?.toLowerCase() || '';
                            // "!all" 검색의 경우: "all"이 아닌 season만 매치
                            if (term === '!all') {
                                return itemSeason !== 'all' && itemSeason !== '';
                            }
                            // "all" season은 항상 매치 (단, "!all" 검색이 아닌 경우)
                            if (itemSeason === 'all') {
                                return true;
                            }
                            // 일반 season 매치 - 검색어를 실제 DB 값과 매핑
                            const seasonMapping = {
                                'spring': ['Spring/Fall', 'FW'], 
                                'fall': ['Spring/Fall', 'FW'],
                                'autumn': ['Spring/Fall', 'FW'],
                                'summer': ['Summer', 'Midsummer'],
                                'midsummer': ['Midsummer'],
                                'fw': ['FW'],
                                'winter': ['Winter', 'FW'],
                                'all': ['All']
                            };
                            const mappedSeasons = seasonMapping[term.toLowerCase()] || [];
                            return mappedSeasons.some(season => itemSeason.toLowerCase() === season.toLowerCase()) || 
                                   itemSeason.includes(term);
                        })();
                        
                        // Region+Size 조합 검색 (예: "IT38", "US2", "KR240")
                        const regionSizeMatch = (item.size_region || item.sizeRegion) && item.size && 
                            ((item.size_region || item.sizeRegion) + item.size).toLowerCase().includes(term);
                        
                        return fieldMatch || seasonMatch || regionSizeMatch;
                    });
                    
                    return measurementResult && compositionResult && generalResult;
                });
                
                console.log(`📊 Found ${filteredItems.length} items matching "${query}"`);
                
                // 검색 결과 표시
                displaySearchResults(filteredItems, query);
            }
        })
        .catch(error => {
            console.error('❌ Search error:', error);
        });
}

// Measurement 조건 체크 함수 (chest<40, length>50, waist>=35 등)
function checkMeasurementCondition(term, item) {
    // Measurement 조건 패턴 매칭: measurement + operator + value
    // 지원하는 패턴: chest<40, length>50, waist>=35, shoulder<=45, sleeve=60
    const measurementPattern = /^([a-z_]+)(>=|<=|>|<|=)(\d+(?:\.\d+)?)$/;
    const match = term.match(measurementPattern);
    
    if (!match) {
        return null; // measurement 조건이 아님
    }
    
    const [, measurementName, operator, valueStr] = match;
    const targetValue = parseFloat(valueStr);
    
    console.log(`🔍 Checking measurement condition: ${measurementName} ${operator} ${targetValue}`);
    
    // 아이템에서 measurement 값 가져오기
    let itemValue = null;
    
    // Try direct field access first
    if (item[measurementName] !== undefined && item[measurementName] !== null) {
        itemValue = parseFloat(item[measurementName]);
    }
    // Try measurements object access
    else if (item.measurements && item.measurements[measurementName] !== undefined) {
        itemValue = parseFloat(item.measurements[measurementName]);
    }
    
    if (isNaN(itemValue) || itemValue <= 0) {
        console.log(`❌ No valid ${measurementName} value found for item`);
        return false; // measurement 값이 없으면 조건 불만족
    }
    
    // 조건 확인
    let conditionMet = false;
    switch (operator) {
        case '<':
            conditionMet = itemValue < targetValue;
            break;
        case '<=':
            conditionMet = itemValue <= targetValue;
            break;
        case '>':
            conditionMet = itemValue > targetValue;
            break;
        case '>=':
            conditionMet = itemValue >= targetValue;
            break;
        case '=':
            conditionMet = Math.abs(itemValue - targetValue) < 0.1; // 약간의 오차 허용
            break;
        default:
            return false;
    }
    
    console.log(`📐 Item ${measurementName}: ${itemValue} ${operator} ${targetValue} = ${conditionMet}`);
    return conditionMet;
}

// Composition 검색 함수 (cotton, silk, leather 등)
function checkCompositionSearch(term, item) {
    // db.js의 원본 compositionList 사용 (임의 데이터 생성 금지)
    if (typeof compositionList === 'undefined') {
        console.log('⚠️ compositionList not available, skipping composition search');
        return null;
    }
    
    // Size region 우선 처리: DE, UK, US, FR, IT 등은 composition 검색에서 제외
    const sizeRegions = ['WW', 'US', 'EU', 'FR', 'IT', 'DE', 'UK', 'KR', 'JP', 'Kids', 'Ring', 'etc'];
    const isRegionTerm = sizeRegions.some(region => 
        term.toLowerCase() === region.toLowerCase()
    );
    
    if (isRegionTerm) {
        return null; // region 검색이므로 composition 검색에서 제외
    }
    
    // 검색어가 composition 재료가 아니면 null 반환 (일반 텍스트 검색으로 처리)
    const isCompositionTerm = compositionList.some(comp => 
        term.toLowerCase().includes(comp.toLowerCase()) || comp.toLowerCase().includes(term.toLowerCase())
    );
    
    if (!isCompositionTerm) {
        return null; // composition 검색이 아님
    }
    
    console.log(`🧵 Checking composition search for material: "${term}"`);
    
    // compositions 필드가 없으면 false 반환 (composition 검색이지만 데이터 없음)
    if (!item.compositions) {
        console.log(`❌ No compositions data for item`);
        return false;
    }
    
    console.log(`🧵 Item compositions:`, item.compositions);
    
    // compositions가 객체 형태인지 확인
    if (typeof item.compositions === 'object' && item.compositions !== null) {
        // 재귀적으로 모든 composition 데이터를 검색하는 함수
        function searchInCompositions(obj) {
            for (const [key, value] of Object.entries(obj)) {
                // 키 자체가 소재 이름인 경우 (예: cotton, polyester)
                if (key.toLowerCase().includes(term.toLowerCase()) || term.toLowerCase().includes(key.toLowerCase())) {
                    return true;
                }
                
                // 값이 또 다른 객체인 경우 재귀적으로 검색 (composition set 처리)
                if (typeof value === 'object' && value !== null) {
                    if (searchInCompositions(value)) {
                        return true;
                    }
                }
                
                // 값이 문자열인 경우 검색
                if (typeof value === 'string') {
                    if (value.toLowerCase().includes(term.toLowerCase()) || term.toLowerCase().includes(value.toLowerCase())) {
                        return true;
                    }
                }
            }
            return false;
        }
        
        if (searchInCompositions(item.compositions)) {
            return true;
        }
    }
    
    // compositions가 배열이나 문자열 형태인 경우도 처리
    if (Array.isArray(item.compositions)) {
        const hasComposition = item.compositions.some(comp => 
            comp.toLowerCase().includes(term.toLowerCase()) || term.toLowerCase().includes(comp.toLowerCase())
        );
        if (hasComposition) {
            return true;
        }
    }
    
    if (typeof item.compositions === 'string') {
        const hasComposition = item.compositions.toLowerCase().includes(term.toLowerCase()) || 
                              term.toLowerCase().includes(item.compositions.toLowerCase());
        if (hasComposition) {
            return true;
        }
    }
    
    // composition 검색이지만 매치되지 않음
    console.log(`❌ No composition match found for "${term}"`);
    return false;
}

// Color 검색 함수 (black, red, blue 등)
function checkColorSearch(term, item) {
    // db.js의 원본 colorList 사용
    if (typeof colorList === 'undefined') {
        console.log('⚠️ colorList not available, skipping color search');
        return null;
    }
    
    // 검색어가 color가 아니면 null 반환 (일반 텍스트 검색으로 처리)
    const isColorTerm = colorList.some(color => 
        term.toLowerCase().includes(color.label.toLowerCase()) || color.label.toLowerCase().includes(term.toLowerCase())
    );
    
    if (!isColorTerm) {
        return null; // color 검색이 아님
    }
    
    console.log(`🎨 Checking color search for: "${term}"`);
    
    // color 필드가 없으면 false 반환 (color 검색이지만 데이터 없음)
    if (!item.color) {
        console.log(`❌ No color data for item`);
        return false;
    }
    
    console.log(`🎨 Item color:`, item.color);
    
    // color 필드에서 검색 (쉼표로 구분된 색상들)
    const itemColors = item.color.split(',').map(color => color.trim().toLowerCase());
    const hasColorMatch = itemColors.some(itemColor => 
        itemColor.includes(term.toLowerCase()) || term.toLowerCase().includes(itemColor)
    );
    
    if (hasColorMatch) {
        return true;
    }
    
    // color 검색이지만 매치되지 않음
    console.log(`❌ No color match found for "${term}"`);
    return false;
}

// 검색 결과 표시
function displaySearchResults(items, query) {
    const container = document.querySelector('.grid_container');
    const subheader = document.querySelector('.subheader h1');
    
    if (!container) return;
    
    // 헤더 업데이트
    if (subheader) {
        subheader.textContent = `search results for "${query}"`;
        // 400px 이하에서 검색 결과 헤더 숨김을 위한 클래스 추가
        subheader.closest('.subheader')?.classList.add('search-results');
    }
    
    // 기존 내용 제거
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = '<div class="no_items_message">No items found</div>';
        // Load More 버튼 숨기기
        const loadMoreBtn = document.getElementById('load_more_btn');
        if (loadMoreBtn) {
            loadMoreBtn.classList.remove('show', 'inline-block');
            loadMoreBtn.classList.add('hide');
        }
        return;
    }
    
    // 검색 모드에서는 Load More 버튼 숨기기 (검색 결과는 한번에 모두 표시)
    const loadMoreBtn = document.getElementById('load_more_btn');
    if (loadMoreBtn) {
        loadMoreBtn.classList.remove('show', 'inline-block');
        loadMoreBtn.classList.add('hide');
        loadMoreBtn.style.display = 'none'; // 강제로 숨기기
    } else {
    }
    
    // 검색 결과 아이템들 표시
    items.forEach(item => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid_item';
        
        const link = document.createElement('a');
        link.href = `/item.html?id=supabase_${item.item_id}`;
        
        // index.html 검색 결과에서 아이템 클릭 시 검색 상태 저장
        link.addEventListener('click', function(e) {
            saveSearchState(query);
        });
        
        const img = document.createElement('img');
        
        // 이미지 URL 결정
        if (item.thumbnail_url) {
            img.src = item.thumbnail_url;
        } else if (item.images && item.images.length > 0) {
            img.src = item.images[0];
        } else {
            img.src = '/static/src/img/measurement/measurement_top.svg';
            img.classList.add('image_placeholder');
        }
        
        img.alt = item.brand || 'Item';
        img.loading = 'lazy';
        
        link.appendChild(img);
        gridItem.appendChild(link);
        container.appendChild(gridItem);
    });
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
    
    // 이미지 모드 토글 설정 - 페이지 로드 시 바로 설정
    setupImageModeToggle();
    
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
    console.log('🏷️ Item tags debug:', {
        tags: item.tags,
        type: typeof item.tags,
        stringified: JSON.stringify(item.tags)
    });
    
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
                        
                        // 서브카테고리 필드 생성
                        displayFilterSubCategory(item.category);
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
                    
                    // 서브카테고리 설정 후 measurement 필드 업데이트
                    setTimeout(() => {
                        const categoryKey = buildCategoryKey(item.category, item.subcategory, item.subcategory2);
                        console.log('🔧 Updating measurements for categoryKey:', categoryKey);
                        displayMeasurementInput(categoryKey);
                    }, 100);
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
                
                // 서브카테고리2 설정 후 measurement 필드 업데이트
                setTimeout(() => {
                    const categoryKey = buildCategoryKey(item.category, item.subcategory, item.subcategory2);
                    console.log('🔧 Updating measurements for categoryKey:', categoryKey);
                    displayMeasurementInput(categoryKey);
                }, 100);
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
                            etcInput.classList.add('size_etc_input_visible');
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
    
    // 측정 데이터 입력 (서브카테고리 설정 후에 실행)
    if (item.measurements) {
        let measurements = item.measurements;
        if (typeof measurements === 'string') {
            try {
                measurements = JSON.parse(measurements);
            } catch (e) {
                console.error('Error parsing measurements:', e);
            }
        }
        
        // 서브카테고리 설정 완료 후 measurement 데이터 복원
        setTimeout(() => {
            console.log('🔧 Restoring measurement data:', measurements);
            const measurementInputs = document.querySelectorAll('.measurement_input');
            console.log('🔧 Found measurement inputs:', measurementInputs.length);
            measurementInputs.forEach(input => {
                const label = input.parentElement.querySelector('.part');
                if (label && measurements[label.textContent]) {
                    input.value = measurements[label.textContent];
                }
            });
        }, 800); // 서브카테고리 설정과 measurement 필드 재생성 후에 실행
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
                        }
                    });
                });
            } else if (typeof compositions === 'object' && compositions !== null) {
                console.log('🧪 Populating object-type compositions:', compositions);
                
                // multi-set composition인지 확인 (첫 번째 값이 객체인지 체크)
                const firstKey = Object.keys(compositions)[0];
                const isMultiSet = firstKey && typeof compositions[firstKey] === 'object';
                
                if (isMultiSet) {
                    console.log('🧪 Detected multi-set compositions, using loadExistingCompositions...');
                    loadExistingCompositions(compositions);
                    
                } else {
                    // 단일 객체 형태 (퍼센테이지)
                    compositionInputs.forEach(input => {
                        const label = input.parentElement.querySelector('.part');
                        if (label) {
                            const material = label.textContent.trim();
                            if (compositions[material]) {
                                input.value = compositions[material];
                            }
                        }
                    });
                }
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
    
    // Tags 데이터 채우기 (다른 필드 설정 후에 실행)
    console.log('🏷️ Checking if item has tags:', !!item.tags, 'Value:', item.tags);
    if (item.tags) {
        setTimeout(() => {
            console.log('🏷️ Restoring tags:', item.tags);
            const tagsArray = item.tags.split(', ').map(tag => tag.trim());
            console.log('🏷️ Parsed tags array:', tagsArray);
            
            // 기존 체크된 태그들 초기화
            const allTagCheckboxes = document.querySelectorAll('input[name="tags"]');
            allTagCheckboxes.forEach(checkbox => checkbox.checked = false);
            
            tagsArray.forEach(tag => {
                const checkbox = document.querySelector(`input[name="tags"][value="${tag}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                } else {
                    console.log(`❌ Tag checkbox not found for: ${tag}`);
                    const availableValues = Array.from(allTagCheckboxes).map(cb => cb.value);
                    console.log(`🏷️ Available checkbox values:`, availableValues);
                }
            });
        }, 900); // measurement 복원 후에 실행
    } else {
        console.log('🏷️ No tags found in item data');
    }
    
    // Color 데이터 채우기 (멀티 셀렉트)
    console.log('🎨 Checking if item has color:', !!item.color, 'Value:', item.color);
    if (item.color) {
        setTimeout(() => {
            console.log('🎨 Restoring colors:', item.color);
            // 쉼표로 구분된 색상들을 분리
            const colorArray = item.color.split(',').map(color => color.trim());
            console.log('🎨 Parsed color array:', colorArray);
            
            colorArray.forEach(color => {
                const colorOption = document.querySelector(`.color_option[data-color="${color}"]`);
                if (colorOption) {
                    colorOption.classList.add('selected');
                } else {
                    console.log('❌ Color option not found for:', color);
                }
            });
        }, 500); // color 필드가 생성된 후에 실행
    } else {
        console.log('ℹ️ No color found in item data');
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
        stitchedMode.classList.remove('hidden');
        individualMode.classList.add('hidden');
        
        const addImage = stitchedMode.querySelector('.add_image');
        const preview = document.createElement('div');
        preview.className = 'stitched_preview existing_image';
        preview.setAttribute('data_image_urls', JSON.stringify(images));
        preview.innerHTML = `
            <img src="${images[0]}" alt="Stitched image preview">
            <div class="section_info">Stitched Image (${images.length} sections) - Click to remove</div>
        `;
        
        // + 업로드 버튼 숨기기 (기존 이미지가 있으므로)
        addImage.classList.add('hidden');
        console.log('🖼️ Hiding add image button - existing stitched image displayed');
        
        // 클릭 이벤트 추가: stitched 이미지 삭제 기능
        preview.addEventListener('click', () => {
            // 모든 섹션 이미지 제거
            const imageUrls = JSON.parse(preview.getAttribute('data_image_urls'));
            
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
            addImage.classList.remove('hidden');
            console.log('➕ Showing add image button - stitched image removed');
            
            preview.remove();
            console.log('🗑️ Existing stitched images removed:', imageUrls);
        });
        
        addImage.before(preview);
    } else {
        // Individual 모드로 표시 (toggle switch unchecked)
        const imageModeToggle = document.getElementById('image_mode_switch');
        if (imageModeToggle) imageModeToggle.checked = false;
        stitchedMode.classList.add('hidden');
        individualMode.classList.remove('hidden');
        
        const addImage = individualMode.querySelector('.add_image');
        
        // Individual 모드에서는 기존 이미지가 있어도 + 버튼을 유지 (추가 이미지 업로드 가능)
        console.log('🖼️ Keeping add image button visible - additional individual images can be uploaded');
        
        images.forEach((imageUrl, index) => {
            const preview = document.createElement('div');
            preview.className = 'preview_image existing_image';
            preview.setAttribute('data_image_url', imageUrl);
            if (index === 0) preview.classList.add('main_image');
            
            const img = document.createElement('img');
            img.src = imageUrl;
            
            const badge = document.createElement('div');
            badge.className = 'main_image_badge';
            badge.textContent = 'MAIN';
            if (index === 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
            
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
                        if (nextBadge) nextBadge.classList.remove('hidden');
                    }
                }
                
                // 기존 이미지 제거
                const removedUrl = preview.getAttribute('data_image_url');
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
                    stitchedMode.classList.remove('hidden');
                    individualMode.classList.add('hidden');
                }
            });
            
            addImage.before(preview);
        });
    }
}

// 편집 폼 제출 함수
function submitEditForm(event) {
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    let itemId = urlParams.get('id');
    
    if (!itemId) {
        alert('아이템 ID를 찾을 수 없습니다.');
        return;
    }
    
    // supabase_ 접두사 제거 (실제 DB에는 숫자만 저장됨)
    if (itemId.startsWith('supabase_')) {
        itemId = itemId.replace('supabase_', '');
    }
    
    // 기존 submitForm 로직을 재사용하되, 업데이트용으로 수정
    const formData = collectEditFormData();
    
    if (!formData) {
        return; // 유효성 검사 실패
    }
    
    // 아이템 ID 추가
    formData.append('item_id', itemId);
    
    // 서버로 업데이트 요청
    const token = localStorage.getItem('userToken');
    
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // FormData 전체 내용 디버깅
    console.log('🔍 Complete FormData contents before sending:');
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
    fetch('/update_item', {
        method: 'POST',
        body: formData,
        headers: headers
    })
    .then(response => {
        // 먼저 텍스트로 응답을 받아서 로깅
        return response.text().then(text => {
            // 응답이 비어있는지 확인
            if (!text.trim()) {
                throw new Error('Server returned empty response');
            }
            
            // JSON 파싱 시도
            try {
                return JSON.parse(text);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error(`Invalid JSON response: ${parseError.message}`);
            }
        });
    })
    .then(data => {
        if (data.error) {
            console.error('Server error:', data.error);
            alert('서버 오류: ' + data.error);
            return;
        }
        
        // 검색 캐시 클리어 (아이템이 업데이트되었으므로)
        clearSearchCache();
        // 아이템 상세 페이지로 돌아가기 (supabase_ 접두사 추가)
        const redirectId = itemId.toString().startsWith('supabase_') ? itemId : `supabase_${itemId}`;
        window.location.href = `/item.html?id=${redirectId}`;
    })
    .catch(error => {
        console.error('Network/Parse error:', error);
        alert('네트워크 오류가 발생했습니다: ' + error.message);
    });
}

// 삭제된 이미지를 추적하기 위한 전역 변수
window.deletedImageUrls = window.deletedImageUrls || [];

// 편집 폼 데이터 수집 (submitForm과 유사하지만 이미지는 선택사항)
function collectEditFormData() {
    const formData = new FormData();
    
    // 이미지 모드 확인 (새 이미지가 있는 경우에만 추가)
    const imageModeToggle = document.getElementById('image_mode_switch');
    const mode = imageModeToggle && imageModeToggle.checked ? 'stitched' : 'individual';
    
    let hasNewImages = false;
    
    if (mode === 'stitched') {
        const stitchedFile = document.querySelector('.file_uploader_stitched').files[0];
        if (stitchedFile) {
            formData.append('stitched_image', stitchedFile);
            const sectionCount = document.querySelector('input[name="section_count"]:checked').value;
            formData.append('section_count', sectionCount);
            formData.append('image_mode', mode);
            hasNewImages = true;
        } else {
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
        // etc region 선택 시 라디오 버튼 먼저 확인, 없으면 텍스트 입력창 확인
        const sizeInput = document.querySelector('input[name="size_key"]:checked');
        if (sizeInput) {
            // 라디오 버튼(1, 2) 선택된 경우
            size = sizeInput.value;
        } else {
            // 텍스트 입력창 값 사용
            const sizeEtcInput = document.getElementById('size_etc_input');
            sizeEtc = sizeEtcInput ? sizeEtcInput.value.trim() : '';
            size = sizeEtc;
        }
    } else {
        // 일반 region들의 사이즈 버튼에서 선택
        const sizeInput = document.querySelector('input[name="size_key"]:checked');
        size = sizeInput ? sizeInput.value : '';
    }
    
    // 측정 데이터 - 빈 값도 포함하여 삭제 처리
    const measurements = {};
    const measurementInputs = document.querySelectorAll('.measurement_input');
    measurementInputs.forEach((input, index) => {
        const label = input.parentElement.querySelector('.part');
        if (label) {
            // 빈 값도 전송하여 서버에서 삭제 처리할 수 있도록 함
            measurements[label.textContent] = input.value || '';
        }
    });
    
    // Composition 데이터 수집 (다중 세트 모드 지원)
    let compositions;
    
    if (window.usingMultiSets && window.compositionSets && window.compositionSets.length > 0) {
        console.log('🧪 Multi-set mode: collecting from window.compositionSets:', window.compositionSets);
        
        // 다중 세트 구조로 수집
        const validSets = window.compositionSets.filter(set => 
            set.compositions && Object.keys(set.compositions).length > 0
        );
        
        console.log('🧪 Valid sets found:', validSets.length, validSets);
        
        if (validSets.length > 0) {
            compositions = {};
            validSets.forEach((set, index) => {
                const setName = set.name && set.name.trim() !== '' ? set.name : '';
                // 빈 값들을 필터링하여 저장
                const filteredCompositions = {};
                Object.entries(set.compositions).forEach(([material, value]) => {
                    if (value && value.toString().trim() !== '') {
                        filteredCompositions[material] = value;
                    }
                });
                
                if (Object.keys(filteredCompositions).length > 0) {
                    compositions[setName] = filteredCompositions;
                    console.log(`🧪 Set ${index}: name="${setName}", filtered compositions:`, filteredCompositions);
                }
            });
            console.log('🧪 Final compositions (multi-set mode):', compositions);
        } else {
            console.log('🧪 No valid sets found, using empty object');
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
    
    const missingFields = [];
    
    if (!category) missingFields.push('카테고리');
    
    // 브랜드/사이즈/소재 중 하나는 반드시 있어야 함
    const hasBrand = brand && brand.trim() !== '';
    const hasSize = (sizeRegion && sizeRegion !== 'Select') && (size && size.trim() !== '');
    const hasComposition = window.usingMultiSets 
        ? (typeof compositions === 'object' && compositions !== null && Object.keys(compositions).length > 0 && Object.values(compositions).some(set => Object.keys(set).length > 0))
        : ((Array.isArray(compositions) && compositions.length > 0) || (typeof compositions === 'object' && compositions !== null && Object.keys(compositions).length > 0));
    
    if (!hasBrand && !hasSize && !hasComposition) {
        missingFields.push('브랜드, 사이즈, 소재 중 최소 하나');
    }
    
    
    if (missingFields.length > 0) {
        alert(`다음 필수 항목을 입력해주세요:\n${missingFields.join(', ')}`);
        return null;
    }
    
    
    // FormData에 추가
    if (category) formData.append('category', category);
    if (subcategory) formData.append('subcategory', subcategory);
    if (subcategory2) formData.append('subcategory2', subcategory2);
    if (brand) formData.append('brand', brand);
    if (sizeRegion && sizeRegion !== 'Select') formData.append('sizeRegion', sizeRegion);
    if (size && size.trim() !== '') formData.append('size', size);
    if (sizeEtc && sizeEtc.trim() !== '') formData.append('sizeEtc', sizeEtc);
    // 빈 값도 포함하여 measurements 전송 (삭제 처리를 위해)
    formData.append('measurements', JSON.stringify(measurements));
    // Composition 데이터 추가 (배열이거나 객체일 수 있음)
    
    const hasCompositionData = window.usingMultiSets 
        ? (typeof compositions === 'object' && compositions !== null && Object.keys(compositions).length > 0 && Object.values(compositions).some(set => Object.keys(set).length > 0))
        : ((Array.isArray(compositions) && compositions.length > 0) || (typeof compositions === 'object' && compositions !== null && Object.keys(compositions).length > 0));
    console.log('🧪 Has composition data:', hasCompositionData);
    
    if (hasCompositionData) {
        const compositionJson = JSON.stringify(compositions);
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
        formData.append('compositions', JSON.stringify({}));
    }
    if (year) formData.append('year', year);
    if (season) formData.append('season', season);
    if (purchaseYear) formData.append('purchaseYear', purchaseYear);
    
    // Tags 데이터 수집
    const selectedTags = [];
    const tagCheckboxes = document.querySelectorAll('input[name="tags"]:checked');
    tagCheckboxes.forEach(checkbox => {
        selectedTags.push(checkbox.value);
    });
    if (selectedTags.length > 0) {
        formData.append('tags', selectedTags.join(', '));
        console.log('🏷️ Adding tags to FormData:', selectedTags.join(', '));
    }
    
    // Color 데이터 수집 (멀티 셀렉트) - 디버깅 강화
    const selectedColors = document.querySelectorAll('.color_option.selected');
    console.log('🔍 Found selected color elements:', selectedColors.length);
    selectedColors.forEach((el, i) => {
        console.log(`🔍 Selected color ${i}:`, el.getAttribute('data-color'));
    });
    
    if (selectedColors.length > 0) {
        const colorLabels = Array.from(selectedColors).map(option => option.getAttribute('data-color'));
        const colorString = colorLabels.join(', ');
        formData.append('color', colorString);
        console.log('🎨 Adding colors to FormData:', colorString);
        console.log('🔍 FormData color check:', formData.get('color'));
    } else {
        console.log('ℹ️ No colors selected');
    }
    
    // 삭제된 이미지 정보 추가
    if (window.deletedImageUrls && window.deletedImageUrls.length > 0) {
        console.log('🗑️ Adding deleted images info to FormData:', window.deletedImageUrls);
        formData.append('deleted_images', JSON.stringify(window.deletedImageUrls));
    }
    
    return formData;
}

// Global array to track selected files for deletion
let selectedFiles = [];

function readImages() {
    var files = document.querySelector('input[class="file_uploader"]').files;
    var container = document.querySelector("#individual_mode");
    
    // Convert FileList to array and store globally
    selectedFiles = Array.from(files);
    
    console.log('📁 readImages called with files:', files.length);
    console.log('📦 Individual container found:', !!container);
    console.log('👁️ Container hidden:', container?.classList.contains('hidden'));
    console.log('🔍 Container classes:', container?.className);
    console.log('🔍 Container visibility:', container?.style.display);
    
    // Individual 모드인지 확인
    const isIndividualMode = container && !container.classList.contains('hidden');
    console.log('🔍 Is individual mode:', isIndividualMode);
    
    // 디버깅을 위해 + 버튼 상태도 확인
    const addButton = container?.querySelector('.add_image');
    console.log('➕ Add button classes:', addButton?.className);
    console.log('➕ Add button hidden:', addButton?.classList.contains('hidden'));
    
    if (isIndividualMode) {
        // Individual 모드: 대표 이미지 선택 기능 포함
        if (!window.individualFiles) {
            window.individualFiles = [];
        }
        // 기존 파일들에 새로운 파일들 추가
        const startIndex = window.individualFiles.length;
        window.individualFiles.push(...Array.from(files));
        
        // 메인 이미지 인덱스는 첫 번째 파일이 추가될 때만 설정
        if (startIndex === 0) {
            mainImageIndex = 0;
        }
        
        for (let i = 0; i < files.length; i++) {
            const currentFileIndex = startIndex + i;
            console.log(`🖼️ Creating preview ${currentFileIndex + 1}/${window.individualFiles.length} for file:`, files[i].name);
            
            const preview = document.createElement('div');
            preview.className = "preview_image";
            
            // 메인 이미지는 전체 파일 목록에서 첫 번째일 때만
            const isMainImage = currentFileIndex === 0;
            if (isMainImage) preview.classList.add('main_image');

            const currentImageUrl = URL.createObjectURL(files[i]);
            const img = document.createElement("img");
            img.src = currentImageUrl;
            
            console.log(`📷 Created image element with URL:`, currentImageUrl);
            
            // 메인 이미지 배지 추가
            const badge = document.createElement('div');
            badge.className = 'main_image_badge';
            badge.textContent = 'MAIN';
            if (isMainImage) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
            
            preview.appendChild(img);
            preview.appendChild(badge);
            
            // Individual mode에서는 해당 컨테이너 내의 add_image 앞에 추가
            const addImage = container.querySelector(".add_image");
            console.log(`📦 Add image element found:`, !!addImage);
            console.log(`➕ Inserting preview before add button`);
            addImage.before(preview);
            
            
            // 클릭 이벤트: 이미지 제거
            preview.addEventListener('click', () => {
                const wasMainImage = preview.classList.contains('main_image');
                
                preview.remove();
                // window.individualFiles와 selectedFiles 배열에서 해당 파일 제거
                const fileToRemove = files[i];
                const globalIndex = window.individualFiles.indexOf(fileToRemove);
                if (globalIndex > -1) {
                    window.individualFiles.splice(globalIndex, 1);
                }
                const selectedIndex = selectedFiles.indexOf(fileToRemove);
                if (selectedIndex > -1) {
                    selectedFiles.splice(selectedIndex, 1);
                }
                
                // 메인 이미지가 삭제되었고 다른 이미지가 남아있다면, 첫 번째 이미지를 메인으로 설정
                if (wasMainImage && window.individualFiles.length > 0) {
                    const container = document.querySelector("#individual_mode");
                    const remainingPreviews = container.querySelectorAll('.preview_image');
                    if (remainingPreviews.length > 0) {
                        const newMainPreview = remainingPreviews[0];
                        newMainPreview.classList.add('main_image');
                        const newMainBadge = newMainPreview.querySelector('.main_image_badge');
                        if (newMainBadge) {
                            newMainBadge.classList.remove('hidden');
                        }
                        mainImageIndex = 0; // 새로운 첫 번째가 메인
                    }
                }
                
                // FileList는 수정할 수 없으므로 새로운 배열로 갱신
                updateFileInput(selectedFiles);
            });
        }
    } else {
        console.log('⚠️ Using fallback mode (not individual mode)');
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
                // selectedFiles 배열에서 해당 파일 제거 (파일 객체로 찾기)
                const fileIndex = selectedFiles.indexOf(files[i]);
                if (fileIndex > -1) {
                    selectedFiles.splice(fileIndex, 1);
                }
                updateFileInput(selectedFiles);
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
            badge.classList.remove('hidden');
        } else {
            preview.classList.remove('main_image');
            badge.classList.add('hidden');
        }
    });
}


function showSub() {
    document.querySelector(".sub_category").classList.add("show_sub");
}
function hideSub() {
    document.querySelector(".sub_category").classList.remove("show_sub");
}
// Helper function to update file input when files are removed
function updateFileInput(files) {
    const fileInput = document.querySelector('.file_uploader');
    if (fileInput) {
        if (files.length === 0) {
            fileInput.value = '';
        } else {
            // Create a new DataTransfer object to simulate file selection
            const dt = new DataTransfer();
            files.forEach(file => dt.items.add(file));
            fileInput.files = dt.files;
        }
    }
}

// Filter panel functions
function openFilterPanel() {
    console.log('Opening filter panel');
    
    // Create filter panel if it doesn't exist
    let filterPanel = document.getElementById('filter_panel');
    if (!filterPanel) {
        createFilterPanel();
        filterPanel = document.getElementById('filter_panel');
    }
    
    // Add filter-open class to body for CSS styling
    document.body.classList.add('filter-open');
    console.log('Added filter-open class to body');
    console.log('Body classes:', document.body.className);
    
    // Show panel
    setTimeout(() => {
        filterPanel.classList.add('open');
        console.log('Panel classes:', filterPanel.className);
        
        // 필터 패널이 열린 후 저장된 필터 값들 복원
        restoreFilterValues();
    }, 10);
}

function closeFilterPanel() {
    console.log('Closing filter panel');
    const filterPanel = document.getElementById('filter_panel');
    
    // Remove filter-open class from body
    document.body.classList.remove('filter-open');
    console.log('Removed filter-open class from body');
    console.log('Body classes:', document.body.className);
    
    if (filterPanel) {
        filterPanel.classList.remove('open');
        console.log('Panel classes:', filterPanel.className);
    }
}

function createFilterPanel() {
    const filterPanel = document.createElement('div');
    filterPanel.className = 'filter_panel';
    filterPanel.id = 'filter_panel';
    
    filterPanel.innerHTML = `
        <div class="filter_panel_content">
            <div class="filter_panel_header">
                <h1 class="filter_panel_title">Filter</h1>
                <button onclick="closeFilterPanel()" class="filter_panel_close">×</button>
            </div>
            
            <div class="filter_content">
                <div class="subheader">
                    <h1>category</h1>
                </div>
                <div class="new_filter_category_grid" id="new_filter_category_grid">
                </div>
                
                <div class="filter_section" id="measurement_section">
                    <div class="subheader">
                        <h1>measurement</h1>
                    </div>
                    <div class="new_filter_measurement_container" id="new_filter_measurement_container">
                    </div>
                </div>
                
                <div class="filter_section" id="composition_section">
                    <div class="subheader">
                        <h1>composition</h1>
                    </div>
                    <div class="new_filter_composition_container" id="new_filter_composition_container">
                    </div>
                </div>
                
                <div class="filter_section" id="size_section">
                    <div class="subheader">
                        <h1>size</h1>
                    </div>
                    <div class="new_filter_size_container" id="new_filter_size_container">
                    </div>
                </div>
            </div>
        </div>
        
        <div class="filter_panel_footer">
            <button class="main_button" onclick="applyFilters()">Apply</button>
        </div>
    `;
    
    document.body.appendChild(filterPanel);
    
    // Initialize filter content
    initializeFilterContent();
}

function initializeFilterContent() {
    // Initialize categories
    initializeFilterCategories();
    
    // Initialize measurements (기본 3개)
    initializeFilterMeasurements();
    
    // Initialize compositions (기본 6개)
    initializeFilterCompositions();
    
    // Initialize sizes (기본 3개)
    initializeFilterSizes();
    
    // Add category change event listeners
    addCategoryEventListeners();
}

function addCategoryEventListeners() {
    // Category 체크박스 변경 시 measurement 업데이트
    const categoryInputs = document.querySelectorAll('#new_filter_category_grid input[type="checkbox"]');
    categoryInputs.forEach(input => {
        input.addEventListener('change', () => {
            const selectedCategories = [];
            const checkedInputs = document.querySelectorAll('#new_filter_category_grid input[type="checkbox"]:checked');
            checkedInputs.forEach(checkedInput => {
                selectedCategories.push(checkedInput.value);
            });
            
            // Measurement 섹션 업데이트
            updateFilterMeasurements(selectedCategories);
            // Size 섹션 업데이트
            updateFilterSizes(selectedCategories);
        });
    });
}

function initializeFilterCategories() {
    const categoryGrid = document.getElementById('new_filter_category_grid');
    if (!categoryGrid) return;
    
    // Fallback category list if db.js not loaded yet
    const categories = typeof categoryList !== 'undefined' && categoryList ? categoryList : 
        ["top", "dress", "outer", "skirt", "pants", "shoes", "jewelry", "etc."];
    
    categoryGrid.innerHTML = '';
    for (let i = 0; i < categories.length; i++) {
        const item = document.createElement('div');
        item.innerHTML = `<input type="radio" name="filter_category" id="filter_category_${i}" value="${categories[i]}"/><label for="filter_category_${i}">${categories[i]}</label>`;
        
        // Add event listener for category selection
        const radio = item.querySelector('input[type="radio"]');
        radio.addEventListener('change', function() {
            if (this.checked) {
                onCategorySelected(this.value);
            }
        });
        
        categoryGrid.appendChild(item);
    }
}

function onCategorySelected(selectedCategory) {
    console.log(`📂 Category selected: ${selectedCategory}`);
    
    // Fetch existing data for this category from database
    fetchCategoryData(selectedCategory)
        .then(categoryData => {
            console.log(`📊 Received data for ${selectedCategory}:`, categoryData);
            console.log(`📏 Measurements found:`, Object.keys(categoryData.measurements));
            console.log(`🧵 Compositions found:`, categoryData.compositions);
            console.log(`📐 Sizes found:`, categoryData.sizes);
            
            // Reconfigure filter options based on existing data
            reconfigureFilterOptions(categoryData);
        })
        .catch(error => {
            console.error(`❌ Error fetching category data:`, error);
            console.error(`❌ Error details:`, error.stack);
            // Fallback to basic options on error
            resetFilterOptions();
        });
}

function fetchCategoryData(category) {
    console.log(`🔍 Fetching data for category: ${category}`);
    
    return fetch(`/api/items?category=${category}`)
        .then(response => response.json())
        .then(data => {
            const items = data.items || [];
            console.log(`📦 Found ${items.length} items for category ${category}`);
            
            // Log detailed info about first few items
            if (items.length > 0) {
                console.log(`🔍 First item structure:`, items[0]);
                console.log(`🔍 First item fields:`, Object.keys(items[0]));
                
                if (items.length > 1) {
                    console.log(`🔍 Second item:`, items[1]);
                }
            }
            
            // Extract unique values from actual data
            const categoryData = {
                measurements: extractMeasurements(items, category),
                compositions: extractCompositions(items),
                sizes: extractSizes(items)
            };
            
            return categoryData;
        });
}

function extractMeasurements(items, category) {
    const measurements = {};
    
    console.log(`🔍 Sample item structure:`, items.length > 0 ? items[0] : 'No items');
    
    // Define measurement fields based on category (from script.js displayMeasurementInput)
    let measurementFields = [];
    if (category === null || category === undefined) {
        // Global mode: check all possible measurement fields
        measurementFields = ["chest", "shoulder", "sleeve", "sleeve_opening", "armhole", "waist", "length", 
                            "hem_width", "hip", "rise", "leg_opening", "heel", "width", "height", "circumference"];
        console.log('🌍 Global measurement mode: checking all fields');
    } else if (category === "top" || category === "outer") {
        measurementFields = ["chest", "shoulder", "sleeve", "sleeve_opening", "armhole", "waist", "length"];
    } else if (category === "dress") {
        measurementFields = ["chest", "shoulder", "sleeve", "sleeve_opening", "armhole", "waist", "length", "hem_width"];
    } else if (category === "pants") {
        measurementFields = ["waist", "hip", "rise", "leg_opening", "length"];
    } else if (category === "skirt") {
        measurementFields = ["waist", "hip", "length", "hem_width"];
    } else if (category === "shoes") {
        measurementFields = ["heel"];
    } else {
        measurementFields = ["width", "height", "length", "circumference"];
    }
    
    console.log(`🔍 Looking for measurement fields:`, measurementFields);
    
    measurementFields.forEach(field => {
        // Check in measurements object if it exists
        const values = [];
        
        items.forEach(item => {
            let value = null;
            
            // Try direct field access first
            if (item[field] !== undefined && item[field] !== null) {
                value = parseFloat(item[field]);
            }
            // Try measurements object access
            else if (item.measurements && item.measurements[field] !== undefined) {
                value = parseFloat(item.measurements[field]);
            }
            
            if (!isNaN(value) && value > 0) {
                values.push(value);
            }
        });
        
        if (values.length > 0) {
            measurements[field] = {
                min: Math.min(...values),
                max: Math.max(...values),
                count: values.length
            };
        } else {
            console.log(`❌ No values found for ${field}`);
        }
    });
    
    console.log(`📏 Extracted measurements for ${category}:`, measurements);
    return measurements;
}

function extractCompositions(items) {
    const compositions = new Set();
    
    console.log(`🔍 Checking compositions in ${items.length} items`);
    
    items.forEach((item, index) => {
        if (index < 5) {
            console.log(`🔍 Item ${index} (${item.category}) compositions:`, item.compositions, typeof item.compositions);
        }
        
        if (item.compositions) {
            if (Array.isArray(item.compositions)) {
                item.compositions.forEach(comp => {
                    if (comp && comp.trim()) {
                        compositions.add(comp.trim().toLowerCase());
                    }
                });
            } else if (typeof item.compositions === 'string') {
                // Handle string compositions (comma-separated or single)
                const compList = item.compositions.split(',');
                compList.forEach(comp => {
                    if (comp && comp.trim()) {
                        compositions.add(comp.trim().toLowerCase());
                    }
                });
            } else if (typeof item.compositions === 'object' && item.compositions !== null) {
                // Handle composition sets - extract materials from within sets
                Object.keys(item.compositions).forEach(setKey => {
                    const setData = item.compositions[setKey];
                    console.log(`🔍 Processing composition set "${setKey}":`, setData);
                    
                    if (typeof setData === 'object' && setData !== null) {
                        // Extract material names from set (not set names)
                        Object.keys(setData).forEach(material => {
                            if (material && material.trim()) {
                                compositions.add(material.trim().toLowerCase());
                                console.log(`✅ Added material from set "${setKey}": ${material}`);
                            }
                        });
                    } else if (typeof setData === 'string') {
                        // Handle string-based composition data
                        const materials = setData.split(',');
                        materials.forEach(material => {
                            if (material && material.trim()) {
                                compositions.add(material.trim().toLowerCase());
                                console.log(`✅ Added material from string: ${material}`);
                            }
                        });
                    } else {
                        // Fallback: if it's a simple key-value, treat key as material
                        if (setKey && setKey.trim() && !setKey.toLowerCase().includes('set')) {
                            compositions.add(setKey.trim().toLowerCase());
                            console.log(`✅ Added composition (fallback): ${setKey}`);
                        }
                    }
                });
            }
        }
    });
    
    const compositionArray = Array.from(compositions).sort();
    console.log(`🧵 Extracted compositions:`, compositionArray);
    return compositionArray;
}

function extractSizes(items) {
    const sizes = new Set();
    
    console.log(`🔍 Checking sizes in ${items.length} items`);
    
    items.forEach((item, index) => {
        if (index < 3) {
            console.log(`🔍 Item ${index} size:`, item.size, typeof item.size);
        }
        
        // 실제 사이즈 값 추출 (size 필드에서)
        if (item.size && item.size.trim()) {
            sizes.add(item.size.trim());
        }
    });
    
    const sizeArray = Array.from(sizes).sort();
    console.log(`📐 Extracted actual sizes from data:`, sizeArray);
    return sizeArray;
}

function updateFilterSizes(selectedCategories) {
    console.log('📏 Updating filter sizes for categories:', selectedCategories);
    
    if (selectedCategories.length === 0) {
        // No categories selected, show all sections and sizes
        const sizeSection = document.getElementById('size_section');
        if (sizeSection) {
            sizeSection.style.display = 'block';
        }
        if (typeof allSizesByRegion !== 'undefined') {
            reconfigureSizes(allSizesByRegion);
        }
        return;
    }
    
    // Get sizes for selected categories from searchCache
    let categorySizes = {};
    if (typeof searchCache !== 'undefined' && Array.isArray(searchCache)) {
        searchCache.forEach(item => {
            if (selectedCategories.includes(item.category) && item.size) {
                const region = item.sizeRegion || item.size_region || 'Other';
                if (!categorySizes[region]) {
                    categorySizes[region] = new Set();
                }
                categorySizes[region].add(item.size);
            }
        });
        
        // Convert Sets to Arrays
        Object.keys(categorySizes).forEach(region => {
            categorySizes[region] = Array.from(categorySizes[region]).sort();
        });
        
        console.log('📏 Category sizes:', categorySizes);
        
        // Check if there are any sizes for the selected categories
        const totalSizes = Object.values(categorySizes).reduce((total, regionSizes) => total + regionSizes.length, 0);
        const sizeSection = document.getElementById('size_section');
        
        if (totalSizes === 0) {
            if (sizeSection) {
                sizeSection.style.display = 'none';
            }
        } else {
            if (sizeSection) {
                sizeSection.style.display = 'block';
            }
            reconfigureSizes(categorySizes);
        }
    }
}

function reconfigureFilterOptions(categoryData) {
    console.log('🔄 Reconfiguring filter options with data:', categoryData);
    
    // Reconfigure measurements
    reconfigureMeasurements(categoryData.measurements);
    
    // Reconfigure compositions  
    reconfigureCompositions(categoryData.compositions);
    
    // Reconfigure sizes
    reconfigureSizes(categoryData.sizes);
}

function reconfigureMeasurements(measurementData) {
    const container = document.getElementById('new_filter_measurement_container');
    if (!container) {
        console.error('❌ new_filter_measurement_container not found');
        return;
    }
    
    // Store measurement data globally for load more functionality
    window.currentCategoryMeasurements = measurementData;
    
    // Reset any expanded state since we're showing new category measurements
    const expandedContainer = document.getElementById('new_filter_measurement_expanded');
    if (expandedContainer && !expandedContainer.classList.contains('filter_expanded')) {
        // If it was expanded, collapse it for the new category
        expandedContainer.classList.add('filter_expanded');
        const button = document.querySelector('#new_filter_measurement_container .load_more_button');
        if (button) {
            button.classList.remove('load_more_collapsed');
        }
    }
    
    const availableMeasurements = Object.keys(measurementData);
    console.log(`📏 Updating measurements with: ${availableMeasurements.join(', ')}`);
    
    const measurementSection = document.getElementById('measurement_section');
    if (availableMeasurements.length === 0) {
        if (measurementSection) {
            measurementSection.style.display = 'none';
        }
        window.currentCategoryMeasurements = null;
        return;
    } else {
        if (measurementSection) {
            measurementSection.style.display = 'block';
        }
    }
    
    // 카테고리 선택 시에는 모든 measurement 표시, load more 버튼 없음
    container.innerHTML = `
        <div class="filter_measurement_basic" id="new_filter_measurement_basic">
            ${availableMeasurements.map(measurement => {
                const data = measurementData[measurement];
                return `
                    <div class="filter_measurement_item">
                        <label class="measurement_label">${measurement}</label>
                        <div class="filter_measurement_range">
                            <input type="text" placeholder="${data.min}" class="measurement_input filter_measurement_input" id="measurement_${measurement}_from" autocomplete="off" />
                            <span>-</span>
                            <input type="text" placeholder="${data.max}" class="measurement_input filter_measurement_input" id="measurement_${measurement}_to" autocomplete="off" />
                        </div>
                        <button class="clear_button filter_measurement_clear" onclick="clearMeasurementRange('${measurement}')">
                            <span class="clear_icon"></span>
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="filter_measurement_expanded filter_expanded" id="new_filter_measurement_expanded">
            <!-- Hidden when category selected -->
        </div>
    `;
}

function reconfigureCompositions(compositions) {
    const container = document.getElementById('new_filter_composition_container');
    if (!container) {
        console.error('❌ new_filter_composition_container not found');
        return;
    }
    
    console.log(`🧵 Updating compositions with: ${compositions.join(', ')}`);
    
    const compositionSection = document.getElementById('composition_section');
    if (compositions.length === 0) {
        if (compositionSection) {
            compositionSection.style.display = 'none';
        }
        return;
    } else {
        if (compositionSection) {
            compositionSection.style.display = 'block';
        }
    }
    
    // 카테고리 기반 composition은 load more 없이 모두 표시
    container.innerHTML = `
        <div class="filter_composition_basic" id="new_filter_composition_basic">
            ${compositions.map(composition => `
                <div class="tag_item">
                    <input type="checkbox" id="composition_${composition}" name="filter_compositions" value="${composition}">
                    <label for="composition_${composition}">${composition}</label>
                </div>
            `).join('')}
        </div>
        <div class="filter_composition_expanded filter_expanded" id="new_filter_composition_expanded">
            <!-- Hidden when category selected -->
        </div>
    `;
}

function reconfigureSizes(sizes) {
    const container = document.getElementById('new_filter_size_container');
    if (!container) {
        console.error('❌ new_filter_size_container not found');
        return;
    }
    
    console.log(`📐 Reconfiguring sizes with actual data: ${sizes.join(', ')}`);
    
    const sizeSection = document.getElementById('size_section');
    if (sizes.length === 0) {
        console.log('⚠️ No sizes found in data, hiding size section');
        if (sizeSection) {
            sizeSection.style.display = 'none';
        }
        return;
    } else {
        if (sizeSection) {
            sizeSection.style.display = 'block';
        }
    }
    
    // Use the same structure as initializeFilterSizes but with actual data
    // Group sizes by region based on actual data
    const sizesByRegion = {};
    
    // Extract region information from size data if available
    sizes.forEach(size => {
        // Try to determine region from size format
        let region = 'WW'; // default
        if (typeof size === 'number' || (typeof size === 'string' && /^\d+/.test(size))) {
            if (size >= 30 && size <= 50) {
                region = 'EU';
            } else if (size >= 4 && size <= 20) {
                region = 'US';
            }
        } else if (typeof size === 'string') {
            if (/^(XXX?S|XS|S|M|L|XL|XXL|One Size)$/i.test(size)) {
                region = 'WW';
            }
        }
        
        if (!sizesByRegion[region]) {
            sizesByRegion[region] = [];
        }
        sizesByRegion[region].push(size);
    });
    
    // 카테고리 선택 시에는 모든 size 표시, region 표시 없음, load more 버튼 없음
    let allSizesHtml = '';
    Object.keys(sizesByRegion).forEach(region => {
        const regionSizes = sizesByRegion[region];
        // region 표시 없이 sizes만 표시
        allSizesHtml += regionSizes.map(size => `
            <div class="tag_item">
                <input type="checkbox" id="size_category_${size.toString().replace(/\s+/g, '_')}" name="filter_sizes" value="${size}">
                <label for="size_category_${size.toString().replace(/\s+/g, '_')}" class="size_key">${size}</label>
            </div>
        `).join('');
    });
    
    console.log('📐 Setting size container HTML without regions, without load more button');
    container.innerHTML = `
        <div class="filter_size_basic" id="new_filter_size_basic">
            <div class="size_values_container">
                ${allSizesHtml}
            </div>
        </div>
        <div class="filter_size_expanded filter_expanded" id="new_filter_size_expanded">
            <!-- Hidden when category selected -->
        </div>
    `;
    
    // 확실하게 load more 버튼 제거
    const loadMoreSection = container.querySelector('.load_more_section');
    if (loadMoreSection) {
        console.log('🗑️ Removing existing load more section');
        loadMoreSection.remove();
    }
}

function resetFilterOptions() {
    console.log('🔄 Resetting filter options to defaults');
    
    // Reset to basic options if category data fetch fails
    initializeFilterMeasurements();
    initializeFilterCompositions();
    initializeFilterSizes();
}


// 카테고리, 서브카테고리, 서브카테고리2를 조합해서 measurement 키 생성
function buildCategoryKey(category, subcategory, subcategory2) {
    console.log('🔧 Building category key with:', { category, subcategory, subcategory2 });
    
    if (category === 'pants' && subcategory) {
        return `pants_${subcategory}`;
    } else if (category === 'skirt' && subcategory) {
        return `skirt_${subcategory}`;
    } else if (category === 'dress' && subcategory && subcategory2) {
        return `${subcategory}_${subcategory2}_dress`;
    } else if (category === 'dress' && subcategory) {
        // 서브카테고리2가 없는 경우 기본 dress
        return 'dress';
    } else if (category === 'outer' && subcategory && subcategory2) {
        // outer의 sleeve + length 조합 (예: "short sleeve_short_outer")
        return `${subcategory}_${subcategory2}_outer`;
    } else if (category === 'outer' && subcategory) {
        // 서브카테고리2가 없는 경우 기본 outer
        return 'outer';
    } else {
        return category;
    }
}

// script.js displayMeasurementInput 로직을 공통 함수로 분리
function getMeasurementsByCategory(category) {
    if (category == "top" || category == "outer") {
        return ["chest", "shoulder", "sleeve", "sleeve opening", "armhole", "waist", "length"];
    } else if (category.includes("outer")) {
        // outer의 모든 변형 (long sleeve_long_outer, short sleeve_long_outer 등)
        return ["chest", "shoulder", "sleeve", "sleeve opening", "armhole", "waist", "length"];
    } else if (category == "dress") {
        return ["chest", "shoulder", "sleeve", "sleeve opening", "armhole", "waist", "length", "hem width"];
    } else if (category == "pants") {
        return ["waist", "hip", "rise", "inseam", "thigh", "legOpening", "length"];
    } else if (category == "pants_short") {
        return ["waist", "hip", "rise", "inseam", "thigh", "legOpening", "length"];
    } else if (category == "pants_long") {
        return ["waist", "hip", "rise", "inseam", "thigh", "legOpening", "length"];
    } else if (category == "skirt") {
        return ["waist", "hip", "length", "hem width"];
    } else if (category == "skirt_mini") {
        return ["waist", "hip", "length", "hem width"];
    } else if (category == "skirt_midi") {
        return ["waist", "hip", "length", "hem width"];
    } else if (category == "skirt_long") {
        return ["waist", "hip", "length", "hem width"];
    } else if (category.includes("dress")) {
        // 모든 dress 변형 (short_sleeve_mini_dress, long_sleeve_long_dress 등)
        return ["chest", "shoulder", "sleeve", "sleeve opening", "armhole", "waist", "length", "hem width"];
    } else if (category == "shoes") {
        return ["heel"];
    } else if (category == "jewerly" || category == ".etc" || category == "etc." || category == "etc") {
        return ["width", "height", "length", "circumference"];
    }
    return [];
}

// Category 선택 시 measurement 업데이트 (중복 정의 방지)
function updateFilterMeasurements(selectedCategories) {
    const container = document.getElementById('new_filter_measurement_basic');
    if (!container) return;
    
    let allMeasurements = [];
    
    const measurementSection = document.getElementById('measurement_section');
    
    if (selectedCategories.length === 0) {
        // 카테고리 선택 안했을 때는 TOP 기준
        allMeasurements = getMeasurementsByCategory("top").slice(0, 3);
        if (measurementSection) {
            measurementSection.style.display = 'block';
        }
    } else {
        // 선택된 카테고리들의 measurements 수집
        selectedCategories.forEach(category => {
            const accordingSizes = getMeasurementsByCategory(category);
            accordingSizes.forEach(measurement => {
                if (!allMeasurements.includes(measurement)) {
                    allMeasurements.push(measurement);
                }
            });
        });
        
        // 기본 3개만 표시
        allMeasurements = allMeasurements.slice(0, 3);
    }
    
    container.innerHTML = allMeasurements.map(measurement => `
        <div class="filter_measurement_item">
            <label>${measurement}</label>
            <div class="filter_measurement_range">
                <input type="text" placeholder="from" class="measurement_input filter_measurement_input" id="measurement_${measurement}_from" autocomplete="off" />
                <span>-</span>
                <input type="text" placeholder="to" class="measurement_input filter_measurement_input" id="measurement_${measurement}_to" autocomplete="off" />
            </div>
            <button class="clear_button filter_measurement_clear" onclick="clearMeasurementRange('${measurement}')">
                <span class="clear_icon"></span>
            </button>
        </div>
    `).join('');
}

function fetchAllMeasurementRanges() {
    console.log('🔍 Fetching global measurement ranges from all items');
    
    return fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            const items = data.items || [];
            console.log(`📦 Found ${items.length} total items for measurement analysis`);
            
            // Extract measurements from all items without category filtering
            const globalMeasurementData = extractMeasurements(items, null);
            
            return globalMeasurementData;
        })
        .catch(error => {
            console.error('❌ Failed to fetch all items for measurement ranges:', error);
            throw error;
        });
}

function initializeFilterMeasurements() {
    const container = document.getElementById('new_filter_measurement_container');
    if (!container) return;
    
    console.log('🏗️ Initializing measurements with global data ranges');
    
    // 모든 아이템에서 measurement 범위 계산
    fetchAllMeasurementRanges()
        .then(globalMeasurementData => {
            console.log('📊 Global measurement ranges:', globalMeasurementData);
            
            // 기본 측정값은 TOP 카테고리 기준 (script.js displayMeasurementInput 참조)
            const basicMeasurements = ['chest', 'shoulder', 'sleeve'];
            
            container.innerHTML = `
                <div class="filter_measurement_basic" id="new_filter_measurement_basic">
                    ${basicMeasurements.map(measurement => {
                        const data = globalMeasurementData[measurement] || { min: 'from', max: 'to' };
                        return `
                            <div class="filter_measurement_item">
                                <label>${measurement}</label>
                                <div class="filter_measurement_range">
                                    <input type="text" placeholder="${data.min}" class="measurement_input filter_measurement_input" id="measurement_${measurement}_from" autocomplete="off" />
                                    <span>-</span>
                                    <input type="text" placeholder="${data.max}" class="measurement_input filter_measurement_input" id="measurement_${measurement}_to" autocomplete="off" />
                                </div>
                                <button class="clear_button filter_measurement_clear" onclick="clearMeasurementRange('${measurement}')">
                                    <span class="clear_icon"></span>
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="filter_measurement_expanded filter_expanded" id="new_filter_measurement_expanded">
                    <!-- Will be populated when expanded -->
                </div>
                <div class="load_more_section">
                    <button class="load_more_button" onclick="toggleMeasurementList()">
                        <span class="load_more_icon"></span>
                    </button>
                </div>
            `;
        })
        .catch(error => {
            console.error('❌ Failed to fetch global measurement ranges:', error);
            // Fallback to basic placeholders
            const basicMeasurements = ['chest', 'shoulder', 'sleeve'];
            
            container.innerHTML = `
                <div class="filter_measurement_basic" id="new_filter_measurement_basic">
                    ${basicMeasurements.map(measurement => `
                        <div class="filter_measurement_item">
                            <label>${measurement}</label>
                            <div class="filter_measurement_range">
                                <input type="text" placeholder="from" class="measurement_input filter_measurement_input" id="measurement_${measurement}_from" autocomplete="off" />
                                <span>-</span>
                                <input type="text" placeholder="to" class="measurement_input filter_measurement_input" id="measurement_${measurement}_to" autocomplete="off" />
                            </div>
                            <button class="clear_button filter_measurement_clear" onclick="clearMeasurementRange('${measurement}')">
                                <span class="clear_icon"></span>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <div class="filter_measurement_expanded filter_expanded" id="new_filter_measurement_expanded">
                    <!-- Will be populated when expanded -->
                </div>
                <div class="load_more_section">
                    <button class="load_more_button" onclick="toggleMeasurementList()">
                        <span class="load_more_icon"></span>
                    </button>
                </div>
            `;
        });
}

function initializeFilterCompositions() {
    const container = document.getElementById('new_filter_composition_container');
    if (!container) {
        console.error('❌ new_filter_composition_container not found');
        return;
    }
    
    console.log('🧵 Initializing filter compositions from existing data');
    
    // Fetch actual composition data from items
    fetch('/api/items')
    .then(response => response.json())
    .then(data => {
        const items = data.items || [];
        
        // Calculate composition frequency
        const compositionFrequency = {};
        items.forEach(item => {
            if (item.compositions) {
                if (Array.isArray(item.compositions)) {
                    item.compositions.forEach(comp => {
                        if (comp && comp.trim()) {
                            const normalizedComp = comp.trim().toLowerCase();
                            compositionFrequency[normalizedComp] = (compositionFrequency[normalizedComp] || 0) + 1;
                        }
                    });
                } else if (typeof item.compositions === 'object' && item.compositions !== null) {
                    Object.keys(item.compositions).forEach(setKey => {
                        const setData = item.compositions[setKey];
                        if (typeof setData === 'object' && setData !== null) {
                            Object.keys(setData).forEach(material => {
                                if (material && material.trim()) {
                                    const normalizedMaterial = material.trim().toLowerCase();
                                    compositionFrequency[normalizedMaterial] = (compositionFrequency[normalizedMaterial] || 0) + 1;
                                }
                            });
                        }
                    });
                }
            }
        });
        
        // Sort by frequency (descending) then alphabetically
        const allCompositions = Object.keys(compositionFrequency)
            .sort((a, b) => {
                const freqDiff = compositionFrequency[b] - compositionFrequency[a];
                return freqDiff !== 0 ? freqDiff : a.localeCompare(b);
            });
        
        console.log('📊 Compositions by frequency:', allCompositions.map(comp => 
            `${comp} (${compositionFrequency[comp]})`));
        
        // Show first 4 compositions by default
        const basicCompositions = allCompositions.slice(0, 4);
        const hasMore = allCompositions.length > 4;
        
        // Store all compositions for load more functionality
        container.dataset.allCompositions = JSON.stringify(allCompositions);
        
        container.innerHTML = `
            <div class="filter_composition_basic" id="new_filter_composition_basic">
                ${basicCompositions.map(composition => `
                    <div class="tag_item">
                        <input type="checkbox" id="composition_${composition}" name="filter_compositions" value="${composition}">
                        <label for="composition_${composition}">${composition}</label>
                    </div>
                `).join('')}
            </div>
            <div class="filter_composition_expanded filter_expanded" id="new_filter_composition_expanded">
                <!-- Will be populated when expanded -->
            </div>
            ${hasMore ? `
            <div class="load_more_section">
                <button class="load_more_button" onclick="toggleCompositionList()">
                    <span class="load_more_icon"></span>
                </button>
            </div>
            ` : ''}
        `;
    })
    .catch(error => {
        console.error('❌ Failed to fetch items for compositions:', error);
        // Fallback to empty state or minimal compositions
        container.innerHTML = `
            <div class="filter_composition_basic" id="new_filter_composition_basic">
                <!-- No compositions available -->
            </div>
            <div class="filter_composition_expanded filter_expanded" id="new_filter_composition_expanded">
            </div>
        `;
    });
}

// Size region and size value mapping from script.js 원본 구현 사용
function getSizesByRegion(region) {
    var accordingSizes = [];
    if (region == "US") {
        accordingSizes.push("00", 0, 2);
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
        accordingSizes.push("One Size", "XXXS", "XXS", "XS", "S", "M", "L", "XL");
    } else if (region == "KR") {
        accordingSizes.push(230, 235, 240, 44, 55);
    } else if (region == "Kids") {
            accordingSizes.push(130, 140, 150, 160, "12Y", "13Y", "14Y", "15Y", "16Y");
    } else if (region == "Ring") {
        accordingSizes.push(48, 50, 52, 4, 5, 6, "KR 5", "KR 6", "KR 7", "KR 8", "KR 9", "KR 10", "KR 11", "I", "J", "IT5");
    } else if (region == "etc") {
        accordingSizes.push(1, 2);
    } return accordingSizes;
}

function initializeFilterSizes() {
    const container = document.getElementById('new_filter_size_container');
    if (!container) {
        console.error('❌ new_filter_size_container not found');
        return;
    }
    
    console.log('📐 Initializing filter sizes from existing data');
    
    // Fetch actual size data from items
    fetch('/api/items')
    .then(response => response.json())
    .then(data => {
        const items = data.items || [];
        console.log('📊 Total items fetched:', items.length);
        
        // Debug: Check first few items structure
        if (items.length > 0) {
            console.log('🔍 Sample item structure:', items[0]);
            console.log('🔍 Available fields:', Object.keys(items[0]));
        }
        
        // Group actual sizes by region
        const sizesByRegion = {};
        
        items.forEach(item => {
            // Check both possible field names for size region
            const region = item.sizeRegion || item.size_region;
            const size = item.size;
            
            console.log('🔍 Item size data:', { region, size, item_id: item.id });
            
            if (region && size) {
                if (!sizesByRegion[region]) {
                    sizesByRegion[region] = new Set();
                }
                sizesByRegion[region].add(size);
            }
        });
        
        // Convert Sets to Arrays and sort
        Object.keys(sizesByRegion).forEach(region => {
            sizesByRegion[region] = Array.from(sizesByRegion[region]).sort((a, b) => {
                // Numeric sort for number sizes, alphabetic for text sizes
                const aNum = parseFloat(a);
                const bNum = parseFloat(b);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return aNum - bNum;
                }
                return a.localeCompare(b);
            });
        });
        
        console.log('📊 Sizes by region from data:', sizesByRegion);
        
        // Only show regions that have actual data
        const regionsWithData = Object.keys(sizesByRegion).filter(region => 
            sizesByRegion[region].length > 0
        );
        
        if (regionsWithData.length === 0) {
            container.innerHTML = `
                <div class="filter_size_basic" id="new_filter_size_basic">
                    <div class="no_sizes_available">No sizes available</div>
                </div>
            `;
            return;
        }
        
        // Show first 3 regions by default
        const basicRegions = regionsWithData.slice(0, 3);
        const hasMoreRegions = regionsWithData.length > 3;
        
        // Store all regions data for load more
        container.dataset.allSizeRegions = JSON.stringify(sizesByRegion);
        
        let sizeRegionsHtml = '';
        basicRegions.forEach(region => {
            const regionSizes = sizesByRegion[region];
            
            sizeRegionsHtml += `
                <div class="grid_container_size">
                    <div class="size_region">${region}</div>
                    <div class="size_key_container">
                        ${regionSizes.map(size => `
                            <div class="tag_item">
                                <input type="checkbox" id="size_${region}_${size.toString().replace(/\s+/g, '_')}" name="filter_sizes" value="${size}">
                                <label for="size_${region}_${size.toString().replace(/\s+/g, '_')}" class="size_key">${size}</label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = `
            <div class="filter_size_basic" id="new_filter_size_basic">
                ${sizeRegionsHtml}
            </div>
            <div class="filter_size_expanded filter_expanded" id="new_filter_size_expanded">
                <!-- Will be populated when expanded with more regions -->
            </div>
            ${hasMoreRegions ? `
            <div class="load_more_section">
                <button class="load_more_button" onclick="toggleSizeList()">
                    <span class="load_more_icon"></span>
                </button>
            </div>
            ` : ''}
        `;
    })
    .catch(error => {
        console.error('❌ Failed to fetch items for sizes:', error);
        container.innerHTML = `
            <div class="filter_size_basic" id="new_filter_size_basic">
                <div class="no_sizes_available">Failed to load sizes</div>
            </div>
        `;
    });
}

function toggleSizeList() {
    const container = document.getElementById('new_filter_size_container');
    const button = document.querySelector('#new_filter_size_container .load_more_button');
    const basic = document.getElementById('new_filter_size_basic');
    
    console.log('toggleSizeList called');
    
    if (!button.dataset.expanded || button.dataset.expanded === 'false') {
        // Expand - append additional regions to basic container
        const allSizeRegions = JSON.parse(container.dataset.allSizeRegions || '{}');
        
        // Get already displayed regions
        const displayedRegions = new Set();
        const existingRegionElements = basic.querySelectorAll('.size_region');
        existingRegionElements.forEach(el => {
            displayedRegions.add(el.textContent.trim());
        });
        
        // Find additional regions not yet displayed
        const additionalRegions = Object.keys(allSizeRegions).filter(region => 
            !displayedRegions.has(region) && allSizeRegions[region].length > 0
        );
        
        console.log('Additional regions to append:', additionalRegions);
        
        if (additionalRegions.length > 0) {
            const expandedHtml = additionalRegions.map(region => {
                const regionSizes = allSizeRegions[region];
                return `
                    <div class="grid_container_size size_expanded_item">
                        <div class="size_region">${region}</div>
                        <div class="size_key_container">
                            ${regionSizes.map(size => `
                                <div class="tag_item">
                                    <input type="checkbox" id="size_expanded_${region}_${size.toString().replace(/\s+/g, '_')}" name="filter_sizes" value="${size}">
                                    <label for="size_expanded_${region}_${size.toString().replace(/\s+/g, '_')}" class="size_key">${size}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
            
            basic.insertAdjacentHTML('beforeend', expandedHtml);
        }
        
        button.dataset.expanded = 'true';
        const icon = button.querySelector('.load_more_icon');
        if (icon) {
            icon.classList.add('collapsed');
        }
    } else {
        // Collapse - remove appended regions
        const expandedItems = basic.querySelectorAll('.size_expanded_item');
        expandedItems.forEach(item => item.remove());
        
        button.dataset.expanded = 'false';
        const icon = button.querySelector('.load_more_icon');
        if (icon) {
            icon.classList.remove('collapsed');
        }
    }
}

// Toggle functions for load more buttons
function toggleMeasurementList() {
    console.log('🔄 toggleMeasurementList called - start');
    
    const button = document.querySelector('#new_filter_measurement_container .load_more_button');
    const basic = document.getElementById('new_filter_measurement_basic');
    
    console.log('🔍 Button element:', button);
    console.log('🔍 Basic container:', basic);
    
    if (!button || !basic) {
        console.error('❌ Required elements not found');
        return;
    }
    
    if (!button.dataset.expanded || button.dataset.expanded === 'false') {
        // Expand - append additional measurements to basic container
        
        // Get existing measurements to avoid duplicates
        const existingMeasurements = new Set();
        const existingLabels = basic.querySelectorAll('.filter_measurement_item label');
        existingLabels.forEach(label => {
            const measurementName = label.textContent.trim();
            existingMeasurements.add(measurementName);
        });
        
        // Use global measurement data from items - reuse existing function
        fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            const items = data.items || [];
            const globalMeasurementData = extractMeasurements(items, null); // null = global mode
            const allMeasurements = Object.keys(globalMeasurementData);
            const additionalMeasurements = allMeasurements.filter(m => !existingMeasurements.has(m));
            
            console.log('📏 Additional measurements to append:', additionalMeasurements);
            console.log('📊 Global measurement data:', globalMeasurementData);
            
            if (additionalMeasurements.length > 0) {
                const expandedHtml = additionalMeasurements.map(measurement => {
                    const measurementData = globalMeasurementData[measurement] || { min: 'from', max: 'to' };
                    return `
                        <div class="filter_measurement_item measurement_expanded_item">
                            <label class="measurement_label">${measurement}</label>
                            <div class="filter_measurement_range">
                                <input type="text" placeholder="${measurementData.min}" class="measurement_input filter_measurement_input" id="measurement_${measurement}_from" autocomplete="off" />
                                <span>-</span>
                                <input type="text" placeholder="${measurementData.max}" class="measurement_input filter_measurement_input" id="measurement_${measurement}_to" autocomplete="off" />
                            </div>
                            <button class="clear_button filter_measurement_clear" onclick="clearMeasurementRange('${measurement}')">
                                <span class="clear_icon"></span>
                            </button>
                        </div>
                    `;
                }).join('');
                
                basic.insertAdjacentHTML('beforeend', expandedHtml);
            }
            
            button.dataset.expanded = 'true';
            const icon = button.querySelector('.load_more_icon');
            if (icon) {
                icon.classList.add('collapsed');
            }
        })
        .catch(error => {
            console.error('❌ Failed to fetch items for measurements:', error);
        });
    } else {
        // Collapse - remove appended items
        const expandedItems = basic.querySelectorAll('.measurement_expanded_item');
        expandedItems.forEach(item => item.remove());
        
        button.dataset.expanded = 'false';
        const icon = button.querySelector('.load_more_icon');
        if (icon) {
            icon.classList.remove('collapsed');
        }
    }
}

function toggleCompositionList() {
    const container = document.getElementById('new_filter_composition_container');
    const button = document.querySelector('#new_filter_composition_container .load_more_button');
    const basic = document.getElementById('new_filter_composition_basic');
    
    console.log('toggleCompositionList called');
    
    if (!button.dataset.expanded || button.dataset.expanded === 'false') {
        // Expand - append more compositions to basic container
        const allCompositions = JSON.parse(container.dataset.allCompositions || '[]');
        if (allCompositions.length === 0) {
            console.error('❌ No composition data found');
            return;
        }
        
        // 기본에 표시된 composition 제외하고 나머지만 append (4개 이후)
        const basicCompositions = Array.from(basic.querySelectorAll('input[name="filter_compositions"]')).map(input => input.value);
        const expandedCompositions = allCompositions.filter(comp => !basicCompositions.includes(comp));
        
        console.log('🔄 Expanding compositions:', expandedCompositions);
        
        // Append to basic container instead of separate expanded container
        const expandedHtml = expandedCompositions.map(composition => `
            <div class="tag_item composition_expanded_item">
                <input type="checkbox" id="composition_expanded_${composition}" name="filter_compositions" value="${composition}">
                <label for="composition_expanded_${composition}">${composition}</label>
            </div>
        `).join('');
        
        basic.insertAdjacentHTML('beforeend', expandedHtml);
        
        button.dataset.expanded = 'true';
        const icon = button.querySelector('.load_more_icon');
        if (icon) {
            icon.classList.add('collapsed');
        }
    } else {
        // Collapse - remove appended items
        const expandedItems = basic.querySelectorAll('.composition_expanded_item');
        expandedItems.forEach(item => item.remove());
        
        button.dataset.expanded = 'false';
        const icon = button.querySelector('.load_more_icon');
        if (icon) {
            icon.classList.remove('collapsed');
        }
    }
}


function clearMeasurementInput(measurementName) {
    const input = document.getElementById(`measurement_${measurementName}`);
    if (input) {
        input.value = '';
    }
}

function clearMeasurementRange(measurementName) {
    const fromInput = document.getElementById(`measurement_${measurementName}_from`);
    const toInput = document.getElementById(`measurement_${measurementName}_to`);
    if (fromInput) fromInput.value = '';
    if (toInput) toInput.value = '';
}

function applyFilters() {
    console.log('🔧 Applying filters...');
    
    // 새로운 필터 적용 시 기존 저장된 상태 클리어
    clearSavedFilterState();
    
    // Collect all selected filters
    const selectedFilters = {
        categories: [],
        measurements: {},
        compositions: [],
        sizes: []
    };
    
    // Get selected categories (radio buttons)
    const selectedCategory = document.querySelector('#new_filter_category_grid input[type="radio"]:checked');
    if (selectedCategory) {
        selectedFilters.categories.push(selectedCategory.value);
    }
    
    // Get measurement ranges
    const measurementInputs = document.querySelectorAll('.filter_measurement_input');
    console.log(`🔍 Found ${measurementInputs.length} measurement inputs`);
    
    measurementInputs.forEach(input => {
        if (input.value && input.value.trim()) {
            const idParts = input.id.split('_');
            const measurementName = idParts[1];
            const isFrom = input.id.includes('_from');
            
            console.log(`🔍 Processing input: ${input.id}, value: ${input.value}, measurement: ${measurementName}, isFrom: ${isFrom}`);
            
            if (!selectedFilters.measurements[measurementName]) {
                selectedFilters.measurements[measurementName] = {};
            }
            
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue)) {
                if (isFrom) {
                    selectedFilters.measurements[measurementName].from = numValue;
                    console.log(`✅ Set ${measurementName} min: ${numValue}`);
                } else {
                    selectedFilters.measurements[measurementName].to = numValue;
                    console.log(`✅ Set ${measurementName} max: ${numValue}`);
                }
            }
        }
    });
    
    console.log('📏 Final measurement filters:', selectedFilters.measurements);
    
    // Get selected compositions
    const compositionInputs = document.querySelectorAll('.filter_panel input[name="filter_compositions"]:checked');
    compositionInputs.forEach(input => {
        selectedFilters.compositions.push(input.value);
    });
    
    // Get selected sizes
    const sizeInputs = document.querySelectorAll('.filter_panel input[name="filter_sizes"]:checked');
    sizeInputs.forEach(input => {
        selectedFilters.sizes.push(input.value);
    });
    
    console.log('🎯 Selected filters:', selectedFilters);
    
    // Apply filters to all items from backend
    filterAllItems(selectedFilters);
    
    // Close filter panel
    closeFilterPanel();
}

function filterAllItems(filters) {
    console.log('🔍 Fetching and filtering all items with:', filters);
    
    // Show loading state
    showLoadingState();
    
    // Fetch all items from backend
    fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            console.log(`📦 Received ${data.items.length} items from backend`);
            
            // Apply client-side filtering
            const filteredItems = applyFiltersToItems(data.items, filters);
            
            // Re-render grid with filtered items
            renderFilteredGrid(filteredItems);
            
            hideLoadingState();
        })
        .catch(error => {
            console.error('❌ Error fetching items:', error);
            hideLoadingState();
            showErrorMessage('Failed to load items');
        });
}

function applyFiltersToItems(items, filters) {
    return items.filter(item => {
        // Category filtering
        if (filters.categories.length > 0) {
            if (!item.category || !filters.categories.includes(item.category.toLowerCase())) {
                return false;
            }
        }
        
        // Measurement filtering
        if (Object.keys(filters.measurements).length > 0) {
            for (const measurement in filters.measurements) {
                const range = filters.measurements[measurement];
                
                // Try to get measurement value from different possible locations
                let itemValue = null;
                
                // Try direct field access first
                if (item[measurement] !== undefined && item[measurement] !== null) {
                    itemValue = parseFloat(item[measurement]);
                }
                // Try measurements object access
                else if (item.measurements && item.measurements[measurement] !== undefined) {
                    itemValue = parseFloat(item.measurements[measurement]);
                }
                
                console.log(`🔍 Filtering ${measurement}: item value=${itemValue}, range=`, range);
                
                if (!isNaN(itemValue) && itemValue > 0) {
                    if (range.from !== undefined && itemValue < range.from) {
                        console.log(`❌ Item filtered out: ${measurement} ${itemValue} < ${range.from}`);
                        return false;
                    }
                    if (range.to !== undefined && itemValue > range.to) {
                        console.log(`❌ Item filtered out: ${measurement} ${itemValue} > ${range.to}`);
                        return false;
                    }
                    console.log(`✅ Item passes ${measurement} filter: ${itemValue} is within range`);
                } else {
                    // If only 'to' filter is set and no measurement value, allow item to pass
                    if (range.from === undefined && range.to !== undefined) {
                        console.log(`✅ Item passes ${measurement} filter: no measurement value but only max filter set`);
                    } else {
                        // If no valid measurement value found, exclude this item
                        console.log(`❌ Item filtered out: no valid ${measurement} value found (${itemValue})`);
                        return false;
                    }
                }
            }
        }
        
        // Composition filtering
        if (filters.compositions.length > 0) {
            let itemCompositions = [];
            
            // Handle different composition data formats
            if (item.compositions) {
                if (Array.isArray(item.compositions)) {
                    itemCompositions = item.compositions;
                } else if (typeof item.compositions === 'string') {
                    // Handle string compositions (comma-separated)
                    itemCompositions = item.compositions.split(',').map(comp => comp.trim());
                } else if (typeof item.compositions === 'object' && item.compositions !== null) {
                    // Handle object compositions like {cotton: 100, polyester: 50}
                    itemCompositions = Object.keys(item.compositions);
                }
            }
            
            console.log(`🧵 Checking compositions for item: ${JSON.stringify(item.compositions)} -> parsed as: ${JSON.stringify(itemCompositions)}`);
            
            const hasMatchingComposition = filters.compositions.some(comp => 
                itemCompositions.some(itemComp => itemComp.toLowerCase().includes(comp.toLowerCase()))
            );
            
            if (!hasMatchingComposition) {
                console.log(`❌ Item filtered out: no matching composition. Item has: ${JSON.stringify(itemCompositions)}, Filter needs: ${JSON.stringify(filters.compositions)}`);
                return false;
            }
        }
        
        // Size filtering
        if (filters.sizes.length > 0) {
            if (!item.size || !filters.sizes.includes(item.size)) {
                return false;
            }
        }
        
        return true;
    });
}

function renderFilteredGrid(items) {
    const gridContainer = document.querySelector('.grid_container');
    if (!gridContainer) {
        console.error('❌ Grid container not found');
        return;
    }
    
    // Update subheader to show filter result
    updateSubheaderForFilter(items);
    
    // Clear existing grid items (keep other elements like subheader)
    const existingItems = gridContainer.querySelectorAll('.grid_item');
    existingItems.forEach(item => item.remove());
    
    // Hide no items message if it exists
    hideNoItemsMessage();
    
    if (items.length === 0) {
        showNoItemsMessage();
        return;
    }
    
    // Render new items
    items.forEach(item => {
        const gridItem = createGridItem(item);
        gridContainer.appendChild(gridItem);
    });
    
    console.log(`🎨 Rendered ${items.length} filtered items to grid`);
}

function updateSubheaderForFilter(items) {
    const subheaderText = document.querySelector('.subheader .text h1');
    if (!subheaderText) {
        console.error('❌ Subheader text not found');
        return;
    }
    
    // Collect all applied filter info
    const appliedFilters = [];
    
    // Category filter
    const selectedCategory = document.querySelector('#new_filter_category_grid input[type="radio"]:checked');
    if (selectedCategory) {
        appliedFilters.push(selectedCategory.value);
    }
    
    // Measurement filters
    const measurementInputs = document.querySelectorAll('.filter_measurement_input');
    const measurementFilters = [];
    measurementInputs.forEach(input => {
        if (input.value && input.value.trim()) {
            const idParts = input.id.split('_');
            const measurementName = idParts[1];
            const isFrom = input.id.includes('_from');
            
            let existingFilter = measurementFilters.find(f => f.name === measurementName);
            if (!existingFilter) {
                existingFilter = { name: measurementName, range: {} };
                measurementFilters.push(existingFilter);
            }
            
            if (isFrom) {
                existingFilter.range.from = input.value;
            } else {
                existingFilter.range.to = input.value;
            }
        }
    });
    
    measurementFilters.forEach(filter => {
        let rangeText = filter.name;
        if (filter.range.from && filter.range.to) {
            rangeText += ` (${filter.range.from}-${filter.range.to})`;
        } else if (filter.range.from) {
            rangeText += ` (≥${filter.range.from})`;
        } else if (filter.range.to) {
            rangeText += ` (≤${filter.range.to})`;
        }
        appliedFilters.push(rangeText);
    });
    
    // Composition filters
    const compositionInputs = document.querySelectorAll('.filter_panel input[name="filter_compositions"]:checked');
    const compositions = Array.from(compositionInputs).map(input => input.value);
    if (compositions.length > 0) {
        appliedFilters.push(...compositions);
    }
    
    // Size filters
    const sizeInputs = document.querySelectorAll('.filter_panel input[name="filter_sizes"]:checked');
    const sizes = Array.from(sizeInputs).map(input => input.value);
    if (sizes.length > 0) {
        appliedFilters.push(...sizes);
    }
    
    let filterText = appliedFilters.length > 0 ? appliedFilters.join(' · ') : 'Filter Results';
    if (items.length > 0) {
        filterText += ` (${items.length})`;
    }
    
    subheaderText.textContent = filterText;
    console.log(`📝 Updated subheader to: ${filterText}`);
}

function createGridItem(item) {
    const gridItem = document.createElement('div');
    gridItem.className = 'grid_item clickable';
    
    // Set data attributes for potential future filtering
    gridItem.dataset.category = item.category || '';
    gridItem.dataset.size = item.size || '';
    if (item.length) gridItem.dataset.length = item.length;
    if (item.chest) gridItem.dataset.chest = item.chest;
    if (item.waist) gridItem.dataset.waist = item.waist;
    
    // Create image with fallback - fix image path and sizing
    const img = document.createElement('img');
    
    // Try different image path formats
    let imageSrc = '';
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        imageSrc = item.images[0];
    } else if (item.thumbnail_url) {
        imageSrc = item.thumbnail_url;
    } else if (item.item_id) {
        imageSrc = `/static/src/db/${item.item_id}.jpg`;
    } else {
        imageSrc = '/static/src/img/measurement/measurement_top.svg';
    }
    
    img.src = imageSrc;
    img.alt = item.name || item.brand || 'Item';
    
    // Fallback error handling with multiple attempts
    img.onerror = function() {
        console.log(`❌ Failed to load image: ${this.src}`);
        if (this.src.includes('measurement_top.svg')) {
            // Already tried placeholder, show colored background
            this.classList.add('hidden');
            gridItem.classList.add('grid_item_no_image');
            gridItem.innerHTML = `<div class="grid_item_placeholder">${item.brand || 'No Image'}<br>${item.category || ''}</div>`;
        } else {
            // Try placeholder image (short sleeve top measurement)
            this.src = '/static/src/img/measurement/measurement_top.svg';
        }
    };
    
    gridItem.appendChild(img);
    
    // Add click handler - fix item ID
    gridItem.addEventListener('click', () => {
        const itemId = item.item_id || item.id;
        if (itemId) {
            // 현재 필터 상태와 화면 상태를 저장
            saveCurrentFilterState();
            window.location.href = `/item.html?id=supabase_${itemId}`;
        } else {
            console.error('No item ID found for item:', item);
        }
    });
    
    console.log(`🖼️ Created grid item for: ${item.brand} ${item.name || ''} (${item.category})`);
    return gridItem;
}

function showLoadingState() {
    const gridContainer = document.querySelector('.grid_container');
    if (gridContainer) {
        gridContainer.innerHTML = '<div class="loading_message">Loading filtered items...</div>';
    }
}

function hideLoadingState() {
    const loading = document.querySelector('.loading_message');
    if (loading) {
        loading.remove();
    }
}

function showErrorMessage(message) {
    const gridContainer = document.querySelector('.grid_container');
    if (gridContainer) {
        gridContainer.innerHTML = `<div class="error_message">${message}</div>`;
    }
}

function filterCurrentPageItems(filters) {
    console.log('🔍 Filtering current page items with:', filters);
    
    const gridItems = document.querySelectorAll('.grid_item');
    let visibleCount = 0;
    let totalCount = gridItems.length;
    
    gridItems.forEach(item => {
        let shouldShow = true;
        
        // Category filtering
        if (filters.categories.length > 0) {
            const itemCategory = item.dataset.category;
            console.log(`Item category: ${itemCategory}, Filter: ${filters.categories[0]}`);
            
            if (!itemCategory || !filters.categories.includes(itemCategory.toLowerCase())) {
                shouldShow = false;
                console.log(`❌ Item hidden due to category mismatch`);
            }
        }
        
        // Measurement filtering
        if (shouldShow && Object.keys(filters.measurements).length > 0) {
            Object.keys(filters.measurements).forEach(measurement => {
                const range = filters.measurements[measurement];
                const itemValue = parseFloat(item.dataset[measurement]);
                
                console.log(`Checking ${measurement}: item=${itemValue}, range=`, range);
                
                if (!isNaN(itemValue)) {
                    if (range.from !== undefined && itemValue < range.from) {
                        shouldShow = false;
                        console.log(`❌ Item hidden: ${measurement} ${itemValue} < ${range.from}`);
                    }
                    if (range.to !== undefined && itemValue > range.to) {
                        shouldShow = false;
                        console.log(`❌ Item hidden: ${measurement} ${itemValue} > ${range.to}`);
                    }
                }
            });
        }
        
        // Composition filtering
        if (shouldShow && filters.compositions.length > 0) {
            const itemCompositions = item.dataset.compositions ? item.dataset.compositions.split(',') : [];
            const hasMatchingComposition = filters.compositions.some(comp => 
                itemCompositions.some(itemComp => itemComp.trim().toLowerCase().includes(comp.toLowerCase()))
            );
            
            if (!hasMatchingComposition) {
                shouldShow = false;
                console.log(`❌ Item hidden due to composition mismatch`);
            }
        }
        
        // Size filtering
        if (shouldShow && filters.sizes.length > 0) {
            const itemSize = item.dataset.size;
            if (!itemSize || !filters.sizes.includes(itemSize)) {
                shouldShow = false;
                console.log(`❌ Item hidden due to size mismatch`);
            }
        }
        
        // Show/hide item
        if (shouldShow) {
            item.classList.remove('hidden');
            visibleCount++;
        } else {
            item.classList.add('hidden');
        }
    });
    
    console.log(`✅ Filtering complete: ${visibleCount}/${totalCount} items visible`);
    
    // Show message if no items match
    if (visibleCount === 0) {
        showNoItemsMessage();
    } else {
        hideNoItemsMessage();
    }
}

function showNoItemsMessage() {
    let message = document.querySelector('.no_items_message');
    if (!message) {
        message = document.createElement('div');
        message.className = 'no_items_message';
        message.textContent = 'No items match your filters';
        
        const gridContainer = document.querySelector('.grid_container');
        if (gridContainer) {
            gridContainer.appendChild(message);
        }
    }
    message.classList.remove('hidden');
}

function hideNoItemsMessage() {
    const message = document.querySelector('.no_items_message');
    if (message) {
        message.classList.add('hidden');
    }
}

function sendFiltersToBackend(filters) {
    console.log('📡 Sending filters to backend:', filters);
    
    // Create URLSearchParams for GET request
    const params = new URLSearchParams();
    
    // Add category filter
    if (filters.categories.length > 0) {
        params.append('category', filters.categories[0]);
    }
    
    // Add measurement filters
    Object.keys(filters.measurements).forEach(measurement => {
        const range = filters.measurements[measurement];
        if (range.from !== undefined) {
            params.append(`${measurement}_min`, range.from);
        }
        if (range.to !== undefined) {
            params.append(`${measurement}_max`, range.to);
        }
    });
    
    // Add composition filters
    if (filters.compositions.length > 0) {
        params.append('compositions', filters.compositions.join(','));
    }
    
    // Add size filters
    if (filters.sizes.length > 0) {
        params.append('sizes', filters.sizes.join(','));
    }
    
    // Redirect to current page with filters
    const currentPath = window.location.pathname;
    const newUrl = `${currentPath}?${params.toString()}`;
    
    console.log('🔄 Redirecting to:', newUrl);
    window.location.href = newUrl;
}

function filterItems(filters) {
    const gridItems = document.querySelectorAll('.grid_item');
    let visibleCount = 0;
    
    gridItems.forEach(item => {
        let shouldShow = true;
        
        // Category filtering (if any categories selected)
        if (filters.categories.length > 0) {
            const itemCategory = item.dataset.category;
            if (!filters.categories.includes(itemCategory)) {
                shouldShow = false;
            }
        }
        
        // Size filtering (if any sizes selected)
        if (filters.sizes.length > 0 && shouldShow) {
            const itemSize = item.dataset.size;
            if (!filters.sizes.includes(itemSize)) {
                shouldShow = false;
            }
        }
        
        // Composition filtering (if any compositions selected)
        if (filters.compositions.length > 0 && shouldShow) {
            const itemCompositions = item.dataset.compositions ? item.dataset.compositions.split(',') : [];
            const hasMatchingComposition = filters.compositions.some(comp => 
                itemCompositions.some(itemComp => itemComp.trim().toLowerCase().includes(comp.toLowerCase()))
            );
            if (!hasMatchingComposition) {
                shouldShow = false;
            }
        }
        
        // Show/hide item
        if (shouldShow) {
            item.classList.remove('hidden');
            visibleCount++;
        } else {
            item.classList.add('hidden');
        }
    });
    
    console.log(`🔍 Filtered items: ${visibleCount}/${gridItems.length} visible`);
    
    // Show no items message if needed
    const noItemsMsg = document.querySelector('.no_items_message');
    if (visibleCount === 0) {
        if (!noItemsMsg) {
            const message = document.createElement('div');
            message.className = 'no_items_message';
            message.textContent = 'No items match the selected filters.';
            document.querySelector('.grid_container').appendChild(message);
        }
    } else {
        if (noItemsMsg) {
            noItemsMsg.remove();
        }
    }
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
    } if (cat == "outer") {
        // outer에 길이 추가 (short, long만 사용 - 인덱스 5, 6)
        for (var i = 5; i < 7; i++) {
            const item = document.createElement('div');
            item.className = "grid_sub_category";
            item.innerHTML = `<input type="radio" name="sub_category_input_2" class="category_image" id="sub_category_list_outer_`+i+`" value="` + subCategoryList[i] + `" /><label for="sub_category_list_outer_`+i+`">`+subCategoryList[i]+`</label></input>`;
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


/* myFunction toggles between adding and removing the show class, which is used to hide and show the dropdown content */
function show() {
    const dropdown = document.querySelector(".size_region_dropdown");
    if (dropdown) {
        dropdown.classList.toggle("show");
    }
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
        item.addEventListener('click', function(e) {
            e.stopPropagation(); // 이벤트 버블링 방지
            displaySizesByRegion(this.value);
            selectedSizeRegion(this.value);
            // dropdown 닫기
            const dropdown = document.querySelector(".size_region_dropdown");
            if (dropdown) {
                dropdown.classList.remove("show");
            }
        }, false);
    }
}

function displaySizesByRegion(region) {

    var accordingSizes = [];
    var grid = document.querySelector(".size_key_container");
    grid.innerHTML = ``;
    
    if (region == "etc") {
        // etc region 선택 시 버튼들도 표시하고 텍스트 입력창도 함께 표시
        accordingSizes = getSizesByRegion(region);
        
        // 사이즈 버튼들 생성
        for (var i = 0; i < accordingSizes.length; i++) {
            const item = document.createElement('div');
            item.className = "size_key";
            item.innerHTML = `<input type="radio" name="size_key" id="size_key_`+i+`" value="` + accordingSizes[i] + `"/><label for="size_key_`+i+`">`+accordingSizes[i]+`</label></input>`;
            grid.appendChild(item);
        }
        
        // 추가로 텍스트 입력창도 표시
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
        
        etcInput.classList.add('size_etc_input_visible');
        grid.appendChild(etcInput);
        console.log('✅ etc buttons and input displayed');
        return;
    }
    
    // getSizesByRegion 함수 참조 - 중복 정의 금지
    accordingSizes = getSizesByRegion(region);
    
    // 일반 region들의 사이즈 버튼들 생성
    for (var i = 0; i < accordingSizes.length; i++) {
        const item = document.createElement('div');
        item.className = "size_key";
        item.innerHTML = `<input type="radio" name="size_key" id="size_key_`+i+`" value="` + accordingSizes[i] + `"/><label for="size_key_`+i+`">`+accordingSizes[i]+`</label></input>`;
        grid.appendChild(item);
    }
    var cont = document.querySelector(".grid_container_size");
    if (accordingSizes.length > 5){
        cont.classList.add('container_height_120');
    } else if (accordingSizes.length > 10){
        cont.classList.add('container_height_180');
    } else {
        cont.classList.add('container_height_80');
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
    
    // 공통 함수만 사용 (모든 중복 정의 금지)
    var accordingSizes = getMeasurementsByCategory(selected);
    
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
        item.innerHTML = `<div class="part">`+accordingSizes[i]+`</div> <input type="number" id="measurementInput`+i+`" class="measurement_input" autocomplete="off"></div>`;
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

function displayColorInput() {
    console.log('🎨 displayColorInput called');
    const container = document.getElementById('color_selection_container');
    
    if (!container) {
        console.error('❌ Color selection container not found');
        return;
    }
    
    // colorList가 정의되지 않은 경우 기본값 사용
    if (typeof colorList === 'undefined') {
        console.log('⚠️ colorList not defined, using default colors');
        window.colorList = [
            {value: "000000", label: "black"},
            {value: "FFFFFF", label: "white"},
            {value: "808080", label: "gray"}
        ];
    }
    
    console.log('🎨 Color list length:', colorList.length);
    
    // 동적으로 CSS 클래스 생성
    generateColorCSS();
    
    // 색상 선택 그리드 생성
    const colorGrid = document.createElement('div');
    colorGrid.className = 'color_grid';
    colorGrid.innerHTML = colorList.map(color => `
        <div class="color_option" data-color="${color.label}" onclick="selectColor('${color.label}')">
            <div class="color_circle color_${color.label}${color.label === 'white' ? ' color_white' : ''}" title="${color.label}"></div>
            <span class="color_label">${color.label}</span>
        </div>
    `).join('');
    
    container.appendChild(colorGrid);
}

function generateColorCSS() {
    // 기존 color CSS 제거
    const existingStyle = document.getElementById('dynamic-color-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // 새로운 style 태그 생성
    const style = document.createElement('style');
    style.id = 'dynamic-color-styles';
    
    // colorList에서 CSS 클래스 생성
    const cssRules = colorList.map(color => {
        if (color.label === 'stripe') {
            return `.color_${color.label} { background: repeating-linear-gradient(45deg, #000 0px, #000 10px, #fff 10px, #fff 20px); }`;
        } else if (color.label === 'multi') {
            return `.color_${color.label} { background: linear-gradient(45deg, #ffff00 10%, #78DFF1 30%, #6877E0 50%, #F178B6 80%, #ED4447 100%); }`;
        } else {
            return `.color_${color.label} { background-color: #${color.value}; }`;
        }
    }).join('\n');
    
    style.textContent = cssRules;
    document.head.appendChild(style);
    
    console.log('✅ Dynamic color CSS generated for', colorList.length, 'colors');
}

function selectColor(colorLabel) {
    console.log('🎨 Color clicked:', colorLabel);
    
    const selectedOption = document.querySelector(`.color_option[data-color="${colorLabel}"]`);
    if (selectedOption) {
        // Toggle 방식: 선택/해제
        if (selectedOption.classList.contains('selected')) {
            selectedOption.classList.remove('selected');
            console.log('❌ Color deselected:', colorLabel);
        } else {
            selectedOption.classList.add('selected');
            console.log('✅ Color selected:', colorLabel);
        }
        
        // 현재 선택된 모든 색상 표시
        const allSelected = document.querySelectorAll('.color_option.selected');
        const selectedColors = Array.from(allSelected).map(option => option.getAttribute('data-color'));
        console.log('🎨 Currently selected colors:', selectedColors);
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
        item.innerHTML = `<div class="part">${compositionList[i]}</div><input type="text" id="compositionInput${i}" class="composition_input" autocomplete="off">`;
        basicGrid.appendChild(item);
        console.log(`🧪 Added composition input for: ${compositionList[i]}`);
    }
    
    grid.appendChild(basicGrid);
    
    // composition sets 초기화 (아직 사용하지 않음)
    window.compositionSets = [];
    window.usingMultiSets = false;
}

// + 버튼 클릭시 다중 세트 모드로 전환
function addCompositionSet(setName = '', preloadedData = null) {
    console.log('🧪 Adding new composition set - transitioning to multi-set mode');
    console.log('🧪 SetName:', setName, 'PreloadedData:', preloadedData);
    
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
        createCompositionSet(0, 'shell', existingValues);
        
        // 새로운 세트 추가 (이름 있음)
        createCompositionSet(1, setName || 'lining');
        return; // 여기서 함수 종료
    } else {
        // 이미 다중 세트 모드인 경우 새 세트만 추가
        const setIndex = window.compositionSets.length;
        createCompositionSet(setIndex, setName || `shell ${setIndex + 1}`);
        return; // 여기서 함수 종료
    }
}

// 실제 composition 세트 생성 함수
function createCompositionSet(setIndex, setName, existingValues = {}) {
    console.log(`🧪 Creating composition set ${setIndex} with name: "${setName}"`);
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
                   autocomplete="off"
                   onchange="updateCompositionSetName(${setIndex}, this.value)">
            ${setIndex > 0 ? `<button type="button" class="remove_composition_set_btn" onclick="removeCompositionSet(${setIndex})">×</button>` : ''}
        </div>
        <div class="grid_container_composition" id="composition_grid_${setIndex}">
        </div>
    `;
    
    container.appendChild(setDiv);
    console.log(`✅ Set ${setIndex} HTML created and appended`);
    
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
                   value="${existingValue}"
                   autocomplete="off"
                   class="composition_input"
                   onchange="updateCompositionValue(${setIndex}, '${material}', this.value)"
                   oninput="updateCompositionValue(${setIndex}, '${material}', this.value)">
        `;
        grid.appendChild(item);
    }
    
    console.log(`✅ Created composition set ${setIndex}: ${setName}`);
    
    // 세트가 하나만 있는 경우 원래 스타일로 복원
    setTimeout(() => {
        if (window.compositionSets && window.compositionSets.length === 1) {
            const container = document.getElementById('composition_sets_container');
            if (container) {
                const compositionSet = container.querySelector('.composition_set');
                if (compositionSet) {
                    compositionSet.classList.add('composition_set_transparent');
                }
                
                const setHeader = container.querySelector('.composition_set_header');
                if (setHeader) {
                    setHeader.classList.add('hidden');
                }
            }
        }
    }, 10);
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
    console.log('🔄 Refreshing composition sets');
    const container = document.getElementById('composition_sets_container');
    if (!container) return;
    
    // 기존 데이터 백업
    const sets = [...window.compositionSets];
    console.log('📦 Backed up sets:', sets);
    
    // 기존 HTML 전체 제거
    container.innerHTML = '';
    
    // 세트들 다시 생성
    window.compositionSets = [];
    
    sets.forEach((set, index) => {
        createCompositionSet(index, set.name, set.compositions);
    });
    
    // 세트가 하나만 남은 경우 원래 스타일로 복원
    if (sets.length === 1) {
        console.log('🔄 Reverting to single set mode');
        window.usingMultiSets = false; // 단일 모드로 되돌림
        
        const container = document.getElementById('composition_sets_container');
        if (container) {
            // composition_set 스타일 제거
            const compositionSet = container.querySelector('.composition_set');
            if (compositionSet) {
                compositionSet.classList.add('composition_set_transparent');
            }
            
            // 세트 헤더 숨김
            const setHeader = container.querySelector('.composition_set_header');
            if (setHeader) {
                setHeader.classList.add('hidden');
            }
        }
    }
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
        console.log(`📝 updateCompositionValue called: setIndex=${setIndex}, material=${material}, value="${value}"`);
        
        if (value && value.trim() !== '') {
            window.compositionSets[setIndex].compositions[material] = value.trim();
            console.log(`✅ Added/Updated ${material} in set ${setIndex} to: "${value}"`);
        } else {
            console.log(`🗑️ Deleting ${material} from set ${setIndex} (empty value)`);
            delete window.compositionSets[setIndex].compositions[material];
        }
        
        console.log(`🧪 Current set ${setIndex} compositions:`, window.compositionSets[setIndex].compositions);
        console.log(`🧪 All composition sets:`, window.compositionSets);
    } else {
        console.error(`❌ Cannot update composition: setIndex=${setIndex}, compositionSets available:`, !!window.compositionSets);
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
    let query = window.location.search;
    let param = new URLSearchParams(query);
    let id = param.get('id');

    if (!id) {
        console.error('❌ No item ID found in URL');
        return;
    }


    // Supabase에서 실제 아이템 데이터 로드
    fetch(`/api/items/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.item) {
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
    
    // 브랜드와 카테고리 정보 표시
    const brandElement = document.getElementById('item_brand');
    const categoryElement = document.getElementById('item_category');
    
    if (brandElement) {
        brandElement.textContent = item.brand || 'Brand Name';
        
        // 한글이 포함된 브랜드명에는 GmarketSans Bold 폰트 적용
        if (item.brand) {
            const hasKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(item.brand);
            if (hasKorean) {
                brandElement.classList.add('item_brand');
            } else {
                brandElement.classList.remove('item_brand');
            }
        } else {
            brandElement.classList.remove('item_brand');
        }
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
            displayStitchedImagesAsCarousel(item.images, imageContainer);
        } else {
            // Individual 이미지들도 stitched와 동일한 carousel 형태로 표시
            displayStitchedImagesAsCarousel(item.images, imageContainer);
        }
    }
    
    // Size 정보 표시
    const sizeElement = document.querySelector('.view_size');
    if (sizeElement && item.size) {
        let sizeText;
        if (item.size_region && item.size_region.toUpperCase() === 'WW') {
            sizeText = `Size ${item.size}`;
        } else {
            sizeText = item.size_region ? `${item.size_region} ${item.size}` : item.size;
        }
        sizeElement.textContent = sizeText;
        sizeElement.classList.remove('hidden'); // CSS 클래스 제거
        sizeElement.classList.remove('hidden', 'item_size_hidden');
        sizeElement.classList.add('item_size');
    }
    
    // Measurement 표시
    if (item.category) {
        const measurementContainer = document.getElementById('measurement_container');
        if (measurementContainer) {
            measurementContainer.innerHTML = ''; // 기존 내용 제거
            
            // measurement 값이 있는지 확인
            const hasMeasurements = item.measurements && Object.keys(item.measurements).some(key => 
                item.measurements[key] && item.measurements[key].toString().trim() !== ''
            );
            
            // 모바일에서 measurement 값이 없으면 영역 숨김
            if (window.innerWidth <= 400 && !hasMeasurements) {
                measurementContainer.classList.add('hidden');
                return;
            } else {
                measurementContainer.classList.remove('hidden');
            }
            
            // 카테고리별 measurement 생성
            if (item.category === 'top' || item.category === 'outer') {
                // outer 카테고리의 경우 length (subcategory2)에 따라 분기
                const subcategory = item.subcategory || '';
                const subcategory2 = item.subcategory2 || '';
                
                if (item.category === 'outer' && subcategory2 === 'long') {
                    // Outer에서 length가 long인 경우 sleeve type에 따라 분기
                    if (subcategory === 'long sleeve') {
                        createOuterLongSleeveLongMeasurement(measurementContainer, item.measurements);
                    } else if (subcategory === 'short sleeve') {
                        createOuterShortSleeveLongMeasurement(measurementContainer, item.measurements);
                    } else {
                        // sleeve 정보가 없으면 기본 long sleeve로 처리
                        createOuterLongSleeveLongMeasurement(measurementContainer, item.measurements);
                    }
                } else if (subcategory.toLowerCase().includes('long sleeve')) {
                    // Top 또는 outer에서 long sleeve인 경우
                    createTopLongSleeveMeasurement(measurementContainer, item.measurements);
                } else {
                    // 기본값: top measurement 사용 (outer short length 포함)
                    createTopMeasurement(measurementContainer, item.measurements);
                }
            } else if (item.category === 'dress') {
                // Dress 카테고리 - 서브카테고리와 서브카테고리2 전달
                createDressMeasurement(measurementContainer, item.measurements, item.subcategory, item.subcategory2);
            } else if (item.category === 'skirt') {
                // Skirt 카테고리 - 서브카테고리 전달 (subcategory에 long/mini 정보)
                console.log('📏 Creating skirt measurement in populateItemView for subcategory:', item.subcategory);
                createSkirtMeasurement(measurementContainer, item.measurements, item.subcategory);
            } else if (item.category === 'pants_short' || (item.category === 'pants' && item.subcategory === 'short')) {
                // Pants Short 카테고리 (pants_short 또는 pants+subcategory:short)
                console.log('📏 Creating pants_short measurement in populateItemView');
                createPantsShortMeasurement(measurementContainer, item.measurements);
            } else if (item.category === 'pants_long' || (item.category === 'pants' && item.subcategory === 'long')) {
                // Pants Long 카테고리 (pants_long 또는 pants+subcategory:long)
                console.log('📏 Creating pants_long measurement in populateItemView');
                createPantsLongMeasurement(measurementContainer, item.measurements);
            }
            
            // measurement 값이 없으면 "No measurement" 텍스트 추가
            if (!hasMeasurements) {
                const noMeasurementText = document.createElement('div');
                noMeasurementText.className = 'no_measurement_text';
                noMeasurementText.innerHTML = 'No<br>measurement';
                measurementContainer.appendChild(noMeasurementText);
            }
            
            // 다른 카테고리들도 필요시 추가
        }
    }
    
    // Composition 표시
    updateCompositionDisplay(item);
    
    // Window resize 이벤트로 measurement 표시/숨김 처리
    const handleResize = () => {
        const measurementContainer = document.getElementById('measurement_container');
        if (measurementContainer) {
            // measurement 값이 있는지 확인
            const hasMeasurements = item.measurements && Object.keys(item.measurements).some(key => 
                item.measurements[key] && item.measurements[key].toString().trim() !== ''
            );
            
            if (window.innerWidth <= 400 && !hasMeasurements) {
                measurementContainer.classList.add('hidden');
            } else {
                measurementContainer.classList.remove('hidden');
            }
        }
    };
    
    // 기존 이벤트 리스너 제거 후 새로 추가
    window.removeEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    
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
        console.log('Checking individual files...');
        
        // 기존 파일 선택 방식을 우선으로 체크
        const individualFiles = document.querySelector('.file_uploader').files;
        console.log('File input files:', individualFiles.length);
        
        if (individualFiles.length > 0) {
            for (let i = 0; i < individualFiles.length; i++) {
                formData.append('individual_images', individualFiles[i]);
                console.log('Added file:', individualFiles[i].name);
            }
            console.log('Sending', individualFiles.length, 'individual files (file input)');
            hasImages = true;
        } else if (window.individualFiles && window.individualFiles.length > 0) {
            // copy & paste로 추가된 이미지들 사용
            for (let i = 0; i < window.individualFiles.length; i++) {
                formData.append('individual_images', window.individualFiles[i]);
                console.log('Added window file:', window.individualFiles[i].name);
            }
            console.log('🔍 DEBUGGING: Sending', window.individualFiles.length, 'individual files (window.individualFiles)');
            console.log('🔍 DEBUGGING: Files being sent:', window.individualFiles.map(f => f.name));
            hasImages = true;
        }
        formData.append('main_image_index', mainImageIndex || 0);
    }
    
    // 이미지 유효성 검사
    if (!hasImages) {
        alert('이미지를 추가해주세요!');
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
        // etc region 선택 시 라디오 버튼 먼저 확인, 없으면 텍스트 입력창 확인
        const sizeInput = document.querySelector('input[name="size_key"]:checked');
        if (sizeInput) {
            // 라디오 버튼(1, 2) 선택된 경우
            size = sizeInput.value;
            console.log('🔍 [SIZE] etc region radio button selected:', size);
        } else {
            // 텍스트 입력창 값 사용
            const sizeEtcInput = document.getElementById('size_etc_input');
            sizeEtc = sizeEtcInput ? sizeEtcInput.value.trim() : '';
            size = sizeEtc;
            console.log('🔍 [SIZE] etc region text input used:', size);
        }
    } else {
        // 일반 region들의 사이즈 버튼에서 선택
        const sizeInput = document.querySelector('input[name="size_key"]:checked');
        size = sizeInput ? sizeInput.value : '';
        console.log('🔍 [SIZE] regular region selected:', size);
    }
    
    // 측정 데이터 (measurement) - 빈 값도 포함하여 삭제 처리
    const measurements = {};
    const measurementInputs = document.querySelectorAll('.measurement_input');
    measurementInputs.forEach((input, index) => {
        const label = input.parentElement.querySelector('.part');
        if (label) {
            // 빈 값도 전송하여 서버에서 삭제 처리할 수 있도록 함
            measurements[label.textContent] = input.value || '';
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
        : ((Array.isArray(compositions) && compositions.length > 0) || (typeof compositions === 'object' && compositions !== null && Object.keys(compositions).length > 0));
    
    if (!hasBrand && !hasSize && !hasComposition) {
        missingFields.push('브랜드, 사이즈, 소재 중 최소 하나');
    }
    
    if (missingFields.length > 0) {
        alert(`다음 필수 항목을 입력해주세요:\n${missingFields.join(', ')}`);
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
    // 빈 값도 포함하여 measurements 전송 (삭제 처리를 위해)
    formData.append('measurements', JSON.stringify(measurements));
    // Composition 데이터 추가 (Edit 페이지와 동일한 로직 사용)
    const hasCompositionData = window.usingMultiSets 
        ? (typeof compositions === 'object' && compositions !== null && Object.keys(compositions).length > 0 && Object.values(compositions).some(set => Object.keys(set).length > 0))
        : ((Array.isArray(compositions) && compositions.length > 0) || (typeof compositions === 'object' && compositions !== null && Object.keys(compositions).length > 0));
    console.log('🧪 Has composition data (Add page):', hasCompositionData);
    
    if (hasCompositionData) {
        const compositionJson = JSON.stringify(compositions);
        console.log('✅ Adding composition data to FormData (Add page):', compositionJson);
        formData.append('compositions', compositionJson);
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
        
        // Add 모드에서도 빈 composition 전송 (일관성을 위해)
        console.log('🔧 Adding empty compositions for add mode');
        formData.append('compositions', JSON.stringify({}));
    }
    if (year) formData.append('year', year);
    if (season) formData.append('season', season);
    if (purchaseYear) formData.append('purchaseYear', purchaseYear);
    
    // Tags 데이터 수집
    const selectedTags = [];
    const tagCheckboxes = document.querySelectorAll('input[name="tags"]:checked');
    tagCheckboxes.forEach(checkbox => {
        selectedTags.push(checkbox.value);
    });
    if (selectedTags.length > 0) {
        formData.append('tags', selectedTags.join(', '));
        console.log('🏷️ Adding tags to FormData:', selectedTags.join(', '));
    }
    
    // Color 데이터 수집 (멀티 셀렉트) - 디버깅 강화
    console.log('🎨 [ADD] Starting color data collection...');
    const colorContainer = document.getElementById('color_selection_container');
    console.log('🎨 [ADD] Color container found:', !!colorContainer);
    console.log('🎨 [ADD] Color container HTML:', colorContainer ? colorContainer.innerHTML.substring(0, 200) + '...' : 'N/A');
    
    const selectedColors = document.querySelectorAll('.color_option.selected');
    console.log('🎨 [ADD] Found selected color elements:', selectedColors.length);
    
    if (selectedColors.length > 0) {
        selectedColors.forEach((el, i) => {
            console.log(`🎨 [ADD] Selected color ${i}:`, el.getAttribute('data-color'));
            console.log(`🎨 [ADD] Element ${i} classes:`, el.className);
        });
        
        const colorLabels = Array.from(selectedColors).map(option => option.getAttribute('data-color'));
        const colorString = colorLabels.join(', ');
        formData.append('color', colorString);
        console.log('🎨 [ADD] Adding colors to FormData:', colorString);
        console.log('🎨 [ADD] FormData color check:', formData.get('color'));
    } else {
        console.log('🎨 [ADD] No colors selected');
        console.log('🎨 [ADD] All color options:', document.querySelectorAll('.color_option').length);
        console.log('🎨 [ADD] Color options with selected class:', document.querySelectorAll('.color_option.selected').length);
    }
    
    // FormData 내용 디버깅
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
            console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
        } else {
            console.log(`  ${key}: ${value}`);
        }
    }
    
    // Flask 서버로 전송
    const token = localStorage.getItem('userToken');
    console.log('Using auth token for add_item:', token ? token.substring(0, 20) + '...' : 'none');
    
    fetch('/add_item', {
        method: 'POST',
        body: formData,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        console.log('itemID in response:', data.itemID);
        // 검색 캐시 클리어 (새 아이템이 추가되었으므로)
        clearSearchCache();
        // 아이템 페이지로 리다이렉트
        if (data.itemID) {
            console.log('Redirecting to item page with ID:', data.itemID);
            // 히스토리를 조작하여 back 버튼으로 add 페이지 대신 index로 가게 함
            history.replaceState(null, '', '/index.html');
            window.location.href = `/item.html?id=supabase_${data.itemID}`;
        } else {
            console.log('No itemID found, redirecting to all.html');
            // fallback to all.html if no itemID
            history.replaceState(null, '', '/index.html');
            window.location.href = '/all.html';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred: ' + error.message);
    });
}

// 이미지 파일 업로드 로직

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
    
        
    if (itemId && itemId.startsWith('supabase_')) {
        fetch(`/api/items/${itemId}`)
            .then(response => response.json())
            .then(data => {
                if (data.item) {
                    const item = data.item;
                    
                    if (item.images) {
                        
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
                                return { fixed: fixedUrl, original: url };
                            }
                            return { fixed: url, original: url };
                        });
                        
                        // 첫 번째 이미지로 URL 접근성 테스트 (프록시를 통해 테스트)
                        const testImg = new Image();
                        let urlTestComplete = false;
                        
                        testImg.onload = () => {
                            // 수정된 URL 사용
                            item.images = fixedImages.map(img => img.fixed);
                            urlTestComplete = true;
                            
                            const viewContainer = document.querySelector('.view_item_image');
                            
                            if (viewContainer.children.length === 0) {
                                updateItemDisplay(item);
                            } else {
                                // 중복 호출 방지 - 이미 populateItemView에서 처리됨
                            }
                        };
                        
                        testImg.onerror = () => {
                            // 원본 URL 사용
                            item.images = originalImages;
                            fixedImages = originalImages.map(url => ({ fixed: url, original: url }));
                            urlTestComplete = true;
                            // updateItemDisplay은 이미 populateItemView에서 호출되었음
                        };
                        
                        if (fixedImages && fixedImages.length > 0 && fixedImages[0].fixed) {
                            // 직접 URL 사용 (프록시 우회)
                            testImg.src = fixedImages[0].fixed;
                        } else {
                            urlTestComplete = true;
                        }
                        
                        // 테스트 타임아웃 (1초 후 원본 URL 사용)
                        setTimeout(() => {
                            if (!urlTestComplete) {
                                item.images = originalImages;
                                urlTestComplete = true;
                                // updateItemDisplay은 이미 populateItemView에서 호출되었음
                            }
                        }, 1000);
                        
                        
                        // updateItemDisplay는 위의 비동기 테스트에서 조건부로 호출됨
                        // 여기서는 호출하지 않음
                    } else {
                        // 이미지가 없는 경우에만 바로 업데이트
                        updateItemDisplay(item);
                    }
                } else {
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
    const brandElement = document.getElementById('item_brand');
    if (brandElement && item.brand) {
        brandElement.textContent = item.brand;
        
        // 한글이 포함된 브랜드명에는 GmarketSans Bold 폰트 적용
        const hasKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(item.brand);
        if (hasKorean) {
            brandElement.classList.add('item_brand');
        } else {
            brandElement.classList.remove('item_brand');
        }
    }
    
    // 카테고리 업데이트
    const categoryElement = document.getElementById('item_category');
    if (categoryElement) {
        const categoryText = [item.subcategory, item.category].filter(Boolean).join(' ');
        if (categoryText) {
            categoryElement.textContent = categoryText;
        }
    }
    
    // 이미지 처리는 populateItemView에서만 수행하도록 중복 제거
    
    // 사이즈 정보 업데이트
    updateSizeDisplay(item);
    
    // Composition 정보 업데이트
    updateCompositionDisplay(item);
    
    // Measurement 처리는 populateItemView에서만 수행하도록 중복 제거
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
            sizeElement.textContent = sizeText;
            sizeElement.classList.remove('hidden'); // CSS 클래스 제거
            sizeElement.classList.remove('hidden', 'item_size_hidden');
            sizeElement.classList.add('item_size');
        } else {
            // 사이즈 정보가 없으면 숨김
            sizeElement.classList.remove('item_size');
            sizeElement.classList.add('item_size_hidden');
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
                        compDiv.classList.add('composition_block');
                        
                        const labelDiv = document.createElement('div');
                        labelDiv.className = 'comp_label';
                        labelDiv.textContent = material;
                        labelDiv.classList.add('composition_label');
                        
                        compDiv.appendChild(labelDiv);
                        compositionContainer.appendChild(compDiv);
                    }
                });
            } else if (typeof compositions === 'object') {
                // Multi-set composition인지 확인 (값이 객체인 경우)
                const hasNestedObjects = Object.values(compositions).some(value => 
                    typeof value === 'object' && value !== null && !Array.isArray(value)
                );
                
                if (hasNestedObjects) {
                    // Multi-set composition 처리
                    console.log('🧪 Processing multi-set composition:', compositions);
                    
                    // Custom ordering: shell (any shell*) first, then lining, then others alphabetically
                    console.log('🔧 Original composition sets order:', Object.keys(compositions));
                    const sortedSets = Object.entries(compositions).sort(([a], [b]) => {
                        const aLower = a.toLowerCase();
                        const bLower = b.toLowerCase();
                        
                        const aIsShell = aLower.startsWith('shell');
                        const bIsShell = bLower.startsWith('shell');
                        const aIsLining = aLower === 'lining';
                        const bIsLining = bLower === 'lining';
                        
                        // Shell variants come first
                        if (aIsShell && !bIsShell) return -1;
                        if (!aIsShell && bIsShell) return 1;
                        
                        // Both are shell variants - alphabetical order
                        if (aIsShell && bIsShell) return a.localeCompare(b);
                        
                        // Lining comes after shell but before others
                        if (aIsLining && !bIsLining && !bIsShell) return -1;
                        if (!aIsLining && !aIsShell && bIsLining) return 1;
                        
                        // Neither shell nor lining - alphabetical
                        return a.localeCompare(b);
                    });
                    console.log('🔧 Sorted composition sets order:', sortedSets.map(([name]) => name));
                    
                    sortedSets.forEach(([setName, setCompositions]) => {
                        if (setName && setCompositions && typeof setCompositions === 'object') {
                            // 세트 이름 표시 (setName이 비어있지 않은 경우에만)
                            if (setName.trim() !== '') {
                                const setHeaderDiv = document.createElement('div');
                                setHeaderDiv.className = 'composition_set_header';
                                setHeaderDiv.textContent = setName;
                                compositionContainer.appendChild(setHeaderDiv);
                            }
                            
                            // 세트 내의 각 소재를 퍼센트 순으로 정렬 (큰 것부터)
                            const sortedEntries = Object.entries(setCompositions)
                                .filter(([material, percentage]) => material && percentage)
                                .sort(([, a], [, b]) => parseFloat(b) - parseFloat(a));
                            
                            sortedEntries.forEach(([material, percentage]) => {
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
                            });
                        }
                    });
                } else {
                    // 기존 단일 객체 형태 호환성 유지 (percentage 표시, 퍼센트 순 정렬)
                    console.log('🧪 Processing single-set composition:', compositions);
                    const sortedEntries = Object.entries(compositions)
                        .filter(([material, percentage]) => material && percentage)
                        .sort(([, a], [, b]) => parseFloat(b) - parseFloat(a));
                    
                    sortedEntries.forEach(([material, percentage]) => {
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
                    });
                }
            }
            
            } catch (error) {
            console.error('Error updating composition:', error);
        }
    }
    
    // Season과 Purchase year 정보 추가 (composition 아래)
    updateSeasonAndPurchaseDisplay(item);
    
    // Color 정보 표시 (season/purchase year 전에 삽입)
    updateColorDisplay(item);
}

// Color 표시 함수
function updateColorDisplay(item) {
    const compositionContainer = document.querySelector('.view_composition');
    if (!compositionContainer) return;
    
    // 동적 색상 CSS 생성 (add 페이지와 동일하게)
    generateColorCSS();
    
    // 기존 color 제거
    const existingColors = compositionContainer.querySelectorAll('.color_boxes_container');
    existingColors.forEach(color => color.remove());
    
    if (item.color && item.color.trim() !== '') {
        // Color boxes container 생성 (헤더 없이)
        const colorBoxesContainer = document.createElement('div');
        colorBoxesContainer.className = 'color_boxes_container';
        // marginTop styling handled by .color_boxes_container CSS class
        
        // Color 문자열을 쉼표로 분리
        const colors = item.color.split(',').map(c => c.trim()).filter(c => c !== '');
        
        colors.forEach(colorName => {
            const colorBox = document.createElement('div');
            colorBox.className = 'color_box';
            
            // add 페이지와 동일한 방식으로 색상 클래스 적용
            const colorData = colorList.find(c => c.label === colorName);
            if (colorData) {
                // 동적으로 생성된 CSS 클래스 사용 (예: color_black, color_red 등)
                colorBox.classList.add(`color_${colorName}`);
                
                // white 색상일 때만 border 추가
                if (colorName === 'white') {
                    colorBox.classList.add('color_white');
                }
            } else {
                // 색상을 찾을 수 없으면 기본 회색
                colorBox.style.backgroundColor = '#cccccc';
            }
            
            colorBoxesContainer.appendChild(colorBox);
        });
        
        // composition divider 이전에 color 삽입
        const divider = compositionContainer.querySelector('.composition_season_divider');
        if (divider) {
            divider.insertAdjacentElement('beforebegin', colorBoxesContainer);
        } else {
            // divider가 없으면 composition container 끝에 추가
            const lastComposition = compositionContainer.querySelector('.label_with_value:last-of-type');
            if (lastComposition) {
                lastComposition.insertAdjacentElement('afterend', colorBoxesContainer);
            } else {
                // composition이 없으면 size 다음에 삽입
                const sizeElement = compositionContainer.querySelector('.view_size');
                if (sizeElement) {
                    sizeElement.insertAdjacentElement('afterend', colorBoxesContainer);
                }
            }
        }
        
    }
}

// Season과 Purchase year 표시 함수
function updateSeasonAndPurchaseDisplay(item) {
    const compositionContainer = document.querySelector('.view_composition');
    if (!compositionContainer) return;
    
    // 기존 season과 purchase year 정보와 구분선 제거
    const existingDetails = compositionContainer.querySelectorAll('.detail_section');
    existingDetails.forEach(detail => detail.remove());
    const existingDividers = compositionContainer.querySelectorAll('.composition_season_divider');
    existingDividers.forEach(divider => divider.remove());
    
    // Composition이나 사이즈가 있는지 확인
    const hasComposition = item.compositions && (
        (Array.isArray(item.compositions) && item.compositions.length > 0 && item.compositions.some(comp => comp && comp.trim() !== '')) ||
        (typeof item.compositions === 'object' && Object.keys(item.compositions).length > 0) ||
        (typeof item.compositions === 'string' && item.compositions.trim() !== '' && item.compositions !== '[]' && item.compositions !== '{}')
    );
    
    const hasSize = (item.size_region && item.size && item.size.toString().trim() !== '' && item.size !== 'null') || 
                   (item.size_etc && item.size_etc.toString().trim() !== '');
    
    // Season, Purchase year, Tags 중 하나라도 있고, Composition이나 Size가 있을 때만 구분선 추가
    const hasSeasonInfo = (item.season && item.season.toString().trim() !== '') ||
                         (item.purchase_year && item.purchase_year.toString().trim() !== '') ||
                         (item.tags && item.tags.toString().trim() !== '');
    
    if ((hasComposition || hasSize) && hasSeasonInfo) {
        const dividerLine = document.createElement('div');
        dividerLine.className = 'composition_season_divider';
        compositionContainer.appendChild(dividerLine);
    }
    
    // Season 표시 (composition 아래 40px)
    if (item.season && item.season.toString().trim() !== '') {
        const seasonContainer = document.createElement('div');
        seasonContainer.className = 'detail_section';
        
        const seasonLabel = document.createElement('div');
        seasonLabel.className = 'detail_label';
        seasonLabel.textContent = 'season';
        
        const seasonValue = document.createElement('div');
        seasonValue.className = 'detail_value';
        seasonValue.textContent = item.season;
        
        seasonContainer.appendChild(seasonLabel);
        seasonContainer.appendChild(seasonValue);
        compositionContainer.appendChild(seasonContainer);
    }
    
    // Purchase year 표시 (season 아래 10px 또는 composition 아래 40px)
    if (item.purchase_year && item.purchase_year.toString().trim() !== '') {
        const purchaseContainer = document.createElement('div');
        const hasSeasonAbove = item.season && item.season.toString().trim() !== '';
        purchaseContainer.className = hasSeasonAbove ? 'detail_section close_spacing' : 'detail_section';
        
        const purchaseLabel = document.createElement('div');
        purchaseLabel.className = 'detail_label';
        purchaseLabel.textContent = 'purchase year';
        
        const purchaseYear = document.createElement('div');
        purchaseYear.className = 'detail_value';
        purchaseYear.textContent = item.purchase_year;
        
        purchaseContainer.appendChild(purchaseLabel);
        purchaseContainer.appendChild(purchaseYear);
        compositionContainer.appendChild(purchaseContainer);
    }
    
    // Tags 표시 (purchase year 아래 10px)
    if (item.tags && item.tags.toString().trim() !== '') {
        const tagsContainer = document.createElement('div');
        const hasPurchaseYearAbove = item.purchase_year && item.purchase_year.toString().trim() !== '';
        const hasSeasonAbove = item.season && item.season.toString().trim() !== '';
        
        // purchase year가 있으면 10px, 없고 season만 있으면 10px, 둘 다 없으면 40px
        if (hasPurchaseYearAbove || hasSeasonAbove) {
            tagsContainer.className = 'detail_section close_spacing';
        } else {
            tagsContainer.className = 'detail_section';
        }
        
        const tagsLabel = document.createElement('div');
        tagsLabel.className = 'detail_label';
        tagsLabel.textContent = 'tags';
        
        const tagsValue = document.createElement('div');
        tagsValue.className = 'detail_value';
        tagsValue.textContent = item.tags;
        
        tagsContainer.appendChild(tagsLabel);
        tagsContainer.appendChild(tagsValue);
        compositionContainer.appendChild(tagsContainer);
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
            // outer 카테고리의 경우 length (subcategory2)에 따라 분기
            const subcategory = item.subcategory || '';
            const subcategory2 = item.subcategory2 || '';
            
            if (category === 'outer' && subcategory2 === 'long') {
                // Outer에서 length가 long인 경우 sleeve type에 따라 분기
                if (subcategory === 'long sleeve') {
                    createOuterLongSleeveLongMeasurement(measurementContainer, measurements);
                } else if (subcategory === 'short sleeve') {
                    createOuterShortSleeveLongMeasurement(measurementContainer, measurements);
                } else {
                    // sleeve 정보가 없으면 기본 long sleeve로 처리
                    createOuterLongSleeveLongMeasurement(measurementContainer, measurements);
                }
            } else if (subcategory.toLowerCase().includes('long sleeve')) {
                // Top 또는 outer에서 long sleeve인 경우
                createTopLongSleeveMeasurement(measurementContainer, measurements);
            } else {
                // 기본값: top measurement 사용 (outer short length 포함)
                createTopMeasurement(measurementContainer, measurements);
            }
        } else if (category === 'dress') {
            createDressMeasurement(measurementContainer, measurements, item.subcategory, item.subcategory2);
        } else if (category === 'skirt') {
            createSkirtMeasurement(measurementContainer, measurements, item.subcategory);
        } else if (category === 'pants_short' || (category === 'pants' && item.subcategory === 'short')) {
            createPantsShortMeasurement(measurementContainer, measurements);
        } else if (category === 'pants_long' || (category === 'pants' && item.subcategory === 'long')) {
            createPantsLongMeasurement(measurementContainer, measurements);
        } else {
            // 기본값으로 top 사용
            createTopMeasurement(measurementContainer, measurements);
        }
        
    } catch (error) {
        console.error('Error updating measurements:', error);
    }
}

// Top/Outer 카테고리 measurement 생성
function createTopMeasurement(container, measurements) {
    // 베이스 이미지
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/measurement_top.svg';
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
            // CSS key 변환 (공백을 camelCase로)
            const cssKey = item.key.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
            
            // 수치 박스 생성
            const box = document.createElement('div');
            box.className = `box ${cssKey}`;
            box.textContent = measurements[item.key];
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', cssKey);
            container.appendChild(guidelineImg);
        }
    });
}

// Top Long Sleeve 카테고리 measurement 생성
function createTopLongSleeveMeasurement(container, measurements) {
    // 베이스 이미지 (long sleeve용)
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/top_long.svg';
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
            // CSS key 변환 (공백을 camelCase로)
            const cssKey = item.key.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
            
            // 수치 박스 생성
            const box = document.createElement('div');
            box.className = `box ${cssKey} long_sleeve`;
            box.textContent = measurements[item.key];
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', cssKey);
            container.appendChild(guidelineImg);
        }
    });
}

// Dress 카테고리 measurement 생성 - 서브카테고리별 분기
function createDressMeasurement(container, measurements, subcategory, subcategory2) {
    const subcategoryLower = (subcategory || '').toLowerCase();
    const subcategory2Lower = (subcategory2 || '').toLowerCase();
    
    if (subcategoryLower.includes('short sleeve') && subcategory2Lower.includes('mini')) {
        createDressShortSleeveMiniMeasurement(container, measurements);
    } else if (subcategoryLower.includes('short sleeve') && subcategory2Lower.includes('midi')) {
        createDressShortSleeveMidiMeasurement(container, measurements);
    } else if (subcategoryLower.includes('short sleeve') && subcategory2Lower.includes('long')) {
        createDressShortSleeveLongMeasurement(container, measurements);
    } else if (subcategoryLower.includes('long sleeve') && subcategory2Lower.includes('long')) {
        createDressLongSleeveLongMeasurement(container, measurements);
    } else if (subcategoryLower.includes('long sleeve') && subcategory2Lower.includes('midi')) {
        createDressLongSleeveMidiMeasurement(container, measurements);
    } else if (subcategoryLower.includes('long sleeve') && subcategory2Lower.includes('mini')) {
        createDressLongSleeveMiniMeasurement(container, measurements);
    } else {
        // 기본 dress 처리 (현재는 top과 동일)
        createTopMeasurement(container, measurements);
    }
}

// Short Sleeve Mini Dress 카테고리 measurement 생성
function createDressShortSleeveMiniMeasurement(container, measurements) {
    // 베이스 이미지
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/dress_short sleeve, mini.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // short sleeve mini dress measurement 데이터와 가이드라인 이미지 매핑
    const measurementMap = [
        { key: 'chest', label: '가슴', guideline: 'measurement_dress_short sleeve, mini_chest.svg' },
        { key: 'shoulder', label: '어깨', guideline: 'measurement_dress_short sleeve, mini_shoulder.svg' },
        { key: 'sleeve', label: '소매', guideline: 'measurement_dress_short sleeve, mini_sleeve.svg' },
        { key: 'sleeveOpening', label: '소매단', guideline: 'measurement_dress_short sleeve, mini_sleeveOpening.svg' },
        { key: 'armhole', label: '암홀', guideline: 'measurement_dress_short sleeve, mini_armhole.svg' },
        { key: 'waist', label: '허리', guideline: 'measurement_dress_short sleeve, mini_waist.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_dress_short sleeve, mini_length.svg' },
        { key: 'hemWidth', label: 'hem width', guideline: 'measurement_dress_short sleeve, mini_hemWidth.svg' }
    ];
    
    measurementMap.forEach(item => {
        // Check for both camelCase (sleeveOpening) and display text (sleeve opening) formats
        const measurementValue = measurements && (measurements[item.key] || measurements[item.key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()]);
        
        if (measurements && measurementValue) {
            // CSS key 변환 (공백을 camelCase로)
            const cssKey = item.key.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
            
            // 수치 박스 생성
            const box = document.createElement('div');
            box.className = `box ${cssKey} short_sleeve_mini_dress`;
            box.textContent = measurementValue;
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', cssKey);
            container.appendChild(guidelineImg);
        }
    });
}

// Short Sleeve Midi Dress 카테고리 measurement 생성
function createDressShortSleeveMidiMeasurement(container, measurements) {
    // 베이스 이미지
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/dress_short sleeve, midi.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // short sleeve midi dress measurement 데이터와 가이드라인 이미지 매핑
    const measurementMap = [
        { key: 'chest', label: '가슴', guideline: 'measurement_dress_short sleeve, midi_chest.svg' },
        { key: 'shoulder', label: '어깨', guideline: 'measurement_dress_short sleeve, midi_shoulder.svg' },
        { key: 'sleeve', label: '소매', guideline: 'measurement_dress_short sleeve, midi_sleeve.svg' },
        { key: 'sleeveOpening', label: '소매단', guideline: 'measurement_dress_short sleeve, midi_sleeveOpening.svg' },
        { key: 'armhole', label: '암홀', guideline: 'measurement_dress_short sleeve, midi_armhole.svg' },
        { key: 'waist', label: '허리', guideline: 'measurement_dress_short sleeve, midi_waist.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_dress_short sleeve, midi_length.svg' },
        { key: 'hemWidth', label: 'hem width', guideline: 'measurement_dress_short sleeve, midi_hemWidth.svg' }
    ];
    
    measurementMap.forEach(item => {
        // Check for both camelCase (hemWidth) and display text (hem width) formats
        const measurementValue = measurements && (measurements[item.key] || measurements[item.key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()]);
        
        if (measurements && measurementValue) {
            // CSS key 변환 (공백을 camelCase로)
            const cssKey = item.key.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
            
            // 수치 박스 생성
            const box = document.createElement('div');
            box.className = `box ${cssKey} short_sleeve_midi_dress`;
            box.textContent = measurementValue;
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', cssKey);
            container.appendChild(guidelineImg);
        }
    });
}

// Short Sleeve Long Dress 카테고리 measurement 생성
function createDressShortSleeveLongMeasurement(container, measurements) {
    // 베이스 이미지
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/dress_short sleeve, long.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // short sleeve long dress measurement 데이터와 가이드라인 이미지 매핑
    const measurementMap = [
        { key: 'chest', label: '가슴', guideline: 'measurement_dress_short sleeve, long_chest.svg' },
        { key: 'shoulder', label: '어깨', guideline: 'measurement_dress_short sleeve, long_shoulder.svg' },
        { key: 'sleeve', label: '소매', guideline: 'measurement_dress_short sleeve, long_sleeve.svg' },
        { key: 'sleeveOpening', label: '소매단', guideline: 'measurement_dress_short sleeve, long_sleeveOpening.svg' },
        { key: 'armhole', label: '암홀', guideline: 'measurement_dress_short sleeve, long_armhole.svg' },
        { key: 'waist', label: '허리', guideline: 'measurement_dress_short sleeve, long_waist.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_dress_short sleeve, long_length.svg' },
        { key: 'hemWidth', label: 'hem width', guideline: 'measurement_dress_short sleeve, long_hemWidth.svg' }
    ];
    
    measurementMap.forEach(item => {
        // Check for both camelCase (hemWidth) and display text (hem width) formats
        const measurementValue = measurements && (measurements[item.key] || measurements[item.key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()]);
        
        if (measurements && measurementValue) {
            // CSS key 변환 (공백을 camelCase로)
            const cssKey = item.key.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
            
            // 수치 박스 생성
            const box = document.createElement('div');
            box.className = `box ${cssKey} short_sleeve_long_dress`;
            box.textContent = measurementValue;
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', cssKey);
            container.appendChild(guidelineImg);
        }
    });
}

// Long Sleeve Long Dress 카테고리 measurement 생성
function createDressLongSleeveLongMeasurement(container, measurements) {
    // 베이스 이미지
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/dress_long sleeve, long.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // long sleeve long dress measurement 데이터와 가이드라인 이미지 매핑
    const measurementMap = [
        { key: 'chest', label: '가슴', guideline: 'measurement_dress_long sleeve, long_chest.svg' },
        { key: 'shoulder', label: '어깨', guideline: 'measurement_dress_long sleeve, long_shoulder.svg' },
        { key: 'sleeve', label: '소매', guideline: 'measurement_dress_long sleeve, long_sleeve.svg' },
        { key: 'sleeveOpening', label: '소매단', guideline: 'measurement_dress_long sleeve, long_sleeveOpening.svg' },
        { key: 'armhole', label: '암홀', guideline: 'measurement_dress_long sleeve, long_armhole.svg' },
        { key: 'waist', label: '허리', guideline: 'measurement_dress_long sleeve, long_waist.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_dress_long sleeve, long_length.svg' },
        { key: 'hemWidth', label: 'hem width', guideline: 'measurement_dress_long sleeve, long_hemwidth.svg' }
    ];
    
    measurementMap.forEach(item => {
        // Check for both camelCase (hemWidth) and display text (hem width) formats
        const measurementValue = measurements && (measurements[item.key] || measurements[item.key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()]);
        
        if (measurements && measurementValue) {
            // CSS key 변환 (공백을 camelCase로)
            const cssKey = item.key.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
            
            // 수치 박스 생성
            const box = document.createElement('div');
            box.className = `box ${cssKey} long_sleeve_long_dress`;
            box.textContent = measurementValue;
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', cssKey);
            container.appendChild(guidelineImg);
        }
    });
}

// Long Sleeve Midi Dress 카테고리 measurement 생성
function createDressLongSleeveMidiMeasurement(container, measurements) {
    // 베이스 이미지
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/dress_long sleeve, midi.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // long sleeve midi dress measurement 데이터와 가이드라인 이미지 매핑
    const measurementMap = [
        { key: 'chest', label: '가슴', guideline: 'measurement_dress_long sleeve, midi_chest.svg' },
        { key: 'shoulder', label: '어깨', guideline: 'measurement_dress_long sleeve, midi_shoulder.svg' },
        { key: 'sleeve', label: '소매', guideline: 'measurement_dress_long sleeve, midi_sleeve.svg' },
        { key: 'sleeveOpening', label: '소매단', guideline: 'measurement_dress_long sleeve, midi_sleeveOpening.svg' },
        { key: 'armhole', label: '암홀', guideline: 'measurement_dress_long sleeve, midi_armhole.svg' },
        { key: 'waist', label: '허리', guideline: 'measurement_dress_long sleeve, midi_waist.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_dress_long sleeve, midi_length.svg' },
        { key: 'hemWidth', label: 'hem width', guideline: 'measurement_dress_long sleeve, midi_hemwidth.svg' }
    ];
    
    measurementMap.forEach(item => {
        // Check for both camelCase (hemWidth) and display text (hem width) formats
        const measurementValue = measurements && (measurements[item.key] || measurements[item.key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()]);
        
        if (measurements && measurementValue) {
            // CSS key 변환 (공백을 camelCase로)
            const cssKey = item.key.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
            
            // 수치 박스 생성
            const box = document.createElement('div');
            box.className = `box ${cssKey} long_sleeve_midi_dress`;
            box.textContent = measurementValue;
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', cssKey);
            container.appendChild(guidelineImg);
        }
    });
}

// Long Sleeve Mini Dress 카테고리 measurement 생성
function createDressLongSleeveMiniMeasurement(container, measurements) {
    // 베이스 이미지 (long sleeve mini dress 전용 SVG가 없으므로 long sleeve midi를 사용)
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/dress_long sleeve, midi.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // long sleeve mini dress measurement 데이터와 가이드라인 이미지 매핑
    // SVG 파일이 없으므로 long sleeve midi의 가이드라인을 사용
    const measurementMap = [
        { key: 'chest', label: '가슴', guideline: 'measurement_dress_long sleeve, midi_chest.svg' },
        { key: 'shoulder', label: '어깨', guideline: 'measurement_dress_long sleeve, midi_shoulder.svg' },
        { key: 'sleeve', label: '소매', guideline: 'measurement_dress_long sleeve, midi_sleeve.svg' },
        { key: 'sleeveOpening', label: '소매단', guideline: 'measurement_dress_long sleeve, midi_sleeveOpening.svg' },
        { key: 'armhole', label: '암홀', guideline: 'measurement_dress_long sleeve, midi_armhole.svg' },
        { key: 'waist', label: '허리', guideline: 'measurement_dress_long sleeve, midi_waist.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_dress_long sleeve, midi_length.svg' },
        { key: 'hemWidth', label: 'hem width', guideline: 'measurement_dress_long sleeve, midi_hemwidth.svg' }
    ];
    
    measurementMap.forEach(item => {
        // Check for both camelCase (hemWidth) and display text (hem width) formats
        const measurementValue = measurements && (measurements[item.key] || measurements[item.key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()]);
        
        if (measurements && measurementValue) {
            // CSS key 변환 (공백을 camelCase로)
            const cssKey = item.key.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
            
            // 수치 박스 생성
            const box = document.createElement('div');
            box.className = `box ${cssKey} long_sleeve_midi_dress`;
            box.textContent = measurementValue;
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', cssKey);
            container.appendChild(guidelineImg);
        }
    });
}

// Skirt 카테고리 measurement 생성
function createSkirtMeasurement(container, measurements, subcategory) {
    const subcategoryLower = (subcategory || '').toLowerCase();
    console.log('🩳 Skirt measurement - subcategory:', subcategory, 'lowercase:', subcategoryLower);
    
    if (subcategoryLower.includes('mini')) {
        console.log('✅ Using mini skirt measurement');
        createSkirtMiniMeasurement(container, measurements);
    } else if (subcategoryLower.includes('midi')) {
        console.log('✅ Using midi skirt measurement');
        createSkirtMidiMeasurement(container, measurements);
    } else if (subcategoryLower.includes('long')) {
        console.log('✅ Using long skirt measurement');
        createSkirtLongMeasurement(container, measurements);
    } else {
        console.log('⚠️ No specific match, using mini as default');
        createSkirtMiniMeasurement(container, measurements);
    }
}

// Skirt Midi measurement 생성
function createSkirtMidiMeasurement(container, measurements) {
    // 베이스 이미지 (항상 표시)
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/skirt_midi.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // Midi skirt measurement 정의
    const measurementItems = [
        { key: 'waist', label: '허리', guideline: 'measurement_skirt_midi_waist.svg' },
        { key: 'hip', label: '엉덩이', guideline: 'measurement_skirt_midi_hip.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_skirt_midi_length.svg' },
        { key: 'hemWidth', label: 'hem width', guideline: 'measurement_skirt_midi_hemwidth.svg' }
    ];
    
    // 각 measurement에 대한 박스와 가이드라인 생성
    measurementItems.forEach(item => {
        const measurementValue = measurements && measurements[item.key] ? measurements[item.key] : '';
        
        if (measurementValue) {
            // Measurement 박스 생성
            const box = document.createElement('div');
            box.className = `box ${item.key} skirt_midi`;
            box.classList.add('measurement_box_centered');
            box.textContent = measurementValue;
            container.appendChild(box);
        }
        
        // 가이드라인 이미지 생성 (값이 있을 때만)
        if (measurementValue) {
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', item.key);
            container.appendChild(guidelineImg);
        }
    });
}

// Skirt Mini measurement 생성
function createSkirtMiniMeasurement(container, measurements) {
    // 베이스 이미지 (항상 표시)
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/skirt_mini.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // Mini skirt measurement 정의
    const measurementItems = [
        { key: 'waist', label: '허리', guideline: 'measurement_skirt_mini_waist.svg' },
        { key: 'hip', label: '엉덩이', guideline: 'measurement_skirt_mini_hip.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_skirt_mini_length.svg' },
        { key: 'hemWidth', label: 'hem width', guideline: 'measurement_skirt_mini_hemwidth.svg' }
    ];
    
    // 각 measurement에 대한 박스와 가이드라인 생성
    measurementItems.forEach(item => {
        const measurementValue = measurements && measurements[item.key] ? measurements[item.key] : '';
        
        if (measurementValue) {
            // Measurement 박스 생성
            const box = document.createElement('div');
            box.className = `box ${item.key} skirt_mini`;
            box.classList.add('measurement_box_centered');
            box.textContent = measurementValue;
            container.appendChild(box);
        }
        
        // 가이드라인 이미지 생성 (값이 있을 때만)
        if (measurementValue) {
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', item.key);
            container.appendChild(guidelineImg);
        }
    });
}

// Skirt Long measurement 생성
function createSkirtLongMeasurement(container, measurements) {
    // 베이스 이미지 (항상 표시)
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/skirt_long.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // Long skirt measurement 정의
    const measurementItems = [
        { key: 'waist', label: '허리', guideline: 'measurement_skirt_long_waist.svg' },
        { key: 'hip', label: '엉덩이', guideline: 'measurement_skirt_long_hip.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_skirt_long_length.svg' },
        { key: 'hemWidth', label: 'hem width', guideline: 'measurement_skirt_long_hemwidth.svg' }
    ];
    
    // 각 measurement에 대한 박스와 가이드라인 생성
    measurementItems.forEach(item => {
        const measurementValue = measurements && measurements[item.key] ? measurements[item.key] : '';
        
        if (measurementValue) {
            // Measurement 박스 생성
            const box = document.createElement('div');
            box.className = `box ${item.key} skirt_long`;
            box.classList.add('measurement_box_centered');
            box.textContent = measurementValue;
            container.appendChild(box);
        }
        
        // 가이드라인 이미지 생성 (값이 있을 때만)
        if (measurementValue) {
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', item.key);
            container.appendChild(guidelineImg);
        }
    });
}

// Pants Short 카테고리 measurement 생성
function createPantsShortMeasurement(container, measurements) {
    // 베이스 이미지
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/pants_short.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // measurement 데이터와 가이드라인 이미지 매핑 (실제 이미지 파일이 존재하는 것만)
    const measurementMap = [
        { key: 'waist', label: '허리', guideline: 'measurement_pants_short_waist.svg' },
        { key: 'hip', label: '엉덩이', guideline: 'measurement_pants_short_hip.svg' },
        { key: 'rise', label: '밑위', guideline: 'measurement_pants_short_rise.svg' },
        { key: 'inseam', label: '안쪽 솔기', guideline: 'measurement_pants_short_inseam.svg' },
        { key: 'thigh', label: '허벅지', guideline: 'measurement_pants_short_thigh.svg' },
        { key: 'legOpening', label: '밑단', guideline: 'measurement_pants_short_legOpening.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_pants_short_length.svg' }
    ];
    
    measurementMap.forEach(item => {
        const measurementValue = measurements && measurements[item.key];
        console.log(`👖 Checking pants_short measurement: ${item.key} = ${measurementValue} (type: ${typeof measurementValue})`);
        
        // measurement 값이 존재하고 비어있지 않을 때만 표시
        if (measurementValue && measurementValue !== '' && measurementValue !== null && measurementValue !== undefined) {
            console.log(`👖 Adding pants_short measurement: ${item.key} = ${measurementValue}`);
            
            // CSS key 변환 (공백을 camelCase로)
            const cssKey = item.key.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
            
            // Measurement 박스 생성
            const box = document.createElement('div');
            box.className = `box ${cssKey} pants_short`;
            box.textContent = measurementValue;
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', cssKey);
            container.appendChild(guidelineImg);
        } else {
            console.log(`👖 Skipping pants_short measurement: ${item.key} (no valid value)`);
        }
    });
}

// Pants Long 카테고리 measurement 생성
function createPantsLongMeasurement(container, measurements) {
    // 베이스 이미지
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/pants_long.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // measurement 데이터와 가이드라인 이미지 매핑 (실제 이미지 파일이 존재하는 것만)
    const measurementMap = [
        { key: 'waist', label: '허리', guideline: 'measurement_pants_long_waist.svg' },
        { key: 'hip', label: '엉덩이', guideline: 'measurement_pants_long_hip.svg' },
        { key: 'rise', label: '밑위', guideline: 'measurement_pants_long_rise.svg' },
        { key: 'inseam', label: '안쪽 솔기', guideline: 'measurement_pants_long_inseam.svg' },
        { key: 'thigh', label: '허벅지', guideline: 'measurement_pants_long_thigh.svg' },
        { key: 'legOpening', label: '밑단', guideline: 'measurement_pants_long_legOpening.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_pants_long_length.svg' }
    ];
    
    measurementMap.forEach(item => {
        const measurementValue = measurements && measurements[item.key];
        console.log(`👖 Checking pants_long measurement: ${item.key} = ${measurementValue} (type: ${typeof measurementValue})`);
        
        // measurement 값이 존재하고 비어있지 않을 때만 표시
        if (measurementValue && measurementValue !== '' && measurementValue !== null && measurementValue !== undefined) {
            console.log(`👖 Adding pants_long measurement: ${item.key} = ${measurementValue}`);
            
            // CSS key 변환 (공백을 camelCase로)
            const cssKey = item.key.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
            
            // Measurement 박스 생성
            const box = document.createElement('div');
            box.className = `box ${cssKey} pants_long`;
            box.textContent = measurementValue;
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', cssKey);
            container.appendChild(guidelineImg);
        } else {
            console.log(`👖 Skipping pants_long measurement: ${item.key} (no valid value)`);
        }
    });
}

// Outer long sleeve + long length measurement 생성
function createOuterLongSleeveLongMeasurement(container, measurements) {
    // 베이스 이미지
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/outer_long sleeve, long.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // outer long sleeve long measurement 데이터와 가이드라인 이미지 매핑
    const measurementMap = [
        { key: 'chest', label: '가슴', guideline: 'measurement_outer_long sleeve, long_chest.svg' },
        { key: 'shoulder', label: '어깨', guideline: 'measurement_outer_long sleeve, long_shoulder.svg' },
        { key: 'sleeve', label: '소매', guideline: 'measurement_outer_long sleeve, long_sleeve.svg' },
        { key: 'sleeve opening', label: '소매단', guideline: 'measurement_outer_long sleeve, long_sleeveOpening.svg' },
        { key: 'armhole', label: '암홀', guideline: 'measurement_outer_long sleeve, long_armhole.svg' },
        { key: 'waist', label: '허리', guideline: 'measurement_outer_long sleeve, long_waist.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_outer_long sleeve, long_length.svg' }
    ];
    
    measurementMap.forEach(item => {
        if (measurements && measurements[item.key]) {
            // 수치 박스 생성
            const box = document.createElement('div');
            // CSS 클래스명을 위해 key의 공백을 camelCase로 변환
            const cssKey = item.key.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
            box.className = `box ${cssKey} outer_long_sleeve_long`;
            box.textContent = measurements[item.key];
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', cssKey);
            container.appendChild(guidelineImg);
        }
    });
}

// Outer short sleeve + long length measurement 생성  
function createOuterShortSleeveLongMeasurement(container, measurements) {
    // 베이스 이미지
    const baseImg = document.createElement('img');
    baseImg.src = '/static/src/img/measurement/outer_short sleeve, long.svg';
    baseImg.className = 'measurement_base';
    container.appendChild(baseImg);
    
    // outer short sleeve long measurement 데이터와 가이드라인 이미지 매핑
    const measurementMap = [
        { key: 'chest', label: '가슴', guideline: 'measurement_outer_short sleeve, long_chest.svg' },
        { key: 'shoulder', label: '어깨', guideline: 'measurement_outer_short sleeve, long_shoulder.svg' },
        { key: 'sleeve', label: '소매', guideline: 'measurement_outer_short sleeve, long_sleeve.svg' },
        { key: 'sleeve opening', label: '소매단', guideline: 'measurement_outer_short sleeve, long_sleeveOpening.svg' },
        { key: 'armhole', label: '암홀', guideline: 'measurement_outer_short sleeve, long_armhole.svg' },
        { key: 'waist', label: '허리', guideline: 'measurement_outer_short sleeve, long_waist.svg' },
        { key: 'length', label: '총장', guideline: 'measurement_outer_short sleeve, long_length.svg' }
    ];
    
    measurementMap.forEach(item => {
        if (measurements && measurements[item.key]) {
            // 수치 박스 생성
            const box = document.createElement('div');
            // CSS 클래스명을 위해 key의 공백을 camelCase로 변환
            const cssKey = item.key.replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
            box.className = `box ${cssKey} outer_short_sleeve_long`;
            box.textContent = measurements[item.key];
            container.appendChild(box);
            
            // 가이드라인 이미지 생성
            const guidelineImg = document.createElement('img');
            guidelineImg.src = `/static/src/img/measurement/${item.guideline}`;
            guidelineImg.className = 'measurement_guideline';
            guidelineImg.setAttribute('data-measurement', cssKey);
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
        
        // 직접 URL 사용 (프록시 우회)
        console.log(`Using direct URL:`, url);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            console.log(`Image ${index + 1} loaded successfully directly, size: ${img.width}x${img.height}`);
            loadedImages[index] = img;
            loadedCount++;
            
            // 모든 이미지가 로드되면 합치기
            if (loadedCount === imageUrls.length) {
                console.log('All images loaded directly, combining now...');
                combineImages(loadedImages, canvas, ctx, container);
            }
        };
        img.onerror = function(error) {
            console.error('Failed to load image directly:', url, error);
            loadedCount++; // Count failed loads to prevent hanging
            
            // 직접 로드 실패한 경우 fallback 이미지 표시
            if (index === 0) {
                console.log('Using fallback original image display for first image');
                const fallbackImg = document.createElement('img');
                fallbackImg.src = url; // 원본 URL 사용
                fallbackImg.className = 'fallback_image';
                container.appendChild(fallbackImg);
            }
            
            // Check if we should proceed with partial images
            if (loadedCount === imageUrls.length) {
                console.log('All images processed (some failed), attempting to combine loaded images');
                const validImages = loadedImages.filter(img => img); // Remove undefined/null
                if (validImages.length > 0) {
                    combineImages(validImages, canvas, ctx, container);
                } else {
                    displayStitchedImagesAsCarousel(imageUrls, container);
                }
            }
        };
        
        img.src = url;
    });
}


// Stitched 이미지들을 carousel로 표시하는 함수 (제대로 된 버전)
function displayStitchedImagesAsCarousel(imageUrls, container) {
    
    // 외부 패딩 컨테이너 (40px padding)
    const paddingContainer = document.createElement('div');
    paddingContainer.className = 'carousel_padding_container';
    paddingContainer.classList.add('max_height_override');
    
    // 내부 carousel 컨테이너 (상하 스크롤 + 드래그 좌우 스크롤)
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'horizontal_carousel';
    
    // 드래그로 좌우 스크롤 기능 추가
    let isDragging = false;
    let hasDragged = false;
    let startX = 0;
    let scrollLeft = 0;
    
    carouselContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        hasDragged = false; // 드래그 시작 시 리셋
        carouselContainer.classList.add('carousel_grabbing');
        startX = e.pageX - carouselContainer.offsetLeft;
        scrollLeft = carouselContainer.scrollLeft;
        e.preventDefault();
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
        isDragging = false;
        carouselContainer.classList.remove('carousel_grabbing');
    });
    
    carouselContainer.addEventListener('mouseup', () => {
        isDragging = false;
        carouselContainer.classList.remove('carousel_grabbing');
    });
    
    carouselContainer.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - carouselContainer.offsetLeft;
        const walk = (x - startX) * 2; // 스크롤 속도 조절
        
        // 실제로 스크롤이 발생했는지 확인 (최소 5px 이상 움직임)
        if (Math.abs(walk) > 5) {
            hasDragged = true;
        }
        
        carouselContainer.scrollLeft = scrollLeft - walk;
    });
    
    let loadedCount = 0;
    const totalImages = imageUrls.length;
    
    // 중앙 정렬 확인 함수
    function checkCenterAlignment() {
        if (loadedCount === totalImages) {
            // 모든 이미지가 로드된 후에 계산
            let totalWidth = 0;
            const images = carouselContainer.querySelectorAll('img');
            
            images.forEach(img => {
                // 실제 렌더링된 너비 사용
                totalWidth += img.offsetWidth;
            });
            
            // gap 추가 (이미지 개수 - 1) * 20px
            const gapWidth = (totalImages - 1) * 20;
            const totalCarouselWidth = totalWidth + gapWidth;
            const containerWidth = carouselContainer.clientWidth;
            
            console.log(`📏 컨테이너 너비: ${containerWidth}px`);
            
            if (totalCarouselWidth < containerWidth) {
                console.log('🎯 캐러셀이 컨테이너보다 작음 - 중앙 정렬 적용');
                carouselContainer.classList.add('center_align');
            } else {
                console.log('📍 캐러셀이 컨테이너보다 큼 - 좌측 정렬 유지');
                carouselContainer.classList.remove('center_align');
            }
        }
    }
    
    // 이미지들 추가
    imageUrls.forEach((url, index) => {
        const img = document.createElement('img');
        // 직접 URL 사용
        img.src = url;
        img.className = 'carousel_image';
        
        // 클릭 시 확대 (드래그한 경우 제외)
        img.onclick = (e) => {
            // 드래그가 발생한 경우 클릭 이벤트 방지
            if (hasDragged) {
                e.preventDefault();
                return;
            }
            
            const modal = document.createElement('div');
            modal.className = 'fullscreen_modal';
            modal.onclick = () => document.body.removeChild(modal);
            
            const modalImg = document.createElement('img');
            modalImg.src = url;
            modalImg.className = 'modal_image';
            
            modal.appendChild(modalImg);
            document.body.appendChild(modal);
        };
        
        img.onload = function() {
            console.log(`📐 Image dimensions: ${this.naturalWidth}x${this.naturalHeight}`);
            console.log(`🎨 Image styles: height=${this.style.height}, width=${this.style.width}`);
            
            loadedCount++;
            checkCenterAlignment();
        };
        
        img.onerror = function() {
            console.log(`⚠️ This image may not exist in R2 bucket`);
            // 플레이스홀더로 대체하되 더 명확한 메시지
            img.src = '/static/src/img/measurement/measurement_top.svg';
            img.classList.add('image_placeholder');
            img.title = 'Image not found in storage';
            
            loadedCount++;
            checkCenterAlignment();
        };
        
        carouselContainer.appendChild(img);
    });
    
    // 구조: paddingContainer > carouselContainer > images
    paddingContainer.appendChild(carouselContainer);
    container.appendChild(paddingContainer);
    
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
        combinedImg.className = 'combined_image';
        
        console.log('Appending combined image to container');
        container.appendChild(combinedImg);
        console.log('Successfully stitched', images.length, 'sections back together');
    } catch (error) {
        console.error('CORS error or Canvas issue:', error);
        console.log('Falling back to gallery display for stitched images');
        
        // CORS 오류 시 horizontal carousel로 표시
        
        // 외부 패딩 컨테이너
        const paddingContainer = document.createElement('div');
        paddingContainer.className = 'carousel_padding_container';
        
        // 내부 carousel 컨테이너 
        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'carousel_container_flex';
        
        // Webkit 브라우저용 스크롤바 숨기기
        const style = document.createElement('style');
        style.textContent = `
            .horizontal_carousel::-webkit-scrollbar {
                display: none;
            }
        `;
        document.head.appendChild(style);
        carouselContainer.className = 'horizontal_carousel';
        
        // 이미지 영역에서만 좌우 스크롤 이벤트 추가
        carouselContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            carouselContainer.scrollLeft += e.deltaY;
        });
        
        images.forEach((img, index) => {
            const displayImg = document.createElement('img');
            displayImg.src = img.src;
            displayImg.className = 'carousel_item-image';
            
            carouselContainer.appendChild(displayImg);
        });
        
        // 구조: paddingContainer > carouselContainer > images
        paddingContainer.appendChild(carouselContainer);
        container.appendChild(paddingContainer);
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
    
    // 사이즈 필터 (여러 개 선택 가능)
    const selectedSizes = document.querySelectorAll('input[name="size_input"]:checked');
    const sizesArray = Array.from(selectedSizes).map(checkbox => checkbox.value);
    
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
    
    if (sizesArray.length > 0) {
        filters.sizes = sizesArray;
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

// 필터 결과 표시 함수 - Apply filters 버튼 아래에 표시
function displayFilterResults(items, count) {
    console.log(`📊 Displaying ${count} filtered items`);
    
    // Apply filters 버튼 찾기
    const submitButton = document.querySelector('.submit_button');
    if (!submitButton) return;
    
    // 기존 결과 제거
    const existingResults = document.querySelector('.filter_results');
    if (existingResults) {
        existingResults.remove();
    }
    
    // 새 결과 컨테이너 생성 - 적절한 마진과 패딩 추가
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'filter_results';
    resultsContainer.className = 'filter_results';
    resultsContainer.innerHTML = `
        <div class="subheader">
            <div class="text">
                <h1>filter results</h1>
            </div>
        </div>
        <div class="grid_container"></div>
    `;
    
    const resultsGrid = resultsContainer.querySelector('.grid_container');
    
    // 필터 결과 아이템들 표시 - 원본 grid_item 형식 사용
    items.forEach(item => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid_item';
        
        const link = document.createElement('a');
        link.href = `/item.html?id=${item.item_id}`;
        
        const img = document.createElement('img');
        
        // 이미지 URL 결정
        if (item.thumbnail_url) {
            img.src = item.thumbnail_url;
        } else if (item.images && item.images.length > 0) {
            img.src = item.images[0];
        } else {
            img.src = '/static/src/img/measurement/measurement_top.svg';
            img.classList.add('image_placeholder');
        }
        
        img.alt = item.brand || 'Item';
        img.loading = 'lazy';
        
        link.appendChild(img);
        gridItem.appendChild(link);
        resultsGrid.appendChild(gridItem);
    });
    
    // 결과 없음 메시지
    if (items.length === 0) {
        resultsGrid.innerHTML = '<div class="no_items_message">No items found</div>';
    }
    
    // Apply filters 버튼 다음에 결과 추가
    submitButton.insertAdjacentElement('afterend', resultsContainer);
    
    // 결과 영역으로 스크롤
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
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
        setupImageModeToggle(); // 이미지 모드 토글 설정 추가
        setupImagePasteAndDrop(); // 클립보드 붙여넣기 기능 초기화
        loadTagsForPage('add'); // 동적 태그 로드
        loadExistingBrandsForAutocomplete(); // 브랜드 자동완성 로드
    }
    
    // Edit page에서 태그 로드
    if (window.location.pathname.includes('edit.html')) {
        loadTagsForPage('edit'); // 동적 태그 로드
        setupImagePasteAndDrop();
        loadExistingBrandsForAutocomplete();
    }
});

// 동적으로 태그 로드하는 함수 (db.js의 tagsList 사용)
function loadTagsForPage(pageType) {
    try {
        // db.js에서 정의된 tagsList 사용
        if (typeof tagsList !== 'undefined' && tagsList.length > 0) {
            generateTagCheckboxes(tagsList, pageType);
            console.log(`✅ Loaded ${tagsList.length} tags from db.js`);
        } else {
            console.warn('tagsList not found in db.js, using fallback');
            // 백업용 기본 태그들
            const fallbackTags = [
                {value: 'occasion wear', label: 'Occasion wear'},
                {value: 'activewear', label: 'Activewear'},
                {value: 'basic', label: 'Basic'},
                {value: 'evening wear', label: 'Evening wear'}
            ];
            generateTagCheckboxes(fallbackTags, pageType);
        }
    } catch (error) {
        console.error('Error loading tags:', error);
        // 에러 시 기본 태그 사용
        const fallbackTags = [
            {value: 'occasion wear', label: 'Occasion wear'},
            {value: 'activewear', label: 'Activewear'},
            {value: 'basic', label: 'Basic'},
            {value: 'evening wear', label: 'Evening wear'}
        ];
        generateTagCheckboxes(fallbackTags, pageType);
    }
}

// 필터 상태 저장 및 복원 기능
function saveCurrentFilterState() {
    console.log('💾 Saving current filter state...');
    
    // 현재 필터 상태 수집
    const currentFilters = {
        categories: [],
        measurements: {},
        compositions: [],
        sizes: []
    };
    
    // 선택된 카테고리 저장
    const selectedCategory = document.querySelector('#new_filter_category_grid input[type="radio"]:checked');
    if (selectedCategory) {
        currentFilters.categories.push(selectedCategory.value);
    }
    
    // 측정값 필터 저장
    const measurementInputs = document.querySelectorAll('.filter_measurement_input');
    measurementInputs.forEach(input => {
        if (input.value && input.value.trim()) {
            const idParts = input.id.split('_');
            const measurementName = idParts[1];
            const isFrom = input.id.includes('_from');
            
            if (!currentFilters.measurements[measurementName]) {
                currentFilters.measurements[measurementName] = {};
            }
            
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue)) {
                if (isFrom) {
                    currentFilters.measurements[measurementName].from = numValue;
                } else {
                    currentFilters.measurements[measurementName].to = numValue;
                }
            }
        }
    });
    
    // 컴포지션 필터 저장
    const compositionInputs = document.querySelectorAll('.filter_panel input[name="filter_compositions"]:checked');
    compositionInputs.forEach(input => {
        currentFilters.compositions.push(input.value);
    });
    
    // 사이즈 필터 저장
    const sizeInputs = document.querySelectorAll('.filter_panel input[name="filter_sizes"]:checked');
    sizeInputs.forEach(input => {
        currentFilters.sizes.push(input.value);
    });
    
    // 현재 그리드 상태도 저장
    const gridItems = document.querySelectorAll('.grid_item');
    const currentItems = Array.from(gridItems).map(item => {
        return {
            id: item.dataset.itemId,
            visible: !item.classList.contains('hidden')
        };
    });
    
    // sessionStorage에 저장
    sessionStorage.setItem('savedFilterState', JSON.stringify({
        filters: currentFilters,
        items: currentItems,
        timestamp: Date.now()
    }));
    
    console.log('💾 Saved filter state:', currentFilters);
}

function restoreFilterState() {
    console.log('🔄 Attempting to restore filter state...');
    
    const savedState = sessionStorage.getItem('savedFilterState');
    if (!savedState) {
        console.log('❌ No saved filter state found');
        return false;
    }
    
    try {
        const state = JSON.parse(savedState);
        const filters = state.filters;
        
        console.log('🔄 Restoring filter state:', filters);
        
        // 카테고리 복원
        if (filters.categories.length > 0) {
            const categoryRadio = document.querySelector(`#new_filter_category_grid input[value="${filters.categories[0]}"]`);
            if (categoryRadio) {
                categoryRadio.checked = true;
                // 카테고리 선택 이벤트 트리거하여 측정값 업데이트
                onCategorySelected(filters.categories[0]);
            }
        }
        
        // 측정값 복원 (카테고리 로드 후 약간의 지연)
        setTimeout(() => {
            Object.keys(filters.measurements).forEach(measurement => {
                const range = filters.measurements[measurement];
                
                if (range.from !== undefined) {
                    const fromInput = document.getElementById(`measurement_${measurement}_from`);
                    if (fromInput) fromInput.value = range.from;
                }
                
                if (range.to !== undefined) {
                    const toInput = document.getElementById(`measurement_${measurement}_to`);
                    if (toInput) toInput.value = range.to;
                }
            });
        }, 500);
        
        // 컴포지션 복원
        filters.compositions.forEach(comp => {
            const compInput = document.querySelector(`.filter_panel input[name="filter_compositions"][value="${comp}"]`);
            if (compInput) compInput.checked = true;
        });
        
        // 사이즈 복원
        filters.sizes.forEach(size => {
            const sizeInput = document.querySelector(`.filter_panel input[name="filter_sizes"][value="${size}"]`);
            if (sizeInput) sizeInput.checked = true;
        });
        
        // 필터 적용하여 그리드 복원
        setTimeout(() => {
            applyFilters();
        }, 1000);
        
        console.log('✅ Filter state restored successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Error restoring filter state:', error);
        return false;
    }
}

function clearSavedFilterState() {
    sessionStorage.removeItem('savedFilterState');
    console.log('🗑️ Cleared saved filter state');
}

function restoreFilterValues() {
    console.log('🔄 Restoring filter values in panel...');
    
    const savedState = sessionStorage.getItem('savedFilterState');
    if (!savedState) {
        console.log('❌ No saved filter state for values restoration');
        return;
    }
    
    try {
        const state = JSON.parse(savedState);
        const filters = state.filters;
        
        console.log('🔄 Restoring filter values:', filters);
        
        // 카테고리 복원
        if (filters.categories.length > 0) {
            const categoryRadio = document.querySelector(`#new_filter_category_grid input[value="${filters.categories[0]}"]`);
            if (categoryRadio) {
                categoryRadio.checked = true;
                // 카테고리 선택 이벤트 트리거하여 측정값 옵션 업데이트
                onCategorySelected(filters.categories[0]);
            }
        }
        
        // 측정값 복원 (카테고리 로드 후 약간의 지연)
        setTimeout(() => {
            Object.keys(filters.measurements).forEach(measurement => {
                const range = filters.measurements[measurement];
                
                if (range.from !== undefined) {
                    const fromInput = document.getElementById(`measurement_${measurement}_from`);
                    if (fromInput) {
                        fromInput.value = range.from;
                        console.log(`✅ Restored ${measurement} from: ${range.from}`);
                    }
                }
                
                if (range.to !== undefined) {
                    const toInput = document.getElementById(`measurement_${measurement}_to`);
                    if (toInput) {
                        toInput.value = range.to;
                        console.log(`✅ Restored ${measurement} to: ${range.to}`);
                    }
                }
            });
        }, 500);
        
        // 컴포지션 복원
        filters.compositions.forEach(comp => {
            const compInput = document.querySelector(`.filter_panel input[name="filter_compositions"][value="${comp}"]`);
            if (compInput) {
                compInput.checked = true;
                console.log(`✅ Restored composition: ${comp}`);
            }
        });
        
        // 사이즈 복원
        filters.sizes.forEach(size => {
            const sizeInput = document.querySelector(`.filter_panel input[name="filter_sizes"][value="${size}"]`);
            if (sizeInput) {
                sizeInput.checked = true;
                console.log(`✅ Restored size: ${size}`);
            }
        });
        
        console.log('✅ Filter values restored in panel');
        
    } catch (error) {
        console.error('❌ Error restoring filter values:', error);
    }
}

// 태그 체크박스들을 동적으로 생성
function generateTagCheckboxes(tags, pageType) {
    const container = document.querySelector('.grid_container_tags');
    if (!container) {
        console.warn('Tags container not found');
        return;
    }
    
    // 기존 태그들 제거
    container.innerHTML = '';
    
    tags.forEach((tag, index) => {
        const tagItem = document.createElement('div');
        tagItem.className = 'tag_item';
        
        const suffix = pageType === 'edit' ? '_edit' : '';
        const tagId = `tag_${tag.value.replace(/\s+/g, '_')}${suffix}`;
        
        tagItem.innerHTML = `
            <input type="checkbox" id="${tagId}" name="tags" value="${tag.value}">
            <label for="${tagId}">${tag.label}</label>
        `;
        
        container.appendChild(tagItem);
    });
    
    console.log(`✅ Generated ${tags.length} tag checkboxes for ${pageType} page`);
}

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
        if (!individualMode || individualMode.classList.contains('hidden')) {
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
    if (container.classList.contains('hidden')) {
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
            preview.classList.add('preview_relative');
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.classList.add('preview_image_cover');
            
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
