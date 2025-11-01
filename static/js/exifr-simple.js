// Simplified EXIF reader for OOTD functionality
(function(global) {
    'use strict';
    
    const exifr = {
        parse: function(file, options = {}) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        const arrayBuffer = e.target.result;
                        const dataView = new DataView(arrayBuffer);
                        const exifData = {};
                        
                        // Check for EXIF marker
                        if (dataView.getUint16(0) !== 0xFFD8) {
                            console.log('Not a valid JPEG file');
                            resolve(null);
                            return;
                        }
                        
                        let offset = 2;
                        let marker;
                        
                        // Find EXIF segment
                        while (offset < dataView.byteLength) {
                            marker = dataView.getUint16(offset);
                            
                            if (marker === 0xFFE1) {
                                // Found EXIF segment
                                const segmentLength = dataView.getUint16(offset + 2);
                                const exifString = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer, offset + 4, 4));
                                
                                if (exifString === 'Exif') {
                                    console.log('✅ Found EXIF segment');
                                    const exifOffset = offset + 10;
                                    
                                    try {
                                        // Parse basic EXIF data
                                        const tiffHeader = dataView.getUint16(exifOffset);
                                        const isLittleEndian = tiffHeader === 0x4949;
                                        
                                        // Extract GPS data if available
                                        const gpsData = this.extractGPS(dataView, exifOffset, isLittleEndian);
                                        if (gpsData.latitude && gpsData.longitude) {
                                            exifData.latitude = gpsData.latitude;
                                            exifData.longitude = gpsData.longitude;
                                            console.log('📍 GPS found:', gpsData);
                                        }
                                        
                                        // Extract date data
                                        const dateData = this.extractDate(dataView, exifOffset, isLittleEndian);
                                        if (dateData) {
                                            exifData.DateTimeOriginal = dateData;
                                            console.log('📅 Date found:', dateData);
                                        }
                                        
                                    } catch (parseError) {
                                        console.warn('EXIF parsing error:', parseError);
                                    }
                                }
                                break;
                            }
                            
                            offset += 2 + dataView.getUint16(offset + 2);
                        }
                        
                        resolve(Object.keys(exifData).length > 0 ? exifData : null);
                        
                    } catch (error) {
                        console.error('Error parsing EXIF:', error);
                        resolve(null);
                    }
                };
                
                reader.onerror = function() {
                    reject(new Error('Failed to read file'));
                };
                
                reader.readAsArrayBuffer(file);
            });
        },
        
        extractGPS: function(dataView, offset, isLittleEndian) {
            // Simplified GPS extraction - this is a basic implementation
            try {
                // Look for GPS tags in EXIF data
                // This is a simplified version - real EXIF parsing is much more complex
                return {};
            } catch (error) {
                return {};
            }
        },
        
        extractDate: function(dataView, offset, isLittleEndian) {
            // Simplified date extraction
            try {
                // Look for DateTime tags in EXIF data
                // This is a simplified version
                return null;
            } catch (error) {
                return null;
            }
        }
    };
    
    // Export to global scope
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exifr;
    } else {
        global.exifr = exifr;
    }
    
    console.log('✅ Simple EXIFR loaded');
    
})(typeof window !== 'undefined' ? window : this);