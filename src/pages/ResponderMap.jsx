// src/pages/ResponderMap.jsx (continued)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ResponderMap = () => {
  const [sos, setSos] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = React.useRef(null);
  const mapInstance = React.useRef(null);

  useEffect(() => {
    if (!id) return;

    // Subscribe to SOS updates
    const unsubscribe = onSnapshot(
      doc(db, "Responders", localStorage.getItem('uid'), "SOS", id),
      (doc) => {
        if (doc.exists()) {
          setSos({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching SOS data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!sos || !mapRef.current) return;

    // Initialize map if not already done
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([sos.location.latitude, sos.location.longitude], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);
    } else {
      // Update view if map already exists
      mapInstance.current.setView([sos.location.latitude, sos.location.longitude], 15);
    }

    // Clear existing markers
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstance.current.removeLayer(layer);
      }
    });

    // Add emergency marker
    const emergencyIcon = L.divIcon({
      html: `<div style="background-color: #ff5252; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
      iconSize: [20, 20],
      className: 'emergency-marker'
    });

    const marker = L.marker([sos.location.latitude, sos.location.longitude], { icon: emergencyIcon })
      .addTo(mapInstance.current)
      .bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 10px 0; color: #d32f2f;">Emergency Location</h3>
          <p style="margin: 5px 0;"><strong>Contact:</strong> ${sos.contact}</p>
          <p style="margin: 5px 0;"><strong>Information:</strong> ${sos.information || 'No additional information'}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${sos.status}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${sos.createdAt.toLocaleString()}</p>
        </div>
      `)
      .openPopup();

    return () => {
      if (mapInstance.current && marker) {
        mapInstance.current.removeLayer(marker);
      }
    };
  }, [sos]);

  const handleResolveEmergency = async () => {
    if (!sos) return;
    
    if (window.confirm("Are you sure you want to mark this emergency as resolved?")) {
      try {
        await updateDoc(
          doc(db, "Responders", localStorage.getItem('uid'), "SOS", sos.id),
          { status: 'resolved' }
        );
        alert("Emergency marked as resolved.");
        navigate('/dashboard');
      } catch (error) {
        console.error("Error resolving emergency:", error);
        alert("Failed to resolve emergency. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading emergency location...</div>
      </div>
    );
  }

  if (!sos) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-lg mb-4">Emergency not found.</div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Emergency Location</h1>
          <div className="w-20"></div>
        </div>
      </header>
      
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full"></div>
        
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
          <h3 className="font-semibold text-gray-800 mb-2">Emergency Details</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Contact:</span> {sos.contact}</p>
            <p><span className="font-medium">Information:</span> {sos.information || 'No additional information'}</p>
            <p><span className="font-medium">Status:</span> 
              <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                sos.status === 'active' ? 'bg-red-100 text-red-800' : 
                sos.status === 'responding' ? 'bg-orange-100 text-orange-800' : 
                'bg-green-100 text-green-800'
              }`}>
                {sos.status.toUpperCase()}
              </span>
            </p>
            <p><span className="font-medium">Time:</span> {sos.createdAt.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <footer className="bg-white shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button 
            onClick={handleResolveEmergency}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Mark as Resolved
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ResponderMap;
