/* eslint-disable */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

export default function OveEditor({ parsedSequence, onSequenceSave }: { parsedSequence?: any, onSequenceSave?: (seq: any) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
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
      const vectorEditor = (window as any).createVectorEditor(containerRef.current, {
        editorName: 'VectorMapProto',
        isFullscreen: false, // Ensure it stays within our custom dashboard frame!
        showMenuBar: true,
        readOnly: false, // 🔥 Force unlocking the editor to allow pasting/editing
        onSave: function(event: any, sequenceData: any, editorState: any, onSuccessCallback: any) {
          // Manual Save Hook (Fallback)
          if (onSequenceSave) {
            onSequenceSave({...sequenceData, _action: 'Manual Save'});
          }
          onSuccessCallback();
        },
        ToolBarProps: {
          toolList: [
            "undoTool", "redoTool", "cutsiteTool", "featureTool", "oligoTool", "orfTool", "editTool", "findTool", "visibilityTool"
          ]
        }
      });
      
      // Pass the parsed sequence data if it exists
      if (parsedSequence) {
        vectorEditor.updateEditor({
          sequenceData: parsedSequence,
          readOnly: false
        });
      } else {
        // Load a mockup template if none
        vectorEditor.updateEditor({
          readOnly: false,
          sequenceData: {
            name: 'Untitled Vector',
            circular: true,
            sequence: 'TTTTGAGAATGCGTACGTAGCTAGCTAGCATCGATCGATCGATCGAATGCGTACGTAGCTAGCTAGCATCGATCGATCGATCGAATGCGTACGTAGCTAGCTAGCATCGATCGATCGATCGA',
            features: [
              { id: '1', start: 0, end: 10, type: 'promoter', name: 'Example Promoter' }
            ]
          }
        });
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
              // 🔬 Capture a live screenshot of the circular plasmid map
              let snapshotDataUrl: string | undefined;
              try {
                // OVE renders its circular map inside a VectorMap SVG element
                const oveSvg = document.querySelector('.veCircularView') as HTMLElement
                         || document.querySelector('.veVectorViewer') as HTMLElement
                         || containerRef.current as HTMLElement;
                if (oveSvg) {
                  const canvas = await html2canvas(oveSvg, {
                    scale: 0.5,         // Keep the thumbnail compact
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    logging: false
                  });
                  snapshotDataUrl = canvas.toDataURL('image/png');
                }
              } catch (snapErr) {
                // Non-fatal: If screenshot fails, history node still works with icon fallback
                console.warn('Plasmid snapshot failed:', snapErr);
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
