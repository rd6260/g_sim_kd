import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center">
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
            <span className="gradient-text">QKD</span>{" "}
            <span className="text-[var(--text-primary)]">Simulator</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] mb-3 leading-relaxed max-w-lg mx-auto">
            Simulate quantum key distribution protocols with realistic
            channel models. Explore how noise, loss, and detector
            imperfections affect secure key generation.
          </p>

          <p className="text-sm text-[var(--text-muted)] mb-10 max-w-md mx-auto">
            Choose a protocol below to launch the interactive simulator
            with configurable parameters, Monte Carlo analysis, and live visualization.
          </p>

          {/* Protocol Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-14">
            {/* BB84 Card */}
            <Link href="/simulate" className="group">
              <div className="glass-card p-6 text-left h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-[var(--accent-primary)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="20" fill="none" stroke="white" strokeWidth="3" strokeDasharray="5,5"/>
                      <circle cx="50" cy="50" r="6" fill="white"/>
                      <circle cx="50" cy="25" r="4" fill="white" opacity="0.6"/>
                      <circle cx="50" cy="75" r="4" fill="white" opacity="0.6"/>
                      <circle cx="25" cy="50" r="4" fill="white" opacity="0.6"/>
                      <circle cx="75" cy="50" r="4" fill="white" opacity="0.6"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">BB84</h2>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Discrete Variable</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  Single-photon protocol with rectilinear & diagonal bases. Simulate QBER, sifting, and noise tolerance.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">Qubits</span>
                  <span className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full">Basis Sifting</span>
                  <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">QBER</span>
                </div>
                <div className="mt-4 text-xs font-semibold text-[var(--accent-primary)] flex items-center gap-1 group-hover:gap-2 transition-all">
                  Launch BB84 →
                </div>
              </div>
            </Link>

            {/* GG02 CV-QKD Card */}
            <Link href="/cv-qkd" className="group">
              <div className="glass-card p-6 text-left h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-[var(--accent-cyan)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 100 100">
                      <ellipse cx="50" cy="50" rx="30" ry="30" fill="none" stroke="white" strokeWidth="2" opacity="0.3"/>
                      <ellipse cx="50" cy="50" rx="20" ry="20" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.5"/>
                      <circle cx="50" cy="50" r="5" fill="white"/>
                      <line x1="20" y1="50" x2="80" y2="50" stroke="white" strokeWidth="1" opacity="0.4"/>
                      <line x1="50" y1="20" x2="50" y2="80" stroke="white" strokeWidth="1" opacity="0.4"/>
                      <circle cx="60" cy="38" r="2.5" fill="white" opacity="0.6"/>
                      <circle cx="40" cy="62" r="2.5" fill="white" opacity="0.6"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors">GG02</h2>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Continuous Variable</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  Gaussian-modulated coherent states with homodyne/heterodyne detection. Analyze key rate via Holevo bound.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded-full">Coherent States</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">Gaussian</span>
                  <span className="text-[10px] px-2 py-0.5 bg-teal-50 text-teal-600 rounded-full">Holevo</span>
                </div>
                <div className="mt-4 text-xs font-semibold text-[var(--accent-cyan)] flex items-center gap-1 group-hover:gap-2 transition-all">
                  Launch GG02 →
                </div>
              </div>
            </Link>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-5 text-left">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="4"/></svg>
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Realistic Channel Models</h3>
              <p className="text-xs text-[var(--text-muted)]">Thermal loss, excess noise, dark counts, phase noise, and electronic noise with adjustable parameters.</p>
            </div>
            <div className="glass-card p-5 text-left">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-100 to-emerald-100 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Monte Carlo Analysis</h3>
              <p className="text-xs text-[var(--text-muted)]">Run hundreds of simulations to get statistical distributions of key rates and noise parameters.</p>
            </div>
            <div className="glass-card p-5 text-left">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Live Visualization</h3>
              <p className="text-xs text-[var(--text-muted)]">Watch qubits flow or coherent states scatter in phase space, with real-time metrics and animations.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] py-4">
        <p className="text-center text-xs text-[var(--text-muted)]">
          BB84 (Bennett & Brassard, 1984) • GG02 (Grosshans & Grangier, 2002) • Quantum Key Distribution Protocols
        </p>
      </footer>
    </div>
  );
}
