'use client';

import React from 'react';
import { Pause, Play, Music } from 'lucide-react';
import { EventTheme } from '@/types/invitation';

export interface FloatingAudioPlayerProps {
  playing: boolean;
  onToggle: () => void;
  theme?: EventTheme;
  title?: string;
}

export function FloatingAudioPlayer({
  playing,
  onToggle,
  theme = 'ROMANTIC_EDITORIAL',
  title = 'Nuestra Canción',
}: FloatingAudioPlayerProps) {
  const isDark = theme === 'CLASSIC_NOCTURNE';

  return (
    <div
      className="fixed z-40 right-4 sm:right-6 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] select-none"
      style={{ touchAction: 'manipulation' }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? 'Pausar música de la boda' : 'Reproducir música de la boda'}
        className={`group flex items-center gap-2.5 rounded-full px-3.5 py-2.5 sm:px-4 sm:py-2.5 text-xs font-medium shadow-xl transition-all duration-300 min-h-[44px] border ${
          isDark
            ? 'bg-[#181b22]/90 border-[#c9a45c]/50 text-[#f5efe6] shadow-black/50 hover:border-[#c9a45c]'
            : 'bg-white/95 border-[#e2d5c0] text-stone-800 shadow-stone-900/10 hover:border-[#b08d57]'
        } backdrop-blur-md hover:scale-105 active:scale-95`}
      >
        {/* Disco vinilo / cápsula joya giratoria */}
        <div
          className={`relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-transform ${
            playing ? 'animate-spin-slow' : ''
          } ${
            isDark
              ? 'bg-gradient-to-tr from-[#12141a] via-[#2a2d38] to-[#12141a] border border-[#c9a45c]/60'
              : 'bg-gradient-to-tr from-[#2d2925] via-[#4a443e] to-[#1e1c1a] border border-[#b08d57]/60'
          }`}
          style={{
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25), 0 2px 5px rgba(0,0,0,0.3)',
          }}
        >
          {/* Surcos de vinilo */}
          <div
            className="absolute inset-1 rounded-full opacity-40"
            style={{
              backgroundImage: 'radial-gradient(circle at center, transparent 3px, #e5c98d 4px, transparent 5px)',
            }}
          />
          {/* Centro del vinilo con nota */}
          <div className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#b08d57]">
            <Music className="h-2 w-2 text-white" />
          </div>
        </div>

        {/* Ecualizador animado de 4 barras */}
        <div className="flex items-end gap-[2.5px] h-3.5 px-0.5">
          <span
            className={`w-[2.5px] rounded-full transition-all duration-300 ${
              isDark ? 'bg-[#dfc07c]' : 'bg-[#b08d57]'
            } ${playing ? 'h-3.5 animate-eq-1' : 'h-1 opacity-40'}`}
          />
          <span
            className={`w-[2.5px] rounded-full transition-all duration-300 ${
              isDark ? 'bg-[#dfc07c]' : 'bg-[#b08d57]'
            } ${playing ? 'h-3.5 animate-eq-2' : 'h-1.5 opacity-40'}`}
          />
          <span
            className={`w-[2.5px] rounded-full transition-all duration-300 ${
              isDark ? 'bg-[#dfc07c]' : 'bg-[#b08d57]'
            } ${playing ? 'h-3.5 animate-eq-3' : 'h-1 opacity-40'}`}
          />
          <span
            className={`w-[2.5px] rounded-full transition-all duration-300 ${
              isDark ? 'bg-[#dfc07c]' : 'bg-[#b08d57]'
            } ${playing ? 'h-3.5 animate-eq-4' : 'h-2 opacity-40'}`}
          />
        </div>

        {/* Etiqueta */}
        <div className="hidden sm:flex flex-col text-left leading-none pr-1">
          <span className="text-[10px] tracking-wider uppercase text-stone-500 dark:text-stone-400 font-sans">
            {playing ? 'Sonando' : 'Pausado'}
          </span>
          <span className="text-xs font-serif font-medium truncate max-w-[110px] text-stone-800 dark:text-stone-200 mt-0.5">
            {title}
          </span>
        </div>

        {/* Icono Play/Pause */}
        <div
          className={`ml-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
            isDark ? 'bg-[#252a36] text-[#dfc07c]' : 'bg-[#f5efe6] text-[#967543]'
          }`}
        >
          {playing ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5 ml-0.5" />}
        </div>
      </button>
    </div>
  );
}
