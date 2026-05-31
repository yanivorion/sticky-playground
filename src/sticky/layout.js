/**
 * Layout planner: turns a generated expression + a device viewport into an
 * explicit "plan" of pixel placements that the renderer draws.
 *
 * Heights/offsets are in px relative to the DEVICE FRAME (not the browser
 * window), because each frame scrolls internally — so "100vh" === frame height.
 */

import { resolveOffsetPx } from './expression.js';

const TITLE_BAR_H = 56;

function heightTag(exp) {
  return exp.responsive === 'scale' ? 'scaled' : '100vh';
}

/**
 * Plan the desktop (as-designed) rendering of an expression.
 * renderMode 'stack'         → overlap: cards cover/peek (sticky siblings).
 * renderMode 'gridAccumulate' → horizontal/split/grid: cards pin in columns and
 *                               accumulate as you scroll (tall grid + marginTop).
 */
export function planDesktop(gen, viewport) {
  const exp = gen.exp;
  const frameH = viewport.height;
  const offsetPx = Math.round(resolveOffsetPx(exp.offsetValue, exp.offsetUnit, viewport));
  const titleOffsetPx = gen.title
    ? Math.round(resolveOffsetPx(gen.title.offsetValue, gen.title.offsetUnit, viewport))
    : 0;
  const titleBar = gen.title ? { offsetPx: titleOffsetPx, heightPx: TITLE_BAR_H } : null;
  const baseTop = (titleBar ? TITLE_BAR_H + titleOffsetPx : 0);
  const scale = exp.responsive === 'scale' ? 0.9 : 1;
  const cellH = Math.round(frameH * scale);
  const hTag = heightTag(exp);

  if (gen.renderMode === 'stack') {
    const cells = gen.cells.map((c) => {
      const topPx = baseTop + offsetPx * c.row;
      return {
        ...c,
        topPx,
        heightPx: cellH,
        marginTopPx: 0,
        gridColumn: '1 / -1',
        meta: `sticky top ${topPx}px · ${hTag}`,
      };
    });
    return {
      renderMode: 'stack',
      columns: 1,
      frameH,
      totalScrollH: Math.round((gen.cells.length + 0.4) * frameH),
      titleBar,
      cells,
    };
  }

  if (gen.renderMode === 'sideBySide') {
    // Sticky column pinned; the other column scrolls past it.
    const cells = gen.cells.map((c) => {
      if (c.kind === 'sticky') {
        return {
          ...c,
          topPx: baseTop + offsetPx,
          heightPx: cellH,
          marginTopPx: 0,
          gridColumn: `${c.col + 1} / span 1`,
          gridRowSpan: 'all',
          meta: `sticky · top ${baseTop + offsetPx}px · ${hTag}`,
        };
      }
      return {
        ...c,
        topPx: 0,
        heightPx: Math.round(frameH * 0.92),
        marginTopPx: c.row * frameH,
        gridColumn: `${c.col + 1} / span 1`,
        position: 'relative',
        meta: `scroll block ${c.index + 1}`,
      };
    });
    return {
      renderMode: 'sideBySide',
      columns: 2,
      frameH,
      totalScrollH: Math.round((gen.totalRows + 0.4) * frameH),
      titleBar,
      cells,
    };
  }

  if (gen.renderMode === 'stickyBg') {
    const cells = gen.cells.map((c) => {
      if (c.kind === 'bg') {
        return {
          ...c,
          topPx: 0,
          heightPx: frameH,
          marginTopPx: 0,
          meta: `bg · sticky top 0 · ${hTag}`,
        };
      }
      return {
        ...c,
        topPx: 0,
        heightPx: Math.round(frameH * 0.62),
        marginTopPx: c.index === 0 ? Math.round(frameH * 0.4) : Math.round(frameH * 0.4),
        meta: `overlay ${c.index + 1} · scrolls past bg`,
      };
    });
    return {
      renderMode: 'stickyBg',
      columns: 1,
      frameH,
      totalScrollH: Math.round((gen.totalRows + 0.6) * frameH),
      titleBar,
      cells,
    };
  }

  if (gen.renderMode === 'pinned') {
    const pinnedH = 64;
    const cells = gen.cells.map((c) => {
      if (c.kind === 'pinned') {
        return {
          ...c,
          topPx: titleBar ? TITLE_BAR_H + titleOffsetPx : 0,
          heightPx: pinnedH,
          marginTopPx: 0,
          meta: `pinned · ${pinnedH}px`,
        };
      }
      return {
        ...c,
        topPx: 0,
        heightPx: Math.round(frameH * 0.78),
        marginTopPx: c.index === 0 ? pinnedH + 12 : 12,
        meta: `content ${c.index + 1}`,
      };
    });
    return {
      renderMode: 'pinned',
      columns: 1,
      frameH,
      totalScrollH: Math.round(pinnedH + gen.cells.filter(c => c.kind !== 'pinned').length * frameH * 0.82),
      titleBar,
      cells,
    };
  }

  // gridAccumulate
  const cells = gen.cells.map((c) => {
    const topPx = baseTop + offsetPx;
    const marginTopPx = c.row * frameH;
    return {
      ...c,
      topPx,
      heightPx: cellH,
      marginTopPx,
      gridColumn: `${c.col + 1} / span ${c.span}`,
      meta: `col ${c.col + 1}${c.span > 1 ? `–${c.col + c.span}` : ''} · top ${topPx}px · ${hTag}`,
    };
  });
  return {
    renderMode: 'gridAccumulate',
    columns: gen.columns,
    frameH,
    totalScrollH: Math.round((gen.totalRows + 0.4) * frameH),
    titleBar,
    cells,
  };
}
