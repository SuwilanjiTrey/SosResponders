// src/pages/EmergencyDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './EmergencyDetails.css';

const EmergencyDetails = ({ emergencies }) => {
  const { id } = useParams();
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const emergency =
    emergencies.find((e) => e.id === id) || {
      id: '1',
      title: 'Car Accident',
      description: 'Multi-vehicle collision near city center.',
      location: { lat: -13.1339, lng: 27.8493 }, // Lusaka, Zambia
      status: 'active',
      priority: 'high',
      reportedBy: 'Anonymous',
      reportedAt: new Date(Date.now() - 300000).toISOString(),
      responders: ['Police', 'Ambulance'],
      category: 'accident',
    };

  const getUserLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported.");
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
        let msg = "Could not get your location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location access denied.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location unavailable. Try outdoors or enable GPS.";
        }
        setLocationError(msg);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distance = userLocation
    ? calculateDistance(
        userLocation[0], userLocation[1],
        emergency.location.lat, emergency.location.lng
      ).toFixed(2)
    : null;

  const getStaticMapUrl = () => {
    const center = `${emergency.location.lat},${emergency.location.lng}`;
    const zoom = 15;
    const size = "600x300";
    const maptype = "mapnik";
    const markers = [
      `${emergency.location.lat},${emergency.location.lng},red1`
    ];
    if (userLocation) {
      markers.push(`${userLocation[0]},${userLocation[1]},blue1`);
    }
    const markersParam = encodeURIComponent(markers.join('|'));
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${encodeURIComponent(center)}&zoom=${zoom}&size=${size}&maptype=${maptype}&markers=${markersParam}`;
  };

  return (
    <div className="emergency-details-simple">
      <header className="details-header">
        <Link to="/map" className="back-button">← Back to Emergencies</Link>
        <h1>Emergency Details</h1>
      </header>

      <main className="details-content">
        <div className={`status-banner ${emergency.status}`}>
          {emergency.status === 'active' ? '🚨 ACTIVE EMERGENCY' : '✅ RESOLVED'}
        </div>

        <h2>{emergency.title}</h2>

        {/* Static Map */}
        <div className="map-container">
          <img
            src={getStaticMapUrl()}
            alt="Emergency location"
            className="static-map"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'block';
              }
            }}
          />
          <div className="map-fallback">
            <p>📍 Emergency: {emergency.location.lat.toFixed(4)}, {emergency.location.lng.toFixed(4)}</p>
            {userLocation && (
              <p>👤 You: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}</p>
            )}
            <a
              href={`https://www.openstreetmap.org/?mlat=${emergency.location.lat}&mlon=${emergency.location.lng}#map=15/${emergency.location.lat}/${emergency.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="view-on-osm"
            >
              View on OpenStreetMap
            </a>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <strong>Category:</strong> {emergency.category}
          </div>
          <div className="info-item">
            <strong>Priority:</strong>{' '}
            <span className={`priority ${emergency.priority}`}>{emergency.priority}</span>
          </div>
          <div className="info-item">
            <strong>Reported:</strong> {new Date(emergency.reportedAt).toLocaleString()}
          </div>
          <div className="info-item">
            <strong>Location:</strong>{' '}
            {emergency.location.lat.toFixed(6)}, {emergency.location.lng.toFixed(6)}
          </div>
          {distance !== null && (
            <div className="info-item">
              <strong>Distance:</strong> {distance} km from you
            </div>
          )}
        </div>

        <p className="description">{emergency.description}</p>

        <div className="action-buttons">
          {userLocation ? (
            <a
              href={`https://www.openstreetmap.org/directions?from=${userLocation[0]}%2C${userLocation[1]}&to=${emergency.location.lat}%2C${emergency.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn primary"
            >
              🗺️ Get Directions (OSM)
            </a>
          ) : (
            <button
              onClick={getUserLocation}
              disabled={gettingLocation}
              className="btn secondary"
            >
              {gettingLocation ? 'Getting Location...' : 'Enable Location for Directions'}
            </button>
          )}

          <Link to="/map" className="btn outline">
            View All Emergencies
          </Link>
        </div>

        {locationError && <p className="error-message">{locationError}</p>}
      </main>
    </div>
  );
};

export default EmergencyDetails;
