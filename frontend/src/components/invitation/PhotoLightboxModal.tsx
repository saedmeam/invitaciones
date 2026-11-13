'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

export interface PhotoLightboxModalProps {
  isOpen: boolean;
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function PhotoLightboxModal({
  isOpen,
  photos,
  initialIndex = 0,
  onClose,
}: PhotoLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomLevel(1);
  }, [initialIndex, isOpen]);

  const handleNext = useCallback(() => {
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePrev = useCallback(() => {
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen || photos.length === 0) return null;

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.6 : 1));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8 select-none transition-opacity duration-300"
    >
      {/* Botón cerrar */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar visor de fotos"
        className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Controles superiores (Zoom & Contador) */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <span className="text-xs font-medium tracking-widest uppercase text-white/70 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={toggleZoom}
          aria-label="Zoom"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm"
        >
          {zoomLevel === 1 ? <ZoomIn className="h-4 w-4" /> : <ZoomOut className="h-4 w-4" />}
        </button>
      </div>

      {/* Navegación Anterior */}
      {photos.length > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Foto anterior"
          className="absolute left-3 sm:left-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Contenedor de la Imagen */}
      <div
        className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center overflow-hidden"
        onClick={toggleZoom}
      >
        <img
          src={photos[currentIndex]}
          alt={`Fotografía ${currentIndex + 1}`}
          className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-300 cursor-zoom-in"
          style={{ transform: `scale(${zoomLevel})` }}
        />
      </div>

      {/* Navegación Siguiente */}
      {photos.length > 1 && (
        <button
          type="button"
          onClick={handleNext}
          aria-label="Siguiente foto"
          className="absolute right-3 sm:right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
