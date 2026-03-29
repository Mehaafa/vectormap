/* eslint-disable */
'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Search, FlaskConical, Filter, ChevronDown, Dna, Scissors, AlertCircle, X, CheckSquare, Square } from 'lucide-react';
import { ENZYME_DB, RestrictionEnzyme, ALL_SUPPLIERS } from '@/lib/rebaseData';
import { analyzeAll, multiDigestFragments, EnzymeResult } from '@/lib/enzymeEngine';

// ─── Ladder definitions ────────────────────────────────────────────────────
const LADDERS: Record<string, number[]> = {
  'NEB 1 kb Plus': [10000, 8000, 6000, 5000, 4000, 3000, 2000, 1500, 1000, 700, 500, 400, 300, 200, 100],
  'NEB 1 kb':      [10000, 8000, 6000, 5000, 4000, 3000, 2000, 1650, 1000, 850, 650, 500, 400, 300, 200, 100],
  'NEB 100 bp':    [1500, 1200, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100],
  'λ / HindIII':   [23130, 9416, 6557, 4361, 2322, 2027, 564, 125],
};

// ─── GelLane component ──────────────────────────────────────────────────────
function GelLane({
  label, sizes, maxBp, minBp, highlight, onBandClick, color = '#6366f1',
}: {
  label: string; sizes: number[]; maxBp: number; minBp: number;
  highlight?: number | null; onBandClick?: (bp: number) => void; color?: string;
}) {
  const GEL_H = 340;
  const topPad = 20;
  const botPad = 20;
  const usable = GEL_H - topPad - botPad;

  const bpToY = (bp: number) => {
    const logMax = Math.log10(maxBp + 1);
    const logMin = Math.log10(Math.max(minBp, 50) + 1);
    const logBp  = Math.log10(bp + 1);
    const ratio  = (logMax - logBp) / (logMax - logMin);
    return topPad + ratio * usable;
  };

  return (
    <div className="flex flex-col items-center" style={{ width: 72 }}>
      <div className="text-[9px] text-gray-500 font-medium mb-1 text-center truncate w-full px-1">{label}</div>
      <svg width={72} height={GEL_H} className="rounded overflow-hidden bg-[#0d1117]">
        {/* Lane background */}
        <rect x={16} y={0} width={40} height={GEL_H} fill="#161b22" />
        {sizes.map((bp, i) => {
          const y = bpToY(bp);
          const isHighlight = highlight === bp;
          return (
            <g key={i} onClick={() => onBandClick?.(bp)} className="cursor-pointer">
              <rect
                x={17} y={y - 3} width={38} height={6}
                fill={isHighlight ? '#f59e0b' : color}
                opacity={isHighlight ? 1 : 0.85}
                rx={2}
              />
              {isHighlight && <rect x={16} y={y - 4} width={40} height={8} fill="none" stroke="#f59e0b" strokeWidth={1.5} rx={2} />}
            </g>
          );
        })}
      </svg>
      {/* bp labels for small count */}
      {sizes.length <= 8 && (
        <div className="flex flex-col items-center mt-1 space-y-px">
          {sizes.map((bp, i) => (
            <span key={i} className="text-[8px] text-gray-500 font-mono">{bp >= 1000 ? `${(bp/1000).toFixed(1)}k` : bp}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Gel panel ────────────────────────────────────────────────────────────
function GelPanel({
  results, sequence, circular, theme,
}: { results: EnzymeResult[]; sequence: string; circular: boolean; theme: string }) {
  const [selectedLadder, setSelectedLadder] = useState('NEB 1 kb Plus');
  const [agarose, setAgarose] = useState(1.0);
  const [highlightBp, setHighlightBp] = useState<number | null>(null);
  const [selectedEnzymes, setSelectedEnzymes] = useState<string[]>([]);

  const checkedResults = results.filter(r => r.cutCount > 0 && selectedEnzymes.includes(r.enzyme.name));
  const ladderBands = LADDERS[selectedLadder];
  const allBpValues = [...ladderBands, ...checkedResults.flatMap(r => r.fragments), sequence.length];
  const maxBp = Math.max(...allBpValues, 10000);
  const minBp = Math.min(...allBpValues, 50);

  const multiFragments = useMemo(() => {
    if (checkedResults.length === 0) return [sequence.length];
    return multiDigestFragments(sequence, checkedResults.map(r => r.enzyme), circular);
  }, [checkedResults, sequence, circular]);

  const toggleEnzyme = (name: string) => {
    setSelectedEnzymes(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const cutterResults = results.filter(r => r.cutCount > 0).slice(0, 20);

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Controls */}
      <div className={`flex items-center gap-4 px-4 py-2 border-b text-xs ${theme === 'dark' ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-2">
          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>래더</span>
          <select
            value={selectedLadder}
            onChange={e => setSelectedLadder(e.target.value)}
            className={`text-xs rounded px-2 py-1 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
          >
            {Object.keys(LADDERS).map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>아가로스</span>
          <input type="range" min={0.5} max={3} step={0.1} value={agarose}
            onChange={e => setAgarose(parseFloat(e.target.value))}
            className="w-20 accent-indigo-500" />
          <span className={`font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{agarose.toFixed(1)}%</span>
        </div>
        {highlightBp && (
          <button onClick={() => setHighlightBp(null)} className="ml-auto text-amber-500 flex items-center gap-1">
            <X size={12} /> 밴드 선택 해제 ({highlightBp} bp)
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Enzyme checklist for gel */}
        <div className={`w-44 shrink-0 overflow-y-auto border-r text-xs ${theme === 'dark' ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-white'}`}>
          <div className={`px-3 py-2 font-semibold border-b ${theme === 'dark' ? 'text-gray-300 border-gray-800' : 'text-gray-700 border-gray-200'}`}>젤에 추가할 효소</div>
          {cutterResults.length === 0 ? (
            <div className="p-3 text-gray-500">절단 효소 없음</div>
          ) : cutterResults.map(r => (
            <button key={r.enzyme.name}
              onClick={() => toggleEnzyme(r.enzyme.name)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${selectedEnzymes.includes(r.enzyme.name)
                ? (theme === 'dark' ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-700')
                : (theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50')}`}
            >
              {selectedEnzymes.includes(r.enzyme.name)
                ? <CheckSquare size={12} className="text-indigo-500 shrink-0" />
                : <Square size={12} className="shrink-0 opacity-40" />}
              <span className="font-semibold">{r.enzyme.name}</span>
              <span className="ml-auto text-[10px] opacity-60">{r.cutCount}×</span>
            </button>
          ))}
        </div>

        {/* Gel visualizer */}
        <div className="flex-1 overflow-x-auto overflow-y-auto flex items-start p-4 gap-2 bg-gradient-to-b from-gray-900 to-gray-950">
          {/* bp ruler */}
          <div className="flex flex-col items-end pr-1" style={{ paddingTop: 32 }}>
            {ladderBands.filter((_, i, a) => i % Math.max(1, Math.floor(a.length / 8)) === 0).map(bp => (
              <div key={bp} className="flex items-center">
                <span className="text-[9px] text-gray-500 font-mono">{bp >= 1000 ? `${(bp/1000).toFixed(bp >= 10000 ? 0 : 1)}k` : bp}</span>
                <div className="w-2 h-px bg-gray-600 ml-1" />
              </div>
            ))}
          </div>

          {/* Ladder lane */}
          <GelLane label="Ladder" sizes={ladderBands} maxBp={maxBp} minBp={minBp} color="#94a3b8" />

          {/* Per-enzyme lanes */}
          {checkedResults.map((r, i) => {
            const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
            return (
              <GelLane key={r.enzyme.name}
                label={r.enzyme.name}
                sizes={r.fragments}
                maxBp={maxBp} minBp={minBp}
                highlight={highlightBp}
                onBandClick={bp => setHighlightBp(bp === highlightBp ? null : bp)}
                color={colors[i % colors.length]}
              />
            );
          })}

          {/* Combined digest lane */}
          {checkedResults.length >= 2 && (
            <GelLane
              label="Combined"
              sizes={multiFragments}
              maxBp={maxBp} minBp={minBp}
              highlight={highlightBp}
              onBandClick={bp => setHighlightBp(bp === highlightBp ? null : bp)}
              color="#f97316"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main EnzymeAnalysis Component ────────────────────────────────────────
export default function EnzymeAnalysis({
  parsedSequence, theme, onApplyEnzymes,
}: { 
  parsedSequence?: any; 
  theme: string;
  onApplyEnzymes?: (name: string, positions: number[]) => void;
}) {

  const sequence: string = parsedSequence?.sequence ?? '';
  const circular: boolean = parsedSequence?.circular ?? true;
  const seqLen = sequence.length;

  const [search, setSearch] = useState('');
  const [cutterFilter, setCutterFilter] = useState<'all' | 'single' | 'non' | 'multi'>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('All');
  const [overhangFilter, setOverhangFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'cuts'>('name');
  const [activeTab, setActiveTab] = useState<'sites' | 'gel'>('sites');
  const [selectedEnzyme, setSelectedEnzyme] = useState<RestrictionEnzyme | null>(null);

  // Run analysis on the full DB — memoized so it only recomputes when sequence changes
  const allResults: EnzymeResult[] = useMemo(() => {
    if (!sequence) return [];
    return analyzeAll(sequence, ENZYME_DB, circular);
  }, [sequence, circular]);

  // Build lookup map
  const resultMap = useMemo(() => {
    const m: Record<string, EnzymeResult> = {};
    allResults.forEach(r => { m[r.enzyme.name] = r; });
    return m;
  }, [allResults]);

  // Filtered & sorted list
  const filteredEnzymes = useMemo(() => {
    let list = ENZYME_DB;

    // Search filter
    if (search) {
      const q = search.toUpperCase();
      list = list.filter(e =>
        e.name.toUpperCase().includes(q) || e.recognitionSeq.toUpperCase().includes(q)
      );
    }

    // Cut count filter
    if (sequence && cutterFilter !== 'all') {
      list = list.filter(e => {
        const cnt = resultMap[e.name]?.cutCount ?? 0;
        if (cutterFilter === 'single') return cnt === 1;
        if (cutterFilter === 'non')    return cnt === 0;
        if (cutterFilter === 'multi')  return cnt >= 2;
        return true;
      });
    }

    // Supplier filter
    if (supplierFilter !== 'All') {
      list = list.filter(e => e.suppliers.includes(supplierFilter));
    }

    // Overhang filter
    if (overhangFilter !== 'All') {
      list = list.filter(e => e.overhang === overhangFilter);
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'cuts') {
        const ca = resultMap[a.name]?.cutCount ?? 0;
        const cb = resultMap[b.name]?.cutCount ?? 0;
        return ca - cb;
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [search, cutterFilter, supplierFilter, overhangFilter, sortBy, resultMap, sequence]);

  const selectedResult = selectedEnzyme ? resultMap[selectedEnzyme.name] : null;

  const overhangLabel = (o: string) => o === '5prime' ? "5'" : o === '3prime' ? "3'" : 'Blunt';
  const overhangColor = (o: string, dark: boolean) => {
    if (o === '5prime') return dark ? 'text-indigo-400' : 'text-indigo-600';
    if (o === '3prime') return dark ? 'text-amber-400' : 'text-amber-600';
    return dark ? 'text-gray-400' : 'text-gray-500';
  };

  const cutBadgeColor = (cnt: number, dark: boolean) => {
    if (cnt === 0)  return dark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400';
    if (cnt === 1)  return dark ? 'bg-emerald-900/60 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (cnt <= 3)   return dark ? 'bg-amber-900/60 text-amber-400' : 'bg-amber-50 text-amber-700 border border-amber-200';
    return dark ? 'bg-red-900/60 text-red-400' : 'bg-red-50 text-red-700 border border-red-200';
  };

  // No sequence guard
  if (!sequence) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center gap-6 p-8 ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <FlaskConical className="w-10 h-10 text-indigo-400" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold mb-2">벡터 로드 필요</h2>
          <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            효소 분석을 시작하려면 먼저 좌측 사이드바에서 벡터를 선택하거나
            상단 <strong>Local File / Import External</strong> 버튼으로 서열을 불러오세요.
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs border ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
          <Dna size={14} className="text-indigo-400" />
          REBASE DB — {ENZYME_DB.length}개 효소 준비 완료
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full overflow-hidden ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* ─── Left panel: Enzyme table ─────────────────────────────────── */}
      <div className={`flex flex-col border-r ${theme === 'dark' ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-white'}`} style={{ width: 460 }}>

        {/* Header */}
        <div className={`px-4 pt-4 pb-3 border-b space-y-3 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <FlaskConical size={16} className="text-indigo-500" />
              REBASE 효소 데이터베이스
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${theme === 'dark' ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                {ENZYME_DB.length} enzymes
              </span>
            </h2>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              {seqLen.toLocaleString()} bp · {circular ? '원형' : '선형'}
            </div>
          </div>

          {/* Search */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="효소명 또는 인식 서열 검색..."
              className="bg-transparent outline-none flex-1 text-xs placeholder-gray-400"
            />
            {search && <button onClick={() => setSearch('')}><X size={12} className="text-gray-400" /></button>}
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'single', 'non', 'multi'] as const).map(f => {
              const labels: Record<string, string> = { all:'전체', single:'Single cut', non:'Non-cutter', multi:'Multi-cut' };
              const colors: Record<string, string> = { all:'bg-indigo-600', single:'bg-emerald-600', non:'bg-gray-600', multi:'bg-amber-500' };
              return (
                <button key={f}
                  onClick={() => setCutterFilter(f)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${cutterFilter === f
                    ? `${colors[f]} text-white`
                    : (theme === 'dark' ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>

          {/* Supplier & overhang dropdowns + sort */}
          <div className="flex gap-2">
            <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}
              className={`text-[11px] rounded px-2 py-1 border flex-1 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
              <option>All</option>
              {ALL_SUPPLIERS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={overhangFilter} onChange={e => setOverhangFilter(e.target.value)}
              className={`text-[11px] rounded px-2 py-1 border flex-1 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
              <option value="All">모든 오버행</option>
              <option value="5prime">5′ 돌출</option>
              <option value="3prime">3′ 돌출</option>
              <option value="blunt">Blunt</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className={`text-[11px] rounded px-2 py-1 border flex-1 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
              <option value="name">이름순</option>
              <option value="cuts">절단 횟수순</option>
            </select>
          </div>
        </div>

        {/* Stats bar */}
        <div className={`flex items-center gap-4 px-4 py-1.5 text-[11px] border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
          {['single','non','multi'].map(type => {
            const cnt = allResults.filter(r =>
              type === 'single' ? r.cutCount === 1 :
              type === 'non'    ? r.cutCount === 0 : r.cutCount >= 2
            ).length;
            const colors: Record<string, string> = {
              single: 'text-emerald-500', non: 'text-gray-500', multi: 'text-amber-500'
            };
            const labels: Record<string, string> = { single:'Single cutters', non:'Non-cutters', multi:'Multi-cutters' };
            return (
              <div key={type} className="flex items-center gap-1">
                <span className={`font-bold ${colors[type]}`}>{cnt}</span>
                <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>{labels[type]}</span>
              </div>
            );
          })}
          <span className={`ml-auto ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>{filteredEnzymes.length} 표시중</span>
        </div>

        {/* Table header */}
        <div className={`grid text-[10px] font-semibold uppercase tracking-wide px-3 py-1.5 border-b ${theme === 'dark' ? 'border-gray-800 text-gray-500 bg-gray-900' : 'border-gray-100 text-gray-400 bg-gray-50'}`}
          style={{ gridTemplateColumns: '1fr 90px 50px 55px 80px' }}>
          <span>효소명</span><span>인식 서열</span><span className="text-center">절단</span><span className="text-center">오버행</span><span>공급사</span>
        </div>

        {/* Table rows */}
        <div className="flex-1 overflow-y-auto">
          {filteredEnzymes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm gap-2">
              <Filter size={24} className="opacity-30" />
              검색 결과 없음
            </div>
          ) : filteredEnzymes.map(enzyme => {
            const result = resultMap[enzyme.name];
            const cnt = result?.cutCount ?? 0;
            const isSelected = selectedEnzyme?.name === enzyme.name;
            return (
              <button key={enzyme.name} onClick={() => setSelectedEnzyme(isSelected ? null : enzyme)}
                className={`w-full grid text-left px-3 py-2 transition-colors border-b text-xs ${isSelected
                  ? (theme === 'dark' ? 'bg-indigo-900/30 border-indigo-700' : 'bg-indigo-50 border-indigo-200')
                  : (theme === 'dark' ? 'border-gray-800/50 hover:bg-gray-900' : 'border-gray-100 hover:bg-gray-50')}`}
                style={{ gridTemplateColumns: '1fr 90px 50px 55px 80px' }}
              >
                <span className={`font-semibold ${isSelected ? (theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700') : ''}`}>
                  {enzyme.name}
                  {enzyme.methylationSensitive && <span className="ml-1 text-[9px] text-rose-500" title="Methylation sensitive">ᴹ</span>}
                </span>
                <span className="font-mono text-[10px] tracking-wider text-indigo-400">{enzyme.recognitionSeq}</span>
                <span className="text-center">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${cutBadgeColor(cnt, theme === 'dark')}`}>{cnt}</span>
                </span>
                <span className={`text-center text-[10px] font-medium ${overhangColor(enzyme.overhang, theme === 'dark')}`}>{overhangLabel(enzyme.overhang)}</span>
                <span className={`text-[10px] truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{enzyme.suppliers.slice(0, 2).join(', ')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Right panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Tab bar */}
        <div className={`flex items-center border-b px-4 ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          {(['sites', 'gel'] as const).map(tab => {
            const labels = { sites:'✂️ 절단 위치', gel:'🧫 가상 젤' };
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeTab === tab
                  ? (theme === 'dark' ? 'border-indigo-500 text-indigo-400' : 'border-indigo-600 text-indigo-600')
                  : `border-transparent ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'sites' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedEnzyme ? (
              <div className={`flex flex-col items-center justify-center h-64 gap-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                <Scissors size={32} className="opacity-30" />
                <p className="text-sm">좌측 테이블에서 효소를 선택하면<br />절단 위치와 단편 정보를 확인할 수 있습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Enzyme detail header */}
                <div className={`rounded-xl border p-4 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        {selectedEnzyme.name}
                        {selectedEnzyme.methylationSensitive && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${theme === 'dark' ? 'border-rose-800 text-rose-400 bg-rose-900/30' : 'border-rose-200 text-rose-600 bg-rose-50'}`}>
                            Methylation sensitive
                          </span>
                        )}
                      </h3>
                      <div className={`flex items-center gap-3 mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span>인식 서열: <code className="font-mono text-indigo-400">{selectedEnzyme.recognitionSeq}</code></span>
                        <span>오버행: <span className={overhangColor(selectedEnzyme.overhang, theme === 'dark')}>{overhangLabel(selectedEnzyme.overhang)}</span></span>
                        <span>타입: {selectedEnzyme.type}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-3xl font-black ${selectedResult?.cutCount === 1 ? 'text-emerald-500' : selectedResult?.cutCount === 0 ? 'text-gray-400' : 'text-amber-500'}`}>
                        {selectedResult?.cutCount ?? 0}
                      </span>
                      {selectedResult && selectedResult.cutCount > 0 && (
                        <button 
                          onClick={() => onApplyEnzymes?.(selectedEnzyme.name, selectedResult.cutSites.map(s => s.position))}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold shadow-lg shadow-purple-900/40 transition-all hover:scale-105"
                        >
                          ✨ 맵에 전체 추가 (Purple)
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedEnzyme.suppliers.map(s => (
                      <span key={s} className={`text-[11px] px-2 py-0.5 rounded border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* Cut sites */}
                {selectedResult && selectedResult.cutCount > 0 ? (
                  <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className={`px-4 py-2.5 border-b text-xs font-semibold ${theme === 'dark' ? 'border-gray-800 text-gray-300' : 'border-gray-100 text-gray-700'}`}>
                      절단 위치 ({selectedResult.cutSites.length}개)
                    </div>
                    <div className="divide-y divide-gray-800/30">
                      {selectedResult.cutSites.map((site, i) => (
                        <div key={i} className={`flex items-center px-4 py-2 text-sm gap-4 ${theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${theme === 'dark' ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>{i + 1}</span>
                          <span className="font-mono text-indigo-400">{site.position.toLocaleString()} bp</span>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            {site.strand === 1 ? 'Top strand (+)' : 'Bottom strand (−)'}
                          </span>
                          <span className={`ml-auto text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            {((site.position / seqLen) * 100).toFixed(1)}%
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onApplyEnzymes?.(selectedEnzyme.name, [site.position]); }}
                            className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'hover:bg-purple-900/50 text-purple-400' : 'hover:bg-purple-50 text-purple-600'}`}
                            title="이 위치만 맵에 추가"
                          >
                            <CheckSquare size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center gap-3 p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-800 bg-gray-900 text-gray-500' : 'border-gray-200 bg-white text-gray-400'}`}>
                    <AlertCircle size={18} className="shrink-0 opacity-50" />
                    이 효소는 현재 서열을 절단하지 않습니다.
                  </div>
                )}

                {/* Fragments */}
                {selectedResult && selectedResult.fragments.length > 0 && selectedResult.cutCount > 0 && (
                  <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className={`px-4 py-2.5 border-b text-xs font-semibold ${theme === 'dark' ? 'border-gray-800 text-gray-300' : 'border-gray-100 text-gray-700'}`}>
                      단편 ({selectedResult.fragments.length}개)
                    </div>
                    <div className="p-4 flex flex-wrap gap-2">
                      {selectedResult.fragments.map((frag, i) => (
                        <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold ${theme === 'dark' ? 'bg-gray-800 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                          {frag.toLocaleString()} bp
                        </div>
                      ))}
                    </div>
                    {/* Visual bar */}
                    <div className="px-4 pb-4">
                      <div className="flex rounded-full overflow-hidden h-4 gap-px">
                        {selectedResult.fragments.map((frag, i) => {
                          const pct = (frag / seqLen) * 100;
                          const colors = ['bg-indigo-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-purple-500','bg-cyan-500'];
                          return <div key={i} style={{ width: `${pct}%` }} className={`${colors[i % colors.length]} opacity-80`} title={`${frag} bp`} />;
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <GelPanel results={allResults} sequence={sequence} circular={circular} theme={theme} />
        )}
      </div>
    </div>
  );
}
