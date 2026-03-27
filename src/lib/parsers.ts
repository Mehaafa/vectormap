/* eslint-disable */
// Helper wrapper around @teselagen/bio-parsers
// It safely attempts to parse GenBank, FASTA, JBEI, SnapGene, etc.

import { anyToJson } from '@teselagen/bio-parsers';

/**
 * Result structure returned by bio-parsers 'anyToJson'
 */
export interface ParsedSequenceResult {
  success: boolean;
  messages: string[];
  parsedSequence?: {
    name: string;
    circular: boolean;
    sequence: string;
    features: Array<{
      id: string;
      name: string;
      start: number;
      end: number;
      type: string;
      strand: number;
      [key: string]: any;
    }>;
    parts?: Array<any>;
    primers?: Array<any>;
    translations?: Array<any>;
    size: number;
  };
}

/**
 * Parses a biological sequence file content (string or ArrayBuffer for binary like SnapGene).
 */
export async function parseSequenceFile(
  fileContent: string | ArrayBuffer,
  fileName: string = 'Sequence'
): Promise<ParsedSequenceResult> {
  try {
    // anyToJson automatically determines the format and parses it
    // Latest bio-parsers returns a Promise or an array directly
    const result: any = await anyToJson(fileContent, { fileName, isAbridged: false });
    
    // It returns an array of results (in case of multi-FASTA, etc.)
    const resultArray = Array.isArray(result) ? result : [result];
    
    if (resultArray && resultArray.length > 0) {
      if (resultArray[0].success) {
        return resultArray[0] as ParsedSequenceResult;
      } else {
        return {
          success: false,
          messages: resultArray[0].messages || ['Failed to parse file.'],
        };
      }
    } else {
      return {
        success: false,
        messages: ['Failed to parse file: Empty result returned.'],
      };
    }
  } catch (err: any) {
    return {
      success: false,
      messages: [err?.message || 'Unknown parsing error occurred.'],
    };
  }
}
