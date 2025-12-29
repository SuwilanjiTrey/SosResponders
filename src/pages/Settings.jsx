// components/SettingsView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Building2, Calendar, Check, AlertCircle, Upload, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const LUSAKA_CENTER = { lat: -15.4167, lng: 28.2833 };

const SettingsView = ({ responderData, currentUser }) => {
  const [institutionName, setInstitutionName] = useState(responderData?.institutionName || '');
  const [branch, setBranch] = useState(responderData?.branch || '');
  const [logoBase64, setLogoBase64] = useState(responderData?.logoBase64 || null); // Base64 string
  const [location, setLocation] = useState({
    lat: responderData?.location?.latitude || LUSAKA_CENTER.lat,
    lng: responderData?.location?.longitude || LUSAKA_CENTER.lng,
  });
  const [address, setAddress] = useState('Loading address...');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const mapRef = useRef(null);
  const fileInputRef = useRef(null);

  // Convert file to Base64
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size (optional but recommended)
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 1024 * 1024) { // 1MB limit
      alert('Image must be smaller than 1MB');
      return;
    }

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result; // e.g. "data:image/png;base64,iVBORw0KGgo..."
      setLogoBase64(base64String);
      setUploadingLogo(false);
    };
    reader.onerror = () => {
      alert('Failed to read image');
      setUploadingLogo(false);
    };
    reader.readAsDataURL(file);
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Map HTML with search + reverse geocoding
  const mapHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; overflow: hidden; }
          html, body, #map { width: 100%; height: 100%; }
          .custom-marker {
            background: #3b82f6;
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 15px rgba(59,130,246,0.4);
            position: relative;
          }
          .custom-marker::after {
            content: '';
            background: white;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            position: absolute;
            top: 9px;
            left: 9px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          let map, marker;

          function initMap(lat, lng) {
            if (map) return;

            map = L.map('map').setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            const markerIcon = L.divIcon({
              className: 'custom-marker',
              iconSize: [30, 30],
              iconAnchor: [15, 30]
            });

            marker = L.marker([lat, lng], { icon: markerIcon, draggable: true }).addTo(map);

            marker.on('dragend', updateLocation);
            map.on('click', (e) => {
              marker.setLatLng(e.latlng);
              updateLocation();
            });

            function updateLocation() {
              const pos = marker.getLatLng();
              window.parent.postMessage({ type: 'locationUpdate', lat: pos.lat, lng: pos.lng }, '*');
              reverseGeocode(pos.lat, pos.lng);
            }

            function reverseGeocode(lat, lng) {
              fetch(\`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=\${lat}&lon=\${lng}\`)
                .then(r => r.json())
                .then(data => {
                  const addr = data.display_name || 'Address not found';
                  window.parent.postMessage({ type: 'addressUpdate', address: addr }, '*');
                })
                .catch(() => {
                  window.parent.postMessage({ type: 'addressUpdate', address: 'Unable to fetch address' }, '*');
                });
            }

            reverseGeocode(lat, lng);
          }

          window.searchLocation = function(query) {
            if (!query.trim()) return;
            fetch(\`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=\${encodeURIComponent(query)}\`)
              .then(r => r.json())
              .then(data => {
                if (data && data[0]) {
                  const lat = parseFloat(data[0].lat);
                  const lng = parseFloat(data[0].lon);
                  marker.setLatLng([lat, lng]);
                  map.setView([lat, lng], 15);
                  window.parent.postMessage({ type: 'locationUpdate', lat, lng }, '*');
                  reverseGeocode(lat, lng);
                }
              });
          };

          window.addEventListener('message', (event) => {
            if (event.data.type === 'updateLocation') {
              const { lat, lng } = event.data;
              if (marker) {
                marker.setLatLng([lat, lng]);
                map.setView([lat, lng], map.getZoom());
              } else {
                initMap(lat, lng);
              }
            }
          });

          window.addEventListener('load', () => {
            initMap(${location.lat}, ${location.lng});
          });
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    const iframe = mapRef.current;
    if (!iframe) return;

    iframe.srcdoc = mapHTML;

    const handleMessage = (event) => {
      if (event.data.type === 'locationUpdate') {
        setLocation({ lat: event.data.lat, lng: event.data.lng });
      } else if (event.data.type === 'addressUpdate') {
        setAddress(event.data.address);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const iframe = mapRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'updateLocation',
        lat: location.lat,
        lng: location.lng
      }, '*');
    }
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (mapRef.current?.contentWindow && searchQuery.trim()) {
      mapRef.current.contentWindow.searchLocation(searchQuery);
      setSearchQuery('');
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      await updateDoc(doc(db, "Responders", currentUser.uid), {
        institutionName: institutionName.trim(),
        branch: branch.trim(),
        logoBase64: logoBase64, // Save Base64 string directly
        location: {
          latitude: parseFloat(location.lat.toFixed(6)),
          longitude: parseFloat(location.lng.toFixed(6)),
        },
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    institutionName.trim() !== (responderData?.institutionName || '') ||
    branch.trim() !== (responderData?.branch || '') ||
    logoBase64 !== (responderData?.logoBase64 || null) ||
    Math.abs(location.lat - (responderData?.location?.latitude || LUSAKA_CENTER.lat)) > 0.000001 ||
    Math.abs(location.lng - (responderData?.location?.longitude || LUSAKA_CENTER.lng)) > 0.000001;

  return (
    <div className="p-8 lg:p-12 overflow-y-auto h-full bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-gray-900">Settings</h2>
          <p className="text-lg text-gray-600 mt-2">Manage your institution profile and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Logo Upload */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
              <h3 className="text-lg font-semibold mb-6">Institution Logo</h3>
              <div className="relative inline-block mb-6">
                {logoBase64 ? (
                  <img
                    src={logoBase64}
                    alt="Institution logo"
                    className="w-40 h-40 mx-auto rounded-2xl object-contain bg-gray-100 border border-gray-300"
                  />
                ) : (
                  <div className="w-40 h-40 mx-auto bg-gray-200 rounded-2xl border-2 border-dashed border-gray-400 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {logoBase64 && (
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
              >
                <Upload className="w-5 h-5" />
                {uploadingLogo ? 'Uploading...' : logoBase64 ? 'Change Logo' : 'Upload Logo'}
              </button>
            </div>

            {/* Subscription Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Subscription</h3>
                <Calendar className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-3xl font-bold mb-2">Premium Active</p>
              <p className="text-blue-100">Unlimited alerts • Priority routing</p>
              <div className="mt-6 flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span className="text-sm">Valid until Dec 31, 2026</span>
              </div>
            </div>

            {/* Institution Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-8 h-8 text-blue-600" />
                <h3 className="text-xl font-semibold">Institution Details</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. University Teaching Hospital"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch / Unit</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Emergency Department"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Institution Location</h3>
                  <p className="text-gray-600">Search, click, or drag the marker to set precise location</p>
                </div>
              </div>

              {/* Search Box */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search address (e.g. Cairo Road, Lusaka)"
                    className="w-full px-5 py-4 pr-14 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Map */}
              <div className="relative h-96 rounded-xl overflow-hidden border border-gray-300 mb-6">
                <iframe
                  ref={mapRef}
                  className="w-full h-full"
                  title="Institution Location Map"
                />
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-5 py-3 rounded-xl shadow-lg text-sm">
                  <div className="font-semibold">Coordinates</div>
                  <div>Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}</div>
                  <div className="text-gray-600 mt-2 text-xs leading-relaxed max-w-xs">{address}</div>
                </div>
              </div>

              {/* Save Section */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  {saveStatus === 'success' && (
                    <p className="text-green-600 font-medium flex items-center gap-2">
                      <Check className="w-5 h-5" /> Changes saved successfully!
                    </p>
                  )}
                  {saveStatus === 'error' && (
                    <p className="text-red-600 font-medium flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> Failed to save. Please try again.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className={`px-10 py-4 rounded-xl font-semibold text-lg transition-all flex items-center gap-3 ${
                    hasChanges
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  } ${isSaving ? 'opacity-70' : ''}`}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
