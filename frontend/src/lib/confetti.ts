/**
 * Celebración de Confeti Nupcial (Zero Dependencies)
 * Ráfaga sutil de confeti dorado, champagne, perla y pétalos de rosa.
 */

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'petal';
}

export function triggerWeddingConfetti() {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  // Paleta nupcial de gala: oro 24k, champagne suave, rosa pálido y blanco perla
  const colors = [
    '#C5A059', // Oro viejo
    '#E5C98D', // Champagne
    '#F7F3E9', // Blanco perla
    '#D9A5B3', // Rosa empolvado
    '#8B2635', // Borgoña lacre
    '#B38C48', // Oro satinado
  ];

  const particleCount = width < 768 ? 50 : 90;
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const isLeft = i % 2 === 0;
    const startX = isLeft ? width * 0.15 : width * 0.85;
    const startY = height * 0.8;
    const angle = isLeft
      ? (Math.random() * 40 + 40) * (Math.PI / 180)
      : (Math.random() * 40 + 100) * (Math.PI / 180);
    const speed = Math.random() * 12 + 10;

    particles.push({
      x: startX,
      y: startY,
      w: Math.random() * 8 + 6,
      h: Math.random() * 10 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: Math.cos(angle) * speed * (isLeft ? 1 : -1),
      vy: -Math.sin(angle) * speed,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      opacity: 1,
      shape: Math.random() > 0.4 ? 'rect' : Math.random() > 0.5 ? 'petal' : 'circle',
    });
  }

  let animationFrameId: number;
  const startTime = Date.now();
  const duration = 2800; // 2.8 segundos

  const render = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravedad suave
      p.vx *= 0.98; // Resistencia del aire
      p.rotation += p.vRot;

      if (elapsed > duration * 0.6) {
        p.opacity = Math.max(0, 1 - (elapsed - duration * 0.6) / (duration * 0.4));
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Pétalo suave ovalado
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w / 2, p.h / 2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    animationFrameId = requestAnimationFrame(render);
  };

  animationFrameId = requestAnimationFrame(render);
}
