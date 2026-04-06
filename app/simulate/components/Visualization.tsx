'use client';

import { useEffect, useRef, useState } from 'react';
import { QubitEvent } from '@/lib/bb84-engine';

interface VisualizationProps {
  events: QubitEvent[];
  isRunning: boolean;
  currentRun: number;
  totalRuns: number;
  completedRuns: number;
  liveQber: number;
  liveKeyRate: number;
}

const BASIS_LABELS = { R: '+', D: '×' };
const STATE_COLORS: Record<string, string> = {
  '|0⟩': '#6366f1',
  '|1⟩': '#8b5cf6',
  '|+⟩': '#06b6d4',
  '|−⟩': '#0ea5e9',
};

export default function Visualization({
  events,
  isRunning,
  currentRun,
  totalRuns,
  completedRuns,
  liveQber,
  liveKeyRate,
}: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const particlesRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    color: string; alpha: number; size: number;
  }>>([]);

  // Animate visible qubit count
  useEffect(() => {
    if (!isRunning || events.length === 0) {
      setVisibleCount(0);
      return;
    }
    const maxVisible = Math.min(events.length, 50);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setVisibleCount(current);
      if (current >= maxVisible) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [events, isRunning]);

  // Particle animation on canvas
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

    // Initialize particles
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

      // Draw particles
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

      // Draw connection lines between nearby particles
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

  const displayEvents = events.slice(0, visibleCount);

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
            <div className="text-xs text-[var(--text-muted)] mb-1">Avg QBER</div>
            <div className="text-xl font-bold font-mono text-[var(--accent-rose)]">
              {(liveQber * 100).toFixed(2)}%
            </div>
          </div>
          <div className="stat-card text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Key Rate</div>
            <div className="text-xl font-bold font-mono text-[var(--accent-emerald)]">
              {liveKeyRate.toFixed(4)}
            </div>
          </div>
          <div className="stat-card text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Completed</div>
            <div className="text-xl font-bold font-mono text-[var(--accent-primary)]">
              {completedRuns}
            </div>
          </div>
          <div className="stat-card text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Progress</div>
            <div className="text-xl font-bold font-mono text-[var(--accent-secondary)]">
              {totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Quantum circuit visualization — Alice → Channel → Bob */}
        <div className="bg-[var(--surface-2)] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-xs font-bold">A</div>
              <span className="text-xs font-medium text-[var(--text-secondary)]">Alice</span>
            </div>
            <div className="flex-1 mx-4 h-0.5 bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-cyan)] to-[var(--accent-emerald)] rounded opacity-30" />
            <div className="text-xs text-[var(--text-muted)] font-medium px-3 py-1 bg-[var(--surface-1)] rounded-full border border-[var(--card-border)]">
              Quantum Channel
            </div>
            <div className="flex-1 mx-4 h-0.5 bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-emerald)] to-[var(--accent-primary)] rounded opacity-30" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Bob</span>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-emerald)] flex items-center justify-center text-white text-xs font-bold">B</div>
            </div>
          </div>

          {/* Qubit flow rows */}
          <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
            {displayEvents.map((ev, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs font-mono animate-fade-in-up"
                style={{ animationDelay: `${i * 30}ms`, animationDuration: '0.3s' }}
              >
                {/* Alice's qubit */}
                <div className="flex items-center gap-1 w-24 justify-end">
                  <span className="text-[var(--text-muted)]">{ev.aliceBit}</span>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: STATE_COLORS[ev.state] || '#6366f1' }}
                  >
                    {BASIS_LABELS[ev.aliceBasis]}
                  </span>
                </div>

                {/* Channel indicator */}
                <div className="flex-1 flex items-center gap-0.5 px-1">
                  <div className={`flex-1 h-0.5 rounded ${ev.channelTransmitted ? 'bg-[var(--accent-cyan)]' : 'bg-[var(--accent-rose)] opacity-40'}`} />
                  {ev.phaseFlipped && <span className="text-[var(--accent-amber)] text-[9px]">φ</span>}
                  {ev.depolarized && <span className="text-[var(--accent-rose)] text-[9px]">D</span>}
                  {ev.darkCount && <span className="text-[var(--text-muted)] text-[9px]">●</span>}
                </div>

                {/* Bob's measurement */}
                <div className="flex items-center gap-1 w-24">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                      ev.bobResult === null ? 'opacity-20' : ''
                    }`}
                    style={{
                      background: ev.basisMatch
                        ? (ev.error ? '#f43f5e' : '#10b981')
                        : '#94a3b8',
                    }}
                  >
                    {BASIS_LABELS[ev.bobBasis]}
                  </span>
                  <span className="text-[var(--text-muted)]">
                    {ev.bobResult !== null ? ev.bobResult : '∅'}
                  </span>
                  {ev.keptInSift && (
                    <span className={`text-[9px] ml-1 px-1 py-0.5 rounded ${ev.error ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {ev.error ? 'ERR' : 'OK'}
                    </span>
                  )}
                  {!ev.basisMatch && ev.bobResult !== null && (
                    <span className="text-[9px] ml-1 px-1 py-0.5 rounded bg-gray-100 text-gray-500">SIFT</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)]" /> Rectilinear (+)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-cyan)]" /> Diagonal (×)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-emerald)]" /> Basis Match</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-rose)]" /> Error</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> Sifted Out</span>
          <span>φ = Phase flip</span>
          <span>D = Depolarized</span>
          <span>● = Dark count</span>
        </div>
      </div>
    </div>
  );
}
