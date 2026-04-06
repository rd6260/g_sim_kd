// BB84 QKD Protocol Simulation Engine
// Implements the complete BB84 protocol with configurable noise models

export interface SimulationParams {
  numQubits: number;
  fiberDistance: number;       // km
  fiberAttenuation: number;   // dB/km
  detectorEfficiency: number; // 0-1
  darkCountProb: number;      // per-pulse dark count probability
  phaseNoiseProb: number;     // probability of phase flip
  depolarizingProb: number;   // probability of complete depolarization
  errorCorrectionEff: number; // f(E), typically ~1.16
}

export interface QubitEvent {
  index: number;
  aliceBit: 0 | 1;
  aliceBasis: 'R' | 'D';     // Rectilinear (+) or Diagonal (×)
  state: string;              // |0⟩, |1⟩, |+⟩, |−⟩
  channelTransmitted: boolean;
  phaseFlipped: boolean;
  depolarized: boolean;
  darkCount: boolean;
  bobBasis: 'R' | 'D';
  bobResult: 0 | 1 | null;   // null if photon lost
  basisMatch: boolean;
  keptInSift: boolean;
  error: boolean;             // after sifting, does bob's bit differ?
}

export interface SimulationResult {
  params: SimulationParams;
  events: QubitEvent[];
  rawKeyLength: number;
  siftedKeyLength: number;
  qber: number;
  secretKeyRate: number;
  transmissionRate: number;
  detectedPhotons: number;
  aliceKey: number[];
  bobKey: number[];
  noiseToleranceThreshold: number;
}

// Binary entropy function H₂(x)
function binaryEntropy(x: number): number {
  if (x <= 0 || x >= 1) return 0;
  return -x * Math.log2(x) - (1 - x) * Math.log2(1 - x);
}

// Channel transmission probability
function channelTransmission(params: SimulationParams): number {
  const { fiberDistance, fiberAttenuation, detectorEfficiency } = params;
  return detectorEfficiency * Math.pow(10, -fiberAttenuation * fiberDistance / 10);
}

// Compute secret key rate from QBER
function computeKeyRate(qber: number, errorCorrectionEff: number): number {
  if (qber >= 0.5) return 0;
  const h2e = binaryEntropy(qber);
  const rate = Math.max(0, 1 - errorCorrectionEff * h2e - h2e);
  return rate;
}

// Find noise tolerance threshold (QBER at which key rate = 0)
function findNoiseThreshold(errorCorrectionEff: number): number {
  let low = 0, high = 0.5;
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const rate = computeKeyRate(mid, errorCorrectionEff);
    if (rate > 0) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// State labels for visualization
const RECTILINEAR_STATES = ['|0⟩', '|1⟩'] as const;
const DIAGONAL_STATES = ['|+⟩', '|−⟩'] as const;

export function runSingleSimulation(params: SimulationParams): SimulationResult {
  const eta = channelTransmission(params);
  const events: QubitEvent[] = [];
  const aliceKey: number[] = [];
  const bobKey: number[] = [];
  let detectedPhotons = 0;

  for (let i = 0; i < params.numQubits; i++) {
    // Alice: random bit and basis
    const aliceBit = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;
    const aliceBasis: 'R' | 'D' = Math.random() < 0.5 ? 'R' : 'D';
    const state = aliceBasis === 'R'
      ? RECTILINEAR_STATES[aliceBit]
      : DIAGONAL_STATES[aliceBit];

    // Channel: transmission loss
    const channelTransmitted = Math.random() < eta;

    // Channel: phase noise (phase flip)
    const phaseFlipped = channelTransmitted && Math.random() < params.phaseNoiseProb;

    // Channel: depolarizing noise
    const depolarized = channelTransmitted && Math.random() < params.depolarizingProb;

    // Dark count: detector fires even without photon
    const darkCount = !channelTransmitted && Math.random() < params.darkCountProb;

    // Bob: random basis
    const bobBasis: 'R' | 'D' = Math.random() < 0.5 ? 'R' : 'D';

    // Bob's measurement result
    let bobResult: 0 | 1 | null = null;

    if (channelTransmitted || darkCount) {
      detectedPhotons++;

      if (darkCount && !channelTransmitted) {
        // Dark count: completely random result
        bobResult = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;
      } else if (depolarized) {
        // Depolarized: random result regardless of basis
        bobResult = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;
      } else if (bobBasis === aliceBasis) {
        // Matching basis: correct result unless phase flipped
        if (phaseFlipped) {
          bobResult = (aliceBit === 0 ? 1 : 0) as 0 | 1;
        } else {
          bobResult = aliceBit;
        }
      } else {
        // Mismatched basis: random result
        bobResult = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;
      }
    }

    const basisMatch = aliceBasis === bobBasis;
    const keptInSift = basisMatch && bobResult !== null;
    const error = keptInSift && bobResult !== aliceBit;

    if (keptInSift) {
      aliceKey.push(aliceBit);
      bobKey.push(bobResult!);
    }

    events.push({
      index: i,
      aliceBit,
      aliceBasis,
      state,
      channelTransmitted,
      phaseFlipped,
      depolarized,
      darkCount,
      bobBasis,
      bobResult,
      basisMatch,
      keptInSift,
      error,
    });
  }

  // Calculate QBER
  const siftedKeyLength = aliceKey.length;
  let errorCount = 0;
  for (let i = 0; i < siftedKeyLength; i++) {
    if (aliceKey[i] !== bobKey[i]) errorCount++;
  }
  const qber = siftedKeyLength > 0 ? errorCount / siftedKeyLength : 0;

  // Secret key rate
  const secretKeyRate = computeKeyRate(qber, params.errorCorrectionEff);

  // Noise tolerance threshold
  const noiseToleranceThreshold = findNoiseThreshold(params.errorCorrectionEff);

  return {
    params,
    events,
    rawKeyLength: params.numQubits,
    siftedKeyLength,
    qber,
    secretKeyRate,
    transmissionRate: eta,
    detectedPhotons,
    aliceKey,
    bobKey,
    noiseToleranceThreshold,
  };
}

export interface AggregateResults {
  params: SimulationParams;
  runs: number;
  avgQber: number;
  stdQber: number;
  avgKeyRate: number;
  stdKeyRate: number;
  avgSiftedKeyLength: number;
  avgTransmissionRate: number;
  avgDetectedPhotons: number;
  noiseToleranceThreshold: number;
  qberValues: number[];
  keyRateValues: number[];
  siftedKeyLengths: number[];
  // The last run's events for visualization
  lastRunEvents: QubitEvent[];
}

export function aggregateResults(results: SimulationResult[]): AggregateResults {
  const n = results.length;
  const qberValues = results.map(r => r.qber);
  const keyRateValues = results.map(r => r.secretKeyRate);
  const siftedKeyLengths = results.map(r => r.siftedKeyLength);

  const avgQber = qberValues.reduce((a, b) => a + b, 0) / n;
  const avgKeyRate = keyRateValues.reduce((a, b) => a + b, 0) / n;
  const avgSiftedKeyLength = siftedKeyLengths.reduce((a, b) => a + b, 0) / n;
  const avgDetectedPhotons = results.reduce((a, r) => a + r.detectedPhotons, 0) / n;

  const stdQber = Math.sqrt(qberValues.reduce((a, b) => a + (b - avgQber) ** 2, 0) / n);
  const stdKeyRate = Math.sqrt(keyRateValues.reduce((a, b) => a + (b - avgKeyRate) ** 2, 0) / n);

  return {
    params: results[0].params,
    runs: n,
    avgQber,
    stdQber,
    avgKeyRate,
    stdKeyRate,
    avgSiftedKeyLength,
    avgTransmissionRate: results[0].transmissionRate,
    avgDetectedPhotons,
    noiseToleranceThreshold: results[0].noiseToleranceThreshold,
    qberValues,
    keyRateValues,
    siftedKeyLengths,
    lastRunEvents: results[results.length - 1].events,
  };
}

// Presets
export const PRESETS: Record<string, Partial<SimulationParams>> = {
  ideal: {
    numQubits: 1000,
    fiberDistance: 0,
    fiberAttenuation: 0.2,
    detectorEfficiency: 1.0,
    darkCountProb: 0,
    phaseNoiseProb: 0,
    depolarizingProb: 0,
    errorCorrectionEff: 1.16,
  },
  standardFiber: {
    numQubits: 1000,
    fiberDistance: 50,
    fiberAttenuation: 0.2,
    detectorEfficiency: 0.9,
    darkCountProb: 0.0001,
    phaseNoiseProb: 0.02,
    depolarizingProb: 0.01,
    errorCorrectionEff: 1.16,
  },
  noisyUrban: {
    numQubits: 1000,
    fiberDistance: 20,
    fiberAttenuation: 0.35,
    detectorEfficiency: 0.85,
    darkCountProb: 0.001,
    phaseNoiseProb: 0.05,
    depolarizingProb: 0.03,
    errorCorrectionEff: 1.16,
  },
  longHaul: {
    numQubits: 1000,
    fiberDistance: 150,
    fiberAttenuation: 0.2,
    detectorEfficiency: 0.9,
    darkCountProb: 0.0001,
    phaseNoiseProb: 0.01,
    depolarizingProb: 0.005,
    errorCorrectionEff: 1.16,
  },
};

export const DEFAULT_PARAMS: SimulationParams = {
  numQubits: 1000,
  fiberDistance: 50,
  fiberAttenuation: 0.2,
  detectorEfficiency: 0.9,
  darkCountProb: 0.0001,
  phaseNoiseProb: 0.02,
  depolarizingProb: 0.01,
  errorCorrectionEff: 1.16,
};
