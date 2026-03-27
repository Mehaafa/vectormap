/* eslint-disable */
import React, { useState } from 'react';
import { Search, X, Globe, DownloadCloud } from 'lucide-react';

interface NCBIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVector: (vector: any) => void;
  theme: string;
}

export default function NCBIModal({ isOpen, onClose, onSelectVector, theme }: NCBIModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(15);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setErrorMsg('');
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // 1. Search for NCBI Nucleotide IDs
      const searchRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nuccore&term=${encodeURIComponent(query)}&retmax=50&retmode=json`);
      if (!searchRes.ok) throw new Error('NCBI Search Error');
      const searchJson = await searchRes.json();
      const ids = searchJson.esearchresult?.idlist || [];
      
      if (ids.length === 0) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      
      // 2. Fetch Summaries for those IDs
      const sumRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=nuccore&id=${ids.join(',')}&retmode=json`);
      if (!sumRes.ok) throw new Error('NCBI Summary Error');
      const sumJson = await sumRes.json();
      
      const items = ids.map((id: string) => {
        const info = sumJson.result[id];
        return {
          id: info.uid,
          accession: info.caption,
          name: info.title,
          size_bp: info.slen,
          description: info.organism || 'NCBI Nucleotide Record'
        };
      });
      
      setResults(items.filter((item: any) => item.name && item.size_bp)); // filter out invalid ones
      setVisibleCount(15);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to search NCBI. Please try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search input to avoid hitting NCBI API instantly on every keystroke
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 150) {
      if (visibleCount < results.length) {
        setVisibleCount(prev => Math.min(prev + 15, results.length));
      }
    }
  };

  const handleSelect = async (vector: any) => {
    setIsDownloading(true);
    try {
      const res = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=${vector.id}&rettype=gb&retmode=text`);
      if (!res.ok) throw new Error("NCBI GenBank Download Error");
      const gbText = await res.text();
      
      onSelectVector({
        ...vector,
        gbText
      });
      
      onClose();
      setSearchQuery('');
      setResults([]);
    } catch (error) {
      alert("Failed to download GenBank sequence from NCBI.");
    } finally {
      setIsDownloading(false);
    }
  };

  const displayResults = results.slice(0, visibleCount);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
        
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <Globe size={20} />
            </div>
            <h2 className={`text-lg font-semibold tracking-tight animate-pulse ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Import from NCBI (Live API)</h2>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col space-y-4 relative">
          
          {/* Downloading Overlay */}
          {isDownloading && (
            <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl backdrop-blur-md ${theme === 'dark' ? 'bg-gray-900/80' : 'bg-white/80'}`}>
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>Downloading GenBank File from NCBI...</span>
            </div>
          )}

          <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all shadow-sm ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <Search size={18} className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search NCBI Nucleotide Database (Press Enter to search...)"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
              autoFocus
            />
          </div>

          <div className="pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Search Results ({results.length})
          </div>

          {errorMsg && (
            <div className="text-xs text-red-500 px-2">{errorMsg}</div>
          )}

          <div 
            onScroll={handleScroll}
            className={`flex flex-col h-72 overflow-y-auto rounded-xl border scrollbar-hide ${theme === 'dark' ? 'border-gray-800 bg-gray-950/50' : 'border-gray-200 bg-gray-50/50'}`}
          >
            {isSearching ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Querying NCBI E-utilities...</span>
              </div>
            ) : displayResults.length === 0 ? (
              <div className={`flex-1 flex flex-col items-center justify-center opacity-50 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <Search size={32} className="mb-2 opacity-30" />
                No results. Try typing "pUC19" or an accession like "NC_001416" and press Enter.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
                {displayResults.map(r => (
                  <button 
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    className={`group flex items-center justify-between p-4 transition-colors text-left ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'}`}
                  >
                    <div className="flex flex-col max-w-[70%]">
                      <div className={`font-semibold text-sm flex items-center mb-1 truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                        <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded mr-2 uppercase tracking-wide">NCBI: {r.accession}</span>
                        <span className="truncate">{r.name}</span>
                      </div>
                      <span className={`text-xs truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{r.description}</span>
                    </div>
                    <div className="flex items-center space-x-4 pl-4 shrink-0">
                      <span className={`text-xs font-mono font-medium ${theme === 'dark' ? 'text-gray-400 border-gray-700 bg-gray-800' : 'text-gray-500 border-gray-200 bg-gray-100'} border px-2 py-0.5 rounded`}>{r.size_bp?.toLocaleString() || '?'} bp</span>
                      <div className={`p-1.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all shadow-sm`}>
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
