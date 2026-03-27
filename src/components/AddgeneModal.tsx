import React, { useState } from 'react';
import { Search, X, Globe, DownloadCloud } from 'lucide-react';

interface AddgeneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVector: (vector: any) => void;
  theme: string;
}

const PLASMID_PREFIXES = ['pUC', 'pET', 'pGEX', 'pcDNA', 'pEGFP', 'pGL3', 'pBR', 'pBABE', 'pLentG', 'pAAV'];
const PLASMID_SUFFIXES = ['19', '28a(+)', '4T-1', '3.1(+)', '-N1', '-Basic', '322', 'puro', 'GFP', 'Cas9'];

const generateDummyPlasmids = () => {
  const list: any[] = [];
  for (let i = 0; i < 300; i++) {
    const prefix = PLASMID_PREFIXES[Math.floor(Math.random() * PLASMID_PREFIXES.length)];
    const suffix = PLASMID_SUFFIXES[Math.floor(Math.random() * PLASMID_SUFFIXES.length)];
    const size = Math.floor(Math.random() * 8000) + 2000;
    list.push({
      id: `addgene_100${i}`,
      name: `${prefix}${suffix}`,
      description: `Target expression vector derived from ${prefix} backbone`,
      size_bp: size,
      is_circular: true,
      sequence: 'atgcggtctata'.repeat(Math.ceil(size / 12)).substring(0, size), 
      features: [
        { id: `f_${i}_1`, name: 'CMV Promoter', start: 100, end: 600, type: 'promoter', strand: 1, forward: true },
        { id: `f_${i}_2`, name: prefix + ' Target Gene', start: 800, end: 1800, type: 'CDS', strand: 1, forward: true },
        { id: `f_${i}_3`, name: 'PolyA Signal', start: 1850, end: 1950, type: 'polyA_signal', strand: 1, forward: true },
        { id: `f_${i}_4`, name: 'AmpR', start: Math.floor(size - 1000), end: Math.floor(size - 200), type: 'CDS', strand: -1, forward: false }
      ]
    });
  }
  // Guarantee the classic ones exist at the top
  list[0] = { id: 'ad_2686', name: 'pUC19', description: 'High copy cloning vector used universally', size_bp: 2686, is_circular: true, sequence: 'tcgcgcgtttcggtgatgacggtg'.repeat(200).substring(0, 2686), features: [
    { id: 'f1', name: 'AmpR', start: 150, end: 1010, type: 'CDS', strand: -1, forward: false },
    { id: 'f2', name: 'ori', start: 1200, end: 1800, type: 'rep_origin', strand: 1, forward: true },
    { id: 'f3', name: 'lacZ alpha', start: 200, end: 400, type: 'CDS', strand: 1, forward: true }
  ]};
  list[1] = { id: 'ad_4361', name: 'pBR322', description: 'Classic E. coli cloning vector with dual selection', size_bp: 4361, is_circular: true, sequence: 'ttctcatgtttgacagcttatca'.repeat(300).substring(0, 4361), features: [
    { id: 'f4', name: 'AmpR', start: 3000, end: 3860, type: 'CDS', strand: -1, forward: false },
    { id: 'f5', name: 'TetR', start: 86, end: 1276, type: 'CDS', strand: 1, forward: true },
    { id: 'f6', name: 'ori', start: 2000, end: 2600, type: 'rep_origin', strand: 1, forward: true }
  ]};
  list[2] = { id: 'ad_4969', name: 'pGEX-4T-1', description: 'GST fusion expression vector for E. coli', size_bp: 4969, is_circular: true, sequence: 'acgttatcgactgcacggtgcac'.repeat(400).substring(0, 4969), features: [
    { id: 'f7', name: 'tac promoter', start: 200, end: 270, type: 'promoter', strand: 1, forward: true },
    { id: 'f8', name: 'GST tag', start: 280, end: 940, type: 'CDS', strand: 1, forward: true },
    { id: 'f9', name: 'MCS', start: 945, end: 990, type: 'misc_feature', strand: 1, forward: true },
    { id: 'f10', name: 'AmpR', start: 3500, end: 4360, type: 'CDS', strand: -1, forward: false }
  ]};
  return list;
};

const DUMMY_ADDGENE_RESULTS = generateDummyPlasmids();

export default function AddgeneModal({ isOpen, onClose, onSelectVector, theme }: AddgeneModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(DUMMY_ADDGENE_RESULTS);
  const [visibleCount, setVisibleCount] = useState(15);

  if (!isOpen) return null;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      const filtered = DUMMY_ADDGENE_RESULTS.filter(r => 
        r.name.toLowerCase().includes(lowerQuery) || 
        r.description.toLowerCase().includes(lowerQuery) ||
        r.id.toLowerCase().includes(lowerQuery)
      );
      setResults(filtered);
      setVisibleCount(15); // Reset lazylist on new search
      setIsSearching(false);
    }, 400);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 150) {
      if (visibleCount < results.length) {
        setVisibleCount(prev => Math.min(prev + 15, results.length));
      }
    }
  };
  
  const displayResults = results.slice(0, visibleCount);

  const handleSelect = (vector: any) => {
    // Transform mock result into bio-parser ParsedSequence structure for VectorMap
    const parsedSequence = {
      name: vector.name,
      description: vector.description,
      circular: vector.is_circular,
      size: vector.size_bp,
      sequence: vector.sequence,
      features: vector.features,
      type: 'DNA'
    };
    
    onSelectVector({
      id: vector.id,
      sequence_data: parsedSequence
    });
    
    onClose();
    setSearchQuery('');
    setResults(DUMMY_ADDGENE_RESULTS);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
        
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <Globe size={20} />
            </div>
            <h2 className={`text-lg font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Import from Addgene</h2>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col space-y-4">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all shadow-sm ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <Search size={18} className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by Plasmid Name, Addgene ID, or Keyword..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
              autoFocus
            />
          </div>

          <div className="pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Available Plasmids ({results.length})
          </div>

          <div 
            onScroll={handleScroll}
            className={`flex flex-col h-72 overflow-y-auto rounded-xl border scrollbar-hide ${theme === 'dark' ? 'border-gray-800 bg-gray-950/50' : 'border-gray-200 bg-gray-50/50'}`}
          >
            {isSearching ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Searching Database...</span>
              </div>
            ) : displayResults.length === 0 ? (
              <div className={`flex-1 flex flex-col items-center justify-center opacity-50 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <Search size={32} className="mb-2 opacity-30" />
                No matching vectors found.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
                {displayResults.map(r => (
                  <button 
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    className={`group flex items-center justify-between p-4 transition-colors text-left ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`}
                  >
                    <div className="flex flex-col">
                      <div className={`font-semibold text-sm flex items-center mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                        <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded mr-2 uppercase tracking-wide">Addgene #{r.size_bp}</span>
                        {r.name}
                      </div>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{r.description}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`text-xs font-mono font-medium ${theme === 'dark' ? 'text-gray-400 border-gray-700 bg-gray-800' : 'text-gray-500 border-gray-200 bg-gray-100'} border px-2 py-0.5 rounded`}>{r.size_bp.toLocaleString()} bp</span>
                      <div className={`p-1.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all shadow-sm`}>
                        <DownloadCloud size={16} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
