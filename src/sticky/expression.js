/**
 * Sticky Expression model + preset generator.
 *
 * A "sticky expression" is the parametric description of a sticky section as
 * mapped in the design research, built from atoms (position:sticky + offset +
 * 100vh). The generator turns an expression into a normalized list of cells the
 * desktop renderer and mobile strategies both consume.
 *
 * Presets (covering the research's design intents):
 *   STICKY CARDS — overlap, horizontal, split, grid
 *   LAYOUTS     — sideBySide (sticky one side + scrolling other), stickyBg
 *                 (full-bleed BG that stays while content scrolls past)
 *   UI STICKY   — pinned (small sticky bar over scrolling content)
 *
 * Interpretation for the card presets:
 *  - overlap            → 1 column, cards STACK and cover (offset → peeking)
 *  - horizontal         → N columns, card i in column i (diagonal reveal)
 *  - split / zebra      → 2 columns, one card per row, alternating side
 *  - split / regular    → 2 columns, two cards per row (fills both)
 *  - grid / holes       → 2 columns, alternating side
 *  - grid / full        → 2 columns, fills both (up to 12 cards)
 * Research: "Horizontal & grid 2-card presets are the same expression";
 * "Overlap/Split with hero can have 1 card with no height limit".
 */

export const PRESET_IDS = [
  'overlap', 'horizontal', 'split', 'grid',
  'sideBySide', 'stickyBg', 'pinned',
];

export const PRESET_LABELS = {
  overlap: 'Overlap',
  horizontal: 'Horizontal',
  split: 'Split',
  grid: 'Grid',
  sideBySide: 'Side-by-side',
  stickyBg: 'Sticky BG',
  pinned: 'Pinned bar',
};

export const PRESET_BLURB = {
  overlap: 'Cards stack on top of each other. Offset → peeking cards.',
  horizontal: 'Cards assemble across columns as you scroll (diagonal reveal).',
  split: 'Cards alternate left / right down the page.',
  grid: 'Two-column grid — holes (alternating) or full (both columns).',
  sideBySide: 'One column pins while the other column scrolls past it.',
  stickyBg: 'Full-bleed background stays while foreground content scrolls over.',
  pinned: 'A small bar pins to the top throughout the section scroll.',
};

export const PRESET_CATEGORIES = [
  { id: 'cards',   label: 'Sticky cards', presets: ['overlap', 'horizontal', 'split', 'grid'] },
  { id: 'layouts', label: 'Layouts',      presets: ['sideBySide', 'stickyBg'] },
  { id: 'ui',      label: 'UI sticky',    presets: ['pinned'] },
];

// Offset units from the research. px* is the "new unit" (scaled px ≈ spx).
export const OFFSET_UNITS = ['px', 'px*', '%', 'vh', 'vw'];
export const OFFSET_UNIT_LABELS = {
  px: 'px', 'px*': 'px*', '%': '%', vh: 'vh', vw: 'vw',
};
export const OFFSET_UNIT_DESC = {
  px: 'Absolute pixels — fixed across widths',
  'px*': 'Scaled pixels — proportional to width (new unit)',
  '%': 'Percent of viewport height',
  vh: 'Viewport height',
  vw: 'Viewport width',
};

export const STICKY_TYPES = ['top', 'bottom', 'top-bottom'];

export const RESPONSIVE_MODES = ['fullHeight', 'scale'];
export const RESPONSIVE_LABELS = { fullHeight: 'Full height', scale: 'Scale' };

const REFERENCE_WIDTH = 1280;

export function defaultExpression() {
  return {
    preset: 'overlap',
    cardCount: 3,
    hero: false,
    title: false,
    titleOffsetValue: 8,
    titleOffsetUnit: 'vh',
    arrangement: 'zebra',   // 'zebra' | 'regular'  (split / grid)
    gridMode: 'holes',      // 'holes' | 'full'     (grid only)
    stickySide: 'left',     // 'left' | 'right'     (sideBySide)
    responsive: 'fullHeight',
    stickyType: 'top',
    offsetValue: 0,
    offsetUnit: 'vh',
  };
}

// Card-count bounds per preset. `cardCount` is repurposed per preset:
//   cards presets → number of cards
//   sideBySide    → number of scroll-side blocks
//   stickyBg      → number of foreground content blocks scrolling over the BG
//   pinned        → number of content blocks below the pinned bar
export function cardBounds(exp) {
  if (exp.preset === 'stickyBg') return { min: 1, max: 5 };
  if (exp.preset === 'sideBySide') return { min: 2, max: 6 };
  if (exp.preset === 'pinned') return { min: 2, max: 6 };
  const heroRelaxesMin = exp.hero && (exp.preset === 'overlap' || exp.preset === 'split');
  const min = heroRelaxesMin ? 1 : 2;
  let max = 6;
  if (exp.preset === 'grid' && exp.gridMode === 'full') max = 12;
  return { min, max };
}

// Which preset supports which structural toggle (so the controls can hide
// settings that don't apply).
export function supports(exp, feature) {
  const p = exp.preset;
  const cardsPresets = ['overlap', 'horizontal', 'split', 'grid'];
  switch (feature) {
    case 'hero':         return cardsPresets.includes(p);
    case 'title':        return cardsPresets.includes(p) || p === 'sideBySide';
    case 'arrangement':  return p === 'split';
    case 'gridMode':     return p === 'grid';
    case 'stickySide':   return p === 'sideBySide';
    case 'responsive':   return p !== 'pinned';
    default:             return true;
  }
}

export function clampCardCount(exp) {
  const { min, max } = cardBounds(exp);
  return Math.max(min, Math.min(max, exp.cardCount));
}

/** Resolve an offset { value, unit } to px given the preview viewport. */
export function resolveOffsetPx(value, unit, viewport) {
  const vh = viewport?.height || 800;
  const vw = viewport?.width || 1280;
  switch (unit) {
    case 'px': return value;
    case 'px*': return value * (vw / REFERENCE_WIDTH);
    case '%': return (value / 100) * vh;
    case 'vh': return (value / 100) * vh;
    case 'vw': return (value / 100) * vw;
    default: return value;
  }
}

// ── layout spec per preset ──
function layoutSpec(exp) {
  switch (exp.preset) {
    case 'overlap':
      return { columns: 1, mode: 'stack', renderMode: 'stack' };
    case 'horizontal':
      return { columns: Math.min(exp.cardCount, 6), mode: 'diagonal', renderMode: 'grid' };
    case 'split':
      return exp.arrangement === 'regular'
        ? { columns: 2, mode: 'fill', renderMode: 'grid' }
        : { columns: 2, mode: 'alternate', renderMode: 'grid' };
    case 'grid':
      return exp.gridMode === 'full'
        ? { columns: 2, mode: 'fill', renderMode: 'grid' }
        : { columns: 2, mode: 'alternate', renderMode: 'grid' };
    case 'sideBySide':
      return { columns: 2, mode: 'sideBySide', renderMode: 'sideBySide' };
    case 'stickyBg':
      return { columns: 1, mode: 'stickyBg', renderMode: 'stickyBg' };
    case 'pinned':
      return { columns: 1, mode: 'pinned', renderMode: 'pinned' };
    default:
      return { columns: 1, mode: 'stack', renderMode: 'stack' };
  }
}

function placeCard(index, mode, columns) {
  switch (mode) {
    case 'stack':     return { row: index, col: 0, span: columns };
    case 'diagonal':  return { row: index, col: Math.min(index, columns - 1), span: 1 };
    case 'alternate': return { row: index, col: index % 2, span: 1 };
    case 'fill':      return { row: Math.floor(index / 2), col: index % 2, span: 1 };
    default:          return { row: index, col: 0, span: 1 };
  }
}

/**
 * Generate the normalized cell structure for an expression.
 * @returns {{
 *   preset, renderMode, columns, totalRows,
 *   title: { offsetValue, offsetUnit } | null,
 *   cells: Array<{ id, label, kind, index, row, col, span, accent }>
 * }}
 */
export function generateExpression(rawExp) {
  const exp = { ...rawExp, cardCount: clampCardCount(rawExp) };
  const { columns, mode, renderMode } = layoutSpec(exp);

  let cells = [];
  let totalRows;

  if (renderMode === 'sideBySide') {
    const stickyCol = exp.stickySide === 'right' ? 1 : 0;
    const scrollCol = 1 - stickyCol;
    cells.push({
      id: 'cell-sticky',
      label: 'Sticky',
      kind: 'sticky',
      index: -1,
      row: 0,
      col: stickyCol,
      span: 1,
      accent: true,
    });
    for (let i = 0; i < exp.cardCount; i++) {
      cells.push({
        id: `cell-${i + 1}`,
        label: `Block ${i + 1}`,
        kind: 'card',
        index: i,
        row: i,
        col: scrollCol,
        span: 1,
        accent: false,
      });
    }
    totalRows = exp.cardCount;
  } else if (renderMode === 'stickyBg') {
    cells.push({
      id: 'cell-bg',
      label: 'Background',
      kind: 'bg',
      index: -1,
      row: 0,
      col: 0,
      span: 1,
      accent: true,
    });
    for (let i = 0; i < exp.cardCount; i++) {
      cells.push({
        id: `cell-${i + 1}`,
        label: `Overlay ${i + 1}`,
        kind: 'card',
        index: i,
        row: i,
        col: 0,
        span: 1,
        accent: false,
      });
    }
    totalRows = exp.cardCount;
  } else if (renderMode === 'pinned') {
    cells.push({
      id: 'cell-pinned',
      label: 'Pinned bar',
      kind: 'pinned',
      index: -1,
      row: 0,
      col: 0,
      span: 1,
      accent: true,
    });
    for (let i = 0; i < exp.cardCount; i++) {
      cells.push({
        id: `cell-${i + 1}`,
        label: `Content ${i + 1}`,
        kind: 'card',
        index: i,
        row: i,
        col: 0,
        span: 1,
        accent: false,
      });
    }
    totalRows = exp.cardCount;
  } else {
    // cards presets — overlap / horizontal / split / grid
    let rowOffset = 0;
    if (exp.hero) {
      cells.push({
        id: 'cell-hero',
        label: 'Hero',
        kind: 'hero',
        index: -1,
        row: 0,
        col: 0,
        span: columns,
        accent: true,
      });
      rowOffset = 1;
    }
    for (let i = 0; i < exp.cardCount; i++) {
      const p = placeCard(i, mode, columns);
      cells.push({
        id: `cell-${i + 1}`,
        label: `Cell ${i + 1}`,
        kind: 'card',
        index: i,
        row: p.row + rowOffset,
        col: p.col,
        span: p.span,
        accent: i === 0 && !exp.hero,
      });
    }
    const maxRow = cells.reduce((m, c) => Math.max(m, c.row), 0);
    totalRows = maxRow + 1;
  }

  return {
    preset: exp.preset,
    renderMode,
    columns,
    totalRows,
    title: exp.title ? { offsetValue: exp.titleOffsetValue, offsetUnit: exp.titleOffsetUnit } : null,
    cells,
    exp,
  };
}
