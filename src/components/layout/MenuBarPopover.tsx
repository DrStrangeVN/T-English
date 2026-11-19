import React, { useMemo, useState } from 'react';
import type { FsrsCard, FsrsRating } from '../../core/fsrs/fsrsEngine';
import { getSchedulingOptions } from '../../core/fsrs/fsrsEngine';
import { speakEnglish } from '../../core/phonetics/speechIO';
import { IconCards, IconLogo, IconSearch, IconVolume } from '../icons/Icons';

interface MenuBarPopoverProps {
  cards: FsrsCard[];
  dailyMinutesDone: number;
  dailyGoalMinutes: number;
  streakDays: number;
  onRateCard: (cardId: string, rating: FsrsRating) => void;
  onOpenFullApp?: () => void;
}

export const MenuBarPopover: React.FC<MenuBarPopoverProps> = ({
  cards,
  dailyMinutesDone,
  dailyGoalMinutes,
  streakDays,
  onRateCard,
  onOpenFullApp,
}) => {
  const [tab, setTab] = useState<'flash' | 'lookup'>('flash');
  const [query, setQuery] = useState('');
  const [revealed, setRevealed] = useState(false);

  const dueCards = useMemo(
    () => cards.filter((c) => c.state === 'new' || c.due <= Date.now()),
    [cards]
  );
  const currentCard = dueCards[0] ?? cards[0];
  const options = useMemo(
    () => (currentCard ? getSchedulingOptions(currentCard) : []),
    [currentCard]
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards.slice(0, 4);
    return cards.filter(
      (c) => c.word.toLowerCase().includes(q) || c.meaningVi.toLowerCase().includes(q)
    );
  }, [query, cards]);

  const pct = Math.min(100, Math.round((dailyMinutesDone / Math.max(1, dailyGoalMinutes)) * 100));

  return (
    <div className="menubar-shell">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="logo" style={{ width: 24, height: 24, borderRadius: 7 }}>
            <IconLogo size={13} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>T-English Quick Bar</div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>
              {streakDays}d streak · {dailyMinutesDone}/{dailyGoalMinutes}m hôm nay
            </div>
          </div>
        </div>
        {onOpenFullApp && (
          <button type="button" className="gb sm" onClick={onOpenFullApp}>
            Mở App chính
          </button>
        )}
      </div>

      <div className="bar" style={{ marginTop: 0 }}>
        <div className="b-cyan" style={{ width: `${pct}%` }} />
      </div>

      <div className="seg" style={{ width: '100%', justifyContent: 'space-between' }}>
        <button
          type="button"
          className={tab === 'flash' ? 'on' : ''}
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => setTab('flash')}
        >
          <IconCards size={13} />
          <span>Ôn nhanh ({dueCards.length})</span>
        </button>
        <button
          type="button"
          className={tab === 'lookup' ? 'on' : ''}
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => setTab('lookup')}
        >
          <IconSearch size={13} />
          <span>Tra từ nhanh</span>
        </button>
      </div>

      {tab === 'flash' && currentCard ? (
        <div
          style={{
            borderRadius: 12,
            border: '1px solid var(--line)',
            background: 'var(--raised)',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="tag">{currentCard.cefr} · {currentCard.deck}</span>
            <button
              type="button"
              className="ib sm"
              title="Phát âm"
              onClick={() => speakEnglish(currentCard.word)}
            >
              <IconVolume size={14} />
            </button>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{currentCard.word}</div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--cyan)' }}>
              {currentCard.ipa} · {currentCard.pos}
            </div>
          </div>

          {revealed ? (
            <>
              <div style={{ fontSize: 12.5, fontWeight: 560 }}>{currentCard.meaningVi}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                {currentCard.clozeSentence.replace(/\{\{|\}\}/g, '')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginTop: 4 }}>
                {options.map((opt) => (
                  <button
                    key={opt.rating}
                    type="button"
                    className="gb sm"
                    style={{ justifyContent: 'center', flexDirection: 'column', height: 38, gap: 1 }}
                    onClick={() => {
                      onRateCard(currentCard.id, opt.rating);
                      setRevealed(false);
                    }}
                  >
                    <span style={{ fontWeight: 650 }}>{opt.label}</span>
                    <span style={{ fontSize: 9.5, color: 'var(--muted)' }}>{opt.intervalLabel}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <button
              type="button"
              className="pb"
              style={{ width: '100%', marginTop: 4 }}
              onClick={() => {
                setRevealed(true);
                speakEnglish(currentCard.word);
              }}
            >
              Hiện đáp án &amp; Chấm FSRS
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            id="menubar-lookup-input"
            name="menubarLookup"
            aria-label="Tra từ tiếng Anh hoặc nghĩa tiếng Việt"
            className="input-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Gõ từ tiếng Anh hoặc nghĩa tiếng Việt..."
            autoFocus
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 220, overflowY: 'auto' }}>
            {searchResults.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  background: 'var(--raised)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 620, fontSize: 12.5 }}>
                    {c.word} <span className="mono" style={{ color: 'var(--cyan)', fontSize: 11 }}>{c.ipa}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.meaningVi}
                  </div>
                </div>
                <button
                  type="button"
                  className="ib sm"
                  aria-label={`Nghe phát âm ${c.word}`}
                  onClick={() => speakEnglish(c.word)}
                >
                  <IconVolume size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
