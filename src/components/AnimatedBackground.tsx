import { useEffect, useRef } from "react";

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => { scrollRef.current = window.scrollY; };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
      size: number; color: string; alpha: number; baseY: number;
    }

    const particles: Particle[] = [];
    const colors = ["#2dd4a8", "#7c3aed", "#ec4899", "#06b6d4", "#f59e0b"];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseY: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    const animate = () => {
      time += 0.01;
      const scroll = scrollRef.current;
      const parallaxOffset = scroll * 0.15;

      ctx.fillStyle = "rgba(10, 12, 20, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        // Scroll parallax: particles drift based on depth (size)
        const depth = p.size / 3;
        p.y = p.baseY - parallaxOffset * depth + Math.sin(time + i) * 2;
        p.baseY += p.vy;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.baseY < -50) p.baseY = canvas.height + 50;
        if (p.baseY > canvas.height + 50) p.baseY = -50;

        const drawY = ((p.y % canvas.height) + canvas.height) % canvas.height;

        // Pulsing glow
        const pulse = Math.sin(time * 2 + i * 0.5) * 0.2 + 0.8;

        ctx.beginPath();
        ctx.arc(p.x, drawY, p.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * pulse;
        ctx.fill();

        // Glow effect for larger particles
        if (p.size > 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, drawY, p.size * 3, 0, Math.PI * 2);
          const glow = ctx.createRadialGradient(p.x, drawY, 0, p.x, drawY, p.size * 3);
          glow.addColorStop(0, p.color);
          glow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = glow;
          ctx.globalAlpha = p.alpha * 0.15;
          ctx.fill();
        }

        // Connections
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const otherDrawY = ((other.y % canvas.height) + canvas.height) % canvas.height;
          const dx = p.x - other.x;
          const dy = drawY - otherDrawY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, drawY);
            ctx.lineTo(other.x, otherDrawY);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 130) * 0.12;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

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
