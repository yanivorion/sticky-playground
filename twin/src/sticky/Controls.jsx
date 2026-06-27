import React from 'react';
import { tokens } from '../ui/designTokens.js';
import {
  PRESET_LABELS, PRESET_BLURB, PRESET_CATEGORIES,
  OFFSET_UNITS, OFFSET_UNIT_LABELS, OFFSET_UNIT_DESC,
  STICKY_TYPES, RESPONSIVE_MODES, RESPONSIVE_LABELS,
  cardBounds, supports,
} from './expression.js';

function Group({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: tokens.text3, marginBottom: 8,
      }}>{title}</div>
      {children}
    </div>
  );
}

function Segmented({ options, value, onChange, labels }) {
  return (
    <div style={{
      display: 'flex', gap: 3, padding: 3, borderRadius: 8,
      background: tokens.pillBg, border: `1px solid ${tokens.controlBorder}`,
    }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              flex: 1, padding: '6px 8px', fontSize: 12, fontWeight: 500,
              borderRadius: 6, border: 'none', cursor: 'pointer',
              background: active ? tokens.accent : 'transparent',
              color: active ? '#fff' : tokens.text2,
              transition: `all ${tokens.durFast} ${tokens.easeSmooth}`,
              whiteSpace: 'nowrap',
            }}
          >
            {labels ? labels[opt] : opt}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
        background: tokens.inputBg, border: `1px solid ${tokens.controlBorder}`,
        color: tokens.text1, fontSize: 13, fontWeight: 500,
      }}
    >
      <span>{label}</span>
      <span style={{
        width: 34, height: 20, borderRadius: 999, padding: 2,
        background: checked ? tokens.accent : 'rgba(127,127,127,0.3)',
        transition: `all ${tokens.durFast} ${tokens.easeSmooth}`,
        display: 'flex', justifyContent: checked ? 'flex-end' : 'flex-start',
      }}>
        <span style={{ width: 16, height: 16, borderRadius: 999, background: '#fff' }} />
      </span>
    </button>
  );
}

function Stepper({ value, min, max, onChange }) {
  const btn = (txt, fn, disabled) => (
    <button onClick={fn} disabled={disabled} style={{
      width: 30, height: 30, borderRadius: 6, border: `1px solid ${tokens.controlBorder}`,
      background: tokens.inputBg, color: disabled ? tokens.text3 : tokens.text1,
      fontSize: 16, cursor: disabled ? 'default' : 'pointer', lineHeight: 1,
    }}>{txt}</button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {btn('–', () => onChange(Math.max(min, value - 1)), value <= min)}
      <div style={{
        flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: tokens.text1,
        padding: '6px 0', borderRadius: 6, background: tokens.inputBg,
        border: `1px solid ${tokens.controlBorder}`,
      }}>{value} <span style={{ color: tokens.text3, fontWeight: 400, fontSize: 12 }}>cards</span></div>
      {btn('+', () => onChange(Math.min(max, value + 1)), value >= max)}
    </div>
  );
}

function NumberField({ value, onChange, suffix }) {
  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        style={{
          width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 8,
          background: tokens.inputBg, border: `1px solid ${tokens.controlBorder}`,
          color: tokens.text1, fontWeight: 500,
        }}
      />
      {suffix && <span style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        fontSize: 11, color: tokens.text3,
      }}>{suffix}</span>}
    </div>
  );
}

export function Controls({ exp, onChange }) {
  const set = (patch) => onChange({ ...exp, ...patch });
  const { min, max } = cardBounds(exp);

  return (
    <div style={{
      width: 280, flexShrink: 0, height: '100%', overflowY: 'auto',
      padding: 18, background: tokens.glass, backdropFilter: 'blur(20px)',
      borderRight: `1px solid ${tokens.glassBorder}`,
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: tokens.text1, marginBottom: 4 }}>
        Sticky Expression
      </div>
      <div style={{ fontSize: 12, color: tokens.text3, marginBottom: 20, lineHeight: 1.4 }}>
        {PRESET_BLURB[exp.preset]}
      </div>

      <Group title="Preset">
        {PRESET_CATEGORIES.map((cat) => (
          <div key={cat.id} style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 10, color: tokens.text3, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6,
            }}>{cat.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {cat.presets.map((p) => {
                const active = exp.preset === p;
                return (
                  <button key={p} onClick={() => set({ preset: p })} style={{
                    padding: '9px 8px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    cursor: 'pointer',
                    background: active ? tokens.accent : tokens.inputBg,
                    color: active ? '#fff' : tokens.text2,
                    border: `1px solid ${active ? tokens.accent : tokens.controlBorder}`,
                    transition: `all ${tokens.durFast} ${tokens.easeSmooth}`,
                  }}>{PRESET_LABELS[p]}</button>
                );
              })}
            </div>
          </div>
        ))}
      </Group>

      <Group title={
        exp.preset === 'sideBySide' ? 'Scroll blocks' :
        exp.preset === 'stickyBg' ? 'Overlay blocks' :
        exp.preset === 'pinned' ? 'Content blocks' : 'Cards'
      }>
        <Stepper value={Math.max(min, Math.min(max, exp.cardCount))} min={min} max={max}
          onChange={(v) => set({ cardCount: v })} />
        <div style={{ fontSize: 11, color: tokens.text3, marginTop: 6 }}>
          {min}–{max} {supports(exp, 'hero') && exp.hero ? '· hero relaxes the minimum' : ''}
        </div>
      </Group>

      {supports(exp, 'arrangement') && (
        <Group title="Arrangement">
          <Segmented options={['zebra', 'regular']} value={exp.arrangement}
            onChange={(v) => set({ arrangement: v })}
            labels={{ zebra: 'Zebra (alt)', regular: 'Regular (fill)' }} />
        </Group>
      )}

      {supports(exp, 'gridMode') && (
        <Group title="Grid mode">
          <Segmented options={['holes', 'full']} value={exp.gridMode}
            onChange={(v) => set({ gridMode: v })}
            labels={{ holes: 'Holes (alt)', full: 'Full (≤12)' }} />
        </Group>
      )}

      {supports(exp, 'stickySide') && (
        <Group title="Sticky side">
          <Segmented options={['left', 'right']} value={exp.stickySide}
            onChange={(v) => set({ stickySide: v })}
            labels={{ left: 'Left pinned', right: 'Right pinned' }} />
        </Group>
      )}

      {(supports(exp, 'hero') || supports(exp, 'title')) && (
        <Group title="Structure">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {supports(exp, 'hero') && (
              <Toggle label="Hero cell" checked={exp.hero} onChange={(v) => set({ hero: v })} />
            )}
            {supports(exp, 'title') && (
              <Toggle label="Sticky title" checked={exp.title} onChange={(v) => set({ title: v })} />
            )}
            {exp.title && supports(exp, 'title') && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingLeft: 4 }}>
                <span style={{ fontSize: 12, color: tokens.text3 }}>Title offset</span>
                <NumberField value={exp.titleOffsetValue}
                  onChange={(v) => set({ titleOffsetValue: v })} suffix={exp.titleOffsetUnit} />
              </div>
            )}
          </div>
        </Group>
      )}

      <Group title="Sticky offset">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <NumberField value={exp.offsetValue} onChange={(v) => set({ offsetValue: v })} />
        </div>
        <Segmented options={OFFSET_UNITS} value={exp.offsetUnit}
          onChange={(v) => set({ offsetUnit: v })} labels={OFFSET_UNIT_LABELS} />
        <div style={{ fontSize: 11, color: tokens.text3, marginTop: 6 }}>
          {OFFSET_UNIT_DESC[exp.offsetUnit]}
        </div>
      </Group>

      <Group title="Sticky type">
        <Segmented options={STICKY_TYPES} value={exp.stickyType}
          onChange={(v) => set({ stickyType: v })}
          labels={{ top: 'Top', bottom: 'Bottom', 'top-bottom': 'Top-Bottom' }} />
      </Group>

      {supports(exp, 'responsive') && (
        <Group title="Responsive package">
          <Segmented options={RESPONSIVE_MODES} value={exp.responsive}
            onChange={(v) => set({ responsive: v })} labels={RESPONSIVE_LABELS} />
        </Group>
      )}
    </div>
  );
}
