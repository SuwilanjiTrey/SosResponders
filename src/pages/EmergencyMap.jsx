// src/pages/EmergencyMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './EmergencyMap.css';

const EmergencyMap = ({ emergencies }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Default to Lusaka, Zambia coordinates
  const defaultCenter = [-15.4167, 28.2833];

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getUserLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setGettingLocation(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        let msg = "Unable to get your location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Please allow location access in your browser settings.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location unavailable. Try enabling GPS, moving near a window, or using mobile data.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Please try again.";
        }
        setLocationError(msg);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Initialize map
  useEffect(() => {
    // Load Leaflet CSS and JS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      script.async = true;
      script.onload = initializeMap;
      document.body.appendChild(script);
    } else {
      initializeMap();
    }

    getUserLocation();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const initializeMap = () => {
    if (!window.L || !mapRef.current || mapInstanceRef.current) return;

    const map = window.L.map(mapRef.current).setView(defaultCenter, 12);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
  };

  // Update markers when emergencies or user location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const activeEmergencies = emergencies.filter(e => e.status === 'active');

    // Add emergency markers
    activeEmergencies.forEach(emergency => {
      const icon = window.L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${getPriorityColor(emergency.priority)}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 18px;">🚨</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = window.L.marker([emergency.location.lat, emergency.location.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px;">${emergency.title}</h3>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Priority:</strong> ${emergency.priority}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Category:</strong> ${emergency.category}</p>
            <p style="margin: 4px 0; font-size: 13px;">${emergency.description}</p>
          </div>
        `)
        .on('click', () => setSelectedEmergency(emergency));

      markersRef.current.push(marker);
    });

    // Add user location marker
    if (userLocation) {
      const userIcon = window.L.divIcon({
        className: 'user-marker',
        html: `<div style="background-color: #4285F4; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const userMarker = window.L.marker(userLocation, { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<strong>Your Location</strong>');

      markersRef.current.push(userMarker);

      // Center map on user location
      mapInstanceRef.current.setView(userLocation, 13);
    } else if (activeEmergencies.length > 0) {
      // Center on first emergency if no user location
      const bounds = window.L.latLngBounds(
        activeEmergencies.map(e => [e.location.lat, e.location.lng])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [emergencies, userLocation]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const activeEmergencies = emergencies.filter(e => e.status === 'active');
  const sortedEmergencies = userLocation
    ? [...activeEmergencies].sort((a, b) => {
        const distA = calculateDistance(
          userLocation[0], userLocation[1],
          a.location.lat, a.location.lng
        );
        const distB = calculateDistance(
          userLocation[0], userLocation[1],
          b.location.lat, b.location.lng
        );
        return distA - distB;
      })
    : activeEmergencies;

  const focusOnEmergency = (emergency) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([emergency.location.lat, emergency.location.lng], 15);
      setSelectedEmergency(emergency);
    }
  };

  return (
    <div className="emergency-map-container">
      <header className="map-header">
        <Link to="/" className="back-button">← Back to Dashboard</Link>
        <h1>Active Emergencies Map</h1>
        <div className="location-controls">
          <button
            onClick={getUserLocation}
            disabled={gettingLocation}
            className="location-btn"
          >
            {gettingLocation ? 'Getting Location...' : '📍 Refresh My Location'}
          </button>
          {userLocation && (
            <span className="user-location">
              Your location: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
            </span>
          )}
        </div>
        {locationError && <div className="error-message">{locationError}</div>}
      </header>

      <div className="map-content">
        <div className="map-wrapper">
          <div ref={mapRef} className="leaflet-map" style={{ height: '600px', width: '100%' }}></div>
        </div>

        <aside className="emergency-sidebar">
          <h2>Active Emergencies ({sortedEmergencies.length})</h2>
          {sortedEmergencies.length === 0 ? (
            <p className="no-emergencies">No active emergencies.</p>
          ) : (
            <div className="emergency-list">
              {sortedEmergencies.map((emergency) => {
                const distance = userLocation
                  ? calculateDistance(
                      userLocation[0], userLocation[1],
                      emergency.location.lat, emergency.location.lng
                    ).toFixed(2)
                  : null;

                return (
                  <div
                    key={emergency.id}
                    className={`emergency-item ${selectedEmergency?.id === emergency.id ? 'selected' : ''}`}
                    onClick={() => focusOnEmergency(emergency)}
                  >
                    <div className="item-header">
                      <h3>{emergency.title}</h3>
                      <span className={`priority-badge ${emergency.priority}`}>
                        {emergency.priority}
                      </span>
                    </div>
                    <p className="item-description">{emergency.description}</p>
                    <div className="item-meta">
                      <span className="category">{emergency.category}</span>
                      <span className="time">
                        {new Date(emergency.reportedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {distance !== null && (
                        <span className="distance">📏 {distance} km away</span>
                      )}
                    </div>
                    <div className="item-actions">
                      <Link to={`/emergency/${emergency.id}`} className="btn-small">
                        View Details
                      </Link>
                      {userLocation && (
                        <a
                          href={`https://www.openstreetmap.org/directions?from=${userLocation[0]}%2C${userLocation[1]}&to=${emergency.location.lat}%2C${emergency.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-small"
                        >
                          🗺️ Directions
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default EmergencyMap;
