'use client';

import React, { useEffect, useRef } from 'react';

interface CanvasMapProps {
  sequence: string;
}

export default function CanvasMap({ sequence }: CanvasMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // A very basic mockup of a circular plasmid renderer.
  // In a real application, we would use D3 or a specialized library.
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    
    // Clear previous drawing
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const width = 400;
    const height = 400;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 150;

    // Draw main circle (plasmid backbone)
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx.toString());
    circle.setAttribute('cy', cy.toString());
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#4f46e5'); // Indigo-600
    circle.setAttribute('stroke-width', '8');
    svg.appendChild(circle);

    // Mockup feature 1 (e.g. Origin of Replication)
    const feature1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const startAngle1 = 0;
    const endAngle1 = Math.PI / 4; // 45 degrees
    const f1Path = describeArc(cx, cy, radius, startAngle1, endAngle1);
    feature1.setAttribute('d', f1Path);
    feature1.setAttribute('fill', 'none');
    feature1.setAttribute('stroke', '#10b981'); // Emerald-500
    feature1.setAttribute('stroke-width', '16');
    svg.appendChild(feature1);

    // Mockup feature 2 (e.g. AmpR marker)
    const feature2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const startAngle2 = Math.PI;
    const endAngle2 = Math.PI + (Math.PI / 3); // 60 degrees
    const f2Path = describeArc(cx, cy, radius, startAngle2, endAngle2);
    feature2.setAttribute('d', f2Path);
    feature2.setAttribute('fill', 'none');
    feature2.setAttribute('stroke', '#ef4444'); // Red-500
    feature2.setAttribute('stroke-width', '16');
    svg.appendChild(feature2);

    // Center text
    const textInfo = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textInfo.setAttribute('x', cx.toString());
    textInfo.setAttribute('y', cy.toString());
    textInfo.setAttribute('text-anchor', 'middle');
    textInfo.setAttribute('dominant-baseline', 'middle');
    textInfo.setAttribute('font-size', '18');
    textInfo.setAttribute('font-weight', 'bold');
    textInfo.setAttribute('fill', '#e5e7eb');
    textInfo.textContent = `${sequence.length} bp`;
    svg.appendChild(textInfo);

    const titleInfo = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleInfo.setAttribute('x', cx.toString());
    titleInfo.setAttribute('y', (cy - 25).toString());
    titleInfo.setAttribute('text-anchor', 'middle');
    titleInfo.setAttribute('dominant-baseline', 'middle');
    titleInfo.setAttribute('font-size', '14');
    titleInfo.setAttribute('fill', '#9ca3af');
    titleInfo.textContent = `pUC19 Mock`;
    svg.appendChild(titleInfo);

  }, [sequence]);

  // Helper function to draw an SVG arc
  function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  }

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInRadians: number) {
    return {
      x: centerX + (radius * Math.cos(angleInRadians - Math.PI/2)),
      y: centerY + (radius * Math.sin(angleInRadians - Math.PI/2))
    };
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-xl border border-gray-800 shadow-inner overflow-hidden relative">
      <div className="absolute top-4 left-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
        Vector Map Canvas
      </div>
      <svg ref={svgRef} width="400" height="400" className="drop-shadow-lg" />
    </div>
  );
}
