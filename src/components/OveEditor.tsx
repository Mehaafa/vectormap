/* eslint-disable */
'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function OveEditor({ parsedSequence, onSequenceSave }: { parsedSequence?: any, onSequenceSave?: (seq: any) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null); // 🔥 Store editor instance to prevent re-creation
  const isInternalUpdateRef = useRef<boolean>(false); // 🛡️ Flag to prevent loop with onSequenceSave
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Dynamically inject the OVE dependencies to bypass Next.js compilation issues
    const loadScript = (src: string) => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = resolve;
        document.body.appendChild(script);
      });
    };

    const loadCss = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };

    const initEditor = async () => {
      // Load standard CSS required for OVE (BlueprintJS + OVE itself)
      loadCss('https://unpkg.com/@blueprintjs/core@3/lib/css/blueprint.css');
      loadCss('https://unpkg.com/@blueprintjs/icons@3/lib/css/blueprint-icons.css');
      loadCss('https://unpkg.com/open-vector-editor@18.3.6/umd/main.css'); // Version fixed to prevent updates breaking it

      // Load OVE and its peer dependencies via CDN
      await loadScript('https://unpkg.com/react@16.14.0/umd/react.production.min.js');
      await loadScript('https://unpkg.com/react-dom@16.14.0/umd/react-dom.production.min.js');
      await loadScript('https://unpkg.com/open-vector-editor@18.3.6/umd/open-vector-editor.js');
      
      setIsLoaded(true);
    };

    initEditor();
  }, []);

  useEffect(() => {
    if (isLoaded && containerRef.current && (window as any).createVectorEditor) {
      if (!editorInstanceRef.current) {
        // Only initialize once!
        editorInstanceRef.current = (window as any).createVectorEditor(containerRef.current, {
          editorName: 'VectorMapProto',
          isFullscreen: false,
          showMenuBar: true,
          readOnly: false,
          onSave: function(event: any, sequenceData: any) {
            if (onSequenceSave) {
              onSequenceSave({...sequenceData, _action: 'Manual Save'});
            }
          },
          ToolBarProps: {
            toolList: [
              "undoTool", "redoTool", "cutsiteTool", "featureTool", "oligoTool", "orfTool", "editTool", "findTool", "visibilityTool"
            ]
          }
        });
      }
      
      const vectorEditor = editorInstanceRef.current;
      
      // Pass the parsed sequence data if it exists
      if (parsedSequence) {
        // 🔒 Lock updates during internal sync to prevent infinite loops
        isInternalUpdateRef.current = true;
        vectorEditor.updateEditor({
          sequenceData: parsedSequence,
          readOnly: false
        });
        // 🔓 Unlock after sync (short timeout to handle async state updates)
        setTimeout(() => { isInternalUpdateRef.current = false; }, 100);
      }
    }
  }, [isLoaded, parsedSequence]);

  useEffect(() => {
    // Live Redux Auto-Tracking Hook
    // Because OVE is loaded dynamically, window.store may not exist precisely when this effect first runs.
    if (typeof window === 'undefined' || !isLoaded) return;

    let debounceTimer: NodeJS.Timeout;
    let unsubscribe: any;
    let baselineSequence = parsedSequence?.sequence || '';

    // Poll every 500ms until the Redux store is definitively hooked onto the window object
    const checkStoreInterval = setInterval(() => {
      const store = (window as any).store;
      if (store) {
        clearInterval(checkStoreInterval); // Found it! Stop polling.

        unsubscribe = store.subscribe(() => {
          if (isInternalUpdateRef.current) return; // 🔒 Skip if update triggered by prop change

          const state = store.getState();
          const editorState = state?.VectorEditor?.VectorMapProto;
          if (!editorState) return;

          const currentSeqData = editorState.sequenceDataHistory?.present || editorState.sequenceData;
          if (!currentSeqData || !currentSeqData.sequence) return;

          const latestSequence = currentSeqData.sequence;
          
          if (latestSequence !== baselineSequence && baselineSequence !== '') {
            const diffSize = latestSequence.length - baselineSequence.length;
            
            let actionLabel = 'Sequence Edited';
            if (diffSize > 0) actionLabel = `Fragment Inserted (+${diffSize} bp)`;
            else if (diffSize < 0) actionLabel = `Fragment Deleted (${diffSize} bp)`;

            baselineSequence = latestSequence;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
              // 🔬 Capture OVE circular plasmid map via native SVG serialization
              let snapshotDataUrl: string | undefined;
              try {
                // OVE renders a top-level <svg> inside .veCircularView
                const svgEl = document.querySelector('.veCircularView svg')
                          || document.querySelector('.veVectorViewer svg');
                
                if (svgEl) {
                  // Clone and fix dimensions so the SVG renders standalone
                  const clone = svgEl.cloneNode(true) as SVGElement;
                  const bbox = (svgEl as any).getBBox?.() || { width: 400, height: 400 };
                  const w = Math.max(svgEl.clientWidth || bbox.width, 100);
                  const h = Math.max(svgEl.clientHeight || bbox.height, 100);
                  clone.setAttribute('width', String(w));
                  clone.setAttribute('height', String(h));
                  clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
                  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                  
                  const svgString = new XMLSerializer().serializeToString(clone);
                  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                  const url = URL.createObjectURL(svgBlob);
                  
                  // Draw onto a canvas for PNG output
                  await new Promise<void>((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      canvas.width = w;
                      canvas.height = h;
                      const ctx = canvas.getContext('2d')!;
                      ctx.fillStyle = '#ffffff';
                      ctx.fillRect(0, 0, w, h);
                      ctx.drawImage(img, 0, 0, w, h);
                      snapshotDataUrl = canvas.toDataURL('image/png');
                      URL.revokeObjectURL(url);
                      resolve();
                    };
                    img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
                    img.src = url;
                  });
                }
              } catch (snapErr) {
                console.warn('SVG snapshot failed:', snapErr);
              }

              if (onSequenceSave) {
                onSequenceSave({...currentSeqData, _action: actionLabel, _snapshot: snapshotDataUrl});
              }
            }, 300);
          } else if (baselineSequence === '' && latestSequence) {
            baselineSequence = latestSequence;
          }
        });
      }
    }, 500);

    return () => {
      clearInterval(checkStoreInterval);
      if (unsubscribe) unsubscribe();
      clearTimeout(debounceTimer);
    };
  }, [isLoaded, parsedSequence, onSequenceSave]);

  return (
    <div className="w-full h-full relative bg-white overflow-hidden flex flex-col">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-50">
          <div className="text-white flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
            <span>Loading Open Vector Editor Engine...</span>
          </div>
        </div>
      )}
      {/* OVE mounts into this container */}
      <div ref={containerRef} className="w-full h-full OVE-container" />
    </div>
  );
}
