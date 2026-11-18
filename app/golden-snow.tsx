"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Copos dorados de Navidad — capa decorativa sobre toda la web.
 *
 * - Canvas fijo, `pointer-events: none`, por debajo de nav / menús / sheets.
 * - Pocos copos, lentos y finos (líneas doradas con degradado + destellos suaves),
 *   en la línea del escaparate: dorado cálido sobre negro, nada de "nieve blanca".
 * - Solo dentro de la temporada (ver `SEASON`); `?copos=1` lo fuerza para previsualizar
 *   y `?copos=0` lo apaga.
 * - Respeta `prefers-reduced-motion`, se pausa con la pestaña oculta y limita DPR.
 */

/** Temporada: del 15 de noviembre al 7 de enero (ambos incluidos), cada año. */
const SEASON = { from: { month: 11, day: 15 }, to: { month: 1, day: 7 } };

function inSeason(now = new Date()): boolean {
  const md = (now.getMonth() + 1) * 100 + now.getDate();
  const from = SEASON.from.month * 100 + SEASON.from.day;
  const to = SEASON.to.month * 100 + SEASON.to.day;
  return from <= to ? md >= from && md <= to : md >= from || md <= to;
}

function shouldShow(): boolean {
  if (typeof window === "undefined") return false;
  const flag = new URLSearchParams(window.location.search).get("copos");
  if (flag === "0") return false;
  if (flag === "1") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return inSeason();
}

type Flake = {
  x: number;
  y: number;
  r: number; // radio en px CSS
  vy: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  rot: number;
  vr: number;
  alpha: number;
  twinkle: number;
  sprite: number; // índice de sprite, -1 = destello
};

const GOLD_LIGHT = "#f3dcaa";
const GOLD = "#d4af7a";
const GOLD_DEEP = "#bb955d";

/** Dibuja un copo de 6 brazos, fino, con degradado dorado. */
function drawCrystal(size: number, variant: number, dpr: number): HTMLCanvasElement {
  const px = Math.ceil(size * 2 * dpr) + 4;
  const c = document.createElement("canvas");
  c.width = c.height = px;
  const ctx = c.getContext("2d")!;
  ctx.translate(px / 2, px / 2);
  ctx.scale(dpr, dpr);

  const grad = ctx.createLinearGradient(-size, -size, size, size);
  grad.addColorStop(0, GOLD_LIGHT);
  grad.addColorStop(0.5, GOLD);
  grad.addColorStop(1, GOLD_DEEP);
  ctx.strokeStyle = grad;
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(120,86,40,0.6)";
  ctx.shadowBlur = size * 0.35;

  const arm = size * 0.92;
  const w = Math.max(0.9, size / 9);
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate((Math.PI / 3) * i);
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -arm);
    ctx.stroke();

    ctx.lineWidth = w * 0.8;
    const branches = variant === 0 ? [0.42, 0.68] : variant === 1 ? [0.55] : [0.35, 0.58, 0.78];
    for (const t of branches) {
      const len = arm * (variant === 1 ? 0.34 : 0.26) * (1.1 - t * 0.5);
      const y = -arm * t;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(-len * 0.8, y - len);
      ctx.moveTo(0, y);
      ctx.lineTo(len * 0.8, y - len);
      ctx.stroke();
    }
    if (variant === 1) {
      // pequeño rombo en la punta
      ctx.beginPath();
      ctx.moveTo(0, -arm * 0.8);
      ctx.lineTo(w * 1.6, -arm * 0.9);
      ctx.lineTo(0, -arm);
      ctx.lineTo(-w * 1.6, -arm * 0.9);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }
  // centro
  ctx.shadowBlur = 0;
  ctx.fillStyle = GOLD_LIGHT;
  ctx.beginPath();
  ctx.arc(0, 0, w * 1.1, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

/** Destello dorado suave (bokeh), como las luces de la guirnalda. */
function drawSparkle(size: number, dpr: number): HTMLCanvasElement {
  const px = Math.ceil(size * 2 * dpr) + 2;
  const c = document.createElement("canvas");
  c.width = c.height = px;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
  g.addColorStop(0, "rgba(255,240,205,1)");
  g.addColorStop(0.25, "rgba(232,200,140,0.75)");
  g.addColorStop(1, "rgba(187,149,93,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, px, px);
  return c;
}

export function GoldenSnow() {
  const [enabled, setEnabled] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Diferido: no compite con la carga inicial ni con la intro del logo.
    const id = window.setTimeout(() => setEnabled(shouldShow()), 1200);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const SPRITE_SIZE = 14; // tamaño base del sprite (se escala al dibujar)
    const sprites = [0, 1, 2].map((v) => drawCrystal(SPRITE_SIZE, v, dpr));
    const sparkle = drawSparkle(8, dpr);

    let w = 0;
    let h = 0;
    let flakes: Flake[] = [];

    const makeFlake = (initial: boolean): Flake => {
      const isSparkle = Math.random() < 0.38;
      const depth = Math.random(); // 0 = lejos, 1 = cerca
      const r = isSparkle ? 2 + depth * 3 : 6 + depth * 9;
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : -20 - Math.random() * 60,
        r,
        vy: 9 + depth * 22 + Math.random() * 6, // px/s — muy lento
        swayAmp: 10 + Math.random() * 26,
        swayFreq: 0.15 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.35,
        alpha: isSparkle ? 0.55 + depth * 0.45 : 0.6 + depth * 0.4,
        twinkle: 0.6 + Math.random() * 1.4,
        sprite: isSparkle ? -1 : Math.floor(Math.random() * sprites.length),
      };
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      // Densidad contenida: ~1 copo por cada 38.000 px², entre 12 y 42.
      const target = Math.max(12, Math.min(42, Math.round((w * h) / 38000)));
      if (flakes.length === 0) {
        flakes = Array.from({ length: target }, () => makeFlake(true));
      } else if (flakes.length > target) {
        flakes.length = target;
      } else {
        while (flakes.length < target) flakes.push(makeFlake(true));
      }
    };
    resize();

    let raf = 0;
    let last = performance.now();
    let t = 0;
    let fadeIn = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      fadeIn = Math.min(1, fadeIn + dt / 2.5);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.y += f.vy * dt;
        f.rot += f.vr * dt;
        if (f.y - f.r > h + 10) {
          flakes[i] = makeFlake(false);
          continue;
        }
        const x = f.x + Math.sin(t * f.swayFreq * Math.PI * 2 + f.phase) * f.swayAmp;
        // Desvanecer cerca de los bordes superior e inferior.
        const edge = Math.min(1, (f.y + 20) / 120, (h + 10 - f.y) / 140);
        let a = f.alpha * Math.max(0, edge) * fadeIn;

        if (f.sprite < 0) {
          a *= 0.55 + 0.45 * Math.sin(t * f.twinkle * Math.PI + f.phase);
          if (a <= 0.01) continue;
          ctx.globalAlpha = a;
          const s = f.r * 2;
          ctx.drawImage(sparkle, x - s, f.y - s, s * 2, s * 2);
        } else {
          a *= 0.8 + 0.2 * Math.sin(t * f.twinkle + f.phase);
          if (a <= 0.01) continue;
          ctx.globalAlpha = a;
          ctx.save();
          ctx.translate(x, f.y);
          ctx.rotate(f.rot);
          const s = f.r * ((SPRITE_SIZE * 2 * dpr + 4) / (SPRITE_SIZE * 2 * dpr));
          ctx.drawImage(sprites[f.sprite], -s, -s, s * 2, s * 2);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <canvas ref={canvasRef} className="golden-snow" aria-hidden="true" />;
}
