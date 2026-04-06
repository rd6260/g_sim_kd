'use client';

import { useState, useCallback, useRef } from 'react';
import { SimulationParams, DEFAULT_PARAMS, runSingleSimulation, aggregateResults, AggregateResults, QubitEvent } from '@/lib/bb84-engine';
import ParameterPanel from './components/ParameterPanel';
import Visualization from './components/Visualization';
import ResultsReport from './components/ResultsReport';

export default function SimulatePage() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [numRuns, setNumRuns] = useState(10);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [liveQber, setLiveQber] = useState(0);
  const [liveKeyRate, setLiveKeyRate] = useState(0);
  const [liveEvents, setLiveEvents] = useState<QubitEvent[]>([]);
  const [results, setResults] = useState<AggregateResults | null>(null);
  const cancelRef = useRef(false);

  const runSimulation = useCallback(async () => {
    setRunning(true);
    setCompleted(0);
    setResults(null);
    setLiveQber(0);
    setLiveKeyRate(0);
    setLiveEvents([]);
    cancelRef.current = false;

    const allResults = [];
    let cumulativeQber = 0;
    let cumulativeKeyRate = 0;

    for (let i = 0; i < numRuns; i++) {
      if (cancelRef.current) break;

      // Run simulation in chunks to keep UI responsive
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = runSingleSimulation(params);
          allResults.push(result);

          cumulativeQber += result.qber;
          cumulativeKeyRate += result.secretKeyRate;

          setCompleted(i + 1);
          setLiveQber(cumulativeQber / (i + 1));
          setLiveKeyRate(cumulativeKeyRate / (i + 1));

          // Show events from the latest run (limit to 50 for perf)
          setLiveEvents(result.events.slice(0, 50));

          resolve();
        }, 10);
      });
    }

    if (!cancelRef.current && allResults.length > 0) {
      const agg = aggregateResults(allResults);
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
                  <linearGradient id="qg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#06b6d4"/>
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="none" stroke="url(#qg)" strokeWidth="3"/>
                <circle cx="50" cy="50" r="20" fill="none" stroke="url(#qg)" strokeWidth="2" strokeDasharray="5,5"/>
                <circle cx="50" cy="50" r="6" fill="url(#qg)"/>
                <circle cx="50" cy="20" r="4" fill="#6366f1" opacity="0.6"/>
                <circle cx="50" cy="80" r="4" fill="#06b6d4" opacity="0.6"/>
                <circle cx="20" cy="50" r="4" fill="#8b5cf6" opacity="0.6"/>
                <circle cx="80" cy="50" r="4" fill="#10b981" opacity="0.6"/>
              </svg>
              <div>
                <h1 className="text-base font-bold gradient-text">BB84 QKD Simulator</h1>
                <p className="text-[10px] text-[var(--text-muted)] -mt-0.5">Quantum Key Distribution</p>
              </div>
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="px-2 py-1 bg-[var(--surface-2)] rounded-md font-mono">v1.0</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Parameter Panel */}
        <ParameterPanel
          params={params}
          onChange={setParams}
          onRun={runSimulation}
          running={running}
          numRuns={numRuns}
          onNumRunsChange={setNumRuns}
        />

        {/* Live Visualization */}
        {(running || (completed > 0 && !results)) && (
          <Visualization
            events={liveEvents}
            isRunning={running}
            currentRun={completed}
            totalRuns={numRuns}
            completedRuns={completed}
            liveQber={liveQber}
            liveKeyRate={liveKeyRate}
          />
        )}

        {/* Results Report */}
        {results && (
          <ResultsReport results={results} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-[var(--text-muted)]">
          <p>BB84 Protocol Simulation • Based on Bennett & Brassard (1984)</p>
          <p className="mt-1">Thermal-loss channels • Phase noise • Dark counts • Depolarizing noise</p>
        </div>
      </footer>
    </div>
  );
}
