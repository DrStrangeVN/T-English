import React, { useEffect, useMemo, useState } from 'react';
import type { FsrsCard } from '../../core/fsrs/fsrsEngine';
import type { NavTab } from '../../App';
import { searchLudwigCorpus } from '../../data/ludwigCorpus';
import { IconCards, IconCurriculum, IconPen, IconSearch, IconSparkChat, IconVolume } from '../icons/Icons';
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
      kind: 'Action' | 'Vocabulary' | 'Ludwig';
      title: string;
      subtitle: string;
      badge: string;
      run: () => void;
    }> = [
      {
        id: 'go-dash',
        kind: 'Action',
        title: 'Mở Command Center Dashboard',
        subtitle: 'KPI 4 cột, Heatmap 365 ngày & Ma trận 44 âm vị IPA',
        badge: '⌘1',
        run: () => {
          onNavigate('dashboard');
          onClose();
        },
      },
      {
        id: 'go-curr',
        kind: 'Action',
        title: 'Mở Lộ trình CEFR A1–C2 & Kiểm tra Xếp lớp',
        subtitle: 'Placement Test 12 câu & Grammar Blueprint theo cấp độ',
        badge: '⌘2',
        run: () => {
          onNavigate('curriculum');
          onClose();
        },
      },
      {
        id: 'go-shad',
        kind: 'Action',
        title: 'Mở AI Phonetics, Minimal Pairs & Shadowing',
        subtitle: 'Sơ đồ khoang miệng SVG, Pitch F0 & Connected Speech',
        badge: '⌘3',
        run: () => {
          onNavigate('shadowing');
          onClose();
        },
      },
      {
        id: 'go-tutor',
        kind: 'Action',
        title: 'Mở AI Roleplay (3-Mission & Live Call)',
        subtitle: 'Hội thoại thực chiến, IELTS Full Mock & Explain My Mistake',
        badge: '⌘4',
        run: () => {
          onNavigate('tutor');
          onClose();
        },
      },
      {
        id: 'go-writing',
        kind: 'Action',
        title: 'Mở IELTS Writing & Ludwig Context Studio',
        subtitle: 'Chấm điểm 4 tiêu chí IELTS, In-Line Diff & Band 6.5 vs 8.5',
        badge: '⌘5',
        run: () => {
          onNavigate('writing');
          onClose();
        },
      },
      {
        id: 'go-fsrs',
        kind: 'Action',
        title: 'Ôn tập FSRS v5 Flashcards & Bản đồ Gốc từ Membean',
        subtitle: 'Lật thẻ Cloze kèm YouGlish US/UK/AUS & Batch Bar',
        badge: '⌘6',
        run: () => {
          onNavigate('fsrs');
          onClose();
        },
      },
      {
        id: 'go-reader',
        kind: 'Action',
        title: 'Mở Engoo 5-Step Dual-Sub Reader',
        subtitle: 'Đọc báo 5 bước, Popover 364px & Grammar X-Ray',
        badge: '⌘7',
        run: () => {
          onNavigate('reader');
          onClose();
        },
      },
      {
        id: 'go-qwerty',
        kind: 'Action',
        title: 'Mở Monkeytype Qwerty & DailyDictation Lab',
        subtitle: 'Gõ từ vựng Zen Mode, âm thanh phím cơ & nghe chép câu',
        badge: '⌘8',
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

    const ludwigMatches = q
      ? searchLudwigCorpus(q)
          .slice(0, 4)
          .map((l) => ({
            id: `lud-${l.id}`,
            kind: 'Ludwig' as const,
            title: `${l.preferredPhrase} (${l.preferredFreqPct}% chuẩn)`,
            subtitle: `${l.queryPattern} — ${l.explanationVi}`,
            badge: 'Ludwig',
            run: () => {
              onNavigate('writing');
              onClose();
            },
          }))
      : [];

    const matchedCards = cards
      .filter(
        (c) =>
          !q ||
          c.word.toLowerCase().includes(q) ||
          c.meaningVi.toLowerCase().includes(q) ||
          c.deck.toLowerCase().includes(q)
      )
      .slice(0, 5)
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

    return [...ludwigMatches, ...matchedCards, ...filteredActions];
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
            placeholder="Tra từ điển, tìm mẫu câu Ludwig (VD: mitigate * risk, depend on vs depend of)..."
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
                  {item.kind === 'Vocabulary' ? (
                    <IconVolume size={14} />
                  ) : item.kind === 'Ludwig' ? (
                    <IconPen size={14} />
                  ) : item.id.includes('curr') ? (
                    <IconCurriculum size={14} />
                  ) : item.id.includes('tutor') ? (
                    <IconSparkChat size={14} />
                  ) : (
                    <IconCards size={14} />
                  )}
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
