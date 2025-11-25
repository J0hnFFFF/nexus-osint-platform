import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { X, Copy, Navigation, Layers, Check } from 'lucide-react';

// Custom marker icon
const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  title: string;
  address?: string;
}

// Component to handle map layer switching
const LayerControl: React.FC<{ onLayerChange: (layer: 'street' | 'satellite') => void; currentLayer: string }> = ({
  onLayerChange,
  currentLayer
}) => {
  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
      <button
        onClick={() => onLayerChange('street')}
        className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
          currentLayer === 'street'
            ? 'bg-cyan-600 text-white'
            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
        }`}
      >
        <Layers className="w-3 h-3" />
        街道
      </button>
      <button
        onClick={() => onLayerChange('satellite')}
        className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
          currentLayer === 'satellite'
            ? 'bg-cyan-600 text-white'
            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
        }`}
      >
        <Layers className="w-3 h-3" />
        卫星
      </button>
    </div>
  );
};

// Component to change tile layer dynamically
const DynamicTileLayer: React.FC<{ layer: 'street' | 'satellite' }> = ({ layer }) => {
  const streetUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  return (
    <TileLayer
      key={layer}
      url={layer === 'street' ? streetUrl : satelliteUrl}
      attribution={layer === 'street'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        : '&copy; <a href="https://www.esri.com/">Esri</a>'
      }
    />
  );
};

export const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  lat,
  lng,
  title,
  address
}) => {
  const [layer, setLayer] = useState<'street' | 'satellite'>('street');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const coordText = `${lat}, ${lng}`;
    await navigator.clipboard.writeText(coordText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavigate = () => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      e.preventDefault();
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="bg-[#161b26] border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-bold text-white">{title}</span>
          </div>
          <button
            onClick={handleClose}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 hover:bg-slate-700 rounded transition-colors z-50"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative" style={{ height: '400px' }}>
          <MapContainer
            center={[lat, lng]}
            zoom={15}
            scrollWheelZoom={true}
            style={{ height: '400px', width: '100%' }}
          >
            <DynamicTileLayer layer={layer} />
            <Marker position={[lat, lng]} icon={markerIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>{title}</strong>
                  {address && <p className="text-slate-600 mt-1">{address}</p>}
                  <p className="text-xs text-slate-500 mt-1 font-mono">{lat}, {lng}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          <LayerControl onLayerChange={setLayer} currentLayer={layer} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 bg-black/20">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">坐标:</span>
            <span className="text-xs text-cyan-400 font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? '已复制' : '复制'}
            </button>
            <button
              onClick={handleNavigate}
              className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-xs text-white transition-colors"
            >
              <Navigation className="w-3 h-3" />
              导航
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
