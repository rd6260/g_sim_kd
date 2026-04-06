'use client';

import { useEffect, useRef } from 'react';
import { AggregateResults } from '@/lib/bb84-engine';

interface ResultsReportProps {
  results: AggregateResults;
}

// Lightweight canvas chart renderer
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

  // Title
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.fillText(label, w / 2, 20);

  if (data.length === 0) return;

  // Compute histogram bins
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

  // Grid lines
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

  // Bars
  const barGap = 2;
  const barW = (chartW - barGap * numBins) / numBins;

  for (let i = 0; i < numBins; i++) {
    const barH = maxBin > 0 ? (bins[i] / maxBin) * chartH : 0;
    const x = pad.left + i * (barW + barGap);
    const y = pad.top + chartH - barH;

    // Bar gradient
    const grad = ctx.createLinearGradient(x, y, x, pad.top + chartH);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '40');
    ctx.fillStyle = grad;

    // Rounded top
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

  // X-axis labels
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i <= numBins; i += Math.max(1, Math.floor(numBins / 5))) {
    const val = min + i * binWidth;
    const x = pad.left + i * (barW + barGap);
    ctx.fillText(val.toFixed(3) + unit, x, pad.top + chartH + 16);
  }

  // Y-axis label
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

  // Title
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.fillText(label, w / 2, 20);

  if (data.length === 0) return;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.001;

  // Grid lines
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

  // Area fill
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
  grad.addColorStop(0, color + '30');
  grad.addColorStop(1, color + '05');
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top + chartH);
  for (let i = 0; i < data.length; i++) {
    const x = pad.left + (i / (data.length - 1)) * chartW;
    const y = pad.top + chartH - ((data[i] - min) / range) * chartH;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(pad.left + chartW, pad.top + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  for (let i = 0; i < data.length; i++) {
    const x = pad.left + (i / (data.length - 1)) * chartW;
    const y = pad.top + chartH - ((data[i] - min) / range) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Dots
  for (let i = 0; i < data.length; i++) {
    const x = pad.left + (i / (data.length - 1)) * chartW;
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

  // X-axis
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Run Index', w / 2, h - 6);

  // Y-axis label
  ctx.save();
  ctx.translate(12, pad.top + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

function generateCSV(results: AggregateResults): string {
  const header = 'Run,QBER,SecretKeyRate,SiftedKeyLength\n';
  const rows = results.qberValues.map((q, i) =>
    `${i + 1},${q.toFixed(6)},${results.keyRateValues[i].toFixed(6)},${results.siftedKeyLengths[i]}`
  ).join('\n');
  return header + rows;
}

export default function ResultsReport({ results }: ResultsReportProps) {
  const qberHistRef = useRef<HTMLCanvasElement>(null);
  const keyRateLineRef = useRef<HTMLCanvasElement>(null);
  const qberLineRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (qberHistRef.current) {
        drawHistogram(qberHistRef.current, results.qberValues, 'QBER Distribution', '#f43f5e');
      }
      if (keyRateLineRef.current) {
        drawLineChart(keyRateLineRef.current, results.keyRateValues, 'Secret Key Rate per Run', '#10b981', 'Key Rate');
      }
      if (qberLineRef.current) {
        drawLineChart(qberLineRef.current, results.qberValues, 'QBER per Run', '#f43f5e', 'QBER');
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
    a.download = `bb84_simulation_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const thresholdPercent = (results.noiseToleranceThreshold * 100).toFixed(2);
  const qberAboveThreshold = results.avgQber > results.noiseToleranceThreshold;

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
          <div className="text-xs text-[var(--text-muted)] mb-1">Avg QBER</div>
          <div className="text-2xl font-bold font-mono text-[var(--accent-rose)]">{(results.avgQber * 100).toFixed(2)}%</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">σ = {(results.stdQber * 100).toFixed(3)}%</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-[var(--text-muted)] mb-1">Avg Key Rate</div>
          <div className="text-2xl font-bold font-mono text-[var(--accent-emerald)]">{results.avgKeyRate.toFixed(4)}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">σ = {results.stdKeyRate.toFixed(4)}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-[var(--text-muted)] mb-1">Avg Sifted Key</div>
          <div className="text-2xl font-bold font-mono text-[var(--accent-primary)]">{Math.round(results.avgSiftedKeyLength)}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">of {results.params.numQubits} qubits</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-[var(--text-muted)] mb-1">Transmission η</div>
          <div className="text-2xl font-bold font-mono text-[var(--accent-cyan)]">{(results.avgTransmissionRate * 100).toFixed(2)}%</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">{results.params.fiberDistance} km</div>
        </div>
      </div>

      {/* Noise Tolerance Analysis */}
      <div className={`glass-card-accent p-4 mb-6 ${qberAboveThreshold ? 'border-[var(--accent-rose)]' : ''}`}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Noise Tolerance Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-[var(--text-muted)]">QBER Threshold:</span>
            <span className="ml-2 font-mono font-semibold text-[var(--accent-amber)]">{thresholdPercent}%</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Measured QBER:</span>
            <span className={`ml-2 font-mono font-semibold ${qberAboveThreshold ? 'text-[var(--accent-rose)]' : 'text-[var(--accent-emerald)]'}`}>
              {(results.avgQber * 100).toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Status:</span>
            <span className={`ml-2 font-semibold ${qberAboveThreshold ? 'text-[var(--accent-rose)]' : 'text-[var(--accent-emerald)]'}`}>
              {qberAboveThreshold ? '⚠ Key generation NOT secure' : '✓ Secure key generation possible'}
            </span>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          BB84 can tolerate up to ~{thresholdPercent}% QBER with f(E)={results.params.errorCorrectionEff}. Beyond this threshold, an eavesdropper could have full information about the key.
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--surface-1)] rounded-xl p-4 border border-[var(--card-border)]" style={{ height: '280px' }}>
          <canvas ref={qberHistRef} className="w-full h-full" />
        </div>
        <div className="bg-[var(--surface-1)] rounded-xl p-4 border border-[var(--card-border)]" style={{ height: '280px' }}>
          <canvas ref={keyRateLineRef} className="w-full h-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="bg-[var(--surface-1)] rounded-xl p-4 border border-[var(--card-border)]" style={{ height: '280px' }}>
          <canvas ref={qberLineRef} className="w-full h-full" />
        </div>
      </div>

      {/* Protocol parameters summary */}
      <div className="bg-[var(--surface-2)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Simulation Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div><span className="text-[var(--text-muted)]">Qubits:</span> <span className="font-mono">{results.params.numQubits}</span></div>
          <div><span className="text-[var(--text-muted)]">Runs:</span> <span className="font-mono">{results.runs}</span></div>
          <div><span className="text-[var(--text-muted)]">Distance:</span> <span className="font-mono">{results.params.fiberDistance} km</span></div>
          <div><span className="text-[var(--text-muted)]">Attenuation:</span> <span className="font-mono">{results.params.fiberAttenuation} dB/km</span></div>
          <div><span className="text-[var(--text-muted)]">η_det:</span> <span className="font-mono">{results.params.detectorEfficiency}</span></div>
          <div><span className="text-[var(--text-muted)]">Dark Count:</span> <span className="font-mono">{results.params.darkCountProb}</span></div>
          <div><span className="text-[var(--text-muted)]">Phase Noise:</span> <span className="font-mono">{results.params.phaseNoiseProb}</span></div>
          <div><span className="text-[var(--text-muted)]">Depolarizing:</span> <span className="font-mono">{results.params.depolarizingProb}</span></div>
        </div>
      </div>
    </div>
  );
}
