'use client';

import { SimulationParams, PRESETS, DEFAULT_PARAMS } from '@/lib/bb84-engine';

interface ParameterPanelProps {
  params: SimulationParams;
  onChange: (params: SimulationParams) => void;
  onRun: () => void;
  running: boolean;
  numRuns: number;
  onNumRunsChange: (n: number) => void;
}

interface SliderConfig {
  key: keyof SimulationParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  tooltip: string;
}

const SLIDERS: SliderConfig[] = [
  { key: 'numQubits', label: 'Qubits per Run', min: 100, max: 10000, step: 100, unit: '', tooltip: 'Number of qubits Alice sends per simulation run' },
  { key: 'fiberDistance', label: 'Fiber Distance', min: 0, max: 200, step: 1, unit: 'km', tooltip: 'Length of the quantum channel fiber' },
  { key: 'fiberAttenuation', label: 'Fiber Attenuation', min: 0.1, max: 1.0, step: 0.01, unit: 'dB/km', tooltip: 'Signal loss per km of fiber (typical: 0.2 dB/km)' },
  { key: 'detectorEfficiency', label: 'Detector Efficiency', min: 0.01, max: 1.0, step: 0.01, unit: '', tooltip: 'Probability of detector registering a photon (η_det)' },
  { key: 'darkCountProb', label: 'Dark Count Rate', min: 0, max: 0.1, step: 0.0001, unit: '', tooltip: 'Per-pulse probability of a detector dark count' },
  { key: 'phaseNoiseProb', label: 'Phase Noise', min: 0, max: 0.5, step: 0.01, unit: '', tooltip: 'Probability of phase flip in the channel' },
  { key: 'depolarizingProb', label: 'Depolarizing Noise', min: 0, max: 0.5, step: 0.01, unit: '', tooltip: 'Probability of complete state depolarization' },
  { key: 'errorCorrectionEff', label: 'Error Correction f(E)', min: 1.0, max: 1.5, step: 0.01, unit: '', tooltip: 'Error correction efficiency factor (Shannon limit = 1.0)' },
];

const PRESET_LABELS: Record<string, { name: string; icon: string }> = {
  ideal: { name: 'Ideal', icon: '✨' },
  standardFiber: { name: 'Standard Fiber', icon: '🔗' },
  noisyUrban: { name: 'Noisy Urban', icon: '🏙️' },
  longHaul: { name: 'Long-haul', icon: '🛰️' },
};

export default function ParameterPanel({ params, onChange, onRun, running, numRuns, onNumRunsChange }: ParameterPanelProps) {
  const updateParam = (key: keyof SimulationParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      onChange({ ...DEFAULT_PARAMS, ...preset });
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
          <p className="text-sm text-[var(--text-muted)] mt-1">Configure the quantum channel and protocol settings</p>
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
                  value={params[key]}
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
              value={params[key]}
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
