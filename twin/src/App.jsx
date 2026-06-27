import React from 'react';

// ─── Heuristic engine (rules subset relevant to this demo) ────────────────────
//
// Source: Studio 2.0 Mobile Heuristic Engine — 115 rules.
// Applied here: rules 11-12 (image), 18 (text/title/paragraph),
// rule 26 (padding 24px L/R), and y-scaling by ratio MW/DW.
// Sticky top offsets are intentionally NOT touched — that is the task.

const DW = 1160;   // desktop reference width
const MW = 390;    // mobile reference width
const RATIO = MW / DW; // ≈ 0.336 — used to scale y positions

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

function applyHeuristic(el) {
  const my = Math.round(el.y * RATIO);

  if (el.kind === 'image') {
    // Rules 11–12: width > 200 → 100%, aspect-ratio height
    const mw = el.w > 200 ? MW : el.w;
    const mh = Math.round((el.h / el.w) * mw);
    const mx = Math.max(0, Math.round((MW - mw) / 2));
    return { ...el, mx, my, mw, mh };
  }

  // Rule 18: text → 100% width, auto height
  // Rule 26: 24px padding L/R
  const mfs = el.fs ? mobileFontSize(el.fs) : undefined;
  return { ...el, mx: 0, my, mw: MW, mh: 'auto', mfs, padX: 24 };
}

// ─── Scene data ────────────────────────────────────────────────────────────────

const CARD_H = 540; // 100vh of the desktop design
const PEEK   = 60;  // sticky offset step — unchanged on mobile in Task 1

// Three skincare cards — real assets from STACKS
const CARDS = [
  {
    id: 'c1',
    bg: '#EDE8F5',
    accent: '#4A3FD8',
    photo: '/STACKS/pic-1.png',
    step: '01',
    title: 'Cleanse',
    body: 'This gentle cleanser removes makeup and buildup without stripping. Follow with a toner to refine pores and prep skin for the next steps.',
  },
  {
    id: 'c2',
    bg: '#F7F0C4',
    accent: '#2B34C8',
    photo: '/STACKS/pic-2.png',
    step: '02',
    title: 'Tone',
    body: 'A balancing toner that refines pores, restores pH, and primes skin for the serum and moisturiser steps that follow.',
  },
  {
    id: 'c3',
    bg: '#C8E3F5',
    accent: '#2B34C8',
    photo: '/STACKS/pic-3.png',
    step: '03',
    title: 'Moisturise',
    body: 'Lock in hydration with a lightweight formula that keeps skin plump and protected all day long.',
  },
];

// Desktop absolute layout — coordinate space: 1160 × 540 px
// Each element: { id, kind, x, y, w, h, fs, zi }
// This is what the studio editor stores.
const ELS = [
  { id: 'photo',   kind: 'image', x: 590, y: 0,   w: 570, h: 540, fs: null, zi: 1 },
  { id: 'step',    kind: 'text',  x: 60,  y: 174, w: 90,  h: 24,  fs: 14,   zi: 3 },
  { id: 'heading', kind: 'text',  x: 60,  y: 208, w: 450, h: 104, fs: 72,   zi: 3 },
  { id: 'body',    kind: 'text',  x: 60,  y: 330, w: 360, h: 80,  fs: 15,   zi: 3 },
];

// Mobile values — result of running applyHeuristic on each element
const ELS_M = ELS.map(applyHeuristic);

// Pre-compute for the diff table
const DIFFS = ELS.map((el, i) => {
  const m = ELS_M[i];
  return {
    id: el.id,
    deskX: el.x, deskY: el.y, deskW: el.w, deskH: el.h, deskFs: el.fs,
    mobX: m.mx, mobY: m.my, mobW: m.mw, mobH: m.mh, mobFs: m.mfs,
  };
});

// ─── Pain point annotations ────────────────────────────────────────────────────

const PAIN = {
  photo:   { n: 1, color: '#FF4D6D' },
  heading: { n: 2, color: '#FF8C42' },
  step:    { n: 2, color: '#FF8C42' },
  body:    { n: 3, color: '#FFD23F' },
};

const LEGENDS = [
  {
    n: 1,
    color: '#FF4D6D',
    title: 'Photo → 100% width, same y=0',
    desc: [
      'Rule 11–12: image w=570 > 200 → mw=100% (390px), height aspect-ratio scaled: 540/570 × 390 = 369px.',
      'Photo shifts from the right column (x=590) to x=0, now covering the full card width.',
      'All three text elements (y=58, y=70, y=111) are inside the 369px photo zone.',
    ],
    diff: { d: 'x=590, w=570, h=540', m: 'x=0, w=390, h=369' },
  },
  {
    n: 2,
    color: '#FF8C42',
    title: 'Text x collapses to 0 — no column structure',
    desc: [
      'Rule 18: all text elements → width=100%, height=auto, x reset to 0.',
      'Step "01" was at x=60; title "Cleanse" at x=60. Both collapse to x=0.',
      'The left-column layout intent (text ↔ photo side-by-side) is completely lost.',
    ],
    diff: { d: 'step x=60, heading x=60', m: 'step x=0, heading x=0' },
  },
  {
    n: 3,
    color: '#FFD23F',
    title: 'Body text y scaled but overlaps photo',
    desc: [
      'Y positions scale by ratio ≈ 0.34. Body at y=330 → y=111.',
      'Font: 15px → 14px (rule 63–76). Width: 360 → 390, with 24px L/R padding.',
      'y=111 is still inside the photo zone (h=369). Text z-index=3 > photo z-index=1, so it renders on top — but the photo background makes it unreadable.',
    ],
    diff: { d: 'y=330, w=360, 15px', m: 'y=111, w=390, 14px (+24px pad)' },
  },
  {
    n: 4,
    color: '#A8DADC',
    title: 'Sticky top offset unchanged',
    desc: [
      'top: 0, 60px, 120px (i × PEEK) — preserved exactly as designed.',
      'The 60px peek was designed for the colored text strip at the desktop card bottom.',
      'On mobile, the peeking 60px strip now reveals the bottom of a photo, not a step number. Card identity is gone.',
    ],
    diff: { d: 'top: i × 60px', m: 'top: i × 60px  (unchanged)' },
  },
];

// ─── Design tokens ──────────────────────────────────────────────────────────────

const T = {
  bg:      '#0C0C12',
  surface: '#14141C',
  surfaceHi: '#1A1A26',
  border:  'rgba(255,255,255,0.07)',
  text1:   '#EDEDF5',
  text2:   '#8888A8',
  text3:   '#4A4A68',
  accent:  '#6C63FF',
  green:   '#5EDFAA',
  orange:  '#FF8C42',
};

// ─── Element renderer ──────────────────────────────────────────────────────────

function NumBadge({ n, color, sx }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 20, height: 20, borderRadius: '50%',
      background: color, color: '#000',
      fontWeight: 800, fontSize: 11, lineHeight: 1, flexShrink: 0,
      fontFamily: 'system-ui, sans-serif',
      userSelect: 'none',
      ...sx,
    }}>{n}</div>
  );
}

function ElBox({ el, isMobile, s, card }) {
  const x  = (isMobile ? el.mx : el.x) * s;
  const y  = (isMobile ? el.my : el.y) * s;
  const rw = isMobile ? el.mw : el.w;
  const rh = isMobile ? el.mh : el.h;
  const fs = ((isMobile ? el.mfs : el.fs) || 14) * s;
  const pain = isMobile ? PAIN[el.id] : null;

  if (el.kind === 'image') {
    return (
      <>
        <img
          src={card.photo}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: x, top: y,
            width: rw * s,
            height: rh * s,
            objectFit: 'cover',
            objectPosition: 'top center',
            zIndex: el.zi,
            display: 'block',
            outline: pain ? `2.5px solid ${pain.color}` : undefined,
            outlineOffset: -2,
          }}
        />
        {pain && (
          <NumBadge n={pain.n} color={pain.color}
            sx={{ position: 'absolute', left: x + 6, top: y + 6, zIndex: 99,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.6)' }} />
        )}
      </>
    );
  }

  const isHeading = el.id === 'heading';
  const isStep    = el.id === 'step';
  const padX      = (isMobile && el.padX) ? el.padX * s : 0;

  return (
    <>
      <div style={{
        position: 'absolute',
        left: x, top: y,
        width: typeof rw === 'number' ? rw * s : '100%',
        height: rh === 'auto' ? 'auto' : rh * s,
        zIndex: el.zi,
        fontSize: fs,
        fontWeight: isHeading ? 800 : isStep ? 500 : 400,
        fontStyle: isStep ? 'italic' : 'normal',
        fontFamily: isHeading
          ? 'Georgia, "Times New Roman", serif'
          : 'system-ui, -apple-system, sans-serif',
        lineHeight: isHeading ? 1.0 : 1.55,
        color: isHeading ? card.accent : 'rgba(20,20,40,0.9)',
        padding: padX ? `0 ${padX}px` : undefined,
        boxSizing: 'border-box',
        outline: pain ? `2px solid ${pain.color}` : undefined,
        outlineOffset: 1,
      }}>
        {el.id === 'step'    && card.step}
        {el.id === 'heading' && card.title}
        {el.id === 'body'    && card.body}
      </div>
      {pain && (
        <NumBadge n={pain.n} color={pain.color}
          sx={{ position: 'absolute', left: x + 4, top: y + 4, zIndex: 99,
                boxShadow: '0 2px 8px rgba(0,0,0,0.6)' }} />
      )}
    </>
  );
}

// ─── Sticky card ───────────────────────────────────────────────────────────────

function StickyCard({ card, idx, isMobile, s }) {
  const els = isMobile ? ELS_M : ELS;
  const W   = (isMobile ? MW : DW) * s;
  const H   = CARD_H * s;

  return (
    <div style={{
      position: 'sticky',
      top: idx * PEEK * s,
      height: H,
      width: W,
      background: card.bg,
      borderRadius: 16 * s,
      overflow: 'hidden',
      zIndex: idx + 1,
    }}>
      {els.map(el => (
        <ElBox key={el.id} el={el} isMobile={isMobile} s={s} card={card} />
      ))}

      {/* Pain point 4: sticky top badge in bottom-right corner */}
      {isMobile && (
        <NumBadge n={4} color="#A8DADC"
          sx={{ position: 'absolute', right: 10 * s, bottom: 10 * s, zIndex: 99,
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }} />
      )}
    </div>
  );
}

// ─── Frame (scrollable sticky scene) ──────────────────────────────────────────

function Frame({ isMobile, s, label, sub }) {
  const W      = (isMobile ? MW : DW) * s;
  const H      = CARD_H * s;
  const totalH = CARDS.length * CARD_H * 2.0 * s;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, letterSpacing: '-0.01em' }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: T.text2, marginTop: 2 }}>{sub}</div>
      </div>

      {/* Device chrome */}
      <div style={{
        width: W + 2, height: H + 2,
        borderRadius: (16 * s) + 1,
        border: `1px solid ${T.border}`,
        boxShadow: isMobile
          ? '0 16px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)'
          : '0 8px 40px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
      }}>
        <div style={{
          width: W, height: H,
          overflowY: 'scroll',
          overflowX: 'hidden',
          borderRadius: 16 * s,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}>
          <div style={{ position: 'relative', height: totalH }}>
            {CARDS.map((card, i) => (
              <StickyCard key={card.id} card={card} idx={i} isMobile={isMobile} s={s} />
            ))}
          </div>
        </div>
      </div>

      {/* Width label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        color: T.text3, fontSize: 10, letterSpacing: '0.04em',
      }}>
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span>{isMobile ? `${MW}px` : `${DW}px`}</span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>
    </div>
  );
}

// ─── Diff table ───────────────────────────────────────────────────────────────

function DiffTable() {
  const rows = [
    { el: 'photo (image)',    d: `x=${DIFFS[0].deskX}, w=${DIFFS[0].deskW}, h=${DIFFS[0].deskH}`,  m: `x=${DIFFS[0].mobX}, w=${DIFFS[0].mobW}, h=${DIFFS[0].mobH}`,  pain: 1 },
    { el: 'step (title)',     d: `x=${DIFFS[1].deskX}, y=${DIFFS[1].deskY}, w=${DIFFS[1].deskW}`,  m: `x=${DIFFS[1].mobX}, y=${DIFFS[1].mobY}, w=${DIFFS[1].mobW}`,  pain: 2 },
    { el: 'heading (title)',  d: `x=${DIFFS[2].deskX}, y=${DIFFS[2].deskY}, ${DIFFS[2].deskFs}px`, m: `x=${DIFFS[2].mobX}, y=${DIFFS[2].mobY}, ${DIFFS[2].mobFs}px`, pain: 2 },
    { el: 'body (paragraph)', d: `x=${DIFFS[3].deskX}, y=${DIFFS[3].deskY}, ${DIFFS[3].deskFs}px`, m: `x=${DIFFS[3].mobX}, y=${DIFFS[3].mobY}, ${DIFFS[3].mobFs}px`, pain: 3 },
  ];

  const pColor = { 1: '#FF4D6D', 2: '#FF8C42', 3: '#FFD23F' };

  return (
    <div style={{
      borderRadius: 8, overflow: 'hidden',
      border: `1px solid ${T.border}`,
      fontSize: 10, fontFamily: 'system-ui, sans-serif',
    }}>
      {/* header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 20px',
        gap: '0 8px', padding: '7px 10px',
        background: T.surfaceHi, color: T.text3,
        fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <span>Element</span><span style={{ color: T.green }}>Desktop</span><span style={{ color: T.orange }}>Mobile</span><span />
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 20px',
          gap: '0 8px', padding: '7px 10px',
          background: i % 2 === 0 ? 'transparent' : T.surfaceHi,
          borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : undefined,
          alignItems: 'center',
        }}>
          <span style={{ color: T.text2 }}>{r.el}</span>
          <span style={{ color: T.green, fontFamily: 'monospace', fontSize: 9 }}>{r.d}</span>
          <span style={{ color: T.orange, fontFamily: 'monospace', fontSize: 9 }}>{r.m}</span>
          <NumBadge n={r.pain} color={pColor[r.pain]} sx={{ width: 16, height: 16, fontSize: 9 }} />
        </div>
      ))}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function LegendCard({ item }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10,
      background: T.surface, border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${item.color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <NumBadge n={item.n} color={item.color} />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text1, letterSpacing: '-0.01em' }}>
          {item.title}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
        {item.desc.map((line, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
            <span style={{ color: T.text3, fontSize: 10, flexShrink: 0 }}>{'—'}</span>
            <span style={{ fontSize: 11, color: T.text2, lineHeight: 1.6 }}>{line}</span>
          </div>
        ))}
      </div>
      <div style={{
        display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
        padding: '7px 9px', borderRadius: 6,
        background: 'rgba(0,0,0,0.3)',
      }}>
        <code style={{ fontSize: 9, color: T.green, fontFamily: 'monospace' }}>{item.diff.d}</code>
        <span style={{ color: T.text3, fontSize: 9 }}>→</span>
        <code style={{ fontSize: 9, color: T.orange, fontFamily: 'monospace' }}>{item.diff.m}</code>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const DS = 0.50; // desktop preview scale

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      color: T.text1,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '16px 40px',
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 200,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Sticky Stacks — Task 1
          </span>
          <span style={{
            fontSize: 11, color: T.text2, marginLeft: 14,
            borderLeft: `1px solid ${T.border}`, paddingLeft: 14,
          }}>
            Heuristics applied · Sticky top preserved · No sticky cancel
          </span>
        </div>
        <div style={{ fontSize: 11, color: T.text3 }}>
          What does composition look like?
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{
        display: 'flex', gap: 28, padding: '32px 40px',
        alignItems: 'flex-start', overflowX: 'auto',
      }}>

        {/* Desktop preview */}
        <Frame
          isMobile={false}
          s={DS}
          label="Desktop · 1160px"
          sub="As designed — absolute positioned elements, scroll to see overlap"
        />

        {/* Arrow */}
        <div style={{
          flexShrink: 0, paddingTop: 50,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: T.text3,
        }}>
          <svg width="36" height="14" viewBox="0 0 36 14" fill="none">
            <line x1="0" y1="7" x2="28" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <polyline points="20,1 28,7 20,13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 9, textAlign: 'center', maxWidth: 48, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Heuristics
          </div>
        </div>

        {/* Mobile preview */}
        <Frame
          isMobile={true}
          s={1}
          label="Mobile · 390px"
          sub="Heuristics applied · Sticky top unchanged · Scroll to see pain"
        />

        {/* Right panel: diff + legend */}
        <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Diff table */}
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: T.text3,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Element diff — desktop → mobile
            </div>
            <DiffTable />
          </div>

          {/* Pain legends */}
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: T.text3,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Composition issues
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LEGENDS.map(item => <LegendCard key={item.n} item={item} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
