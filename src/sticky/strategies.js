/**
 * Desktop → Mobile transformation strategies for sticky expressions.
 *
 * Ordered along the spectrum the team needs to discuss: from the simplest
 * solution that "isn't doing nothing" up to the most complex that takes over
 * every expression. Each strategy maps to one of the boss-meeting options and
 * returns a plan that StickyScene can render directly.
 */

import { resolveOffsetPx } from './expression.js';
import { planDesktop } from './layout.js';

const GAP = 14;

// ── plan builders ──

function flowPlan(gen, viewport, { heightPx, titleSticky }) {
  const titleBar = gen.title ? { offsetPx: 0, heightPx: 48, sticky: titleSticky } : null;
  const cells = gen.cells.map((c) => ({
    ...c,
    heightPx,
    meta: c.kind === 'hero' ? 'hero · stacked' : 'stacked · no sticky',
  }));
  return { renderMode: 'flow', columns: 1, frameH: viewport.height, titleBar, cells };
}

function cellHeightFor(kind, frameH, heightFactor) {
  if (kind === 'pinned') return 56;
  if (kind === 'bg') return Math.round(frameH * 0.6);
  return Math.round(frameH * heightFactor);
}

function stackPlan(gen, viewport, { topBase, peek, heightFactor, label }) {
  const frameH = viewport.height;
  const titleBar = gen.title ? { offsetPx: 0, heightPx: 48 } : null;
  const titleShift = titleBar ? titleBar.heightPx + 8 : 0;
  const cells = gen.cells.map((c, i) => {
    const topPx = titleShift + topBase + peek * i;
    const heightPx = cellHeightFor(c.kind, frameH, heightFactor);
    return {
      ...c,
      topPx,
      heightPx,
      marginTopPx: 0,
      gridColumn: '1 / -1',
      meta: `${label} · top ${topPx}px`,
    };
  });
  return {
    renderMode: 'stack',
    columns: 1,
    frameH,
    totalScrollH: Math.round(cells.reduce((s, c) => s + c.heightPx, 0) + frameH * 0.4),
    titleBar,
    cells,
  };
}

// Tailored mobile plan: one "header" cell pins at top, the rest scroll below.
// Used for sideBySide / stickyBg in `translate`.
function stickyHeaderPlan(gen, viewport, { headerKind, headerHeightFactor, label }) {
  const frameH = viewport.height;
  const headerH = Math.round(frameH * headerHeightFactor);
  const titleBar = gen.title ? { offsetPx: 0, heightPx: 48 } : null;
  const titleShift = titleBar ? titleBar.heightPx + 8 : 0;
  const cells = gen.cells.map((c) => {
    if (c.kind === headerKind) {
      return {
        ...c,
        topPx: titleShift,
        heightPx: headerH,
        marginTopPx: 0,
        position: 'sticky',
        meta: `${label} header · sticky top ${titleShift}px`,
      };
    }
    return {
      ...c,
      topPx: 0,
      heightPx: Math.round(frameH * 0.72),
      marginTopPx: 12,
      position: 'static',
      meta: 'scrolls below',
    };
  });
  return {
    renderMode: 'stickyHeader',
    columns: 1,
    frameH,
    totalScrollH: Math.round(headerH + cells.filter(c => c.kind !== headerKind).length * frameH * 0.78),
    titleBar,
    cells,
  };
}

// Keep two narrow columns (grid-full only), shorter cells so a row fits.
function twoColPlan(gen, viewport) {
  const frameH = viewport.height;
  const rowH = Math.round(frameH * 0.5);
  const cellH = rowH - GAP;
  const offsetPx = 12;
  const titleBar = gen.title ? { offsetPx: 0, heightPx: 48 } : null;
  const cells = gen.cells.map((c) => {
    const span = c.kind === 'hero' ? 2 : 1;
    return {
      ...c,
      topPx: (titleBar ? titleBar.heightPx + 8 : 0) + offsetPx,
      heightPx: c.kind === 'hero' ? Math.round(frameH * 0.6) : cellH,
      marginTopPx: c.row * rowH,
      gridColumn: c.kind === 'hero' ? '1 / -1' : `${c.col + 1} / span ${span}`,
      meta: `2-col · top ${offsetPx}px`,
    };
  });
  return {
    renderMode: 'gridAccumulate',
    columns: 2,
    frameH,
    totalScrollH: Math.round((gen.totalRows + 0.4) * rowH),
    titleBar,
    cells,
  };
}

// ── the four strategies ──

export const STRATEGIES = [
  {
    id: 'flatten',
    label: 'Cancel sticky',
    bossOption: 'Option 1',
    complexity: 1,
    blurb: 'Drop sticky on mobile. Cells stack vertically, one below the other, in DOM order.',
    pros: ['Never breaks', 'Trivial to ship', 'Predictable for every expression'],
    cons: ['Loses the design intent entirely', 'Mobile looks nothing like desktop'],
    build: (gen, vp) => flowPlan(gen, vp, { heightPx: 300, titleSticky: false }),
  },
  {
    id: 'lock',
    label: 'Keep as designed (lock)',
    bossOption: 'Option 2',
    complexity: 2,
    blurb: 'Designer locks the section — mobile algorithm does not run. The desktop sticky expression is kept as-is, just narrower.',
    pros: ['Preserves the designer’s intent', 'No generic algorithm to ruin it'],
    cons: ['Atom-built sticky squeezed into 390px often breaks', 'Multi-column presets crush; 100vh overflows', 'Burden is on the designer to make it work'],
    build: (gen, vp) => planDesktop(gen, vp),
  },
  {
    id: 'heuristic',
    label: 'Sticky heuristic (generic)',
    bossOption: 'Option 3',
    complexity: 3,
    blurb: 'One universal rule: collapse any preset to a single-column sticky stack with a small peek. Keeps a sticky feel without per-preset logic.',
    pros: ['Keeps sticky on mobile', 'One rule covers all expressions', 'Never crushes columns'],
    cons: ['Every preset looks the same on mobile', 'Loses split/grid character'],
    build: (gen, vp) =>
      stackPlan(gen, vp, { topBase: 12, peek: 14, heightFactor: 0.8, label: 'generic sticky' }),
  },
  {
    id: 'translate',
    label: 'Per-preset translation',
    bossOption: 'Option 4',
    complexity: 4,
    blurb: 'Tailored rule per preset: overlap peeks, horizontal becomes a full-cover reveal, split keeps its rhythm, grid-full keeps two narrow columns.',
    pros: ['Closest mobile match to each desktop intent', 'Sticky preserved meaningfully'],
    cons: ['Most logic to build & maintain', 'Needs a rule for every new expression'],
    build: (gen, vp) => {
      const exp = gen.exp;
      const offsetPx = Math.round(resolveOffsetPx(exp.offsetValue, exp.offsetUnit, vp));
      if (exp.preset === 'pinned') {
        // Keep the bar pinned, content scrolls below — preserves intent.
        return planDesktop(gen, vp);
      }
      if (exp.preset === 'sideBySide') {
        return stickyHeaderPlan(gen, vp, { headerKind: 'sticky', headerHeightFactor: 0.34, label: 'sticky-side' });
      }
      if (exp.preset === 'stickyBg') {
        return stickyHeaderPlan(gen, vp, { headerKind: 'bg', headerHeightFactor: 0.42, label: 'bg' });
      }
      if (exp.preset === 'grid' && exp.gridMode === 'full') {
        return twoColPlan(gen, vp);
      }
      if (exp.preset === 'horizontal') {
        return stackPlan(gen, vp, { topBase: 8, peek: 0, heightFactor: 1, label: 'full-cover reveal' });
      }
      // overlap, split, grid-holes → single-column sticky with peek
      const peek = Math.max(10, Math.min(40, offsetPx || 18));
      return stackPlan(gen, vp, { topBase: 10, peek, heightFactor: 0.86, label: 'peek stack' });
    },
  },
];

export function getStrategy(id) {
  return STRATEGIES.find((s) => s.id === id) || STRATEGIES[0];
}

export function planMobile(gen, viewport, strategyId) {
  return getStrategy(strategyId).build(gen, viewport);
}
