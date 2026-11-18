import React, { useMemo, useState } from 'react';
import { WORD_ROOTS_DATA, type WordDerivative } from '../../data/wordRoots';
import { speakEnglish } from '../../core/phonetics/speechIO';
import { IconPlus, IconVolume } from '../icons/Icons';

interface WordRootGraphProps {
  initialRootId?: string;
  onAddDerivativeToFsrs: (deriv: WordDerivative, rootLabel: string) => void;
}

export const WordRootGraph: React.FC<WordRootGraphProps> = ({
  initialRootId,
  onAddDerivativeToFsrs,
}) => {
  const [selectedRootId, setSelectedRootId] = useState(
    initialRootId || WORD_ROOTS_DATA[0].id
  );
  const rootNode = useMemo(
    () => WORD_ROOTS_DATA.find((r) => r.id === selectedRootId) ?? WORD_ROOTS_DATA[0],
    [selectedRootId]
  );
  const [activeDeriv, setActiveDeriv] = useState<WordDerivative>(rootNode.derivatives[0]);

  const handleSelectRoot = (id: string) => {
    setSelectedRootId(id);
    const next = WORD_ROOTS_DATA.find((r) => r.id === id) ?? WORD_ROOTS_DATA[0];
    setActiveDeriv(next.derivatives[0]);
  };

  // Constellation node coordinates around center (220, 145)
  const nodes = useMemo(() => {
    const cx = 220;
    const cy = 145;
    const rx = 148;
    const ry = 102;
    return rootNode.derivatives.slice(0, 6).map((d, idx) => {
      const angle = (idx / 6) * Math.PI * 2 - Math.PI / 2;
      return {
        deriv: d,
        x: Math.round(cx + Math.cos(angle) * rx),
        y: Math.round(cy + Math.sin(angle) * ry),
      };
    });
  }, [rootNode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="filters" style={{ marginBottom: 0 }}>
        {WORD_ROOTS_DATA.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`fp ${r.id === rootNode.id ? 'on' : ''}`}
            onClick={() => handleSelectRoot(r.id)}
          >
            <span className="mono" style={{ fontWeight: 700 }}>{r.root}</span>
            <span className="tag">{r.origin}</span>
          </button>
        ))}
      </div>

      <div className="split-2">
        {/* Left: Constellation SVG Map */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="ph" style={{ marginBottom: 0 }}>
            <div>
              <b>Bản đồ Gốc từ Membean: {rootNode.root}</b>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Nghĩa gốc ({rootNode.origin}): &ldquo;{rootNode.coreMeaningVi}&rdquo; ({rootNode.coreMeaningEn})
              </div>
            </div>
          </div>

          <svg viewBox="0 0 440 290" style={{ width: '100%', maxHeight: 300 }}>
            {/* Edges */}
            {nodes.map((n) => {
              const isActive = n.deriv.word === activeDeriv.word;
              return (
                <line
                  key={`line-${n.deriv.word}`}
                  x1="220"
                  y1="145"
                  x2={n.x}
                  y2={n.y}
                  stroke={isActive ? 'var(--cyan)' : 'var(--line2)'}
                  strokeWidth={isActive ? 2.2 : 1.3}
                  strokeDasharray={isActive ? undefined : '4 3'}
                />
              );
            })}

            {/* Center Root Hub */}
            <rect
              x="160"
              y="120"
              width="120"
              height="50"
              rx="14"
              fill="var(--panel-solid)"
              stroke="var(--cyan)"
              strokeWidth="2"
            />
            <text
              x="220"
              y="142"
              textAnchor="middle"
              fill="var(--text)"
              fontSize="12.5"
              fontWeight="700"
            >
              {rootNode.root}
            </text>
            <text
              x="220"
              y="159"
              textAnchor="middle"
              fill="var(--cyan)"
              fontSize="10"
            >
              {rootNode.coreMeaningEn}
            </text>

            {/* Satellite Derivative Nodes */}
            {nodes.map((n) => {
              const isActive = n.deriv.word === activeDeriv.word;
              return (
                <g
                  key={n.deriv.word}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setActiveDeriv(n.deriv);
                    speakEnglish(n.deriv.word);
                  }}
                >
                  <rect
                    x={n.x - 58}
                    y={n.y - 20}
                    width="116"
                    height="40"
                    rx="11"
                    fill={isActive ? 'var(--sel)' : 'var(--panel-solid)'}
                    stroke={isActive ? 'var(--cyan)' : 'var(--line2)'}
                    strokeWidth={isActive ? 1.8 : 1}
                  />
                  <text
                    x={n.x}
                    y={n.y - 2}
                    textAnchor="middle"
                    fill="var(--text)"
                    fontSize="11.5"
                    fontWeight="650"
                  >
                    {n.deriv.word}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 12}
                    textAnchor="middle"
                    fill="var(--muted)"
                    fontSize="9.5"
                  >
                    {n.deriv.cefr} · {n.deriv.pos}
                  </text>
                </g>
              );
            })}
          </svg>

          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--raised)', fontSize: 11.5, color: 'var(--muted)' }}>
            <b>Mẹo liên tưởng gốc từ:</b> {rootNode.mnemonicVi}
          </div>
        </div>

        {/* Right: Selected Derivative Morphology Breakdown */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{activeDeriv.word}</div>
                <div className="mono" style={{ fontSize: 12.5, color: 'var(--cyan)' }}>
                  {activeDeriv.ipa} · {activeDeriv.pos}
                </div>
              </div>
              <button
                type="button"
                className="ib"
                onClick={() => speakEnglish(activeDeriv.word)}
                title="Nghe phát âm"
              >
                <IconVolume size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {activeDeriv.prefix && <span className="tag">Tiền tố: {activeDeriv.prefix}</span>}
              <span className="tag" style={{ color: 'var(--cyan)', background: 'var(--cyan-s)' }}>
                Gốc: {rootNode.root}
              </span>
              {activeDeriv.suffix && <span className="tag">Hậu tố: {activeDeriv.suffix}</span>}
            </div>

            <div style={{ fontSize: 14, fontWeight: 620 }}>{activeDeriv.meaningVi}</div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: 'var(--raised)',
                border: '1px solid var(--line)',
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 4 }}>Ví dụ thực tế:</div>
              <div>{activeDeriv.example}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="gb"
              onClick={() => speakEnglish(activeDeriv.example)}
            >
              <IconVolume size={14} />
              <span>Nghe cả câu</span>
            </button>
            <button
              type="button"
              className="pb"
              style={{ flex: 1 }}
              onClick={() => onAddDerivativeToFsrs(activeDeriv, rootNode.root)}
            >
              <IconPlus size={14} />
              <span>Thêm &ldquo;{activeDeriv.word}&rdquo; vào FSRS v5</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
