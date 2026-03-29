/**
 * Golden Gate Assembly (GGA) Overhang Fidelity Engine
 * Based on Potapov et al. (2018) principles for T4 Ligase fidelity.
 */

export interface OverhangReport {
  sequence: string;
  fidelity: number; // 0 to 100
  warnings: string[];
  isPalindrome: boolean;
  gcContent: number;
}

export interface AssemblyResult {
  overallSuccessProbability: number; // 0 to 100
  reports: OverhangReport[];
  conflicts: string[]; // List of problematic pairs
}

function getReverseComplement(seq: string): string {
  const map: any = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };
  return seq.split('').reverse().map(b => map[b] || b).join('');
}

function calculateGC(seq: string): number {
  const gcCount = (seq.match(/[GC]/g) || []).length;
  return Math.round((gcCount / seq.length) * 100);
}

/**
 * Calculates the mismatch score between two 4bp overhangs.
 * 4 = Perfect Match, 0 = No Match
 */
function getMatchScore(sq1: string, sq2: string): number {
  let score = 0;
  for (let i = 0; i < 4; i++) {
    if (sq1[i] === sq2[i]) score++;
  }
  return score;
}

export function analyzeGGFidelity(overhangs: string[]): AssemblyResult {
  const cleanedOverhangs = overhangs.map(o => o.trim().toUpperCase()).filter(o => o.length === 4);
  const reports: OverhangReport[] = [];
  const conflicts: string[] = [];

  // 1. Individual Analysis
  for (const oh of cleanedOverhangs) {
    const warnings: string[] = [];
    const isPalindrome = oh === getReverseComplement(oh);
    const gcPercent = calculateGC(oh);

    if (isPalindrome) warnings.push("Self-complementary (Palindrome) - high risk of self-ligation.");
    if (gcPercent === 0 || gcPercent === 100) warnings.push("Extreme GC content - ligation efficiency may be low.");
    
    reports.push({
      sequence: oh,
      fidelity: isPalindrome ? 10 : 100, // Palindromes severely impact fidelity
      warnings,
      isPalindrome,
      gcContent: gcPercent
    });
  }

  // 2. Cross-Reaction Analysis (Conflicts)
  let penaltyTotal = 0;
  const pairCount = (cleanedOverhangs.length * (cleanedOverhangs.length - 1)) / 2;

  for (let i = 0; i < cleanedOverhangs.length; i++) {
    for (let j = i + 1; j < cleanedOverhangs.length; j++) {
      const oh1 = cleanedOverhangs[i];
      const oh2 = cleanedOverhangs[j];
      const rc2 = getReverseComplement(oh2);

      // Rule: Overhangs should not be too similar to each other or to their RC counterparts
      const scoreDirect = getMatchScore(oh1, oh2);
      const scoreRC = getMatchScore(oh1, rc2);

      // Score 3/4 or 4/4 matches are dangerous
      if (scoreDirect >= 3) {
        conflicts.push(`High similarity between ${oh1} and ${oh2} (${scoreDirect}/4 match). Potential for mis-assembly.`);
        penaltyTotal += (scoreDirect === 4 ? 40 : 20);
      }
      if (scoreRC >= 3) {
        conflicts.push(`${oh1} is highly similar to the reverse complement of ${oh2} (${scoreRC}/4 match). Risk of inverted assembly.`);
        penaltyTotal += (scoreRC === 4 ? 30 : 15);
      }
    }
  }

  // 3. Final Probability Calculation
  // Base success is 100%, subtract penalties, but don't go below 1%
  const palindromePenalty = reports.filter(r => r.isPalindrome).length * 50;
  let successProbability = 100 - penaltyTotal - palindromePenalty;
  
  // Normalize success for larger assemblies (more fragments = harder)
  if (cleanedOverhangs.length > 5) {
    successProbability *= Math.pow(0.95, cleanedOverhangs.length - 5);
  }

  return {
    overallSuccessProbability: Math.max(1, Math.round(successProbability)),
    reports,
    conflicts
  };
}
