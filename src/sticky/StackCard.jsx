import React from 'react';

// ─── Card content ─────────────────────────────────────────────────────────────

const STACKS = [
  {
    step: '01',
    title: 'Cleanse',
    body: 'This gentle cleanser removes makeup and buildup without stripping. Follow with a toner to refine pores and prep skin for the next step.',
    accent: '#4A3FD8',
    bg: '#EDE8F5',
    photo: '/STACKS/pic-1.png',
  },
  {
    step: '02',
    title: 'Tone',
    body: 'A balancing toner that refines pores, restores pH, and primes skin for the serum and moisturiser steps that follow.',
    accent: '#1E3A8A',
    bg: '#F7F0C4',
    photo: '/STACKS/pic-2.png',
  },
  {
    step: '03',
    title: 'Moisturise',
    body: 'Lock in hydration with a lightweight formula that keeps skin plump and protected throughout the day.',
    accent: '#1E40AF',
    bg: '#C8E3F5',
    photo: '/STACKS/pic-3.png',
  },
];

// ─── Heuristics (rules 63–76 from heuristics table) ──────────────────────────

function mobileFontSize(px) {
  if (px <= 14) return px;
  if (px <= 19) return px - 1;
  if (px <= 22) return px - 2;
  if (px <= 26) return px - 4;
  if (px <= 30) return px - 6;
  if (px <= 34) return px - 8;
  if (px <= 43) return px - 10;
  if (px <= 64) return Math.round(px * 0.65);
  if (px <= 78) return Math.round(px * 0.55);
  if (px <= 88) return Math.round(px * 0.50);
  return Math.round(px * 0.42);
}

// ─── Desktop reference layout (px in a 1160 × 440 card) ──────────────────────
//
//  The desktop card is landscape: photo on the right 49%, text on the left.
//  These absolute px coordinates are the "design" values.

const DW = 1160, DH = 440;

const D_ELS = [
  // image: x=598, y=0, w=562, h=440 (fills right side, full height)
  { id: 'photo', kind: 'image', x: 598, y: 0,   w: 562, h: DH, zi: 1, fs: null },
  // step number — small italic label above the title
  { id: 'step',  kind: 'text',  x: 60,  y: 136, w: 90,  h: 20, zi: 3, fs: 15   },
  // heading — large serif title
  { id: 'title', kind: 'title', x: 60,  y: 167, w: 480, h: 80, zi: 3, fs: 60   },
  // body — short paragraph below the title
  { id: 'body',  kind: 'para',  x: 60,  y: 266, w: 320, h: 64, zi: 3, fs: 14   },
];

// ─── Mobile layout (heuristics applied) ───────────────────────────────────────
//
//  Mobile viewport reference: 292 × 560 px (MW × MH).
//
//  Rules applied per element type:
//   image  (rule 12)  : w > 200px → width: 100%, height: aspect-ratio
//   text   (rule 18)  : width: 100%, height: auto
//   padding(rule 26)  : paddingLeft/Right: 24px on all text elements
//   y pos             : desktopY × (MW / DW)  ← scales position with viewport width ratio
//   font size         : mobileFontSize(desktopFs)

const MW = 292, MH = 560;
const RATIO = MW / DW; // 0.2517

const M_ELS = D_ELS.map((el) => {
  const my = Math.round(el.y * RATIO);

  if (el.kind === 'image') {
    // aspect ratio: (DH / el.w) × MW  →  440 / 562 × 292 ≈ 228 px
    const mh = Math.round((DH / el.w) * MW);
    return { ...el, mx: 0, my: 0, mw: MW, mh, mfs: null };
  }

  return {
    ...el,
    mx: 0,
    my,
    mw: MW,
    mh: 'auto',
    mfs: mobileFontSize(el.fs),
    padX: 24, // rule 26
  };
});

// ─── Component ────────────────────────────────────────────────────────────────

export function StackCard({ cell, isMobile = false, scale = 1 }) {
  const content = STACKS[cell.index % STACKS.length];
  const els = isMobile ? M_ELS : D_ELS;
  const refW = isMobile ? MW : DW;
  const refH = isMobile ? MH : DH;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: content.bg,
      borderRadius: 14 * scale,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0,0,0,0.20)',
    }}>
      {els.map((el) => {
        const x = ((isMobile ? el.mx : el.x) / refW) * 100;
        const y = ((isMobile ? el.my : el.y) / refH) * 100;
        const w = ((isMobile ? el.mw : el.w) / refW) * 100;
        const padX = isMobile && el.padX
          ? (el.padX / refW) * 100
          : 0;
        const fs = ((isMobile ? el.mfs : el.fs) || 14) * scale;

        if (el.kind === 'image') {
          const h = isMobile
            ? ((el.mh ?? DH) / refH) * 100
            : 100; // desktop: 100% height
          return (
            <img
              key={el.id}
              src={content.photo}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: `${w}%`,
                height: isMobile ? `${h}%` : '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
                zIndex: el.zi,
                display: 'block',
                pointerEvents: 'none',
              }}
            />
          );
        }

        const isTitle = el.kind === 'title';
        const isStep  = el.id === 'step';

        return (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: `${w}%`,
              zIndex: el.zi,
              fontSize: fs,
              fontWeight: isTitle ? 800 : isStep ? 500 : 400,
              fontStyle: isStep ? 'italic' : 'normal',
              fontFamily: isTitle
                ? '"Playfair Display", Georgia, "Times New Roman", serif'
                : 'system-ui, -apple-system, sans-serif',
              lineHeight: isTitle ? 1.0 : 1.55,
              color: isTitle ? content.accent : 'rgba(20,20,40,0.85)',
              letterSpacing: isStep ? '0.06em' : 'normal',
              padding: padX ? `0 ${padX}%` : undefined,
              boxSizing: 'border-box',
            }}
          >
            {el.id === 'step'  && content.step}
            {el.id === 'title' && content.title}
            {el.id === 'body'  && content.body}
          </div>
        );
      })}

      {/* Sticky offset badge — same meta info as original Card */}
      <div style={{
        position: 'absolute',
        left: 0,
        bottom: 12 * scale,
        right: isMobile ? 0 : '50%',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: isMobile ? `${(24 / refW) * 100}%` : `${(60 / DW) * 100}%`,
        gap: 6,
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: 10 * scale,
          fontWeight: 600,
          color: 'rgba(20,20,40,0.45)',
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(4px)',
          borderRadius: 5,
          padding: `2px 7px`,
          letterSpacing: '0.04em',
        }}>
          {isMobile ? 'heuristic' : 'desktop'}
          {' · '}step {STACKS[cell.index % STACKS.length].step}
        </span>
      </div>
    </div>
  );
}
