import React, { useMemo, useState } from 'react';
import type { FsrsCard, FsrsRating } from '../../core/fsrs/fsrsEngine';
import { buildVocabQuizChoices } from '../../core/fsrs/vocabNotifier';
import { speakBilingual, speakEnglish, speakVietnamese } from '../../core/phonetics/speechIO';
import { playErrorSound, playSuccessSound } from '../../core/phonetics/soundEffects';
import type { VocabNotifyStyle } from '../../core/storage/db';
import { IconBellRing, IconCheck, IconHeadphones, IconVolume, IconX } from '../icons/Icons';

interface VocabNotificationPopupProps {
  card: FsrsCard;
  allCards: FsrsCard[];
  styleMode: VocabNotifyStyle;
  soundEffectsEnabled: boolean;
  onRate: (cardId: string, rating: FsrsRating, outcome: 'remembered' | 'again' | 'quiz-correct' | 'quiz-wrong') => void;
  onSnooze: () => void;
  onDismiss: () => void;
  onOpenDeck: () => void;
}

export const VocabNotificationPopup: React.FC<VocabNotificationPopupProps> = ({
  card,
  allCards,
  styleMode,
  soundEffectsEnabled,
  onRate,
  onSnooze,
  onDismiss,
  onOpenDeck,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [pickedChoiceId, setPickedChoiceId] = useState<string | null>(null);
  const [mode, setMode] = useState<VocabNotifyStyle>(styleMode);

  const choices = useMemo(() => buildVocabQuizChoices(card, allCards), [card, allCards]);
  const cleanExample = card.clozeSentence.replace(/\{\{|\}\}/g, '');

  const handlePickQuiz = (choiceId: string, isCorrect: boolean) => {
    if (pickedChoiceId) return;
    setPickedChoiceId(choiceId);
    setRevealed(true);
    if (isCorrect) {
      if (soundEffectsEnabled) playSuccessSound();
      window.setTimeout(() => {
        onRate(card.id, 3, 'quiz-correct');
      }, 900);
    } else {
      if (soundEffectsEnabled) playErrorSound();
    }
  };

  return (
    <aside
      className="vocab-popup-card"
      role="dialog"
      aria-label={`Thông báo học từ vựng: ${card.word}`}
    >
      <div className="vocab-popup-head">
        <div className="vocab-popup-badge">
          <IconBellRing size={13} />
          <span>Nhắc học từ vựng · {card.cefr}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            className="gb sm"
            style={{ height: 22, padding: '0 8px', fontSize: 10.5 }}
            onClick={() => setMode((m) => (m === 'quiz' ? 'flash' : 'quiz'))}
          >
            {mode === 'quiz' ? 'Đổi Flash' : 'Đổi Quiz'}
          </button>
          <button
            type="button"
            className="ib sm"
            aria-label="Đóng thông báo từ vựng"
            onClick={onDismiss}
          >
            <IconX size={13} />
          </button>
        </div>
      </div>

      <div className="vocab-popup-word-row">
        <div style={{ minWidth: 0 }}>
          <div className="vocab-popup-word">{card.word}</div>
          <div className="mono vocab-popup-ipa">
            {card.ipa} · {card.pos} · {card.deck}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <button
            type="button"
            className="ib sm"
            title="Nghe phát âm tiếng Anh"
            aria-label={`Nghe tiếng Anh ${card.word}`}
            onClick={() => speakEnglish(card.word)}
          >
            <IconVolume size={14} />
          </button>
          <button
            type="button"
            className="ib sm"
            title="Đọc song ngữ (Tiếng Anh + VieNeu Tiếng Việt)"
            aria-label="Đọc song ngữ Anh Việt"
            onClick={() => speakBilingual(`${card.word}. ${cleanExample}`, card.meaningVi)}
          >
            <IconHeadphones size={14} />
          </button>
        </div>
      </div>

      <div className="vocab-popup-example">&ldquo;{cleanExample}&rdquo;</div>

      {mode === 'quiz' ? (
        <div className="vocab-popup-choices">
          {choices.map((ch) => {
            const isPicked = pickedChoiceId === ch.cardId;
            const showResult = pickedChoiceId !== null;
            let stateClass = '';
            if (showResult && ch.isCorrect) stateClass = 'is-correct';
            else if (isPicked && !ch.isCorrect) stateClass = 'is-wrong';

            return (
              <button
                key={ch.cardId}
                type="button"
                className={`vocab-choice-btn ${stateClass}`}
                onClick={() => handlePickQuiz(ch.cardId, ch.isCorrect)}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>{ch.meaningVi}</span>
                {showResult && ch.isCorrect && <IconCheck size={13} />}
              </button>
            );
          })}
          {pickedChoiceId && !choices.find((c) => c.cardId === pickedChoiceId)?.isCorrect && (
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button
                type="button"
                className="gb sm"
                style={{ flex: 1, justifyContent: 'center', color: 'var(--rose)', borderColor: 'var(--rose)' }}
                onClick={() => onRate(card.id, 1, 'quiz-wrong')}
              >
                Ôn lại sớm (Again)
              </button>
              <button
                type="button"
                className="gb sm"
                onClick={() => speakVietnamese(card.meaningVi)}
              >
                Nghe nghĩa (VieNeu)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {revealed ? (
            <>
              <div className="vocab-popup-reveal">
                <div style={{ fontWeight: 650, fontSize: 13.5 }}>{card.meaningVi}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                  {card.mnemonic}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                <button
                  type="button"
                  className="gb sm"
                  style={{ justifyContent: 'center', color: 'var(--rose)', borderColor: 'var(--rose)' }}
                  onClick={() => onRate(card.id, 1, 'again')}
                >
                  Chưa nhớ
                </button>
                <button
                  type="button"
                  className="pb sm"
                  style={{ justifyContent: 'center' }}
                  onClick={() => onRate(card.id, 3, 'remembered')}
                >
                  Đã nhớ
                </button>
                <button
                  type="button"
                  className="gb sm"
                  style={{ justifyContent: 'center', color: 'var(--cyan)', borderColor: 'var(--cyan)' }}
                  onClick={() => onRate(card.id, 4, 'remembered')}
                >
                  Quá dễ
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              className="pb sm"
              style={{ width: '100%', justifyContent: 'center', height: 32 }}
              onClick={() => {
                setRevealed(true);
                speakEnglish(card.word);
              }}
            >
              Lật xem nghĩa &amp; Mẹo nhớ
            </button>
          )}
        </div>
      )}

      <div className="vocab-popup-foot">
        <button type="button" className="link-quiet" onClick={onSnooze}>
          Nhắc lại sau 10 phút
        </button>
        <button type="button" className="link-quiet" onClick={onOpenDeck}>
          Mở kho FSRS →
        </button>
      </div>
    </aside>
  );
};
