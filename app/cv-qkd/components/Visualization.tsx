'use client';

import { useEffect, useRef, useState } from 'react';
import { CVSignalEvent } from '@/lib/gg02-engine';

interface VisualizationProps {
  events: CVSignalEvent[];
  isRunning: boolean;
  currentRun: number;
  totalRuns: number;
  completedRuns: number;
  liveKeyRate: number;
  liveMutualInfo: number;
  liveHolevoBound: number;
}

export default function CVVisualization({
  events,
  isRunning,
  currentRun,
  totalRuns,
  completedRuns,
  liveKeyRate,
  liveMutualInfo,
  liveHolevoBound,
}: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [, setTick] = useState(0);
  const particlesRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    color: string; alpha: number; size: number;
  }>>([]);

  // Draw phase-space scatter plot
  useEffect(() => {
    const canvas = phaseCanvasRef.current;
    if (!canvas || events.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement!;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 35, right: 20, bottom: 35, left: 45 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    const cx = pad.left + chartW / 2;
    const cy = pad.top + chartH / 2;

    ctx.clearRect(0, 0, w, h);

    // Title
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText('Phase Space (X vs P Quadratures)', w / 2, 18);

    // Collect data points
    const alicePoints: [number, number][] = [];
    const bobPoints: [number, number][] = [];

    const maxPts = Math.min(events.length, 500);
    for (let i = 0; i < maxPts; i++) {
      const ev = events[i];
      alicePoints.push([ev.aliceX, ev.aliceP]);
      if (ev.bobX !== null && ev.bobP !== null) {
        bobPoints.push([ev.bobX, ev.bobP]);
      } else if (ev.bobX !== null) {
        bobPoints.push([ev.bobX, 0]);
      } else if (ev.bobP !== null) {
        bobPoints.push([0, ev.bobP]);
      }
    }

    // Find scale
    const allX = [...alicePoints.map(p => p[0]), ...bobPoints.map(p => p[0])];
    const allY = [...alicePoints.map(p => p[1]), ...bobPoints.map(p => p[1])];
    const maxAbs = Math.max(
      Math.abs(Math.min(...allX)), Math.abs(Math.max(...allX)),
      Math.abs(Math.min(...allY)), Math.abs(Math.max(...allY)),
      1
    ) * 1.15;

    const scaleX = (v: number) => cx + (v / maxAbs) * (chartW / 2);
    const scaleY = (v: number) => cy - (v / maxAbs) * (chartH / 2);

    // Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    // Axes
    ctx.beginPath();
    ctx.moveTo(pad.left, cy);
    ctx.lineTo(pad.left + chartW, cy);
    ctx.moveTo(cx, pad.top);
    ctx.lineTo(cx, pad.top + chartH);
    ctx.stroke();
    // Grid circles
    ctx.setLineDash([3, 3]);
    for (let r = 0.25; r <= 1; r += 0.25) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * (chartW / 2), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('X quadrature', w / 2, h - 5);
    ctx.save();
    ctx.translate(12, pad.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('P quadrature', 0, 0);
    ctx.restore();

    // Tick marks
    ctx.font = '9px monospace';
    ctx.fillStyle = '#94a3b8';
    const tickVals = [-maxAbs * 0.75, -maxAbs * 0.5, -maxAbs * 0.25, 0, maxAbs * 0.25, maxAbs * 0.5, maxAbs * 0.75];
    for (const v of tickVals) {
      if (Math.abs(v) < 0.01) continue;
      ctx.textAlign = 'center';
      ctx.fillText(v.toFixed(1), scaleX(v), cy + 14);
      ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(1), cx - 6, scaleY(v) + 4);
    }

    // Draw Alice's points (indigo)
    for (const [x, p] of alicePoints) {
      ctx.beginPath();
      ctx.arc(scaleX(x), scaleY(p), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.fill();
    }

    // Draw Bob's points (cyan)
    for (const [x, p] of bobPoints) {
      ctx.beginPath();
      ctx.arc(scaleX(x), scaleY(p), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.fill();
    }

    // Legend
    const legendX = pad.left + 8;
    const legendY = pad.top + 8;
    ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
    ctx.beginPath(); ctx.arc(legendX, legendY, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('Alice', legendX + 8, legendY + 4);

    ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
    ctx.beginPath(); ctx.arc(legendX, legendY + 16, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.fillText('Bob', legendX + 8, legendY + 20);

    // Force re-render
    setTick(t => t + 1);
  }, [events]);

  // Particle animation on background canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;

    if (particlesRef.current.length === 0) {
      const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#0ea5e9', '#10b981'];
      for (let i = 0; i < 30; i++) {
        particlesRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.3 + 0.1,
          size: Math.random() * 3 + 1,
        });
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  if (!isRunning && events.length === 0) return null;

  return (
    <div className="glass-card p-6 animate-fade-in-up relative overflow-hidden">
      {/* Background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.6 }}
      />

      <div className="relative z-10">
        {/* Header with live stats */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-emerald)] animate-pulse-slow" />
            Live Simulation
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--text-muted)]">
              Run <span className="font-mono font-semibold text-[var(--text-primary)]">{completedRuns}</span> / {totalRuns}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar mb-5">
          <div
            className="progress-fill"
            style={{ width: `${totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0}%` }}
          />
        </div>

        {/* Live metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="stat-card text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Secret Key Rate</div>
            <div className="text-xl font-bold font-mono text-[var(--accent-emerald)]">
              {liveKeyRate.toFixed(4)}
            </div>
          </div>
          <div className="stat-card text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">I(A:B)</div>
            <div className="text-xl font-bold font-mono text-[var(--accent-primary)]">
              {liveMutualInfo.toFixed(4)}
            </div>
          </div>
          <div className="stat-card text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">χ(B:E)</div>
            <div className="text-xl font-bold font-mono text-[var(--accent-rose)]">
              {liveHolevoBound.toFixed(4)}
            </div>
          </div>
          <div className="stat-card text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Progress</div>
            <div className="text-xl font-bold font-mono text-[var(--accent-secondary)]">
              {totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Phase-space + Signal flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Phase-space scatter */}
          <div className="bg-[var(--surface-2)] rounded-xl p-3" style={{ height: '300px' }}>
            <canvas ref={phaseCanvasRef} className="w-full h-full" />
          </div>

          {/* Signal flow visualization */}
          <div className="bg-[var(--surface-2)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-xs font-bold">A</div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Alice</span>
              </div>
              <div className="flex-1 mx-4 h-0.5 bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-cyan)] to-[var(--accent-emerald)] rounded opacity-30" />
              <div className="text-xs text-[var(--text-muted)] font-medium px-3 py-1 bg-[var(--surface-1)] rounded-full border border-[var(--card-border)]">
                Gaussian Channel
              </div>
              <div className="flex-1 mx-4 h-0.5 bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-emerald)] to-[var(--accent-primary)] rounded opacity-30" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Bob</span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-emerald)] flex items-center justify-center text-white text-xs font-bold">B</div>
              </div>
            </div>

            {/* Signal rows */}
            <div className="space-y-1 max-h-[230px] overflow-y-auto pr-1">
              {events.slice(0, 40).map((ev, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs font-mono animate-fade-in-up"
                  style={{ animationDelay: `${i * 20}ms`, animationDuration: '0.3s' }}
                >
                  {/* Alice's quadratures */}
                  <div className="flex items-center gap-1 w-28 justify-end text-right">
                    <span className="text-[var(--accent-primary)]">X:{ev.aliceX.toFixed(2)}</span>
                    <span className="text-[var(--accent-secondary)]">P:{ev.aliceP.toFixed(2)}</span>
                  </div>

                  {/* Channel indicator */}
                  <div className="flex-1 flex items-center gap-0.5 px-1">
                    <div className="flex-1 h-0.5 rounded bg-[var(--accent-cyan)]" />
                    <span className="text-[9px] text-[var(--text-muted)]">
                      {ev.bobMeasuredQuad === 'XP' ? 'het' : ev.bobMeasuredQuad.toLowerCase()}
                    </span>
                  </div>

                  {/* Bob's measurement */}
                  <div className="flex items-center gap-1 w-28">
                    {ev.bobX !== null && (
                      <span className="text-[var(--accent-cyan)]">X:{ev.bobX.toFixed(2)}</span>
                    )}
                    {ev.bobP !== null && (
                      <span className="text-[var(--accent-emerald)]">P:{ev.bobP.toFixed(2)}</span>
                    )}
                    {ev.bobX === null && ev.bobP === null && (
                      <span className="text-[var(--text-muted)]">∅</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)]" /> Alice (X,P)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-cyan)]" /> Bob (measured)</span>
          <span>Coherent states: |α⟩ = |x + ip⟩</span>
          <span>Gaussian modulation: x,p ~ N(0, V_A)</span>
        </div>
      </div>
    </div>
  );
}
