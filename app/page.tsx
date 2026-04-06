import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          {/* Quantum atom icon */}
          <div className="flex justify-center mb-8">
            <svg width="80" height="80" viewBox="0 0 100 100" className="animate-pulse-slow">
              <defs>
                <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="50%" stopColor="#8b5cf6"/>
                  <stop offset="100%" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#heroGrad)" strokeWidth="2" opacity="0.3"/>
              <ellipse cx="50" cy="50" rx="45" ry="18" fill="none" stroke="url(#heroGrad)" strokeWidth="1.5" opacity="0.4"/>
              <ellipse cx="50" cy="50" rx="18" ry="45" fill="none" stroke="url(#heroGrad)" strokeWidth="1.5" opacity="0.4"/>
              <ellipse cx="50" cy="50" rx="45" ry="18" fill="none" stroke="url(#heroGrad)" strokeWidth="1.5" opacity="0.3" transform="rotate(60, 50, 50)"/>
              <ellipse cx="50" cy="50" rx="18" ry="45" fill="none" stroke="url(#heroGrad)" strokeWidth="1.5" opacity="0.3" transform="rotate(60, 50, 50)"/>
              <circle cx="50" cy="50" r="8" fill="url(#heroGrad)"/>
              <circle cx="50" cy="5" r="4" fill="#6366f1" opacity="0.7"/>
              <circle cx="50" cy="95" r="4" fill="#06b6d4" opacity="0.7"/>
              <circle cx="89" cy="72" r="4" fill="#8b5cf6" opacity="0.7"/>
              <circle cx="11" cy="28" r="4" fill="#10b981" opacity="0.7"/>
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            <span className="gradient-text">BB84 QKD</span>{" "}
            <span className="text-[var(--text-primary)]">Simulator</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] mb-3 leading-relaxed max-w-lg mx-auto">
            Simulate the BB84 quantum key distribution protocol with realistic
            channel models. Explore how thermal loss, phase noise, and detector
            imperfections affect secure key generation.
          </p>

          <p className="text-sm text-[var(--text-muted)] mb-8 max-w-md mx-auto">
            Model depolarizing channels, dark counts, and fiber attenuation.
            Compare QBER, secret key rates, and noise tolerance thresholds
            across different configurations.
          </p>

          <Link href="/simulate">
            <button className="btn-primary text-base px-10 py-3.5 quantum-glow">
              Launch Simulator →
            </button>
          </Link>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-14">
            <div className="glass-card p-5 text-left">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="4"/></svg>
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Realistic Channel Models</h3>
              <p className="text-xs text-[var(--text-muted)]">Thermal loss, phase noise, dark counts, and depolarizing noise with adjustable parameters.</p>
            </div>
            <div className="glass-card p-5 text-left">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-100 to-emerald-100 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Monte Carlo Analysis</h3>
              <p className="text-xs text-[var(--text-muted)]">Run hundreds of simulations to get statistical distributions of QBER and key rates.</p>
            </div>
            <div className="glass-card p-5 text-left">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Live Visualization</h3>
              <p className="text-xs text-[var(--text-muted)]">Watch qubits flow through the channel in real-time with basis matching and sifting animations.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] py-4">
        <p className="text-center text-xs text-[var(--text-muted)]">
          Based on Bennett & Brassard (1984) • Quantum Key Distribution Protocol
        </p>
      </footer>
    </div>
  );
}
