import React, { useEffect, useRef } from "react";

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  size: number;
  color: string;
  twinkle: boolean;
  trail: { x: number; y: number }[];
}

interface Rocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
  burstColorPalette: string[];
  exploded: boolean;
  sparkTrail: { x: number; y: number; alpha: number; size: number }[];
}

const FESTIVE_PALETTES = [
  // Royal Deepawali Gold & Saffron
  ["#fbbf24", "#f59e0b", "#fef08a", "#ea580c", "#ffffff"],
  // Ruby Red & Sunburst Gold (Chhath & Tihar)
  ["#ef4444", "#f59e0b", "#fbbf24", "#f87171", "#fef3c7"],
  // Emerald & Auspicious Gold
  ["#10b981", "#34d399", "#fbbf24", "#fef08a", "#059669"],
  // Imperial Violet, Gold & Coral
  ["#a855f7", "#ec4899", "#fbbf24", "#fef08a", "#c084fc"],
  // Radiant Golden Sun (Lord Surya Chhath Arghya)
  ["#f59e0b", "#fbbf24", "#fde047", "#ffffff", "#ea580c"],
  // Electric Cyan & Saffron Gold
  ["#06b6d4", "#38bdf8", "#fbbf24", "#fef08a", "#ffffff"],
];

interface TiharRocketFireworksProps {
  className?: string;
}

export const TiharRocketFireworks: React.FC<TiharRocketFireworksProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const rockets: Rocket[] = [];
    const particles: SparkParticle[] = [];

    // Launch rocket from left, center, middle, right, or scattered area
    const launchSingleRocket = (zone?: "center" | "left" | "middle" | "right" | "scatter") => {
      let startX: number;
      const pickZone =
        zone ||
        (Math.random() < 0.45
          ? "center"
          : Math.random() < 0.70
          ? "middle"
          : Math.random() < 0.5
          ? "left"
          : "right");

      if (pickZone === "center") {
        // Direct central rocket (46% to 54% of screen width)
        startX = width * (0.46 + Math.random() * 0.08);
      } else if (pickZone === "middle") {
        // Mid-screen region (35% to 65% of screen width)
        startX = width * (0.35 + Math.random() * 0.30);
      } else if (pickZone === "scatter") {
        // Wide scattered area across the screen (15% to 85%)
        startX = width * (0.15 + Math.random() * 0.70);
      } else if (pickZone === "left") {
        startX = width * (0.02 + Math.random() * 0.22);
      } else {
        startX = width * (0.76 + Math.random() * 0.22);
      }

      // Target apex height in upper sky (6% to 22% from top of screen)
      const targetY = height * (0.06 + Math.random() * 0.16);

      // Trajectory velocity calculated for smooth vertical soaring
      const distance = height - targetY;
      const vy = -(Math.sqrt(2 * 0.185 * distance) * (0.94 + Math.random() * 0.12));
      // For center rockets, shoot nearly straight up; others have slight natural drift
      const vx = pickZone === "center" ? (Math.random() - 0.5) * 1.1 : (Math.random() - 0.5) * 1.8;

      const palette = FESTIVE_PALETTES[Math.floor(Math.random() * FESTIVE_PALETTES.length)];
      const headColor = palette[Math.floor(Math.random() * palette.length)];

      rockets.push({
        x: startX,
        y: height - 8,
        vx,
        vy,
        targetY,
        color: headColor,
        burstColorPalette: palette,
        exploded: false,
        sparkTrail: [],
      });
    };

    // Balanced celebratory launcher with controlled pacing (decreased rocket count)
    const triggerSalvo = () => {
      const rand = Math.random();
      if (rand < 0.45) {
        // Single central rocket soaring straight up
        launchSingleRocket("center");
      } else if (rand < 0.68) {
        // Single flank rocket (alternating left / right)
        launchSingleRocket(Math.random() < 0.5 ? "left" : "right");
      } else if (rand < 0.85) {
        // Single scattered rocket
        launchSingleRocket("scatter");
      } else {
        // Occasional gentle duo (center followed by a gentle flank rocket)
        launchSingleRocket("center");
        setTimeout(() => launchSingleRocket(Math.random() < 0.5 ? "left" : "right"), 450);
      }
    };

    // Create explosion at rocket apex
    const createBurst = (x: number, y: number, palette: string[]) => {
      const particleCount = 48 + Math.floor(Math.random() * 20);
      const baseSpeed = 3.5 + Math.random() * 2.8;

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.35;
        const speed = baseSpeed * (0.35 + Math.random() * 0.9);
        const color = palette[Math.floor(Math.random() * palette.length)];

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: 0.012 + Math.random() * 0.014,
          size: 2.3 + Math.random() * 1.8,
          color,
          twinkle: Math.random() > 0.3,
          trail: [],
        });
      }

      // Central shockwave flash
      particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        alpha: 0.95,
        decay: 0.08,
        size: 16 + Math.random() * 10,
        color: "#ffffff",
        twinkle: false,
        trail: [],
      });
    };

    // Initial launch: single graceful center rocket
    setTimeout(() => launchSingleRocket("center"), 250);
    setTimeout(() => launchSingleRocket("right"), 1600);

    let lastLaunchTime = Date.now();
    let nextLaunchDelay = 2400;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const now = Date.now();
      if (now - lastLaunchTime > nextLaunchDelay) {
        triggerSalvo();
        lastLaunchTime = now;
        // Paced launch cadence: new rocket every 2.2s to 3.8s (clean and uncluttered)
        nextLaunchDelay = 2200 + Math.random() * 1600;
      }

      // UPDATE & DRAW ROCKETS
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];

        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.175; // gravity deceleration

        // Add to spark trail
        r.sparkTrail.push({
          x: r.x + (Math.random() - 0.5) * 3,
          y: r.y + Math.random() * 4,
          alpha: 1,
          size: 2.8 + Math.random() * 2.2,
        });

        if (r.sparkTrail.length > 24) {
          r.sparkTrail.shift();
        }

        // Draw spark trail
        for (let t = 0; t < r.sparkTrail.length; t++) {
          const pt = r.sparkTrail[t];
          pt.alpha -= 0.042;
          pt.y += 0.35;
          if (pt.alpha > 0) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, Math.max(0.5, pt.size * pt.alpha), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(251, 191, 36, ${Math.max(0, pt.alpha * 0.85)})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#f59e0b";
            ctx.fill();
          }
        }

        // Draw rocket glowing head
        ctx.beginPath();
        ctx.arc(r.x, r.y, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 16;
        ctx.shadowColor = r.color;
        ctx.fill();

        // Apex check
        if (r.vy >= -0.5 || r.y <= r.targetY) {
          createBurst(r.x, r.y, r.burstColorPalette);
          rockets.splice(i, 1);
        }
      }

      // UPDATE & DRAW BURST PARTICLES
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 7) {
          p.trail.shift();
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 + 0.065; // gentle gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        let currentAlpha = p.alpha;
        if (p.twinkle) {
          currentAlpha *= 0.65 + Math.random() * 0.35;
        }

        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let k = 1; k < p.trail.length; k++) {
            ctx.lineTo(p.trail[k].x, p.trail[k].y);
          }
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = currentAlpha * 0.65;
          ctx.lineWidth = Math.max(0.7, p.size * 0.7);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * (0.6 + p.alpha * 0.4)), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={
        className ||
        "pointer-events-none fixed inset-0 z-[45] h-full w-full select-none"
      }
      aria-hidden="true"
    />
  );
};
