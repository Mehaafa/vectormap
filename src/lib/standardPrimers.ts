export interface StandardPrimer {
  name: string;
  sequence: string;
  description: string;
}

export const standardPrimers: StandardPrimer[] = [
  {
    name: "M13 Forward (-21)",
    sequence: "TGTAAAACGACGGCCAGT",
    description: "Universal sequencing primer for pUC and many vectors base on M13"
  },
  {
    name: "M13 Forward (-40)",
    sequence: "GTTTTCCCAGTCACGAC",
    description: "Alternative M13 forward sequencing primer"
  },
  {
    name: "M13 Reverse",
    sequence: "CAGGAAACAGCTATGAC",
    description: "Universal sequencing primer (reverse direction) for M13/pUC vectors"
  },
  {
    name: "T7 Promoter",
    sequence: "TAATACGACTCACTATAGGG",
    description: "High-level expression/sequencing from T7 promoter"
  },
  {
    name: "T7 Terminator",
    sequence: "GCTAGTTATTGCTCAGCGG",
    description: "Sequencing primer for the 3' end of T7 transcripts"
  },
  {
    name: "T3 Promoter",
    sequence: "ATTAACCCTCACTAAAG",
    description: "Promoter for T3 RNA polymerase and sequencing"
  },
  {
    name: "SP6 Promoter",
    sequence: "GATTTAGGTGACACTATAG",
    description: "Promoter for SP6 RNA polymerase and sequencing"
  },
  {
    name: "BGH Reverse",
    sequence: "TAGAAGGCACAGTCGAGG",
    description: "Sequencing primer for vectors with BGH polyadenylation signal (e.g., pcDNA3)"
  },
  {
    name: "CMV Forward",
    sequence: "CGCAAATGGGCGGTAGGCGTG",
    description: "Sequencing primer for CMV promoter-driven expression vectors"
  },
  {
    name: "SV40 Forward",
    sequence: "GAAATTTGTGATGCTATTGC",
    description: "Forward sequencing primer for SV40 early promoter/origin area"
  },
  {
    name: "SV40 Reverse",
    sequence: "GGTGTGGTTTGTATTGAGCT",
    description: "Reverse sequencing primer for SV40-based vectors"
  },
  {
    name: "pGEX 5'",
    sequence: "GGGCTTTGTTTTAGGGTGG",
    description: "5' sequencing primer for GST-fusion vectors (pGEX series)"
  },
  {
    name: "pGEX 3'",
    sequence: "CCGGGAGCTGCATGTGTCAGAGG",
    description: "3' sequencing primer for GST-fusion vectors (pGEX series)"
  },
  {
    name: "EGFP-N Reverse",
    sequence: "CGTCGCCGTCCAGCTCGACCAG",
    description: "Reverse sequencing primer for EGFP-N fusion vectors"
  },
  {
    name: "EGFP-C Forward",
    sequence: "CATGGTCCTGCTGGAGTTCGTG",
    description: "Forward sequencing primer for EGFP-C fusion vectors"
  }
];
