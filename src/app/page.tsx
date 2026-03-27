'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Activity, Beaker, FileText, Database, Settings, Layout, Download, Share2, ServerCrash, CheckCircle2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { parseSequenceFile, ParsedSequenceResult } from '@/lib/parsers';

// Dynamically import OVE to skip Server Side Rendering (SSR) since it relies on browser globals
const OveEditor = dynamic(() => import('@/components/OveEditor'), { ssr: false });

export default function VectorMapDashboard() {
  const [sequence, setSequence] = useState<string>('ATGCGTACGTAGCTAGCTAGCATCGATCGATCGATCGAATGCGTACGTAGCTAGCTAGCATCGATCGATCGATCGAATGCGTACGTAGCTAGCTAGCATCGATCGATCGATCGA');
  const [parsedData, setParsedData] = useState<ParsedSequenceResult | null>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [currentView, setCurrentView] = useState<string>('Dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Ping Supabase to check connection (Using auth as it doesn't require specific tables)
    const checkDbConnection = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;
        setDbStatus('connected');
      } catch (err) {
        console.error('Supabase connection error:', err);
        setDbStatus('error');
      }
    };
    
    checkDbConnection();
  }, []);

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
            // Find mock project
            const { data: projects } = await supabase.from('projects').select('id').eq('name', 'pUC19 Optimization').limit(1);
            if (projects && projects.length > 0) {
              const { error: insertError } = await supabase.from('sequences').insert({
                project_id: projects[0].id,
                name: result.parsedSequence.name || file.name,
                type: 'DNA',
                size_bp: result.parsedSequence.size,
                is_circular: result.parsedSequence.circular,
                sequence_data: result.parsedSequence
              });
              
              if (insertError) {
                console.error('Error saving to Supabase:', insertError);
              } else {
                console.log('Successfully saved to Supabase Sequences table!');
              }
            }
          } catch (dbErr) {
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

  return (
    <div className="flex h-screen w-full bg-black text-white font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-gray-800 bg-gray-950">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Beaker className="w-6 h-6 text-indigo-500 mr-3" />
          <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            VectorMap Pro
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<Layout size={18} />} label="Dashboard" active={currentView === 'Dashboard'} onClick={() => setCurrentView('Dashboard')} />
          <NavItem icon={<FileText size={18} />} label="Projects" active={currentView === 'Projects'} onClick={() => setCurrentView('Projects')} />
          <NavItem icon={<Activity size={18} />} label="Enzyme Analysis" active={currentView === 'Enzyme Analysis'} onClick={() => setCurrentView('Enzyme Analysis')} />
          <NavItem icon={<Database size={18} />} label="Features DB" active={currentView === 'Features DB'} onClick={() => setCurrentView('Features DB')} />
        </nav>
        
        <div className="p-4 border-t border-gray-800 space-y-4">
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800">
            {dbStatus === 'checking' && <span className="flex h-3 w-3 rounded-full bg-yellow-500 animate-pulse" />}
            {dbStatus === 'connected' && <CheckCircle2 size={16} className="text-emerald-500" />}
            {dbStatus === 'error' && <ServerCrash size={16} className="text-red-500" />}
            <span className={`text-sm font-medium ${dbStatus === 'connected' ? 'text-emerald-400' : dbStatus === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
              {dbStatus === 'checking' ? 'Connecting DB...' : dbStatus === 'connected' ? 'DB Connected' : 'DB Error'}
            </span>
          </div>
          <NavItem icon={<Settings size={18} />} label="Settings" active={currentView === 'Settings'} onClick={() => setCurrentView('Settings')} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-gray-800 bg-gray-900/40 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <h2 className="text-sm font-medium text-gray-300">Project: <span className="text-white font-semibold">{parsedData?.parsedSequence?.name || 'pUC19 Optimization'}</span></h2>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Saved</span>
          </div>
          <div className="flex items-center space-x-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".gb,.gbk,.fasta,.fas,.dna" 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white transition-all shadow-md"
            >
              <Upload size={16} />
              <span>Import File</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </header>

        {/* Workspace Layout */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {currentView === 'Dashboard' ? (
            <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
              {/* Center Area: Full width OVE Editor */}
              <div className="col-span-12 flex-col space-y-4">
                <div className="w-full h-[800px] bg-white rounded-xl shadow-2xl border border-gray-800 relative z-0">
                  <OveEditor parsedSequence={parsedData?.parsedSequence} />
                </div>
              </div>
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

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${active ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
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
