/* eslint-disable */
/**
 * Primer calculation engine using Nearest-Neighbor (NN) thermodynamic model.
 * Based on SantaLucia (1998) parameters.
 */

interface NNParams {
  h: number; // ΔH (kcal/mol)
  s: number; // ΔS (cal/mol·K)
}

// SantaLucia (1998) Dinucleotide parameters
const NN_TABLE: Record<string, NNParams> = {
  'AA': { h: -7.9, s: -22.2 },
  'TT': { h: -7.9, s: -22.2 },
  'AT': { h: -7.2, s: -20.4 },
  'TA': { h: -7.2, s: -21.3 },
  'CA': { h: -8.5, s: -22.7 },
  'TG': { h: -8.5, s: -22.7 },
  'GT': { h: -8.4, s: -22.4 },
  'AC': { h: -8.4, s: -22.4 },
  'CT': { h: -7.8, s: -21.0 },
  'AG': { h: -7.8, s: -21.0 },
  'GA': { h: -8.2, s: -22.2 },
  'TC': { h: -8.2, s: -22.2 },
  'CG': { h: -10.6, s: -27.2 },
  'GC': { h: -9.8, s: -24.4 },
  'GG': { h: -8.0, s: -19.9 },
  'CC': { h: -8.0, s: -19.9 },
};

const INIT_GC: NNParams = { h: 0.1, s: -2.8 };
const INIT_AT: NNParams = { h: 2.3, s: 4.1 };
const SYM_CORR: NNParams = { h: 0, s: -1.4 };

/**
 * Calculates Tm using Nearest-Neighbor model with salt corrections.
 * @param sequence DNA sequence (5' -> 3')
 * @param sodium Sodium concentration (mM)
 * @param magnesium Magnesium concentration (mM)
 * @param dntp dNTP concentration (mM)
 * @param primerConcentration Primer concentration (nM)
 */
export function calculateTm(
  sequence: string,
  sodium: number = 50,
  magnesium: number = 1.5,
  dntp: number = 0.2,
  primerConcentration: number = 200
): number {
  const seq = sequence.toUpperCase();
  if (seq.length < 2) return 0;

  let deltaH = 0;
  let deltaS = 0;

  // 1. Dinucleotide sum
  for (let i = 0; i < seq.length - 1; i++) {
    const pair = seq.substring(i, i + 2);
    const params = NN_TABLE[pair];
    if (params) {
      deltaH += params.h;
      deltaS += params.s;
    }
  }

  // 2. Initializations
  // Left end
  if (seq[0] === 'G' || seq[0] === 'C') {
    deltaH += INIT_GC.h;
    deltaS += INIT_GC.s;
  } else {
    deltaH += INIT_AT.h;
    deltaS += INIT_AT.s;
  }
  // Right end
  if (seq[seq.length-1] === 'G' || seq[seq.length-1] === 'C') {
    deltaH += INIT_GC.h;
    deltaS += INIT_GC.s;
  } else {
    deltaH += INIT_AT.h;
    deltaS += INIT_AT.s;
  }

  // 3. Symmetry correction (simplified check)
  const isPalindrome = seq === seq.split('').reverse().map(b => {
    if (b === 'A') return 'T';
    if (b === 'T') return 'A';
    if (b === 'G') return 'C';
    if (b === 'C') return 'G';
    return b;
  }).join('');
  if (isPalindrome) {
    deltaH += SYM_CORR.h;
    deltaS += SYM_CORR.s;
  }

  // 4. Salt correction (Von Ahsen et al. 2001 / SantaLucia 1998)
  // Conversion to Molar
  const Na = sodium / 1000;
  const Mg = magnesium / 1000;
  const dNTP = dntp / 1000;
  const conc = primerConcentration / 1e9;

  // Correcting for Mg2+ and dNTPs (Simplified relationship)
  let monovalentEquivalent = Na;
  if (Mg > dNTP) {
    monovalentEquivalent += 120 * Math.sqrt(Mg - dNTP);
  }

  // Salt-adjusted entropy
  // ΔS(salt) = ΔS(1M NaCl) + 0.368 * (N-1) * ln([Na+])
  deltaS += 0.368 * (seq.length - 1) * Math.log(monovalentEquivalent);

  // 5. Final Tm calculation
  // R = 1.987 cal/mol·K
  // Tm = (ΔH * 1000) / (ΔS + R * ln(Ct/4)) for non-palindromic
  const R = 1.987;
  const Ct = isPalindrome ? conc : conc / 4;
  
  const tmK = (deltaH * 1000) / (deltaS + R * Math.log(Ct));
  const tmC = tmK - 273.15;

  return Math.round(tmC * 10) / 10;
}

/**
 * Basic GC Content calculation
 */
export function calculateGC(sequence: string): number {
  const seq = sequence.toUpperCase();
  const gcCount = (seq.match(/[GC]/g) || []).length;
  return Math.round((gcCount / seq.length) * 1000) / 10;
}

/**
 * Molecular Weight calculation (approximate for ssDNA)
 */
export function calculateMW(sequence: string): number {
  const seq = sequence.toUpperCase();
  const weights: Record<string, number> = { A: 313.2, T: 304.2, G: 329.2, C: 289.2 };
  let mw = 0;
  for (const b of seq) {
    mw += weights[b] || 0;
  }
  return Math.round(mw + 79.0); // Adding 5' phosphate weight approx
}
