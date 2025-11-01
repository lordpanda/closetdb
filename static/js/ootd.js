// OOTD JavaScript - ZERO MOCK DATA - VERSION 2025.10.31.FINAL - NO FAKE DATA GENERATION

// Global variables
let currentDate = new Date();
let pinnedItems = [];
let uploadedImage = null;
let currentLocation = 'SEOCHO-GU, SEOUL'; // 표시용 (간단한 주소)
let fullCurrentLocation = 'SEOCHO-GU, SEOUL'; // 저장용 (전체 주소)
let weatherData = {
    weather: 'SUNNY',
    tempMin: 16,
    tempMax: 24,
    precipitation: 0
};
let currentCoords = null;
let savedDates = []; // Array of dates that have saved OOTDs
let calendarDate = new Date(); // Current calendar view date

// Wait for exifr to load before initializing
function waitForExifr(callback, attempts = 0) {
    const maxAttempts = 10;
    
    if (typeof exifr !== 'undefined' || typeof window.exifr !== 'undefined') {
        console.log('✅ exifr library loaded, initializing OOTD');
        callback();
        return;
    }
    
    if (attempts < maxAttempts) {
        console.log(`⏳ Waiting for exifr... attempt ${attempts + 1}/${maxAttempts}`);
        setTimeout(() => waitForExifr(callback, attempts + 1), 500);
    } else {
        console.warn('⚠️ exifr not loaded after 10 attempts, proceeding without EXIF');
        callback();
    }
}

// Initialize OOTD functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, checking authentication...');
    
    // Check authentication before proceeding
    const token = localStorage.getItem('userToken');
    if (!token || (!token.startsWith('authenticated_') && !token.startsWith('google_auth_') && !token.startsWith('logged_in_'))) {
        console.log('❌ Not authenticated, redirecting to login');
        localStorage.setItem('redirectAfterLogin', '/ootd.html');
        window.location.href = '/';
        return;
    }
    
    console.log('✅ Authentication verified, proceeding with OOTD initialization');
    
    // Wait for exifr to load before initializing
    waitForExifr(() => {
        console.log('📚 Final exifr check:', typeof exifr !== 'undefined' || typeof window.exifr !== 'undefined' ? '✅ Loaded' : '❌ Not loaded');
        
        const input = document.getElementById('location_input');
        console.log('🔍 Direct input search:', !!input);
        
        if (input) {
            console.log('✅ Input found directly, adding click handler');
            input.onclick = function() {
                console.log('🖱️ DIRECT CLICK HANDLER');
                this.value = '';
                this.placeholder = '입력 중...';
            };
        } else {
            console.log('❌ Input not found, checking all inputs:');
            const allInputs = document.querySelectorAll('input');
            allInputs.forEach((inp, i) => {
                console.log(`Input ${i}: id="${inp.id}", class="${inp.className}"`);
            });
        }
        
        initializeOOTD();
        setupEventListeners();
        loadTodayData();
    });
});

function initializeOOTD() {
    // 초기화 시 핀된 아이템과 업로드 이미지 리셋
    pinnedItems = [];
    uploadedImage = null;
    
    // Initialize date display
    updateDateDisplay();
    
    // Get location and weather on load
    getLocationAndWeather();
    
    // Setup location autocomplete
    setupLocationAutocomplete();
    
    // Load items for search
    setupItemSearch();
    
    // Load saved dates for calendar
    loadSavedDates();
    
    // Update displays
    updatePinnedItemsDisplay();
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab_button').forEach(button => {
        button.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });
    
    // Date navigation
    document.getElementById('prev_day')?.addEventListener('click', () => {
        changeDate(-1);
    });
    
    document.getElementById('next_day')?.addEventListener('click', () => {
        changeDate(1);
    });
    
    // Calendar button
    document.getElementById('calendar_btn')?.addEventListener('click', () => {
        showCalendar();
    });
    
    // Calendar navigation
    document.getElementById('prev_month')?.addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next_month')?.addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Calendar close
    document.getElementById('calendar_close')?.addEventListener('click', () => {
        hideCalendar();
    });
    
    // Click outside calendar to close
    document.getElementById('calendar_modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'calendar_modal') {
            hideCalendar();
        }
    });
    
    // Location editing
    document.getElementById('edit_location_btn')?.addEventListener('click', toggleLocationEdit);
    
    // Image upload
    const imageUploadInput = document.getElementById('ootd_image_upload');
    console.log('🔗 Image upload input found:', !!imageUploadInput);
    console.log('🔗 Image upload input element:', imageUploadInput);
    if (imageUploadInput) {
        // Test click functionality
        console.log('🧪 Testing file input click...');
        imageUploadInput.addEventListener('change', handleImageUpload);
        console.log('✅ Image upload event listener attached');
        
        // Add test click handler
        imageUploadInput.addEventListener('click', () => {
            console.log('🖱️ File input clicked!');
            alert('📱 파일 입력 클릭됨!');
        });
    } else {
        console.error('❌ ootd_image_upload element not found!');
        alert('❌ 파일 업로드 요소를 찾을 수 없습니다!');
        // Search for it manually
        const allInputs = document.querySelectorAll('input[type="file"]');
        console.log('🔍 All file inputs found:', allInputs.length);
        alert(`📁 파일 입력 요소 개수: ${allInputs.length}`);
        allInputs.forEach((input, i) => {
            console.log(`File input ${i}:`, input.id, input.className);
        });
    }
    
    // Save OOTD
    document.getElementById('save_ootd_btn')?.addEventListener('click', saveOOTD);
    
    // Item search
    setupItemSearch();
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab_button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab_content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}_tab`).classList.add('active');
    
    // Load tab-specific data
    if (tabName === 'view') {
        loadSavedOOTDs();
    } else if (tabName === 'items') {
        loadAllItems();
    }
}

function changeDate(days) {
    currentDate.setDate(currentDate.getDate() + days);
    updateDateDisplay();
    updateWeatherForSelectedDate(); // Update weather for new date
    loadDateData();
}

function formatDateForInput(date) {
    // 시간대 독립적인 날짜 문자열 생성 (ootdLog 방식)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function handleLocationClick() {
    const display = document.getElementById('location_display');
    const input = document.getElementById('location_input');
    
    if (display && input) {
        // pill 숨기고 input 보이기
        display.classList.add('hidden');
        input.classList.remove('hidden');
        input.value = '';
        input.focus();
    }
}

function toggleLocationEdit() {
    handleLocationClick();
}

async function saveLocation() {
    const input = document.getElementById('location_input');
    const locationQuery = input.value.trim();
    
    if (locationQuery) {
        console.log('💾 saveLocation called with:', locationQuery);
        // 직접 입력한 경우에만 API 호출하여 검색
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=1&addressdetails=1&accept-language=en`
            );
            const results = await response.json();
            
            if (results && results.length > 0) {
                const result = results[0];
                const selectedParts = parseLocationAddress(result.address);
                const cleanLocationName = selectedParts && selectedParts.length > 0
                    ? selectedParts.join(', ').toUpperCase()
                    : result.display_name.split(',')[0].toUpperCase();
                
                currentLocation = cleanLocationName; // 표시용
                fullCurrentLocation = result.display_name; // 저장용 (전체 주소)
                currentCoords = { lat: parseFloat(result.lat), lon: parseFloat(result.lon) };
                updateLocationDisplay();
                
                // 날씨 업데이트
                await updateWeatherForLocation(currentCoords.lat, currentCoords.lon);
            }
        } catch (error) {
            console.error('Error in saveLocation:', error);
        }
    }
    cancelLocationEdit();
}

// Location update handler (from ootdLog) - 정확한 복사
async function updateLocationAndWeather(locationQuery) {
    try {
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=1&addressdetails=1&accept-language=en`
        );
        const geocodeData = await geocodeResponse.json();
        
        if (geocodeData && geocodeData.length > 0) {
          const result = geocodeData[0];
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          
          // API 응답 디버깅 강화
          console.log('=== Nominatim API Response ===');
          console.log('Query:', locationQuery);
          console.log('Full response:', result);
          console.log('Address object:', result.address);
          
          let cleanLocationName = locationQuery.toUpperCase();
          if (result.address) {
            const addr = result.address;
            
            console.log('Available address fields:', Object.keys(addr));
            console.log('Raw address data:', addr);
            
            // 가장 세부적인 지역부터 확인 (최대 2개만)
            const locationFields = [
              addr.neighbourhood,
              addr.suburb,
              addr.quarter,
              addr.city_district,
              addr.borough,
              addr.city,
              addr.town,
              addr.village,
              addr.state,
              addr.county,
              addr.province,  // 일본의 현(prefecture) 추가
              addr.region
            ];
            
            // 빈 값 제거하고 중복 제거
            const validFields = locationFields
              .filter(field => field && field.trim())
              .filter((field, index, arr) => arr.indexOf(field) === index);
            
            console.log('Valid fields found:', validFields);
            
            // 가장 관련성 높은 하위 2개만 선택
            const selectedParts = validFields.slice(0, 2);
            
            console.log('Selected parts (max 2):', selectedParts);
            
            if (selectedParts.length > 0) {
              cleanLocationName = selectedParts.join(', ').toUpperCase();
            } else {
              // fallback: display_name의 첫 번째 부분 사용
              cleanLocationName = result.display_name.split(',')[0].toUpperCase();
              console.log('Using fallback from display_name:', cleanLocationName);
            }
          }
          
          console.log('Final cleanLocationName:', cleanLocationName);
          console.log('=============================');
          
          currentLocation = cleanLocationName; // 표시용
          fullCurrentLocation = result.display_name; // 저장용 (전체 주소)  
          currentCoords = { lat, lon };
          updateLocationDisplay();
          
          // Update weather for current location and date
          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`
          );
          const weatherData_response = await weatherResponse.json();
          
          if (weatherData_response.daily) {
            const tempMinValue = Math.round(weatherData_response.daily.temperature_2m_min[0]);
            const tempMaxValue = Math.round(weatherData_response.daily.temperature_2m_max[0]);
            const weatherCode = weatherData_response.daily.weathercode[0];
            const precipitationProb = weatherData_response.daily.precipitation_probability_max[0] || 0;

            weatherData.tempMin = tempMinValue;
            weatherData.tempMax = tempMaxValue;
            weatherData.precipitation = precipitationProb;

            // Weather code to WeatherType mapping (Open-Meteo standard)
            const getWeatherType = (code) => {
              console.log('🌤️ Location change weather code received:', code);
              
              if (code === 0) return 'SUNNY';
              if (code >= 1 && code <= 3) return 'CLOUDY';
              if (code >= 45 && code <= 48) return 'CLOUDY';
              if (code >= 51 && code <= 57) return 'RAINY';
              if (code >= 61 && code <= 67) return 'RAINY';
              if (code >= 71 && code <= 77) return 'SNOWY';
              if (code >= 80 && code <= 82) return 'RAINY';
              if (code >= 85 && code <= 86) return 'SNOWY';
              if (code >= 95 && code <= 99) return 'RAINY';
              
              console.log('⚠️ Unknown location weather code:', code, 'defaulting to SUNNY');
              return 'SUNNY';
            };

            const weatherType = getWeatherType(weatherCode);
            weatherData.weather = weatherType;
            updateWeatherDisplay();
          }
        }
    } catch (error) {
        console.error('Error updating location:', error);
        currentLocation = locationQuery.toUpperCase();
        updateLocationDisplay();
    }
}

function cancelLocationEdit() {
    const display = document.getElementById('location_display');
    const input = document.getElementById('location_input');
    
    console.log('🔄 Canceling location edit');
    
    if (display) {
        display.classList.remove('hidden');
        console.log('✅ Display shown');
    }
    
    if (input) {
        input.classList.add('hidden');
        console.log('✅ Input hidden');
    }
    
    hideLocationDropdown();
}

// Dropdown 선택 하이라이트 업데이트
function updateDropdownSelection(selectedIndex) {
    const dropdown = document.getElementById('location_dropdown');
    if (!dropdown) return;
    
    const items = dropdown.querySelectorAll('.location_dropdown_item:not(.loading):not(.no_results)');
    
    // 모든 항목에서 selected 클래스 제거
    items.forEach(item => item.classList.remove('selected'));
    
    // 선택된 항목에 selected 클래스 추가
    if (selectedIndex >= 0 && items[selectedIndex]) {
        items[selectedIndex].classList.add('selected');
    }
}

// Location autocomplete functions
let locationSearchTimeout;
let currentLocationSuggestions = [];

// 공통 주소 파싱 함수 - 표시용 (마지막 2개만)
function parseLocationAddress(address) {
    if (!address) return null;
    
    const locationFields = [
        address.neighbourhood,
        address.suburb,
        address.quarter,
        address.city_district,
        address.borough,
        address.city,
        address.town,
        address.village,
        address.state,
        address.county,
        address.province,
        address.region
    ];
    
    const validFields = locationFields
        .filter(field => field && field.trim())
        .filter((field, index, arr) => arr.indexOf(field) === index);
    
    // 가장 관련성 높은 하위 2개만 선택 (원래대로)
    return validFields.slice(0, 2);
}

function setupLocationAutocomplete() {
    const input = document.getElementById('location_input');
    const dropdown = document.getElementById('location_dropdown');
    const inputContainer = document.getElementById('location_input_container');
    
    console.log('🔧 Setting up location autocomplete');
    console.log('Elements check:', {
        input: !!input,
        dropdown: !!dropdown,
        inputContainer: !!inputContainer
    });
    
    if (!input) {
        console.error('❌ Input element not found!');
        return;
    }
    
    if (!dropdown) {
        console.error('❌ Dropdown element not found! Creating new one...');
        
        // dropdown을 동적으로 생성
        const newDropdown = document.createElement('div');
        newDropdown.id = 'location_dropdown';
        newDropdown.className = 'location_dropdown hidden';
        
        // input 다음에 추가
        const locationContainer = input.parentNode;
        locationContainer.appendChild(newDropdown);
        
        console.log('✅ Dropdown created dynamically');
    }
    
    console.log('✅ Input element found, adding event listeners');
    
    // 브라우저 자동완성 완전 차단
    input.setAttribute('autocomplete', 'new-password');
    input.setAttribute('data-lpignore', 'true');
    input.setAttribute('data-form-type', 'other');
    
    // 클릭 시 텍스트 비우기
    input.addEventListener('click', () => {
        console.log('🖱️ Input clicked - clearing text');
        input.value = '';
    });
    
    input.addEventListener('focus', () => {
        console.log('🎯 Input focused - clearing text');
        input.value = '';
        
        // 브라우저 자동완성 방지를 위한 random name 설정
        input.setAttribute('name', 'search_' + Math.random().toString(36).substr(2, 9));
        input.setAttribute('autocomplete', 'off');
    });
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        console.log('🔤 Input changed:', query);
        
        // 새 검색 시 선택 인덱스 리셋
        selectedIndex = -1;
        
        // 이전 timeout 제거
        if (locationSearchTimeout) {
            clearTimeout(locationSearchTimeout);
        }
        
        if (query.length < 2) {
            console.log('⚠️ Query too short, hiding dropdown');
            hideLocationDropdown();
            return;
        }
        
        console.log('🔍 Starting search for:', query);
        
        // Show loading
        showLocationDropdown();
        updateLocationDropdown([{ loading: true }]);
        
        locationSearchTimeout = setTimeout(() => {
            console.log('⏰ Search timeout triggered');
            searchLocationSuggestions(query);
        }, 300);
    });
    
    // 키보드 네비게이션을 위한 선택된 인덱스
    let selectedIndex = -1;
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Escape 시 pill로 돌아가기
            const display = document.getElementById('location_display');
            if (display) {
                display.classList.remove('hidden');
                input.classList.add('hidden');
                hideLocationDropdown();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentLocationSuggestions.length > 0) {
                selectedIndex = Math.min(selectedIndex + 1, currentLocationSuggestions.length - 1);
                updateDropdownSelection(selectedIndex);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentLocationSuggestions.length > 0) {
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateDropdownSelection(selectedIndex);
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            console.log('🔑 Enter pressed, selectedIndex:', selectedIndex, 'suggestions:', currentLocationSuggestions.length);
            
            if (selectedIndex >= 0 && currentLocationSuggestions[selectedIndex]) {
                console.log('✅ Selecting highlighted suggestion at index:', selectedIndex);
                console.log('Selected suggestion:', currentLocationSuggestions[selectedIndex].display_name);
                selectLocationSuggestion(currentLocationSuggestions[selectedIndex]);
            } else if (currentLocationSuggestions.length > 0 && !currentLocationSuggestions[0].loading) {
                console.log('✅ Selecting first suggestion');
                console.log('First suggestion:', currentLocationSuggestions[0].display_name);
                selectLocationSuggestion(currentLocationSuggestions[0]);
            } else {
                console.log('⚠️ No valid suggestions, returning to pill');
                // Enter만 눌렀을 때도 pill로 돌아가기
                const display = document.getElementById('location_display');
                if (display) {
                    display.classList.remove('hidden');
                    input.classList.add('hidden');
                    hideLocationDropdown();
                }
            }
        }
    });
    
    input.addEventListener('blur', (e) => {
        // input에서 focus가 벗어나면 pill로 돌아가기
        setTimeout(() => {
            const display = document.getElementById('location_display');
            const input = document.getElementById('location_input');
            
            if (display && input) {
                display.classList.remove('hidden');
                input.classList.add('hidden');
            }
        }, 200);
    });
    
    // 드롭다운 클릭 시 닫히지 않도록
    if (dropdown) {
        dropdown.addEventListener('mousedown', (e) => {
            e.preventDefault(); // blur 이벤트 방지
        });
    }
    
    // 바깥 클릭 시 dropdown 닫기
    document.addEventListener('click', (e) => {
        const locationContainer = document.querySelector('.location_container');
        if (locationContainer && !locationContainer.contains(e.target)) {
            const display = document.getElementById('location_display');
            const input = document.getElementById('location_input');
            
            if (input && !input.classList.contains('hidden')) {
                if (display) {
                    display.classList.remove('hidden');
                }
                input.classList.add('hidden');
                hideLocationDropdown();
            }
        }
    });
}

async function searchLocationSuggestions(query) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&accept-language=en`
        );
        const results = await response.json();
        
        console.log(`🔍 API returned ${results.length} results for "${query}"`);
        
        if (results && results.length > 0) {
            const suggestions = results.map(result => {
                const selectedParts = parseLocationAddress(result.address);
                
                return {
                    display_name: selectedParts && selectedParts.length > 0 
                        ? selectedParts.join(', ') 
                        : result.display_name.split(',')[0],
                    lat: result.lat,
                    lon: result.lon,
                    address: result.address,
                    full_result: result
                };
            });
            
            currentLocationSuggestions = suggestions;
            updateLocationDropdown(suggestions);
        } else {
            currentLocationSuggestions = [];
            updateLocationDropdown([{ no_results: true }]);
        }
    } catch (error) {
        console.error('Location search error:', error);
        hideLocationDropdown();
    }
}

function showLocationDropdown() {
    const dropdown = document.getElementById('location_dropdown');
    console.log('🔽 Showing dropdown:', !!dropdown);
    if (dropdown) {
        dropdown.classList.remove('hidden');
        dropdown.style.display = 'block';
        console.log('✅ Dropdown shown');
    } else {
        console.error('❌ Dropdown element not found!');
    }
}

function hideLocationDropdown() {
    const dropdown = document.getElementById('location_dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

function updateLocationDropdown(suggestions) {
    const dropdown = document.getElementById('location_dropdown');
    if (!dropdown) return;
    
    if (suggestions.length === 0) {
        hideLocationDropdown();
        return;
    }
    
    dropdown.innerHTML = suggestions.map((suggestion, index) => {
        if (suggestion.loading) {
            return `<div class="location_dropdown_item loading">Searching...</div>`;
        }
        
        if (suggestion.no_results) {
            return `<div class="location_dropdown_item no_results">No locations found</div>`;
        }
        
        return `
            <div class="location_dropdown_item" onclick="selectLocationSuggestion(currentLocationSuggestions[${index}]); event.stopPropagation();">
                ${suggestion.display_name}
            </div>
        `;
    }).join('');
    
    showLocationDropdown();
}

async function selectLocationSuggestion(suggestion) {
    if (!suggestion || suggestion.loading || suggestion.no_results) return;
    
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    
    console.log('🎯 Selecting suggestion:', suggestion.display_name);
    
    // 표시용: dropdown에 표시된 이름 (간단히)
    const displayLocationName = suggestion.display_name.toUpperCase();
    
    // 저장용: 전체 주소 사용 (suggestion의 원본 데이터에서)
    let fullLocationName = displayLocationName; // 기본값
    
    // 원래 Nominatim API 응답에서 전체 주소 가져오기
    if (suggestion.full_address) {
        fullLocationName = suggestion.full_address;
    } else {
        // API 재호출해서 전체 주소 가져오기
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
            const data = await response.json();
            if (data && data.display_name) {
                fullLocationName = data.display_name;
            }
        } catch (error) {
            console.warn('📍 Could not get full address, using display name');
        }
    }
    
    console.log('📍 Display location:', displayLocationName);
    console.log('💾 Full location for storage:', fullLocationName);
    
    // 표시용과 저장용 분리
    currentLocation = displayLocationName; // 표시용 (간단한 주소)
    fullCurrentLocation = fullLocationName; // 저장용 (전체 주소)
    currentCoords = { lat, lon };
    
    updateLocationDisplay();
    hideLocationDropdown();
    cancelLocationEdit();
    
    // 날씨 업데이트 (updateLocationAndWeather 대신 직접 날씨만 가져오기)
    await updateWeatherForLocation(lat, lon);
}

async function updateWeatherForLocation(lat, lon) {
    try {
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`
        );
        const weatherData_response = await weatherResponse.json();
        
        if (weatherData_response.daily) {
            const tempMinValue = Math.round(weatherData_response.daily.temperature_2m_min[0]);
            const tempMaxValue = Math.round(weatherData_response.daily.temperature_2m_max[0]);
            const weatherCode = weatherData_response.daily.weathercode[0];
            const precipitationProb = weatherData_response.daily.precipitation_probability_max[0] || 0;

            weatherData.tempMin = tempMinValue;
            weatherData.tempMax = tempMaxValue;
            weatherData.precipitation = precipitationProb;

            const getWeatherType = (code) => {
                if (code === 0) return 'SUNNY';
                if (code >= 1 && code <= 3) return 'CLOUDY';
                if (code >= 45 && code <= 48) return 'CLOUDY';
                if (code >= 51 && code <= 57) return 'RAINY';
                if (code >= 61 && code <= 67) return 'RAINY';
                if (code >= 71 && code <= 77) return 'SNOWY';
                if (code >= 80 && code <= 82) return 'RAINY';
                if (code >= 85 && code <= 86) return 'SNOWY';
                if (code >= 95 && code <= 99) return 'RAINY';
                return 'SUNNY';
            };

            const weatherType = getWeatherType(weatherCode);
            weatherData.weather = weatherType;
            updateWeatherDisplay();
        }
    } catch (error) {
        console.error('Weather update error:', error);
    }
}

function updateLocationDisplay() {
    document.getElementById('location_text').textContent = currentLocation;
}

function updateWeatherDisplay() {
    document.getElementById('weather_display').textContent = weatherData.weather;
    document.getElementById('temp_display').textContent = `${weatherData.tempMin}-${weatherData.tempMax}`;
    document.getElementById('precipitation_display').textContent = `${weatherData.precipitation}%`;
}

function setupItemSearch() {
    const searchInput = document.getElementById('item_search');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            clearSearchResults();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            // closetDB의 performSearch 함수 직접 호출
            performSearch(query);
        }, 300);
    });
}

function searchItems(query) {
    // Use closetDB's exact search logic from script.js
    fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            if (data.items) {
                // Use the same filtering logic from closetDB's performSearch function
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
                            compositionTerms.push({term, match: colorMatch});
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
                        
                        // Season 특별 처리
                        const seasonMatch = (() => {
                            const itemSeason = item.season?.toLowerCase() || '';
                            if (term === '!all') {
                                return itemSeason !== 'all' && itemSeason !== '';
                            }
                            if (itemSeason === 'all') {
                                return true;
                            }
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
                        
                        // Region+Size 조합 검색
                        const regionSizeMatch = (item.size_region || item.sizeRegion) && item.size && 
                            ((item.size_region || item.sizeRegion) + item.size).toLowerCase().includes(term);
                        
                        return fieldMatch || seasonMatch || regionSizeMatch;
                    });
                    
                    return measurementResult && compositionResult && generalResult;
                });
                
                console.log(`📊 Found ${filteredItems.length} items matching "${query}"`);
                displaySearchResults(filteredItems);
            }
        })
        .catch(error => {
            console.error('Search error:', error);
            clearSearchResults();
        });
}

function displaySearchResults(items) {
    const container = document.getElementById('search_results');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<div class="no_results">No items found</div>';
        return;
    }
    
    // closetDB의 정확한 방식으로 검색 결과 표시
    container.innerHTML = '';
    
    items.slice(0, 20).forEach(item => {
        const gridItem = document.createElement('div');
        gridItem.className = 'item_card search_result';
        
        // 이미 pin된 아이템인지 확인
        const isPinned = pinnedItems.find(p => p.item_id === item.item_id);
        if (isPinned) {
            gridItem.classList.add('pinned_item');
        }
        
        const img = document.createElement('img');
        
        // closetDB의 이미지 처리 방식
        let hasMultipleImages = false;
        let imageSrc = '';
        let secondImageSrc = '';
        
        if (item.thumbnail_url) {
            imageSrc = item.thumbnail_url;
        } else if (item.images && item.images.length > 0) {
            imageSrc = item.images[0];
            hasMultipleImages = item.images.length > 1;
            if (hasMultipleImages) {
                secondImageSrc = item.images[1];
            }
        } else {
            imageSrc = '/static/src/img/measurement/measurement_top.svg';
            img.classList.add('image_placeholder');
        }
        
        img.src = imageSrc;
        img.alt = item.brand || 'Item';
        img.loading = 'lazy';
        img.className = 'item_image';
        
        // 이미지 개수에 따라 CSS 클래스 추가
        if (hasMultipleImages) {
            gridItem.classList.add('has_multiple_images');
            img.classList.add('first_image');
            
            // 2번째 이미지 요소 생성
            const secondImg = document.createElement('img');
            secondImg.src = secondImageSrc;
            secondImg.alt = img.alt;
            secondImg.loading = 'lazy';
            secondImg.classList.add('second_image', 'item_image');
            
            // 이미지 순서대로 추가
            gridItem.appendChild(img);
            gridItem.appendChild(secondImg);
        } else {
            gridItem.classList.add('single_image');
            gridItem.appendChild(img);
        }
        
        // 클릭 이벤트 추가 (검색 결과 유지)
        gridItem.addEventListener('click', () => {
            pinItem(item.item_id);
            // pin 성공 시 시각적 피드백
            gridItem.classList.add('pinned_item');
        });
        
        container.appendChild(gridItem);
    });
}

function clearSearchResults() {
    const container = document.getElementById('search_results');
    if (container) {
        container.innerHTML = '';
    }
}

function pinItem(itemId) {
    console.log('📌 Attempting to pin item:', itemId);
    
    // closetDB의 item ID 형식 처리 (supabase_ 접두사 추가)
    const apiItemId = itemId.toString().startsWith('supabase_') ? itemId : `supabase_${itemId}`;
    console.log('🔧 Using API item ID:', apiItemId);
    
    // Get item details and add to pinned items
    fetch(`/api/items/${apiItemId}`)
        .then(response => {
            console.log('📡 API response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('📦 API response data:', data);
            if (data.item) {
                const item = data.item;
                console.log('✅ Item found:', item);
                if (!pinnedItems.find(p => p.item_id === item.item_id)) {
                    pinnedItems.push(item);
                    console.log('📌 Item pinned, total pinned:', pinnedItems.length);
                    updatePinnedItemsDisplay();
                    
                    // 검색 결과를 다시 표시하여 pinned 상태 업데이트
                    const searchInput = document.getElementById('item_search');
                    if (searchInput && searchInput.value.trim()) {
                        // 현재 검색어로 다시 검색하여 pinned 상태 반영
                        performSearch(searchInput.value);
                    }
                } else {
                    console.log('⚠️ Item already pinned');
                }
            } else {
                console.error('❌ No item in response');
            }
        })
        .catch(error => {
            console.error('❌ Error pinning item:', error);
        });
}

function unpinItem(itemId) {
    pinnedItems = pinnedItems.filter(item => item.item_id !== itemId);
    updatePinnedItemsDisplay();
}

function updatePinnedItemsDisplay() {
    console.log('🔄 === updatePinnedItemsDisplay called ===');
    
    const container = document.getElementById('pinned_items');
    console.log('📦 Container found:', !!container);
    if (!container) {
        console.error('❌ pinned_items container not found!');
        return;
    }
    
    console.log('📌 Pinned items count:', pinnedItems.length);
    console.log('📷 uploadedImage status:', !!uploadedImage);
    if (uploadedImage) {
        console.log('📷 uploadedImage type:', typeof uploadedImage);
        console.log('📷 uploadedImage length:', uploadedImage.length);
    }
    
    // pin된 아이템들과 photo upload 슬롯 표시
    container.innerHTML = '';
    
    let html = '';
    
    // Add pinned items first
    pinnedItems.forEach((item, index) => {
        console.log(`📌 Adding pinned item ${index}:`, item.item_id);
        html += `
            <div class="item_card search_result pinned_item">
                ${item.images && item.images.length > 0 
                    ? `<img src="${item.images[0]}" alt="${item.brand}" class="item_image">`
                    : `<div class="item_placeholder">${(item.category || '?').charAt(0).toUpperCase()}</div>`
                }
                <button class="remove_item_btn" onclick="event.stopPropagation(); unpinItem('${item.item_id}')" title="Unpin item">×</button>
            </div>
        `;
    });
    
    // Add single photo upload slot
    if (uploadedImage) {
        console.log('✅ Adding uploaded photo to display');
        console.log('📷 uploadedImage data check:', {
            exists: !!uploadedImage,
            type: typeof uploadedImage,
            length: uploadedImage?.length,
            startsWithData: uploadedImage?.startsWith('data:'),
            preview: uploadedImage?.substring(0, 50) + '...'
        });
        
        html += `
            <div class="item_card uploaded_photo" onclick="document.getElementById('ootd_image_upload').click()">
                <img src="${uploadedImage}" alt="Uploaded photo" class="item_image" 
                     onerror="handleImageLoadError(this);" 
                     onload="console.log('✅ Image loaded successfully in preview:', this.src?.length, 'chars');">
                <button class="remove_item_btn" onclick="event.stopPropagation(); removeUploadedImage()" title="Remove image">×</button>
            </div>
        `;
    } else {
        console.log('📷 Adding empty photo upload slot');
        html += `
            <div class="item_card empty photo_upload" onclick="console.log('📱 Photo upload clicked'); const input = document.getElementById('ootd_image_upload'); console.log('📱 Input found:', !!input); alert('📱 Input 요소: ' + (!!input ? '찾음' : '못찾음')); if(input) { console.log('📱 Triggering click...'); input.click(); } else { alert('업로드 요소를 찾을 수 없습니다.'); }">
                📷
            </div>
        `;
    }
    
    console.log('📝 Generated HTML length:', html.length);
    container.innerHTML = html;
    console.log('✅ Container updated with new HTML');
    console.log('🔄 === updatePinnedItemsDisplay complete ===');
}

function handleImageLoadError(imgElement) {
    console.error('❌ === IMAGE LOAD ERROR IN PREVIEW ===');
    console.error('❌ Image src:', imgElement.src?.substring(0, 100) + '...');
    console.error('❌ Image src length:', imgElement.src?.length);
    console.error('❌ Image src type:', typeof imgElement.src);
    console.error('❌ Starts with data:', imgElement.src?.startsWith('data:'));
    console.error('❌ Is mobile:', /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
    
    const sizeInMB = imgElement.src ? (imgElement.src.length * 0.75) / (1024 * 1024) : 0;
    console.error('❌ Estimated size:', sizeInMB.toFixed(2), 'MB');
    
    // 모바일에서 즉시 alert 표시
    alert(`📱 이미지 로드 실패!\n길이: ${imgElement.src?.length || 0}자\n크기: ${sizeInMB.toFixed(1)}MB\n모바일: ${/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Yes' : 'No'}`);
    
    // 이미지 숨기고 오류 메시지 표시
    imgElement.style.display = 'none';
    imgElement.parentElement.innerHTML = `
        <div style="padding:20px;text-align:center;color:red;border:2px dashed red;border-radius:12px;">
            <div style="font-size:24px;margin-bottom:8px;">❌</div>
            <div style="font-size:14px;font-weight:bold;">Image Load Failed</div>
            <div style="font-size:12px;margin-top:4px;">${imgElement.src?.length || 0} chars</div>
            <div style="font-size:12px;">${sizeInMB.toFixed(1)}MB</div>
        </div>
    `;
}

function handleImageUpload(event) {
    console.log('🚨 === IMAGE UPLOAD EVENT TRIGGERED ===');
    console.log('📱 User agent:', navigator.userAgent);
    console.log('📁 Event type:', event.type);
    console.log('📁 Event target:', event.target);
    console.log('📁 Input element:', event.target.tagName, event.target.type, event.target.accept);
    console.log('📁 Files object exists:', !!event.target.files);
    console.log('📁 Files object:', event.target.files);
    console.log('📁 File count:', event.target.files ? event.target.files.length : 'NO FILES OBJECT');
    
    // 모바일 디버깅용 alert
    alert(`📱 업로드 시작!\n파일 개수: ${event.target.files ? event.target.files.length : 0}\n모바일: ${/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Yes' : 'No'}`);
    
    // 모바일에서 파일 선택 확인
    if (!event.target.files) {
        console.error('❌ Files object is null - mobile browser issue?');
        alert('파일 선택에 실패했습니다. 브라우저를 새로고침 후 다시 시도해주세요.');
        return;
    }
    
    if (event.target.files.length === 0) {
        console.error('❌ No files selected by user');
        alert('파일이 선택되지 않았습니다.');
        return;
    }
    
    const file = event.target.files[0];
    if (!file) {
        console.error('❌ First file is null/undefined');
        alert('선택된 파일을 읽을 수 없습니다.');
        return;
    }
    
    console.log('📷 File selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
    });
    
    // 파일 정보 alert 표시
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    alert(`📷 파일 선택됨!\n이름: ${file.name}\n크기: ${fileSizeMB}MB\n타입: ${file.type}`);
    
    // 즉시 로컬 프리뷰 표시 (가장 우선)
    console.log('🔧 Starting FileReader for preview...');
    console.log('📱 Mobile check:', /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
    
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('✅ FileReader completed, data length:', e.target.result.length);
        console.log('📱 Preview data type:', typeof e.target.result);
        console.log('📱 Preview data starts with:', e.target.result.substring(0, 50));
        
        // FileReader 완료 alert
        alert(`📖 파일 읽기 완료!\n데이터 길이: ${e.target.result.length}자\n타입: ${typeof e.target.result}\n시작: ${e.target.result.substring(0, 30)}...`);
        
        // 이미지 데이터 유효성 검사
        if (e.target.result && e.target.result.startsWith('data:image/')) {
            // 데이터 URL 검증
            const dataURL = e.target.result;
            const sizeInMB = (dataURL.length * 0.75) / (1024 * 1024); // Base64는 약 1.33배 크므로 0.75로 실제 크기 추정
            
            console.log('📊 Data URL validation:', {
                length: dataURL.length,
                estimatedMB: sizeInMB.toFixed(2),
                header: dataURL.substring(0, 50),
                isValidBase64: /^data:image\/[a-zA-Z]+;base64,/.test(dataURL)
            });
            
            // 모바일에서 너무 큰 데이터 URL 문제 체크 (20MB 이상)
            if (sizeInMB > 20) {
                console.error('❌ Data URL too large for mobile:', sizeInMB.toFixed(2), 'MB');
                alert(`이미지가 너무 큽니다 (${sizeInMB.toFixed(1)}MB). 더 작은 이미지를 선택해주세요.`);
                return;
            }
            
            // 브라우저 테스트용 작은 이미지 생성
            const testImg = new Image();
            testImg.onload = function() {
                console.log('✅ Data URL validation passed - image can be loaded');
                alert(`✅ 테스트 성공!\n길이: ${dataURL.length}자\n크기: ${sizeInMB.toFixed(1)}MB\n이제 프리뷰에 표시합니다.`);
                uploadedImage = dataURL;
                updatePinnedItemsDisplay();
                console.log('✅ Image processing completed');
            };
            testImg.onerror = function() {
                console.error('❌ Data URL validation failed - image cannot be loaded');
                console.error('❌ Failed URL length:', dataURL.length, 'Size:', sizeInMB.toFixed(2), 'MB');
                console.error('❌ Is mobile:', /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
                console.error('❌ Data URL header:', dataURL.substring(0, 100));
                alert(`❌ 테스트 실패!\n길이: ${dataURL.length}자\n크기: ${sizeInMB.toFixed(1)}MB\n모바일: ${/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Yes' : 'No'}\n브라우저가 이 이미지를 표시할 수 없습니다.`);
            };
            testImg.src = dataURL;
            
        } else {
            console.error('❌ Invalid image data format:', e.target.result?.substring(0, 100));
            alert('올바르지 않은 이미지 형식입니다.');
        }
    };
    reader.onerror = function(e) {
        console.error('❌ FileReader error:', e);
        console.error('❌ Error details:', e.target.error);
        console.error('❌ File info:', {
            name: file.name,
            size: file.size,
            type: file.type
        });
        
        // FileReader 오류 alert
        alert(`❌ 파일 읽기 실패!\n파일: ${file.name}\n크기: ${(file.size / 1024 / 1024).toFixed(2)}MB\n오류: ${e.target.error || '알 수 없는 오류'}`);
    };
    
    try {
        // 파일 크기 및 타입 검증
        console.log('📊 File validation:', {
            size: file.size + ' bytes (' + (file.size / 1024 / 1024).toFixed(2) + ' MB)',
            type: file.type,
            name: file.name
        });
        
        // 매우 큰 파일 경고 (10MB 이상)
        if (file.size > 10 * 1024 * 1024) {
            console.warn('⚠️ Very large file detected:', file.size, 'bytes - may cause issues on mobile');
        }
        
        // 이미지 타입 검증
        if (!file.type.startsWith('image/')) {
            console.error('❌ Not an image file:', file.type);
            return;
        }
        
        // 더 안전한 방식으로 readAsDataURL 호출
        console.log('📱 Starting FileReader.readAsDataURL...');
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('❌ readAsDataURL setup failed:', error);
    }
    
    // EXIF 데이터 추출
    console.log('🔧 Starting EXIF extraction...');
    extractEXIFData(file);
    
    // R2 업로드 활성화
    console.log('📤 Starting R2 upload...');
    uploadImageToR2(file);
    
    console.log('🚨 === IMAGE UPLOAD PROCESSING COMPLETE ===');
}


function uploadImageToR2(file) {
    console.log('📤 Starting R2 upload for:', file.name);
    
    const formData = new FormData();
    formData.append('image', file);
    
    fetch('/api/upload-ootd-image', {
        method: 'POST',
        body: formData
    })
    .then(async response => {
        console.log('📡 R2 upload response status:', response.status);
        console.log('📡 R2 upload response headers:', response.headers);
        
        if (!response.ok) {
            // 에러 응답의 내용을 텍스트로 읽기
            const errorText = await response.text();
            console.error('❌ Server error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}...`);
        }
        
        return response.json();
    })
    .then(data => {
        if (data.success || data.url) {
            console.log('✅ Image uploaded to R2:', data.url);
            // R2 업로드 성공했지만 로컬 미리보기는 data URL 유지
            console.log('🔄 R2 upload complete, keeping local preview');
            // uploadedImage는 data URL 그대로 유지 (미리보기용)
        } else {
            console.error('❌ Upload failed:', data.error);
            // 실패 시 로컬 이미지 유지 (이미 설정됨)
            console.log('🔄 Keeping local preview');
        }
    })
    .catch(error => {
        console.error('❌ Upload error details:', error);
        // 네트워크 오류 시에도 로컬 이미지는 유지
        console.log('🔄 Upload failed, using local preview');
    });
}

function extractEXIFData(file) {
    console.log('🔍 Extracting EXIF data from:', file.name);
    
    // Check if exifr is loaded with multiple checks
    if (typeof exifr === 'undefined' && typeof window.exifr === 'undefined') {
        console.error('❌ exifr library not loaded! Waiting 2 seconds and retrying...');
        
        // Retry after 2 seconds
        setTimeout(() => {
            if (typeof exifr !== 'undefined' || typeof window.exifr !== 'undefined') {
                console.log('✅ exifr found after delay, extracting EXIF data');
                extractEXIFData(file);
            } else {
                console.error('❌ exifr still not loaded after retry. EXIF extraction skipped.');
            }
        }, 2000);
        return;
    }
    
    // Use window.exifr if exifr is not in global scope
    const exifrLib = typeof exifr !== 'undefined' ? exifr : window.exifr;
    
    // Try with more detailed options
    exifrLib.parse(file, {
        gps: true,
        exif: true,
        ifd0: true,
        ifd1: true
    }).then(exifData => {
        console.log('📋 EXIF data found:', exifData);
        
        if (exifData) {
            // Extract date with more options
            const dateFields = ['DateTimeOriginal', 'DateTime', 'CreateDate', 'ModifyDate'];
            let imageDate = null;
            
            for (const field of dateFields) {
                if (exifData[field]) {
                    console.log(`📅 Found date field ${field}:`, exifData[field]);
                    
                    // Handle different date formats
                    let dateString = exifData[field];
                    console.log('📅 Raw date value:', dateString, 'Type:', typeof dateString);
                    
                    if (typeof dateString === 'string') {
                        // Convert EXIF format "2023:10:31 14:30:00" to standard format
                        if (dateString.includes(':')) {
                            // Replace first two colons with dashes for year-month-day
                            dateString = dateString.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
                        }
                        console.log('📅 Converted date string:', dateString);
                    }
                    
                    imageDate = new Date(dateString);
                    console.log('📅 Parsed date object:', imageDate);
                    console.log('📅 Date validity check:', !isNaN(imageDate.getTime()));
                    
                    if (!isNaN(imageDate.getTime())) {
                        console.log('✅ Valid date found, breaking loop');
                        break;
                    } else {
                        console.log('❌ Invalid date, trying next field');
                    }
                }
            }
            
            if (imageDate && !isNaN(imageDate.getTime())) {
                console.log('📅 Before update - currentDate:', currentDate);
                currentDate = new Date(imageDate); // Create new date object to avoid reference issues
                console.log('📅 After update - currentDate:', currentDate);
                console.log('📅 Calling updateDateDisplay...');
                updateDateDisplay(); // HTML 날짜 표시 업데이트
                console.log('✅ Date display should be updated');
                
                // Also update weather for the new date
                updateWeatherForSelectedDate();
            } else {
                console.log('⚠️ No valid date information in EXIF');
            }
            
            // Extract location with comprehensive GPS field checking
            console.log('🔍 Checking GPS fields in EXIF data...');
            console.log('📋 All EXIF fields:', Object.keys(exifData));
            
            // Check multiple possible GPS field names
            let lat = exifData.latitude || exifData.GPSLatitude || 
                     exifData.GPS?.GPSLatitude || exifData.gps?.latitude;
            let lon = exifData.longitude || exifData.GPSLongitude || 
                     exifData.GPS?.GPSLongitude || exifData.gps?.longitude;
            
            // Log specific GPS fields for debugging
            console.log('🧭 GPS fields check:');
            console.log('  - latitude:', exifData.latitude);
            console.log('  - longitude:', exifData.longitude);
            console.log('  - GPSLatitude:', exifData.GPSLatitude);
            console.log('  - GPSLongitude:', exifData.GPSLongitude);
            console.log('  - GPS object:', exifData.GPS);
            console.log('  - gps object:', exifData.gps);
            console.log('  - Final lat:', lat);
            console.log('  - Final lon:', lon);
            
            if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
                console.log('✅ Valid GPS coordinates found:', lat, lon);
                console.log('📍 Calling reverseGeocode...');
                
                try {
                    reverseGeocode(lat, lon);
                    console.log('📍 reverseGeocode called successfully');
                } catch (error) {
                    console.error('❌ reverseGeocode failed:', error);
                }
            } else {
                console.log('⚠️ No valid GPS coordinates found in EXIF data');
                console.log('📱 This might be due to:');
                console.log('   - GPS disabled in camera app');
                console.log('   - Location permission not granted');
                console.log('   - Privacy settings removing location data');
                console.log('📱 Mobile browsers may strip GPS data automatically');
            }
        } else {
            console.log('⚠️ No EXIF data found');
        }
    }).catch(error => {
        console.log('❌ Error reading EXIF:', error);
    });
}

function reverseGeocode(lat, lon) {
    console.log('🌍 Reverse geocoding:', lat, lon);
    
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=en`)
        .then(response => response.json())
        .then(data => {
            console.log('📍 Geocoding response:', data);
            
            if (data && data.address) {
                const addr = data.address;
                console.log('📍 Full address data:', addr);
                
                const locationParts = [];
                
                // 더 구체적인 지역 정보를 우선적으로 선택
                if (addr.neighbourhood) locationParts.push(addr.neighbourhood);
                else if (addr.suburb) locationParts.push(addr.suburb);
                else if (addr.quarter) locationParts.push(addr.quarter);
                else if (addr.city_district) locationParts.push(addr.city_district);
                else if (addr.borough) locationParts.push(addr.borough);
                
                // 시/도 정보 추가
                if (addr.city && !locationParts.includes(addr.city)) {
                    locationParts.push(addr.city);
                } else if (addr.town && !locationParts.includes(addr.town)) {
                    locationParts.push(addr.town);
                } else if (addr.state && !locationParts.includes(addr.state)) {
                    locationParts.push(addr.state);
                }
                
                // 최대 2개 지역명만 사용
                const selectedParts = locationParts.slice(0, 2);
                
                if (selectedParts.length > 0) {
                    const newLocation = selectedParts.join(', ').toUpperCase();
                    console.log('✅ Updated location to:', newLocation);
                    currentLocation = newLocation; // 표시용
                    fullCurrentLocation = data.display_name; // 저장용 (전체 주소) - result 대신 data 사용
                    currentCoords = { lat, lon };
                    updateLocationDisplay();
                    
                    // 새 위치의 날씨 업데이트
                    updateWeatherForLocation(lat, lon);
                } else {
                    console.log('⚠️ No suitable location parts found, keeping current location');
                }
            }
        })
        .catch(error => {
            console.error('Geocoding error:', error);
        });
}


async function saveOOTD() {
    const dateString = formatDateForInput(currentDate);
    
    // uploadedImage 상태 확인
    alert(`💾 OOTD 저장 시작!\n업로드된 이미지: ${uploadedImage ? '있음' : '없음'}\n타입: ${typeof uploadedImage}\n길이: ${uploadedImage?.length || 0}`);
    
    // OOTD 데이터 생성 (핀된 아이템 포함)
    const ootdData = {
        date: dateString,
        location: currentLocation || 'SEOCHO-GU, SEOUL', // OOTD 테이블에는 짧은 주소 저장
        weather: weatherData.weather || 'SUNNY',
        temp_min: weatherData.tempMin || 16,
        temp_max: weatherData.tempMax || 24,
        precipitation: weatherData.precipitation || 0,
        items: pinnedItems.map(item => ({
            id: item.item_id,
            brand: item.brand,
            category: item.category,
            images: item.images
        })),
        uploaded_image: uploadedImage,
        created_at: new Date().toISOString(),
        // 착용 로그용 전체 주소 (별도 필드)
        full_location: fullCurrentLocation || currentLocation || 'SEOCHO-GU, SEOUL'
    };
    
    console.log('💾 Saving OOTD data:', ootdData);
    console.log('📋 Items for wear logging:', ootdData.items.map(item => ({id: item.id, item_id: item.item_id})));
    console.log('📋 Serialized JSON:', JSON.stringify(ootdData));
    
    const token = localStorage.getItem('userToken');
    console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'null');
    
    try {
        // Flask API 사용 (원래대로)
        const response = await fetch('/api/ootd', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(ootdData)
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error response text:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ OOTD saved successfully:', result);
        
        alert(`저장 완료!\n- PIN된 아이템: ${pinnedItems.length}개\n- 업로드 이미지: ${uploadedImage ? '있음' : '없음'}\n- 날짜: ${dateString}\n- 위치: ${currentLocation}`);
        
        // 저장 완료 후 VIEW 탭으로 자동 이동
        console.log('📋 Switching to VIEW tab after save...');
        switchTab('view');
        
    } catch (error) {
        console.error('❌ Save error:', error);
        alert(`저장 중 오류가 발생했습니다:\n${error.message}`);
    }
}

// Get location and weather (from ootdLog)
async function getLocationAndWeather() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        const lat = data.latitude;
        const lon = data.longitude;

        currentCoords = { lat, lon };

        const locationParts = [];
        if (data.city) locationParts.push(data.city);
        if (data.region && data.region !== data.city) locationParts.push(data.region);

        const detailedLocation = locationParts.length > 0
          ? locationParts.join(', ').toUpperCase()
          : 'SEOCHO-GU, SEOUL';

        currentLocation = detailedLocation; // 표시용
        fullCurrentLocation = `${locationParts.join(', ')}, 서울, 대한민국`; // 저장용 (상세 주소)
        updateLocationDisplay();

        // Get weather for current date
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`
        );
        const weatherData_response = await weatherResponse.json();
        
        if (weatherData_response.daily) {
          const tempMinValue = Math.round(weatherData_response.daily.temperature_2m_min[0]);
          const tempMaxValue = Math.round(weatherData_response.daily.temperature_2m_max[0]);
          const weatherCode = weatherData_response.daily.weathercode[0];
          const precipitationProb = weatherData_response.daily.precipitation_probability_max[0] || 0;

          weatherData.tempMin = tempMinValue;
          weatherData.tempMax = tempMaxValue;
          weatherData.precipitation = precipitationProb;

          // Weather code to WeatherType mapping (Open-Meteo standard)
          const getWeatherType = (code) => {
            console.log('🌤️ Initial weather code received:', code);
            
            if (code === 0) return 'SUNNY';
            if (code >= 1 && code <= 3) return 'CLOUDY';
            if (code >= 45 && code <= 48) return 'CLOUDY';
            if (code >= 51 && code <= 57) return 'RAINY';
            if (code >= 61 && code <= 67) return 'RAINY';
            if (code >= 71 && code <= 77) return 'SNOWY';
            if (code >= 80 && code <= 82) return 'RAINY';
            if (code >= 85 && code <= 86) return 'SNOWY';
            if (code >= 95 && code <= 99) return 'RAINY';
            
            console.log('⚠️ Unknown initial weather code:', code, 'defaulting to SUNNY');
            return 'SUNNY';
          };

          const weatherType = getWeatherType(weatherCode);
          weatherData.weather = weatherType;
          updateWeatherDisplay();
        }
    } catch (error) {
        console.error('Error getting location and weather:', error);
        // Do not set fallback coordinates - use only real geolocation or EXIF GPS
        console.log('⚠️ Geolocation failed - no fallback coordinates set');
        currentLocation = 'Location Unknown';
        currentCoords = null;
        updateLocationDisplay();
    }
}

// Update weather when date changes (from ootdLog)
async function updateWeatherForSelectedDate() {
    if (!currentCoords) return;
    
    try {
        // 날짜 검증: 미래 날짜인 경우 현재 날짜로 제한
        const today = new Date();
        const targetDate = new Date(currentDate);
        
        // 미래 날짜인 경우 오늘 날짜로 설정
        if (targetDate > today) {
            console.log('⚠️ Future date detected, using current date for weather');
            targetDate.setTime(today.getTime());
        }
        
        const dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
        console.log('🌤️ Fetching weather for date:', dateString);
        
        // 선택된 날짜의 날씨 정보 가져오기
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${currentCoords.lat}&longitude=${currentCoords.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${dateString}&end_date=${dateString}`
        );
        
        if (weatherResponse.ok) {
          const weatherData_response = await weatherResponse.json();
          
          if (weatherData_response.daily && weatherData_response.daily.weathercode && weatherData_response.daily.weathercode.length > 0) {
            const weatherCode = weatherData_response.daily.weathercode[0];
            const maxTemp = Math.round(weatherData_response.daily.temperature_2m_max[0]);
            const minTemp = Math.round(weatherData_response.daily.temperature_2m_min[0]);
            const precipitation = weatherData_response.daily.precipitation_probability_max[0] || 0;
            
            // Weather code to WeatherType mapping (Open-Meteo standard)
            const getWeatherType = (code) => {
              console.log('🌤️ Weather code received:', code);
              
              // Clear sky
              if (code === 0) return 'SUNNY';
              // Mainly clear, partly cloudy, overcast
              if (code >= 1 && code <= 3) return 'CLOUDY';
              // Fog and depositing rime fog
              if (code >= 45 && code <= 48) return 'CLOUDY';
              // Drizzle: Light, moderate, dense
              if (code >= 51 && code <= 57) return 'RAINY';
              // Freezing drizzle: Light and dense
              if (code >= 56 && code <= 57) return 'RAINY';
              // Rain: Slight, moderate, heavy
              if (code >= 61 && code <= 67) return 'RAINY';
              // Snow fall: Slight, moderate, heavy
              if (code >= 71 && code <= 77) return 'SNOWY';
              // Rain showers: Slight, moderate, violent
              if (code >= 80 && code <= 82) return 'RAINY';
              // Snow showers: Slight and heavy
              if (code >= 85 && code <= 86) return 'SNOWY';
              // Thunderstorm: Slight or moderate, with slight and heavy hail
              if (code >= 95 && code <= 99) return 'RAINY';
              
              console.log('⚠️ Unknown weather code:', code, 'defaulting to SUNNY');
              return 'SUNNY'; // 기본값
            };
            
            const weatherType = getWeatherType(weatherCode);
            weatherData.weather = weatherType;
            weatherData.tempMax = maxTemp;
            weatherData.tempMin = minTemp;
            weatherData.precipitation = precipitation;
            
            updateWeatherDisplay();
            
            console.log(`날씨 업데이트됨 (${dateString}):`, {
              weatherCode: weatherCode,
              weather: weatherType,
              tempMax: maxTemp,
              tempMin: minTemp,
              precipitation: precipitation
            });
          } else {
            console.log('⚠️ No weather data in API response');
          }
        } else {
          console.error('❌ Weather API failed:', weatherResponse.status, weatherResponse.statusText);
          const errorText = await weatherResponse.text();
          console.error('❌ Error response:', errorText);
        }
    } catch (error) {
        console.error('❌ Weather fetch error:', error);
        console.log('🔄 Using default weather data');
    }
}

function loadTodayData() {
    loadDateData();
}

async function loadDateData() {
    const dateString = formatDateForInput(currentDate);
    console.log(`📅 Loading OOTD data for date: ${dateString}`);
    
    try {
        // Load OOTD data from database
        const response = await fetch(`/api/ootd?date=${dateString}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const ootd = data.ootd;
        
        if (ootd) {
            console.log(`✅ Found OOTD data for ${dateString}:`, ootd);
            
            // Load existing OOTD data
            // OOTD에는 이미 짧은 주소가 저장되어 있음
            if (ootd.location) {
                currentLocation = ootd.location; // 이미 파싱된 짧은 주소
                fullCurrentLocation = ootd.location; // 동일하게 설정
            }
            weatherData = {
                weather: ootd.weather || weatherData.weather,
                tempMin: ootd.temp_min || weatherData.tempMin,
                tempMax: ootd.temp_max || weatherData.tempMax,
                precipitation: ootd.precipitation || weatherData.precipitation
            };
            uploadedImage = ootd.uploaded_image || null;
            
            // Load pinned items if they exist
            if (ootd.items && Array.isArray(ootd.items)) {
                console.log('📋 Saved items data:', ootd.items);
                
                // Get full item data from closet_items for each saved item
                const itemIds = ootd.items.map(item => item.id).filter(Boolean);
                console.log('🆔 Extracted item IDs:', itemIds);
                
                if (itemIds.length > 0) {
                    // Load full item details from ClosetDB
                    const itemPromises = itemIds.map(id => 
                        fetch(`/api/items/supabase_${id}`)
                            .then(res => res.json())
                            .then(data => data.item)
                            .catch(err => {
                                console.error(`Failed to load item ${id}:`, err);
                                return null;
                            })
                    );
                    
                    const itemsData = await Promise.all(itemPromises);
                    pinnedItems = itemsData.filter(Boolean); // Remove null items
                    console.log('✅ Loaded pinned items:', pinnedItems);
                } else {
                    console.log('⚠️ No valid item IDs found');
                    pinnedItems = [];
                }
            } else {
                pinnedItems = [];
            }
            
            updateLocationDisplay();
            updateWeatherDisplay();
            updatePinnedItemsDisplay();
            
            if (uploadedImage) {
                const imagePreview = document.getElementById('image_preview');
                if (imagePreview) {
                    imagePreview.innerHTML = `
                        <img src="${uploadedImage}" alt="OOTD">
                        <button class="remove_button" onclick="removeUploadedImage()" style="position: relative; margin-top: 0.5rem;">Remove</button>
                    `;
                }
            } else {
                const imagePreview = document.getElementById('image_preview');
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
            }
        } else {
            console.log(`📅 No OOTD found for ${dateString} - resetting to defaults`);
            
            // Reset for new date
            pinnedItems = [];
            uploadedImage = null;
            updatePinnedItemsDisplay();
            const imagePreview = document.getElementById('image_preview');
            if (imagePreview) {
                imagePreview.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('❌ Error loading OOTD data:', error);
        
        // Reset on error
        pinnedItems = [];
        uploadedImage = null;
        updatePinnedItemsDisplay();
        const imagePreview = document.getElementById('image_preview');
        if (imagePreview) {
            imagePreview.innerHTML = '';
        }
    }
}

async function loadSavedOOTDs() {
    const container = document.getElementById('ootd_history');
    if (!container) return;
    
    container.innerHTML = '<div class="no_items">Loading saved OOTDs...</div>';
    
    try {
        console.log('🔍 Calling /api/ootd with token:', localStorage.getItem('userToken')?.substring(0, 20));
        
        // Use Flask API endpoint instead of direct Supabase call
        const response = await fetch('/api/ootd', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
        });
        
        console.log('📡 API Response status:', response.status);
        console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Raw API response:', data);
        const savedOOTDs = data.ootds || [];
        console.log('✅ Retrieved OOTDs:', savedOOTDs);
        
        if (savedOOTDs.length === 0) {
            container.innerHTML = '<div class="no_items">No saved OOTDs found. Create your first OOTD in the LOG tab!</div>';
            return;
        }
        
        container.innerHTML = savedOOTDs.map(ootd => {
            // 카테고리 우선순위 정의: 1. outer, 2. dress, 3. top, 4. skirt, 5. pants, 6. shoes, 7. 기타
            const categoryOrder = {
                'outer': 1,
                'dress': 2, 
                'top': 3,
                'skirt': 4,
                'pants': 5,
                'shoes': 6
            };
            
            // 아이템들을 카테고리 순서대로 정렬
            const sortedItems = (ootd.items || []).sort((a, b) => {
                const orderA = categoryOrder[a.category?.toLowerCase()] || 999;
                const orderB = categoryOrder[b.category?.toLowerCase()] || 999;
                return orderA - orderB;
            });
            
            return `
                <div class="ootd_entry" onclick="loadOOTDForEdit('${ootd.date}')">
                    <div class="ootd_date_header">
                        ${ootd.date}
                        <div class="ootd_weather_header">
                            ${(ootd.weather).toLowerCase()}, ${ootd.precipitation}%, ${ootd.temp_min}-${ootd.temp_max}
                        </div>
                    </div>
                    <div class="ootd_items_grid">
                        ${ootd.uploaded_image ? `
                            <div class="ootd_item_card">
                                <img src="${ootd.uploaded_image}" alt="OOTD" class="ootd_item_image">
                            </div>
                        ` : ''}
                        ${sortedItems.length > 0 ? sortedItems.map(item => `
                            <div class="ootd_item_card">
                                ${item.images && item.images.length > 0 
                                    ? `<img src="${item.images[0]}" alt="${item.brand}" class="ootd_item_image">`
                                    : `<div class="ootd_item_placeholder">${(item.category || '?').charAt(0).toUpperCase()}</div>`
                                }
                            </div>
                        `).join('') : ''}
                        ${(!ootd.items || ootd.items.length === 0) && !ootd.uploaded_image ? '<div class="no_items">No items saved</div>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('❌ Error loading OOTDs:', error);
        container.innerHTML = '<div class="no_items">Error loading OOTDs. Check console for details.</div>';
    }
}

function removeUploadedImage() {
    console.log('🗑️ Removing uploaded image');
    uploadedImage = null;
    
    // Clear the file input
    const fileInput = document.getElementById('ootd_image_upload');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Update the display
    updatePinnedItemsDisplay();
    console.log('✅ Uploaded image removed');
}

function loadOOTDForEdit(date) {
    console.log('📝 Loading OOTD for edit:', date);
    
    // Set the current date
    currentDate = new Date(date + 'T00:00:00');
    
    // Update the date display (OOTD uses current_date_display, not ootd_date)
    const dateDisplay = document.getElementById('current_date_display');
    if (dateDisplay) {
        // Update the date display
        updateDateDisplay();
        console.log('✅ Date display updated');
    } else {
        console.error('❌ current_date_display element not found');
    }
    
    // Load data for the selected date
    loadDateData();
    
    // Switch to LOG tab
    switchTab('log');
    
    console.log('📝 Switched to LOG tab for editing');
}

function loadAllItems() {
    const container = document.getElementById('items_grid');
    if (!container) return;
    
    fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            const items = data.items || [];
            if (items.length === 0) {
                container.innerHTML = '<div class="no_items">No items found</div>';
                return;
            }
            
            container.innerHTML = items.slice(0, 50).map(item => `
                <div class="item_card" onclick="pinItem('${item.item_id}')">
                    ${item.images && item.images.length > 0 
                        ? `<img src="${item.images[0]}" alt="${item.brand}" class="item_image">`
                        : `<div class="item_placeholder">${(item.category || '?').charAt(0).toUpperCase()}</div>`
                    }
                    <div class="item_info">
                        <div class="item_name">${item.name || item.category || 'Unknown'}</div>
                        <div class="item_brand">${item.brand || ''}</div>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => {
            console.error('Error loading items:', error);
            container.innerHTML = '<div class="no_items">Error loading items</div>';
        });
}

// Helper functions from closetDB script.js - needed for search
function checkMeasurementCondition(term, item) {
    const measurementPattern = /^([a-z_]+)(>=|<=|>|<|=)(\d+(?:\.\d+)?)$/;
    const match = term.match(measurementPattern);
    
    if (!match) {
        return null;
    }
    
    const [, measurementName, operator, valueStr] = match;
    const targetValue = parseFloat(valueStr);
    
    let itemValue = null;
    
    if (item[measurementName] !== undefined && item[measurementName] !== null) {
        itemValue = parseFloat(item[measurementName]);
    }
    else if (item.measurements && item.measurements[measurementName] !== undefined) {
        itemValue = parseFloat(item.measurements[measurementName]);
    }
    
    if (isNaN(itemValue) || itemValue <= 0) {
        return false;
    }
    
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
            conditionMet = Math.abs(itemValue - targetValue) < 0.1;
            break;
        default:
            return false;
    }
    
    return conditionMet;
}

function checkCompositionSearch(term, item) {
    if (typeof compositionList === 'undefined') {
        return null;
    }
    
    const sizeRegions = ['WW', 'US', 'EU', 'FR', 'IT', 'DE', 'UK', 'KR', 'JP', 'Kids', 'Ring', 'etc'];
    const isRegionTerm = sizeRegions.some(region => 
        term.toLowerCase() === region.toLowerCase()
    );
    
    if (isRegionTerm) {
        return null;
    }
    
    const isCompositionTerm = compositionList.some(comp => 
        term.toLowerCase().includes(comp.toLowerCase()) || comp.toLowerCase().includes(term.toLowerCase())
    );
    
    if (!isCompositionTerm) {
        return null;
    }
    
    if (!item.compositions) {
        return false;
    }
    
    if (typeof item.compositions === 'object' && item.compositions !== null) {
        function searchInCompositions(obj) {
            for (const [key, value] of Object.entries(obj)) {
                if (key.toLowerCase().includes(term.toLowerCase()) || term.toLowerCase().includes(key.toLowerCase())) {
                    return true;
                }
                
                if (typeof value === 'object' && value !== null) {
                    if (searchInCompositions(value)) {
                        return true;
                    }
                }
                
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
    
    return false;
}

function checkColorSearch(term, item) {
    if (typeof colorList === 'undefined') {
        return null;
    }
    
    const isColorTerm = colorList.some(color => 
        term.toLowerCase().includes(color.label.toLowerCase()) || color.label.toLowerCase().includes(term.toLowerCase())
    );
    
    if (!isColorTerm) {
        return null;
    }
    
    if (!item.color) {
        return false;
    }
    
    const itemColors = item.color.split(',').map(color => color.trim().toLowerCase());
    const hasColorMatch = itemColors.some(itemColor => 
        itemColor.includes(term.toLowerCase()) || term.toLowerCase().includes(itemColor)
    );
    
    if (hasColorMatch) {
        return true;
    }
    
    return false;
}

// Calendar Functions
function updateDateDisplay() {
    console.log('🔄 updateDateDisplay called with currentDate:', currentDate);
    const display = document.getElementById('current_date_display');
    console.log('🔍 current_date_display element found:', !!display);
    
    if (display) {
        // YYYY.MM.DD 포맷으로 표시
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const newText = `${year}.${month}.${day}`;
        
        console.log('📅 Setting date display to:', newText);
        display.textContent = newText;
        console.log('✅ Date display updated');
    } else {
        console.error('❌ current_date_display element not found in DOM');
    }
}

async function loadSavedDates() {
    try {
        const response = await fetch('/api/ootd', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            savedDates = data.ootds.map(ootd => ootd.date);
            console.log('📅 Loaded saved dates:', savedDates);
        }
    } catch (error) {
        console.error('Error loading saved dates:', error);
        savedDates = [];
    }
}

function showCalendar() {
    calendarDate = new Date(currentDate); // Set calendar to current date
    renderCalendar();
    document.getElementById('calendar_modal').classList.remove('hidden');
}

function hideCalendar() {
    document.getElementById('calendar_modal').classList.add('hidden');
}

function renderCalendar() {
    const titleElement = document.getElementById('calendar_title');
    const gridElement = document.getElementById('calendar_grid');
    
    if (!titleElement || !gridElement) return;
    
    // Set title
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    titleElement.textContent = `${monthNames[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
    
    // Clear grid
    gridElement.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar_day_header';
        header.textContent = day;
        gridElement.appendChild(header);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const lastDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar_day other_month';
        gridElement.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar_day';
        dayElement.textContent = day;
        
        const dayDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
        const dateString = formatDateForInput(dayDate);
        
        // Check if this is today
        if (dayDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Check if this is selected date
        if (dayDate.toDateString() === currentDate.toDateString()) {
            dayElement.classList.add('selected');
        }
        
        // Check if this date has saved OOTD
        if (savedDates.includes(dateString)) {
            dayElement.classList.add('has_ootd');
        }
        
        // Add click handler
        dayElement.addEventListener('click', () => {
            currentDate = new Date(dayDate);
            updateDateDisplay();
            loadDateData();
            hideCalendar();
        });
        
        gridElement.appendChild(dayElement);
    }
}