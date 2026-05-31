import React from 'react';
import { Card } from './Card.jsx';

const GAP = 14;
const PAD = 16;

function TitleBar({ titleBar, scale = 1 }) {
  if (!titleBar) return null;
  return (
    <div style={{
      position: 'sticky',
      top: titleBar.offsetPx,
      zIndex: 50,
      height: titleBar.heightPx,
      margin: `0 ${PAD}px ${GAP}px`,
      borderRadius: 12,
      background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(10px)',
      color: '#18181B',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      fontWeight: 600,
      fontSize: 15 * scale,
      letterSpacing: '0.02em',
      border: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
    }}>
      Sticky Title{titleBar.offsetPx ? `  ·  offset ${titleBar.offsetPx}px` : ''}
    </div>
  );
}

/**
 * Renders a layout plan inside a scrollable area.
 * Plans come from planDesktop() (desktop) or a mobile strategy.
 */
export function StickyScene({ plan, scale = 1 }) {
  if (!plan) return null;

  if (plan.renderMode === 'flow') {
    // Cancel-sticky: simple vertical stack, no sticky, content height.
    return (
      <div style={{ padding: PAD, display: 'flex', flexDirection: 'column', gap: GAP, minHeight: '100%' }}>
        <TitleBar titleBar={plan.titleBar} scale={scale} />
        {plan.cells.map((c) => (
          <div key={c.id} style={{ height: c.heightPx, minHeight: c.heightPx }}>
            <Card cell={c} meta={c.meta} compact scale={scale} />
          </div>
        ))}
      </div>
    );
  }

  if (plan.renderMode === 'stack') {
    // Overlap: sticky siblings that cover/peek. Containing block = scroll area.
    return (
      <div style={{ position: 'relative', minHeight: plan.totalScrollH, padding: `0 ${PAD}px` }}>
        <TitleBar titleBar={plan.titleBar} scale={scale} />
        {plan.cells.map((c) => (
          <div
            key={c.id}
            style={{
              position: 'sticky',
              top: c.topPx,
              height: c.heightPx,
              marginBottom: GAP,
            }}
          >
            <Card cell={c} meta={c.meta} scale={scale} />
          </div>
        ))}
        <div style={{ height: plan.frameH * 0.4 }} />
      </div>
    );
  }

  if (plan.renderMode === 'sideBySide') {
    // 2 columns. Sticky cell pins (its grid row spans the whole scroll).
    // Scroll cells are in the other column, sequential via marginTop offsets.
    return (
      <div style={{ position: 'relative', height: plan.totalScrollH, padding: `0 ${PAD}px` }}>
        <TitleBar titleBar={plan.titleBar} scale={scale} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: `${plan.totalScrollH}px`,
          columnGap: GAP,
          height: plan.totalScrollH,
        }}>
          {plan.cells.map((c) => {
            const isSticky = c.kind === 'sticky';
            return (
              <div
                key={c.id}
                style={{
                  gridColumn: c.gridColumn,
                  gridRow: 1,
                  alignSelf: 'start',
                  position: isSticky ? 'sticky' : 'relative',
                  top: c.topPx,
                  height: c.heightPx,
                  marginTop: c.marginTopPx,
                }}
              >
                <Card cell={c} meta={c.meta} scale={scale} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (plan.renderMode === 'stickyBg') {
    // Full-bleed BG is sticky; overlay cards scroll over it in a relative layer
    // pulled up to start at the top of the BG.
    const bg = plan.cells.find((c) => c.kind === 'bg');
    const overlays = plan.cells.filter((c) => c.kind !== 'bg');
    return (
      <div style={{ position: 'relative', height: plan.totalScrollH, padding: `0 ${PAD}px` }}>
        <TitleBar titleBar={plan.titleBar} scale={scale} />
        {bg && (
          <div style={{
            position: 'sticky',
            top: bg.topPx,
            height: bg.heightPx,
            width: '100%',
            zIndex: 0,
          }}>
            <Card cell={bg} meta={bg.meta} scale={scale} />
          </div>
        )}
        <div style={{
          position: 'relative',
          zIndex: 1,
          marginTop: bg ? -bg.heightPx : 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: GAP * 2,
        }}>
          {overlays.map((c) => (
            <div key={c.id} style={{
              marginTop: c.marginTopPx,
              width: '78%',
              height: c.heightPx,
            }}>
              <Card cell={c} meta={c.meta} scale={scale} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (plan.renderMode === 'stickyHeader') {
    // Mobile-tailored: one cell pins at top as a header section, the rest stack below.
    const header = plan.cells.find((c) => c.position === 'sticky');
    const rest = plan.cells.filter((c) => c.position !== 'sticky');
    return (
      <div style={{ position: 'relative', minHeight: plan.totalScrollH, padding: `0 ${PAD}px` }}>
        <TitleBar titleBar={plan.titleBar} scale={scale} />
        {header && (
          <div style={{
            position: 'sticky',
            top: header.topPx,
            height: header.heightPx,
            zIndex: 40,
            marginBottom: GAP,
          }}>
            <Card cell={header} meta={header.meta} scale={scale} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
          {rest.map((c) => (
            <div key={c.id} style={{ height: c.heightPx }}>
              <Card cell={c} meta={c.meta} scale={scale} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (plan.renderMode === 'pinned') {
    const pinned = plan.cells.find((c) => c.kind === 'pinned');
    const content = plan.cells.filter((c) => c.kind !== 'pinned');
    return (
      <div style={{ position: 'relative', minHeight: plan.totalScrollH, padding: `0 ${PAD}px` }}>
        <TitleBar titleBar={plan.titleBar} scale={scale} />
        {pinned && (
          <div style={{
            position: 'sticky',
            top: pinned.topPx,
            height: pinned.heightPx,
            zIndex: 50,
            marginBottom: 8,
          }}>
            <Card cell={pinned} meta={pinned.meta} compact scale={scale} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
          {content.map((c) => (
            <div key={c.id} style={{
              marginTop: c.marginTopPx,
              height: c.heightPx,
            }}>
              <Card cell={c} meta={c.meta} scale={scale} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // gridAccumulate: tall single-row grid; each cell sticky + marginTop offset so
  // cards pin in their columns and accumulate across the scroll.
  return (
    <div style={{ position: 'relative', height: plan.totalScrollH, padding: `0 ${PAD}px` }}>
      <TitleBar titleBar={plan.titleBar} scale={scale} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${plan.columns}, 1fr)`,
          gridTemplateRows: `${plan.totalScrollH}px`,
          columnGap: GAP,
          height: plan.totalScrollH,
        }}
      >
        {plan.cells.map((c) => (
          <div
            key={c.id}
            style={{
              gridColumn: c.gridColumn,
              gridRow: 1,
              alignSelf: 'start',
              position: 'sticky',
              top: c.topPx,
              height: c.heightPx,
              marginTop: c.marginTopPx,
            }}
          >
            <Card cell={c} meta={c.meta} scale={scale} />
          </div>
        ))}
      </div>
    </div>
  );
}
