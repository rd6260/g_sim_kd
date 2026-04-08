'use client';

import { useState, useCallback, useRef } from 'react';
import { CVSimulationParams, CV_DEFAULT_PARAMS, runCVSimulation, aggregateCVResults, CVAggregateResults, CVSignalEvent } from '@/lib/gg02-engine';
import CVParameterPanel from './components/ParameterPanel';
import CVVisualization from './components/Visualization';
import CVResultsReport from './components/ResultsReport';

export default function CVQKDPage() {
  const [params, setParams] = useState<CVSimulationParams>(CV_DEFAULT_PARAMS);
  const [numRuns, setNumRuns] = useState(10);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [liveKeyRate, setLiveKeyRate] = useState(0);
  const [liveMutualInfo, setLiveMutualInfo] = useState(0);
  const [liveHolevoBound, setLiveHolevoBound] = useState(0);
  const [liveEvents, setLiveEvents] = useState<CVSignalEvent[]>([]);
  const [results, setResults] = useState<CVAggregateResults | null>(null);
  const cancelRef = useRef(false);

  const runSimulation = useCallback(async () => {
    setRunning(true);
    setCompleted(0);
    setResults(null);
    setLiveKeyRate(0);
    setLiveMutualInfo(0);
    setLiveHolevoBound(0);
    setLiveEvents([]);
    cancelRef.current = false;

    const allResults = [];
    let cumulativeKeyRate = 0;
    let cumulativeMutualInfo = 0;
    let cumulativeHolevo = 0;

    for (let i = 0; i < numRuns; i++) {
      if (cancelRef.current) break;

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = runCVSimulation(params);
          allResults.push(result);

          cumulativeKeyRate += result.secretKeyRate;
          cumulativeMutualInfo += result.mutualInfoAB;
          cumulativeHolevo += result.holevoBoundBE;

          setCompleted(i + 1);
          setLiveKeyRate(cumulativeKeyRate / (i + 1));
          setLiveMutualInfo(cumulativeMutualInfo / (i + 1));
          setLiveHolevoBound(cumulativeHolevo / (i + 1));

          // Show events from latest run (limit for perf)
          setLiveEvents(result.events.slice(0, 100));

          resolve();
        }, 10);
      });
    }

    if (!cancelRef.current && allResults.length > 0) {
      const agg = aggregateCVResults(allResults);
      setResults(agg);
    }

    setRunning(false);
  }, [params, numRuns]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--card-border)] bg-[var(--surface-1)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 text-[var(--text-primary)] hover:opacity-80 transition-opacity">
              <svg width="28" height="28" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="cvqg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4"/>
                    <stop offset="100%" stopColor="#10b981"/>
                  </linearGradient>
                </defs>
                {/* Gaussian cloud - representing coherent states */}
                <ellipse cx="50" cy="50" rx="35" ry="35" fill="none" stroke="url(#cvqg)" strokeWidth="2" opacity="0.3"/>
                <ellipse cx="50" cy="50" rx="25" ry="25" fill="none" stroke="url(#cvqg)" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5"/>
                <ellipse cx="50" cy="50" rx="15" ry="15" fill="none" stroke="url(#cvqg)" strokeWidth="1.5" opacity="0.7"/>
                <circle cx="50" cy="50" r="5" fill="url(#cvqg)"/>
                {/* Quadrature axes */}
                <line x1="15" y1="50" x2="85" y2="50" stroke="url(#cvqg)" strokeWidth="1" opacity="0.4"/>
                <line x1="50" y1="15" x2="50" y2="85" stroke="url(#cvqg)" strokeWidth="1" opacity="0.4"/>
                {/* Scattered coherent state dots */}
                <circle cx="62" cy="35" r="3" fill="#06b6d4" opacity="0.6"/>
                <circle cx="38" cy="65" r="3" fill="#10b981" opacity="0.6"/>
                <circle cx="68" cy="58" r="2.5" fill="#06b6d4" opacity="0.5"/>
                <circle cx="32" cy="38" r="2.5" fill="#10b981" opacity="0.5"/>
              </svg>
              <div>
                <h1 className="text-base font-bold gradient-text-cv">GG02 CV-QKD Simulator</h1>
                <p className="text-[10px] text-[var(--text-muted)] -mt-0.5">Continuous-Variable QKD</p>
              </div>
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <a href="/simulate" className="btn-preset text-xs py-1 px-3">BB84 →</a>
            <span className="px-2 py-1 bg-[var(--surface-2)] rounded-md font-mono">v1.0</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Parameter Panel */}
        <CVParameterPanel
          params={params}
          onChange={setParams}
          onRun={runSimulation}
          running={running}
          numRuns={numRuns}
          onNumRunsChange={setNumRuns}
        />

        {/* Live Visualization */}
        {(running || (completed > 0 && !results)) && (
          <CVVisualization
            events={liveEvents}
            isRunning={running}
            currentRun={completed}
            totalRuns={numRuns}
            completedRuns={completed}
            liveKeyRate={liveKeyRate}
            liveMutualInfo={liveMutualInfo}
            liveHolevoBound={liveHolevoBound}
          />
        )}

        {/* Results Report */}
        {results && (
          <CVResultsReport results={results} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-[var(--text-muted)]">
          <p>GG02 Protocol Simulation • Based on Grosshans & Grangier (2002)</p>
          <p className="mt-1">Gaussian modulation • Homodyne/Heterodyne detection • Reverse reconciliation • Holevo bound analysis</p>
        </div>
      </footer>
    </div>
  );
}
