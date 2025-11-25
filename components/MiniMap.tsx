import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Maximize2 } from 'lucide-react';

// Custom marker icon to avoid default icon issues
const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MiniMapProps {
  lat: number;
  lng: number;
  label?: string;
  onExpand: () => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({ lat, lng, label, onExpand }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onExpand();
  };

  return (
    <div className="relative w-full h-24 rounded border border-slate-700 overflow-hidden group">
      {/* Map layer - non-interactive */}
      <div className="absolute inset-0 pointer-events-none">
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          scrollWheelZoom={false}
          dragging={false}
          zoomControl={false}
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} icon={markerIcon} />
        </MapContainer>
      </div>

      {/* Clickable overlay - captures all clicks */}
      <div
        className="absolute inset-0 z-10 cursor-pointer bg-transparent hover:bg-black/20 transition-colors flex items-center justify-center"
        onClick={handleClick}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 px-2 py-1 rounded flex items-center gap-1 text-[10px] text-slate-300">
          <Maximize2 className="w-3 h-3" />
          点击放大
        </div>
      </div>

      {/* Coordinates badge */}
      <div className="absolute bottom-1 left-1 z-20 bg-slate-900/80 px-1.5 py-0.5 rounded text-[8px] text-slate-400 font-mono pointer-events-none">
        {lat.toFixed(4)}, {lng.toFixed(4)}
      </div>
    </div>
  );
};
