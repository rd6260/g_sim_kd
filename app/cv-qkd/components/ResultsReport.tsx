'use client';

import { useEffect, useRef } from 'react';
import { CVAggregateResults } from '@/lib/gg02-engine';

interface ResultsReportProps {
  results: CVAggregateResults;
}

function drawHistogram(
  canvas: HTMLCanvasElement,
  data: number[],
  label: string,
  color: string,
  unit: string = ''
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement!.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const pad = { top: 30, right: 20, bottom: 40, left: 55 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.fillText(label, w / 2, 20);

  if (data.length === 0) return;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.001;
  const numBins = Math.min(20, Math.max(5, Math.ceil(Math.sqrt(data.length))));
  const binWidth = range / numBins;
  const bins = new Array(numBins).fill(0);

  for (const v of data) {
    const idx = Math.min(numBins - 1, Math.floor((v - min) / binWidth));
    bins[idx]++;
  }

  const maxBin = Math.max(...bins);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH - (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round((maxBin * i) / 4).toString(), pad.left - 8, y + 4);
  }

  const barGap = 2;
  const barW = (chartW - barGap * numBins) / numBins;

  for (let i = 0; i < numBins; i++) {
    const barH = maxBin > 0 ? (bins[i] / maxBin) * chartH : 0;
    const x = pad.left + i * (barW + barGap);
    const y = pad.top + chartH - barH;

    const grad = ctx.createLinearGradient(x, y, x, pad.top + chartH);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '40');
    ctx.fillStyle = grad;

    const radius = Math.min(4, barW / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + barW - radius, y);
    ctx.arcTo(x + barW, y, x + barW, y + radius, radius);
    ctx.lineTo(x + barW, pad.top + chartH);
    ctx.lineTo(x, pad.top + chartH);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.fill();
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i <= numBins; i += Math.max(1, Math.floor(numBins / 5))) {
    const val = min + i * binWidth;
    const x = pad.left + i * (barW + barGap);
    ctx.fillText(val.toFixed(3) + unit, x, pad.top + chartH + 16);
  }

  ctx.save();
  ctx.translate(12, pad.top + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Count', 0, 0);
  ctx.restore();
}

function drawLineChart(
  canvas: HTMLCanvasElement,
  data: number[],
  label: string,
  color: string,
  yLabel: string = ''
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement!.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const pad = { top: 30, right: 20, bottom: 40, left: 55 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.fillText(label, w / 2, 20);

  if (data.length === 0) return;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.001;

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH - (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    const val = min + (range * i) / 4;
    ctx.fillText(val.toFixed(4), pad.left - 8, y + 4);
  }

  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
  grad.addColorStop(0, color + '30');
  grad.addColorStop(1, color + '05');
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top + chartH);
  for (let i = 0; i < data.length; i++) {
    const x = pad.left + (i / Math.max(1, data.length - 1)) * chartW;
    const y = pad.top + chartH - ((data[i] - min) / range) * chartH;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(pad.left + chartW, pad.top + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  for (let i = 0; i < data.length; i++) {
    const x = pad.left + (i / Math.max(1, data.length - 1)) * chartW;
    const y = pad.top + chartH - ((data[i] - min) / range) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  for (let i = 0; i < data.length; i++) {
    const x = pad.left + (i / Math.max(1, data.length - 1)) * chartW;
    const y = pad.top + chartH - ((data[i] - min) / range) * chartH;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Run Index', w / 2, h - 6);

  ctx.save();
  ctx.translate(12, pad.top + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

/** Draw phase-space constellation from last run events */
function drawConstellation(
  canvas: HTMLCanvasElement,
  events: { aliceX: number; aliceP: number; bobX: number | null; bobP: number | null }[]
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement!.getBoundingClientRect();
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

  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.fillText('Phase Space Constellation (Final Run)', w / 2, 18);

  // Collect all relevant points
  const alicePoints: [number, number][] = [];
  const bobPoints: [number, number][] = [];
  const maxPts = Math.min(events.length, 800);

  for (let i = 0; i < maxPts; i++) {
    const ev = events[i];
    alicePoints.push([ev.aliceX, ev.aliceP]);
    if (ev.bobX !== null && ev.bobP !== null) {
      bobPoints.push([ev.bobX, ev.bobP]);
    }
  }

  const allVals = [
    ...alicePoints.flat(),
    ...bobPoints.flat(),
  ];
  const maxAbs = Math.max(...allVals.map(Math.abs), 1) * 1.15;

  const scaleX = (v: number) => cx + (v / maxAbs) * (chartW / 2);
  const scaleY = (v: number) => cy - (v / maxAbs) * (chartH / 2);

  // Grid
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, cy);
  ctx.lineTo(pad.left + chartW, cy);
  ctx.moveTo(cx, pad.top);
  ctx.lineTo(cx, pad.top + chartH);
  ctx.stroke();

  ctx.setLineDash([3, 3]);
  for (let r = 0.25; r <= 1; r += 0.25) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (chartW / 2), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Labels
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('X', w - 10, cy + 4);
  ctx.fillText('P', cx + 4, pad.top - 5);

  // Alice
  for (const [x, p] of alicePoints) {
    ctx.beginPath();
    ctx.arc(scaleX(x), scaleY(p), 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.fill();
  }

  // Bob
  for (const [x, p] of bobPoints) {
    ctx.beginPath();
    ctx.arc(scaleX(x), scaleY(p), 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.fill();
  }

  // Legend
  const lx = pad.left + 8;
  const ly = pad.top + 8;
  ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
  ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#64748b'; ctx.font = '10px system-ui'; ctx.textAlign = 'left';
  ctx.fillText('Alice', lx + 8, ly + 4);
  ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
  ctx.beginPath(); ctx.arc(lx, ly + 16, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#64748b';
  ctx.fillText('Bob', lx + 8, ly + 20);
}

function generateCSV(results: CVAggregateResults): string {
  const header = 'Run,SecretKeyRate,MutualInfo,HolevoBound,EstExcessNoise\n';
  const rows = results.keyRateValues.map((k, i) =>
    `${i + 1},${k.toFixed(6)},${results.mutualInfoValues[i].toFixed(6)},${results.holevoBoundValues[i].toFixed(6)},${results.excessNoiseValues[i].toFixed(6)}`
  ).join('\n');
  return header + rows;
}

export default function CVResultsReport({ results }: ResultsReportProps) {
  const keyRateHistRef = useRef<HTMLCanvasElement>(null);
  const keyRateLineRef = useRef<HTMLCanvasElement>(null);
  const excessNoiseLineRef = useRef<HTMLCanvasElement>(null);
  const constellationRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (keyRateHistRef.current) {
        drawHistogram(keyRateHistRef.current, results.keyRateValues, 'Secret Key Rate Distribution', '#10b981');
      }
      if (keyRateLineRef.current) {
        drawLineChart(keyRateLineRef.current, results.keyRateValues, 'Secret Key Rate per Run', '#10b981', 'Key Rate');
      }
      if (excessNoiseLineRef.current) {
        drawLineChart(excessNoiseLineRef.current, results.excessNoiseValues, 'Estimated Excess Noise per Run', '#f59e0b', 'ε (SNU)');
      }
      if (constellationRef.current) {
        drawConstellation(constellationRef.current, results.lastRunEvents);
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [results]);

  const downloadCSV = () => {
    const csv = generateCSV(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gg02_cvqkd_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const noiseAboveThreshold = results.avgExcessNoise > results.tolerableExcessNoise;

  return (
    <div className="glass-card p-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Simulation Report
        </h2>
        <button className="btn-preset flex items-center gap-1.5" onClick={downloadCSV}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download CSV
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="stat-card">
          <div className="text-xs text-[var(--text-muted)] mb-1">Avg Key Rate</div>
          <div className="text-2xl font-bold font-mono text-[var(--accent-emerald)]">{results.avgKeyRate.toFixed(4)}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">σ = {results.stdKeyRate.toFixed(4)}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-[var(--text-muted)] mb-1">Avg I(A:B)</div>
          <div className="text-2xl font-bold font-mono text-[var(--accent-primary)]">{results.avgMutualInfo.toFixed(4)}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">σ = {results.stdMutualInfo.toFixed(4)}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-[var(--text-muted)] mb-1">Avg χ(B:E)</div>
          <div className="text-2xl font-bold font-mono text-[var(--accent-rose)]">{results.avgHolevoBound.toFixed(4)}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">σ = {results.stdHolevoBound.toFixed(4)}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-[var(--text-muted)] mb-1">Transmittance η</div>
          <div className="text-2xl font-bold font-mono text-[var(--accent-cyan)]">{(results.avgTransmittance * 100).toFixed(1)}%</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">T = {results.params.channelTransmittance}</div>
        </div>
      </div>

      {/* Security Analysis */}
      <div className={`glass-card-accent p-4 mb-6 ${noiseAboveThreshold ? 'border-[var(--accent-rose)]' : ''}`}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Security Analysis — Excess Noise Tolerance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-[var(--text-muted)]">Tolerable ε:</span>
            <span className="ml-2 font-mono font-semibold text-[var(--accent-amber)]">{results.tolerableExcessNoise.toFixed(4)} SNU</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Estimated ε:</span>
            <span className={`ml-2 font-mono font-semibold ${noiseAboveThreshold ? 'text-[var(--accent-rose)]' : 'text-[var(--accent-emerald)]'}`}>
              {results.avgExcessNoise.toFixed(4)} SNU
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Status:</span>
            <span className={`ml-2 font-semibold ${noiseAboveThreshold ? 'text-[var(--accent-rose)]' : 'text-[var(--accent-emerald)]'}`}>
              {noiseAboveThreshold ? '⚠ Key generation NOT secure' : '✓ Secure key generation possible'}
            </span>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          GG02 with reverse reconciliation (β={results.params.reconciliationEff}) tolerates up to ε≈{results.tolerableExcessNoise.toFixed(4)} SNU.
          Beyond this, Eve&apos;s Holevo information χ(B:E) exceeds β·I(A:B).
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--surface-1)] rounded-xl p-4 border border-[var(--card-border)]" style={{ height: '280px' }}>
          <canvas ref={keyRateHistRef} className="w-full h-full" />
        </div>
        <div className="bg-[var(--surface-1)] rounded-xl p-4 border border-[var(--card-border)]" style={{ height: '280px' }}>
          <canvas ref={keyRateLineRef} className="w-full h-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--surface-1)] rounded-xl p-4 border border-[var(--card-border)]" style={{ height: '280px' }}>
          <canvas ref={excessNoiseLineRef} className="w-full h-full" />
        </div>
        <div className="bg-[var(--surface-1)] rounded-xl p-4 border border-[var(--card-border)]" style={{ height: '280px' }}>
          <canvas ref={constellationRef} className="w-full h-full" />
        </div>
      </div>

      {/* Key Rate Formula */}
      <div className="glass-card-accent p-4 mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Key Rate Formula</h3>
        <div className="text-xs text-[var(--text-secondary)] space-y-1 font-mono">
          <p>K = β · I(A:B) − χ(B:E)</p>
          <p>K = {results.params.reconciliationEff} × {results.avgMutualInfo.toFixed(4)} − {results.avgHolevoBound.toFixed(4)} = {results.avgKeyRate.toFixed(4)} bits/symbol</p>
        </div>
      </div>

      {/* Simulation Configuration */}
      <div className="bg-[var(--surface-2)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Simulation Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div><span className="text-[var(--text-muted)]">Signals:</span> <span className="font-mono">{results.params.numSignals}</span></div>
          <div><span className="text-[var(--text-muted)]">Runs:</span> <span className="font-mono">{results.runs}</span></div>
          <div><span className="text-[var(--text-muted)]">V_A:</span> <span className="font-mono">{results.params.modulationVariance} SNU</span></div>
          <div><span className="text-[var(--text-muted)]">T:</span> <span className="font-mono">{results.params.channelTransmittance}</span></div>
          <div><span className="text-[var(--text-muted)]">ε:</span> <span className="font-mono">{results.params.excessNoise} SNU</span></div>
          <div><span className="text-[var(--text-muted)]">v_el:</span> <span className="font-mono">{results.params.electronNoise} SNU</span></div>
          <div><span className="text-[var(--text-muted)]">η_det:</span> <span className="font-mono">{results.params.detectorEfficiency}</span></div>
          <div><span className="text-[var(--text-muted)]">Detection:</span> <span className="font-mono">{results.params.detectionMode}</span></div>
          <div><span className="text-[var(--text-muted)]">β:</span> <span className="font-mono">{results.params.reconciliationEff}</span></div>
        </div>
      </div>
    </div>
  );
}
