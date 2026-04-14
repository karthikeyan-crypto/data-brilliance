import { useEffect, useRef, useState } from "react";

const JupiterBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);
  const themeRef = useRef<string>("dark");
  const [, setRerender] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute("data-theme") || "dark";
      if (t !== themeRef.current) {
        themeRef.current = t;
        setRerender((r) => r + 1);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    themeRef.current = document.documentElement.getAttribute("data-theme") || "dark";
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let time = 0;

    interface Star {
      x: number;
      y: number;
      z: number;
      speed: number;
      size: number;
      brightness: number;
    }

    const stars: Star[] = [];
    const NUM_STARS = 300;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        z: Math.random() * 1000,
        speed: Math.random() * 2 + 0.5,
        size: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.7 + 0.3,
      });
    }

    const drawJupiter = (cx: number, cy: number, radius: number, sunProgress: number) => {
      // Jupiter body
      const grad = ctx.createRadialGradient(
        cx - radius * 0.3, cy - radius * 0.3, radius * 0.1,
        cx, cy, radius
      );

      if (sunProgress > 0.3) {
        // Day theme — sunlit Jupiter
        grad.addColorStop(0, "#f4d49c");
        grad.addColorStop(0.3, "#e8b86d");
        grad.addColorStop(0.6, "#c88a3a");
        grad.addColorStop(0.85, "#a0642a");
        grad.addColorStop(1, "#6b3a1a");
      } else {
        // Dark/Cyber theme — shadowed Jupiter
        grad.addColorStop(0, "#c4956a");
        grad.addColorStop(0.3, "#9a7050");
        grad.addColorStop(0.6, "#6b4c35");
        grad.addColorStop(0.85, "#3d2a1a");
        grad.addColorStop(1, "#1a1008");
      }

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Jupiter bands
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      const bandColors = sunProgress > 0.3
        ? ["rgba(200,140,70,0.4)", "rgba(160,100,50,0.3)", "rgba(240,200,140,0.2)", "rgba(180,120,60,0.35)", "rgba(140,80,30,0.25)"]
        : ["rgba(120,80,40,0.4)", "rgba(80,50,25,0.3)", "rgba(160,120,80,0.2)", "rgba(100,60,30,0.35)", "rgba(60,35,15,0.25)"];

      for (let i = 0; i < 12; i++) {
        const bandY = cy - radius + (i * radius * 2) / 12;
        const bandH = (radius * 2) / 12;
        const waveOffset = Math.sin(time * 0.3 + i * 0.8) * 3;
        ctx.fillStyle = bandColors[i % bandColors.length];
        ctx.fillRect(cx - radius, bandY + waveOffset, radius * 2, bandH * 0.6);
      }

      // Great Red Spot
      const spotX = cx + Math.cos(time * 0.15) * radius * 0.3;
      const spotY = cy + radius * 0.2;
      ctx.beginPath();
      ctx.ellipse(spotX, spotY, radius * 0.15, radius * 0.1, 0, 0, Math.PI * 2);
      const spotGrad = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, radius * 0.15);
      spotGrad.addColorStop(0, sunProgress > 0.3 ? "rgba(200,80,40,0.7)" : "rgba(140,50,20,0.6)");
      spotGrad.addColorStop(1, "rgba(140,50,20,0)");
      ctx.fillStyle = spotGrad;
      ctx.fill();

      ctx.restore();

      // Atmosphere glow
      const atmoGrad = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius * 1.15);
      atmoGrad.addColorStop(0, "rgba(200,150,100,0)");
      atmoGrad.addColorStop(0.5, sunProgress > 0.3 ? "rgba(255,200,120,0.08)" : "rgba(150,100,60,0.05)");
      atmoGrad.addColorStop(1, "rgba(200,150,100,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = atmoGrad;
      ctx.fill();
    };

    const drawRings = (cx: number, cy: number, radius: number, angle: number, sunProgress: number) => {
      ctx.save();
      ctx.translate(cx, cy);

      const ringColors = sunProgress > 0.3
        ? [
          { inner: 1.25, outer: 1.35, color: "rgba(220,180,130,0.35)" },
          { inner: 1.4, outer: 1.6, color: "rgba(200,160,110,0.25)" },
          { inner: 1.65, outer: 1.75, color: "rgba(180,140,90,0.15)" },
        ]
        : [
          { inner: 1.25, outer: 1.35, color: "rgba(140,100,60,0.3)" },
          { inner: 1.4, outer: 1.6, color: "rgba(100,70,40,0.2)" },
          { inner: 1.65, outer: 1.75, color: "rgba(80,50,25,0.12)" },
        ];

      ringColors.forEach((ring) => {
        const steps = 200;
        for (let i = 0; i < steps; i++) {
          const a = (i / steps) * Math.PI * 2 + angle;
          const nextA = ((i + 1) / steps) * Math.PI * 2 + angle;

          const tilt = 0.25;
          const x1 = Math.cos(a) * radius * ring.inner;
          const y1 = Math.sin(a) * radius * ring.inner * tilt;
          const x2 = Math.cos(a) * radius * ring.outer;
          const y2 = Math.sin(a) * radius * ring.outer * tilt;
          const x3 = Math.cos(nextA) * radius * ring.outer;
          const y3 = Math.sin(nextA) * radius * ring.outer * tilt;
          const x4 = Math.cos(nextA) * radius * ring.inner;
          const y4 = Math.sin(nextA) * radius * ring.inner * tilt;

          // Only draw ring segments that are behind or in front of Jupiter
          const behindPlanet = Math.sin(a) > 0;

          ctx.globalAlpha = behindPlanet ? 0.15 : 0.6;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y3);
          ctx.lineTo(x4, y4);
          ctx.closePath();
          ctx.fillStyle = ring.color;
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const drawSun = (sunProgress: number) => {
      if (sunProgress <= 0.05) return;

      const sunX = canvas.width * 0.85;
      const sunY = canvas.height * 0.1 * (1 - sunProgress) + canvas.height * 0.15 * sunProgress;
      const sunRadius = 40 + sunProgress * 60;

      // Sun glow
      const glowGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 4);
      glowGrad.addColorStop(0, `rgba(255,220,100,${0.4 * sunProgress})`);
      glowGrad.addColorStop(0.3, `rgba(255,180,60,${0.15 * sunProgress})`);
      glowGrad.addColorStop(1, "rgba(255,180,60,0)");
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius * 4, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Sun body
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
      sunGrad.addColorStop(0, "#fffbe6");
      sunGrad.addColorStop(0.5, "#ffdd57");
      sunGrad.addColorStop(1, "#ff9f1c");
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fillStyle = sunGrad;
      ctx.fill();

      // Sun rays
      for (let i = 0; i < 12; i++) {
        const rayAngle = (i / 12) * Math.PI * 2 + time * 0.2;
        const rayLen = sunRadius * (1.5 + Math.sin(time + i) * 0.5);
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(
          sunX + Math.cos(rayAngle) * rayLen,
          sunY + Math.sin(rayAngle) * rayLen
        );
        ctx.strokeStyle = `rgba(255,220,100,${0.1 * sunProgress})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Sunlight on scene — gradient overlay
      const lightGrad = ctx.createLinearGradient(canvas.width, 0, 0, canvas.height);
      lightGrad.addColorStop(0, `rgba(255,200,80,${0.04 * sunProgress})`);
      lightGrad.addColorStop(1, "rgba(255,200,80,0)");
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const animate = () => {
      time += 0.01;
      const w = canvas.width;
      const h = canvas.height;
      const scroll = scrollRef.current;
      const theme = themeRef.current;

      // Sun progress: 0 for dark/cyber, 1 for light
      const sunProgress = theme === "light" ? 1 : 0;

      // Background color
      if (sunProgress > 0.3) {
        // Day sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, "#0a0e1a");
        skyGrad.addColorStop(0.4, "#0f1528");
        skyGrad.addColorStop(1, "#1a1830");
        ctx.fillStyle = skyGrad;
      } else if (theme === "cyber") {
        ctx.fillStyle = "#08060f";
      } else {
        ctx.fillStyle = "#060810";
      }
      ctx.fillRect(0, 0, w, h);

      // Draw stars
      stars.forEach((star) => {
        star.z -= star.speed;
        if (star.z <= 0) {
          star.z = 1000;
          star.x = Math.random() * 2000 - 1000;
          star.y = Math.random() * 2000 - 1000;
        }

        const sx = (star.x / star.z) * 400 + w / 2;
        const sy = (star.y / star.z) * 400 + h / 2;
        const sz = Math.max(0.3, (1 - star.z / 1000) * star.size * 2);

        if (sx < 0 || sx > w || sy < 0 || sy > h) return;

        const twinkle = Math.sin(time * 3 + star.x) * 0.3 + 0.7;
        const dimForDay = sunProgress > 0.3 ? 0.3 : 1;

        ctx.beginPath();
        ctx.arc(sx, sy, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${star.brightness * twinkle * dimForDay})`;
        ctx.fill();

        // Star trail
        const trailLen = star.speed * 3;
        const prevSx = ((star.x) / (star.z + trailLen)) * 400 + w / 2;
        const prevSy = ((star.y) / (star.z + trailLen)) * 400 + h / 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(prevSx, prevSy);
        ctx.strokeStyle = `rgba(200,220,255,${star.brightness * 0.15 * dimForDay})`;
        ctx.lineWidth = sz * 0.5;
        ctx.stroke();
      });

      // Jupiter position with scroll parallax
      const baseJupiterY = h * 0.5;
      const scrollOffset = scroll * 0.3;
      const jupiterY = baseJupiterY - scrollOffset;
      const jupiterX = w * 0.5;
      // Closer when scroll up (scroll=0 → farther), scroll down → closer
      const baseRadius = Math.min(w, h) * 0.2;
      const scrollScale = 1 + scroll * 0.0005;
      const jupiterRadius = baseRadius * scrollScale;

      // Draw back rings (behind Jupiter)
      drawRings(jupiterX, jupiterY, jupiterRadius, time * 0.5, sunProgress);

      // Draw Jupiter
      drawJupiter(jupiterX, jupiterY, jupiterRadius, sunProgress);

      // Draw Sun if light theme
      drawSun(sunProgress);

      // Shooting stars
      if (Math.random() < 0.003) {
        const sx = Math.random() * w;
        const sy = Math.random() * h * 0.3;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 80, sy + 40);
        const shootGrad = ctx.createLinearGradient(sx, sy, sx + 80, sy + 40);
        shootGrad.addColorStop(0, "rgba(255,255,255,0.8)");
        shootGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = shootGrad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Nebula clouds
      const nebulaAlpha = sunProgress > 0.3 ? 0.02 : 0.04;
      [
        { x: w * 0.2, y: h * 0.3, r: 200, color: `rgba(100,50,200,${nebulaAlpha})` },
        { x: w * 0.8, y: h * 0.7, r: 180, color: `rgba(50,150,150,${nebulaAlpha})` },
      ].forEach((n) => {
        const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        ng.addColorStop(0, n.color);
        ng.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = ng;
        ctx.fill();
      });

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

export default JupiterBackground;
