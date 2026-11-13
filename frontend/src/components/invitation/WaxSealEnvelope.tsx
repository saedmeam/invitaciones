'use client';

import React, { useState } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { EventTheme } from '@/types/invitation';

export interface WaxSealEnvelopeProps {
  partnerOneName: string;
  partnerTwoName: string;
  eventDateFormatted?: string;
  groupName?: string;
  maxGuests?: number;
  theme?: EventTheme;
  openLabel?: string;
  waxSealMonogram?: string;
  waxSealColor?: string;
  onSealBreak?: () => void;
  onOpenComplete: () => void;
}

export function WaxSealEnvelope({
  partnerOneName,
  partnerTwoName,
  eventDateFormatted,
  groupName,
  maxGuests,
  theme = 'ROMANTIC_EDITORIAL',
  openLabel = 'Toca el sello para abrir',
  waxSealMonogram,
  waxSealColor,
  onSealBreak,
  onOpenComplete,
}: WaxSealEnvelopeProps) {
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open'>('closed');
  const [sealPressed, setSealPressed] = useState(false);

  // Monograma de gala de los novios parametrizable (por defecto 'S&J')
  const rawMonogram = (waxSealMonogram && waxSealMonogram.trim()) || 'S&J';
  const monogramParts = rawMonogram.includes('&')
    ? rawMonogram.split('&').map((p) => p.trim())
    : [rawMonogram];

  const isFlapOpen = animationState === 'opening' || animationState === 'open';
  const isCardUp = animationState === 'open';

  // Determinación del color del lacre de cera según tema o parámetro explícito
  const resolveSealColor = (): 'burgundy' | 'gold' | 'olive' | 'emerald' | 'sapphire' | 'terracotta' | 'lavender' | 'graphite' => {
    if (waxSealColor) {
      const c = waxSealColor.toLowerCase();
      if (
        c === 'burgundy' ||
        c === 'gold' ||
        c === 'olive' ||
        c === 'emerald' ||
        c === 'sapphire' ||
        c === 'terracotta' ||
        c === 'lavender' ||
        c === 'graphite'
      ) {
        return c;
      }
    }
    switch (theme) {
      case 'CLASSIC_NOCTURNE':
      case 'NOCTURNE_ROYAL':
      case 'GOLDEN_GLAMOUR':
        return 'gold';
      case 'BOTANICAL_GARDEN':
        return 'olive';
      case 'EMERALD_IMPERIAL':
        return 'emerald';
      case 'SAPPHIRE_SERENITY':
        return 'sapphire';
      case 'TERRACOTTA_SUNSET':
      case 'RUSTIC_CHIC':
        return 'terracotta';
      case 'LAVENDER_PROVENCE':
        return 'lavender';
      case 'MINIMAL_LUXURY':
        return 'graphite';
      case 'BURGUNDY_VELVET':
      case 'ROMANTIC_EDITORIAL':
      default:
        return 'burgundy';
    }
  };

  const sealColor = resolveSealColor();

  const sealColorStyles: Record<
    string,
    { bg: string; shadow: string; border: string; text: string; textShadow: string }
  > = {
    burgundy: {
      bg: 'radial-gradient(circle at 35% 32%, #b52236 0%, #7d0d1d 45%, #4f0611 80%, #290308 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.7)',
      border: '1.5px dashed rgba(255,255,255,0.35)',
      text: '#fce8ea',
      textShadow: '-1px -1px 1px rgba(255,255,255,0.35), 1px 1px 2px rgba(0,0,0,0.95)',
    },
    gold: {
      bg: 'radial-gradient(circle at 35% 32%, #fff0b3 0%, #d4af37 40%, #997318 75%, #5a4005 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.75), inset 0 -4px 6px rgba(90,64,5,0.85)',
      border: '1.5px dashed rgba(90,64,5,0.5)',
      text: '#543b04',
      textShadow: '-1px -1px 1px rgba(255,255,255,0.7), 1px 1px 2px rgba(0,0,0,0.75)',
    },
    olive: {
      bg: 'radial-gradient(circle at 35% 32%, #6b8f71 0%, #3d5a42 45%, #253928 80%, #141f16 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.7)',
      border: '1.5px dashed rgba(255,255,255,0.35)',
      text: '#e2efe4',
      textShadow: '-1px -1px 1px rgba(255,255,255,0.35), 1px 1px 2px rgba(0,0,0,0.95)',
    },
    emerald: {
      bg: 'radial-gradient(circle at 35% 32%, #10b981 0%, #065f46 45%, #04392a 80%, #021f17 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.7)',
      border: '1.5px dashed rgba(255,255,255,0.4)',
      text: '#d1fae5',
      textShadow: '-1px -1px 1px rgba(255,255,255,0.4), 1px 1px 2px rgba(0,0,0,0.95)',
    },
    sapphire: {
      bg: 'radial-gradient(circle at 35% 32%, #38bdf8 0%, #1e3a8a 45%, #0f172a 80%, #080c18 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.7)',
      border: '1.5px dashed rgba(255,255,255,0.4)',
      text: '#e0f2fe',
      textShadow: '-1px -1px 1px rgba(255,255,255,0.4), 1px 1px 2px rgba(0,0,0,0.95)',
    },
    terracotta: {
      bg: 'radial-gradient(circle at 35% 32%, #ea580c 0%, #9a3412 45%, #591d08 80%, #2f0d03 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.7)',
      border: '1.5px dashed rgba(255,255,255,0.4)',
      text: '#ffedd5',
      textShadow: '-1px -1px 1px rgba(255,255,255,0.35), 1px 1px 2px rgba(0,0,0,0.95)',
    },
    lavender: {
      bg: 'radial-gradient(circle at 35% 32%, #c084fc 0%, #7e22ce 45%, #4c1d95 80%, #260a52 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.7)',
      border: '1.5px dashed rgba(255,255,255,0.4)',
      text: '#f3e8ff',
      textShadow: '-1px -1px 1px rgba(255,255,255,0.35), 1px 1px 2px rgba(0,0,0,0.95)',
    },
    graphite: {
      bg: 'radial-gradient(circle at 35% 32%, #64748b 0%, #334155 45%, #1e293b 80%, #0f172a 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.7)',
      border: '1.5px dashed rgba(255,255,255,0.35)',
      text: '#f8fafc',
      textShadow: '-1px -1px 1px rgba(255,255,255,0.35), 1px 1px 2px rgba(0,0,0,0.95)',
    },
  };
  const currentSealStyle = sealColorStyles[sealColor] || sealColorStyles.burgundy;

  const handleSealClick = () => {
    if (animationState !== 'closed') return;
    setSealPressed(true);

    // Disparo síncrono para garantizar autoplay de audio en iOS y Android
    if (onSealBreak) {
      try {
        onSealBreak();
      } catch {
        // Silencioso
      }
    }

    setTimeout(() => {
      setAnimationState('opening');
    }, 250);

    setTimeout(() => {
      setAnimationState('open');
    }, 950);

    setTimeout(() => {
      onOpenComplete();
    }, 1850);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0f0e0d]/90 backdrop-blur-md overflow-hidden select-none">
      {/* Contenedor con perspectiva 3D */}
      <div
        className="relative w-full max-w-[440px] sm:max-w-[500px] h-[300px] sm:h-[340px]"
        style={{ perspective: '1400px' }}
      >
        {/* Cuerpo del Sobre */}
        <div
          className="relative w-full h-full rounded-2xl transition-transform duration-700 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isCardUp ? 'translateY(50px) scale(0.96)' : 'translateY(0px)',
            filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.55)) drop-shadow(0 8px 12px rgba(0,0,0,0.35))',
          }}
        >
          {/* 1. Fondo interior del sobre (cavidad interior forrada en oro/grafito) */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border border-[#d8c5aa]/40"
            style={{
              background: 'linear-gradient(145deg, #1f1d1a 0%, #2b2722 50%, #1a1714 100%)',
              boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.7)',
            }}
          >
            {/* Forro interior de lujo dorado */}
            <div
              className="absolute inset-2 rounded-xl opacity-20"
              style={{
                backgroundImage: 'radial-gradient(#d4af37 0.8px, transparent 0.8px)',
                backgroundSize: '16px 16px',
              }}
            />
          </div>

          {/* 2. Tarjeta interior de la Invitación (se desliza hacia arriba) */}
          <div
            className="absolute left-4 right-4 top-3 bottom-3 rounded-xl bg-[#faf7f2] border border-[#e5d8c3] p-5 sm:p-7 flex flex-col justify-between items-center text-center text-stone-900 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              zIndex: isFlapOpen ? 30 : 10,
              transform: isCardUp
                ? 'translateY(-68%) translateZ(40px) scale(1.02)'
                : 'translateY(0px) translateZ(0px)',
              boxShadow: isCardUp
                ? '0 30px 60px -15px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(212,175,55,0.35)'
                : '0 4px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase text-[#9e7b44] font-medium font-sans">
                <Heart className="w-2.5 h-2.5 fill-[#9e7b44]" /> Nuestra Boda
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 mt-2 leading-tight">
                {partnerOneName}
                <span className="font-script text-3xl sm:text-4xl italic text-[#b08d57] mx-2">&amp;</span>
                {partnerTwoName}
              </h2>
            </div>

            {/* Grupo Invitado */}
            {groupName && (
              <div className="w-full border-y border-[#eadecb] py-2.5 my-1">
                <p className="text-[11px] uppercase tracking-wider text-stone-500 font-sans">Invitación especial para</p>
                <p className="font-serif text-base font-semibold text-stone-800 mt-0.5 truncate">
                  {groupName}
                </p>
                {typeof maxGuests === 'number' && maxGuests > 0 && (
                  <p className="text-[11px] text-[#9e7b44] mt-0.5 font-sans font-medium">
                    {maxGuests} {maxGuests === 1 ? 'pase reservado' : 'pases reservados'}
                  </p>
                )}
              </div>
            )}

            <div className="w-full">
              {eventDateFormatted && (
                <p className="text-[11px] uppercase tracking-widest text-stone-600 font-sans">
                  {eventDateFormatted}
                </p>
              )}
              <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#b08d57] font-semibold uppercase tracking-wider font-sans">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Deslizando invitación...
              </div>
            </div>
          </div>

          {/* 3. Solapas frontales del sobre (Laterales e inferior) */}
          {/* Vértice central unificado exactamente en 50% X, 54% Y para simetría milimétrica */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
            style={{ zIndex: 25 }}
          >
            {/* Solapa Izquierda */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'polygon(0% 0%, 50% 54%, 0% 100%)',
                background: 'linear-gradient(135deg, #ede3d3 0%, #dfd3bf 100%)',
                filter: 'drop-shadow(2px 0 5px rgba(0,0,0,0.12))',
              }}
            />
            {/* Solapa Derecha */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'polygon(100% 0%, 50% 54%, 100% 100%)',
                background: 'linear-gradient(225deg, #ede3d3 0%, #dfd3bf 100%)',
                filter: 'drop-shadow(-2px 0 5px rgba(0,0,0,0.12))',
              }}
            />
            {/* Solapa Inferior */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'polygon(0% 100%, 50% 54%, 100% 100%)',
                background: 'linear-gradient(0deg, #dfd3bf 0%, #f4ece1 100%)',
                filter: 'drop-shadow(0 -3px 8px rgba(0,0,0,0.15))',
              }}
            />
          </div>

          {/* 4. Solapa Triangular Superior 3D (se abre hacia arriba con rotateX) */}
          {/* Su vértice baja exactamente al 54% de la altura total del sobre */}
          <div
            className="absolute top-0 left-0 right-0 h-[54%] rounded-t-2xl transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              transformOrigin: 'top center',
              transformStyle: 'preserve-3d',
              transform: isFlapOpen ? 'rotateX(180deg)' : 'rotateX(0deg)',
              zIndex: isFlapOpen ? 5 : 40,
            }}
          >
            {/* Cara Exterior de la Solapa (Cerrada) */}
            <div
              className="absolute inset-0 rounded-t-2xl"
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
                background: 'linear-gradient(180deg, #f7efe4 0%, #e8dcc8 70%, #dbcbb3 100%)',
                filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.22))',
                backfaceVisibility: 'hidden',
              }}
            />

            {/* Cara Interior de la Solapa (Abierta hacia arriba) */}
            <div
              className="absolute inset-0 rounded-b-2xl"
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
                background: 'linear-gradient(0deg, #2b2722 0%, #1f1d1a 100%)',
                transform: 'rotateY(180deg) rotateZ(180deg)',
                backfaceVisibility: 'hidden',
              }}
            />
          </div>

          {/* 5. Sello de Cera Táctil 3D (Wax Seal) */}
          {/* Centrado exactamente en la cúspide de los 4 pliegues (50% X, 54% Y) */}
          <button
            type="button"
            onClick={handleSealClick}
            aria-label="Toca el sello para abrir la invitación"
            className={`group absolute left-1/2 cursor-pointer transition-all duration-300 ease-out focus:outline-none ${
              sealPressed ? 'scale-90' : 'hover:scale-105 active:scale-95'
            }`}
            style={{
              top: '54%',
              zIndex: isFlapOpen ? 15 : 50,
              opacity: isCardUp ? 0 : 1,
              pointerEvents: isFlapOpen ? 'none' : 'auto',
              transform: `translate(-50%, -50%) ${isFlapOpen ? 'scale(0.8)' : 'scale(1)'}`,
            }}
          >
            {/* Halo dorado pulsante tenue */}
            {!isFlapOpen && (
              <div className="absolute -inset-4 rounded-full bg-amber-400/25 blur-lg animate-pulse" />
            )}

            {/* Medallón de cera fundida artesanal */}
            <div
              className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-all duration-200"
              style={{
                borderRadius: '50% 50% 49% 51% / 51% 49% 50% 50%',
                background: currentSealStyle.bg,
                boxShadow: currentSealStyle.shadow,
              }}
            >
              {/* Borde troquelado con puntadas artesanales */}
              <div
                className="w-12 h-12 sm:w-15 sm:h-15 rounded-full flex items-center justify-center"
                style={{
                  border: currentSealStyle.border,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.55), 0 1px 2px rgba(255,255,255,0.25)',
                }}
              >
                {/* Monograma de Novios en Relieve de Gala */}
                <span
                  className="font-serif text-lg sm:text-2xl font-bold tracking-tight select-none"
                  style={{
                    color: currentSealStyle.text,
                    textShadow: currentSealStyle.textShadow,
                  }}
                >
                  {monogramParts.length === 2 ? (
                    <>
                      <span>{monogramParts[0]}</span>
                      <span className="text-xs sm:text-sm font-light mx-0.5 italic opacity-90">&amp;</span>
                      <span>{monogramParts[1]}</span>
                    </>
                  ) : (
                    <span>{rawMonogram}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Pastilla refinada "Toca para abrir" con tipografía nupcial y microanimación */}
            {!isFlapOpen && (
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-stone-900/90 text-[#f7efe4] text-[11px] font-sans font-medium tracking-[0.2em] uppercase border border-[#b08d57]/40 shadow-xl backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:border-[#d4af37]">
                <Sparkles className="w-3 h-3 text-[#d4af37] animate-pulse" />
                <span>{openLabel}</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
