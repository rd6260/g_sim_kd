'use client';

import { CVSimulationParams, CV_PRESETS, CV_DEFAULT_PARAMS, DetectionMode } from '@/lib/gg02-engine';

interface ParameterPanelProps {
  params: CVSimulationParams;
  onChange: (params: CVSimulationParams) => void;
  onRun: () => void;
  running: boolean;
  numRuns: number;
  onNumRunsChange: (n: number) => void;
}

interface SliderConfig {
  key: keyof CVSimulationParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  tooltip: string;
}

const SLIDERS: SliderConfig[] = [
  { key: 'numSignals', label: 'Signals per Run', min: 100, max: 10000, step: 100, unit: '', tooltip: 'Number of coherent states Alice sends per run' },
  { key: 'modulationVariance', label: 'Modulation Variance (V_A)', min: 1, max: 100, step: 0.5, unit: 'SNU', tooltip: 'Variance of Gaussian modulation in shot-noise units' },
  { key: 'channelTransmittance', label: 'Channel Transmittance (T)', min: 0.01, max: 1.0, step: 0.01, unit: '', tooltip: 'Fraction of signal transmitted through channel (T = 10^(-αL/10))' },
  { key: 'excessNoise', label: 'Excess Noise (ε)', min: 0, max: 0.5, step: 0.001, unit: 'SNU', tooltip: 'Excess noise referred to channel input (untrusted)' },
  { key: 'electronNoise', label: 'Electronic Noise (v_el)', min: 0, max: 0.5, step: 0.01, unit: 'SNU', tooltip: 'Detector electronic noise variance (trusted)' },
  { key: 'detectorEfficiency', label: 'Detector Efficiency (η)', min: 0.01, max: 1.0, step: 0.01, unit: '', tooltip: 'Homodyne/heterodyne detector quantum efficiency' },
  { key: 'reconciliationEff', label: 'Reconciliation Efficiency (β)', min: 0.5, max: 1.0, step: 0.01, unit: '', tooltip: 'Information reconciliation efficiency (Shannon limit = 1.0)' },
];

const PRESET_LABELS: Record<string, { name: string; icon: string }> = {
  ideal: { name: 'Ideal', icon: '✨' },
  standardFiber: { name: 'Standard Fiber', icon: '🔗' },
  noisyUrban: { name: 'Noisy Urban', icon: '🏙️' },
  longHaul: { name: 'Long-haul', icon: '🛰️' },
};

export default function CVParameterPanel({ params, onChange, onRun, running, numRuns, onNumRunsChange }: ParameterPanelProps) {
  const updateParam = (key: keyof CVSimulationParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  const applyPreset = (presetKey: string) => {
    const preset = CV_PRESETS[presetKey];
    if (preset) {
      onChange({ ...CV_DEFAULT_PARAMS, ...preset });
    }
  };

  return (
    <div className="glass-card p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Simulation Parameters
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Configure Gaussian modulation, channel, and detection</p>
        </div>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Presets</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESET_LABELS).map(([key, { name, icon }]) => (
            <button
              key={key}
              className="btn-preset"
              onClick={() => applyPreset(key)}
              disabled={running}
            >
              {icon} {name}
            </button>
          ))}
        </div>
      </div>

      {/* Detection Mode Toggle */}
      <div className="mb-6">
        <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Detection Mode</label>
        <div className="flex gap-2">
          {(['homodyne', 'heterodyne'] as DetectionMode[]).map((m) => (
            <button
              key={m}
              className={`btn-preset ${params.detectionMode === m ? 'active' : ''}`}
              onClick={() => onChange({ ...params, detectionMode: m })}
              disabled={running}
            >
              {m === 'homodyne' ? '🔬 Homodyne' : '🔭 Heterodyne'}
              <span className="text-[10px] text-[var(--text-muted)] ml-1">
                {m === 'homodyne' ? '(X or P)' : '(X and P)'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-6">
        {SLIDERS.map(({ key, label, min, max, step, unit, tooltip }) => (
          <div key={key} className="tooltip" data-tooltip={tooltip}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  className="num-input"
                  value={params[key] as number}
                  min={min}
                  max={max}
                  step={step}
                  disabled={running}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v >= min && v <= max) updateParam(key, v);
                  }}
                />
                {unit && <span className="text-xs text-[var(--text-muted)]">{unit}</span>}
              </div>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={params[key] as number}
              disabled={running}
              onChange={(e) => updateParam(key, parseFloat(e.target.value))}
            />
          </div>
        ))}
      </div>

      {/* Runs + Run button */}
      <div className="flex items-center gap-4 pt-4 border-t border-[var(--card-border)]">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--text-primary)]">Monte Carlo Runs</label>
          <input
            type="number"
            className="num-input"
            value={numRuns}
            min={1}
            max={500}
            disabled={running}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v) && v >= 1 && v <= 500) onNumRunsChange(v);
            }}
          />
        </div>
        <div className="flex-1" />
        <button
          className="btn-primary flex items-center gap-2"
          onClick={onRun}
          disabled={running}
        >
          {running ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83"/>
              </svg>
              Running...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              Run Simulation
            </>
          )}
        </button>
      </div>
    </div>
  );
}
