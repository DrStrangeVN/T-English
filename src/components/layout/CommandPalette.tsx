import React, { useEffect, useMemo, useState } from 'react';
import type { FsrsCard } from '../../core/fsrs/fsrsEngine';
import type { NavTab } from '../../App';
import { IconCards, IconSearch, IconSparkChat, IconVolume } from '../icons/Icons';
import { speakEnglish } from '../../core/phonetics/speechIO';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  cards: FsrsCard[];
  onNavigate: (tab: NavTab) => void;
  onToggleTheme: () => void;
  onCycleGlass: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  cards,
  onNavigate,
  onToggleTheme,
  onCycleGlass,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
    }
  }, [open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const actions: Array<{
      id: string;
      kind: 'Action' | 'Vocabulary';
      title: string;
      subtitle: string;
      badge: string;
      run: () => void;
    }> = [
      {
        id: 'go-dash',
        kind: 'Action',
        title: 'Mở Command Center Dashboard',
        subtitle: 'KPI 4 cột, đồng hồ 1,000 giờ & Heatmap 44 âm vị IPA',
        badge: '⌘1',
        run: () => {
          onNavigate('dashboard');
          onClose();
        },
      },
      {
        id: 'go-shad',
        kind: 'Action',
        title: 'Mở AI Phonetics & Shadowing Studio',
        subtitle: 'Sóng âm, Pitch F0 & chấm điểm từng âm vị IPA',
        badge: '⌘2',
        run: () => {
          onNavigate('shadowing');
          onClose();
        },
      },
      {
        id: 'go-tutor',
        kind: 'Action',
        title: 'Mở AI Roleplay & Live Tutor',
        subtitle: 'Hội thoại thực chiến, IELTS Part 2 & Explain My Mistake',
        badge: '⌘3',
        run: () => {
          onNavigate('tutor');
          onClose();
        },
      },
      {
        id: 'go-fsrs',
        kind: 'Action',
        title: 'Ôn tập FSRS v5 Flashcards',
        subtitle: 'Lật thẻ đa tầng Cloze & Batch Bar quản lý từ',
        badge: '⌘4',
        run: () => {
          onNavigate('fsrs');
          onClose();
        },
      },
      {
        id: 'go-reader',
        kind: 'Action',
        title: 'Mở Immersive Dual-Sub Reader',
        subtitle: 'Phụ đề song ngữ, Popover 364px & Grammar X-Ray',
        badge: '⌘5',
        run: () => {
          onNavigate('reader');
          onClose();
        },
      },
      {
        id: 'go-qwerty',
        kind: 'Action',
        title: 'Mở Qwerty Dictation & Muscle-Memory Lab',
        subtitle: 'Gõ từ vựng tốc độ cao & nghe chép chính tả',
        badge: '⌘6',
        run: () => {
          onNavigate('qwerty');
          onClose();
        },
      },
      {
        id: 'act-theme',
        kind: 'Action',
        title: 'Chuyển Dark / Light Mode',
        subtitle: 'Thay đổi giao diện Minimal Specular Liquid Glass',
        badge: 'Theme',
        run: () => {
          onToggleTheme();
          onClose();
        },
      },
      {
        id: 'act-glass',
        kind: 'Action',
        title: 'Đổi cường độ kính (Clear / Balanced / Solid)',
        subtitle: 'Điều chỉnh độ trong suốt chrome Tahoe 26',
        badge: 'Glass',
        run: () => {
          onCycleGlass();
          onClose();
        },
      },
    ];

    const matchedCards = cards
      .filter(
        (c) =>
          !q ||
          c.word.toLowerCase().includes(q) ||
          c.meaningVi.toLowerCase().includes(q) ||
          c.deck.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map((c) => ({
        id: `card-${c.id}`,
        kind: 'Vocabulary' as const,
        title: `${c.word}  ${c.ipa}`,
        subtitle: `${c.meaningVi} · ${c.deck}`,
        badge: c.cefr,
        run: () => {
          speakEnglish(c.word);
          onNavigate('fsrs');
          onClose();
        },
      }));

    const filteredActions = q
      ? actions.filter(
          (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
        )
      : actions;

    return [...matchedCards, ...filteredActions];
  }, [query, cards, onNavigate, onClose, onToggleTheme, onCycleGlass]);

  if (!open) return null;

  return (
    <div
      className="pbg"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pal">
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 14, borderBottom: '1px solid var(--line)' }}>
          <IconSearch size={15} />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIdx((i) => Math.min(items.length - 1, i + 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIdx((i) => Math.max(0, i - 1));
              }
              if (e.key === 'Enter' && items[selectedIdx]) {
                items[selectedIdx].run();
              }
            }}
            placeholder="Tra từ điển tức thì, mở phân hệ hoặc đổi giao diện..."
            style={{ borderBottom: 'none' }}
          />
          <kbd style={{ marginRight: 14 }}>ESC</kbd>
        </div>
        <div className="plist">
          {items.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--muted)' }}>
              Không tìm thấy kết quả phù hợp cho &ldquo;{query}&rdquo;
            </div>
          ) : (
            items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`pit ${idx === selectedIdx ? 'sel' : ''}`}
                onMouseEnter={() => setSelectedIdx(idx)}
                onClick={item.run}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {item.kind === 'Vocabulary' ? <IconVolume size={14} /> : item.id.includes('tutor') ? <IconSparkChat size={14} /> : <IconCards size={14} />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.subtitle}
                    </div>
                  </div>
                </div>
                <span className="tag">{item.badge}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
