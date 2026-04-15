import { useEffect, useRef } from "react";

interface ExplosionParticle {
  x: number; y: number; vx: number; vy: number;
  size: number; hue: number; life: number; maxLife: number;
  friction: number; gravity: number;
}

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const explosionsRef = useRef<ExplosionParticle[]>([]);

  useEffect(() => {
    const handleScroll = () => { scrollRef.current = window.scrollY; };
    const handleMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const handleClick = (e: MouseEvent) => {
      const hue = Math.random() * 360;
      for (let i = 0; i < 35; i++) {
        const angle = (Math.PI * 2 * i) / 35 + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 6;
        explosionsRef.current.push({
          x: e.clientX, y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.5 + Math.random() * 3,
          hue: hue + Math.random() * 60 - 30,
          life: 1, maxLife: 0.6 + Math.random() * 0.6,
          friction: 0.96, gravity: 0.04,
        });
      }
    };
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("click", handleClick);
    };
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
      speed: number; layer: number; orbitRadius: number; orbitSpeed: number; orbitOffset: number;
    }

    const particles: Particle[] = [];

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 130; i++) {
      const layer = Math.random() < 0.25 ? 2 : Math.random() < 0.55 ? 1 : 0;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseX: Math.random() * canvas.width,
        baseY: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: [0.8, 1.6, 2.8][layer],
        hue: Math.random() * 360,
        alpha: [0.12, 0.22, 0.4][layer],
        speed: [0.3, 0.6, 1][layer],
        layer,
        orbitRadius: 10 + Math.random() * 30,
        orbitSpeed: 0.3 + Math.random() * 0.7,
        orbitOffset: Math.random() * Math.PI * 2,
      });
    }

    const hsl = (h: number, s: number, l: number, a: number) =>
      `hsla(${((h % 360) + 360) % 360}, ${s}%, ${l}%, ${a})`;

    const animate = () => {
      time += 0.007;
      const scroll = scrollRef.current;
      const mouse = mouseRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const waveHue = (time * 25) % 360;

      // Smooth fade
      ctx.fillStyle = "rgba(10, 12, 20, 0.065)";
      ctx.fillRect(0, 0, w, h);

      // Sweeping color wave
      const wx = w * 0.5 + Math.sin(time * 0.8) * w * 0.45;
      const wy = h * 0.5 + Math.cos(time * 0.6) * h * 0.45;
      const waveGrad = ctx.createRadialGradient(wx, wy, 0, wx, wy, w * 0.6);
      waveGrad.addColorStop(0, hsl(waveHue, 70, 50, 0.018));
      waveGrad.addColorStop(0.5, hsl(waveHue + 90, 60, 45, 0.008));
      waveGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = waveGrad;
      ctx.fillRect(0, 0, w, h);

      // Second wave
      const wx2 = w * 0.5 + Math.cos(time * 0.5) * w * 0.4;
      const wy2 = h * 0.5 + Math.sin(time * 0.9) * h * 0.4;
      const waveGrad2 = ctx.createRadialGradient(wx2, wy2, 0, wx2, wy2, w * 0.5);
      waveGrad2.addColorStop(0, hsl(waveHue + 180, 65, 45, 0.012));
      waveGrad2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = waveGrad2;
      ctx.fillRect(0, 0, w, h);

      // Particles
      particles.forEach((p, i) => {
        const parallax = scroll * 0.04 * (p.layer + 1);

        // Orbital drift
        p.baseX += p.vx;
        p.baseY += p.vy;
        if (p.baseX < -30) p.baseX = w + 30;
        if (p.baseX > w + 30) p.baseX = -30;
        if (p.baseY < -30) p.baseY = h + 30;
        if (p.baseY > h + 30) p.baseY = -30;

        let drawX = p.baseX + Math.sin(time * p.orbitSpeed + p.orbitOffset) * p.orbitRadius;
        let drawY = ((p.baseY + Math.cos(time * p.orbitSpeed + p.orbitOffset) * p.orbitRadius * 0.6 - parallax) % h + h) % h;

        // Mouse repulsion
        const dx = drawX - mouse.x;
        const dy = drawY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseRadius = 200;
        let mouseInfluence = 0;

        if (dist < mouseRadius && dist > 0) {
          const force = (1 - dist / mouseRadius) ** 2 * 3;
          drawX += (dx / dist) * force * (p.layer + 1);
          drawY += (dy / dist) * force * (p.layer + 1);
          mouseInfluence = 1 - dist / mouseRadius;
        }

        p.x = drawX;
        p.y = drawY;

        const particleHue = (p.hue + waveHue * 0.4 + Math.sin(time + i * 0.15) * 25) % 360;
        const pulse = Math.sin(time * 1.8 + i * 0.25) * 0.3 + 0.7;
        const sizeM = pulse + mouseInfluence * 1.2;
        const drawAlpha = Math.min(1, p.alpha * pulse + mouseInfluence * 0.4);

        // Glow
        if (p.layer >= 1) {
          const glowR = p.size * (5 + mouseInfluence * 8);
          const glow = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, glowR);
          glow.addColorStop(0, hsl(particleHue, 85, 60, drawAlpha * 0.3));
          glow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.beginPath();
          ctx.arc(drawX, drawY, glowR, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.globalAlpha = 1;
          ctx.fill();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.size * sizeM, 0, Math.PI * 2);
        ctx.fillStyle = hsl(particleHue, 85, 68, 1);
        ctx.globalAlpha = drawAlpha;
        ctx.fill();

        // Connections
        for (let j = i + 1; j < particles.length; j++) {
          const o = particles[j];
          if (Math.abs(p.layer - o.layer) > 1) continue;
          const cdx = p.x - o.x;
          const cdy = p.y - o.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          const maxD = 110 + mouseInfluence * 50;
          if (cdist < maxD) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(o.x, o.y);
            ctx.strokeStyle = hsl(particleHue, 60, 55, 1);
            ctx.globalAlpha = (1 - cdist / maxD) * 0.08 * (1 + mouseInfluence * 1.5);
            ctx.lineWidth = 0.4 + mouseInfluence * 0.6;
            ctx.stroke();
          }
        }
      });

      // Mouse aura
      if (mouse.x > 0) {
        const aura = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
        aura.addColorStop(0, hsl(waveHue + 60, 80, 60, 0.07));
        aura.addColorStop(0.4, hsl(waveHue + 120, 70, 50, 0.025));
        aura.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 220, 0, Math.PI * 2);
        ctx.fillStyle = aura;
        ctx.globalAlpha = 1;
        ctx.fill();

        // Inner ring
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 30 + Math.sin(time * 3) * 5, 0, Math.PI * 2);
        ctx.strokeStyle = hsl(waveHue, 70, 60, 0.15);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Explosion particles
      const explosions = explosionsRef.current;
      for (let i = explosions.length - 1; i >= 0; i--) {
        const ep = explosions[i];
        ep.x += ep.vx;
        ep.y += ep.vy;
        ep.vy += ep.gravity;
        ep.vx *= ep.friction;
        ep.vy *= ep.friction;
        ep.life -= 0.018 / ep.maxLife;

        if (ep.life <= 0) { explosions.splice(i, 1); continue; }

        const eAlpha = ep.life;
        const eSize = ep.size * (0.5 + ep.life * 0.5);

        // Trail
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, eSize * 2.5, 0, Math.PI * 2);
        const trailGlow = ctx.createRadialGradient(ep.x, ep.y, 0, ep.x, ep.y, eSize * 2.5);
        trailGlow.addColorStop(0, hsl(ep.hue, 90, 65, eAlpha * 0.4));
        trailGlow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = trailGlow;
        ctx.globalAlpha = 1;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, eSize, 0, Math.PI * 2);
        ctx.fillStyle = hsl(ep.hue, 95, 75, 1);
        ctx.globalAlpha = eAlpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => { cancelAnimationFrame(animationId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
};

export default AnimatedBackground;
