'use client';

import React, { useEffect, useRef } from 'react';
import { EventTheme, ParticleEffectType } from '@/types/invitation';

export interface AmbientParticlesProps {
  theme?: EventTheme;
  effect?: ParticleEffectType;
}

// ==========================================
// PALETAS CROMÁTICAS DE ALTA COSTURA
// ==========================================

interface RosePetalColor {
  frontBase: string;
  frontMid: string;
  frontRim: string;
  backBase: string;
  backMid: string;
  creaseShadow: string;
  creaseHighlight: string;
}

const ROSE_PALETTES: RosePetalColor[] = [
  // Borgoña Terciopelo de Gala
  {
    frontBase: '#3a0811',
    frontMid: '#7e182b',
    frontRim: '#ba324b',
    backBase: '#4d101c',
    backMid: '#691727',
    creaseShadow: 'rgba(25, 3, 7, 0.45)',
    creaseHighlight: 'rgba(240, 130, 150, 0.3)',
  },
  // Rosa Rubor de Seda (Blush)
  {
    frontBase: '#ba6d7f',
    frontMid: '#efa9b8',
    frontRim: '#fdeef1',
    backBase: '#a85a6c',
    backMid: '#d6899b',
    creaseShadow: 'rgba(120, 50, 65, 0.28)',
    creaseHighlight: 'rgba(255, 255, 255, 0.45)',
  },
  // Marfil Champagne Refinado
  {
    frontBase: '#c5aa7e',
    frontMid: '#f4ecdc',
    frontRim: '#ffffff',
    backBase: '#b3976e',
    backMid: '#e0d1bb',
    creaseShadow: 'rgba(130, 105, 70, 0.25)',
    creaseHighlight: 'rgba(255, 255, 255, 0.6)',
  },
];

const GOLD_COLORS = ['#d4af37', '#f3e5ab', '#e5c158', '#ffffff', '#c5a059', '#ffd700'];
const BOTANICAL_COLORS = ['#5a735c', '#758f77', '#93aa95', '#b2c4b3', '#cddccd', '#d9cbb2'];
const LAVENDER_COLORS = ['#7c5295', '#9d7bb0', '#bfa6d1', '#d8c8e8', '#f1ebf7', '#e5d7ad'];
const CELESTIAL_COLORS = ['#1e40af', '#3b82f6', '#93c5fd', '#dbeafe', '#ffffff', '#c7d2fe'];

// ==========================================
// INTERFACES INTERNAS DE PARTÍCULA
// ==========================================

interface ParticleBase {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  pitch: number;
  pitchSpeed: number;
  roll: number;
  rollSpeed: number;
  yaw: number;
  yawSpeed: number;
  opacity: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
  layerDepth: number;
}

interface RoseParticle extends ParticleBase {
  kind: 'rose';
  width: number;
  height: number;
  palette: RosePetalColor;
  notchDepth: number;
  curlAsymmetry: number;
}

interface SparkleParticle extends ParticleBase {
  kind: 'sparkle';
  color: string;
  twinklePhase: number;
  twinkleSpeed: number;
  isStar: boolean;
}

interface LeafParticle extends ParticleBase {
  kind: 'leaf';
  width: number;
  height: number;
  color: string;
  veinColor: string;
  curl: number;
}

interface LavenderParticle extends ParticleBase {
  kind: 'lavender';
  width: number;
  height: number;
  color: string;
}

type AnyParticle = RoseParticle | SparkleParticle | LeafParticle | LavenderParticle;

export function AmbientParticles({
  theme = 'ROMANTIC_EDITORIAL',
  effect = 'AUTO',
}: AmbientParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Si el usuario configuró explícitamente "NONE", no inicializar motor
    if (effect === 'NONE') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respetar preferencia de reducción de movimiento por accesibilidad
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Resolver efecto final si es AUTO
    let resolvedEffect = effect;
    if (resolvedEffect === 'AUTO') {
      if (theme === 'BOTANICAL_GARDEN' || theme === 'RUSTIC_CHIC') {
        resolvedEffect = 'BOTANICAL_LEAVES';
      } else if (theme === 'GOLDEN_GLAMOUR' || theme === 'NOCTURNE_ROYAL') {
        resolvedEffect = 'GOLD_SPARKLES';
      } else if (theme === 'LAVENDER_PROVENCE') {
        resolvedEffect = 'LAVENDER_PETALS';
      } else if (theme === 'SAPPHIRE_SERENITY') {
        resolvedEffect = 'CELESTIAL_SPARKLES';
      } else {
        resolvedEffect = 'ROSE_PETALS';
      }
    }

    const isMobile = width < 768;
    const count = isMobile ? 22 : 44;
    const particles: AnyParticle[] = [];

    // ==========================================
    // INICIALIZACIÓN DE PARTÍCULAS POR TIPO
    // ==========================================
    for (let i = 0; i < count; i++) {
      const layerDepth = Math.random() < 0.4 ? 0.65 : Math.random() < 0.75 ? 1.0 : 1.35;
      const baseSpeed = Math.random() * 0.45 + 0.35;

      const baseProp: ParticleBase = {
        x: Math.random() * width,
        y: Math.random() * (height + 100) - 50,
        size: Math.random() * 6 + 10,
        speedY: baseSpeed * layerDepth,
        speedX: (Math.random() - 0.5) * 0.35,
        pitch: Math.random() * Math.PI * 2,
        pitchSpeed: (Math.random() - 0.5) * 0.035,
        roll: Math.random() * Math.PI * 2,
        rollSpeed: (Math.random() - 0.5) * 0.04,
        yaw: Math.random() * 360,
        yawSpeed: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.35 + 0.55,
        swayAmp: Math.random() * 25 + 15,
        swayFreq: Math.random() * 0.004 + 0.002,
        swayPhase: Math.random() * Math.PI * 2,
        layerDepth,
      };

      if (resolvedEffect === 'ROSE_PETALS') {
        const pal = ROSE_PALETTES[Math.floor(Math.random() * ROSE_PALETTES.length)];
        const scale = (Math.random() * 8 + 14) * (layerDepth === 0.65 ? 0.75 : layerDepth === 1.35 ? 1.25 : 1.0);
        particles.push({
          ...baseProp,
          kind: 'rose',
          width: scale * 1.05,
          height: scale * 1.35,
          palette: pal,
          notchDepth: Math.random() * 2.5 + 1.0,
          curlAsymmetry: (Math.random() - 0.5) * 0.25,
        });
      } else if (resolvedEffect === 'GOLD_SPARKLES' || resolvedEffect === 'CELESTIAL_SPARKLES') {
        const palette = resolvedEffect === 'GOLD_SPARKLES' ? GOLD_COLORS : CELESTIAL_COLORS;
        particles.push({
          ...baseProp,
          kind: 'sparkle',
          size: Math.random() * 5 + 3,
          color: palette[Math.floor(Math.random() * palette.length)],
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.06 + 0.03,
          isStar: Math.random() > 0.35,
        });
      } else if (resolvedEffect === 'BOTANICAL_LEAVES') {
        const leafColor = BOTANICAL_COLORS[Math.floor(Math.random() * (BOTANICAL_COLORS.length - 1))];
        const scale = (Math.random() * 7 + 12) * (layerDepth === 0.65 ? 0.75 : layerDepth === 1.35 ? 1.2 : 1.0);
        particles.push({
          ...baseProp,
          kind: 'leaf',
          width: scale * 0.65,
          height: scale * 1.6,
          color: leafColor,
          veinColor: 'rgba(255, 255, 255, 0.4)',
          curl: (Math.random() - 0.5) * 0.3,
        });
      } else if (resolvedEffect === 'LAVENDER_PETALS') {
        const scale = (Math.random() * 6 + 9) * (layerDepth === 0.65 ? 0.8 : layerDepth === 1.35 ? 1.2 : 1.0);
        particles.push({
          ...baseProp,
          kind: 'lavender',
          width: scale * 0.7,
          height: scale * 1.2,
          color: LAVENDER_COLORS[Math.floor(Math.random() * LAVENDER_COLORS.length)],
        });
      }
    }

    let animationId: number;
    let isPaused = false;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleVisibility = () => {
      isPaused = document.hidden;
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);

    // ==========================================
    // FUNCIONES PURAS DE DIBUJO GEOMÉTRICO
    // ==========================================

    // Trazo de mitad de pétalo de rosa orgánico (Bézier cúbico)
    const tracePetalHalf = (w: number, h: number, isLeft: boolean, notch: number, curl: number) => {
      const dir = isLeft ? -1 : 1;
      const halfW = w * 0.5 * dir;
      const baseY = h * 0.5;
      const tipY = -h * 0.5 + notch;

      if (isLeft) {
        ctx.moveTo(0, baseY);
        ctx.bezierCurveTo(
          halfW * 0.35, baseY - h * 0.15,
          halfW * (1.1 + curl), baseY - h * 0.65,
          halfW * 0.85, tipY - h * 0.08
        );
        ctx.bezierCurveTo(
          halfW * 0.45, tipY - h * 0.04,
          dir * (w * 0.08), tipY - h * 0.02,
          0, tipY
        );
      } else {
        ctx.bezierCurveTo(
          dir * (w * 0.08), tipY - h * 0.02,
          halfW * 0.45, tipY - h * 0.04,
          halfW * 0.85, tipY - h * 0.08
        );
        ctx.bezierCurveTo(
          halfW * (1.1 - curl), baseY - h * 0.65,
          halfW * 0.35, baseY - h * 0.15,
          0, baseY
        );
      }
    };

    // Render de pétalo de rosa hiperrealista con volumen cóncavo y luz
    const drawRosePetal = (p: RoseParticle) => {
      const scaleY = Math.cos(p.pitch);
      const scaleX = Math.cos(p.roll);
      const effScaleX = Math.abs(scaleX) < 0.08 ? 0.08 * Math.sign(scaleX || 1) : scaleX;
      const effScaleY = Math.abs(scaleY) < 0.08 ? 0.08 * Math.sign(scaleY || 1) : scaleY;

      ctx.scale(effScaleX, effScaleY);

      const isFront = scaleY >= 0;
      const pal = p.palette;
      const w = p.width;
      const h = p.height;

      const baseCol = isFront ? pal.frontBase : pal.backBase;
      const midCol = isFront ? pal.frontMid : pal.backMid;
      const rimCol = isFront ? pal.frontRim : pal.backMid;

      // 1. Ala Izquierda (con sombra propia de concavidad)
      ctx.beginPath();
      tracePetalHalf(w, h, true, p.notchDepth, p.curlAsymmetry);
      ctx.closePath();
      const leftGrad = ctx.createLinearGradient(-w * 0.5, -h * 0.5, w * 0.4, h * 0.5);
      leftGrad.addColorStop(0, rimCol);
      leftGrad.addColorStop(0.35, midCol);
      leftGrad.addColorStop(1, baseCol);
      ctx.fillStyle = leftGrad;
      ctx.fill();

      // Sombra volumétrica interna
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fill();

      // 2. Ala Derecha (con brillo lumínico principal)
      ctx.beginPath();
      tracePetalHalf(w, h, false, p.notchDepth, -p.curlAsymmetry);
      ctx.closePath();
      const rightGrad = ctx.createLinearGradient(w * 0.5, -h * 0.5, -w * 0.4, h * 0.5);
      rightGrad.addColorStop(0, rimCol);
      rightGrad.addColorStop(0.45, midCol);
      rightGrad.addColorStop(1, baseCol);
      ctx.fillStyle = rightGrad;
      ctx.fill();

      // 3. Pliegue / Nervadura Central (Spine)
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.quadraticCurveTo(p.curlAsymmetry * 6, 0, 0, -h * 0.5 + p.notchDepth);
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = isFront ? pal.creaseShadow : pal.creaseHighlight;
      ctx.stroke();

      // Brillo especular sutil en la quilla si mira al frente
      if (isFront) {
        ctx.beginPath();
        ctx.moveTo(0.6, h * 0.45);
        ctx.quadraticCurveTo(p.curlAsymmetry * 6 + 0.6, 0, 0.6, -h * 0.45 + p.notchDepth);
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = pal.creaseHighlight;
        ctx.stroke();
      }

      // 4. Borde fino translúcido (Rim Glow)
      ctx.beginPath();
      tracePetalHalf(w, h, true, p.notchDepth, p.curlAsymmetry);
      tracePetalHalf(w, h, false, p.notchDepth, -p.curlAsymmetry);
      ctx.closePath();
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = isFront ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();
    };

    // Render de estrella destellante de 4 puntas (✦) y polvo estelar
    const drawSparkle = (p: SparkleParticle) => {
      p.twinklePhase += p.twinkleSpeed;
      const pulse = 0.65 + 0.35 * Math.sin(p.twinklePhase);
      const rad = p.size * pulse;

      if (p.isStar) {
        // Estrella de gala de 4 puntas con destellos curvos
        ctx.beginPath();
        ctx.moveTo(0, -rad * 1.8);
        ctx.quadraticCurveTo(0, 0, rad * 1.8, 0);
        ctx.quadraticCurveTo(0, 0, 0, rad * 1.8);
        ctx.quadraticCurveTo(0, 0, -rad * 1.8, 0);
        ctx.quadraticCurveTo(0, 0, 0, -rad * 1.8);
        ctx.closePath();

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rad * 1.8);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();

        // Destello central microscópico de diamante
        ctx.beginPath();
        ctx.arc(0, 0, rad * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else {
        // Partícula halo esférica de micro-brillo
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    };

    // Render de hoja botánica de olivo / salvia
    const drawLeaf = (p: LeafParticle) => {
      const scaleX = Math.cos(p.roll);
      const scaleY = Math.cos(p.pitch);
      ctx.scale(
        Math.abs(scaleX) < 0.1 ? 0.1 * Math.sign(scaleX || 1) : scaleX,
        Math.abs(scaleY) < 0.1 ? 0.1 * Math.sign(scaleY || 1) : scaleY
      );

      const w = p.width;
      const h = p.height;

      // Silueta lanceolada orgánica de hoja de olivo
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5); // Tallo
      ctx.bezierCurveTo(
        -w * 0.9, h * 0.2,
        -w * 0.8, -h * 0.25,
        0, -h * 0.5 // Ápice puntiagudo
      );
      ctx.bezierCurveTo(
        w * 0.8, -h * 0.25,
        w * 0.9, h * 0.2,
        0, h * 0.5
      );
      ctx.closePath();

      const grad = ctx.createLinearGradient(-w * 0.5, -h * 0.5, w * 0.5, h * 0.5);
      grad.addColorStop(0, p.color);
      grad.addColorStop(0.7, '#3b4e3c');
      grad.addColorStop(1, '#273528');
      ctx.fillStyle = grad;
      ctx.fill();

      // Nervadura central de la hoja
      ctx.beginPath();
      ctx.moveTo(0, h * 0.48);
      ctx.quadraticCurveTo(p.curl * 4, 0, 0, -h * 0.45);
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = p.veinColor;
      ctx.stroke();
    };

    // Render de pétalo / flor de lavanda provenzal
    const drawLavender = (p: LavenderParticle) => {
      const scaleX = Math.cos(p.roll);
      const scaleY = Math.cos(p.pitch);
      ctx.scale(
        Math.abs(scaleX) < 0.1 ? 0.1 * Math.sign(scaleX || 1) : scaleX,
        Math.abs(scaleY) < 0.1 ? 0.1 * Math.sign(scaleY || 1) : scaleY
      );

      const w = p.width;
      const h = p.height;

      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.bezierCurveTo(-w * 0.7, h * 0.1, -w * 0.5, -h * 0.35, 0, -h * 0.5);
      ctx.bezierCurveTo(w * 0.5, -h * 0.35, w * 0.7, h * 0.1, 0, h * 0.5);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5);
      grad.addColorStop(0, '#f2e8fa');
      grad.addColorStop(0.5, p.color);
      grad.addColorStop(1, '#4c2563');
      ctx.fillStyle = grad;
      ctx.fill();
    };

    // ==========================================
    // BUCLE PRINCIPAL DE ANIMACIÓN
    // ==========================================
    const render = () => {
      if (!isPaused) {
        ctx.clearRect(0, 0, width, height);

        for (const p of particles) {
          // Rotaciones Euler 3D
          p.pitch += p.pitchSpeed;
          p.roll += p.rollSpeed;
          p.yaw += p.yawSpeed;

          // Física aerodinámica: cuando el pétalo o la hoja está horizontal frena; vertical acelera
          const drag = 0.45 + 0.55 * Math.abs(Math.cos(p.pitch));
          p.y += p.speedY * drag;

          // Brisa sinusoidal lateral suave
          const sway = Math.sin(p.swayPhase + p.y * p.swayFreq) * (p.swayAmp * 0.035);
          p.x += p.speedX + sway;

          // Reciclaje continuo fuera de la pantalla
          if (p.y > height + 40) {
            p.y = -35;
            p.x = Math.random() * (width + 60) - 30;
            p.pitch = Math.random() * Math.PI * 2;
            p.roll = Math.random() * Math.PI * 2;
          }
          if (p.x > width + 40) p.x = -35;
          if (p.x < -40) p.x = width + 35;

          // Renderizado de la partícula
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.yaw * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;

          if (p.kind === 'rose') {
            drawRosePetal(p);
          } else if (p.kind === 'sparkle') {
            drawSparkle(p);
          } else if (p.kind === 'leaf') {
            drawLeaf(p);
          } else if (p.kind === 'lavender') {
            drawLavender(p);
          }

          ctx.restore();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [theme, effect]);

  if (effect === 'NONE') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 opacity-75"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
