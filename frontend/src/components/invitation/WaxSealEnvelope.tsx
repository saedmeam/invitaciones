'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import {
  EventTheme,
  EnvelopeStyleType,
  EnvelopeFlapType,
  EnvelopeOpeningMode,
} from '@/types/invitation';
import { getEnvelopeStyleConfig } from '@/lib/envelopeStyles';

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
  envelopeStyle?: EnvelopeStyleType;
  envelopeFlap?: EnvelopeFlapType;
  openingMode?: EnvelopeOpeningMode;
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
  openLabel = 'Abrir Invitación',
  waxSealMonogram,
  waxSealColor,
  envelopeStyle = 'IVORY_GOLD_DECKLE',
  envelopeFlap = 'EURO_TRIANGLE',
  openingMode = 'FULLSCREEN_CURTAIN',
  onSealBreak,
  onOpenComplete,
}: WaxSealEnvelopeProps) {
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open'>('closed');
  const [sealPressed, setSealPressed] = useState(false);

  const styleConfig = getEnvelopeStyleConfig(envelopeStyle);

  // Monograma de gala de los novios (por defecto 'S&J')
  const rawMonogram = (waxSealMonogram && waxSealMonogram.trim()) || 'S&J';
  const monogramParts = rawMonogram.includes('&')
    ? rawMonogram.split('&').map((p) => p.trim())
    : [rawMonogram];

  // Determinación del color del lacre de cera según color explícito o estilo de sobre
  const resolveSealColor = ():
    | 'burgundy'
    | 'gold'
    | 'olive'
    | 'emerald'
    | 'sapphire'
    | 'terracotta'
    | 'lavender'
    | 'graphite' => {
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
    if (styleConfig.recommendedSealColor) {
      return styleConfig.recommendedSealColor;
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
      bg: 'radial-gradient(circle at 35% 32%, #b91c1c 0%, #881337 45%, #4c0519 80%, #20020a 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.7)',
      border: '1.5px dashed rgba(255,255,255,0.35)',
      text: '#fff1f2',
      textShadow: '-1px -1px 1px rgba(255,255,255,0.35), 1px 1px 2px rgba(0,0,0,0.95)',
    },
    gold: {
      bg: 'radial-gradient(circle at 35% 32%, #ffd978 0%, #d4af37 40%, #aa7c11 75%, #5a3e05 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -4px 6px rgba(0,0,0,0.7)',
      border: '1.5px dashed rgba(255,255,255,0.5)',
      text: '#3a2704',
      textShadow: '0 1px 1px rgba(255,255,255,0.6), 0 -1px 1px rgba(0,0,0,0.6)',
    },
    olive: {
      bg: 'radial-gradient(circle at 35% 32%, #65a30d 0%, #3f6212 45%, #1a2e05 80%, #0d1702 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.7)',
      border: '1.5px dashed rgba(255,255,255,0.35)',
      text: '#f7fee7',
      textShadow: '-1px -1px 1px rgba(255,255,255,0.35), 1px 1px 2px rgba(0,0,0,0.95)',
    },
    emerald: {
      bg: 'radial-gradient(circle at 35% 32%, #10b981 0%, #047857 45%, #064e3b 80%, #022c22 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.7)',
      border: '1.5px dashed rgba(255,255,255,0.35)',
      text: '#ecfdf5',
      textShadow: '-1px -1px 1px rgba(255,255,255,0.35), 1px 1px 2px rgba(0,0,0,0.95)',
    },
    sapphire: {
      bg: 'radial-gradient(circle at 35% 32%, #38bdf8 0%, #0284c7 45%, #0369a1 80%, #082f49 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.7)',
      border: '1.5px dashed rgba(255,255,255,0.35)',
      text: '#f0f9ff',
      textShadow: '-1px -1px 1px rgba(255,255,255,0.35), 1px 1px 2px rgba(0,0,0,0.95)',
    },
    terracotta: {
      bg: 'radial-gradient(circle at 35% 32%, #fb923c 0%, #c2410c 45%, #7c2d12 80%, #431407 100%)',
      shadow:
        '0 14px 28px -4px rgba(0,0,0,0.65), 0 4px 8px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.7)',
      border: '1.5px dashed rgba(255,255,255,0.35)',
      text: '#fff7ed',
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

  // Bloqueo del scroll mientras el sobre está cerrado
  useEffect(() => {
    if (animationState !== 'open') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [animationState]);

  // Manejador del clic en el sello o botón de apertura
  const handleSealClick = () => {
    if (animationState !== 'closed') return;
    setSealPressed(true);

    if (onSealBreak) {
      try {
        onSealBreak();
      } catch {
        // Silencioso
      }
    }

    if (openingMode === 'CLASSIC_3D_ENVELOPE') {
      setTimeout(() => setAnimationState('opening'), 250);
      setTimeout(() => setAnimationState('open'), 950);
      setTimeout(() => onOpenComplete(), 1850);
    } else {
      setTimeout(() => setAnimationState('opening'), 180);
      setTimeout(() => {
        setAnimationState('open');
        onOpenComplete();
      }, 1150);
    }
  };

  const isFlapOpen = animationState === 'opening' || animationState === 'open';
  const isCardUp = animationState === 'open';
  const isOpening = animationState === 'opening' || animationState === 'open';

  // Componente de Sello de Cera con Monograma & Botón de Gala
  const renderCentralSealButton = (topPosition = '50%', customLabel?: string) => (
    <div
      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-700 ease-out"
      style={{
        top: topPosition,
        zIndex: 55,
        opacity: isOpening ? 0 : 1,
        transform: isOpening
          ? 'translate(-50%, -50%) scale(1.3)'
          : 'translate(-50%, -50%) scale(1)',
        pointerEvents: isOpening ? 'none' : 'auto',
      }}
    >
      {/* Halo pulsante áureo */}
      <div
        className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full blur-2xl animate-pulse pointer-events-none"
        style={{ backgroundColor: `${styleConfig.foilColor}40` }}
      />

      <button
        type="button"
        onClick={handleSealClick}
        aria-label="Toca el sello para abrir la invitación"
        className={`group relative cursor-pointer focus:outline-none transition-all duration-300 flex flex-col items-center ${
          sealPressed ? 'scale-90' : 'hover:scale-105 active:scale-95'
        }`}
      >
        {/* Medallón 3D de Cera Realista */}
        <div
          className="relative w-18 h-18 sm:w-22 sm:h-22 md:w-24 md:h-24 flex items-center justify-center transition-transform duration-200"
          style={{
            borderRadius: '50% 50% 49% 51% / 51% 49% 50% 50%',
            background: currentSealStyle.bg,
            boxShadow: `${currentSealStyle.shadow}, 0 0 25px ${styleConfig.foilColor}45`,
          }}
        >
          {/* Borde troquelado con puntadas artesanales */}
          <div
            className="w-13 h-13 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full flex items-center justify-center"
            style={{
              border: currentSealStyle.border,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.55), 0 1px 2px rgba(255,255,255,0.25)',
            }}
          >
            <span
              className="font-serif text-lg sm:text-2xl md:text-3xl font-bold tracking-tight select-none"
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

        {/* Pastilla de Acción de Lujo "✨ Abrir Invitación" */}
        <div
          className={`mt-3 whitespace-nowrap inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full ${styleConfig.buttonStyle.bg} ${styleConfig.buttonStyle.text} text-[11px] sm:text-xs font-sans font-semibold tracking-[0.25em] uppercase border ${styleConfig.buttonStyle.border} shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${styleConfig.buttonStyle.icon} animate-pulse`} />
          <span>{customLabel || openLabel}</span>
        </div>
      </button>
    </div>
  );

  // =========================================================================
  // 1. MODO PANTALLA COMPLETA INMERSIVA (ESTILO INVITPLAN / CANVA / CORTINA)
  // Proporciones verticales reales de sobre de alta tarjetería
  // =========================================================================
  if (openingMode === 'FULLSCREEN_CURTAIN') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl overflow-hidden select-none pointer-events-auto">
        {/* Contenedor vertical de sobre con proporciones de gala */}
        <div
          className="relative w-full sm:max-w-[480px] md:max-w-[520px] h-full sm:h-[94vh] sm:max-h-[760px] sm:rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-700 border-0 sm:border"
          style={{
            borderColor: `${styleConfig.foilColor}50`,
            background: styleConfig.linerBackground,
          }}
        >
          {/* Forro interior del sobre visible cuando se abren las solapas */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: `url("${styleConfig.linerPatternSvg}")`,
              backgroundRepeat: 'repeat',
            }}
          />

          {/* Tarjeta interior revelada */}
          <div
            className="absolute inset-4 sm:inset-5 rounded-2xl bg-[#faf7f2] p-6 sm:p-8 flex flex-col justify-between items-center text-center shadow-inner transition-opacity duration-500"
            style={{
              border: styleConfig.cardBorder,
              opacity: isOpening ? 1 : 0.85,
            }}
          >
            <div className="absolute inset-2 border border-[#d4af37]/35 rounded-xl pointer-events-none" />
            <div>
              <span
                className="text-[10px] uppercase tracking-[0.3em] font-sans font-medium"
                style={{ color: styleConfig.cardAccentColor }}
              >
                Nuestra Boda
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900 mt-2 leading-tight">
                {partnerOneName}
                <span className="font-script text-3xl sm:text-4xl italic mx-2" style={{ color: styleConfig.cardAccentColor }}>
                  &amp;
                </span>
                {partnerTwoName}
              </h2>
            </div>
            {groupName && (
              <div className="w-full border-y border-[#eadecb] py-2.5 my-2">
                <p className="text-[11px] uppercase tracking-wider text-stone-500 font-sans">Invitación especial para</p>
                <p className="font-serif text-base font-semibold text-stone-800 truncate">{groupName}</p>
                {typeof maxGuests === 'number' && maxGuests > 0 && (
                  <p className="text-[11px] font-sans font-medium mt-0.5" style={{ color: styleConfig.cardAccentColor }}>
                    {maxGuests} {maxGuests === 1 ? 'pase reservado' : 'pases reservados'}
                  </p>
                )}
              </div>
            )}
            <div className="w-full">
              {eventDateFormatted && (
                <p className="text-[11px] uppercase tracking-widest text-stone-600 font-sans">{eventDateFormatted}</p>
              )}
            </div>
          </div>

          {/* ================= 4 SOLAPAS TRIANGULARES DE GALA ================= */}

          {/* Solapa Izquierda */}
          <div
            className="absolute inset-0 pointer-events-none transition-transform duration-[1100ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
            style={{
              zIndex: 35,
              clipPath: 'polygon(0% 0%, 50% 50%, 0% 100%)',
              background: styleConfig.leftFlapGradient,
              transform: isOpening ? 'translateX(-115%)' : 'translateX(0%)',
              filter: 'drop-shadow(6px 0 12px rgba(0,0,0,0.25))',
            }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="50" y2="50" stroke={styleConfig.foilColor} strokeWidth="1.2" strokeOpacity="0.75" />
              <line x1="50" y1="50" x2="0" y2="100" stroke={styleConfig.foilColor} strokeWidth="1.2" strokeOpacity="0.75" />
            </svg>
          </div>

          {/* Solapa Derecha */}
          <div
            className="absolute inset-0 pointer-events-none transition-transform duration-[1100ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
            style={{
              zIndex: 35,
              clipPath: 'polygon(100% 0%, 50% 50%, 100% 100%)',
              background: styleConfig.rightFlapGradient,
              transform: isOpening ? 'translateX(115%)' : 'translateX(0%)',
              filter: 'drop-shadow(-6px 0 12px rgba(0,0,0,0.25))',
            }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="100" y1="0" x2="50" y2="50" stroke={styleConfig.foilColor} strokeWidth="1.2" strokeOpacity="0.75" />
              <line x1="50" y1="50" x2="100" y2="100" stroke={styleConfig.foilColor} strokeWidth="1.2" strokeOpacity="0.75" />
            </svg>
          </div>

          {/* Solapa Inferior */}
          <div
            className="absolute inset-0 pointer-events-none transition-transform duration-[1100ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
            style={{
              zIndex: 40,
              clipPath: 'polygon(0% 100%, 100% 100%, 50% 48%)',
              background: styleConfig.bottomFlapGradient,
              transform: isOpening ? 'translateY(115%)' : 'translateY(0%)',
              filter: 'drop-shadow(0 -8px 18px rgba(0,0,0,0.3))',
            }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="100" x2="50" y2="48" stroke={styleConfig.foilColor} strokeWidth="1.4" strokeOpacity="0.85" />
              <line x1="50" y1="48" x2="100" y2="100" stroke={styleConfig.foilColor} strokeWidth="1.4" strokeOpacity="0.85" />
            </svg>

            {/* Contenido inferior: Pase familiar con margen amplio respecto al centro */}
            <div className="absolute bottom-6 sm:bottom-10 left-4 right-4 text-center flex flex-col items-center">
              {groupName ? (
                <div
                  className="px-5 py-2.5 rounded-xl max-w-xs backdrop-blur-sm shadow-xs"
                  style={{
                    border: `1px solid ${styleConfig.foilColor}35`,
                    background: 'rgba(0,0,0,0.25)',
                  }}
                >
                  <p className="text-[10px] uppercase tracking-[0.25em] font-sans" style={{ color: styleConfig.foilColor }}>
                    Invitación especial para
                  </p>
                  <p className="font-serif text-sm sm:text-base font-semibold text-white mt-0.5 truncate">
                    {groupName}
                  </p>
                  {typeof maxGuests === 'number' && maxGuests > 0 && (
                    <p className="text-[11px] font-sans font-medium mt-0.5" style={{ color: styleConfig.foilColor }}>
                      {maxGuests} {maxGuests === 1 ? 'pase reservado' : 'pases reservados'}
                    </p>
                  )}
                </div>
              ) : (
                <p className="font-serif italic text-xs sm:text-sm opacity-80 text-white max-w-xs">
                  &ldquo;El amor no mira con los ojos, sino con el alma.&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Solapa Superior (Top Flap Triangular V-Cut) */}
          <div
            className="absolute inset-0 pointer-events-none transition-transform duration-[1100ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
            style={{
              zIndex: 45,
              clipPath: 'polygon(0% 0%, 100% 0%, 50% 54%)',
              background: styleConfig.topFlapGradient,
              transform: isOpening ? 'translateY(-115%)' : 'translateY(0%)',
              filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.35))',
            }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="50" y2="54" stroke={styleConfig.foilColor} strokeWidth="1.6" strokeOpacity="0.95" />
              <line x1="50" y1="54" x2="100" y2="0" stroke={styleConfig.foilColor} strokeWidth="1.6" strokeOpacity="0.95" />
            </svg>

            {/* Contenido Superior: Nombres y Encabezado con amplio espacio hacia el sello */}
            <div className="absolute top-4 sm:top-6 left-4 right-4 text-center flex flex-col items-center">
              <span
                className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-sans font-medium px-3.5 py-0.5 rounded-full backdrop-blur-sm"
                style={{
                  color: styleConfig.foilColor,
                  border: `1px solid ${styleConfig.foilColor}40`,
                  background: 'rgba(0,0,0,0.25)',
                }}
              >
                <Heart className="w-2.5 h-2.5 fill-current" /> Nuestra Boda
              </span>

              <h1
                className="font-serif text-lg sm:text-xl font-normal mt-2 tracking-tight text-white drop-shadow-sm leading-snug max-w-xs"
              >
                {partnerOneName}
                <span className="font-script text-xl sm:text-2xl italic mx-1.5" style={{ color: styleConfig.foilColor }}>
                  &amp;
                </span>
                {partnerTwoName}
              </h1>
            </div>
          </div>

          {/* Sello de Cera Central (Exactamente en la punta del V-Cut a 54%) */}
          {renderCentralSealButton('54%')}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. MODO DÍPTICO IMPERIAL (ROYAL GATEFOLD / PUERTAS FRANCESAS)
  // =========================================================================
  if (openingMode === 'ROYAL_GATEFOLD') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl overflow-hidden select-none pointer-events-auto">
        <div
          className="relative w-full sm:max-w-[480px] md:max-w-[520px] h-full sm:h-[94vh] sm:max-h-[760px] sm:rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.85)] overflow-hidden border-0 sm:border"
          style={{
            borderColor: `${styleConfig.foilColor}50`,
            background: styleConfig.linerBackground,
          }}
        >
          {/* Puerta Izquierda */}
          <div
            className="absolute top-0 bottom-0 left-0 w-1/2 overflow-hidden transition-transform duration-[1100ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
            style={{
              zIndex: 45,
              transform: isOpening ? 'translateX(-105%)' : 'translateX(0%)',
              background: styleConfig.leftFlapGradient,
              boxShadow: '10px 0 25px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `url("${styleConfig.linerPatternSvg}")`,
                backgroundRepeat: 'repeat',
              }}
            />
            <div
              className="absolute top-0 bottom-0 right-0 w-[3px]"
              style={{
                background: styleConfig.foilBorderGradient,
                boxShadow: styleConfig.foilBoxShadow,
              }}
            />
            <div className="absolute top-10 sm:top-14 inset-x-0 flex flex-col items-end pr-6 sm:pr-8 text-right">
              <span
                className="text-[10px] uppercase tracking-[0.25em] font-sans font-medium"
                style={{ color: styleConfig.foilColor }}
              >
                Nuestra Boda
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-light mt-1 text-white">
                {partnerOneName}
              </h2>
            </div>
          </div>

          {/* Puerta Derecha */}
          <div
            className="absolute top-0 bottom-0 right-0 w-1/2 overflow-hidden transition-transform duration-[1100ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
            style={{
              zIndex: 45,
              transform: isOpening ? 'translateX(105%)' : 'translateX(0%)',
              background: styleConfig.rightFlapGradient,
              boxShadow: '-10px 0 25px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `url("${styleConfig.linerPatternSvg}")`,
                backgroundRepeat: 'repeat',
              }}
            />
            <div
              className="absolute top-0 bottom-0 left-0 w-[3px]"
              style={{
                background: styleConfig.foilBorderGradient,
                boxShadow: styleConfig.foilBoxShadow,
              }}
            />
            <div className="absolute top-10 sm:top-14 inset-x-0 flex flex-col items-start pl-6 sm:pl-8 text-left">
              <span className="font-script text-2xl italic" style={{ color: styleConfig.foilColor }}>
                &amp;
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-light text-white">
                {partnerTwoName}
              </h2>
            </div>
          </div>

          {renderCentralSealButton('50%')}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. MODO FLOR DE ORIGAMI (PÉTALOS EN ESPIRAL ROTACIONAL)
  // =========================================================================
  if (openingMode === 'ORIGAMI_PETAL_REVEAL') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl overflow-hidden select-none pointer-events-auto">
        <div
          className="relative w-full sm:max-w-[480px] md:max-w-[520px] h-full sm:h-[94vh] sm:max-h-[760px] sm:rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.85)] overflow-hidden border-0 sm:border"
          style={{
            borderColor: `${styleConfig.foilColor}50`,
            background: styleConfig.linerBackground,
          }}
        >
          {/* Pétalo Superior */}
          <div
            className="absolute inset-0 transition-all duration-[1100ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
            style={{
              zIndex: 44,
              clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)',
              background: styleConfig.topFlapGradient,
              transform: isOpening
                ? 'translateY(-110%) rotate(-25deg) scale(0.85)'
                : 'translateY(0%) rotate(0deg) scale(1)',
              opacity: isOpening ? 0 : 1,
            }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="50" y2="50" stroke={styleConfig.foilColor} strokeWidth="1.5" strokeOpacity="0.8" />
              <line x1="50" y1="50" x2="100" y2="0" stroke={styleConfig.foilColor} strokeWidth="1.5" strokeOpacity="0.8" />
            </svg>
            <div className="absolute top-8 left-0 right-0 text-center">
              <span
                className="text-[10px] uppercase tracking-[0.3em] font-sans font-medium px-3.5 py-1 rounded-full text-white"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${styleConfig.foilColor}40`,
                }}
              >
                Nuestra Boda
              </span>
            </div>
          </div>

          {/* Pétalo Inferior */}
          <div
            className="absolute inset-0 transition-all duration-[1100ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
            style={{
              zIndex: 44,
              clipPath: 'polygon(0% 100%, 100% 100%, 50% 50%)',
              background: styleConfig.bottomFlapGradient,
              transform: isOpening
                ? 'translateY(110%) rotate(25deg) scale(0.85)'
                : 'translateY(0%) rotate(0deg) scale(1)',
              opacity: isOpening ? 0 : 1,
            }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="100" x2="50" y2="50" stroke={styleConfig.foilColor} strokeWidth="1.5" strokeOpacity="0.8" />
              <line x1="50" y1="50" x2="100" y2="100" stroke={styleConfig.foilColor} strokeWidth="1.5" strokeOpacity="0.8" />
            </svg>
            <div className="absolute bottom-8 left-0 right-0 text-center">
              {eventDateFormatted && (
                <span
                  className="text-[10px] uppercase tracking-[0.25em] font-sans font-medium px-3.5 py-1 rounded-full text-white"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${styleConfig.foilColor}40`,
                  }}
                >
                  {eventDateFormatted}
                </span>
              )}
            </div>
          </div>

          {/* Pétalo Izquierdo */}
          <div
            className="absolute inset-0 transition-all duration-[1100ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
            style={{
              zIndex: 43,
              clipPath: 'polygon(0% 0%, 50% 50%, 0% 100%)',
              background: styleConfig.leftFlapGradient,
              transform: isOpening
                ? 'translateX(-110%) rotate(-35deg) scale(0.85)'
                : 'translateX(0%) rotate(0deg) scale(1)',
              opacity: isOpening ? 0 : 1,
            }}
          >
            <div className="absolute top-1/2 left-6 -translate-y-1/2">
              <h3 className="font-serif text-lg sm:text-xl font-light text-white">
                {partnerOneName}
              </h3>
            </div>
          </div>

          {/* Pétalo Derecho */}
          <div
            className="absolute inset-0 transition-all duration-[1100ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
            style={{
              zIndex: 43,
              clipPath: 'polygon(100% 0%, 50% 50%, 100% 100%)',
              background: styleConfig.rightFlapGradient,
              transform: isOpening
                ? 'translateX(110%) rotate(35deg) scale(0.85)'
                : 'translateX(0%) rotate(0deg) scale(1)',
              opacity: isOpening ? 0 : 1,
            }}
          >
            <div className="absolute top-1/2 right-6 -translate-y-1/2 text-right">
              <h3 className="font-serif text-lg sm:text-xl font-light text-white">
                {partnerTwoName}
              </h3>
            </div>
          </div>

          {renderCentralSealButton('50%', 'Abrir Flor Nupcial')}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. MODO ESTUCHE / FUNDA DE GALA (POCKETFOLD DESLIZANTE)
  // =========================================================================
  if (openingMode === 'HORIZONTAL_POCKET_SLIDE') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-hidden select-none pointer-events-auto">
        <div className="relative w-full max-w-[540px] h-[360px] sm:h-[400px]">
          {/* Tarjeta Interna que Desliza hacia la Derecha */}
          <div
            className="absolute inset-3 rounded-2xl bg-[#faf7f2] p-6 sm:p-8 flex flex-col justify-between items-center text-center shadow-2xl transition-all duration-[1100ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
            style={{
              zIndex: 10,
              transform: isOpening ? 'translateX(105%) scale(1.02)' : 'translateX(0%) scale(1)',
              border: styleConfig.cardBorder,
            }}
          >
            <div className="absolute inset-2 border border-[#d4af37]/35 rounded-xl pointer-events-none" />
            <span
              className="text-[10px] uppercase tracking-[0.3em] font-sans font-medium"
              style={{ color: styleConfig.cardAccentColor }}
            >
              Nuestra Boda
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
              {partnerOneName}
              <span className="font-script text-3xl italic mx-2" style={{ color: styleConfig.cardAccentColor }}>
                &amp;
              </span>
              {partnerTwoName}
            </h2>
            {eventDateFormatted && (
              <p className="text-xs uppercase tracking-widest text-stone-600 font-sans">
                {eventDateFormatted}
              </p>
            )}
          </div>

          {/* Funda Exterior que Desliza hacia la Izquierda */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transition-all duration-[1100ms] ease-[cubic-bezier(0.77,0,0.175,1)]"
            style={{
              zIndex: 20,
              transform: isOpening ? 'translateX(-105%)' : 'translateX(0%)',
              background: styleConfig.paperGradient,
              border: `2px solid ${styleConfig.foilColor}60`,
            }}
          >
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: `url("${styleConfig.linerPatternSvg}")`,
                backgroundRepeat: 'repeat',
              }}
            />
            <div
              className="absolute inset-y-0 right-0 w-2/5 border-l"
              style={{
                borderColor: `${styleConfig.foilColor}80`,
                background: styleConfig.backOfFlapGradient,
              }}
            />
            <div className="absolute inset-0 flex flex-col justify-center items-start pl-8 text-left">
              <span
                className="text-[10px] uppercase tracking-[0.3em] font-sans font-medium"
                style={{ color: styleConfig.foilColor }}
              >
                Pase de Gala
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-light mt-1 text-white">
                {partnerOneName} &amp; {partnerTwoName}
              </h3>
            </div>
          </div>

          {renderCentralSealButton('50%', 'Deslizar Tarjeta')}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. MODO SOBRE CARTA 3D ARTESANAL (TARJETA DESLIZANTE TRADICIONAL)
  // =========================================================================
  const flapGeometry = (() => {
    switch (envelopeFlap) {
      case 'BARONIAL_ROUND':
        return {
          heightPercent: '56%',
          clipPath: 'polygon(0% 0%, 100% 0%, 92% 52%, 50% 100%, 8% 52%)',
          svgPoints: '0,0 8,52 50,100 92,52 100,0',
          sealTop: '56%',
        };
      case 'DIAMOND_PEAK':
        return {
          heightPercent: '56%',
          clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
          svgPoints: '0,0 100,0 50,100',
          sealTop: '56%',
        };
      case 'ORIGAMI_CROSS':
        return {
          heightPercent: '56%',
          clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
          svgPoints: '0,0 100,0 50,100',
          sealTop: '56%',
        };
      case 'EURO_TRIANGLE':
      default:
        return {
          heightPercent: '56%',
          clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
          svgPoints: '0,0 100,0 50,100',
          sealTop: '56%',
        };
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl overflow-hidden select-none">
      <div
        className="relative w-full max-w-[460px] sm:max-w-[520px] h-[310px] sm:h-[350px]"
        style={{ perspective: '1500px' }}
      >
        <div
          className="relative w-full h-full rounded-2xl transition-transform duration-700 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isCardUp ? 'translateY(55px) scale(0.96)' : 'translateY(0px)',
            filter: 'drop-shadow(0 30px 45px rgba(0,0,0,0.65)) drop-shadow(0 10px 18px rgba(0,0,0,0.45))',
          }}
        >
          {/* Cavidad Interior */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border"
            style={{
              background: styleConfig.linerBackground,
              borderColor: `${styleConfig.foilColor}40`,
              boxShadow: 'inset 0 14px 35px rgba(0,0,0,0.85)',
            }}
          >
            <div
              className="absolute inset-2 rounded-xl"
              style={{
                backgroundImage: `url("${styleConfig.linerPatternSvg}")`,
                backgroundRepeat: 'repeat',
                opacity: 0.9,
              }}
            />
          </div>

          {/* Tarjeta interior */}
          <div
            className="absolute left-4 right-4 top-3 bottom-3 rounded-xl bg-[#faf7f2] p-5 sm:p-7 flex flex-col justify-between items-center text-center text-stone-900 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              zIndex: isFlapOpen ? 30 : 10,
              transform: isCardUp
                ? 'translateY(-68%) translateZ(40px) scale(1.02)'
                : 'translateY(0px) translateZ(0px)',
              border: styleConfig.cardBorder,
              boxShadow: isCardUp
                ? '0 30px 60px -15px rgba(0, 0, 0, 0.55), 0 0 1px 1px rgba(212,175,55,0.45)'
                : '0 4px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="absolute inset-2 border border-[#d4af37]/35 rounded-lg pointer-events-none" />
            <div>
              <span
                className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase font-medium font-sans"
                style={{ color: styleConfig.cardAccentColor }}
              >
                <Heart className="w-2.5 h-2.5 fill-current" /> Nuestra Boda
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 mt-2 leading-tight">
                {partnerOneName}
                <span className="font-script text-3xl sm:text-4xl italic mx-2" style={{ color: styleConfig.cardAccentColor }}>
                  &amp;
                </span>
                {partnerTwoName}
              </h2>
            </div>
            {groupName && (
              <div className="w-full border-y border-[#eadecb] py-2 my-1">
                <p className="text-[11px] uppercase tracking-wider text-stone-500 font-sans">Invitación para</p>
                <p className="font-serif text-base font-semibold text-stone-800 truncate">{groupName}</p>
              </div>
            )}
            <div className="w-full">
              {eventDateFormatted && (
                <p className="text-[11px] uppercase tracking-widest text-stone-600 font-sans">{eventDateFormatted}</p>
              )}
            </div>
          </div>

          {/* Solapas Frontales (Laterales e Inferior) */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden" style={{ zIndex: 25 }}>
            {/* Solapa Izquierda */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'polygon(0% 0%, 50% 56%, 0% 100%)',
                background: styleConfig.leftFlapGradient,
              }}
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="50" y2="56" stroke={styleConfig.foilColor} strokeWidth="1" strokeOpacity="0.75" />
              <line x1="50" y1="56" x2="0" y2="100" stroke={styleConfig.foilColor} strokeWidth="1" strokeOpacity="0.75" />
            </svg>

            {/* Solapa Derecha */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'polygon(100% 0%, 50% 56%, 100% 100%)',
                background: styleConfig.rightFlapGradient,
              }}
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="100" y1="0" x2="50" y2="56" stroke={styleConfig.foilColor} strokeWidth="1" strokeOpacity="0.75" />
              <line x1="50" y1="56" x2="100" y2="100" stroke={styleConfig.foilColor} strokeWidth="1" strokeOpacity="0.75" />
            </svg>

            {/* Solapa Inferior */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'polygon(0% 100%, 50% 56%, 100% 100%)',
                background: styleConfig.bottomFlapGradient,
                filter: 'drop-shadow(0 -4px 8px rgba(0,0,0,0.3))',
              }}
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="100" x2="50" y2="56" stroke={styleConfig.foilColor} strokeWidth="1.2" strokeOpacity="0.85" />
              <line x1="50" y1="56" x2="100" y2="100" stroke={styleConfig.foilColor} strokeWidth="1.2" strokeOpacity="0.85" />
            </svg>
          </div>

          {/* Solapa Superior Plegable */}
          <div
            className="absolute top-0 left-0 right-0 origin-top transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              height: flapGeometry.heightPercent,
              transformStyle: 'preserve-3d',
              zIndex: isFlapOpen ? 5 : 40,
              transform: isFlapOpen ? 'rotateX(180deg)' : 'rotateX(0deg)',
            }}
          >
            <div
              className="absolute inset-0 rounded-t-2xl overflow-hidden"
              style={{
                clipPath: flapGeometry.clipPath,
                background: styleConfig.topFlapGradient,
                backfaceVisibility: 'hidden',
              }}
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline points={flapGeometry.svgPoints} fill="none" stroke={styleConfig.foilColor} strokeWidth="1.6" />
              </svg>
            </div>
            <div
              className="absolute inset-0 rounded-b-2xl overflow-hidden"
              style={{
                clipPath: flapGeometry.clipPath,
                background: styleConfig.backOfFlapGradient,
                transform: 'rotateY(180deg) rotateZ(180deg)',
                backfaceVisibility: 'hidden',
              }}
            >
              <div
                className="absolute inset-0 opacity-80"
                style={{ backgroundImage: `url("${styleConfig.linerPatternSvg}")`, backgroundRepeat: 'repeat' }}
              />
            </div>
          </div>

          {/* Sello de Cera */}
          <button
            type="button"
            onClick={handleSealClick}
            aria-label="Toca el sello para abrir la invitación"
            className={`group absolute left-1/2 cursor-pointer transition-all duration-300 ease-out focus:outline-none ${
              sealPressed ? 'scale-90' : 'hover:scale-105 active:scale-95'
            }`}
            style={{
              top: flapGeometry.sealTop,
              zIndex: isFlapOpen ? 15 : 50,
              opacity: isCardUp ? 0 : 1,
              pointerEvents: isFlapOpen ? 'none' : 'auto',
              transform: `translate(-50%, -50%) ${isFlapOpen ? 'scale(0.8)' : 'scale(1)'}`,
            }}
          >
            <div
              className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center"
              style={{
                borderRadius: '50% 50% 49% 51% / 51% 49% 50% 50%',
                background: currentSealStyle.bg,
                boxShadow: `${currentSealStyle.shadow}, 0 0 20px ${styleConfig.foilColor}30`,
              }}
            >
              <div className="w-12 h-12 sm:w-15 sm:h-15 rounded-full flex items-center justify-center" style={{ border: currentSealStyle.border }}>
                <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-white select-none">
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

            {!isFlapOpen && (
              <div
                className={`absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap inline-flex items-center gap-2 px-5 py-2 rounded-full ${styleConfig.buttonStyle.bg} ${styleConfig.buttonStyle.text} text-[11px] font-sans font-semibold tracking-[0.22em] uppercase border ${styleConfig.buttonStyle.border} shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:scale-105`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${styleConfig.buttonStyle.icon} animate-pulse`} />
                <span>{openLabel}</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
