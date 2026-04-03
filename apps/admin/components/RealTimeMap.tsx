'use client';

import { useEffect, useState, useRef, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
}

// Custom Marker Creator
const createCarIcon = (active: boolean) => {
  return L.divIcon({
    className: 'custom-car-icon',
    html: `
      <div style="
        width: 32px; height: 32px;
        background: ${active ? '#10b981' : '#3f3f46'};
        border-radius: 50%;
        border: 2px solid #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const RealTimeMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // 1. Initialize Map if it doesn't exist
    if (!mapInstanceRef.current) {
        // Essential: Check if the container already has a Leaflet ID
        const container = mapContainerRef.current;
        if ((container as any)._leaflet_id) return;

        const map = L.map(container, {
            center: [12.9716, 77.5946],
            zoom: 12,
            zoomControl: false,
            attributionControl: false,
        });

        // Dark Mode Tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // 2. Setup Socket
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    
    socket.on('connect', () => {
        console.log('📡 Map connected to grid');
        setConnected(true);
    });
    
    socket.on('disconnect', () => setConnected(false));

    socket.on('locationUpdated', (data: DriverLocation) => {
        const markers = markersRef.current;
        
        if (markers.has(data.driverId)) {
            // Smoothly move existing marker
            markers.get(data.driverId)!.setLatLng([data.lat, data.lng]);
        } else {
            // Create new marker
            const marker = L.marker([data.lat, data.lng], {
                icon: createCarIcon(true)
            }).addTo(map);
            
            marker.bindPopup(`
                <div style="background: #000; color: #fff; padding: 10px; border-radius: 8px; font-family: sans-serif;">
                    <p style="font-size: 8px; color: #666; margin-bottom: 4px; letter-spacing: 1px;">ASSET_ACTIVE</p>
                    <p style="font-size: 11px; font-weight: 800;">${data.driverId.slice(0, 12)}</p>
                </div>
            `, {
                className: 'premium-map-popup'
            });
            
            markers.set(data.driverId, marker);
        }
    });

    // 3. Cleanup on unmount
    return () => {
        console.log('🧹 Cleaning up Map resources');
        socket.disconnect();
        // Note: We don't necessarily remove the map on every re-render, 
        // only on true unmount if needed. But in Next.js dev, removing it is safer.
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#030303]">
      {/* HUD Overlay */}
      <div className="absolute top-8 left-8 z-[1000] flex items-center gap-4 bg-black/60 backdrop-blur-2xl px-5 py-3 rounded-2xl border border-white/5 shadow-2xl">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]' : 'bg-red-500'}`} />
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-zinc-400 tracking-[0.2em] mb-0.5 uppercase">Network Status</span>
          <span className="text-[12px] font-bold text-white uppercase tracking-tight">
            {connected ? 'Synchronized' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      {/* Map Container Target */}
      <div ref={mapContainerRef} className="w-full h-full grayscale-[0.5] contrast-[1.1]" />

      <style jsx global>{`
        .leaflet-container { background: #030303 !important; }
        .premium-map-popup .leaflet-popup-content-wrapper {
            background: #000 !important;
            color: #fff !important;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px !important;
            padding: 0 !important;
        }
        .premium-map-popup .leaflet-popup-tip { background: #000 !important; }
      `}</style>
    </div>
  );
};

export default memo(RealTimeMap);
