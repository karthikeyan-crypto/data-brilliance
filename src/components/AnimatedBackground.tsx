import { useEffect, useRef } from "react";

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleScroll = () => { scrollRef.current = window.scrollY; };
    const handleMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouse);
    return () => { window.removeEventListener("scroll", handleScroll); window.removeEventListener("mousemove", handleMouse); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; hue: number; alpha: number; baseY: number; baseX: number;
      speed: number; layer: number;
    }

    const particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 120; i++) {
      const layer = Math.random() < 0.3 ? 2 : Math.random() < 0.6 ? 1 : 0;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseX: Math.random() * canvas.width,
        baseY: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: [1, 1.8, 2.8][layer],
        hue: Math.random() * 360,
        alpha: [0.15, 0.25, 0.4][layer],
        speed: [0.3, 0.6, 1][layer],
        layer,
      });
    }

    const hueToColor = (h: number, s: number, l: number, a: number) =>
      `hsla(${h % 360}, ${s}%, ${l}%, ${a})`;

    const animate = () => {
      time += 0.008;
      const scroll = scrollRef.current;
      const mouse = mouseRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // Color wave: base hue shifts over time
      const waveHue = (time * 30) % 360;

      // Fade-clear for trails
      ctx.fillStyle = "rgba(10, 12, 20, 0.06)";
      ctx.fillRect(0, 0, w, h);

      // Subtle color wave gradient overlay
      const waveGrad = ctx.createLinearGradient(
        w * 0.5 + Math.sin(time) * w * 0.4, 0,
        w * 0.5 + Math.cos(time * 0.7) * w * 0.4, h
      );
      waveGrad.addColorStop(0, hueToColor(waveHue, 70, 50, 0.012));
      waveGrad.addColorStop(0.5, hueToColor(waveHue + 120, 70, 50, 0.008));
      waveGrad.addColorStop(1, hueToColor(waveHue + 240, 70, 50, 0.012));
      ctx.fillStyle = waveGrad;
      ctx.fillRect(0, 0, w, h);

      particles.forEach((p, i) => {
        // Scroll parallax by layer depth
        const parallax = scroll * 0.05 * (p.layer + 1);

        p.baseX += p.vx;
        p.baseY += p.vy;

        // Wrap
        if (p.baseX < -20) p.baseX = w + 20;
        if (p.baseX > w + 20) p.baseX = -20;
        if (p.baseY < -20) p.baseY = h + 20;
        if (p.baseY > h + 20) p.baseY = -20;

        let drawX = p.baseX;
        let drawY = ((p.baseY - parallax) % h + h) % h;

        // Mouse interaction: repel nearby, attract distant
        const dx = drawX - mouse.x;
        const dy = drawY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseRadius = 180;
        let mouseInfluence = 0;

        if (dist < mouseRadius && dist > 0) {
          const force = (1 - dist / mouseRadius) * 2.5;
          drawX += (dx / dist) * force * (p.layer + 1);
          drawY += (dy / dist) * force * (p.layer + 1);
          mouseInfluence = 1 - dist / mouseRadius;
        }

        p.x = drawX;
        p.y = drawY;

        // Color: blend particle hue with wave
        const particleHue = (p.hue + waveHue * 0.3 + Math.sin(time + i * 0.2) * 30) % 360;
        const pulse = Math.sin(time * 2 + i * 0.3) * 0.25 + 0.75;
        const sizeMultiplier = pulse + mouseInfluence * 0.8;
        const drawAlpha = Math.min(1, p.alpha * pulse + mouseInfluence * 0.3);

        // Outer glow
        if (p.layer >= 1) {
          const glowR = p.size * (4 + mouseInfluence * 6);
          const glow = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, glowR);
          glow.addColorStop(0, hueToColor(particleHue, 80, 60, drawAlpha * 0.25));
          glow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.beginPath();
          ctx.arc(drawX, drawY, glowR, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.globalAlpha = 1;
          ctx.fill();
        }

        // Core
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.size * sizeMultiplier, 0, Math.PI * 2);
        ctx.fillStyle = hueToColor(particleHue, 85, 65, 1);
        ctx.globalAlpha = drawAlpha;
        ctx.fill();

        // Connections (only same or adjacent layers)
        for (let j = i + 1; j < particles.length; j++) {
          const o = particles[j];
          if (Math.abs(p.layer - o.layer) > 1) continue;
          const cdx = p.x - o.x;
          const cdy = p.y - o.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          const maxDist = 120 + mouseInfluence * 40;
          if (cdist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(o.x, o.y);
            ctx.strokeStyle = hueToColor(particleHue, 70, 55, 1);
            ctx.globalAlpha = (1 - cdist / maxDist) * 0.1 * (1 + mouseInfluence);
            ctx.lineWidth = 0.5 + mouseInfluence * 0.5;
            ctx.stroke();
          }
        }
      });

      // Mouse glow aura
      if (mouse.x > 0) {
        const aura = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 200);
        aura.addColorStop(0, hueToColor(waveHue + 60, 80, 60, 0.06));
        aura.addColorStop(0.5, hueToColor(waveHue + 120, 70, 50, 0.02));
        aura.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 200, 0, Math.PI * 2);
        ctx.fillStyle = aura;
        ctx.globalAlpha = 1;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

export default AnimatedBackground;
