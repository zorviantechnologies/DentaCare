import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles, Info } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToothSurface = 'mesial' | 'distal' | 'buccal' | 'lingual' | 'occlusal';

export interface SurfaceCondition {
  surface: ToothSurface;
  condition: string;
}

export interface ToothRecord {
  toothNumber: number;
  status: string;
  notes?: string | null;
  surfaces?: SurfaceCondition[];
}

interface FdiDentalChartProps {
  toothHistory: ToothRecord[];
  onUpdateTooth: (toothNumber: number, status: string, notes: string, surfaces?: SurfaceCondition[]) => Promise<void>;
  isReadOnly?: boolean;
}

// ─── Condition Definitions ───────────────────────────────────────────────────

export interface ConditionMeta {
  label: string;
  fill: string;        // Solid accent color
  stroke: string;      // Light stroke line color for symptoms
  lightFill: string;   // Translucent symptom fill
  lineDash?: string;   // Dash pattern for symptom overlay lines
  text: string;
  badgeBg: string;
}

export const CONDITIONS: Record<string, ConditionMeta> = {
  HEALTHY: {
    label: 'Healthy',
    fill: '#ffffff',
    stroke: '#94a3b8',
    lightFill: 'rgba(255, 255, 255, 0.95)',
    text: '#64748b',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  DECAYED: {
    label: 'Decayed / Caries',
    fill: '#ef4444',
    stroke: '#991b1b',
    lightFill: 'rgba(239, 68, 68, 0.88)',
    lineDash: '3,2',
    text: '#ffffff',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  FILLED: {
    label: 'Filling',
    fill: '#3b82f6',
    stroke: '#1e40af',
    lightFill: 'rgba(59, 130, 246, 0.88)',
    text: '#ffffff',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  EXTRACTED: {
    label: 'Extracted',
    fill: '#64748b',
    stroke: '#1e293b',
    lightFill: 'rgba(100, 116, 139, 0.85)',
    lineDash: '4,2',
    text: '#ffffff',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  CROWN: {
    label: 'Crown / Cap',
    fill: '#f59e0b',
    stroke: '#92400e',
    lightFill: 'rgba(245, 158, 11, 0.88)',
    text: '#ffffff',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  BRIDGE: {
    label: 'Bridge',
    fill: '#06b6d4',
    stroke: '#155e75',
    lightFill: 'rgba(6, 182, 212, 0.88)',
    text: '#ffffff',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  IMPLANT: {
    label: 'Implant',
    fill: '#10b981',
    stroke: '#065f46',
    lightFill: 'rgba(16, 185, 129, 0.88)',
    text: '#ffffff',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  ROOT_CANAL: {
    label: 'Root Canal (RCT)',
    fill: '#a855f7',
    stroke: '#6b21a8',
    lightFill: 'rgba(168, 85, 247, 0.88)',
    text: '#ffffff',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  MISSING: {
    label: 'Missing',
    fill: '#94a3b8',
    stroke: '#334155',
    lightFill: 'rgba(148, 163, 184, 0.85)',
    lineDash: '2,2',
    text: '#475569',
    badgeBg: 'bg-slate-200 text-slate-600 border-slate-300',
  },
  PLANNED: {
    label: 'Planned Treatment',
    fill: '#f97316',
    stroke: '#9a3412',
    lightFill: 'rgba(249, 115, 22, 0.88)',
    lineDash: '4,2',
    text: '#ffffff',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
  },
};

export const SURFACE_LABELS: Record<ToothSurface, string> = {
  occlusal: 'Occlusal / Incisal (Center)',
  buccal: 'Buccal / Labial (Top)',
  lingual: 'Lingual / Palatal (Bottom)',
  mesial: 'Mesial (Left)',
  distal: 'Distal (Right)',
};

// ─── Tooth Name Helper ────────────────────────────────────────────────────────

function getToothName(n: number): string {
  const quadMap: Record<number, string> = {
    1: 'Upper Right',
    2: 'Upper Left',
    3: 'Lower Left',
    4: 'Lower Right',
  };
  const typeMap: Record<number, string> = {
    1: 'Central Incisor',
    2: 'Lateral Incisor',
    3: 'Canine',
    4: 'First Premolar',
    5: 'Second Premolar',
    6: 'First Molar',
    7: 'Second Molar',
    8: 'Third Molar (Wisdom)',
  };
  const q = Math.floor(n / 10);
  const t = n % 10;
  return `${quadMap[q] ?? ''} ${typeMap[t] ?? 'Tooth'}`;
}

type ToothCategory = 'incisor' | 'canine' | 'premolar' | 'molar';

function getToothCategory(n: number): ToothCategory {
  const t = n % 10;
  if (t === 1 || t === 2) return 'incisor';
  if (t === 3) return 'canine';
  if (t === 4 || t === 5) return 'premolar';
  return 'molar';
}

function isUpper(n: number): boolean {
  return n >= 11 && n <= 28;
}

// ─── Condition / Surface Color Resolver ───────────────────────────────────────

function getSurfaceStyle(
  surface: ToothSurface,
  surfaces: SurfaceCondition[],
  overallStatus?: string
): { lightFill: string; stroke: string; lineDash?: string; hasCondition: boolean } {
  if (Array.isArray(surfaces) && surfaces.length > 0) {
    const hit = surfaces.find(s => s.surface === surface);
    if (hit && hit.condition !== 'HEALTHY') {
      const c = CONDITIONS[hit.condition];
      if (c) {
        return { lightFill: c.lightFill, stroke: c.stroke, lineDash: c.lineDash, hasCondition: true };
      }
    }
  }

  if (overallStatus && overallStatus !== 'HEALTHY') {
    const c = CONDITIONS[overallStatus];
    if (c) {
      return { lightFill: c.lightFill, stroke: c.stroke, lineDash: c.lineDash, hasCondition: true };
    }
  }

  return { lightFill: 'none', stroke: 'none', hasCondition: false };
}

// ─── Anatomical Tooth Component ───────────────────────────────────────────────

interface AnatomicalToothProps {
  number: number;
  surfaces: SurfaceCondition[];
  overallStatus: string;
  selected: boolean;
  onClick: () => void;
  onSurfaceClick?: (toothNum: number, surface: ToothSurface, e: React.MouseEvent) => void;
  activeTool: string | null;
  scale?: number;
}

export const AnatomicalTooth: React.FC<AnatomicalToothProps> = ({
  number,
  surfaces,
  overallStatus,
  selected,
  onClick,
  onSurfaceClick,
  activeTool,
  scale = 1,
}) => {
  const upper = isUpper(number);
  const category = getToothCategory(number);

  // Dimension scaling
  const isMolar = category === 'molar';
  const isPremolar = category === 'premolar';
  const width = (isMolar ? 38 : isPremolar ? 34 : 32) * scale;
  const height = 54 * scale;

  const handleZoneClick = (surf: ToothSurface, e: React.MouseEvent) => {
    if (activeTool && onSurfaceClick) {
      e.stopPropagation();
      onSurfaceClick(number, surf, e);
    } else {
      onClick();
    }
  };

  const getStyle = (s: ToothSurface) => getSurfaceStyle(s, surfaces, overallStatus);

  // Surface paths generation based on tooth shape and orientation
  // Box geometry for crown:
  // Upper tooth: Root top (y: 2..20), Crown bottom (y: 20..50)
  // Lower tooth: Crown top (y: 4..34), Root bottom (y: 34..52)
  const crownYMin = upper ? 20 * scale : 4 * scale;
  const crownYMax = upper ? 50 * scale : 34 * scale;
  const rootYMin = upper ? 2 * scale : 34 * scale;
  const rootYMax = upper ? 20 * scale : 52 * scale;

  const W = width;
  const cx = W / 2;
  const cy = (crownYMin + crownYMax) / 2;

  // Occlusal center size ratio
  const ow = isMolar ? W * 0.44 : W * 0.38;
  const oh = (crownYMax - crownYMin) * 0.42;

  const oLeft = cx - ow / 2;
  const oRight = cx + ow / 2;
  const oTop = cy - oh / 2;
  const oBottom = cy + oh / 2;

  const cLeft = 3 * scale;
  const cRight = W - 3 * scale;
  const cTop = crownYMin;
  const cBottom = crownYMax;

  // Surface Polygons
  const occlusalPath = `M ${oLeft} ${oTop} L ${oRight} ${oTop} L ${oRight} ${oBottom} L ${oLeft} ${oBottom} Z`;
  const buccalPath = `M ${cLeft} ${cTop} L ${cRight} ${cTop} L ${oRight} ${oTop} L ${oLeft} ${oTop} Z`;
  const lingualPath = `M ${cLeft} ${cBottom} L ${cRight} ${cBottom} L ${oRight} ${oBottom} L ${oLeft} ${oBottom} Z`;
  const mesialPath = `M ${cLeft} ${cTop} L ${oLeft} ${oTop} L ${oLeft} ${oBottom} L ${cLeft} ${cBottom} Z`;
  const distalPath = `M ${oRight} ${oTop} L ${cRight} ${cTop} L ${cRight} ${cBottom} L ${oRight} ${oBottom} Z`;

  // Status conditions metadata
  const isExtracted = overallStatus === 'EXTRACTED';
  const isMissing = overallStatus === 'MISSING';
  const isRCT = overallStatus === 'ROOT_CANAL' || surfaces.some(s => s.condition === 'ROOT_CANAL');
  const isCrown = overallStatus === 'CROWN' || surfaces.some(s => s.condition === 'CROWN');
  const isImplant = overallStatus === 'IMPLANT' || surfaces.some(s => s.condition === 'IMPLANT');
  const isBridge = overallStatus === 'BRIDGE' || surfaces.some(s => s.condition === 'BRIDGE');

  const mainBorderColor = selected ? '#3b82f6' : '#334155';
  const strokeW = selected ? 2 * scale : 1.3 * scale;

  return (
    <div
      className={`group relative flex flex-col items-center cursor-pointer select-none transition-all duration-200 ${
        selected
          ? 'scale-110 drop-shadow-[0_0_12px_rgba(59,130,246,0.7)] -translate-y-1'
          : 'hover:scale-105 hover:-translate-y-0.5 hover:drop-shadow-[0_6px_12px_rgba(15,23,42,0.15)]'
      } ${isMissing ? 'opacity-40' : ''}`}
      onClick={onClick}
      title={`${number} - ${getToothName(number)}`}
    >
      {/* FDI Label at Top if Upper */}
      {upper && (
        <span className={`text-[9px] font-bold leading-none mb-1 ${selected ? 'text-blue-600 font-extrabold' : 'text-slate-500'}`}>
          {number}
        </span>
      )}

      <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} className="overflow-visible">
        <defs>
          {/* 3D Radial Enamel Gloss Gradient */}
          <radialGradient id={`enamel3D_${number}`} cx="35%" cy="30%" r="75%" fx="30%" fy="25%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="35%" stopColor="#f8fafc" stopOpacity="1" />
            <stop offset="75%" stopColor="#e2e8f0" stopOpacity="1" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="1" />
          </radialGradient>

          {/* 3D Root Dentin Gradient */}
          <linearGradient id={`root3D_${number}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#f1f5f9" />
            <stop offset="75%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* 3D Gold Crown Gradient */}
          <linearGradient id={`gold3D_${number}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* 3D Titanium Implant Gradient */}
          <linearGradient id={`titanium3D_${number}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="40%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          {/* 3D Occlusal Pit Shadow */}
          <radialGradient id={`occlusal3DPit_${number}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
          </radialGradient>

          {/* 3D Drop Shadow Filter */}
          <filter id={`tooth3DShadow_${number}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* ── 3D ROOT ANATOMY SILHOUETTE ── */}
        {!isMissing && (
          <g filter={`url(#tooth3DShadow_${number})`}>
            {isMolar ? (
              // Double / Triple 3D Molar Root Silhouette
              <path
                d={
                  upper
                    ? `M ${cLeft + 2} ${crownYMin} Q ${cx - 6} ${rootYMin} ${cx - 2} ${rootYMin + 3} Q ${cx} ${crownYMin - 2} ${cx + 2} ${rootYMin + 3} Q ${cx + 6} ${rootYMin} ${cRight - 2} ${crownYMin} Z`
                    : `M ${cLeft + 2} ${crownYMax} Q ${cx - 6} ${rootYMax} ${cx - 2} ${rootYMax - 3} Q ${cx} ${crownYMax + 2} ${cx + 2} ${rootYMax - 3} Q ${cx + 6} ${rootYMax} ${cRight - 2} ${crownYMax} Z`
                }
                fill={isImplant ? `url(#titanium3D_${number})` : `url(#root3D_${number})`}
                stroke={isImplant ? '#15803d' : mainBorderColor}
                strokeWidth={strokeW}
              />
            ) : (
              // Single / Bicuspid 3D Root Silhouette
              <path
                d={
                  upper
                    ? `M ${cLeft + 4} ${crownYMin} Q ${cx} ${rootYMin - 2} ${cRight - 4} ${crownYMin} Z`
                    : `M ${cLeft + 4} ${crownYMax} Q ${cx} ${rootYMax + 2} ${cRight - 4} ${crownYMax} Z`
                }
                fill={`url(#root3D_${number})`}
                stroke={isImplant ? '#15803d' : mainBorderColor}
                strokeWidth={strokeW}
              />
            )}

            {/* 3D RCT Canal Tube */}
            {isRCT && (
              <g>
                <path
                  d={
                    upper
                      ? `M ${cx} ${rootYMin + 3} L ${cx} ${cy}`
                      : `M ${cx} ${rootYMax - 3} L ${cx} ${cy}`
                  }
                  stroke="#9333ea"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  className="animate-pulse"
                />
                <path
                  d={
                    upper
                      ? `M ${cx} ${rootYMin + 3} L ${cx} ${cy}`
                      : `M ${cx} ${rootYMax - 3} L ${cx} ${cy}`
                  }
                  stroke="#f3e8ff"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* 3D Metallic Implant Screw Ribs */}
            {isImplant && (
              <g stroke="#065f46" strokeWidth="1.4">
                <line x1={cx - 5} y1={(rootYMin + rootYMax) / 2 - 4} x2={cx + 5} y2={(rootYMin + rootYMax) / 2 - 4} />
                <line x1={cx - 6} y1={(rootYMin + rootYMax) / 2} x2={cx + 6} y2={(rootYMin + rootYMax) / 2} />
                <line x1={cx - 5} y1={(rootYMin + rootYMax) / 2 + 4} x2={cx + 5} y2={(rootYMin + rootYMax) / 2 + 4} />
              </g>
            )}
          </g>
        )}

        {/* ── 3D CROWN BASE & SURFACE ZONES ── */}
        <g filter={`url(#tooth3DShadow_${number})`}>
          {/* Base 3D Sculpted Crown with Radial Enamel Gradient */}
          <rect
            x={cLeft}
            y={cTop}
            width={cRight - cLeft}
            height={cBottom - cTop}
            rx={isMolar ? 7 : isPremolar ? 6 : 5}
            fill={isCrown ? `url(#gold3D_${number})` : `url(#enamel3D_${number})`}
            stroke={mainBorderColor}
            strokeWidth={strokeW}
          />

          {/* 3D Glossy Specular Highlight Arc (Porcelain Sheen) */}
          <path
            d={`M ${cLeft + 2} ${cTop + 2} L ${cRight - 6} ${cTop + 2} Q ${cLeft + 2} ${cTop + 2} ${cLeft + 2} ${cBottom - 6}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
            pointerEvents="none"
          />

          {/* Occlusal Fissure Lines & 3D Cusp Depth Texture */}
          {isMolar && (
            <g opacity="0.65" pointerEvents="none">
              <path
                d={`M ${oLeft + 2} ${cy} L ${oRight - 2} ${cy} M ${cx} ${oTop + 2} L ${cx} ${oBottom - 2}`}
                stroke="#64748b"
                strokeWidth="1"
              />
              <circle cx={cx} cy={cy} r={ow * 0.4} fill={`url(#occlusal3DPit_${number})`} />
            </g>
          )}

          {/* ── 5 INTERACTIVE SURFACE ZONES & LIGHT LINE SYMPTOM OVERLAYS ── */}
          {(['buccal', 'lingual', 'mesial', 'distal', 'occlusal'] as ToothSurface[]).map(surf => {
            const path =
              surf === 'occlusal'
                ? occlusalPath
                : surf === 'buccal'
                ? buccalPath
                : surf === 'lingual'
                ? lingualPath
                : surf === 'mesial'
                ? mesialPath
                : distalPath;

            const style = getStyle(surf);

            return (
              <g key={surf}>
                {/* Clickable Base Zone */}
                <path
                  d={path}
                  fill={style.hasCondition ? style.lightFill : 'transparent'}
                  className="hover:opacity-75 transition-opacity cursor-pointer"
                  onClick={e => handleZoneClick(surf, e)}
                />

                {/* 3D Light Line Border Overlay for Symptoms */}
                {style.hasCondition && (
                  <path
                    d={path}
                    fill="none"
                    stroke={style.stroke}
                    strokeWidth={2 * scale}
                    strokeDasharray={style.lineDash}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}

          {/* Outer 3D Crown Bevel Border */}
          <rect
            x={cLeft}
            y={cTop}
            width={cRight - cLeft}
            height={cBottom - cTop}
            rx={isMolar ? 7 : isPremolar ? 6 : 5}
            fill="none"
            stroke={mainBorderColor}
            strokeWidth={strokeW}
            pointerEvents="none"
          />

          {/* 3D Golden Crown Cap Accent Rim */}
          {isCrown && (
            <rect
              x={cLeft - 1}
              y={cTop - 1}
              width={cRight - cLeft + 2}
              height={cBottom - cTop + 2}
              rx={isMolar ? 8 : 7}
              fill="rgba(245,158,11,0.25)"
              stroke="#b45309"
              strokeWidth="2.2"
              pointerEvents="none"
            />
          )}



          {/* Extracted 3D Cross Overlay */}
          {isExtracted && (
            <g stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" opacity="0.85">
              <line x1={cLeft - 2} y1={cTop - 2} x2={cRight + 2} y2={cBottom + 2} />
              <line x1={cRight + 2} y1={cTop - 2} x2={cLeft - 2} y2={cBottom + 2} />
            </g>
          )}

          {/* Missing Indicator Overlay */}
          {isMissing && (
            <text x={cx} y={cy + 3} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">
              &times;
            </text>
          )}
        </g>
      </svg>

      {/* FDI Label at Bottom if Lower */}
      {!upper && (
        <span className={`text-[9px] font-bold leading-none mt-1 ${selected ? 'text-blue-600 font-extrabold' : 'text-slate-500'}`}>
          {number}
        </span>
      )}
    </div>
  );
};

// ─── Modal Tooth Surface Preview ──────────────────────────────────────────────

const ModalToothPreview: React.FC<{ number: number; surfaces: SurfaceCondition[]; overallStatus: string }> = ({
  number,
  surfaces,
  overallStatus,
}) => {
  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center shadow-inner">
      <AnatomicalTooth
        number={number}
        surfaces={surfaces}
        overallStatus={overallStatus}
        selected={false}
        onClick={() => {}}
        activeTool={null}
        scale={1.5}
      />
      <span className="text-[10px] font-bold text-slate-500 mt-2">Magnified Anatomical View</span>
    </div>
  );
};

// ─── Surface Picker ───────────────────────────────────────────────────────────

interface SurfacePickerProps {
  surfaces: SurfaceCondition[];
  onChange: (s: SurfaceCondition[]) => void;
}

const SurfacePicker: React.FC<SurfacePickerProps> = ({ surfaces, onChange }) => {
  const get = (s: ToothSurface) => surfaces.find(x => x.surface === s)?.condition ?? 'HEALTHY';

  const set = (s: ToothSurface, condition: string) => {
    const next = surfaces.filter(x => x.surface !== s);
    if (condition !== 'HEALTHY') next.push({ surface: s, condition });
    onChange(next);
  };

  const surfList: ToothSurface[] = ['occlusal', 'buccal', 'lingual', 'mesial', 'distal'];

  return (
    <div className="space-y-3.5">
      {surfList.map(surf => (
        <div key={surf} className="flex flex-col sm:flex-row sm:items-center gap-2 pb-2 border-b border-slate-100 last:border-0">
          <span className="text-xs font-bold text-slate-700 w-36 shrink-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            {SURFACE_LABELS[surf]}
          </span>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {Object.entries(CONDITIONS).map(([key, meta]) => {
              const active = get(surf) === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => set(surf, key)}
                  style={
                    active
                      ? {
                          backgroundColor: meta.fill === '#ffffff' ? '#f1f5f9' : meta.fill,
                          color: meta.fill === '#ffffff' ? '#334155' : meta.text,
                          borderColor: meta.stroke,
                        }
                      : {}
                  }
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all duration-150 flex items-center gap-1 ${
                    active
                      ? 'shadow-sm ring-2 ring-offset-1 ring-blue-400 scale-105'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm border inline-block"
                    style={{ backgroundColor: meta.fill, borderColor: meta.stroke }}
                  />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Legend & Anatomy Guide Box ───────────────────────────────────────────────

const LegendKeyBox: React.FC = () => (
  <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm flex flex-wrap items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      {/* FDI Diagram Mini Icon */}
      <svg width="40" height="40" viewBox="0 0 36 36" className="shrink-0 border border-slate-200 rounded-lg bg-slate-50">
        <rect x="3" y="3" width="30" height="30" rx="4" fill="#ffffff" stroke="#334155" strokeWidth="1.2" />
        <rect x="3" y="3" width="30" height="7" fill="rgba(59,130,246,0.2)" stroke="#2563eb" strokeWidth="1" />
        <rect x="3" y="26" width="30" height="7" fill="rgba(239,68,68,0.2)" stroke="#dc2626" strokeWidth="1" />
        <rect x="3" y="10" width="7" height="16" fill="rgba(34,197,94,0.2)" stroke="#16a34a" strokeWidth="1" />
        <rect x="26" y="10" width="7" height="16" fill="rgba(245,158,11,0.2)" stroke="#d97706" strokeWidth="1" />
        <rect x="10" y="10" width="16" height="16" fill="rgba(168,85,247,0.2)" stroke="#9333ea" strokeWidth="1" />
        <text x="18" y="8.5" textAnchor="middle" fontSize="6" fill="#1e40af" fontWeight="bold">B</text>
        <text x="18" y="31.5" textAnchor="middle" fontSize="6" fill="#991b1b" fontWeight="bold">L</text>
        <text x="6.5" y="20" textAnchor="middle" fontSize="6" fill="#166534" fontWeight="bold">M</text>
        <text x="29.5" y="20" textAnchor="middle" fontSize="6" fill="#92400e" fontWeight="bold">D</text>
        <text x="18" y="20" textAnchor="middle" fontSize="6" fill="#6b21a8" fontWeight="bold">O</text>
      </svg>
      <div className="text-[10px] text-slate-600 leading-tight">
        <div className="font-bold text-slate-800 text-xs mb-0.5">FDI Surface Guide & Symptom Light Lines</div>
        <div><b>B</b> = Buccal/Labial (Top) &bull; <b>L</b> = Lingual/Palatal (Bottom)</div>
        <div><b>M</b> = Mesial (Left) &bull; <b>D</b> = Distal (Right) &bull; <b>O</b> = Occlusal (Center)</div>
      </div>
    </div>
    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
      <Info size={14} className="text-blue-500" />
      <span>Click any tooth surface to apply light-line symptom overlays</span>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const FdiDentalChart: React.FC<FdiDentalChartProps> = ({ toothHistory, onUpdateTooth, isReadOnly = false }) => {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [editSurfaces, setEditSurfaces] = useState<SurfaceCondition[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [localState, setLocalState] = useState<Record<number, ToothRecord>>({});

  // Sync props to local state
  useEffect(() => {
    const map: Record<number, ToothRecord> = {};
    for (const item of toothHistory) {
      map[item.toothNumber] = item;
    }
    setLocalState(map);
  }, [toothHistory]);

  // Quadrants FDI notation
  const quad1 = Array.from({ length: 8 }, (_, i) => 18 - i); // 18..11
  const quad2 = Array.from({ length: 8 }, (_, i) => 21 + i); // 21..28
  const quad4 = Array.from({ length: 8 }, (_, i) => 48 - i); // 48..41
  const quad3 = Array.from({ length: 8 }, (_, i) => 31 + i); // 31..38

  const getRecord = useCallback(
    (num: number): ToothRecord =>
      localState[num] ?? { toothNumber: num, status: 'HEALTHY', surfaces: [] },
    [localState]
  );

  const openTooth = (num: number) => {
    if (isReadOnly) return;
    const r = getRecord(num);
    setSelectedTooth(num);
    setEditSurfaces(r.surfaces ?? []);
    setNotes(r.notes ?? '');
  };

  const handleDirectSurfaceClick = async (num: number, surface: ToothSurface) => {
    if (!activeTool || isReadOnly) return;
    const r = getRecord(num);
    const existing = r.surfaces ?? [];
    const hit = existing.find(s => s.surface === surface);

    let nextSurfaces: SurfaceCondition[];
    if (hit && hit.condition === activeTool) {
      nextSurfaces = existing.filter(s => s.surface !== surface);
    } else {
      nextSurfaces = existing.filter(s => s.surface !== surface);
      nextSurfaces.push({ surface, condition: activeTool });
    }

    const priority = Object.keys(CONDITIONS);
    let worst = 'HEALTHY';
    for (const s of nextSurfaces) {
      if (priority.indexOf(s.condition) < priority.indexOf(worst)) worst = s.condition;
    }

    const newRecord: ToothRecord = { toothNumber: num, status: worst, notes: r.notes, surfaces: nextSurfaces };
    setLocalState(prev => ({ ...prev, [num]: newRecord }));

    try {
      await onUpdateTooth(num, worst, r.notes ?? '', nextSurfaces);
    } catch {
      alert('Failed to save tooth surface status');
    }
  };

  const handleSave = async () => {
    if (selectedTooth === null) return;
    setSaving(true);
    try {
      const priority = Object.keys(CONDITIONS);
      let worst = 'HEALTHY';
      for (const s of editSurfaces) {
        if (priority.indexOf(s.condition) < priority.indexOf(worst)) worst = s.condition;
      }

      const newRecord: ToothRecord = { toothNumber: selectedTooth, status: worst, notes, surfaces: editSurfaces };
      setLocalState(prev => ({ ...prev, [selectedTooth]: newRecord }));

      await onUpdateTooth(selectedTooth, worst, notes, editSurfaces);
      setSelectedTooth(null);
    } catch {
      alert('Failed to save tooth status');
    } finally {
      setSaving(false);
    }
  };

  // Symptom counts summary calculation
  const summaryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(CONDITIONS).forEach(k => (counts[k] = 0));
    Object.values(localState).forEach(t => {
      if (t.status && counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });
    return counts;
  }, [localState]);

  const renderRow = (teeth: number[]) => (
    <div className="flex items-center gap-1.5">
      {teeth.map(num => (
        <AnatomicalTooth
          key={num}
          number={num}
          surfaces={getRecord(num).surfaces ?? []}
          overallStatus={getRecord(num).status}
          selected={selectedTooth === num}
          onClick={() => openTooth(num)}
          onSurfaceClick={handleDirectSurfaceClick}
          activeTool={activeTool}
        />
      ))}
    </div>
  );

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header & Status Bar (Excluding HEALTHY) */}
      {Object.entries(summaryCounts).some(([key, count]) => key !== 'HEALTHY' && count > 0) && (
        <div className="flex flex-wrap gap-1.5 items-center border-b border-slate-100 pb-3">
          {Object.entries(summaryCounts)
            .filter(([key, count]) => key !== 'HEALTHY' && count > 0)
            .map(([key, count]) => {
              const meta = CONDITIONS[key];
              return (
                <span
                  key={key}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${meta.badgeBg}`}
                >
                  {meta.label}: {count}
                </span>
              );
            })}
        </div>
      )}

      {/* Main Content Layout - Full Width Chart */}
      <div className="space-y-3 w-full">
        {/* Surface Orientation Legend Key */}
        <LegendKeyBox />

        {/* Dotted Dental Arch Graphic Container */}
        <div
          className="border border-slate-300 rounded-2xl p-5 overflow-x-auto shadow-inner"
          style={{
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)',
            backgroundSize: '20px 20px',
            backgroundColor: '#f8fafc',
          }}
        >
          <div className="flex flex-col items-center gap-2 select-none min-w-max mx-auto">
            {/* Upper Jaw (Maxilla) Label */}
            <div className="text-[11px] font-extrabold tracking-[0.2em] text-slate-600 uppercase bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
              Upper Jaw (Maxilla)
            </div>

            {/* Upper Teeth Quadrants */}
            <div className="flex items-center gap-2 py-2">
              {renderRow(quad1)}
              <div className="w-2 mx-1" />
              {renderRow(quad2)}
            </div>

            {/* Central Occlusal Gum Line Divider */}
            <div className="w-full flex items-center gap-3 my-1">
              <div className="flex-1 border-t-2 border-dashed border-rose-300 opacity-80" />
              <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-widest bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                Occlusal Plane / Gum Line
              </span>
              <div className="flex-1 border-t-2 border-dashed border-rose-300 opacity-80" />
            </div>

            {/* Lower Teeth Quadrants */}
            <div className="flex items-center gap-2 py-2">
              {renderRow(quad4)}
              <div className="w-2 mx-1" />
              {renderRow(quad3)}
            </div>

            {/* Lower Jaw (Mandible) Label */}
            <div className="text-[11px] font-extrabold tracking-[0.2em] text-slate-600 uppercase bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm mt-1">
              Lower Jaw (Mandible)
            </div>
          </div>
        </div>

        {/* Bottom Symptom Color Badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          {Object.entries(CONDITIONS).map(([key, meta]) => (
            <span
              key={key}
              className="flex items-center gap-1.5 text-[10px] text-slate-700 font-semibold bg-slate-50 px-2 py-1 rounded-lg border border-slate-200"
            >
              <span
                className="w-3 h-3 rounded-sm border inline-block"
                style={{ backgroundColor: meta.fill, borderColor: meta.stroke }}
              />
              {meta.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Surface Editor Modal ── */}
      {selectedTooth !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-4">
                <ModalToothPreview
                  number={selectedTooth}
                  surfaces={editSurfaces}
                  overallStatus={getRecord(selectedTooth).status}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm">
                      FDI #{selectedTooth}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {isUpper(selectedTooth) ? 'Upper Jaw' : 'Lower Jaw'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mt-1">
                    {getToothName(selectedTooth)}
                  </h4>
                  <p className="text-xs text-slate-400">Manage individual surface conditions & symptoms</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTooth(null)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xl font-bold transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Modal Body / Pickers */}
            <div className="overflow-y-auto px-6 py-5 flex-1 space-y-6">
              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Surface Conditions & Light Line Symptoms
                </h5>
                <SurfacePicker surfaces={editSurfaces} onChange={setEditSurfaces} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Clinical Notes & Observations
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Record observations, treatment plans, or symptom details for this tooth..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setEditSurfaces([])}
                className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-200 transition-colors"
              >
                Clear Surfaces
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTooth(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md shadow-blue-600/20 transition-all"
                >
                  {saving ? 'Saving...' : 'Save Tooth Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
