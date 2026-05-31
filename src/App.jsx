import React, { useState, useMemo } from 'react';
import { tokens } from './ui/designTokens.js';
import { Controls } from './sticky/Controls.jsx';
import { StickyScene } from './sticky/StickyScene.jsx';
import {
  defaultExpression, generateExpression, PRESET_LABELS,
} from './sticky/expression.js';
import { planDesktop } from './sticky/layout.js';
import { STRATEGIES, planMobile } from './sticky/strategies.js';

const DESKTOP_VP = { width: 1160, height: 440 };
const MOBILE_VP = { width: 292, height: 560 };

function ComplexityDots({ level }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: 999,
          background: i <= level ? tokens.accent : 'rgba(127,127,127,0.3)',
        }} />
      ))}
    </span>
  );
}

function FrameShell({ title, subtitle, innerW, innerH, children, badge }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text1 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: tokens.text3 }}>{subtitle}</div>}
        </div>
        {badge}
      </div>
      <div style={{
        width: innerW, height: innerH, overflowY: 'auto', overflowX: 'hidden',
        borderRadius: 18, background: '#ffffff',
        border: `1px solid ${tokens.border}`,
        boxShadow: tokens.shadowElevated,
        position: 'relative',
      }}>
        {children}
      </div>
    </div>
  );
}

function MobileStrategyFrame({ gen, strategy }) {
  const plan = useMemo(() => planMobile(gen, MOBILE_VP, strategy.id), [gen, strategy]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: MOBILE_VP.width }}>
      <FrameShell
        title={strategy.label}
        subtitle={strategy.bossOption}
        innerW={MOBILE_VP.width}
        innerH={MOBILE_VP.height}
        badge={<ComplexityDots level={strategy.complexity} />}
      >
        <StickyScene plan={plan} scale={0.82} />
      </FrameShell>
      <div style={{
        width: MOBILE_VP.width, padding: 12, borderRadius: 12,
        background: tokens.glass, border: `1px solid ${tokens.glassBorder}`,
      }}>
        <div style={{ fontSize: 12, color: tokens.text2, lineHeight: 1.45, marginBottom: 8 }}>
          {strategy.blurb}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {strategy.pros.map((p, i) => (
            <div key={`p${i}`} style={{ fontSize: 11, color: tokens.success, display: 'flex', gap: 6 }}>
              <span>✓</span><span style={{ color: tokens.text2 }}>{p}</span>
            </div>
          ))}
          {strategy.cons.map((c, i) => (
            <div key={`c${i}`} style={{ fontSize: 11, color: tokens.danger, display: 'flex', gap: 6 }}>
              <span>✕</span><span style={{ color: tokens.text2 }}>{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [exp, setExp] = useState(defaultExpression());
  const gen = useMemo(() => generateExpression(exp), [exp]);
  const desktopPlan = useMemo(() => planDesktop(gen, DESKTOP_VP), [gen]);

  const summary = `${PRESET_LABELS[exp.preset]} · ${gen.exp.cardCount} cards`
    + `${exp.hero ? ' · hero' : ''}${exp.title ? ' · title' : ''}`
    + ` · offset ${exp.offsetValue}${exp.offsetUnit} · ${exp.responsive === 'scale' ? 'scale' : 'full height'}`;

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      fontFamily: tokens.fontUI, background: tokens.bgPageGradient, color: tokens.text1,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        height: 52, flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 18px',
        borderBottom: `1px solid ${tokens.glassBorder}`, background: tokens.glassStrong,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: 3, background: tokens.accent,
          }} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Sticky Playground</span>
          <span style={{ fontSize: 12, color: tokens.text3 }}>desktop → mobile examination</span>
        </div>
        <div style={{ fontSize: 12, color: tokens.text2, fontWeight: 500 }}>{summary}</div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Controls exp={exp} onChange={setExp} />

        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, alignItems: 'flex-start', minWidth: 'min-content' }}>
            {/* Desktop */}
            <FrameShell
              title="Desktop — as designed"
              subtitle="Scroll inside the frame to see the sticky behavior"
              innerW={DESKTOP_VP.width}
              innerH={DESKTOP_VP.height}
            >
              <StickyScene plan={desktopPlan} />
            </FrameShell>

            {/* Divider */}
            <div style={{ alignSelf: 'stretch', height: 1, background: tokens.glassBorder }} />

            {/* Mobile strategies */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Mobile — 4 transformation options
              </div>
              <div style={{ fontSize: 11, color: tokens.text3, marginBottom: 14 }}>
                Same expression, simplest → most complex. Each scrolls independently.
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {STRATEGIES.map((s) => (
                  <MobileStrategyFrame key={s.id} gen={gen} strategy={s} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
