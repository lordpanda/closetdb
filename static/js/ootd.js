// OOTD JavaScript - Integrated with ClosetDB

// Global variables
let currentDate = new Date();
let pinnedItems = [];
let uploadedImage = null;
let currentLocation = 'SEOCHO-GU, SEOUL';
let weatherData = {
    weather: 'SUNNY',
    tempMin: 16,
    tempMax: 24,
    precipitation: 0
};
let currentCoords = null;
let savedDates = []; // Array of dates that have saved OOTDs
let calendarDate = new Date(); // Current calendar view date

// Initialize OOTD functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, checking elements');
    
    // 직접 input 찾기 테스트
    setTimeout(() => {
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
    }, 1000);
    
    initializeOOTD();
    setupEventListeners();
    loadTodayData();
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
    document.getElementById('ootd_image_upload')?.addEventListener('change', handleImageUpload);
    
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
                
                currentLocation = cleanLocationName;
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
          
          currentLocation = cleanLocationName;
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

// 공통 주소 파싱 함수
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
    
    // dropdown에 표시된 이름을 그대로 사용 (이미 파싱된 결과)
    const cleanLocationName = suggestion.display_name.toUpperCase();
    
    console.log('📍 Setting location to:', cleanLocationName);
    
    // 선택된 위치로 설정
    currentLocation = cleanLocationName;
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
    document.getElementById('temp_display').textContent = `${weatherData.tempMin}-${weatherData.tempMax}°`;
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
    const container = document.getElementById('pinned_items');
    if (!container) return;
    
    // pin된 아이템들과 photo upload 슬롯 표시
    container.innerHTML = '';
    
    let html = '';
    
    // Add pinned items first
    pinnedItems.forEach(item => {
        html += `
            <div class="item_card search_result pinned_item">
                ${item.images && item.images.length > 0 
                    ? `<img src="${item.images[0]}" alt="${item.brand}" class="item_image">`
                    : `<div class="item_placeholder">${(item.category || '?').charAt(0).toUpperCase()}</div>`
                }
                <button class="remove_button" onclick="unpinItem('${item.item_id}')">×</button>
            </div>
        `;
    });
    
    // Add single photo upload slot
    if (uploadedImage) {
        html += `
            <div class="item_card uploaded_photo" onclick="document.getElementById('ootd_image_upload').click()">
                <img src="${uploadedImage}" alt="Uploaded photo" class="item_image">
            </div>
        `;
    } else {
        html += `
            <div class="item_card empty photo_upload" onclick="document.getElementById('ootd_image_upload').click()">
                📷
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // EXIF 데이터 추출 (지오로케이션, 날짜)
        extractEXIFData(file);
        
        // R2에 이미지 업로드
        uploadImageToR2(file);
        
        // 임시로 local preview 표시
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImage = e.target.result;
            console.log('📷 Image uploaded');
            updatePinnedItemsDisplay(); // pinned items 영역 업데이트
        };
        reader.readAsDataURL(file);
    }
}

function uploadImageToR2(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    fetch('/api/upload-ootd-image', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Image uploaded to R2:', data.url);
            uploadedImage = data.url;
            updatePinnedItemsDisplay(); // R2 URL로 업데이트
        } else {
            console.error('❌ Upload failed:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ Upload error:', error);
    });
}

function extractEXIFData(file) {
    console.log('🔍 Extracting EXIF data from:', file.name);
    
    exifr.parse(file).then(exifData => {
        console.log('📋 EXIF data found:', exifData);
        
        if (exifData) {
            // Extract date
            if (exifData.DateTimeOriginal || exifData.DateTime) {
                const dateString = exifData.DateTimeOriginal || exifData.DateTime;
                const imageDate = new Date(dateString);
                console.log('📅 Image date:', dateString, '→', imageDate);
                
                if (!isNaN(imageDate.getTime())) {
                    currentDate = imageDate;
                    console.log('✅ Updated currentDate to:', currentDate);
                    updateDateDisplay(); // HTML 날짜 표시 업데이트
                }
            } else {
                console.log('⚠️ No date information in EXIF');
            }
            
            // Extract location
            if (exifData.latitude && exifData.longitude) {
                console.log('📍 GPS coordinates found:', exifData.latitude, exifData.longitude);
                reverseGeocode(exifData.latitude, exifData.longitude);
            } else {
                console.log('⚠️ No GPS coordinates in EXIF');
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
                const locationParts = [];
                
                if (addr.city) locationParts.push(addr.city);
                if (addr.state) locationParts.push(addr.state);
                
                if (locationParts.length > 0) {
                    const newLocation = locationParts.join(', ').toUpperCase();
                    console.log('✅ Updated location to:', newLocation);
                    currentLocation = newLocation;
                    currentCoords = { lat, lon };
                    updateLocationDisplay();
                    
                    // 새 위치의 날씨 업데이트
                    updateWeatherForLocation(lat, lon);
                }
            }
        })
        .catch(error => {
            console.error('Geocoding error:', error);
        });
}

function removeUploadedImage() {
    uploadedImage = null;
    document.getElementById('image_preview').innerHTML = '';
    document.getElementById('ootd_image_upload').value = '';
}

async function saveOOTD() {
    const dateString = formatDateForInput(currentDate);
    
    // 간단한 테스트 데이터로 시작
    const ootdData = {
        date: dateString,
        location: currentLocation || 'SEOCHO-GU, SEOUL',
        weather: weatherData.weather || 'SUNNY',
        temp_min: weatherData.tempMin || 16,
        temp_max: weatherData.tempMax || 24,
        precipitation: weatherData.precipitation || 0,
        items: [],
        uploaded_image: null,
        created_at: new Date().toISOString()
    };
    
    console.log('💾 Saving OOTD data:', ootdData);
    console.log('📋 Serialized JSON:', JSON.stringify(ootdData));
    
    try {
        // Flask API 사용 (원래대로)
        const response = await fetch('/api/ootd', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
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

        currentLocation = detailedLocation;
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
        currentLocation = 'SEOCHO-GU, SEOUL';
        currentCoords = { lat: 37.5665, lon: 126.9780 };
        updateLocationDisplay();
    }
}

// Update weather when date changes (from ootdLog)
async function updateWeatherForSelectedDate() {
    if (!currentCoords) return;
    
    try {
        const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        
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
          }
        }
    } catch (error) {
        console.error('선택된 날짜의 날씨 정보 가져오기 실패:', error);
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
            currentLocation = ootd.location || currentLocation;
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
                document.getElementById('image_preview').innerHTML = `
                    <img src="${uploadedImage}" alt="OOTD">
                    <button class="remove_button" onclick="removeUploadedImage()" style="position: relative; margin-top: 0.5rem;">Remove</button>
                `;
            } else {
                document.getElementById('image_preview').innerHTML = '';
            }
        } else {
            console.log(`📅 No OOTD found for ${dateString} - resetting to defaults`);
            
            // Reset for new date
            pinnedItems = [];
            uploadedImage = null;
            updatePinnedItemsDisplay();
            document.getElementById('image_preview').innerHTML = '';
        }
    } catch (error) {
        console.error('❌ Error loading OOTD data:', error);
        
        // Reset on error
        pinnedItems = [];
        uploadedImage = null;
        updatePinnedItemsDisplay();
        document.getElementById('image_preview').innerHTML = '';
    }
}

async function loadSavedOOTDs() {
    const container = document.getElementById('ootd_history');
    if (!container) return;
    
    container.innerHTML = '<div class="no_items">Loading saved OOTDs...</div>';
    
    try {
        // Use Flask API endpoint instead of direct Supabase call
        const response = await fetch('/api/ootd', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const savedOOTDs = data.ootds || [];
        console.log('✅ Retrieved OOTDs:', savedOOTDs);
        
        if (savedOOTDs.length === 0) {
            container.innerHTML = '<div class="no_items">No saved OOTDs found. Create your first OOTD in the LOG tab!</div>';
            return;
        }
        
        container.innerHTML = savedOOTDs.map(ootd => `
            <div class="ootd_entry" onclick="loadOOTDForEdit('${ootd.date}')">
                <div class="ootd_date_header">
                    ${ootd.date} | ${(ootd.weather || 'sunny').toLowerCase()}, ${ootd.precipitation || 0}%, ${ootd.temp_min || 16}-${ootd.temp_max || 24}°
                </div>
                <div class="ootd_items_grid">
                    ${ootd.items && ootd.items.length > 0 ? ootd.items.map(item => `
                        <div class="ootd_item_card">
                            ${item.images && item.images.length > 0 
                                ? `<img src="${item.images[0]}" alt="${item.brand}" class="ootd_item_image">`
                                : `<div class="ootd_item_placeholder">${(item.category || '?').charAt(0).toUpperCase()}</div>`
                            }
                        </div>
                    `).join('') : ''}
                    ${ootd.uploaded_image ? `
                        <div class="ootd_item_card">
                            <img src="${ootd.uploaded_image}" alt="OOTD" class="ootd_item_image">
                        </div>
                    ` : ''}
                    ${(!ootd.items || ootd.items.length === 0) && !ootd.uploaded_image ? '<div class="no_items">No items saved</div>' : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('❌ Error loading OOTDs:', error);
        container.innerHTML = '<div class="no_items">Error loading OOTDs. Check console for details.</div>';
    }
}

function loadOOTDForEdit(date) {
    currentDate = new Date(date + 'T00:00:00');
    document.getElementById('ootd_date').value = date;
    loadDateData();
    switchTab('log');
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
    const display = document.getElementById('current_date_display');
    if (display) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'short'
        };
        display.textContent = currentDate.toLocaleDateString('en-US', options);
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