'use client';

import React, { useState } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { EventTheme, EnvelopeStyleType, EnvelopeFlapType } from '@/types/invitation';
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
  envelopeStyle = 'IVORY_GOLD_DECKLE',
  envelopeFlap = 'EURO_TRIANGLE',
  onSealBreak,
  onOpenComplete,
}: WaxSealEnvelopeProps) {
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open'>('closed');
  const [sealPressed, setSealPressed] = useState(false);

  const styleConfig = getEnvelopeStyleConfig(envelopeStyle);

  // Monograma de gala de los novios parametrizable (por defecto 'S&J')
  const rawMonogram = (waxSealMonogram && waxSealMonogram.trim()) || 'S&J';
  const monogramParts = rawMonogram.includes('&')
    ? rawMonogram.split('&').map((p) => p.trim())
    : [rawMonogram];

  const isFlapOpen = animationState === 'opening' || animationState === 'open';
  const isCardUp = animationState === 'open';

  // Determinación del color del lacre de cera según color explícito o estilo de sobre
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

  // Parámetros geométricos según tipo de solapa
  const flapGeometry = (() => {
    switch (envelopeFlap) {
      case 'BARONIAL_ROUND':
        return {
          heightPercent: '54%',
          clipPath: 'polygon(0% 0%, 100% 0%, 94% 65%, 50% 100%, 6% 65%)',
          svgPoints: '0,0 100,0 94,65 50,100 6,65',
          sealTop: '54%',
        };
      case 'DIAMOND_PEAK':
        return {
          heightPercent: '50%',
          clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
          svgPoints: '0,0 100,0 50,100',
          sealTop: '50%',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#090807]/90 backdrop-blur-md overflow-hidden select-none">
      {/* Contenedor con perspectiva 3D */}
      <div
        className="relative w-full max-w-[460px] sm:max-w-[520px] h-[310px] sm:h-[350px]"
        style={{ perspective: '1500px' }}
      >
        {/* Cuerpo del Sobre con relieve multicapa */}
        <div
          className="relative w-full h-full rounded-2xl transition-transform duration-700 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isCardUp ? 'translateY(55px) scale(0.96)' : 'translateY(0px)',
            filter: 'drop-shadow(0 30px 45px rgba(0,0,0,0.65)) drop-shadow(0 10px 18px rgba(0,0,0,0.45))',
          }}
        >
          {/* 1. Cavidad Interior del Sobre & Forro de Gala (Envelope Liner) */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border"
            style={{
              background: styleConfig.linerBackground,
              borderColor: `${styleConfig.foilColor}40`,
              boxShadow: 'inset 0 14px 35px rgba(0,0,0,0.85)',
            }}
          >
            {/* Patrón vectorial del forro interior (Liner) */}
            <div
              className="absolute inset-2 rounded-xl"
              style={{
                backgroundImage: `url("${styleConfig.linerPatternSvg}")`,
                backgroundRepeat: 'repeat',
                opacity: 0.9,
              }}
            />
            {/* Ribete dorado interior perimetral */}
            <div
              className="absolute inset-2.5 rounded-xl border pointer-events-none opacity-40"
              style={{ borderColor: styleConfig.foilColor }}
            />
          </div>

          {/* 2. Tarjeta interior de la Invitación (se desliza hacia arriba) */}
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
            {/* Doble marco fino editorial de gala perimetral */}
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
                <span
                  className="font-script text-3xl sm:text-4xl italic mx-2"
                  style={{ color: styleConfig.cardAccentColor }}
                >
                  &amp;
                </span>
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
                  <p
                    className="text-[11px] mt-0.5 font-sans font-medium"
                    style={{ color: styleConfig.cardAccentColor }}
                  >
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
              <div
                className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider font-sans"
                style={{ color: styleConfig.cardAccentColor }}
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Deslizando invitación...
              </div>
            </div>
          </div>

          {/* 3. Solapas frontales del sobre (Laterales e inferior) */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
            style={{ zIndex: 25 }}
          >
            {/* Solapa Izquierda */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'polygon(0% 0%, 50% 56%, 0% 100%)',
                background: styleConfig.leftFlapGradient,
                filter: 'drop-shadow(3px 0 6px rgba(0,0,0,0.18))',
              }}
            />
            {/* Foil Edge Izquierdo */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <line
                x1="0"
                y1="0"
                x2="50"
                y2="56"
                stroke={styleConfig.foilColor}
                strokeWidth="0.8"
                strokeOpacity="0.65"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1="50"
                y1="56"
                x2="0"
                y2="100"
                stroke={styleConfig.foilColor}
                strokeWidth="0.8"
                strokeOpacity="0.65"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Solapa Derecha */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'polygon(100% 0%, 50% 56%, 100% 100%)',
                background: styleConfig.rightFlapGradient,
                filter: 'drop-shadow(-3px 0 6px rgba(0,0,0,0.18))',
              }}
            />
            {/* Foil Edge Derecho */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <line
                x1="100"
                y1="0"
                x2="50"
                y2="56"
                stroke={styleConfig.foilColor}
                strokeWidth="0.8"
                strokeOpacity="0.65"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1="50"
                y1="56"
                x2="100"
                y2="100"
                stroke={styleConfig.foilColor}
                strokeWidth="0.8"
                strokeOpacity="0.65"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Solapa Inferior */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: 'polygon(0% 100%, 50% 56%, 100% 100%)',
                background: styleConfig.bottomFlapGradient,
                filter: 'drop-shadow(0 -4px 10px rgba(0,0,0,0.22))',
              }}
            />
            {/* Foil Edge Inferior */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <line
                x1="0"
                y1="100"
                x2="50"
                y2="56"
                stroke={styleConfig.foilColor}
                strokeWidth="1"
                strokeOpacity="0.85"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1="50"
                y1="56"
                x2="100"
                y2="100"
                stroke={styleConfig.foilColor}
                strokeWidth="1"
                strokeOpacity="0.85"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          {/* 4. Solapa Superior 3D (se abre hacia arriba con rotateX) */}
          <div
            className="absolute top-0 left-0 right-0 rounded-t-2xl transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              height: flapGeometry.heightPercent,
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
                clipPath: flapGeometry.clipPath,
                background: styleConfig.topFlapGradient,
                filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.3))',
                backfaceVisibility: 'hidden',
              }}
            >
              {/* Foil de Oro Real en el Borde de la Solapa Exterior */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polygon
                  points={flapGeometry.svgPoints}
                  fill="none"
                  stroke={styleConfig.foilColor}
                  strokeWidth="1.6"
                  strokeOpacity="0.95"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {/* Cara Interior de la Solapa (Abierta hacia arriba) con Forro (Liner) visible */}
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
                style={{
                  backgroundImage: `url("${styleConfig.linerPatternSvg}")`,
                  backgroundRepeat: 'repeat',
                }}
              />
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polygon
                  points={flapGeometry.svgPoints}
                  fill="none"
                  stroke={styleConfig.foilColor}
                  strokeWidth="1.6"
                  strokeOpacity="0.9"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>

          {/* 5. Sello de Cera Táctil 3D (Wax Seal) */}
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
            {/* Halo dorado pulsante tenue */}
            {!isFlapOpen && (
              <div
                className="absolute -inset-4 rounded-full blur-xl animate-pulse"
                style={{ backgroundColor: `${styleConfig.foilColor}30` }}
              />
            )}

            {/* Medallón de cera fundida artesanal */}
            <div
              className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-all duration-200"
              style={{
                borderRadius: '50% 50% 49% 51% / 51% 49% 50% 50%',
                background: currentSealStyle.bg,
                boxShadow: `${currentSealStyle.shadow}, 0 0 20px ${styleConfig.foilColor}30`,
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
