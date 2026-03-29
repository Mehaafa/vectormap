/* eslint-disable */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Upload, File, Trash2, LogOut, Sun, Moon, Search, Sliders, Layout, Globe, Activity, Database, ChevronDown, ChevronRight, Beaker, FileText, X, Download, CheckCircle2, ServerCrash, Settings, GitFork, Microscope, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { parseSequenceFile, ParsedSequenceResult } from '@/lib/parsers';
import AuthModal from '@/components/AuthModal';
import AddgeneModal from '@/components/AddgeneModal';
import NCBIModal from '@/components/NCBIModal';

// Dynamically import complex client modules to skip Server Side Rendering (SSR) 
// since they rely on browser globals like window or internal DOM metrics.
const OveEditor = dynamic(() => import('@/components/OveEditor'), { ssr: false });
const HistoryTreeMap = dynamic(() => import('@/components/HistoryTreeMap'), { ssr: false });
const EnzymeAnalysis = dynamic(() => import('@/components/EnzymeAnalysis'), { ssr: false });
const PrimerAnalysis = dynamic(() => import('@/components/PrimerAnalysis'), { ssr: false });

export default function VectorMapDashboard() {
  const [sequence, setSequence] = useState<string>('ATGCGTACGTAGCTAGCTAGCATCGATCGATCGATCGAATGCGTACGTAGCTAGCTAGCATCGATCGATCGATCGAATGCGTACGTAGCTAGCTAGCATCGATCGATCGATCGA');
  const [parsedData, setParsedData] = useState<ParsedSequenceResult | null>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [currentView, setCurrentView] = useState<string>('Dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Set Light Mode as default
  const [session, setSession] = useState<any>(null);
  const [savedFiles, setSavedFiles] = useState<any[]>([]);
  const [isAddgeneModalOpen, setIsAddgeneModalOpen] = useState(false);
  const [isNCBIModalOpen, setIsNCBIModalOpen] = useState(false);
  const [isExternalMenuOpen, setIsExternalMenuOpen] = useState(false);
  const [isVectorsExpanded, setIsVectorsExpanded] = useState(true);
  const [dashboardTab, setDashboardTab] = useState<'Map' | 'History'>('Map');
  const [historyOperations, setHistoryOperations] = useState<any[]>([]);
  const [activeVectorId, setActiveVectorId] = useState<string | null>(null);

  // Use Ref to bypass deeply nested stale closures inside OVE's async save hook
  const historyOperationsRef = useRef<any[]>([]);
  useEffect(() => { historyOperationsRef.current = historyOperations; }, [historyOperations]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSequenceSave = useCallback(async (newSeqData: any) => {
    const actionLabel = newSeqData._action || 'Sequence Edited';
    
    // 🛡️ Prevent redundant updates if data hasn't changed (loop protection)
    if (parsedData?.parsedSequence && JSON.stringify(parsedData.parsedSequence) === JSON.stringify(newSeqData)) {
      return;
    }
    const op = {
      id: Date.now().toString(),
      label: actionLabel === 'Manual Save' ? 'Manual Checkpoint' : actionLabel,
      size: newSeqData.sequence.length,
      sequenceData: { ...newSeqData, _action: undefined, _snapshot: undefined } // Store raw data for mini-map rendering
    };

    if (actionLabel === 'Manual Save') {
      const newHistory = [...historyOperationsRef.current, op];
      setHistoryOperations(newHistory); // Visual update

      if (activeVectorId) {
        try {
          const { error } = await supabase.from('sequences').update({
            sequence_data: newSeqData,
            history_nodes: newHistory, // Sync the fresh array including this checkpoint
            size_bp: newSeqData.sequence.length
          }).eq('id', activeVectorId);
          
          if (error) throw error;
          alert('Vector Sequence & History Tree successfully synced to Supabase Cloud!');
          
          // Refresh the Projects list to update sizes
          const { data } = await supabase.from('sequences')
            .select('id, name, size_bp, created_at, sequence_data, history_nodes')
            .order('created_at', { ascending: false });
          if (data) setSavedFiles(data);
          
        } catch (err: any) {
          alert('Failed to save to cloud: ' + err.message);
        }
      } else {
        alert('Active Vector ID not found. Could not sync to cloud.');
      }
      return; 
    }

    // Default flow: Just visual auto-tracking append
    setHistoryOperations(prev => [...prev, op]);
  }, [activeVectorId]);

  useEffect(() => {
    // Ping Supabase to check connection (Using auth as it doesn't require specific tables)
    const checkDbConnection = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
        setDbStatus('connected');
      } catch (err) {
        console.error('Supabase connection error:', err);
        setDbStatus('error');
      }
    };
    
    checkDbConnection();

    // Listen for Auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch User's Cloud Files on load
  useEffect(() => {
    if (session) {
      const fetchFiles = async () => {
        const { data, error } = await supabase.from('sequences')
          .select('id, name, size_bp, created_at, sequence_data, history_nodes')
          .order('created_at', { ascending: false });
        
        if (data && !error) {
          setSavedFiles(data);
          
          if (data.length > 0) {
            let fileToLoad = data[0];
            if (typeof window !== 'undefined') {
              const lastId = localStorage.getItem('lastViewedVectorId');
              if (lastId) {
                const found = data.find(f => f.id === lastId);
                if (found) fileToLoad = found;
              }
            }
            // Load the determined file automatically!
            setSequence(fileToLoad.sequence_data.sequence || '');
            setParsedData({ success: true, messages: [], parsedSequence: fileToLoad.sequence_data });
            setActiveVectorId(fileToLoad.id);
            setHistoryOperations(fileToLoad.history_nodes || []);
          }
        }
      };
      fetchFiles();
    }
  }, [session]);

  const handleLoadNCBIVector = async (vectorData: any) => {
    try {
      const parsed = await parseSequenceFile(vectorData.gbText, `${vectorData.accession}.gb`);
      if (parsed.success && parsed.parsedSequence) {
        
        const { data: newRow, error: insertError } = await supabase.from('sequences').insert({
          user_id: session?.user?.id,
          name: vectorData.name,
          type: 'DNA',
          size_bp: parsed.parsedSequence.size || vectorData.size_bp,
          is_circular: parsed.parsedSequence.circular || true,
          sequence_data: parsed.parsedSequence,
          history_nodes: []
        }).select('id').single();
        
        if (insertError) alert('DB Insert Error: ' + insertError.message);
        else {
          if (newRow) setActiveVectorId(newRow.id);
          const fetchFiles = async () => {
            const { data } = await supabase.from('sequences').select('id, name, size_bp, created_at, sequence_data, history_nodes').order('created_at', { ascending: false });
            if (data) setSavedFiles(data);
          };
          await fetchFiles();
          setSequence(parsed.parsedSequence.sequence || '');
          setParsedData({ success: true, messages: [], parsedSequence: parsed.parsedSequence });
          setCurrentView('Dashboard');
        }
      } else {
        alert("Failed to parse NCBI GenBank format");
      }
    } catch (err: any) {
      alert("Error processing NCBI file: " + err.message);
    }
  };

  const handleLoadAddgeneVector = async (vectorData: any) => {
    // Save to local cloud permanently
    const { data: newRow, error: insertError } = await supabase.from('sequences').insert({
      user_id: session?.user?.id,
      name: vectorData.sequence_data.name,
      type: 'DNA',
      size_bp: vectorData.sequence_data.size,
      is_circular: vectorData.sequence_data.circular,
      sequence_data: vectorData.sequence_data,
      history_nodes: []
    }).select('id').single();
    
    if (insertError) {
      alert('Addgene import DB error: ' + insertError.message);
    } else {
      if (newRow) setActiveVectorId(newRow.id);
      // Refresh sidebar list
      const fetchFiles = async () => {
        const { data } = await supabase.from('sequences')
          .select('id, name, size_bp, created_at, sequence_data, history_nodes')
          .order('created_at', { ascending: false });
        if (data) setSavedFiles(data);
      };
      await fetchFiles();
      
      // Load visually
      setSequence(vectorData.sequence_data.sequence);
      setParsedData({ success: true, messages: [], parsedSequence: vectorData.sequence_data });
      setCurrentView('Dashboard');
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastViewedVectorId', vectorData.id);
      }
    }
  };

  const handleLoadFile = (fileData: any) => {
    setSequence(fileData.sequence_data.sequence || '');
    setParsedData({ success: true, messages: [], parsedSequence: fileData.sequence_data });
    setDashboardTab('Map');
    setActiveVectorId(fileData.id);
    setHistoryOperations(fileData.history_nodes || []); // Restore history from cloud or initialize
    setCurrentView('Dashboard');
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastViewedVectorId', fileData.id);
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (!confirm('정말 이 벡터를 리스트에서 지우시겠습니까?')) return;
    
    const { error } = await supabase.from('sequences').delete().eq('id', fileId);
    if (!error) {
      setSavedFiles(prev => prev.filter(f => f.id !== fileId));
      if (typeof window !== 'undefined' && localStorage.getItem('lastViewedVectorId') === fileId) {
        localStorage.removeItem('lastViewedVectorId');
      }
      // Reset view if they delete the file they are currently viewing
      if (parsedData?.parsedSequence?.name === savedFiles.find(f => f.id === fileId)?.name) {
        setParsedData(null);
      }
    } else {
      alert('삭제 실패: ' + error.message);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await parseSequenceFile(text, file.name);
      
      if (result.success && result.parsedSequence) {
        console.log("Parsed vector file successfully:", result.parsedSequence);
        setSequence(result.parsedSequence.sequence);
        setParsedData(result);
        
        // Attempt to save to Supabase
        if (dbStatus === 'connected') {
          try {
            // Insert Sequence Directly (Bypass Project Table constraints)
            const { data: newRow, error: insertError } = await supabase.from('sequences').insert({
              user_id: session?.user?.id,
              name: result.parsedSequence.name || file.name,
              type: 'DNA',
              size_bp: result.parsedSequence.size,
              is_circular: result.parsedSequence.circular,
              sequence_data: result.parsedSequence,
              history_nodes: []
            }).select('id').single();
            
            if (insertError) {
              console.error('Error saving to Supabase:', insertError);
              alert('데이터베이스 저장 실패: ' + insertError.message);
            } else {
              console.log('Successfully saved to Supabase Sequences table!');
              if (newRow) setActiveVectorId(newRow.id);
              // Auto-refresh the sidebar with the newly parsed vector
              const { data } = await supabase.from('sequences')
                .select('id, name, size_bp, created_at, sequence_data, history_nodes')
                .order('created_at', { ascending: false });
              if (data) setSavedFiles(data);
            }
          } catch (dbErr: any) {
            console.error('Catastrophic DB Error:', dbErr);
            alert('DB 에러: ' + dbErr.message);
            console.error('Supabase error:', dbErr);
          }
        }

        alert(`Successfully imported: ${result.parsedSequence.name} (${result.parsedSequence.size}bp)`);
      } else {
        alert("Failed to parse file: " + result.messages.join(", "));
      }
    } catch (e) {
      console.error("Error reading file:", e);
      alert("Error reading file.");
    }
  };

  const handleApplyEnzymes = useCallback((name: string, positions: number[], recognitionLen: number) => {
    if (!parsedData || !parsedData.parsedSequence) return;

    const newFeatures = positions.map(pos => ({
      id: `enzyme-${name}-${pos}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${name}`,
      type: 'restriction_site',
      start: pos,
      end: pos + recognitionLen - 1, // End at the end of recognition sequence
      strand: 1,
      color: '#a855f7' // Purple as requested
    }));

    const updatedSequence = {
      ...parsedData.parsedSequence,
      features: [...(parsedData.parsedSequence.features || []), ...newFeatures]
    };

    setParsedData({
      ...parsedData,
      parsedSequence: updatedSequence
    });

    alert(`${name} 효소 인식 서열(${recognitionLen}bp) ${positions.length}곳이 맵에 추가되었습니다 (자주색). Dashboard 탭에서 확인하세요!`);
  }, [parsedData]);

  const handleApplyPrimer = useCallback((primer: any) => {
    // 🛡️ Use functional update for absolute state consistency
    setParsedData((prev: any) => {
      if (!prev || !prev.parsedSequence) {
        alert('분석할 벡터 데이터가 없습니다.');
        return prev;
      }

      console.log('handleApplyPrimer executing with latest state for:', primer.name);
      
      const seq = prev.parsedSequence.sequence.toUpperCase();
      const query = primer.sequence.toUpperCase();
      
      let findPos = seq.indexOf(query);
      let strand = 1;

      if (findPos === -1) {
        const rc = query.split('').reverse().map((b: string) => {
          const map: any = { 'A':'T', 'T':'A', 'G':'C', 'C':'G' };
          return map[b] || b;
        }).join('');
        findPos = seq.indexOf(rc);
        strand = -1;
      }
      
      if (findPos === -1) {
        alert(`맵에서 '${query}' 서열을 찾을 수 없습니다. (정방향/역상보 모두 검색함)`);
        return prev;
      }

      const newFeature = {
        id: `primer-${primer.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `[Primer] ${primer.name}`,
        type: 'misc_feature', 
        start: findPos,
        end: findPos + query.length - 1,
        strand: (strand === 1 ? 1 : -1),
        color: '#3b82f6', 
        notes: { Tm: `${primer.tm}°C`, GC: `${primer.gc}%` }
      };

      // Ensure view switch happens
      setCurrentView('Dashboard');
      setDashboardTab('Map');

      return {
        ...prev,
        parsedSequence: {
          ...prev.parsedSequence,
          features: [...(prev.parsedSequence.features || []), newFeature],
          primers: [...(prev.parsedSequence.primers || []), { ...newFeature, type: 'primer_bind', sequence: query }]
        }
      };
    });
  }, []); // Stable reference

  if (!session) {
    return (
      <div className={`flex h-screen w-full font-sans overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
        <AuthModal />
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full font-sans overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Sidebar */}
      <aside className={`w-64 flex flex-col border-r transition-colors duration-300 ${theme === 'dark' ? 'border-gray-800 bg-gray-950' : 'border-gray-300 bg-white'}`}>
        <div className={`h-[72px] flex items-center px-5 border-b transition-colors duration-300 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="w-10 h-10 rounded-xl bg-[#3b82f6] flex items-center justify-center mr-3 shrink-0 shadow-sm">
            <Microscope className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <span className={`text-[16px] font-bold tracking-tight leading-tight ${theme === 'dark' ? 'text-white' : 'text-[#0f172a]'}`}>
              K-Biofoundry
            </span>
            <span className={`text-[12px] font-medium leading-tight mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              백터맵디자인 모듈
            </span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => {
              setCurrentView('Dashboard');
              setIsVectorsExpanded(prev => !prev);
            }}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
              currentView === 'Dashboard' 
                ? (theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700') 
                : (theme === 'dark' ? 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
            }`}
          >
            <div className="flex items-center">
              <Layout size={18} className="mr-3" />
              <span className="font-medium text-[13px]">My Vectors</span>
            </div>
            <div className="flex items-center space-x-2">
              {savedFiles.length > 0 && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  currentView === 'Dashboard' 
                    ? (theme === 'dark' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600') 
                    : (theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500')
                }`}>
                  {savedFiles.length}
                </span>
              )}
              {isVectorsExpanded ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
            </div>
          </button>
          
          {/* Sub-menu for User Vectors */}
          {currentView === 'Dashboard' && (
            <div className={`grid transition-all duration-300 ease-in-out ${isVectorsExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className={`pl-4 py-2 space-y-1 ml-4 mb-2 mt-1 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                  {savedFiles.length === 0 ? (
                    <div className={`text-[11px] p-2 mt-1 rounded border border-dashed text-center ${theme === 'dark' ? 'text-gray-500 border-gray-800' : 'text-gray-400 border-gray-300'}`}>
                      아직 등록된 벡터가 없습니다.<br/>우측 상단 <b>Import File</b> 버튼으로<br/>파일을 추가해 보세요.
                    </div>
                  ) : (
                    savedFiles.map(file => {
                      const isSelected = parsedData?.parsedSequence?.name === file.name;
                      return (
                        <div key={file.id} className="group relative w-full flex items-center">
                          <button 
                            onClick={() => handleLoadFile(file)}
                            className={`w-full flex items-center text-left px-3 py-1.5 text-xs rounded-md truncate transition-all pr-8 ${
                              isSelected 
                                ? (theme === 'dark' ? 'bg-indigo-500/20 text-indigo-300 font-medium' : 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium')
                                : (theme === 'dark' ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 uppercase')
                            }`}
                          >
                            <span className="mr-2 opacity-70">🧬</span>
                            <span className="truncate">{file.name}</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteFile(e, file.id)}
                            className={`absolute right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${theme === 'dark' ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-500 hover:bg-gray-200'}`}
                            title="Delete Vector"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          <NavItem icon={<FileText size={18} />} label="Projects Layout" theme={theme} active={currentView === 'Projects'} onClick={() => setCurrentView('Projects')} />
          <NavItem icon={<Activity size={18} />} label="Enzyme Analysis" theme={theme} active={currentView === 'Enzyme Analysis'} onClick={() => setCurrentView('Enzyme Analysis')} />
          <NavItem icon={<Zap size={18} />} label="Primer Analysis" theme={theme} active={currentView === 'Primer Analysis'} onClick={() => setCurrentView('Primer Analysis')} />
          <NavItem icon={<Database size={18} />} label="Features DB" theme={theme} active={currentView === 'Features DB'} onClick={() => setCurrentView('Features DB')} />
        </nav>
        
        <div className={`p-4 border-t space-y-4 transition-colors duration-300 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
            {dbStatus === 'checking' && <span className="flex h-3 w-3 rounded-full bg-yellow-500 animate-pulse" />}
            {dbStatus === 'connected' && <CheckCircle2 size={16} className="text-emerald-500" />}
            {dbStatus === 'error' && <ServerCrash size={16} className="text-red-500" />}
            <span className={`text-sm font-medium ${dbStatus === 'connected' ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : dbStatus === 'error' ? 'text-red-500' : 'text-yellow-500'}`}>
              {dbStatus === 'checking' ? 'Connecting DB...' : dbStatus === 'connected' ? 'DB Connected' : 'DB Error'}
            </span>
          </div>
          <NavItem icon={<Settings size={18} />} label="Settings" theme={theme} active={currentView === 'Settings'} onClick={() => setCurrentView('Settings')} />
          <button 
            onClick={() => supabase.auth.signOut()}
            className={`w-full flex items-center justify-center space-x-2 px-3 py-2 mt-2 rounded-lg text-sm text-red-500 transition-colors ${theme === 'dark' ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <AddgeneModal 
          isOpen={isAddgeneModalOpen} 
          onClose={() => setIsAddgeneModalOpen(false)} 
          onSelectVector={handleLoadAddgeneVector} 
          theme={theme} 
        />
        <NCBIModal 
          isOpen={isNCBIModalOpen} 
          onClose={() => setIsNCBIModalOpen(false)} 
          onSelectVector={handleLoadNCBIVector} 
          theme={theme} 
        />
        
        {/* Header */}
        <header className={`relative z-[100] h-16 flex items-center justify-between px-8 border-b transition-colors duration-300 ${theme === 'dark' ? 'border-gray-800 bg-gray-900/40 backdrop-blur-md' : 'border-gray-200 bg-white/60 backdrop-blur-md'}`}>
          <div className="flex items-center space-x-4">
            <h2 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Project: <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{parsedData?.parsedSequence?.name || 'Untitled Vector'}</span></h2>
            {parsedData && <span className={`px-2 py-0.5 rounded text-xs font-medium border ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>Saved</span>}
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg transition-colors border ${theme === 'dark' ? 'text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800' : 'text-gray-500 border-gray-200 hover:text-gray-900 hover:bg-gray-100'}`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".gb,.gbk,.fasta,.fas,.dna" 
              onChange={handleFileUpload} 
            />
            <div className="relative">
              <button 
                onClick={() => setIsExternalMenuOpen(!isExternalMenuOpen)}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all shadow-md ${theme === 'dark' ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
              >
                <Globe size={15} />
                <span>Import External</span>
              </button>
              
              {isExternalMenuOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl overflow-hidden border z-50 animate-in fade-in slide-in-from-top-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <button 
                    onClick={() => { setIsAddgeneModalOpen(true); setIsExternalMenuOpen(false); }}
                    className={`w-full flex items-center px-4 py-3 text-xs transition-colors text-left ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-indigo-50'}`}
                  >
                    <span className="font-semibold text-indigo-500 mr-2 w-4 text-center">A</span>
                    Addgene Data (Mock)
                  </button>
                  <button 
                    onClick={() => { setIsNCBIModalOpen(true); setIsExternalMenuOpen(false); }}
                    className={`w-full flex items-center px-4 py-3 text-xs transition-colors text-left border-t ${theme === 'dark' ? 'border-gray-700 text-gray-200 hover:bg-gray-700' : 'border-gray-100 text-gray-700 hover:bg-indigo-50'}`}
                  >
                    <span className="font-semibold text-emerald-500 mr-2 w-4 text-center">N</span>
                    NCBI Data (Live API)
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all shadow-md ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
            >
              <Upload size={15} />
              <span>Local File</span>
            </button>
            <button 
              onClick={() => {
                if (parsedData?.parsedSequence) {
                  handleSequenceSave({ ...parsedData.parsedSequence, _action: 'Manual Save' });
                } else {
                  alert('저장할 벡터 데이터가 없습니다.');
                }
              }}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all shadow-lg ${theme === 'dark' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'}`}
            >
              <Database size={16} />
              <span>Save to Cloud</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </header>

        {/* Workspace Layout */}
        <div className={`flex-1 overflow-hidden flex flex-col ${theme === 'dark' ? '' : 'bg-gray-50'}`}>
          {currentView === 'Dashboard' ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              {/* Floating Tab Bar Container */}
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center p-1 rounded-xl border shadow-lg backdrop-blur-md ${theme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'}`}>
                <button 
                  onClick={() => setDashboardTab('Map')}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${dashboardTab === 'Map' ? (theme === 'dark' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-500 text-white shadow-sm') : (theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`}
                >
                  🧬 Vector Map
                </button>
                <button 
                  onClick={() => setDashboardTab('History')}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center space-x-2 ${dashboardTab === 'History' ? (theme === 'dark' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-500 text-white shadow-sm') : (theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`}
                >
                  <span>🌳 History Tree</span>
                  {historyOperations.length > 0 && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] ml-1">{historyOperations.length}</span>
                  )}
                </button>
              </div>

              <div className="flex-1 relative w-full h-full">
                {/* Visual swap vs Unmounting to preserve workspace states */}
                <div className={`w-full h-full absolute inset-0 ${dashboardTab === 'Map' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                  <OveEditor parsedSequence={parsedData?.parsedSequence} onSequenceSave={(seq: any) => handleSequenceSave(seq)} />
                </div>
                <div className={`w-full h-full absolute inset-0 ${dashboardTab === 'History' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                  <HistoryTreeMap theme={theme} activeVectorName={parsedData?.parsedSequence?.name || 'Untitled Vector'} externalOperations={historyOperations} />
                </div>
              </div>
            </div>
          ) : currentView === 'Projects' ? (
            <div className="flex-1 overflow-auto p-8">
              <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>My Cloud Vectors</h2>
              {savedFiles.length === 0 ? (
                <div className="text-gray-500 text-center mt-12">No files saved yet. Import a file from the Dashboard to save it to your cloud.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {savedFiles.map((f) => (
                    <div key={f.id} onClick={() => handleLoadFile(f)} className={`p-5 rounded-xl border cursor-pointer hover:-translate-y-1 transition-all duration-200 shadow-sm ${theme === 'dark' ? 'bg-gray-900 border-gray-800 hover:border-indigo-500' : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-md'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <FileText className={`w-6 h-6 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        <span className="text-xs font-mono text-gray-500">{new Date(f.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className={`font-semibold text-lg mb-1 truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{f.name}</h3>
                      <p className="text-sm text-gray-500 mb-4">{f.size_bp.toLocaleString()} bp</p>
                      <button className={`w-full py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-indigo-600 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                        Load into Editor 🚀
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : currentView === 'Enzyme Analysis' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <EnzymeAnalysis
                parsedSequence={parsedData?.parsedSequence}
                theme={theme}
                onApplyEnzymes={handleApplyEnzymes}
              />
            </div>
          ) : currentView === 'Primer Analysis' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <PrimerAnalysis
                parsedSequence={parsedData?.parsedSequence}
                theme={theme}
                onApplyPrimer={handleApplyPrimer}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
                <Activity className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-200 mb-3">{currentView} Module</h2>
              <p className="text-gray-500 text-lg max-w-md">
                This section is currently under construction in the prototype phase.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, theme = 'dark', onClick }: { icon: React.ReactNode, label: string, active?: boolean, theme?: 'light'|'dark', onClick?: () => void }) {
  const activeClass = theme === 'dark' 
    ? 'bg-indigo-500/10 text-indigo-400 font-medium' 
    : 'bg-indigo-50 text-indigo-600 font-medium';
  const inactiveClass = theme === 'dark' 
    ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' 
    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
    
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-200 cursor-pointer ${active ? activeClass : inactiveClass}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
      <div className="text-xs text-gray-500 truncate">{label}</div>
      <div className="text-base font-semibold text-gray-200 mt-1">{value}</div>
    </div>
  );
}
