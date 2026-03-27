'use client';

import React from 'react';

interface SequenceEditorProps {
  sequence: string;
  onChange: (newSeq: string) => void;
}

export default function SequenceEditor({ sequence, onChange }: SequenceEditorProps) {
  return (
    <div className="w-full h-full flex flex-col bg-gray-900 rounded-xl border border-gray-800 shadow-inner overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50">
        <h3 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Sequence Editor</h3>
        <div className="text-xs text-gray-500">{sequence.length} bp</div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <textarea
          className="w-full h-full text-sm font-mono text-emerald-400 bg-transparent border-none resize-none focus:ring-0 leading-relaxed"
          value={sequence.replace(/(.{10})/g, '$1 ')}
          onChange={(e) => {
            const rawSequence = e.target.value.replace(/\s+/g, '').toUpperCase().replace(/[^ATCGU]/g, '');
            onChange(rawSequence);
          }}
          spellCheck={false}
          style={{
            wordBreak: 'break-all',
            lineHeight: '1.8',
            letterSpacing: '0.1em'
          }}
        />
      </div>
    </div>
  );
}
