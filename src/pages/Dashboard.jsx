
// Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Phone, Navigation, CheckCircle, Filter, User } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { doc, getDoc, onSnapshot, collection, updateDoc } from 'firebase/firestore';
import Sidebar from '../components/Sidebar'; // <-- Import the sidebar
import SettingsView from './Settings';

const LUSAKA_CENTER = { lat: -15.4167, lng: 28.2833 };


const Dashboard = () => {
  const [sosList, setSosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSOS, setSelectedSOS] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [responderData, setResponderData] = useState(null);
  const [responderLocation, setResponderLocation] = useState(LUSAKA_CENTER);

  const [activeView, setActiveView] = useState('dashboard');
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const currentUser = auth.currentUser;

  // Load responder data + geolocation (same as before)

  useEffect(() => {
    if (!currentUser) return;

    const loadResponderData = async () => {
      try {
        const responderDoc = await getDoc(doc(db, "Responders", currentUser.uid));
        if (responderDoc.exists()) {
          const data = responderDoc.data();
          setResponderData(data);
          setResponderLocation({
            lat: data.location?.latitude || LUSAKA_CENTER.lat,
            lng: data.location?.longitude || LUSAKA_CENTER.lng
          });
        }
      } catch (error) {
        console.error("Error loading responder data:", error);
      }
    };

    loadResponderData();

    // Optional: Add geolocation watching here if needed
  }, [currentUser]);

  // SOS subscription (same as before)
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, "Responders", currentUser.uid, "SOS"),
      (snapshot) => {
        const sosData = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          sosData.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        });

        sosData.sort((a, b) => b.createdAt - a.createdAt);
        setSosList(sosData);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);
  // Update selectedSOS when sosList changes (e.g., status update)
  useEffect(() => {
    if (selectedSOS) {
      const updatedSOS = sosList.find(s => s.id === selectedSOS.id);
      if (updatedSOS) {
        setSelectedSOS(updatedSOS);
      }
    }
  }, [sosList]);
  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const mapHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
          .emergency-marker {
            background-color: #ef4444;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
            animation: pulse 2s infinite;
          }
          .responding-marker {
            background-color: #f59e0b;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 15px rgba(245, 158, 11, 0.6);
            animation: none;
          }
          .resolved-marker {
            background-color: #10b981;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.6);
            animation: none;
          }
          .responder-marker {
            background-color: #3b82f6;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          .popup-content {
            min-width: 200px;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .popup-title {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
          }
          .popup-info {
            font-size: 14px;
            color: #4b5563;
            margin: 4px 0;
          }
          .leaflet-routing-container {
            background-color: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          }
          .leaflet-routing-alt {
            margin: 0;
            padding: 10px;
          }
          .leaflet-routing-alt h3 {
            font-size: 14px;
            margin: 0 0 10px 0;
            color: #1f2937;
          }
          .leaflet-routing-alt table {
            font-size: 13px;
          }
          .leaflet-routing-geocoders {
            display: none;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${LUSAKA_CENTER.lat}, ${LUSAKA_CENTER.lng}], 13);

         

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);


          window.markers = [];
          window.responderMarker = null;
          window.routingControl = null;
          window.responderLocation = null;

          window.updateResponderMarker = function(lat, lng, name) {
            window.responderLocation = [lat, lng];
            if (window.responderMarker) {
              window.responderMarker.setLatLng([lat, lng]);
            } else {
              var responderIcon = L.divIcon({
                className: 'responder-marker',
                iconSize: [25, 25],
                iconAnchor: [12.5, 12.5]
              });
              window.responderMarker = L.marker([lat, lng], { icon: responderIcon })
                .addTo(map)
                .bindPopup('<div class="popup-content"><div class="popup-title">📍 ' + name + '</div><div class="popup-info">Your Location</div></div>');
            }
            if (window.routingControl) {
              var waypoints = window.routingControl.getWaypoints();
              if (waypoints[1]) {
                window.routingControl.setWaypoints([
                  L.latLng(lat, lng),
                  waypoints[1]
                ]);
              }
            }
          };
          window.updateMarkers = function(sosListJson) {
            window.markers.forEach(marker => map.removeLayer(marker));
            window.markers = [];
            var sosList = JSON.parse(sosListJson);
           

            sosList.forEach(function(sos) {
              var markerClass = 'emergency-marker';
              if (sos.status === 'responding') markerClass = 'responding-marker';
              if (sos.status === 'resolved') markerClass = 'resolved-marker';


              var icon = L.divIcon({
                className: markerClass,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              });

              var statusEmoji = sos.status === 'active' ? '🚨' : sos.status === 'responding' ? '🚑' : '✅';

              var marker = L.marker([sos.location.latitude, sos.location.longitude], { icon: icon })
                .addTo(map)
                .bindPopup(\`
                  <div class="popup-content">
                    <div class="popup-title">\${statusEmoji} Emergency Alert</div>
                    <div class="popup-info"><strong>Contact:</strong> \${sos.contact || 'N/A'}</div>
                    <div class="popup-info"><strong>Info:</strong> \${sos.information || 'No details'}</div>
                    <div class="popup-info"><strong>Status:</strong> \${sos.status}</div>
                  </div>
                \`);

              window.markers.push(marker);
            });
          };
          window.focusOnSOS = function(lat, lng) {
            map.setView([lat, lng], 16);
          };

          window.showRoute = function(toLat, toLng) {
            // Remove existing route if any
            if (window.routingControl) {
              map.removeControl(window.routingControl);
            }


            if (!window.responderLocation) {
              console.error('Responder location not set');
              return;
            }


            // Create routing control
            window.routingControl = L.Routing.control({
              waypoints: [
                L.latLng(window.responderLocation[0], window.responderLocation[1]),
                L.latLng(toLat, toLng)
              ],
              routeWhileDragging: false,
              addWaypoints: false,
              draggableWaypoints: false,
              fitSelectedRoutes: true,
              showAlternatives: false,
              lineOptions: {
                styles: [{color: '#3b82f6', opacity: 0.8, weight: 6}]
              },
              createMarker: function() { return null; }, // Don't create default markers
              router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1'
              })
            }).addTo(map);


            // Listen for route found
            window.routingControl.on('routesfound', function(e) {
              var routes = e.routes;
              var summary = routes[0].summary;
              console.log('Route found:', {
                distance: (summary.totalDistance / 1000).toFixed(2) + ' km',
                time: Math.round(summary.totalTime / 60) + ' minutes'
              });
            });
          };


          window.clearRoute = function() {
            if (window.routingControl) {
              map.removeControl(window.routingControl);
              window.routingControl = null;
            }
          };
        </script>
      </body>
      </html>
    `;


    const iframe = mapRef.current;
    if (iframe) {
      iframe.srcdoc = mapHTML;
      mapInstance.current = iframe;

      iframe.onload = () => {
        setTimeout(() => {
          if (iframe.contentWindow && iframe.contentWindow.updateResponderMarker && responderData) {
            iframe.contentWindow.updateResponderMarker(
              responderLocation.lat,

              responderLocation.lng,
              responderData.institutionName
            );
          }
          if (iframe.contentWindow && iframe.contentWindow.updateMarkers && sosList.length > 0) {
            iframe.contentWindow.updateMarkers(JSON.stringify(sosList));
          }
        }, 500);
      };
    }

  }, [responderData, responderLocation, sosList]);

  // Update map when SOS list changes
  useEffect(() => {
    if (mapInstance.current && sosList.length > 0) {
      const iframe = mapInstance.current;
      if (iframe.contentWindow && iframe.contentWindow.updateMarkers) {
        const filteredList = filterStatus === 'all' ? sosList : sosList.filter(s => s.status === filterStatus);
        iframe.contentWindow.updateMarkers(JSON.stringify(filteredList));
      }
    }
  }, [sosList, filterStatus]);

  // Update responder marker when location changes
  useEffect(() => {
    if (mapInstance.current && responderData) {
      const iframe = mapInstance.current;
      if (iframe.contentWindow && iframe.contentWindow.updateResponderMarker) {
        iframe.contentWindow.updateResponderMarker(
          responderLocation.lat,
          responderLocation.lng,
          responderData.institutionName
        );
      }
    }
  }, [responderLocation]);
  // Focus on selected SOS

  useEffect(() => {
    if (selectedSOS && mapInstance.current) {
      const iframe = mapInstance.current;
      if (iframe.contentWindow && iframe.contentWindow.focusOnSOS) {
        iframe.contentWindow.focusOnSOS(selectedSOS.location.latitude, selectedSOS.location.longitude);

      }
    }
  }, [selectedSOS]);
  // Automatically show/clear route based on selected SOS status
  useEffect(() => {
    if (selectedSOS && mapInstance.current) {
      const iframe = mapInstance.current;
      if (selectedSOS.status === 'responding') {
        if (iframe.contentWindow && iframe.contentWindow.showRoute) {
          iframe.contentWindow.showRoute(
            selectedSOS.location.latitude,
            selectedSOS.location.longitude
          );
        }
      } else {
        if (iframe.contentWindow && iframe.contentWindow.clearRoute) {

          iframe.contentWindow.clearRoute();
        }
      }
    }
  }, [selectedSOS]);

  // Show route to selected SOS (manual trigger if needed)
  const handleShowRoute = () => {
    if (!selectedSOS || !mapInstance.current) return;
   

    const iframe = mapInstance.current;
    if (iframe.contentWindow && iframe.contentWindow.showRoute) {
      iframe.contentWindow.showRoute(
        selectedSOS.location.latitude,
        selectedSOS.location.longitude
      );
    }
  };

  // Clear route
  const handleClearRoute = () => {
    if (!mapInstance.current) return;
   

    const iframe = mapInstance.current;
    if (iframe.contentWindow && iframe.contentWindow.clearRoute) {
      iframe.contentWindow.clearRoute();
    }
  };


  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  const handleStatusChange = async (sosId, newStatus) => {
    if (!currentUser) return;
   

    try {
      await updateDoc(doc(db, "Responders", currentUser.uid, "SOS", sosId), {
        status: newStatus,
        ...(newStatus === 'resolved' ? { resolvedAt: new Date() } : {})
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    }
  };



  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  
  
  const filteredSOS = filterStatus === 'all' ? sosList : sosList.filter(s => s.status === filterStatus);
  const activeCount = sosList.filter(s => s.status === 'active').length;
  const respondingCount = sosList.filter(s => s.status === 'responding').length;
  const resolvedToday = sosList.filter(s =>
    s.status === 'resolved' &&
    s.resolvedAt &&
    new Date(s.resolvedAt).toDateString() === new Date().toDateString()
  ).length;
  
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  

return (
  <div className="h-screen flex bg-gray-50"> {/* Changed to flex (row by default) */}
    {/* Sidebar - Fixed on the left */}
<Sidebar
      activeView={activeView}
      setActiveView={setActiveView}
      responderData={responderData}
      isCollapsed={isSidebarCollapsed}
      setIsCollapsed={setIsSidebarCollapsed}
    />
    
    {/* Main Content Area - Takes remaining space */}
    <div className="flex-1 flex flex-col overflow-hidden">
      {activeView === 'settings' ? (
        <SettingsView 
        responderData={responderData}
        currentUser={currentUser}
        />
      ) : (
        <>
          {/* Dashboard Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SafeCircle Responder</h1>
                <p className="text-sm text-gray-500">
                  {responderData ? `${responderData.institutionName} - ${responderData.branch}` : 'Loading...'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {responderData?.institutionName || 'Responder'}
                  </div>
                  <div className="text-xs text-gray-500">On Duty</div>
                </div>
              </div>
            </div>
          </header>
      
      

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Stats */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-xs text-red-600 font-medium">Active</div>
                <div className="text-2xl font-bold text-red-700">{activeCount}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-xs text-orange-600 font-medium">Responding</div>
                <div className="text-2xl font-bold text-orange-700">{respondingCount}</div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 mt-3">
              <div className="text-xs text-green-600 font-medium">Resolved Today</div>
              <div className="text-2xl font-bold text-green-700">{resolvedToday}</div>
            </div>
          </div>

          
          
          
{/* Filters */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter by Status</span>

            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${

                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'

                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({sosList.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${

                  filterStatus === 'active'
                    ? 'bg-red-600 text-white'

                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setFilterStatus('responding')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${

                  filterStatus === 'responding'
                    ? 'bg-orange-600 text-white'

                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Responding ({respondingCount})
              </button>
            </div>
          </div>


          {/* SOS List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading emergencies...</div>
            ) : filteredSOS.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {filterStatus === 'all' ? 'No emergencies yet' : `No ${filterStatus} emergencies`}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSOS.map(sos => {
                  const distance = calculateDistance(
                    responderLocation.lat,
                    responderLocation.lng,
                    sos.location.latitude,
                    sos.location.longitude
                  );


                  return (
                    <div
                      key={sos.id}
                      onClick={() => setSelectedSOS(sos)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedSOS?.id === sos.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {sos.contact || 'Unknown Contact'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mb-1">
                            {sos.information || 'No additional information provided'}
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full mt-1 ${
                          sos.status === 'active' ? 'bg-red-500 animate-pulse' :
                          sos.status === 'responding' ? 'bg-orange-500' :
                          'bg-green-500'
                        }`} />
                      </div>

                     

                      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {distance} km away
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(sos.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>


        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Map */}
          <div className="flex-1 relative">
            <iframe
              ref={mapRef}
              className="w-full h-full border-0"
              title="Emergency Map"
            />
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div className="text-gray-600">Loading map...</div>
              </div>
            )}
          </div>

          {/* Selected SOS Details */}
			{selectedSOS && (
                <div
                  className={`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl transition-all duration-300 ease-in-out ${
                    isDetailsExpanded ? 'h-96' : 'h-12'
                  }`}
                >
                  {/* Toggle Bar */}
                  <div
                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    className="h-12 px-6 flex items-center justify-between border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          selectedSOS.status === 'active'
                            ? 'bg-red-500 animate-pulse'
                            : selectedSOS.status === 'responding'
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}
                      />
                      <h3 className="font-semibold text-gray-900">
                        Emergency Alert — {selectedSOS.contact}
                      </h3>
                    </div>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      {isDetailsExpanded ? '↑' : '↓'}
                      {isDetailsExpanded ? 'Hide' : 'Show'} Details
                    </span>
                  </div>

                  {/* Expanded Details */}
                  {isDetailsExpanded && (
                    <div className="h-84 overflow-y-auto p-6">
                      <div className="max-w-4xl mx-auto">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-gray-600">{selectedSOS.contact}</p>
                          </div>
                          <span
                            className={`px-3 py-1 text-sm font-semibold rounded-full ${
                              selectedSOS.status === 'active'
                                ? 'bg-red-100 text-red-700'
                                : selectedSOS.status === 'responding'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {selectedSOS.status.toUpperCase()}
                          </span>
                        </div>
               		

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{selectedSOS.contact || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                      {calculateDistance(
                        responderLocation.lat,
                        responderLocation.lng,
                        selectedSOS.location.latitude,
                        selectedSOS.location.longitude
                      )} km away
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{getTimeAgo(selectedSOS.createdAt)}</span>
                  </div>
                </div>


                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Information:</h3>
                  <p className="text-sm text-gray-700">
                    {selectedSOS.information || 'No additional information provided'}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Location:</h3>
                  <p className="text-sm text-gray-700">
                    Lat: {selectedSOS.location.latitude.toFixed(6)},
                    Lng: {selectedSOS.location.longitude.toFixed(6)}
                  </p>
                </div>
				<div className="flex gap-3 mt-6">
                          {selectedSOS.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(selectedSOS.id, 'responding')}
                              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2"
                            >
                              <Navigation className="w-5 h-5" />
                              Start Responding
                            </button>
                          )}
                          {selectedSOS.status === 'responding' && (
                            <button
                              onClick={() => handleStatusChange(selectedSOS.id, 'resolved')}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Mark as Resolved
                            </button>
                          )}
                          <button
                            onClick={handleShowRoute}
                            className="px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex items-center gap-2"
                          >
                            <Navigation className="w-5 h-5" />
                            Show Route
                          </button>
                          <button
                            onClick={handleClearRoute}
                            className="px-6 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-lg"
                          >
                            Clear Route
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);
};

export default Dashboard;
