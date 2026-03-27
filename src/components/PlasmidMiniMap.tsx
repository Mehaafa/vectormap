/* eslint-disable */
import React from 'react';

// Feature color palette (matches OVE's default color scheme)
const FEATURE_COLORS: Record<string, string> = {
  'promoter': '#f97316',
  'gene': '#3b82f6',
  'CDS': '#8b5cf6',
  'terminator': '#ef4444',
  'rep_origin': '#10b981',
  'misc_feature': '#f59e0b',
  'primer_bind': '#06b6d4',
  'RBS': '#ec4899',
  'default': '#6366f1'
};

interface Feature {
  start: number;
  end: number;
  type?: string;
  color?: string;
  name?: string;
}

interface PlasmidMiniMapProps {
  sequenceData: {
    sequence?: string;
    size?: number;
    name?: string;
    features?: Feature[];
    circular?: boolean;
  };
  size?: number;
}

export default function PlasmidMiniMap({ sequenceData, size = 120 }: PlasmidMiniMapProps) {
  if (!sequenceData) return null;

  const seqLen = sequenceData.sequence?.length || sequenceData.size || 1;
  const features = sequenceData.features || [];
  const r = size * 0.36;          // Outer ring radius
  const rInner = r * 0.72;        // Inner ring edge
  const cx = size / 2;
  const cy = size / 2;

  // Convert bp position to SVG arc angle (0° = top, clockwise)
  const bpToAngle = (bp: number) => (bp / seqLen) * 2 * Math.PI - Math.PI / 2;

  // Build an SVG arc path for a feature arc
  const arcPath = (feature: Feature) => {
    const start = bpToAngle(feature.start);
    const end = bpToAngle(Math.min(feature.end, seqLen - 1));
    const largeArc = (feature.end - feature.start) > seqLen / 2 ? 1 : 0;

    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const x3 = cx + rInner * Math.cos(end);
    const y3 = cy + rInner * Math.sin(end);
    const x4 = cx + rInner * Math.cos(start);
    const y4 = cy + rInner * Math.sin(start);

    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring background */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={r - rInner} />
      {/* Feature arcs */}
      {features.slice(0, 30).map((f, i) => {
        const color = f.color || FEATURE_COLORS[f.type || ''] || FEATURE_COLORS['default'];
        return (
          <path key={i} d={arcPath(f)} fill={color} opacity={0.85} />
        );
      })}
      {/* Center text: BP count */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size * 0.085} fontWeight="700" fill="#1e293b" fontFamily="sans-serif">
        {seqLen >= 1000 ? `${(seqLen / 1000).toFixed(1)}kb` : `${seqLen}bp`}
      </text>
      <text x={cx} y={cy + size * 0.1} textAnchor="middle" fontSize={size * 0.07} fill="#94a3b8" fontFamily="sans-serif">
        {sequenceData.circular !== false ? 'circular' : 'linear'}
      </text>
      {/* Zero-position marker */}
      <line x1={cx} y1={cy - r * 1.1} x2={cx} y2={cy - r * 0.85} stroke="#334155" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
