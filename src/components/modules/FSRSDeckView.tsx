import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FsrsCard, FsrsRating } from '../../core/fsrs/fsrsEngine';
import {
  computeRetrievability,
  exportCardsToAnkiCsv,
  getSchedulingOptions,
} from '../../core/fsrs/fsrsEngine';
import { exportTextFile, speakEnglish, triggerHaptic } from '../../core/phonetics/speechIO';
import { playSuccessSound } from '../../core/phonetics/soundEffects';
import { WordRootGraph } from '../common/WordRootGraph';
import { IconCheck, IconDownload, IconPlus, IconVolume } from '../icons/Icons';

interface FSRSDeckViewProps {
  cards: FsrsCard[];
  desiredRetention: number;
  openAddFormNonce?: number;
  onRateCard: (cardId: string, rating: FsrsRating) => void;
  onAddCard: (input: {
    word: string;
    ipa: string;
    meaningVi: string;
    clozeSentence: string;
    deck: string;
    translationVi?: string;
    sourceTitle?: string;
  }) => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchMoveDeck: (ids: string[], deck: string) => void;
  onLaunchTutorWithWords: (words: string[]) => void;
  onShowToast: (msg: string) => void;
}

export const FSRSDeckView: React.FC<FSRSDeckViewProps> = ({
  cards,
  desiredRetention,
  openAddFormNonce = 0,
  onRateCard,
  onAddCard,
  onBatchDelete,
  onBatchMoveDeck,
  onLaunchTutorWithWords,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'review' | 'manage' | 'roots'>('review');
  const [viewType, setViewType] = useState<'list' | 'grid'>('list');
  const [revealed, setRevealed] = useState(false);
  const [accentIdx, setAccentIdx] = useState(0);
  const [filterDeck, setFilterDeck] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newWord, setNewWord] = useState('');
  const [newIpa, setNewIpa] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newCloze, setNewCloze] = useState('');
  const [newDeck, setNewDeck] = useState('Custom Mined Deck');

  useEffect(() => {
    if (openAddFormNonce > 0) {
      setShowAddForm(true);
    }
  }, [openAddFormNonce]);

  useEffect(() => {
    const activeBatch = mode === 'manage' && selectedIds.length > 0;
    document.body.classList.toggle('batch-active', activeBatch);
    return () => {
      document.body.classList.remove('batch-active');
    };
  }, [mode, selectedIds.length]);

  const decks = useMemo(() => ['All', ...Array.from(new Set(cards.map((c) => c.deck)))], [cards]);

  const dueQueue = useMemo(() => {
    const now = Date.now();
    return cards
      .filter((c) => c.state === 'new' || c.due <= now)
      .sort((a, b) => a.due - b.due);
  }, [cards]);

  const currentCard = dueQueue[0] ?? null;
  const options = useMemo(
    () => (currentCard ? getSchedulingOptions(currentCard, Date.now(), desiredRetention) : []),
    [currentCard, desiredRetention]
  );

  const handleGrade = useCallback(
    (rating: FsrsRating) => {
      if (!currentCard) return;
      onRateCard(currentCard.id, rating);
      setRevealed(false);
      setAccentIdx(0);
      if (rating >= 3) playSuccessSound();
      triggerHaptic(rating >= 3 ? 'success' : 'light');
    },
    [currentCard, onRateCard]
  );

  const keyStateRef = useRef({
    mode,
    currentCard,
    revealed,
    handleGrade,
  });
  keyStateRef.current = {
    mode,
    currentCard,
    revealed,
    handleGrade,
  };

  // Keyboard shortcuts for Review Mode: Space to flip, 1/2/3/4 to rate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { mode: activeMode, currentCard: card, revealed: isRevealed, handleGrade: grade } =
        keyStateRef.current;
      if (activeMode !== 'review' || !card) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.code === 'Space' && !isRevealed) {
        e.preventDefault();
        setRevealed(true);
        speakEnglish(card.word);
      } else if (isRevealed && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        grade(Number(e.key) as FsrsRating);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      const matchDeck = filterDeck === 'All' || c.deck === filterDeck;
      const matchQ =
        !q ||
        c.word.toLowerCase().includes(q) ||
        c.meaningVi.toLowerCase().includes(q) ||
        c.deck.toLowerCase().includes(q);
      return matchDeck && matchQ;
    });
  }, [cards, filterDeck, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const renderClozeText = (sentence: string, showAnswer: boolean) => {
    const parts = sentence.split(/(\{\{.*?\}\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const inner = part.slice(2, -2);
        return (
          <span
            key={i}
            style={{
              padding: '1px 8px',
              borderRadius: 6,
              background: showAnswer ? 'var(--green-s)' : 'var(--cyan-s)',
              color: showAnswer ? 'var(--green)' : 'var(--cyan)',
              fontWeight: 700,
              margin: '0 2px',
            }}
          >
            {showAnswer ? inner : '[ ... ]'}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim()) return;
    onAddCard({
      word: newWord.trim(),
      ipa: newIpa.trim(),
      meaningVi: newMeaning.trim(),
      clozeSentence:
        newCloze.trim() || `We should leverage {{${newWord.trim()}}} in real engineering contexts.`,
      deck: newDeck.trim() || 'Custom Mined Deck',
    });
    setNewWord('');
    setNewIpa('');
    setNewMeaning('');
    setNewCloze('');
    setShowAddForm(false);
  };

  const youglishClips = currentCard?.youglishContexts ?? [];
  const activeClip = youglishClips[accentIdx % Math.max(1, youglishClips.length)];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="seg">
          <button type="button" className={mode === 'review' ? 'on' : ''} onClick={() => setMode('review')}>
            Ôn thẻ FSRS ({dueQueue.length})
          </button>
          <button type="button" className={mode === 'manage' ? 'on' : ''} onClick={() => setMode('manage')}>
            Kho từ vựng ({cards.length})
          </button>
          <button type="button" className={mode === 'roots' ? 'on' : ''} onClick={() => setMode('roots')}>
            Bản đồ Gốc từ Membean
          </button>
        </div>

        <button type="button" className="gb" onClick={() => setShowAddForm((v) => !v)}>
          <IconPlus size={14} />
          <span>Tạo thẻ mới</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateCard} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontWeight: 650, fontSize: 13 }}>Thêm thẻ từ vựng mới vào FSRS v5</div>
          <div className="grid2">
            <input
              id="fsrs-new-word"
              name="newWord"
              aria-label="Từ vựng mới"
              className="input-field"
              required
              placeholder="Từ vựng (VD: ephemeral)"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
            />
            <input
              id="fsrs-new-ipa"
              name="newIpa"
              aria-label="Phiên âm IPA"
              className="input-field"
              placeholder="IPA (tự sinh nếu bỏ trống)"
              value={newIpa}
              onChange={(e) => setNewIpa(e.target.value)}
            />
            <input
              id="fsrs-new-meaning"
              name="newMeaning"
              aria-label="Nghĩa tiếng Việt"
              className="input-field"
              required
              placeholder="Nghĩa tiếng Việt theo ngữ cảnh"
              value={newMeaning}
              onChange={(e) => setNewMeaning(e.target.value)}
            />
            <input
              id="fsrs-new-deck"
              name="newDeck"
              aria-label="Tên bộ thẻ (Deck)"
              className="input-field"
              placeholder="Bộ thẻ (Deck)"
              value={newDeck}
              onChange={(e) => setNewDeck(e.target.value)}
            />
          </div>
          <input
            id="fsrs-new-cloze"
            name="newCloze"
            aria-label="Câu ngữ cảnh Cloze"
            className="input-field"
            placeholder="Câu ngữ cảnh Cloze (VD: Containers are {{ephemeral}} workloads.)"
            value={newCloze}
            onChange={(e) => setNewCloze(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="gb" onClick={() => setShowAddForm(false)}>Hủy</button>
            <button type="submit" className="pb">Lưu vào FSRS Deck</button>
          </div>
        </form>
      )}

      {mode === 'roots' ? (
        <WordRootGraph
          initialRootId={currentCard?.rootId}
          onAddDerivativeToFsrs={(deriv, rootLabel) =>
            onAddCard({
              word: deriv.word,
              ipa: deriv.ipa,
              meaningVi: `${deriv.meaningVi} (Gốc ${rootLabel})`,
              clozeSentence: deriv.example.replace(new RegExp(`\\b${deriv.word}\\b`, 'i'), `{{${deriv.word}}}`),
              deck: 'Membean Word Roots',
            })
          }
        />
      ) : mode === 'review' ? (
        currentCard ? (
          <div className="panel" style={{ maxWidth: 800, width: '100%', margin: '0 auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span className="tag">{currentCard.deck}</span>
                <span className="tag" style={{ color: 'var(--cyan)', background: 'var(--cyan-s)' }}>{currentCard.cefr}</span>
                <span className="tag">S={currentCard.stability.toFixed(1)}d · D={currentCard.difficulty.toFixed(1)}</span>
              </div>
              <button
                type="button"
                className="gb sm"
                onClick={() => speakEnglish(currentCard.clozeSentence.replace(/\{\{|\}\}/g, ''))}
              >
                <IconVolume size={13} />
                <span>Đọc cả câu</span>
              </button>
            </div>

            <div
              style={{
                padding: '22px 18px',
                borderRadius: 14,
                background: 'var(--raised)',
                border: '1px solid var(--line)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.55 }}>
                {renderClozeText(currentCard.clozeSentence, revealed)}
              </div>
              {revealed && (
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10 }}>
                  {currentCard.translationVi}
                </div>
              )}
            </div>

            {!revealed ? (
              <button
                type="button"
                className="pb"
                style={{ height: 38, width: '100%' }}
                onClick={() => {
                  setRevealed(true);
                  speakEnglish(currentCard.word);
                }}
              >
                Lật thẻ (<kbd style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }}>Space</kbd>) xem Nghĩa, YouGlish &amp; Mnemonic
              </button>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 22, fontWeight: 700 }}>{currentCard.word}</span>
                    <span className="mono" style={{ color: 'var(--cyan)', fontSize: 14 }}>{currentCard.ipa}</span>
                    <span className="tag">{currentCard.pos}</span>
                    <button
                      type="button"
                      className="ib sm"
                      aria-label={`Nghe phát âm từ ${currentCard.word}`}
                      onClick={() => speakEnglish(currentCard.word)}
                    >
                      <IconVolume size={14} />
                    </button>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 600 }}>{currentCard.meaningVi}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{currentCard.meaningEn}</div>

                  {/* YouGlish Multi-Accent Context Switcher */}
                  {youglishClips.length > 0 && activeClip && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: '1px solid var(--line)',
                        background: 'var(--raised)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 650, color: 'var(--cyan)' }}>
                          YouGlish Multi-Accent Context ({activeClip.speaker} · {activeClip.timestamp})
                        </span>
                        <div className="seg">
                          {youglishClips.map((clip, i) => (
                            <button
                              key={clip.accent}
                              type="button"
                              className={i === accentIdx ? 'on' : ''}
                              onClick={() => {
                                setAccentIdx(i);
                                speakEnglish(clip.sentence, {
                                  accent: clip.accent === 'UK' ? 'UK RP' : 'US General',
                                });
                              }}
                            >
                              {clip.accent}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 12.5 }}>&ldquo;{activeClip.sentence}&rdquo;</span>
                        <button
                          type="button"
                          className="ib sm"
                          aria-label={`Nghe ví dụ giọng ${activeClip.accent}`}
                          onClick={() =>
                            speakEnglish(activeClip.sentence, {
                              accent: activeClip.accent === 'UK' ? 'UK RP' : 'US General',
                            })
                          }
                        >
                          <IconVolume size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="u-box">
                    <div className="u-col">
                      <div style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 4 }}>Collocations phổ biến</div>
                      <div style={{ fontSize: 12, fontWeight: 560 }}>{currentCard.collocations.join(' · ')}</div>
                    </div>
                    <div className="u-col">
                      <div style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 4 }}>Word Family</div>
                      <div style={{ fontSize: 12, fontWeight: 560 }}>{currentCard.wordFamily.join(' · ')}</div>
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--raised)', border: '1px solid var(--line)', fontSize: 12 }}>
                    <div><b>Sắc thái (Nuance):</b> {currentCard.nuance}</div>
                    <div style={{ marginTop: 4, color: 'var(--cyan)' }}><b>Mẹo nhớ (Mnemonic):</b> {currentCard.mnemonic}</div>
                  </div>
                </div>

                {/* 4 FSRS Rating Buttons with 1/2/3/4 shortcuts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                  {options.map((opt) => {
                    const color =
                      opt.rating === 1
                        ? 'var(--rose)'
                        : opt.rating === 2
                          ? 'var(--amber)'
                          : opt.rating === 3
                            ? 'var(--green)'
                            : 'var(--cyan)';
                    return (
                      <button
                        key={opt.rating}
                        type="button"
                        className="gb"
                        style={{
                          height: 48,
                          flexDirection: 'column',
                          justifyContent: 'center',
                          gap: 1,
                          borderColor: color,
                          color,
                        }}
                        onClick={() => handleGrade(opt.rating)}
                      >
                        <span style={{ fontWeight: 700 }}>
                          {opt.label} <kbd style={{ fontSize: 9.5 }}>{opt.rating}</kbd>
                        </span>
                        <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{opt.intervalLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="panel" style={{ padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>
              Bạn đã hoàn thành toàn bộ {cards.length} thẻ FSRS đến hạn hôm nay!
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>
              Chuyển sang tab &ldquo;Bản đồ Gốc từ Membean&rdquo; để nạp thêm từ C1/C2 hoặc đọc báo Engoo để đào thêm câu mới.
            </div>
          </div>
        )
      ) : (
        <div>
          <div className="filters" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {decks.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`fp ${filterDeck === d ? 'on' : ''}`}
                  onClick={() => setFilterDeck(d)}
                >
                  {d}
                </button>
              ))}
              <input
                id="fsrs-deck-search"
                name="fsrsSearch"
                aria-label="Lọc từ vựng trong kho FSRS"
                className="f-q"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Lọc từ, nghĩa..."
              />
            </div>

            <div className="seg">
              <button type="button" className={viewType === 'list' ? 'on' : ''} onClick={() => setViewType('list')}>Danh sách</button>
              <button type="button" className={viewType === 'grid' ? 'on' : ''} onClick={() => setViewType('grid')}>Lưới 2 cột</button>
            </div>
          </div>

          {viewType === 'list' ? (
            <div className="list">
              <div className="lh">
                <button
                  type="button"
                  className={`chk ${selectedIds.length === filteredCards.length && filteredCards.length > 0 ? 'on' : ''}`}
                  onClick={() =>
                    setSelectedIds((prev) =>
                      prev.length === filteredCards.length ? [] : filteredCards.map((c) => c.id)
                    )
                  }
                  aria-label="Chọn tất cả"
                >
                  {selectedIds.length === filteredCards.length && filteredCards.length > 0 && <IconCheck size={11} />}
                </button>
                <span>Từ vựng &amp; Nghĩa</span>
                <span className="col-hide-sm">Bộ thẻ</span>
                <span>Trạng thái</span>
                <span className="col-hide-sm">Nhớ R(t,S)</span>
                <span style={{ textAlign: 'right' }}>Thao tác</span>
              </div>

              {filteredCards.map((c) => {
                const checked = selectedIds.includes(c.id);
                const retPct =
                  c.state === 'new'
                    ? 'New'
                    : `${Math.round(
                        computeRetrievability(
                          c.lastReview ? (Date.now() - c.lastReview) / 86_400_000 : 0,
                          c.stability
                        ) * 100
                      )}%`;
                return (
                  <div key={c.id} className="row">
                    <button type="button" className={`chk ${checked ? 'on' : ''}`} onClick={() => toggleSelect(c.id)} aria-label={`Chọn ${c.word}`}>
                      {checked && <IconCheck size={11} />}
                    </button>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 620 }}>
                        {c.word} <span className="mono" style={{ fontSize: 11, color: 'var(--cyan)' }}>{c.ipa}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.meaningVi}
                      </div>
                    </div>
                    <span className="col-hide-sm" style={{ fontSize: 11.5, color: 'var(--muted)' }}>{c.deck}</span>
                    <div><span className="tag">{c.cefr} · {c.state}</span></div>
                    <div className="col-hide-sm mono" style={{ fontSize: 12 }}>{retPct}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        type="button"
                        className="ib sm"
                        aria-label={`Nghe phát âm ${c.word}`}
                        onClick={() => speakEnglish(c.word)}
                        title="Nghe phát âm"
                      >
                        <IconVolume size={14} />
                      </button>
                      <button
                        type="button"
                        className="gb sm"
                        onClick={() => {
                          onRateCard(c.id, 3);
                          onShowToast(`Đã ôn nhanh "${c.word}" (Good)`);
                        }}
                      >
                        Ôn Good
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="cards">
              {filteredCards.map((c) => {
                const checked = selectedIds.includes(c.id);
                return (
                  <div key={c.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          className={`chk ${checked ? 'on' : ''}`}
                          aria-label={`Chọn ${c.word}`}
                          onClick={() => toggleSelect(c.id)}
                        >
                          {checked && <IconCheck size={11} />}
                        </button>
                        <b style={{ fontSize: 14 }}>{c.word}</b>
                        <span className="mono" style={{ fontSize: 11.5, color: 'var(--cyan)' }}>{c.ipa}</span>
                      </div>
                      <span className="tag">{c.cefr}</span>
                    </div>
                    <div style={{ fontSize: 12.5 }}>{c.meaningVi}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Collocations: {c.collocations.join(' · ')}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: 'var(--dim)' }}>S = {c.stability.toFixed(1)}d · {c.deck}</span>
                      <button
                        type="button"
                        className="ib sm"
                        aria-label={`Nghe phát âm ${c.word}`}
                        onClick={() => speakEnglish(c.word)}
                      >
                        <IconVolume size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Batch Bar (99px pill) */}
          <div className={`batch-bar ${selectedIds.length > 0 ? 'on' : ''}`}>
            <span style={{ fontWeight: 650, fontSize: 12 }}>Đã chọn {selectedIds.length} từ</span>
            <button
              type="button"
              className="gb sm"
              onClick={() => {
                const chosen = cards.filter((c) => selectedIds.includes(c.id));
                const csv = exportCardsToAnkiCsv(chosen);
                exportTextFile('T-English-Selected.csv', csv, 'text/csv;charset=utf-8;');
                onShowToast(`Đã xuất ${chosen.length} từ sang Anki CSV`);
              }}
            >
              <IconDownload size={12} />
              <span>Xuất Anki</span>
            </button>
            <button
              type="button"
              className="gb sm"
              onClick={() => {
                onBatchMoveDeck(selectedIds, 'Priority Focus Deck');
                setSelectedIds([]);
              }}
            >
              Gộp bộ Priority
            </button>
            <button
              type="button"
              className="pb sm"
              onClick={() => {
                const words = cards.filter((c) => selectedIds.includes(c.id)).map((c) => c.word);
                onLaunchTutorWithWords(words);
              }}
            >
              Luyện nói AI với {selectedIds.length} từ này
            </button>
            <button
              type="button"
              className="gb sm"
              style={{ color: 'var(--rose)' }}
              onClick={() => {
                onBatchDelete(selectedIds);
                setSelectedIds([]);
              }}
            >
              Xóa
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
