// GG02 CV-QKD Protocol Simulation Engine
// Implements the Grosshans-Grangier 2002 Gaussian-modulated coherent state protocol
// with configurable channel parameters and both homodyne/heterodyne detection
//
// Key References:
//   Grosshans & Grangier, PRL 88, 057902 (2002) — original GG02 proposal
//   Weedbrook et al., Rev. Mod. Phys. 84, 621 (2012) — comprehensive CV-QKD review
//
// Units: shot-noise units (SNU), where vacuum variance = 1

// ─── Types ───────────────────────────────────────────────────────────────

export type DetectionMode = 'homodyne' | 'heterodyne';

export interface CVSimulationParams {
  numSignals: number;           // number of coherent states sent per run
  modulationVariance: number;   // V_A (shot-noise units), typically 1–40
  channelTransmittance: number; // T ∈ (0,1], fiber loss = 10^(-αL/10)
  excessNoise: number;          // ε (SNU, referred to channel input), typically 0.001–0.1
  electronNoise: number;        // v_el (SNU), detector electronic noise
  detectorEfficiency: number;   // η_det ∈ (0,1], homodyne/heterodyne detector efficiency
  reconciliationEff: number;    // β ∈ (0,1], realistic ~0.95
  detectionMode: DetectionMode; // homodyne (measure x OR p) or heterodyne (measure both)
}

export interface CVSignalEvent {
  index: number;
  aliceX: number;               // Alice's x-quadrature modulation
  aliceP: number;               // Alice's p-quadrature modulation
  channelOutX: number;          // After channel: x-quadrature
  channelOutP: number;          // After channel: p-quadrature
  bobMeasuredQuad: 'X' | 'P' | 'XP'; // Which quadrature(s) Bob measured
  bobX: number | null;          // Bob's x-quadrature measurement
  bobP: number | null;          // Bob's p-quadrature measurement
}

export interface CVSimulationResult {
  params: CVSimulationParams;
  events: CVSignalEvent[];
  mutualInfoAB: number;         // I(A:B)
  holevoBoundBE: number;        // χ(B:E) — Holevo bound on Eve's info
  secretKeyRate: number;        // K = β·I(A:B) − χ(B:E) per symbol
  excessNoiseEstimated: number; // Estimated excess noise from data
  signalVariance: number;       // Measured signal variance at Bob
  noiseVariance: number;        // Measured noise variance at Bob
  tolerableExcessNoise: number; // Maximum ε before key rate → 0
  transmittanceEstimated: number;
}

export interface CVAggregateResults {
  params: CVSimulationParams;
  runs: number;
  avgKeyRate: number;
  stdKeyRate: number;
  avgMutualInfo: number;
  stdMutualInfo: number;
  avgHolevoBound: number;
  stdHolevoBound: number;
  avgExcessNoise: number;
  avgTransmittance: number;
  tolerableExcessNoise: number;
  keyRateValues: number[];
  mutualInfoValues: number[];
  holevoBoundValues: number[];
  excessNoiseValues: number[];
  lastRunEvents: CVSignalEvent[];
}

// ─── Math Helpers ────────────────────────────────────────────────────────

/** Gaussian random number (Box-Muller) with given variance */
function gaussianRandom(variance: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u) * variance) * Math.cos(2.0 * Math.PI * v);
}

/** Von Neumann entropy term: g(x) = ((x+1)/2)log₂((x+1)/2) − ((x−1)/2)log₂((x−1)/2) */
function gFunction(x: number): number {
  if (x <= 1) return 0;
  const a = (x + 1) / 2;
  const b = (x - 1) / 2;
  return a * Math.log2(a) - (b > 0 ? b * Math.log2(b) : 0);
}

/** Binary logarithm, returning 0 for non-positive inputs */
function safeLog2(x: number): number {
  if (x <= 0) return 0;
  return Math.log2(x);
}

// ─── Channel & Noise Model ──────────────────────────────────────────────

/**
 * Channel-added noise referred to channel input:
 *   χ_line = (1−T)/T + ε
 */
function channelNoise(T: number, epsilon: number): number {
  return (1 - T) / T + epsilon;
}

/**
 * Homodyne detection noise referred to channel input:
 *   χ_hom = (1 − η)/η + v_el/η
 */
function homodyneNoise(eta: number, vel: number): number {
  return (1 - eta) / eta + vel / eta;
}

/**
 * Heterodyne detection noise referred to channel input:
 *   χ_het = 1 + (1 − η)/η + v_el/η  = 1 + χ_hom
 * (extra vacuum noise from beam splitter)
 */
function heterodyneNoise(eta: number, vel: number): number {
  return 1 + homodyneNoise(eta, vel);
}

/**
 * Total noise referred to channel input:
 *   χ_tot = χ_line + χ_det/T
 */
function totalNoise(T: number, epsilon: number, eta: number, vel: number, mode: DetectionMode): number {
  const chiLine = channelNoise(T, epsilon);
  const chiDet = mode === 'homodyne'
    ? homodyneNoise(eta, vel)
    : heterodyneNoise(eta, vel);
  return chiLine + chiDet / T;
}

// ─── Covariance Matrix & Key Rate ────────────────────────────────────────

/**
 * Construct the 4×4 covariance matrix γ_AB for the GG02 protocol.
 *
 * V = V_A + 1  (total variance including vacuum, SNU)
 * T = channel transmittance
 * N = total added noise at Bob: 1 + T·χ_tot
 *
 * γ_AB = | V·I          √(T(V²−1))·σ_z |
 *        | √(T(V²−1))·σ_z   (TV + N)·I   |
 *
 * Returns {a, b, c, detA, detB, detC, detGamma, sigma}
 */
function covarianceMatrix(
  VA: number, T: number, epsilon: number, eta: number, vel: number, mode: DetectionMode
) {
  const V = VA + 1; // Total variance

  const chiTot = totalNoise(T, epsilon, eta, vel, mode);
  // Noise variance added at Bob's side
  const N = 1 + T * chiTot;

  const a = V;                        // diagonal of A = V·I
  const b = T * V + N;                // diagonal of B = (TV + N)·I
  const c = Math.sqrt(T * (V * V - 1)); // off-diagonal correlation (with sign in σ_z)

  // Determinants of 2×2 sub-blocks
  const detA = a * a;                 // det(V·I) = V²
  const detB = b * b;                 // det((TV+N)·I) = (TV+N)²
  const detC = -c * c;               // det(c·σ_z) = -c² (σ_z has det = -1)

  // Symplectic invariant Σ = det(A) + det(B) + 2·det(C)
  const sigma = detA + detB + 2 * detC;

  // det(γ_AB) = (V·b − T(V²−1))² = (ab − c²)²
  const detGamma = (a * b - c * c) * (a * b + c * c);
  // Actually for this block structure:
  // det(γ) = (a*b - c*c) * (a*b - (-c)*(-c)) = ... let me compute properly
  // γ = [[a,0,c,0],[0,a,0,-c],[c,0,b,0],[0,-c,0,b]]
  // det = (ab - c²)² — this is correct for the block structure with σ_z correlation
  const detGammaCorrect = (a * b - c * c) * (a * b - c * c);

  return { a, b, c, V, N, detA, detB, detC, sigma, detGamma: detGammaCorrect };
}

/**
 * Compute the two symplectic eigenvalues ν₁, ν₂ of the 4×4 covariance matrix γ_AB.
 *
 * ν₁,₂ = √( (Σ ± √(Σ² − 4Δ)) / 2 )
 *
 * where Σ = det(A) + det(B) + 2det(C), Δ = det(γ)
 */
function symplecticEigenvalues(sigma: number, detGamma: number): [number, number] {
  const discriminant = sigma * sigma - 4 * detGamma;
  const sqrtDisc = Math.sqrt(Math.max(0, discriminant));

  const nu1 = Math.sqrt(Math.max(1, (sigma + sqrtDisc) / 2));
  const nu2 = Math.sqrt(Math.max(1, (sigma - sqrtDisc) / 2));

  return [nu1, nu2];
}

/**
 * Compute the conditional symplectic eigenvalues ν₃, ν₄ (or just ν₃ for homodyne).
 *
 * After Bob's measurement, the conditional state of the system (from Eve's perspective)
 * has symplectic eigenvalues derived from the conditional covariance matrix.
 *
 * For homodyne detection:
 *   The conditional matrix is 2×2 → one symplectic eigenvalue ν₃
 *   ν₃² = det(A) − det(C)²/(det(B) component for the measured quadrature)
 *   More precisely: ν₃ = a − c²/b = V − T(V²−1)/(TV+N)
 *   = V − T(V²−1)/(TV+N) = (V(TV+N) − T(V²−1))/(TV+N)
 *   = (V·N + T)/(TV+N)
 *
 * For heterodyne detection:
 *   Two conditional symplectic eigenvalues.
 *   Using the formula from Weedbrook et al.:
 *   The conditional covariance matrix after heterodyne:
 *   γ_{A|het} = A − C(B + I)^{−1}C^T
 *   For our structure: this gives a 2×2 diagonal matrix
 */
function conditionalSymplecticEigenvalues(
  a: number, b: number, c: number,
  sigma: number, detGamma: number,
  mode: DetectionMode
): number[] {
  if (mode === 'homodyne') {
    // Homodyne measures one quadrature → Bob's relevant block is scalar b
    // Conditional covariance of Alice given Bob's measurement (one quadrature):
    // ν₃ = √(a² - c⁴/(b²))... let me use the proper formula
    // A_cond = A - C · (πB)⁻¹ · C^T  where π selects measured quadrature
    // For homodyne on x: π = diag(1,0), (πB)_MP_inv acts on the measured space
    // Result: conditional variance = a - c²/b  (for each quadrature pair)
    // This is a 2×2 matrix: diag(a - c²/b, a)
    // Symplectic eigenvalue: ν₃ = √(det(A_cond)) = √(a(a - c²/b)) = √(a·(ab - c²)/b)
    const nu3Sq = a * (a * b - c * c) / b;
    const nu3 = Math.sqrt(Math.max(1, nu3Sq));
    return [nu3];
  } else {
    // Heterodyne: both quadratures measured
    // A_cond = A - C(B + I)⁻¹C^T
    // For our block structure:
    //   A_cond = diag(a - c²/(b+1), a - c²/(b+1))
    // Symplectic eigenvalue: ν₃ = a - c²/(b+1)
    const nu3 = Math.max(1, a - (c * c) / (b + 1));
    return [nu3];
  }
}

/**
 * Compute mutual information I(A:B).
 *
 * Homodyne:  I(A:B) = ½ log₂(V_B / V_{B|A})
 *   V_B = T(V_A + χ_tot) + 1 = b (Bob's total variance on measured quadrature)
 *   V_{B|A} = b − c²/a = (ab − c²)/a — conditional variance of Bob given Alice
 *   I(A:B) = ½ log₂(a·b / (a·b − c²))  ... in terms of SNR
 *   More directly: I(A:B) = ½ log₂(V / (V − T(V²−1)/(TV + N)))
 *                          = ½ log₂(V·(TV+N) / (V(TV+N) − T(V²−1)))
 *                          = ½ log₂(V·(TV+N) / (V·N + T))
 *
 * Heterodyne: I(A:B) = log₂(V·(TV+N+1) / (V(N+1) + T))
 *   (factor of 2 because both quadratures, but each has 3dB more noise)
 */
function mutualInformation(
  V: number, a: number, b: number, c: number,
  mode: DetectionMode
): number {
  if (mode === 'homodyne') {
    // I(A:B) = ½ log₂( a·b / (a·b − c²) )
    const num = a * b;
    const denom = a * b - c * c;
    if (denom <= 0) return 0;
    return 0.5 * safeLog2(num / denom);
  } else {
    // Heterodyne: I(A:B) = log₂( (a(b+1)) / (a(b+1) − c²) )
    // Using the fact that heterodyne adds 1 unit of vacuum noise to Bob
    const num = a * (b + 1);
    const denom = a * (b + 1) - c * c;
    if (denom <= 0) return 0;
    return 0.5 * safeLog2(num / denom);
    // Note: for heterodyne we get info from both quads but each at lower SNR
    // The net effect is captured properly by this formula
  }
}

/**
 * Compute Holevo bound χ(B:E) — Eve's maximum information.
 *
 * χ(B:E) = S(ρ_AB) − S(ρ_{A|B})
 *        = g(ν₁) + g(ν₂) − g(ν₃) [− g(ν₄) for heterodyne]
 *
 * where νᵢ are symplectic eigenvalues of γ_AB (ν₁,ν₂) and
 * conditional γ_{A|B} (ν₃, possibly ν₄).
 */
function holevoBound(
  nu1: number, nu2: number,
  conditionalNus: number[]
): number {
  const sAB = gFunction(nu1) + gFunction(nu2);
  const sConditioned = conditionalNus.reduce((acc, nu) => acc + gFunction(nu), 0);
  return Math.max(0, sAB - sConditioned);
}

/**
 * Compute the complete CV-QKD key rate analytically from parameters.
 */
export function computeCVKeyRate(params: CVSimulationParams): {
  mutualInfoAB: number;
  holevoBoundBE: number;
  secretKeyRate: number;
  tolerableExcessNoise: number;
} {
  const { modulationVariance: VA, channelTransmittance: T, excessNoise: eps,
          electronNoise: vel, detectorEfficiency: eta, reconciliationEff: beta,
          detectionMode: mode } = params;

  // Build covariance matrix
  const cov = covarianceMatrix(VA, T, eps, eta, vel, mode);

  // Symplectic eigenvalues of γ_AB
  const [nu1, nu2] = symplecticEigenvalues(cov.sigma, cov.detGamma);

  // Conditional symplectic eigenvalues after Bob's measurement
  const condNus = conditionalSymplecticEigenvalues(
    cov.a, cov.b, cov.c, cov.sigma, cov.detGamma, mode
  );

  // Mutual information
  const IAB = mutualInformation(cov.V, cov.a, cov.b, cov.c, mode);

  // Holevo bound
  const chi = holevoBound(nu1, nu2, condNus);

  // Secret key rate
  const K = Math.max(0, beta * IAB - chi);

  // Find tolerable excess noise (binary search)
  const tolerableExcessNoise = findTolerableExcessNoise(params);

  return { mutualInfoAB: IAB, holevoBoundBE: chi, secretKeyRate: K, tolerableExcessNoise };
}

/**
 * Binary search for the maximum excess noise ε that still gives K > 0.
 */
function findTolerableExcessNoise(params: CVSimulationParams): number {
  let low = 0, high = 2.0; // Search up to 2 SNU
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const testParams = { ...params, excessNoise: mid };
    const cov = covarianceMatrix(
      testParams.modulationVariance, testParams.channelTransmittance,
      mid, testParams.detectorEfficiency, testParams.electronNoise, testParams.detectionMode
    );
    const [nu1, nu2] = symplecticEigenvalues(cov.sigma, cov.detGamma);
    const condNus = conditionalSymplecticEigenvalues(
      cov.a, cov.b, cov.c, cov.sigma, cov.detGamma, testParams.detectionMode
    );
    const IAB = mutualInformation(cov.V, cov.a, cov.b, cov.c, testParams.detectionMode);
    const chi = holevoBound(nu1, nu2, condNus);
    const K = testParams.reconciliationEff * IAB - chi;
    if (K > 0) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// ─── Monte Carlo Simulation ─────────────────────────────────────────────

/**
 * Run a single Monte Carlo simulation of the GG02 protocol.
 *
 * Protocol steps:
 * 1. Alice draws x_A, p_A ~ N(0, V_A) — Gaussian modulation
 * 2. Coherent state |x_A + i·p_A⟩ is sent through lossy noisy channel
 * 3. Channel: x_out = √T·x_A + noise_x, p_out = √T·p_A + noise_p
 *    where noise ~ N(0, σ²_ch), σ²_ch = T·ε + (1−T) = 1 − T + T·ε
 *    (channel-referred noise includes vacuum from loss + excess noise)
 * 4. Bob performs homodyne (measures x OR p randomly) or heterodyne (both)
 *    with detection noise: x_bob = √η·x_out + noise_det
 *    noise_det ~ N(0, σ²_det) where σ²_det = η·v_el + (1−η)
 */
export function runCVSimulation(params: CVSimulationParams): CVSimulationResult {
  const {
    numSignals, modulationVariance: VA, channelTransmittance: T,
    excessNoise: eps, electronNoise: vel, detectorEfficiency: eta,
    detectionMode: mode
  } = params;

  const sqrtT = Math.sqrt(T);
  const sqrtEta = Math.sqrt(eta);

  // Channel noise variance: vacuum from loss + excess noise
  // The added noise in the channel output has variance:
  //   σ²_noise = 1 − T + T·ε  (in SNU, at channel output)
  // Actually more carefully:
  //   x_out = √T · x_A + x_noise
  //   Var(x_noise) = (1 − T) + T·ε = 1 − T(1 − ε)
  // The (1-T) term is vacuum noise entering from loss, T·ε is excess noise
  const channelNoiseVar = (1 - T) + T * eps;

  // Detection noise variance at Bob (after detector)
  // x_bob = √η · x_out + x_det_noise
  // Var(x_det_noise) = (1 − η) + vel  (vacuum from detector loss + electronic)
  const detNoiseVar = (1 - eta) + vel;

  const events: CVSignalEvent[] = [];

  // Data arrays for parameter estimation
  const aliceXArr: number[] = [];
  const alicePArr: number[] = [];
  const bobXArr: number[] = [];
  const bobPArr: number[] = [];

  for (let i = 0; i < numSignals; i++) {
    // Step 1: Alice's Gaussian modulation
    const aliceX = gaussianRandom(VA);
    const aliceP = gaussianRandom(VA);

    // Step 2-3: Quantum channel
    const channelNoiseX = gaussianRandom(channelNoiseVar);
    const channelNoiseP = gaussianRandom(channelNoiseVar);
    const channelOutX = sqrtT * aliceX + channelNoiseX;
    const channelOutP = sqrtT * aliceP + channelNoiseP;

    // Step 4: Bob's detection
    let bobX: number | null = null;
    let bobP: number | null = null;
    let bobMeasuredQuad: 'X' | 'P' | 'XP';

    if (mode === 'homodyne') {
      // Randomly choose x or p quadrature
      if (Math.random() < 0.5) {
        bobMeasuredQuad = 'X';
        const detNoise = gaussianRandom(detNoiseVar);
        bobX = sqrtEta * channelOutX + detNoise;
        aliceXArr.push(aliceX);
        bobXArr.push(bobX);
      } else {
        bobMeasuredQuad = 'P';
        const detNoise = gaussianRandom(detNoiseVar);
        bobP = sqrtEta * channelOutP + detNoise;
        alicePArr.push(aliceP);
        bobPArr.push(bobP);
      }
    } else {
      // Heterodyne: measure both (with extra vacuum noise from beam splitter)
      bobMeasuredQuad = 'XP';
      // Heterodyne adds 1 SNU of vacuum noise per quadrature (from 50:50 BS)
      const hetExtraNoiseVar = 1; // Extra vacuum from beam splitter
      const detNoiseX = gaussianRandom(detNoiseVar + hetExtraNoiseVar);
      const detNoiseP = gaussianRandom(detNoiseVar + hetExtraNoiseVar);
      bobX = sqrtEta * channelOutX + detNoiseX;
      bobP = sqrtEta * channelOutP + detNoiseP;
      aliceXArr.push(aliceX);
      bobXArr.push(bobX);
      alicePArr.push(aliceP);
      bobPArr.push(bobP);
    }

    events.push({
      index: i,
      aliceX, aliceP,
      channelOutX, channelOutP,
      bobMeasuredQuad,
      bobX, bobP,
    });
  }

  // ─── Parameter Estimation ───
  // Estimate transmittance and excess noise from the data

  // Combine X and P data for estimation
  const allAlice = [...aliceXArr, ...alicePArr];
  const allBob = [...bobXArr, ...bobPArr];

  let transmittanceEst = T;
  let excessNoiseEst = eps;
  let signalVar = 0;
  let noiseVar = 0;

  if (allAlice.length > 10) {
    // Estimate T·η from covariance: Cov(Bob, Alice) / Var(Alice) = √(T·η)
    // (or √(T)·√(η) more precisely, since Bob = √η·(√T·Alice + noise) + det_noise)
    let sumAlice = 0, sumBob = 0, sumAA = 0, sumBB = 0, sumAB = 0;
    const n = allAlice.length;
    for (let i = 0; i < n; i++) {
      sumAlice += allAlice[i];
      sumBob += allBob[i];
      sumAA += allAlice[i] * allAlice[i];
      sumBB += allBob[i] * allBob[i];
      sumAB += allAlice[i] * allBob[i];
    }
    const meanA = sumAlice / n;
    const meanB = sumBob / n;
    const varA = sumAA / n - meanA * meanA;
    const varB = sumBB / n - meanB * meanB;
    const covAB = sumAB / n - meanA * meanB;

    signalVar = varB;
    const sqrtTeta = varA > 0 ? covAB / varA : 0;
    const Teta = sqrtTeta * sqrtTeta;
    transmittanceEst = eta > 0 ? Teta / eta : T;

    // Noise variance: Var(Bob) − T·η·Var(Alice)
    noiseVar = Math.max(0, varB - Teta * varA);

    // Excess noise estimation (referred to channel input)
    // noiseVar = η·((1-T) + T·ε) + (1-η) + v_el  [+ 1 for heterodyne]
    // => T·ε = (noiseVar - (1-η) - v_el - η(1-T) [- η for het]) / η
    const baseNoise = eta * (1 - transmittanceEst) + (1 - eta) + vel
      + (mode === 'heterodyne' ? eta : 0);
    const estTeps = Math.max(0, noiseVar - baseNoise);
    excessNoiseEst = transmittanceEst > 0 ? estTeps / (eta * transmittanceEst) : eps;
  }

  // ─── Key Rate Calculation (analytical, using true params) ───
  const keyRateResult = computeCVKeyRate(params);

  return {
    params,
    events,
    mutualInfoAB: keyRateResult.mutualInfoAB,
    holevoBoundBE: keyRateResult.holevoBoundBE,
    secretKeyRate: keyRateResult.secretKeyRate,
    excessNoiseEstimated: excessNoiseEst,
    transmittanceEstimated: transmittanceEst,
    signalVariance: signalVar,
    noiseVariance: noiseVar,
    tolerableExcessNoise: keyRateResult.tolerableExcessNoise,
  };
}

// ─── Aggregation ─────────────────────────────────────────────────────────

export function aggregateCVResults(results: CVSimulationResult[]): CVAggregateResults {
  const n = results.length;
  const keyRateValues = results.map(r => r.secretKeyRate);
  const mutualInfoValues = results.map(r => r.mutualInfoAB);
  const holevoBoundValues = results.map(r => r.holevoBoundBE);
  const excessNoiseValues = results.map(r => r.excessNoiseEstimated);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = (arr: number[], mean: number) =>
    Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);

  const avgKeyRate = avg(keyRateValues);
  const avgMutualInfo = avg(mutualInfoValues);
  const avgHolevoBound = avg(holevoBoundValues);

  return {
    params: results[0].params,
    runs: n,
    avgKeyRate,
    stdKeyRate: std(keyRateValues, avgKeyRate),
    avgMutualInfo,
    stdMutualInfo: std(mutualInfoValues, avgMutualInfo),
    avgHolevoBound,
    stdHolevoBound: std(holevoBoundValues, avgHolevoBound),
    avgExcessNoise: avg(excessNoiseValues),
    avgTransmittance: avg(results.map(r => r.transmittanceEstimated)),
    tolerableExcessNoise: results[0].tolerableExcessNoise,
    keyRateValues,
    mutualInfoValues,
    holevoBoundValues,
    excessNoiseValues,
    lastRunEvents: results[results.length - 1].events,
  };
}

// ─── Presets ──────────────────────────────────────────────────────────────

export const CV_PRESETS: Record<string, Partial<CVSimulationParams>> = {
  ideal: {
    numSignals: 1000,
    modulationVariance: 20,
    channelTransmittance: 1.0,
    excessNoise: 0,
    electronNoise: 0,
    detectorEfficiency: 1.0,
    reconciliationEff: 1.0,
    detectionMode: 'homodyne',
  },
  standardFiber: {
    numSignals: 1000,
    modulationVariance: 10,
    channelTransmittance: 0.5,     // ~15 km at 0.2 dB/km
    excessNoise: 0.01,
    electronNoise: 0.05,
    detectorEfficiency: 0.6,
    reconciliationEff: 0.95,
    detectionMode: 'homodyne',
  },
  noisyUrban: {
    numSignals: 1000,
    modulationVariance: 15,
    channelTransmittance: 0.3,     // ~25 km
    excessNoise: 0.05,
    electronNoise: 0.1,
    detectorEfficiency: 0.55,
    reconciliationEff: 0.93,
    detectionMode: 'homodyne',
  },
  longHaul: {
    numSignals: 1000,
    modulationVariance: 40,
    channelTransmittance: 0.1,     // ~50 km
    excessNoise: 0.005,
    electronNoise: 0.02,
    detectorEfficiency: 0.65,
    reconciliationEff: 0.97,
    detectionMode: 'homodyne',
  },
};

export const CV_DEFAULT_PARAMS: CVSimulationParams = {
  numSignals: 1000,
  modulationVariance: 10,
  channelTransmittance: 0.5,
  excessNoise: 0.01,
  electronNoise: 0.05,
  detectorEfficiency: 0.6,
  reconciliationEff: 0.95,
  detectionMode: 'homodyne',
};
