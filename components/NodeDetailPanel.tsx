import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, MapPin, ExternalLink } from 'lucide-react';
import { IntelNode } from '../types';
import { MediaModal } from './MediaModal';

interface NodeDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  node: IntelNode | null;
}

// 解析坐标字符串
const parseCoordinates = (value: string): { lat: number; lng: number } | null => {
  if (!value || typeof value !== 'string') return null;
  const match = value.trim().match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
};

// 坐标相关字段
const COORDINATE_FIELDS = ['经纬度', '坐标', 'coordinates', 'latlng', 'location'];
// 地址相关字段
const ADDRESS_FIELDS = ['详细地址', '地址', 'address', '位置', '总部地址', '注册地址', '物理位置', '开户行地址'];

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  isOpen,
  onClose,
  node
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mediaModal, setMediaModal] = useState<{ src: string; type: 'image' | 'video' | 'audio'; title: string } | null>(null);

  if (!isOpen || !node) return null;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 过滤空值
  const dataEntries = Object.entries(node.data || {}).filter(([_, v]) => String(v).trim() !== "");

  // 渲染字段值
  const renderValue = (key: string, value: any) => {
    const strVal = String(value);

    // 检测文件类型
    const isImage = strVal.startsWith('data:image');
    const isVideo = strVal.startsWith('data:video');
    const isAudio = strVal.startsWith('data:audio');

    // 检测坐标字段
    const isCoordField = COORDINATE_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()));
    const coords = isCoordField ? parseCoordinates(strVal) : null;

    // 检测地址字段
    const isAddressField = ADDRESS_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()));

    // 图片
    if (isImage) {
      return (
        <div className="mt-2">
          <img
            src={strVal}
            alt={key}
            className="max-w-full max-h-64 object-contain rounded-lg border border-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setMediaModal({ src: strVal, type: 'image', title: `${node.title} - ${key}` })}
          />
          <p className="text-xs text-slate-500 mt-1">点击查看大图</p>
        </div>
      );
    }

    // 视频 - 直接嵌入播放器
    if (isVideo) {
      return (
        <div className="mt-2">
          <video
            src={strVal}
            controls
            className="max-w-full max-h-64 rounded-lg border border-slate-700 bg-black"
          />
        </div>
      );
    }

    // 音频 - 直接嵌入播放器
    if (isAudio) {
      return (
        <div className="mt-2">
          <audio src={strVal} controls className="w-full" />
        </div>
      );
    }

    // 坐标 - 显示地图
    if (coords) {
      return (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-2">
            <code className="text-cyan-400 bg-slate-800 px-2 py-1 rounded text-sm">{strVal}</code>
            <button
              onClick={() => handleCopy(key, strVal)}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
              title="复制"
            >
              {copiedKey === key ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.02},${coords.lat - 0.015},${coords.lng + 0.02},${coords.lat + 0.015}&layer=mapnik&marker=${coords.lat},${coords.lng}`}
            className="w-full h-52 rounded-lg border border-slate-700"
            style={{ border: 0 }}
          />
          <a
            href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=15/${coords.lat}/${coords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 mt-2"
          >
            <ExternalLink className="w-4 h-4" />
            在地图中打开
          </a>
        </div>
      );
    }

    // 地址 - 显示地图搜索链接
    if (isAddressField && strVal.length > 0) {
      return (
        <div className="mt-1">
          <div className="flex items-start gap-2">
            <span className="text-slate-200 whitespace-pre-wrap break-words flex-1">{strVal}</span>
            <button
              onClick={() => handleCopy(key, strVal)}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
              title="复制"
            >
              {copiedKey === key ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(strVal)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 mt-2"
          >
            <MapPin className="w-4 h-4" />
            在地图中搜索
          </a>
        </div>
      );
    }

    // 普通文本
    return (
      <div className="flex items-start gap-2 mt-1">
        <span className="text-slate-200 whitespace-pre-wrap break-words flex-1">{strVal}</span>
        <button
          onClick={() => handleCopy(key, strVal)}
          className="p-1.5 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
          title="复制"
        >
          {copiedKey === key ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
        </button>
      </div>
    );
  };

  const panelContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 面板 */}
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-cyan-500 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-900">
              {node.type}
            </span>
            <span className="font-bold text-white text-lg truncate max-w-md" title={node.title}>
              {node.title}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="关闭"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 摘要 */}
          {node.content && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{node.content}</p>
            </div>
          )}

          {/* 所有字段 */}
          {dataEntries.length > 0 && (
            <div className="space-y-4">
              {dataEntries.map(([key, value]) => (
                <div key={key} className="border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
                  <div className="text-sm font-medium text-slate-500 mb-1">
                    {key}
                  </div>
                  {renderValue(key, value)}
                </div>
              ))}
            </div>
          )}

          {/* 空状态 */}
          {!node.content && dataEntries.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              暂无数据
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-500">
          <span>ID: {node.id.slice(0, 12)}...</span>
          <div className="flex items-center gap-4">
            {node.rating && (
              <span>评级: {node.rating.reliability}{node.rating.credibility}</span>
            )}
            <span>深度: {node.depth}</span>
            <span>状态: {node.status}</span>
          </div>
        </div>
      </div>

      {/* 图片放大弹窗 - 复用 MediaModal */}
      {mediaModal && (
        <MediaModal
          isOpen={true}
          onClose={() => setMediaModal(null)}
          src={mediaModal.src}
          type={mediaModal.type}
          title={mediaModal.title}
        />
      )}
    </div>
  );

  return createPortal(panelContent, document.body);
};
