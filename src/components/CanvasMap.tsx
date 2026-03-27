/* eslint-disable */
'use client';

import React, { useEffect, useRef, useState } from 'react';

// Loosely typing the parsed sequence features for UI props
interface ParsedFeature {
  id: string;
  name: string;
  start: number;
  end: number;
  type: string;
  strand: number;
}

interface CanvasMapProps {
  sequence: string;
  parsedSequence?: {
    name: string;
    circular: boolean;
    size: number;
    features: ParsedFeature[];
  } | null;
}

const FEATURE_COLORS: Record<string, string> = {
  CDS: '#ef4444', // red
  promoter: '#10b981', // emerald
  terminator: '#ef4444', 
  origin: '#4f46e5', // indigo
  primer_bind: '#a855f7', // purple
  misc_feature: '#f59e0b', // amber
  rep_origin: '#3b82f6', // blue
};

export default function CanvasMap({ sequence, parsedSequence }: CanvasMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    
    // Clear previous drawing
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const width = 500;
    const height = 500;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 180;
    const seqLength = sequence.length || 1; // Prevent div by 0

    // 1. Draw main backbone circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx.toString());
    circle.setAttribute('cy', cy.toString());
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#374151'); // dark gray
    circle.setAttribute('stroke-width', '4');
    svg.appendChild(circle);

    // 2. Center textual info
    const isCircular = parsedSequence ? parsedSequence.circular : true;
    const plasmidName = parsedSequence ? parsedSequence.name : 'Vector Map';
    
    const textInfo = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textInfo.setAttribute('x', cx.toString());
    textInfo.setAttribute('y', cy.toString());
    textInfo.setAttribute('text-anchor', 'middle');
    textInfo.setAttribute('dominant-baseline', 'middle');
    textInfo.setAttribute('font-size', '20');
    textInfo.setAttribute('font-weight', 'bold');
    textInfo.setAttribute('fill', '#e5e7eb');
    textInfo.textContent = `${seqLength.toLocaleString()} bp`;
    svg.appendChild(textInfo);

    const titleInfo = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleInfo.setAttribute('x', cx.toString());
    titleInfo.setAttribute('y', (cy - 25).toString());
    titleInfo.setAttribute('text-anchor', 'middle');
    titleInfo.setAttribute('dominant-baseline', 'middle');
    titleInfo.setAttribute('font-size', '14');
    titleInfo.setAttribute('fill', '#9ca3af');
    titleInfo.textContent = plasmidName;
    svg.appendChild(titleInfo);

    // 3. Draw features if they exist
    if (parsedSequence && parsedSequence.features) {
      parsedSequence.features.forEach((feature) => {
        let startAngle = (feature.start / seqLength) * 2 * Math.PI;
        let endAngle = (feature.end / seqLength) * 2 * Math.PI;
        
        // Handle wrap-around the origin
        if (feature.end < feature.start) {
          endAngle += 2 * Math.PI;
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = describeArc(cx, cy, radius, startAngle, endAngle);
        
        const color = FEATURE_COLORS[feature.type] || FEATURE_COLORS.misc_feature;

        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '16');
        path.setAttribute('stroke-linecap', 'butt');
        path.style.cursor = 'pointer';
        path.style.transition = 'stroke-width 0.2s';

        // Hover effects via JS events instead of CSS subset pseudo-classes
        path.addEventListener('mouseenter', () => {
          path.setAttribute('stroke-width', '24');
          setHoveredFeature(`[${feature.type}] ${feature.name} (${feature.start}..${feature.end})`);
        });
        path.addEventListener('mouseleave', () => {
          path.setAttribute('stroke-width', '16');
          setHoveredFeature(null);
        });

        // Add native SVG tooltip fallback
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${feature.name} (${feature.type}): ${feature.start}-${feature.end}`;
        path.appendChild(title);

        svg.appendChild(path);
      });
    }

  }, [sequence, parsedSequence]);

  // SVG Math Helpers
  function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    // Start drawing from endAngle to startAngle clockwise if inverted, or normal
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    
    // Large arc flag is 1 if angle difference > 180deg (PI radians)
    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
    
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  }

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInRadians: number) {
    // Offset by -PI/2 to start at Top (12 o'clock)
    return {
      x: centerX + (radius * Math.cos(angleInRadians - Math.PI/2)),
      y: centerY + (radius * Math.sin(angleInRadians - Math.PI/2))
    };
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-xl border border-gray-800 shadow-inner overflow-hidden relative">
      <div className="absolute top-4 left-4 text-xs font-semibold tracking-wider text-gray-500 uppercase flex flex-col">
        <span>Vector Map Canvas</span>
      </div>
      
      {/* Dynamic Hover Tooltip Overlay */}
      <div className="absolute top-4 right-4 text-right">
        {hoveredFeature ? (
          <div className="px-3 py-1.5 bg-black/80 backdrop-blur-sm border border-gray-700/50 rounded-lg text-sm text-gray-200">
            {hoveredFeature}
          </div>
        ) : (
          <div className="text-xs text-gray-600 italic">Hover over elements</div>
        )}
      </div>

      {/* SVG ViewBox allows responsive scaling */}
      <svg ref={svgRef} viewBox="0 0 500 500" className="w-full h-full max-w-md max-h-md drop-shadow-lg p-6" />
    </div>
  );
}
