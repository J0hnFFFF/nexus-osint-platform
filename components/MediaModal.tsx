import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  type: 'image' | 'video' | 'audio';
  title?: string;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  isOpen,
  onClose,
  src,
  type,
  title
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setZoom(1);
    setRotation(0);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose(e);
    }
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = src;
    link.download = title || `download.${type === 'image' ? 'png' : type === 'video' ? 'mp4' : 'mp3'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex flex-col"
      onClick={handleBackdropClick}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">{title || '媒体预览'}</span>
          {type === 'image' && (
            <span className="text-xs text-slate-400">({Math.round(zoom * 100)}%)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {type === 'image' && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-slate-700 rounded transition-colors"
                title="缩小"
              >
                <ZoomOut className="w-4 h-4 text-slate-300" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-slate-700 rounded transition-colors"
                title="放大"
              >
                <ZoomIn className="w-4 h-4 text-slate-300" />
              </button>
              <button
                onClick={handleRotate}
                className="p-2 hover:bg-slate-700 rounded transition-colors"
                title="旋转"
              >
                <RotateCw className="w-4 h-4 text-slate-300" />
              </button>
            </>
          )}
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
            title="下载"
          >
            <Download className="w-4 h-4 text-slate-300" />
          </button>
          <button
            onClick={handleClose}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
            title="关闭"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        {type === 'image' && (
          <img
            src={src}
            alt={title || 'preview'}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {type === 'video' && (
          <video
            src={src}
            controls
            autoPlay
            className="max-w-full max-h-full"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {type === 'audio' && (
          <div className="bg-slate-800 rounded-lg p-8" onClick={(e) => e.stopPropagation()}>
            <audio src={src} controls autoPlay className="w-96" />
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
