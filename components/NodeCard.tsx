

import React, { useState } from 'react';
import { IntelNode, NodeType } from '../types';
import { MiniMap } from './MiniMap';
import { MapModal } from './MapModal';
import { MediaModal } from './MediaModal';
import { getCommunityColorClass } from '../services/graphAnalysis';
import {
  User, Globe, Image as ImageIcon, FileText,
  Link2, Network, Server, MapPin, Hash, Database, AtSign, Loader2,
  Building2, Car, Video, Mic, MessageSquare, File, Paperclip, Music,
  Bug, ShieldAlert, Search, DatabaseZap, Radio, Archive, Scan,
  Ghost, Fingerprint, Cloud, Wifi, CreditCard, Smartphone, Tablet,
  Sword, Cpu, Newspaper, Code, Calendar, Flag, Lightbulb, Gavel, Lock,
  Landmark, Bitcoin, Activity, AppWindow, Users, Ear, Satellite, ScanFace,
  Plane, BedDouble, Ship, IdCard, Ticket, Tent, Bomb, Fish, Router,
  GitBranch, Waves, Play, Folder, UserCog, Award, Shield, Target,
  Microscope, FileCheck, Eye, Gauge, Camera, QrCode, Barcode, Package,
  FileSpreadsheet, Monitor, Key, Scroll, Briefcase, GraduationCap, Heart,
  Home, Shield as ShieldIcon, Wrench, FileArchive, Settings, Podcast, Cast,
  Star
} from 'lucide-react';

interface NodeCardProps {
  node: IntelNode;
  isSelected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onStartConnect: (e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  // Graph Analysis Props
  communityId?: number;
  isKeyNode?: boolean;
  centrality?: number;
}

// Helper function to parse coordinate string
const parseCoordinates = (value: string): { lat: number; lng: number } | null => {
  if (!value || typeof value !== 'string') return null;

  // Match patterns like "39.9042,116.4074" or "39.9042, 116.4074"
  const match = value.trim().match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);

  // Validate coordinate ranges
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
};

// Fields that may contain coordinates
const COORDINATE_FIELDS = ['经纬度', '坐标', 'coordinates', 'latlng', 'location'];

// Fields that may contain address (for map search)
const ADDRESS_FIELDS = ['详细地址', '地址', 'address', '位置', '总部地址', '注册地址', '物理位置', '开户行地址'];

export const NodeCard: React.FC<NodeCardProps> = ({
  node, isSelected, onPointerDown, onStartConnect, onContextMenu,
  communityId, isKeyNode, centrality
}) => {
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState<{ src: string; type: 'image' | 'video' | 'audio'; title: string } | null>(null);

  const handleOpenMap = (coords: { lat: number; lng: number }) => {
    setActiveCoords(coords);
    setMapModalOpen(true);
  };

  const handleOpenMedia = (src: string, type: 'image' | 'video' | 'audio', title: string) => {
    setActiveMedia({ src, type, title });
    setMediaModalOpen(true);
  };

  const getIcon = () => {
    switch (node.type) {
      // 1. SUBJECTS
      case NodeType.ENTITY: return <User className="w-4 h-4 text-cyan-400" />;
      case NodeType.ORGANIZATION: return <Building2 className="w-4 h-4 text-orange-400" />;
      case NodeType.THREAT_ACTOR: return <Ghost className="w-4 h-4 text-red-500" />;
      case NodeType.IDENTITY: return <Fingerprint className="w-4 h-4 text-purple-400" />;
      case NodeType.MILITARY_UNIT: return <Tent className="w-4 h-4 text-green-600" />;
      case NodeType.GOV_AGENCY: return <Landmark className="w-4 h-4 text-yellow-500" />;

      // 2. NETWORK
      case NodeType.IP_ADDRESS: return <Server className="w-4 h-4 text-emerald-400" />;
      case NodeType.MAC_ADDRESS: return <Network className="w-4 h-4 text-indigo-300" />;
      case NodeType.DOMAIN: return <Globe className="w-4 h-4 text-blue-400" />;
      case NodeType.URL: return <Link2 className="w-4 h-4 text-blue-300" />;
      case NodeType.SERVER: return <Database className="w-4 h-4 text-slate-300" />;
      case NodeType.C2_SERVER: return <Router className="w-4 h-4 text-red-500" />;
      case NodeType.BOTNET: return <Network className="w-4 h-4 text-red-400" />;
      case NodeType.CLOUD_SERVICE: return <Cloud className="w-4 h-4 text-sky-300" />;
      case NodeType.WIFI: return <Wifi className="w-4 h-4 text-amber-400" />;
      case NodeType.SSL_CERT: return <Lock className="w-4 h-4 text-yellow-200" />;
      case NodeType.ASN: return <Network className="w-4 h-4 text-indigo-400" />;
      case NodeType.INFRASTRUCTURE: return <GitBranch className="w-4 h-4 text-slate-400" />;
      case NodeType.NETWORK_TRAFFIC: return <Waves className="w-4 h-4 text-blue-500" />;
      case NodeType.PROCESS: return <Play className="w-4 h-4 text-green-400" />;
      case NodeType.MUTEX: return <Key className="w-4 h-4 text-orange-400" />;
      case NodeType.REGISTRY_KEY: return <Settings className="w-4 h-4 text-purple-400" />;
      case NodeType.DIRECTORY: return <Folder className="w-4 h-4 text-yellow-400" />;
      case NodeType.USER_ACCOUNT: return <UserCog className="w-4 h-4 text-cyan-400" />;
      case NodeType.X509_CERTIFICATE: return <Award className="w-4 h-4 text-indigo-400" />;

      // 3. COMMUNICATION
      case NodeType.EMAIL: return <AtSign className="w-4 h-4 text-orange-300" />;
      case NodeType.PHONE_NUMBER: return <Smartphone className="w-4 h-4 text-green-400" />;
      case NodeType.SOCIAL_PROFILE: return <Users className="w-4 h-4 text-pink-400" />;
      case NodeType.MESSAGING_ID: return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case NodeType.FORUM_ACCOUNT: return <User className="w-4 h-4 text-slate-500" />;
      case NodeType.APP: return <AppWindow className="w-4 h-4 text-teal-400" />;
      case NodeType.BLOG: return <FileText className="w-4 h-4 text-blue-400" />;
      case NodeType.PODCAST: return <Podcast className="w-4 h-4 text-purple-400" />;
      case NodeType.LIVESTREAM: return <Cast className="w-4 h-4 text-red-400" />;
      case NodeType.FORUM_POST: return <MessageSquare className="w-4 h-4 text-slate-400" />;

      // 4. FINANCIAL
      case NodeType.CRYPTO_WALLET: return <Bitcoin className="w-4 h-4 text-amber-500" />;
      case NodeType.BANK_ACCOUNT: return <Landmark className="w-4 h-4 text-emerald-600" />;
      case NodeType.CREDIT_CARD: return <CreditCard className="w-4 h-4 text-blue-500" />;
      case NodeType.TRANSACTION: return <Activity className="w-4 h-4 text-slate-400" />;
      case NodeType.INSURANCE_POLICY: return <ShieldIcon className="w-4 h-4 text-blue-600" />;
      case NodeType.PROPERTY: return <Home className="w-4 h-4 text-orange-500" />;
      case NodeType.COMPANY_REGISTRATION: return <Building2 className="w-4 h-4 text-purple-500" />;
      case NodeType.PATENT: return <Scroll className="w-4 h-4 text-teal-500" />;
      case NodeType.TAX_RECORD: return <FileText className="w-4 h-4 text-green-600" />;

      // 5. PHYSICAL
      case NodeType.GEO_LOCATION: return <MapPin className="w-4 h-4 text-red-500" />;
      case NodeType.FACILITY: return <Building2 className="w-4 h-4 text-slate-400" />;
      case NodeType.VEHICLE: return <Car className="w-4 h-4 text-yellow-400" />;
      case NodeType.DEVICE: return <Tablet className="w-4 h-4 text-slate-300" />;
      case NodeType.WEAPON: return <Sword className="w-4 h-4 text-red-700" />;
      case NodeType.SIM_CARD: return <Cpu className="w-4 h-4 text-yellow-600" />;
      case NodeType.LICENSE_PLATE: return <Car className="w-4 h-4 text-blue-400" />;
      case NodeType.BIOMETRIC: return <Fingerprint className="w-4 h-4 text-purple-500" />;
      case NodeType.DRONE: return <Plane className="w-4 h-4 text-sky-500" />;
      case NodeType.SATELLITE_IMAGE: return <Satellite className="w-4 h-4 text-indigo-500" />;
      case NodeType.CCTV_FOOTAGE: return <Camera className="w-4 h-4 text-slate-500" />;

      // 6. TRAVEL & LOGISTICS (NEW)
      case NodeType.FLIGHT: return <Plane className="w-4 h-4 text-sky-400" />;
      case NodeType.HOTEL: return <BedDouble className="w-4 h-4 text-indigo-400" />;
      case NodeType.SHIPPING: return <Ship className="w-4 h-4 text-blue-600" />;
      case NodeType.PASSPORT: return <IdCard className="w-4 h-4 text-rose-400" />;
      case NodeType.VISA: return <Ticket className="w-4 h-4 text-rose-300" />;

      // 7. CONTENT & MEDIA
      case NodeType.IMAGE: return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case NodeType.VIDEO: return <Video className="w-4 h-4 text-pink-400" />;
      case NodeType.AUDIO: return <Mic className="w-4 h-4 text-pink-400" />;
      case NodeType.DOCUMENT: return <File className="w-4 h-4 text-slate-300" />;
      case NodeType.SOCIAL_POST: return <MessageSquare className="w-4 h-4 text-blue-300" />;
      case NodeType.NEWS_ARTICLE: return <Newspaper className="w-4 h-4 text-slate-200" />;
      case NodeType.DARKWEB_SITE: return <div className="w-4 h-4 text-green-500 font-bold flex items-center justify-center">.o</div>;
      case NodeType.CODE_SNIPPET: return <Code className="w-4 h-4 text-yellow-300" />;
      case NodeType.FILE_HASH: return <Hash className="w-4 h-4 text-slate-500" />;
      case NodeType.EXPLOIT: return <Bomb className="w-4 h-4 text-red-600" />;
      case NodeType.PHISHING_KIT: return <Fish className="w-4 h-4 text-orange-500" />;
      case NodeType.SCREENSHOT: return <Monitor className="w-4 h-4 text-blue-400" />;
      case NodeType.METADATA: return <FileArchive className="w-4 h-4 text-slate-400" />;
      case NodeType.QR_CODE: return <QrCode className="w-4 h-4 text-purple-500" />;
      case NodeType.BARCODE: return <Barcode className="w-4 h-4 text-slate-500" />;
      case NodeType.ARTIFACT: return <Package className="w-4 h-4 text-amber-500" />;
      case NodeType.PDF_DOCUMENT: return <FileText className="w-4 h-4 text-red-400" />;
      case NodeType.SPREADSHEET: return <FileSpreadsheet className="w-4 h-4 text-green-400" />;

      // 8. INTELLIGENCE COLLECTION (NEW)
      case NodeType.SOURCE_HUMINT: return <User className="w-4 h-4 text-orange-500" />;
      case NodeType.SOURCE_SIGINT: return <Radio className="w-4 h-4 text-green-500" />;
      case NodeType.SOURCE_IMINT: return <Satellite className="w-4 h-4 text-blue-300" />;
      case NodeType.SOURCE_GEOINT: return <MapPin className="w-4 h-4 text-emerald-500" />;
      case NodeType.SOURCE_OSINT: return <Globe className="w-4 h-4 text-cyan-300" />;
      case NodeType.SOURCE_MASINT: return <Activity className="w-4 h-4 text-purple-500" />;

      // 9. INTEL & ANALYSIS
      case NodeType.REPORT: return <FileText className="w-4 h-4 text-yellow-400" />;
      case NodeType.NOTE: return <FileText className="w-4 h-4 text-slate-400" />;
      case NodeType.EVENT: return <Calendar className="w-4 h-4 text-orange-500" />;
      case NodeType.CAMPAIGN: return <Flag className="w-4 h-4 text-red-500" />;
      case NodeType.MALWARE: return <Bug className="w-4 h-4 text-red-600" />;
      case NodeType.VULNERABILITY: return <ShieldAlert className="w-4 h-4 text-orange-600" />;
      case NodeType.TOPIC: return <Hash className="w-4 h-4 text-pink-500" />;
      case NodeType.HYPOTHESIS: return <Lightbulb className="w-4 h-4 text-yellow-300" />;
      case NodeType.LEGAL_CASE: return <Gavel className="w-4 h-4 text-slate-200" />;
      case NodeType.ATTACK_PATTERN: return <Target className="w-4 h-4 text-red-500" />;
      case NodeType.INTRUSION_SET: return <Shield className="w-4 h-4 text-orange-500" />;
      case NodeType.MALWARE_ANALYSIS: return <Microscope className="w-4 h-4 text-purple-500" />;
      case NodeType.COURSE_OF_ACTION: return <ShieldIcon className="w-4 h-4 text-green-500" />;
      case NodeType.INDICATOR: return <Gauge className="w-4 h-4 text-cyan-500" />;
      case NodeType.TOOL_SOFTWARE: return <Wrench className="w-4 h-4 text-slate-400" />;
      case NodeType.OPINION: return <Eye className="w-4 h-4 text-indigo-400" />;
      case NodeType.OBSERVED_DATA: return <FileCheck className="w-4 h-4 text-teal-400" />;
      case NodeType.COURT_RECORD: return <Gavel className="w-4 h-4 text-amber-500" />;
      case NodeType.EMPLOYMENT_RECORD: return <Briefcase className="w-4 h-4 text-blue-500" />;
      case NodeType.EDUCATION_RECORD: return <GraduationCap className="w-4 h-4 text-purple-500" />;
      case NodeType.MEDICAL_RECORD: return <Heart className="w-4 h-4 text-red-400" />;

      // 10. OPS
      case NodeType.SEARCH_QUERY: return <Search className="w-4 h-4 text-teal-400" />;
      case NodeType.DATA_SOURCE: return <DatabaseZap className="w-4 h-4 text-indigo-400" />;
      case NodeType.LEAK_DUMP: return <Archive className="w-4 h-4 text-amber-600" />;
      case NodeType.SENSOR: return <Radio className="w-4 h-4 text-green-500" />;

      default: return <Hash className="w-4 h-4 text-slate-400" />;
    }
  };

  const isProcessing = node.status === 'PROCESSING';

  // Build border color class based on state priority: Selected > Processing > Key Node > Community > Default
  const getCommunityBorderClass = () => {
    if (communityId === undefined) return '';
    return getCommunityColorClass(communityId);
  };

  const borderColor = isSelected
    ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-1 ring-cyan-500'
    : isProcessing
        ? 'border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)] animate-pulse'
        : isKeyNode
            ? `${getCommunityBorderClass() || 'border-amber-500'} shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/50`
            : communityId !== undefined
                ? `${getCommunityBorderClass()} border-2`
                : 'border-slate-700 hover:border-slate-500';

  // Status indicator color
  const getStatusColor = () => {
      if (node.status === 'NEW') return 'bg-blue-500';
      if (node.status === 'PROCESSED') return 'bg-green-500';
      if (node.status === 'ERROR') return 'bg-red-500';
      if (node.status === 'PROCESSING') return 'bg-cyan-400 animate-ping';
      return 'bg-slate-600';
  }

  // Filter out empty values for preview
  const populatedData = Object.entries(node.data || {}).filter(([_, v]) => String(v).trim() !== "");

  // Extract coordinate field separately (to ensure it's always shown if present)
  const coordEntry = populatedData.find(([k, v]) => {
    const isCoordField = COORDINATE_FIELDS.some(f => k.toLowerCase().includes(f.toLowerCase()));
    return isCoordField && parseCoordinates(String(v)) !== null;
  });
  const coordData = coordEntry ? parseCoordinates(String(coordEntry[1])) : null;

  // Extract address field (for map search when no coordinates)
  const addressEntry = populatedData.find(([k, v]) => {
    const isAddressField = ADDRESS_FIELDS.some(f => k.toLowerCase().includes(f.toLowerCase()));
    return isAddressField && String(v).trim().length > 0;
  });

  // Filter out coordinate and address fields from regular display
  const nonCoordData = populatedData.filter(([k]) => {
    if (coordEntry && k === coordEntry[0]) return false;
    if (addressEntry && k === addressEntry[0]) return false;
    return true;
  });

  return (
    <div
      data-node-id={node.id}
      className={`absolute rounded-lg bg-[#161b26]/95 border ${borderColor} text-slate-200 flex flex-col transition-all duration-200`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: 280, // Slightly wider for media
        zIndex: isSelected ? 100 : 10,
        backdropFilter: 'blur(8px)',
        touchAction: 'none'
      }}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
    >
      {/* Connection Point */}
      <div 
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 hover:bg-cyan-600 border border-slate-600 rounded-full flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 hover:opacity-100 transition-all z-50 shadow-lg"
        onPointerDown={onStartConnect}
      >
         <Link2 className="w-3 h-3 text-white" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-800/50">
        <div className="p-1.5 bg-slate-900 rounded border border-slate-800 relative">
           {isProcessing ? <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" /> : getIcon()}
           {/* Key Node Badge */}
           {isKeyNode && (
             <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center shadow-lg" title="核心节点">
               <Star className="w-2 h-2 text-black fill-black" />
             </div>
           )}
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
               <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor()}`}></div>
               {isProcessing ? 'PROCESSING...' : node.type}
               {/* Community Badge */}
               {communityId !== undefined && (
                 <span className={`ml-1 px-1 py-0.5 rounded text-[8px] bg-slate-800 ${getCommunityBorderClass()} border`}>
                   C{communityId + 1}
                 </span>
               )}
            </div>
            <div className="font-bold text-xs truncate text-white font-mono" title={node.title}>
               {node.title}
            </div>
        </div>
      </div>

      {/* Data Preview Body */}
      <div className="p-3 space-y-2">
         {/* Summary Text */}
         <div className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">
            {node.content}
         </div>
         
         {/* Map Preview (shown first if coordinates exist) */}
         {coordData && coordEntry && (
            <div className="bg-black/20 rounded p-2 border border-white/5">
                <div className="flex flex-col text-[9px] font-mono">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                       <span>{coordEntry[0]}:</span>
                       <MapPin className="w-3 h-3 text-red-500" />
                    </div>
                    <MiniMap
                      lat={coordData.lat}
                      lng={coordData.lng}
                      label={node.title}
                      onExpand={() => handleOpenMap(coordData)}
                    />
                </div>
            </div>
         )}

         {/* Address Preview with Map Search (shown when no coordinates but address exists) */}
         {!coordData && addressEntry && (
            <div className="bg-black/20 rounded p-2 border border-white/5">
                <div className="flex flex-col text-[9px] font-mono">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                       <span>{addressEntry[0]}:</span>
                       <MapPin className="w-3 h-3 text-red-500" />
                    </div>
                    <div className="text-[10px] text-slate-300 mb-2 break-words">
                       {String(addressEntry[1])}
                    </div>
                    <button
                       onClick={(e) => {
                         e.stopPropagation();
                         const address = encodeURIComponent(String(addressEntry[1]));
                         window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                       }}
                       onPointerDown={(e) => e.stopPropagation()}
                       className="flex items-center justify-center gap-1 w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-[9px] text-cyan-400 transition-colors"
                    >
                       <MapPin className="w-3 h-3" />
                       在地图中查看
                    </button>
                </div>
            </div>
         )}

         {/* Key Data Points Preview (Only shown if populated) */}
         {nonCoordData.length > 0 && (
            <div className="bg-black/20 rounded p-2 border border-white/5 space-y-1">
                {nonCoordData.slice(0, 3).map(([k, v]) => {
                   const strVal = String(v);
                   const isFile = strVal.startsWith('data:');
                   const isImage = strVal.startsWith('data:image');
                   const isVideo = strVal.startsWith('data:video');
                   const isAudio = strVal.startsWith('data:audio');

                   if (isFile) {
                       return (
                           <div key={k} className="flex flex-col text-[9px] font-mono mt-2 mb-1">
                               <div className="flex items-center justify-between text-slate-500 mb-1">
                                  <span>{k}:</span>
                                  {isImage && <ImageIcon className="w-3 h-3" />}
                                  {isVideo && <Video className="w-3 h-3" />}
                                  {isAudio && <Music className="w-3 h-3" />}
                               </div>

                               {isImage ? (
                                   <div
                                     className="relative group cursor-pointer"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleOpenMedia(strVal, 'image', `${node.title} - ${k}`);
                                     }}
                                     onPointerDown={(e) => e.stopPropagation()}
                                   >
                                     <img src={strVal} className="w-full h-32 object-cover rounded border border-slate-700" alt="evidence" />
                                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                       <span className="opacity-0 group-hover:opacity-100 text-white text-[10px] bg-slate-900/80 px-2 py-1 rounded">点击放大</span>
                                     </div>
                                   </div>
                               ) : isVideo ? (
                                   <div
                                     className="relative group cursor-pointer"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleOpenMedia(strVal, 'video', `${node.title} - ${k}`);
                                     }}
                                     onPointerDown={(e) => e.stopPropagation()}
                                   >
                                     <video muted className="w-full rounded border border-slate-700 bg-black pointer-events-none" src={strVal} />
                                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                       <span className="opacity-0 group-hover:opacity-100 text-white text-[10px] bg-slate-900/80 px-2 py-1 rounded">点击播放</span>
                                     </div>
                                   </div>
                               ) : isAudio ? (
                                   <div
                                     className="relative group cursor-pointer"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleOpenMedia(strVal, 'audio', `${node.title} - ${k}`);
                                     }}
                                     onPointerDown={(e) => e.stopPropagation()}
                                   >
                                     <div className="flex items-center gap-2 p-2 bg-slate-900 rounded border border-slate-800">
                                       <Music className="w-4 h-4 text-pink-400" />
                                       <span className="text-slate-400">音频文件</span>
                                       <span className="text-cyan-500 text-[10px] ml-auto">点击播放</span>
                                     </div>
                                   </div>
                               ) : (
                                   <div className="flex items-center gap-1 text-cyan-500 p-1 bg-slate-900 rounded border border-slate-800">
                                       <Paperclip className="w-3 h-3" /> <span className="italic">Binary File</span>
                                   </div>
                               )}
                           </div>
                       )
                   }

                   return (
                        <div key={k} className="flex justify-between text-[9px] font-mono">
                            <span className="text-slate-500">{k}:</span>
                            <span className="text-cyan-600 truncate max-w-[140px]">{strVal}</span>
                        </div>
                   );
                })}
            </div>
         )}
      </div>

      {/* Footer / Rating & Centrality */}
      {(node.rating || centrality !== undefined) && (
        <div className="px-3 py-1.5 border-t border-slate-800/50 bg-black/20 flex justify-between items-center">
           {node.rating ? (
             <>
               <span className="text-[9px] text-slate-600">Source Rating</span>
               <div className="flex items-center gap-2">
                 {centrality !== undefined && (
                   <span className="text-[9px] font-mono px-1 rounded border border-purple-800 text-purple-400 bg-purple-900/20" title={`中心性得分: ${(centrality * 100).toFixed(0)}%`}>
                     {(centrality * 100).toFixed(0)}%
                   </span>
                 )}
                 <span className={`text-[9px] font-mono px-1 rounded border ${
                     node.rating.reliability === 'A' ? 'border-green-800 text-green-400 bg-green-900/20' : 'border-slate-700 text-slate-400'
                 }`}>
                     {node.rating.reliability}{node.rating.credibility}
                 </span>
               </div>
             </>
           ) : centrality !== undefined && (
             <>
               <span className="text-[9px] text-slate-600">中心性 (Centrality)</span>
               <span className="text-[9px] font-mono px-1 rounded border border-purple-800 text-purple-400 bg-purple-900/20">
                 {(centrality * 100).toFixed(0)}%
               </span>
             </>
           )}
        </div>
      )}

      {/* Map Modal */}
      {activeCoords && (
        <MapModal
          isOpen={mapModalOpen}
          onClose={() => setMapModalOpen(false)}
          lat={activeCoords.lat}
          lng={activeCoords.lng}
          title={node.title}
          address={node.data?.['详细地址'] as string}
        />
      )}

      {/* Media Modal */}
      {activeMedia && (
        <MediaModal
          isOpen={mediaModalOpen}
          onClose={() => setMediaModalOpen(false)}
          src={activeMedia.src}
          type={activeMedia.type}
          title={activeMedia.title}
        />
      )}
    </div>
  );
};