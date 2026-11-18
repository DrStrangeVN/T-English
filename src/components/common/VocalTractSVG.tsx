import React from 'react';

interface VocalTractSVGProps {
  phoneme: string;
}

interface TractConfig {
  voiced: boolean;
  airflowType: 'fricative' | 'stop' | 'vowel' | 'approximant' | 'nasal';
  tonguePath: string;
  contactPoint: { x: number; y: number } | null;
  lipOpenness: number; // 0 = closed, 1 = wide
  labelVi: string;
}

function getTractConfig(symbol: string): TractConfig {
  switch (symbol) {
    case 'θ':
    case 'ð':
      return {
        voiced: symbol === 'ð',
        airflowType: 'fricative',
        tonguePath: 'M 145 128 Q 100 100 62 96 Q 48 95 45 98 Q 65 112 105 130 Z',
        contactPoint: { x: 48, y: 95 },
        lipOpenness: 0.45,
        labelVi: 'Đầu lưỡi kẹp nhẹ giữa hai hàm răng cửa, thổi hơi ra ngoài.',
      };
    case 'ʃ':
    case 'ʒ':
    case 'tʃ':
    case 'dʒ':
      return {
        voiced: symbol === 'ʒ' || symbol === 'dʒ',
        airflowType: symbol.startsWith('t') || symbol.startsWith('d') ? 'stop' : 'fricative',
        tonguePath: 'M 145 128 Q 105 74 72 86 Q 62 92 75 112 Q 108 128 145 128 Z',
        contactPoint: { x: 80, y: 78 },
        lipOpenness: 0.3,
        labelVi: 'Chu nhẹ hai môi, nâng phần thân lưỡi sát ngạc cứng.',
      };
    case 's':
    case 'z':
      return {
        voiced: symbol === 'z',
        airflowType: 'fricative',
        tonguePath: 'M 145 128 Q 100 94 64 88 Q 56 90 68 112 Q 105 128 145 128 Z',
        contactPoint: { x: 64, y: 84 },
        lipOpenness: 0.35,
        labelVi: 'Đầu lưỡi đặt ngay sau lợi răng trên, đẩy luồng hơi mảnh qua kẽ răng.',
      };
    case 'r':
      return {
        voiced: true,
        airflowType: 'approximant',
        tonguePath: 'M 145 128 Q 108 88 86 78 Q 78 86 88 108 Q 112 128 145 128 Z',
        contactPoint: null,
        lipOpenness: 0.38,
        labelVi: 'Uốn cong đầu lưỡi về phía sau KHÔNG chạm vòm miệng.',
      };
    case 'l':
      return {
        voiced: true,
        airflowType: 'approximant',
        tonguePath: 'M 145 128 Q 108 106 66 74 Q 60 80 76 112 Q 110 128 145 128 Z',
        contactPoint: { x: 66, y: 73 },
        lipOpenness: 0.55,
        labelVi: 'Đầu lưỡi chạm chắc vào gờ lợi ngay sau răng cửa trên.',
      };
    case 'f':
    case 'v':
      return {
        voiced: symbol === 'v',
        airflowType: 'fricative',
        tonguePath: 'M 145 128 Q 105 112 72 114 Q 68 120 96 128 Z',
        contactPoint: { x: 46, y: 103 },
        lipOpenness: 0.25,
        labelVi: 'Răng cửa trên chạm nhẹ lên môi dưới rồi thổi hơi.',
      };
    case 'æ':
    case 'ɑː':
      return {
        voiced: true,
        airflowType: 'vowel',
        tonguePath: 'M 145 130 Q 105 122 65 124 Q 62 132 100 135 Z',
        contactPoint: null,
        lipOpenness: 0.95,
        labelVi: 'Hạ hàm dưới sâu, mở rộng khoang miệng để âm thoát thoáng.',
      };
    case 'iː':
    case 'ɪ':
      return {
        voiced: true,
        airflowType: 'vowel',
        tonguePath: 'M 145 128 Q 100 84 68 94 Q 65 106 104 128 Z',
        contactPoint: null,
        lipOpenness: symbol === 'iː' ? 0.5 : 0.65,
        labelVi: symbol === 'iː' ? 'Nâng thân lưỡi cao về trước, khóe miệng kéo căng.' : 'Thân lưỡi hơi nâng, thả lỏng hoàn toàn môi và má.',
      };
    case 'uː':
    case 'ʊ':
    case 'w':
      return {
        voiced: true,
        airflowType: 'vowel',
        tonguePath: 'M 145 128 Q 124 84 96 98 Q 84 114 115 128 Z',
        contactPoint: null,
        lipOpenness: 0.2,
        labelVi: 'Chu tròn hai môi về phía trước, nâng gốc lưỡi về sau.',
      };
    case 'm':
    case 'n':
    case 'ŋ':
      return {
        voiced: true,
        airflowType: 'nasal',
        tonguePath:
          symbol === 'ŋ'
            ? 'M 145 128 Q 126 70 102 98 Q 92 116 122 128 Z'
            : 'M 145 128 Q 102 96 66 75 Q 64 96 96 128 Z',
        contactPoint: symbol === 'm' ? { x: 40, y: 98 } : symbol === 'ŋ' ? { x: 118, y: 74 } : { x: 66, y: 74 },
        lipOpenness: symbol === 'm' ? 0.05 : 0.4,
        labelVi: 'Chặn luồng hơi ở khoang miệng và đẩy âm vang qua khoang mũi.',
      };
    default:
      return {
        voiced: ['b', 'd', 'g', 'j', 'ə', 'e', 'ʌ', 'ɜː', 'ɔː', 'ɒ'].includes(symbol),
        airflowType: 'vowel',
        tonguePath: 'M 145 128 Q 105 102 68 106 Q 66 118 102 128 Z',
        contactPoint: ['t', 'd'].includes(symbol) ? { x: 66, y: 74 } : ['p', 'b'].includes(symbol) ? { x: 40, y: 98 } : null,
        lipOpenness: ['p', 'b'].includes(symbol) ? 0.05 : 0.55,
        labelVi: 'Giữ lưỡi tự nhiên giữa khoang miệng, bật âm dứt khoát.',
      };
  }
}

export const VocalTractSVG: React.FC<VocalTractSVGProps> = ({ phoneme }) => {
  const cfg = getTractConfig(phoneme);
  const jawDrop = Math.round(cfg.lipOpenness * 14);

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        border: '1px solid var(--line)',
        background: 'var(--raised)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 650 }}>
          Sơ đồ Giải phẫu Khoang Miệng: <span className="mono" style={{ color: 'var(--cyan)' }}>/{phoneme}/</span>
        </span>
        <span
          className="tag"
          style={{
            color: cfg.voiced ? 'var(--green)' : 'var(--amber)',
            background: cfg.voiced ? 'var(--green-s)' : 'var(--amber-s)',
          }}
        >
          {cfg.voiced ? 'Voiced (Rung cổ họng)' : 'Unvoiced (Không rung)'}
        </span>
      </div>

      <svg viewBox="0 0 210 155" style={{ width: '100%', maxHeight: 155 }}>
        {/* Nasal cavity & hard/soft palate */}
        <path
          d="M 42 54 Q 88 32 138 56 Q 155 68 156 142"
          fill="none"
          stroke="var(--line2)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M 48 80 Q 74 62 114 66 Q 134 70 140 88"
          fill="none"
          stroke="var(--text)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Upper lip & upper teeth */}
        <path d="M 30 82 Q 40 78 48 82" fill="none" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round" />
        <rect x="48" y="80" width="6" height="12" rx="1.5" fill="var(--text)" opacity="0.85" />

        {/* Lower lip & lower teeth (jaw drop moves dynamically) */}
        <path
          d={`M 32 ${98 + jawDrop} Q 42 ${104 + jawDrop} 52 ${98 + jawDrop}`}
          fill="none"
          stroke="var(--text)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <rect x="49" y={94 + jawDrop - 6} width="6" height="11" rx="1.5" fill="var(--text)" opacity="0.7" />
        <path
          d={`M 44 ${112 + jawDrop} Q 75 ${142} 135 144`}
          fill="none"
          stroke="var(--line2)"
          strokeWidth="1.6"
        />

        {/* Dynamic Tongue Body */}
        <path
          d={cfg.tonguePath}
          fill="var(--cyan-s)"
          stroke="var(--cyan)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Airflow indicator */}
        {cfg.airflowType === 'nasal' ? (
          <path
            d="M 136 110 Q 124 58 64 52 L 32 52"
            fill="none"
            stroke="var(--cyan)"
            strokeWidth="1.8"
            strokeDasharray="4 3"
          />
        ) : (
          <path
            d={`M 138 118 Q 100 94 ${cfg.contactPoint ? 52 : 24} ${94 + Math.round(jawDrop / 2)}`}
            fill="none"
            stroke="var(--cyan)"
            strokeWidth="1.6"
            strokeDasharray="4 3"
          />
        )}

        {/* Articulatory Contact Point */}
        {cfg.contactPoint && (
          <circle cx={cfg.contactPoint.x} cy={cfg.contactPoint.y} r="5" fill="var(--rose)" />
        )}

        {/* Vocal cords indicator at throat */}
        <circle
          cx="150"
          cy="138"
          r="6"
          fill={cfg.voiced ? 'var(--green-s)' : 'var(--amber-s)'}
          stroke={cfg.voiced ? 'var(--green)' : 'var(--amber)'}
          strokeWidth="1.8"
        />
        <text x="160" y="141" fill="var(--muted)" fontSize="9">
          {cfg.voiced ? 'Rung' : 'Hơi'}
        </text>
      </svg>

      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{cfg.labelVi}</div>
    </div>
  );
};
