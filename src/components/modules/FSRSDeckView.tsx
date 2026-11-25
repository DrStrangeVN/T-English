import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FsrsCard, FsrsRating } from '../../core/fsrs/fsrsEngine';
import {
  computeRetrievability,
  exportCardsToAnkiCsv,
  getSchedulingOptions,
} from '../../core/fsrs/fsrsEngine';
import { buildVocabQuizChoices } from '../../core/fsrs/vocabNotifier';
import {
  exportTextFile,
  speakBilingual,
  speakEnglish,
  speakVietnamese,
  triggerHaptic,
} from '../../core/phonetics/speechIO';
import { playErrorSound, playSuccessSound } from '../../core/phonetics/soundEffects';
import type {
  VocabNotificationConfig,
  VocabNotificationLogItem,
  VocabNotifyInterval,
  VocabNotifySource,
  VocabNotifyStyle,
} from '../../core/storage/db';
import { WordRootGraph } from '../common/WordRootGraph';
import {
  IconBellRing,
  IconCheck,
  IconDownload,
  IconEdit,
  IconHeadphones,
  IconPlus,
  IconUndo,
  IconVolume,
  IconZap,
} from '../icons/Icons';

interface FSRSDeckViewProps {
  cards: FsrsCard[];
  desiredRetention: number;
  openAddFormNonce?: number;
  canUndo?: boolean;
  vocabNotifications?: VocabNotificationConfig;
  notificationHistory?: VocabNotificationLogItem[];
  onUpdateVocabNotifications?: (patch: Partial<VocabNotificationConfig>) => void;
  onTriggerVocabNotifyNow?: () => void;
  onUndoLastRating?: () => void;
  onEditCard?: (
    cardId: string,
    patch: Partial<Pick<FsrsCard, 'word' | 'ipa' | 'meaningVi' | 'clozeSentence' | 'deck' | 'mnemonic'>>
  ) => void;
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
  canUndo = false,
  vocabNotifications,
  notificationHistory = [],
  onUpdateVocabNotifications,
  onTriggerVocabNotifyNow,
  onUndoLastRating,
  onEditCard,
  onRateCard,
  onAddCard,
  onBatchDelete,
  onBatchMoveDeck,
  onLaunchTutorWithWords,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'review' | 'quiz' | 'notify' | 'manage' | 'roots'>('review');
  const [viewType, setViewType] = useState<'list' | 'grid'>('list');
  const [revealed, setRevealed] = useState(false);
  const [typingRecall, setTypingRecall] = useState(false);
  const [audioFirst, setAudioFirst] = useState(false);
  const [recallInput, setRecallInput] = useState('');
  const [accentIdx, setAccentIdx] = useState(0);
  const [filterDeck, setFilterDeck] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editMeaning, setEditMeaning] = useState('');
  const [editIpa, setEditIpa] = useState('');
  const [editCloze, setEditCloze] = useState('');

  // Quiz Sprint state (Drops / Quizlet active micro-sprint)
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizPicked, setQuizPicked] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStreak, setQuizStreak] = useState(0);

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

  const quizPool = useMemo(() => {
    const base = dueQueue.length >= 6 ? dueQueue : cards;
    return base.slice(0, 10);
  }, [dueQueue, cards]);

  const activeQuizCard = quizPool[quizIdx % Math.max(1, quizPool.length)] ?? null;
  const quizChoices = useMemo(
    () => (activeQuizCard ? buildVocabQuizChoices(activeQuizCard, cards) : []),
    [activeQuizCard, cards]
  );

  const handleGrade = useCallback(
    (rating: FsrsRating) => {
      if (!currentCard) return;
      onRateCard(currentCard.id, rating);
      setRevealed(false);
      setRecallInput('');
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
              padding: '2px 9px',
              borderRadius: 7,
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
        newCloze.trim() || `We should use {{${newWord.trim()}}} naturally in real contexts.`,
      deck: newDeck.trim() || 'Custom Mined Deck',
    });
    setNewWord('');
    setNewIpa('');
    setNewMeaning('');
    setNewCloze('');
    setShowAddForm(false);
  };

  const startEditCard = (card: FsrsCard) => {
    setEditingCardId(card.id);
    setEditIpa(card.ipa);
    setEditMeaning(card.meaningVi);
    setEditCloze(card.clozeSentence);
  };

  const saveEditCard = () => {
    if (!editingCardId || !onEditCard) return;
    onEditCard(editingCardId, {
      ipa: editIpa.trim(),
      meaningVi: editMeaning.trim(),
      clozeSentence: editCloze.trim(),
    });
    setEditingCardId(null);
  };

  const handleRequestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      onShowToast('Trên ứng dụng macOS, thông báo từ vựng hiện trực tiếp qua Liquid Glass Desktop HUD.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      onShowToast(
        perm === 'granted'
          ? 'Đã bật quyền Thông báo trình duyệt thành công!'
          : 'Trình duyệt chưa cấp quyền — T-English sẽ dùng thẻ Glass Popup nổi trong ứng dụng.'
      );
    } catch {
      onShowToast('Đang dùng thẻ Glass Popup nổi trực tiếp trong ứng dụng.');
    }
  };

  const youglishClips = currentCard?.youglishContexts ?? [];
  const activeClip = youglishClips[accentIdx % Math.max(1, youglishClips.length)];
  const recallMatched =
    currentCard && recallInput.trim().toLowerCase() === currentCard.word.toLowerCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Clean Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="seg" style={{ flexWrap: 'wrap' }}>
          <button type="button" className={mode === 'review' ? 'on' : ''} onClick={() => setMode('review')}>
            Ôn thẻ FSRS ({dueQueue.length})
          </button>
          <button type="button" className={mode === 'quiz' ? 'on' : ''} onClick={() => setMode('quiz')}>
            <IconZap size={12} />
            <span>Quiz Sprint</span>
          </button>
          <button type="button" className={mode === 'notify' ? 'on' : ''} onClick={() => setMode('notify')}>
            <IconBellRing size={12} />
            <span>Thông báo từ vựng</span>
          </button>
          <button type="button" className={mode === 'manage' ? 'on' : ''} onClick={() => setMode('manage')}>
            Kho từ ({cards.length})
          </button>
          <button type="button" className={mode === 'roots' ? 'on' : ''} onClick={() => setMode('roots')}>
            Gốc từ Membean
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {canUndo && onUndoLastRating && (
            <button type="button" className="gb sm" onClick={onUndoLastRating} title="Hoàn tác lượt chấm vừa rồi">
              <IconUndo size={13} />
              <span>Hoàn tác</span>
            </button>
          )}
          <button type="button" className="gb" onClick={() => setShowAddForm((v) => !v)}>
            <IconPlus size={14} />
            <span>Tạo thẻ mới</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateCard} className="bento-card" style={{ gap: 10 }}>
          <div style={{ fontWeight: 650, fontSize: 14 }}>Thêm thẻ từ vựng mới vào FSRS v5</div>
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
              placeholder="IPA (tự sinh chuẩn nếu bỏ trống)"
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

      {editingCardId && (
        <div className="bento-card" style={{ gap: 10, borderColor: 'var(--cyan)' }}>
          <div style={{ fontWeight: 650, fontSize: 13.5 }}>Chỉnh sửa nhanh nội dung thẻ</div>
          <div className="grid2">
            <input
              className="input-field"
              aria-label="Chỉnh sửa IPA"
              value={editIpa}
              onChange={(e) => setEditIpa(e.target.value)}
              placeholder="IPA"
            />
            <input
              className="input-field"
              aria-label="Chỉnh sửa nghĩa tiếng Việt"
              value={editMeaning}
              onChange={(e) => setEditMeaning(e.target.value)}
              placeholder="Nghĩa tiếng Việt"
            />
          </div>
          <input
            className="input-field"
            aria-label="Chỉnh sửa câu ngữ cảnh Cloze"
            value={editCloze}
            onChange={(e) => setEditCloze(e.target.value)}
            placeholder="Câu ngữ cảnh Cloze"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="gb sm" onClick={() => setEditingCardId(null)}>Hủy</button>
            <button type="button" className="pb sm" onClick={saveEditCard}>Lưu thay đổi</button>
          </div>
        </div>
      )}

      {/* MODE 1: FSRS REVIEW */}
      {mode === 'review' ? (
        currentCard ? (
          <div className="bento-card-hero" style={{ maxWidth: 820, width: '100%', margin: '0 auto', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span className="pill-stat cyan">{currentCard.cefr}</span>
                <span className="tag">{currentCard.deck}</span>
                <span className="tag">S={currentCard.stability.toFixed(1)}d · D={currentCard.difficulty.toFixed(1)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`gb sm ${typingRecall ? 'hl' : ''}`}
                  onClick={() => setTypingRecall((v) => !v)}
                >
                  Gõ nhớ từ
                </button>
                <button
                  type="button"
                  className={`gb sm ${audioFirst ? 'hl' : ''}`}
                  onClick={() => setAudioFirst((v) => !v)}
                >
                  Nghe trước
                </button>
                <button
                  type="button"
                  className="gb sm"
                  onClick={() => speakEnglish(currentCard.clozeSentence.replace(/\{\{|\}\}/g, ''))}
                >
                  <IconVolume size={13} />
                  <span>Đọc câu</span>
                </button>
                <button
                  type="button"
                  className="gb sm"
                  onClick={() =>
                    speakBilingual(
                      currentCard.clozeSentence.replace(/\{\{|\}\}/g, ''),
                      currentCard.translationVi || currentCard.meaningVi
                    )
                  }
                >
                  <IconHeadphones size={13} />
                  <span>Song ngữ</span>
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '26px 20px',
                borderRadius: 16,
                background: 'var(--raised)',
                border: '1px solid var(--line)',
                textAlign: 'center',
              }}
            >
              {audioFirst && !revealed ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                    Chế độ Luyện Nghe Trước — nghe âm thanh rồi đoán từ &amp; câu ngữ cảnh
                  </div>
                  <button
                    type="button"
                    className="pb"
                    onClick={() => speakEnglish(currentCard.clozeSentence.replace(/\{\{|\}\}/g, ''))}
                  >
                    <IconVolume size={15} />
                    <span>Phát âm câu mẫu</span>
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 19, fontWeight: 620, lineHeight: 1.6 }}>
                  {renderClozeText(currentCard.clozeSentence, revealed)}
                </div>
              )}

              {typingRecall && !revealed && (
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <input
                    className="input-field mono"
                    aria-label="Gõ từ còn thiếu"
                    style={{
                      width: 260,
                      textAlign: 'center',
                      borderColor: recallMatched ? 'var(--green)' : undefined,
                    }}
                    placeholder="Gõ từ cần điền vào chỗ trống..."
                    value={recallInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRecallInput(v);
                      if (v.trim().toLowerCase() === currentCard.word.toLowerCase()) {
                        playSuccessSound();
                        setRevealed(true);
                        speakEnglish(currentCard.word);
                      }
                    }}
                  />
                </div>
              )}

              {revealed && (
                <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 10 }}>
                  {currentCard.translationVi}
                </div>
              )}
            </div>

            {!revealed ? (
              <button
                type="button"
                className="pb"
                style={{ height: 40, width: '100%' }}
                onClick={() => {
                  setRevealed(true);
                  speakEnglish(currentCard.word);
                }}
              >
                Lật thẻ (<kbd style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }}>Space</kbd>) xem Nghĩa, YouGlish &amp; Mẹo nhớ
              </button>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 24, fontWeight: 740 }}>{currentCard.word}</span>
                      <span className="mono" style={{ color: 'var(--cyan)', fontSize: 14 }}>{currentCard.ipa}</span>
                      <span className="tag">{currentCard.pos}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="ib sm"
                        aria-label={`Nghe phát âm từ ${currentCard.word}`}
                        onClick={() => speakEnglish(currentCard.word)}
                      >
                        <IconVolume size={14} />
                      </button>
                      <button
                        type="button"
                        className="gb sm"
                        onClick={() => speakVietnamese(currentCard.meaningVi)}
                      >
                        Nghe nghĩa (VieNeu)
                      </button>
                      {onEditCard && (
                        <button
                          type="button"
                          className="ib sm"
                          aria-label="Chỉnh sửa thẻ"
                          title="Chỉnh sửa nội dung thẻ"
                          onClick={() => startEditCard(currentCard)}
                        >
                          <IconEdit size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 640 }}>{currentCard.meaningVi}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{currentCard.meaningEn}</div>

                  {youglishClips.length > 0 && activeClip && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 14,
                        border: '1px solid var(--line)',
                        background: 'var(--raised)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 650, color: 'var(--cyan)' }}>
                          Multi-Accent Context ({activeClip.speaker} · {activeClip.timestamp})
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
                                  accent: clip.accent === 'UK' ? 'UK RP' : clip.accent === 'AUS' ? 'AUS' : 'US General',
                                });
                              }}
                            >
                              {clip.accent}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 13 }}>&ldquo;{activeClip.sentence}&rdquo;</span>
                        <button
                          type="button"
                          className="ib sm"
                          aria-label={`Nghe ví dụ giọng ${activeClip.accent}`}
                          onClick={() =>
                            speakEnglish(activeClip.sentence, {
                              accent: activeClip.accent === 'UK' ? 'UK RP' : activeClip.accent === 'AUS' ? 'AUS' : 'US General',
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
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Collocations phổ biến</div>
                      <div style={{ fontSize: 12.5, fontWeight: 560 }}>{currentCard.collocations.join(' · ')}</div>
                    </div>
                    <div className="u-col">
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Word Family</div>
                      <div style={{ fontSize: 12.5, fontWeight: 560 }}>{currentCard.wordFamily.join(' · ')}</div>
                    </div>
                  </div>

                  <div style={{ padding: '11px 14px', borderRadius: 12, background: 'var(--raised)', border: '1px solid var(--line)', fontSize: 12.5, lineHeight: 1.5 }}>
                    <div><b>Sắc thái (Nuance):</b> {currentCard.nuance}</div>
                    <div style={{ marginTop: 4, color: 'var(--cyan)' }}><b>Mẹo nhớ (Mnemonic):</b> {currentCard.mnemonic}</div>
                  </div>
                </div>

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
                          height: 50,
                          flexDirection: 'column',
                          justifyContent: 'center',
                          gap: 2,
                          borderColor: color,
                          color,
                        }}
                        onClick={() => handleGrade(opt.rating)}
                      >
                        <span style={{ fontWeight: 700 }}>
                          {opt.label} <kbd style={{ fontSize: 10 }}>{opt.rating}</kbd>
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{opt.intervalLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bento-card" style={{ padding: 32, textAlign: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--green)' }}>
              Bạn đã hoàn thành toàn bộ {cards.length} thẻ FSRS đến hạn hôm nay!
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', maxWidth: '52ch' }}>
              Chuyển sang <b>Quiz Sprint</b> để rèn phản xạ 4 đáp án, hoặc bật <b>Thông báo từ vựng</b> để ôn rải đều trong ngày.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button type="button" className="pb" onClick={() => setMode('quiz')}>Chơi Quiz Sprint</button>
              <button type="button" className="gb" onClick={() => setMode('notify')}>Cấu hình Thông báo từ vựng</button>
            </div>
          </div>
        )
      ) : mode === 'quiz' ? (
        /* MODE 2: ACTIVE VOCAB QUIZ SPRINT (Drops / Quizlet Learn style) */
        activeQuizCard ? (
          <div className="bento-card-hero" style={{ maxWidth: 760, width: '100%', margin: '0 auto', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="pill-stat cyan">Quiz Sprint · Câu {(quizIdx % quizPool.length) + 1}/{quizPool.length}</span>
                <span className="pill-stat green">Đúng: {quizScore}</span>
                <span className="pill-stat amber">Combo: {quizStreak}x</span>
              </div>
              <button
                type="button"
                className="gb sm"
                onClick={() => speakEnglish(activeQuizCard.word)}
              >
                <IconVolume size={13} />
                <span>Nghe phát âm</span>
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '16px 12px', borderRadius: 16, background: 'var(--raised)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 28, fontWeight: 760, letterSpacing: '-0.025em' }}>{activeQuizCard.word}</div>
              <div className="mono" style={{ fontSize: 13, color: 'var(--cyan)', marginTop: 3 }}>
                {activeQuizCard.ipa} · {activeQuizCard.pos} · {activeQuizCard.cefr}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
                &ldquo;{activeQuizCard.clozeSentence.replace(/\{\{|\}\}/g, '')}&rdquo;
              </div>
            </div>

            <div className="grid2">
              {quizChoices.map((ch) => {
                const showRes = quizPicked !== null;
                const isPicked = quizPicked === ch.cardId;
                const cls = showRes
                  ? ch.isCorrect
                    ? 'is-correct'
                    : isPicked
                      ? 'is-wrong'
                      : ''
                  : '';
                return (
                  <button
                    key={ch.cardId}
                    type="button"
                    className={`vocab-choice-btn ${cls}`}
                    style={{ padding: '12px 14px', fontSize: 13.5 }}
                    onClick={() => {
                      if (quizPicked) return;
                      setQuizPicked(ch.cardId);
                      if (ch.isCorrect) {
                        playSuccessSound();
                        setQuizScore((s) => s + 1);
                        setQuizStreak((s) => s + 1);
                        onRateCard(activeQuizCard.id, 3);
                      } else {
                        playErrorSound();
                        setQuizStreak(0);
                        onRateCard(activeQuizCard.id, 1);
                      }
                    }}
                  >
                    <span>{ch.meaningVi}</span>
                    {showRes && ch.isCorrect && <IconCheck size={14} />}
                  </button>
                );
              })}
            </div>

            {quizPicked && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  <b>Mẹo nhớ:</b> {activeQuizCard.mnemonic}
                </div>
                <button
                  type="button"
                  className="pb sm"
                  onClick={() => {
                    setQuizPicked(null);
                    setQuizIdx((i) => i + 1);
                    const nextCard = quizPool[(quizIdx + 1) % quizPool.length];
                    if (nextCard) speakEnglish(nextCard.word);
                  }}
                >
                  Câu tiếp theo →
                </button>
              </div>
            )}
          </div>
        ) : null
      ) : mode === 'notify' ? (
        /* MODE 3: SMART VOCABULARY NOTIFICATION STUDIO (WordBit / Drops Desktop HUD) */
        <div className="split-2">
          <div className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 15.5 }}>Thông báo Học Từ vựng Tự động</b>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Tự động đẩy từ vựng FSRS theo lịch (thẻ Glass nổi + macOS Desktop HUD) để học mọi lúc
                </div>
              </div>
              {vocabNotifications && onUpdateVocabNotifications && (
                <label className="sw" style={{ flexShrink: 0 }}>
                  <input
                    id="vocab-notify-enabled"
                    type="checkbox"
                    aria-label="Bật tắt thông báo học từ vựng"
                    checked={vocabNotifications.enabled}
                    onChange={(e) => onUpdateVocabNotifications({ enabled: e.target.checked })}
                  />
                  <i />
                </label>
              )}
            </div>

            {vocabNotifications && onUpdateVocabNotifications && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 620, marginBottom: 6 }}>Tần suất gửi thông báo từ vựng</div>
                  <div className="seg" style={{ flexWrap: 'wrap' }}>
                    {([5, 15, 30, 60, 120] as VocabNotifyInterval[]).map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        className={vocabNotifications.intervalMinutes === mins ? 'on' : ''}
                        onClick={() => onUpdateVocabNotifications({ intervalMinutes: mins })}
                      >
                        {mins < 60 ? `${mins} phút` : `${mins / 60} giờ`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 620, marginBottom: 6 }}>Nguồn ưu tiên chọn từ để nhắc</div>
                  <div className="seg" style={{ flexWrap: 'wrap' }}>
                    {(
                      [
                        { id: 'due', label: 'Thẻ FSRS đến hạn' },
                        { id: 'weak', label: 'Từ hay quên' },
                        { id: 'new', label: 'Từ mới chưa học' },
                        { id: 'all', label: 'Tất cả bộ thẻ' },
                      ] as Array<{ id: VocabNotifySource; label: string }>
                    ).map((src) => (
                      <button
                        key={src.id}
                        type="button"
                        className={vocabNotifications.source === src.id ? 'on' : ''}
                        onClick={() => onUpdateVocabNotifications({ source: src.id })}
                      >
                        {src.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid2">
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Lọc theo Bộ thẻ (Deck)</span>
                    <select
                      className="input-field"
                      aria-label="Chọn bộ thẻ để gửi thông báo"
                      value={vocabNotifications.deckFilter}
                      onChange={(e) => onUpdateVocabNotifications({ deckFilter: e.target.value })}
                    >
                      {decks.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Kiểu tương tác khi hiện thẻ</span>
                    <div className="seg" style={{ width: '100%' }}>
                      {(
                        [
                          { id: 'quiz', label: 'Quiz 4 đáp án' },
                          { id: 'flash', label: 'Lật Flashcard' },
                        ] as Array<{ id: VocabNotifyStyle; label: string }>
                      ).map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          style={{ flex: 1, justifyContent: 'center' }}
                          className={vocabNotifications.style === st.id ? 'on' : ''}
                          onClick={() => onUpdateVocabNotifications({ style: st.id })}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 14, background: 'var(--raised)', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Hiện thẻ Glass nổi trên màn hình macOS (Desktop HUD)</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                        Hiện góc trên phải màn hình Mac kể cả khi đang mở ứng dụng khác
                      </div>
                    </div>
                    <label className="sw">
                      <input
                        type="checkbox"
                        checked={vocabNotifications.useNativeHud}
                        onChange={(e) => onUpdateVocabNotifications({ useNativeHud: e.target.checked })}
                      />
                      <i />
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Tự phát âm song ngữ (EN + VieNeu VI) khi có thông báo</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                        Học thụ động bằng tai nghe không cần rời mắt khỏi công việc
                      </div>
                    </div>
                    <label className="sw">
                      <input
                        type="checkbox"
                        checked={vocabNotifications.autoSpeak}
                        onChange={(e) => onUpdateVocabNotifications({ autoSpeak: e.target.checked })}
                      />
                      <i />
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12.5 }}>
                      <b>Giờ im lặng:</b> {vocabNotifications.quietStartHour}:00 → {vocabNotifications.quietEndHour}:00 · Giới hạn {vocabNotifications.dailyCap} từ/ngày
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {onTriggerVocabNotifyNow && (
                    <button type="button" className="pb" onClick={onTriggerVocabNotifyNow}>
                      <IconBellRing size={14} />
                      <span>Gửi thử 1 thông báo từ vựng ngay</span>
                    </button>
                  )}
                  <button type="button" className="gb" onClick={handleRequestBrowserPermission}>
                    Cấp quyền Notification trình duyệt
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notification History Log */}
          <div className="bento-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 15 }}>Lịch sử Từ vựng đã Thông báo</b>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Theo dõi những từ bạn nhớ ngay vs cần ôn lại qua thông báo
                </div>
              </div>
              <span className="pill-stat cyan" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                {notificationHistory.length} lượt
              </span>
            </div>

            {notificationHistory.length === 0 ? (
              <div style={{ padding: 18, borderRadius: 14, background: 'var(--raised)', border: '1px solid var(--line)', fontSize: 13, color: 'var(--muted)' }}>
                Chưa có từ nào được nhắc trong phiên này. Bấm <b>&ldquo;Gửi thử 1 thông báo từ vựng ngay&rdquo;</b> để trải nghiệm thẻ học nổi Liquid Glass!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                {notificationHistory.slice(0, 20).map((log) => {
                  const statusColor =
                    log.outcome === 'remembered' || log.outcome === 'quiz-correct'
                      ? 'var(--green)'
                      : log.outcome === 'again' || log.outcome === 'quiz-wrong'
                        ? 'var(--rose)'
                        : 'var(--amber)';
                  const statusLabel =
                    log.outcome === 'quiz-correct'
                      ? 'Quiz đúng'
                      : log.outcome === 'remembered'
                        ? 'Đã nhớ'
                        : log.outcome === 'quiz-wrong'
                          ? 'Quiz sai'
                          : log.outcome === 'again'
                            ? 'Ôn lại'
                            : log.outcome === 'dismissed'
                              ? 'Bỏ qua'
                              : 'Đang chờ';
                  return (
                    <div
                      key={log.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'var(--raised)',
                        border: '1px solid var(--line)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 640, fontSize: 13 }}>
                          {log.word} <span className="mono" style={{ fontSize: 11.5, color: 'var(--cyan)' }}>{log.ipa}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.meaningVi}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span className="tag" style={{ color: statusColor }}>{statusLabel}</span>
                        <button
                          type="button"
                          className="ib sm"
                          aria-label={`Nghe ${log.word}`}
                          onClick={() => speakEnglish(log.word)}
                        >
                          <IconVolume size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : mode === 'roots' ? (
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
      ) : (
        /* MODE 4: MANAGE VOCABULARY BANK */
        <div>
          <div className="compact-picker" style={{ marginBottom: 14 }}>
            <div className="compact-picker-scroll">
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
            </div>
            <input
              id="fsrs-deck-search"
              name="fsrsSearch"
              aria-label="Lọc từ vựng trong kho FSRS"
              className="f-q"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm từ, nghĩa..."
            />
            <div className="seg">
              <button type="button" className={viewType === 'list' ? 'on' : ''} onClick={() => setViewType('list')}>Danh sách</button>
              <button type="button" className={viewType === 'grid' ? 'on' : ''} onClick={() => setViewType('grid')}>Lưới</button>
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
                        {c.word} <span className="mono" style={{ fontSize: 11.5, color: 'var(--cyan)' }}>{c.ipa}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.meaningVi}
                      </div>
                    </div>
                    <span className="col-hide-sm" style={{ fontSize: 11.5, color: 'var(--muted)' }}>{c.deck}</span>
                    <div><span className="tag">{c.cefr} · {c.state}</span></div>
                    <div className="col-hide-sm mono" style={{ fontSize: 12 }}>{retPct}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 5 }}>
                      <button
                        type="button"
                        className="ib sm"
                        aria-label={`Nghe phát âm ${c.word}`}
                        onClick={() => speakEnglish(c.word)}
                        title="Nghe phát âm"
                      >
                        <IconVolume size={14} />
                      </button>
                      {onEditCard && (
                        <button
                          type="button"
                          className="ib sm"
                          aria-label={`Chỉnh sửa ${c.word}`}
                          onClick={() => startEditCard(c)}
                          title="Chỉnh sửa thẻ"
                        >
                          <IconEdit size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="gb sm"
                        onClick={() => {
                          onRateCard(c.id, 3);
                          onShowToast(`Đã ôn nhanh "${c.word}" (Good)`);
                        }}
                      >
                        Good
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
                        <b style={{ fontSize: 14.5 }}>{c.word}</b>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--cyan)' }}>{c.ipa}</span>
                      </div>
                      <span className="tag">{c.cefr}</span>
                    </div>
                    <div style={{ fontSize: 13 }}>{c.meaningVi}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Collocations: {c.collocations.join(' · ')}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <span style={{ fontSize: 11.5, color: 'var(--dim)' }}>S = {c.stability.toFixed(1)}d · {c.deck}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {onEditCard && (
                          <button type="button" className="ib sm" aria-label={`Sửa ${c.word}`} onClick={() => startEditCard(c)}>
                            <IconEdit size={13} />
                          </button>
                        )}
                        <button type="button" className="ib sm" aria-label={`Nghe phát âm ${c.word}`} onClick={() => speakEnglish(c.word)}>
                          <IconVolume size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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
              Gộp Priority
            </button>
            <button
              type="button"
              className="pb sm"
              onClick={() => {
                const words = cards.filter((c) => selectedIds.includes(c.id)).map((c) => c.word);
                onLaunchTutorWithWords(words);
              }}
            >
              Luyện nói AI ({selectedIds.length})
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
