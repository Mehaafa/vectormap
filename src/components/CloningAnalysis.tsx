/* eslint-disable */
'use client';

import React, { useState, useMemo } from 'react';
import { 
  Dna, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Info,
  ShieldCheck,
  Zap,
  BarChart3,
  Activity
} from 'lucide-react';
import { analyzeGGFidelity } from '@/lib/cloningEngine';

export default function CloningAnalysis({ theme }: { theme: string }) {
  const [overhangs, setOverhangs] = useState<string[]>(['ATGC', 'GCTA']);
  const [newOverhang, setNewOverhang] = useState('');

  const result = useMemo(() => {
    return analyzeGGFidelity(overhangs);
  }, [overhangs]);

  const addOverhang = () => {
    const clean = newOverhang.trim().toUpperCase();
    if (clean.length === 4 && /^[ATGC]+$/.test(clean)) {
      if (overhangs.includes(clean)) {
        alert('This overhang is already in the list.');
        return;
      }
      setOverhangs([...overhangs, clean]);
      setNewOverhang('');
    }
  };

  const removeOverhang = (index: number) => {
    setOverhangs(overhangs.filter((_, i) => i !== index));
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${theme === 'dark' ? 'bg-gray-950 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Golden Gate Assembly Analyzer</h2>
            <p className="text-xs text-gray-500">4bp Overhang Fidelity & Success Probability (Potapov 2018 Model)</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
           <span className={`px-2 py-1 rounded text-[10px] font-bold border ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
             <Zap size={10} className="inline mr-1" />
             GGA Fidelity Engine Active
           </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Input Overhangs */}
        <div className={`w-1/3 flex flex-col p-6 border-r ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center">
            <Plus size={14} className="mr-2" />
            Define Overhang Junctions
          </label>

          <div className="space-y-4 overflow-y-auto flex-1 mb-4 pr-2">
            {overhangs.map((oh, idx) => (
              <div key={idx} className={`flex items-center space-x-3 p-3 rounded-xl border group transition-all ${theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:border-indigo-500' : 'bg-white border-gray-200 hover:border-indigo-400'}`}>
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                  #{idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-mono font-black tracking-widest text-indigo-400">{oh}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">4-Base Overhang</div>
                </div>
                <button 
                  onClick={() => removeOverhang(idx)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-800">
            <div className="flex space-x-2">
              <input 
                type="text"
                maxLength={4}
                placeholder="Ex: ATGC"
                value={newOverhang}
                onChange={(e) => setNewOverhang(e.target.value.toUpperCase())}
                className={`flex-1 px-4 py-3 rounded-xl border text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
              />
              <button 
                onClick={addOverhang}
                className="bg-indigo-500 text-white px-4 rounded-xl font-bold hover:bg-indigo-600 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Plus size={18} />
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 italic px-1">
              * Enter the 5'→3' 4-base overhang sequence.
            </p>
          </div>
        </div>

        {/* Right Panel: Analysis Results */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* Probability Gauge */}
            <div className="flex items-center justify-between p-8 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl overflow-hidden relative group">
              <div className="relative z-10 flex flex-col justify-center">
                <h3 className="text-xl font-bold mb-1">Expected Assembly Success</h3>
                <p className="text-indigo-100 text-sm max-w-[250px]">
                  Based on predicted ligation fidelity, thermodynamic stability and mismatch risk.
                </p>
              </div>

              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-white/20"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 - (364.4 * result.overallSuccessProbability) / 100}
                    className="text-white transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }}
                  />
                </svg>
                <span className="absolute text-3xl font-black">{result.overallSuccessProbability}%</span>
              </div>
            </div>

            {/* Visual Assembly Chain */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center">
                <Activity size={14} className="mr-2" />
                Assembly Junction Chain
              </h3>
              <div className="flex items-center flex-wrap gap-4 py-4 px-6 rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 overflow-x-auto">
                {overhangs.map((oh, idx) => (
                  <React.Fragment key={idx}>
                    <div className="px-4 py-6 rounded-xl bg-gray-800/80 border border-gray-700 flex flex-col items-center justify-center min-w-[100px] shadow-sm">
                      <div className="text-[10px] font-bold text-gray-500 mb-2">Fragment {idx + 1}</div>
                      <Dna size={20} className="text-gray-400 opacity-30" />
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <ArrowRight size={16} className="text-indigo-500" />
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {oh}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
                <div className="px-4 py-6 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col items-center justify-center min-w-[120px] shadow-sm">
                  <div className="text-[10px] font-bold text-indigo-400 mb-2">Vector Backbone</div>
                  <CheckCircle2 size={20} className="text-indigo-400" />
                </div>
              </div>
            </section>

            {/* Detailed Fidelity Report */}
            <section className="grid md:grid-cols-2 gap-6">
              {/* Warnings/Conflicts */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center">
                  <AlertTriangle size={14} className="mr-2 text-amber-500" />
                  Fidelity Audit & Warnings
                </h3>
                <div className="space-y-3">
                  {result.conflicts.length > 0 ? (
                    result.conflicts.map((conflict, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-start space-x-3">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <span>{conflict}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center space-x-3">
                      <CheckCircle2 size={16} />
                      <span className="font-bold">All junctions look unique. High fidelity predicted.</span>
                    </div>
                  )}

                  {result.reports.filter(r => r.isPalindrome).map((oh, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start space-x-3">
                       <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                       <div className="font-bold">CRITICAL: {oh.sequence} is palindromic. This overhang will likely self-ligate.</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistics/Pro-Tips */}
              <div className="space-y-4">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center">
                  <BarChart3 size={14} className="mr-2 text-indigo-400" />
                  Thermodynamic Guide
                </h3>
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Info size={16} className="mt-0.5 text-indigo-400 shrink-0" />
                      <div className="text-[11px] leading-relaxed text-gray-400">
                        <span className="font-bold text-gray-200 block mb-1">GC Balance rule</span>
                        골든 게이트 조립에서는 오버행 간의 Tm 차이를 최소화하는 것이 중요합니다. 가급적 모든 오버행이 2개의 GC와 2개의 AT를 포함하도록 설계하세요.
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Info size={16} className="mt-0.5 text-indigo-400 shrink-0" />
                      <div className="text-[11px] leading-relaxed text-gray-400">
                        <span className="font-bold text-gray-200 block mb-1">Mismatch risk (T4 Ligase)</span>
                        T4 리가아제는 G:T 미스매치에 취약합니다. 오버행 세트 내에서 하나의 염기 차이로 다른 오버행과 매칭되는 경우가 없는지 확인하세요.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
