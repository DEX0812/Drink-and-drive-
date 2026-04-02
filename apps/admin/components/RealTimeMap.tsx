'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// 🏎️ PREMIUM CUSTOM MARKER
const carIcon = L.divIcon({
  className: 'custom-car-icon',
  html: `<div style="
    width: 20px; 
    height: 20px; 
    background: white; 
    border-radius: 4px; 
    border: 2px solid black;
    box-shadow: 0 0 15px rgba(255,255,255,0.4);
    transform: rotate(45deg);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function RealTimeMap() {
  const [drivers, setDrivers] = useState([
    { id: 1, lat: 12.9716, lng: 77.5946, name: 'DriveSafe Go #801' },
    { id: 2, lat: 12.9650, lng: 77.6010, name: 'DriveSafe Black #211' },
    { id: 3, lat: 12.9780, lng: 77.5850, name: 'Private Driver #04' },
  ]);

  // 🔄 MOCK CONTINUOUS MOVEMENT
  useEffect(() => {
    const interval = setInterval(() => {
      setDrivers(prev => prev.map(d => ({
        ...d,
        lat: d.lat + (Math.random() - 0.5) * 0.001,
        lng: d.lng + (Math.random() - 0.5) * 0.001,
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full bg-[#0A0A0A]">
      <MapContainer 
        center={[12.9716, 77.5946]} 
        zoom={14} 
        scrollWheelZoom={false}
        className="h-full w-full grayscale-[0.8] contrast-[1.2] invert"
        style={{ background: '#0A0A0A' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {drivers.map(d => (
          <Marker key={d.id} position={[d.lat, d.lng]} icon={carIcon}>
            <Popup className="premium-popup">
               <span className="font-bold text-xs uppercase tracking-widest">{d.name}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* 🔮 OVERLAY GRADIENT */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] z-[400]" />
      
      <style jsx global>{`
        .leaflet-container { background: #0A0A0A !important; }
        .leaflet-bar { border: 1px solid #333 !important; }
        .leaflet-bar a { background: #111 !important; color: white !important; border-bottom: 1px solid #333 !important; }
        .premium-popup .leaflet-popup-content-wrapper {
          background: #000 !important;
          color: #fff !important;
          border-radius: 4px !important;
          border: 1px solid #1A1A1A !important;
        }
        .premium-popup .leaflet-popup-tip { background: #000 !important; }
      `}</style>
    </div>
  );
}
