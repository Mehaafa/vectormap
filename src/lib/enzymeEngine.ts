/* eslint-disable */
// Enzyme calculation engine — finds cut sites in a DNA sequence using IUPAC patterns

import { RestrictionEnzyme } from './rebaseData';

/** IUPAC ambiguity code → regex character class */
const IUPAC_MAP: Record<string, string> = {
  A: 'A', T: 'T', G: 'G', C: 'C', U: 'T',
  R: '[AG]', Y: '[CT]', S: '[GC]', W: '[AT]',
  K: '[GT]', M: '[AC]', B: '[CGT]', D: '[AGT]',
  H: '[ACT]', V: '[ACG]', N: '[ACGT]',
};

/** Convert an IUPAC recognition sequence to a RegExp */
export function iupacToRegExp(seq: string): RegExp {
  const pattern = seq.toUpperCase().split('').map(c => IUPAC_MAP[c] ?? c).join('');
  return new RegExp(pattern, 'g');
}

/** Reverse complement of an IUPAC sequence */
const COMPLEMENT: Record<string, string> = {
  A:'T', T:'A', G:'C', C:'G',
  R:'Y', Y:'R', S:'S', W:'W',
  K:'M', M:'K', B:'V', D:'H',
  H:'D', V:'B', N:'N',
};
export function reverseComplement(seq: string): string {
  return seq.toUpperCase().split('').reverse().map(c => COMPLEMENT[c] ?? c).join('');
}

/** A single cut result */
export interface CutSite {
  enzyme: string;
  position: number;   // 0-indexed, position on top strand where enzyme binds
  strand: 1 | -1;    // 1 = top strand match, -1 = bottom strand (RC) match
}

/** Digest result for a single enzyme on a sequence */
export interface EnzymeResult {
  enzyme: RestrictionEnzyme;
  cutSites: CutSite[];
  fragments: number[]; // sorted fragment sizes in bp
  cutCount: number;
}

/**
 * Find all cut sites for a given enzyme in a sequence.
 * For circular sequences, the sequence is doubled so wrapping matches are found.
 */
export function findCutSites(
  sequence: string,
  enzyme: RestrictionEnzyme,
  circular: boolean = true,
): CutSite[] {
  const seq = sequence.toUpperCase();
  const seqLen = seq.length;
  const searchSeq = circular ? seq + seq : seq;
  const results: CutSite[] = [];
  const seen = new Set<number>();

  const recSeq = enzyme.recognitionSeq.toUpperCase();
  const rcSeq  = reverseComplement(recSeq);

  const addMatches = (pattern: string, strand: 1 | -1) => {
    const re = iupacToRegExp(pattern);
    let m: RegExpExecArray | null;
    while ((m = re.exec(searchSeq)) !== null) {
      let pos = m.index % seqLen;
      if (seen.has(pos * 2 + (strand === 1 ? 0 : 1))) continue;
      // Skip duplicates that arise from the doubled circular string
      if (circular && m.index >= seqLen) continue;
      seen.add(pos * 2 + (strand === 1 ? 0 : 1));
      results.push({ enzyme: enzyme.name, position: pos, strand });
    }
  };

  addMatches(recSeq, 1);
  // Only add RC matches if the RC is different (avoids double-counting palindromes)
  if (rcSeq !== recSeq) addMatches(rcSeq, -1);

  return results.sort((a, b) => a.position - b.position);
}

/** Calculate fragment sizes from cut positions on a circular or linear sequence */
export function calculateFragments(
  cutPositions: number[],
  seqLength: number,
  circular: boolean,
): number[] {
  if (cutPositions.length === 0) return [seqLength];

  const sorted = [...new Set(cutPositions)].sort((a, b) => a - b);

  if (circular) {
    const frags: number[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const next = sorted[(i + 1) % sorted.length];
      const size = i === sorted.length - 1
        ? (seqLength - sorted[i]) + sorted[0]
        : next - sorted[i];
      frags.push(size);
    }
    return frags.sort((a, b) => b - a);
  } else {
    const frags: number[] = [];
    let prev = 0;
    for (const pos of sorted) {
      frags.push(pos - prev);
      prev = pos;
    }
    frags.push(seqLength - prev);
    return frags.sort((a, b) => b - a);
  }
}

/** Run full digest analysis for one enzyme */
export function analyzeEnzyme(
  sequence: string,
  enzyme: RestrictionEnzyme,
  circular: boolean = true,
): EnzymeResult {
  const cutSites = findCutSites(sequence, enzyme, circular);
  const cutPositions = cutSites.map(s => s.position);
  const fragments = calculateFragments(cutPositions, sequence.length, circular);
  return { enzyme, cutSites, fragments, cutCount: cutSites.length };
}

/** Run analysis for an array of enzymes */
export function analyzeAll(
  sequence: string,
  enzymes: RestrictionEnzyme[],
  circular: boolean = true,
): EnzymeResult[] {
  return enzymes.map(e => analyzeEnzyme(sequence, e, circular));
}

/** Combined multi-enzyme digest fragments */
export function multiDigestFragments(
  sequence: string,
  enzymes: RestrictionEnzyme[],
  circular: boolean = true,
): number[] {
  const allPositions: number[] = [];
  for (const enzyme of enzymes) {
    const sites = findCutSites(sequence, enzyme, circular);
    allPositions.push(...sites.map(s => s.position));
  }
  return calculateFragments(allPositions, sequence.length, circular);
}
