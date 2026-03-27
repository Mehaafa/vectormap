'use client';

import React, { useState } from 'react';
import CanvasMap from '@/components/CanvasMap';
import SequenceEditor from '@/components/SequenceEditor';
import { Activity, Beaker, FileText, Database, Settings, Layout, Download, Share2 } from 'lucide-react';

export default function VectorMapDashboard() {
  const [sequence, setSequence] = useState<string>('ATGCGTACGTAGCTAGCTAGCATCGATCGATCGATCGAATGCGTACGTAGCTAGCTAGCATCGATCGATCGATCGAATGCGTACGTAGCTAGCTAGCATCGATCGATCGATCGA');

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
          <NavItem icon={<Layout size={18} />} label="Dashboard" active />
          <NavItem icon={<FileText size={18} />} label="Projects" />
          <NavItem icon={<Activity size={18} />} label="Enzyme Analysis" />
          <NavItem icon={<Database size={18} />} label="Features DB" />
        </nav>
        
        <div className="p-4 border-t border-gray-800">
          <NavItem icon={<Settings size={18} />} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-gray-800 bg-gray-900/40 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <h2 className="text-sm font-medium text-gray-300">Project: <span className="text-white font-semibold">pUC19 Optimization</span></h2>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Saved</span>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
              <Share2 size={16} />
              <span>Share</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </header>

        {/* Workspace Layout */}
        <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
          
          {/* Left Column (Canvas) */}
          <div className="col-span-12 lg:col-span-7 flex flex-col space-y-4">
            <div className="flex-1 rounded-2xl border border-gray-800 bg-gray-900/30 overflow-hidden relative shadow-2xl">
              <CanvasMap sequence={sequence} />
            </div>
          </div>

          {/* Right Column (Sequence & Tools) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col space-y-6">
            <div className="flex-1 flex flex-col max-h-[50%]">
              <SequenceEditor sequence={sequence} onChange={setSequence} />
            </div>
            
            {/* Quick Properties Card */}
            <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-5 shadow-inner">
              <h3 className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-4">Properties & Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Length (bp)" value={sequence.length} />
                <StatCard label="GC Content" value={`${((sequence.match(/[GC]/g)?.length || 0) / sequence.length * 100).toFixed(1)}%`} />
                <StatCard label="Topology" value="Circular" />
                <StatCard label="Features" value="5 annotated" />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <a href="#" className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${active ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}>
      {icon}
      <span>{label}</span>
    </a>
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
