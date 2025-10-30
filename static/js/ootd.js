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

// Initialize OOTD functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeOOTD();
    setupEventListeners();
    loadTodayData();
});

function initializeOOTD() {
    // Set today's date
    const dateInput = document.getElementById('ootd_date');
    if (dateInput) {
        dateInput.value = formatDateForInput(currentDate);
    }
    
    // Initialize location
    updateLocationDisplay();
    
    // Initialize weather
    updateWeatherDisplay();
    
    // Load items for search
    setupItemSearch();
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
    
    document.getElementById('ootd_date')?.addEventListener('change', (e) => {
        currentDate = new Date(e.target.value + 'T00:00:00');
        loadDateData();
    });
    
    // Location editing
    document.getElementById('edit_location_btn')?.addEventListener('click', toggleLocationEdit);
    
    document.getElementById('location_input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveLocation();
        } else if (e.key === 'Escape') {
            cancelLocationEdit();
        }
    });
    
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
    document.getElementById('ootd_date').value = formatDateForInput(currentDate);
    loadDateData();
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

function toggleLocationEdit() {
    const display = document.getElementById('location_display');
    const input = document.getElementById('location_input');
    
    display.classList.add('hidden');
    input.classList.remove('hidden');
    input.value = currentLocation;
    input.focus();
}

function saveLocation() {
    const input = document.getElementById('location_input');
    currentLocation = input.value.toUpperCase();
    updateLocationDisplay();
    cancelLocationEdit();
    // TODO: Get weather for new location
}

function cancelLocationEdit() {
    document.getElementById('location_display').classList.remove('hidden');
    document.getElementById('location_input').classList.add('hidden');
}

function updateLocationDisplay() {
    document.getElementById('location_text').textContent = currentLocation;
}

function updateWeatherDisplay() {
    const weatherIcon = getWeatherIcon(weatherData.weather);
    document.getElementById('weather_display').textContent = weatherIcon;
    document.getElementById('temp_display').textContent = `${weatherData.tempMin}-${weatherData.tempMax}°`;
    document.getElementById('precipitation_display').textContent = `${weatherData.precipitation}%`;
}

function getWeatherIcon(weather) {
    switch(weather) {
        case 'SUNNY': return '☀️';
        case 'CLOUDY': return '☁️';
        case 'RAINY': return '🌧️';
        case 'SNOWY': return '❄️';
        default: return '☀️';
    }
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
            searchItems(query);
        }, 300);
    });
}

function searchItems(query) {
    // Use ClosetDB API to search items
    fetch(`/api/items?search=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            displaySearchResults(data.items || []);
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
    
    container.innerHTML = items.map(item => `
        <div class="item_card search_result" onclick="pinItem('${item.item_id}')">
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
}

function clearSearchResults() {
    const container = document.getElementById('search_results');
    if (container) {
        container.innerHTML = '';
    }
}

function pinItem(itemId) {
    // Get item details and add to pinned items
    fetch(`/api/items/${itemId}`)
        .then(response => response.json())
        .then(data => {
            if (data.item) {
                const item = data.item;
                if (!pinnedItems.find(p => p.item_id === item.item_id)) {
                    pinnedItems.push(item);
                    updatePinnedItemsDisplay();
                    clearSearchResults();
                    document.getElementById('item_search').value = '';
                }
            }
        })
        .catch(error => {
            console.error('Error pinning item:', error);
        });
}

function unpinItem(itemId) {
    pinnedItems = pinnedItems.filter(item => item.item_id !== itemId);
    updatePinnedItemsDisplay();
}

function updatePinnedItemsDisplay() {
    const container = document.getElementById('pinned_items');
    if (!container) return;
    
    if (pinnedItems.length === 0) {
        container.innerHTML = '<div class="no_items">No items pinned</div>';
        return;
    }
    
    container.innerHTML = pinnedItems.map(item => `
        <div class="item_card pinned_item">
            ${item.images && item.images.length > 0 
                ? `<img src="${item.images[0]}" alt="${item.brand}" class="item_image">`
                : `<div class="item_placeholder">${(item.category || '?').charAt(0).toUpperCase()}</div>`
            }
            <button class="remove_button" onclick="unpinItem('${item.item_id}')">×</button>
        </div>
    `).join('');
}

function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log('📸 File selected:', file);
    
    // Create preview
    const imageUrl = URL.createObjectURL(file);
    uploadedImage = imageUrl;
    
    const preview = document.getElementById('image_preview');
    if (preview) {
        preview.innerHTML = `
            <img src="${imageUrl}" alt="OOTD Preview">
            <button class="remove_button" onclick="removeUploadedImage()" style="position: relative; margin-top: 0.5rem;">Remove</button>
        `;
    }
    
    // TODO: Upload to R2 cloud storage
    uploadImageToR2(file);
    
    // Extract EXIF data if available
    if (window.exifr) {
        extractEXIFData(file);
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
        } else {
            console.error('❌ Upload failed:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ Upload error:', error);
    });
}

function extractEXIFData(file) {
    exifr.parse(file).then(exifData => {
        if (exifData) {
            // Extract date
            if (exifData.DateTimeOriginal || exifData.DateTime) {
                const dateString = exifData.DateTimeOriginal || exifData.DateTime;
                const imageDate = new Date(dateString);
                if (!isNaN(imageDate.getTime())) {
                    currentDate = imageDate;
                    document.getElementById('ootd_date').value = formatDateForInput(currentDate);
                }
            }
            
            // Extract location
            if (exifData.latitude && exifData.longitude) {
                reverseGeocode(exifData.latitude, exifData.longitude);
            }
        }
    }).catch(error => {
        console.log('No EXIF data found or error reading EXIF:', error);
    });
}

function reverseGeocode(lat, lon) {
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=en`)
        .then(response => response.json())
        .then(data => {
            if (data && data.address) {
                const addr = data.address;
                const locationParts = [];
                
                if (addr.city) locationParts.push(addr.city);
                if (addr.state) locationParts.push(addr.state);
                
                if (locationParts.length > 0) {
                    currentLocation = locationParts.join(', ').toUpperCase();
                    updateLocationDisplay();
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

function saveOOTD() {
    const dateString = formatDateForInput(currentDate);
    
    const ootdData = {
        date: dateString,
        location: currentLocation,
        weather: weatherData.weather,
        temp_min: weatherData.tempMin,
        temp_max: weatherData.tempMax,
        precipitation: weatherData.precipitation,
        items: pinnedItems.map(item => ({
            id: item.item_id,
            brand: item.brand,
            category: item.category,
            subcategory: item.subcategory,
            images: item.images
        })),
        uploaded_image: uploadedImage
    };
    
    console.log('💾 Saving OOTD:', ootdData);
    
    // TODO: Save to database/API
    // For now, save to localStorage
    const savedOOTDs = JSON.parse(localStorage.getItem('savedOOTDs') || '[]');
    const existingIndex = savedOOTDs.findIndex(ootd => ootd.date === dateString);
    
    if (existingIndex >= 0) {
        savedOOTDs[existingIndex] = ootdData;
    } else {
        savedOOTDs.push(ootdData);
    }
    
    localStorage.setItem('savedOOTDs', JSON.stringify(savedOOTDs));
    
    alert(`OOTD saved successfully!\n- Date: ${dateString}\n- Items: ${pinnedItems.length}\n- Photo: ${uploadedImage ? 'Yes' : 'No'}`);
}

function loadTodayData() {
    loadDateData();
    // TODO: Get weather data for current location
}

function loadDateData() {
    const dateString = formatDateForInput(currentDate);
    const savedOOTDs = JSON.parse(localStorage.getItem('savedOOTDs') || '[]');
    const ootd = savedOOTDs.find(o => o.date === dateString);
    
    if (ootd) {
        // Load existing OOTD data
        currentLocation = ootd.location || currentLocation;
        weatherData = {
            weather: ootd.weather || weatherData.weather,
            tempMin: ootd.temp_min || weatherData.tempMin,
            tempMax: ootd.temp_max || weatherData.tempMax,
            precipitation: ootd.precipitation || weatherData.precipitation
        };
        pinnedItems = ootd.items || [];
        uploadedImage = ootd.uploaded_image || null;
        
        updateLocationDisplay();
        updateWeatherDisplay();
        updatePinnedItemsDisplay();
        
        if (uploadedImage) {
            document.getElementById('image_preview').innerHTML = `
                <img src="${uploadedImage}" alt="OOTD">
                <button class="remove_button" onclick="removeUploadedImage()" style="position: relative; margin-top: 0.5rem;">Remove</button>
            `;
        }
    } else {
        // Reset for new date
        pinnedItems = [];
        uploadedImage = null;
        updatePinnedItemsDisplay();
        document.getElementById('image_preview').innerHTML = '';
    }
}

function loadSavedOOTDs() {
    const container = document.getElementById('ootd_history');
    if (!container) return;
    
    const savedOOTDs = JSON.parse(localStorage.getItem('savedOOTDs') || '[]');
    
    if (savedOOTDs.length === 0) {
        container.innerHTML = '<div class="no_items">No saved OOTDs</div>';
        return;
    }
    
    // Sort by date descending
    savedOOTDs.sort((a, b) => new Date(b.date) - new Date(a.date));
    
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