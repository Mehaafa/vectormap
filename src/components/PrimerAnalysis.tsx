/* eslint-disable */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Zap, 
  Settings2, 
  Trash2, 
  Plus, 
  Info, 
  Thermometer, 
  Activity, 
  BarChart3,
  Search,
  CheckCircle2,
  PlusCircle,
  Copy,
  BookOpen,
  Dna
} from 'lucide-react';
import { calculateTm, calculateGC, calculateMW } from '@/lib/primerEngine';
import { standardPrimers, StandardPrimer } from '@/lib/standardPrimers';

interface Primer {
  id: string;
  name: string;
  sequence: string;
  tm: number;
  gc: number;
  mw: number;
  length: number;
}

export default function PrimerAnalysis({
  parsedSequence,
  theme,
  onApplyPrimer,
}: {
  parsedSequence?: any;
  theme: string;
  onApplyPrimer?: (primer: any) => void;
}) {
  const [inputSeq, setInputSeq] = useState('');
  const [primerName, setPrimerName] = useState('New Primer');
  
  // Calculation Parameters
  const [sodium, setSodium] = useState(50);
  const [magnesium, setMagnesium] = useState(1.5);
  const [dntp, setDntp] = useState(0.2);
  const [primerConc, setPrimerConc] = useState(200);

  const [activeTab, setActiveTab] = useState<'design' | 'library'>('design');
  const [librarySearch, setLibrarySearch] = useState('');
  const [savedPrimers, setSavedPrimers] = useState<Primer[]>([]);

  // Real-time analysis of inputSeq
  const analysis = useMemo(() => {
    const cleanSeq = inputSeq.replace(/[^ATGCatgc]/g, '').toUpperCase();
    if (cleanSeq.length < 2) return null;

    return {
      sequence: cleanSeq,
      length: cleanSeq.length,
      tm: calculateTm(cleanSeq, sodium, magnesium, dntp, primerConc),
      gc: calculateGC(cleanSeq),
      mw: calculateMW(cleanSeq)
    };
  }, [inputSeq, sodium, magnesium, dntp, primerConc]);

  const handleAddPrimer = () => {
    if (!analysis) return;
    const newPrimer: Primer = {
      id: Date.now().toString(),
      name: primerName || `Primer-${Date.now().toString().slice(-4)}`,
      ...analysis
    };
    setSavedPrimers([newPrimer, ...savedPrimers]);
    setInputSeq('');
    setPrimerName('New Primer');
  };

  const handleImportStandard = (p: StandardPrimer) => {
    const tm = calculateTm(p.sequence, sodium, magnesium, dntp, primerConc);
    const gc = calculateGC(p.sequence);
    const mw = calculateMW(p.sequence);

    const newPrimer: Primer = {
      id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: p.name,
      sequence: p.sequence,
      tm,
      gc,
      mw,
      length: p.sequence.length
    };
    setSavedPrimers([newPrimer, ...savedPrimers]);
  };

  const removePrimer = (id: string) => {
    setSavedPrimers(savedPrimers.filter(p => p.id !== id));
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${theme === 'dark' ? 'bg-gray-950 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Zap size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Primer Design & Tm Analysis</h2>
            <p className="text-xs text-gray-500">Nearest-Neighbor Model (SantaLucia 1998)</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
           <span className={`px-2 py-1 rounded text-[10px] font-bold border ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
             <CheckCircle2 size={10} className="inline mr-1" />
             NN Model Active
           </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Design & Parameters */}
        <div className={`w-1/2 flex flex-col border-r ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          
          {/* Internal Tab Switcher */}
          <div className={`flex p-1 m-4 rounded-xl ${theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-200'}`}>
            <button 
              onClick={() => setActiveTab('design')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'design' 
                  ? (theme === 'dark' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white text-indigo-600 shadow-sm') 
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <Zap size={14} />
              <span>Custom Design</span>
            </button>
            <button 
              onClick={() => setActiveTab('library')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'library' 
                  ? (theme === 'dark' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white text-indigo-600 shadow-sm') 
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <BookOpen size={14} />
              <span>Standard Library</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-0">
            <div className="space-y-6">
              
              {activeTab === 'design' ? (
                <>
                  {/* Input Section */}
                  <section className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center">
                      <PlusCircle size={14} className="mr-2" />
                      Primer Sequence
                    </label>
                    <input 
                      type="text"
                      placeholder="Primer Name"
                      value={primerName}
                      onChange={(e) => setPrimerName(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
                    />
                    <textarea 
                      rows={3}
                      placeholder="Paste DNA sequence here (e.g., GATCGATCGATC...)"
                      value={inputSeq}
                      onChange={(e) => setInputSeq(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border text-sm font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
                    />
                    {analysis && (
                       <button 
                        onClick={handleAddPrimer}
                        className="w-full py-3 bg-indigo-500 text-white rounded-lg font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2"
                      >
                        <Zap size={16} />
                        <span>Add Custom Primer to Workspace</span>
                      </button>
                    )}
                  </section>
                </>
              ) : (
                <>
                  {/* Library Section */}
                  <section className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                      <input 
                        type="text"
                        placeholder="Search standard primers (T7, M13, etc...)"
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
                      />
                    </div>

                    <div className="grid gap-3">
                      {standardPrimers
                        .filter(p => p.name.toLowerCase().includes(librarySearch.toLowerCase()) || p.description.toLowerCase().includes(librarySearch.toLowerCase()))
                        .map((p, idx) => {
                          const tm = calculateTm(p.sequence, sodium, magnesium, dntp, primerConc);
                          return (
                            <div key={idx} className={`p-4 rounded-xl border transition-all hover:border-indigo-500 group ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-bold text-sm text-indigo-400">{p.name}</h4>
                                  <p className="text-[10px] text-gray-500 leading-tight mt-1">{p.description}</p>
                                </div>
                                <button 
                                  onClick={() => handleImportStandard(p)}
                                  className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-sm flex items-center space-x-1"
                                >
                                  <Plus size={14} />
                                  <span className="text-[10px] font-bold">Import</span>
                                </button>
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <div className="flex space-x-3 text-gray-400">
                                  <span className="bg-gray-800 px-1.5 py-0.5 rounded text-indigo-300">{tm}°C</span>
                                  <span>{p.sequence.length}bp</span>
                                </div>
                                <span className="opacity-40 truncate max-w-[150px]">{p.sequence}</span>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </section>
                </>
              )}

              {/* Parameter Section (Common) */}
              <section className="space-y-4 pt-4 border-t border-gray-800">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center">
                  <Settings2 size={14} className="mr-2" />
                  Reaction Conditions (Salt / Conc.)
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">Na+ (Sodium)</span>
                      <span className="font-mono text-indigo-400">{sodium} mM</span>
                    </div>
                    <input type="range" min="10" max="1000" step="10" value={sodium} onChange={(e) => setSodium(Number(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">Mg2+ (Magnesium)</span>
                      <span className="font-mono text-indigo-400">{magnesium} mM</span>
                    </div>
                    <input type="range" min="0" max="10" step="0.1" value={magnesium} onChange={(e) => setMagnesium(Number(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">dNTPs</span>
                      <span className="font-mono text-indigo-400">{dntp} mM</span>
                    </div>
                    <input type="range" min="0" max="2" step="0.05" value={dntp} onChange={(e) => setDntp(Number(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">Primer Conc.</span>
                      <span className="font-mono text-indigo-400">{primerConc} nM</span>
                    </div>
                    <input type="range" min="10" max="2000" step="10" value={primerConc} onChange={(e) => setPrimerConc(Number(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Right Panel: Workspace (Saved Primers) */}
        <div className={`w-1/2 flex flex-col h-full overflow-hidden relative ${theme === 'dark' ? 'bg-gray-900/20' : 'bg-white'}`}>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold flex items-center">
                <Activity size={16} className="mr-2 text-indigo-400" />
                Workspace Primers
              </h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSavedPrimers([])}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Saved Primers List */}
            {savedPrimers.length > 0 ? (
              <div className="space-y-4">
                {savedPrimers.map(p => (
                  <div key={p.id} className={`group p-4 rounded-xl border transition-all hover:scale-[1.01] ${theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:border-indigo-500' : 'bg-white border-gray-200 hover:border-indigo-400'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-sm truncate max-w-[150px]">{p.name}</h4>
                       <div className="flex items-center space-x-1">
                         <button 
                           onMouseDown={() => {
                             console.log('Button MouseDown:', p.name);
                             onApplyPrimer?.(p);
                           }}
                           onClick={(e) => {
                             e.preventDefault();
                             console.log('Button Click:', p.name);
                             onApplyPrimer?.(p);
                           }}
                           className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-md active:scale-95 group shrink-0"
                           title="Add this Primer to Map"
                         >
                           <PlusCircle size={14} className="pointer-events-none" />
                           <span className="text-[11px] font-bold pointer-events-none">Add to Map</span>
                         </button>
                         <button 
                           onClick={() => removePrimer(p.id)}
                           className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                         >
                           <Trash2 size={12} />
                         </button>
                       </div>
                    </div>
                    <div className="flex items-center space-x-3 text-[10px] font-mono text-gray-500 mb-2">
                      <span className="bg-gray-800 px-1.5 py-0.5 rounded text-indigo-400">{p.tm}°C</span>
                      <span>GC: {p.gc}%</span>
                      <span>{p.length}bp</span>
                    </div>
                    <div className="text-[10px] font-mono truncate break-all opacity-50 block whitespace-pre-wrap">{p.sequence}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 opacity-20 text-center">
                <Dna size={48} className="mb-4" />
                <p className="text-sm font-bold">No Primers in Workspace</p>
                <p className="text-[10px]">Add from Library or Custom Design</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
