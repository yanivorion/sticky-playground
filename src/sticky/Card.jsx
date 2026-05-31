import React from 'react';

// Palette for the demo cards — distinct tints so stacking/reveal is legible.
const CARD_TINTS = [
  { bg: '#0f172a', fg: '#f8fafc', sub: '#94a3b8', media: 'rgba(255,255,255,0.08)' },
  { bg: '#1e293b', fg: '#f1f5f9', sub: '#94a3b8', media: 'rgba(255,255,255,0.08)' },
  { bg: '#f8fafc', fg: '#0f172a', sub: '#64748b', media: 'rgba(15,23,42,0.06)' },
  { bg: '#e2e8f0', fg: '#0f172a', sub: '#475569', media: 'rgba(15,23,42,0.08)' },
  { bg: '#dbeafe', fg: '#0f172a', sub: '#1e40af', media: 'rgba(30,64,175,0.10)' },
  { bg: '#fee2e2', fg: '#0f172a', sub: '#991b1b', media: 'rgba(153,27,27,0.10)' },
];

const HERO_TINT = { bg: '#111827', fg: '#ffffff', sub: '#9ca3af', media: 'rgba(255,255,255,0.06)' };
const STICKY_COL_TINT = { bg: '#0b1220', fg: '#f8fafc', sub: '#94a3b8', media: 'rgba(96,165,250,0.18)' };
const BG_TINT = {
  bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%)',
  fg: '#ffffff', sub: 'rgba(255,255,255,0.7)', media: 'rgba(255,255,255,0.10)',
};
const PINNED_TINT = { bg: 'rgba(15,23,42,0.94)', fg: '#f8fafc', sub: '#94a3b8', media: 'transparent' };

export function tintFor(cell) {
  if (cell.kind === 'hero') return HERO_TINT;
  if (cell.kind === 'sticky') return STICKY_COL_TINT;
  if (cell.kind === 'bg') return BG_TINT;
  if (cell.kind === 'pinned') return PINNED_TINT;
  return CARD_TINTS[(cell.index >= 0 ? cell.index : 0) % CARD_TINTS.length];
}

const KIND_BADGE = {
  hero: 'Hero',
  sticky: 'Sticky column',
  bg: 'Background',
  pinned: 'Pinned bar',
  card: 'Sticky cell',
};

/**
 * A single demo card. Shows its label + the sticky offset so the behavior is
 * visible while scrolling. `meta` is a short string like "sticky top 80px · 100vh".
 */
export function Card({ cell, meta, compact = false, scale = 1 }) {
  const t = tintFor(cell);
  const isHero = cell.kind === 'hero';
  const isPinned = cell.kind === 'pinned';
  const isBg = cell.kind === 'bg';
  const titleSize = (isHero || isBg ? 46 : isPinned ? 18 : 30) * scale;
  const pad = (compact || isPinned ? 16 : 40) * scale;
  const badge = KIND_BADGE[cell.kind] || 'Sticky cell';

  // Pinned bar = compact horizontal layout
  if (isPinned) {
    return (
      <div style={{
        width: '100%', height: '100%',
        background: t.bg, color: t.fg,
        borderRadius: 12,
        padding: `${10 * scale}px ${pad}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#18181B' }} />
          <span style={{ fontSize: titleSize, fontWeight: 600 }}>{cell.label}</span>
        </div>
        {meta && <span style={{ fontSize: 10 * scale, color: t.sub, fontWeight: 500 }}>{meta}</span>}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: t.bg,
        color: t.fg,
        borderRadius: 14,
        padding: pad,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
        border: cell.kind === 'sticky'
          ? '1.5px solid rgba(24,24,27,0.45)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11 * scale, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.sub, fontWeight: 600 }}>
            {badge}
          </div>
          <div style={{ fontSize: titleSize, fontWeight: 600, lineHeight: 1.05, marginTop: 8 * scale }}>
            {cell.label}
          </div>
        </div>
        {cell.accent && (
          <span style={{
            fontSize: 10 * scale, fontWeight: 600, padding: '4px 8px', borderRadius: 999,
            background: '#18181B', color: '#fff', whiteSpace: 'nowrap',
          }}>{cell.kind === 'sticky' ? 'pinned' : cell.kind === 'bg' ? 'sticky bg' : 'active'}</span>
        )}
      </div>

      {/* media block */}
      <div style={{
        flex: 1,
        margin: `${18 * scale}px 0`,
        borderRadius: 10,
        background: t.media,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40 * scale,
      }}>
        <span style={{ fontSize: 11 * scale, color: t.sub, letterSpacing: '0.05em' }}>media</span>
      </div>

      {meta && (
        <div style={{
          fontSize: 11 * scale, fontWeight: 500, color: t.sub, fontFeatureSettings: '"tnum"',
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          {meta.split('·').map((m, i) => (
            <span key={i} style={{
              padding: '3px 8px', borderRadius: 6,
              background: 'rgba(127,127,127,0.14)',
            }}>{m.trim()}</span>
          ))}
        </div>
      )}
    </div>
  );
}
