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
  Copy
} from 'lucide-react';
import { calculateTm, calculateGC, calculateMW } from '@/lib/primerEngine';

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
        <div className={`w-1/2 overflow-y-auto p-6 border-r ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="space-y-6">
            {/* Input Section */}
            <section className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center">
                <Search size={14} className="mr-2" />
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
            </section>

            {/* Parameter Section */}
            <section className="space-y-4">
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

            <button 
              disabled={!analysis}
              onClick={handleAddPrimer}
              className={`w-full py-3 rounded-xl flex items-center justify-center space-x-2 font-bold transition-all ${
                analysis 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 active:scale-95' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus size={18} />
              <span>Add to Workspace</span>
            </button>
          </div>
        </div>

        {/* Right Panel: Live Analysis & List */}
        <div className={`w-1/2 overflow-y-auto flex flex-col ${theme === 'dark' ? 'bg-gray-900/20' : 'bg-gray-100/50'}`}>
          {analysis ? (
            <div className="p-6 space-y-6">
              <div className={`p-5 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-gray-900 border-gray-800 shadow-black' : 'bg-white border-gray-200 shadow-gray-200'}`}>
                <h3 className="text-sm font-bold mb-4 flex items-center">
                  <Activity size={16} className="text-indigo-400 mr-2" />
                  Live Analysis
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Tm (NN)</div>
                    <div className="text-3xl font-black text-indigo-400">{analysis.tm}°C</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">GC Content</div>
                    <div className="text-2xl font-bold">{analysis.gc}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Length</div>
                    <div className="text-2xl font-bold">{analysis.length}bp</div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-800 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex justify-between bg-gray-800/40 p-2 rounded">
                    <span className="text-gray-500 italic">MW:</span>
                    <span className="font-mono text-gray-300">{analysis.mw.toLocaleString()} Da</span>
                  </div>
                  <div className="flex justify-between bg-gray-800/40 p-2 rounded">
                    <span className="text-gray-500 italic">Status:</span>
                    <span className="text-emerald-400 font-bold">READY</span>
                  </div>
                </div>
              </div>

              {/* Warnings/Checks */}
              <div className={`p-4 rounded-xl border flex items-start space-x-3 ${theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                <Info size={16} className="mt-0.5 shrink-0" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold">Pro-Tip:</p>
                  <p>PCR 효율을 높이려면 Tm 값을 55~65°C 사이로 맞추는 것이 좋습니다. 현재 {analysis.tm < 50 ? '낮음' : analysis.tm > 70 ? '높음' : '적절함'} 수준입니다.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-6">
                <BarChart3 size={32} className="text-gray-600" />
              </div>
              <h3 className="text-gray-400 font-bold mb-2">No Sequence Detected</h3>
              <p className="text-gray-600 text-xs max-w-xs">왼쪽 입력창에 서열을 붙여넣거나 벡터 맵에서 영역을 선택하여 분석을 시작하세요.</p>
            </div>
          )}

          {/* Saved Primers List */}
          {savedPrimers.length > 0 && (
            <div className="px-6 pb-6 mt-auto">
              <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <span>Workspace Primers ({savedPrimers.length})</span>
                <span className="text-indigo-400">Recent</span>
              </div>
              <div className="space-y-3">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
