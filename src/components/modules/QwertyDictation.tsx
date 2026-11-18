import React, { useEffect, useRef, useState } from 'react';
import { QWERTY_DICTIONARY_PACKS } from '../../data/dictionaries';
import { SHADOWING_TRACKS } from '../../data/shadowingMedia';
import { speakEnglish, triggerHaptic } from '../../core/phonetics/speechIO';
import { IconVolume } from '../icons/Icons';

interface QwertyDictationProps {
  bestWpm: number;
  onUpdateBestWpm: (wpm: number) => void;
  onShowToast: (msg: string) => void;
}

export const QwertyDictation: React.FC<QwertyDictationProps> = ({
  bestWpm,
  onUpdateBestWpm,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'typing' | 'dictation'>('typing');
  const [packIdx, setPackIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [hadError, setHadError] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const [wpm, setWpm] = useState(0);

  // Audio Dictation state
  const [dictIdx, setDictIdx] = useState(0);
  const [dictInput, setDictInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [dictChecked, setDictChecked] = useState<null | { matchPct: number }>(null);

  const pack = QWERTY_DICTIONARY_PACKS[packIdx];
  const currentItem = pack.items[itemIdx % pack.items.length];
  const dictTrack = SHADOWING_TRACKS[dictIdx % SHADOWING_TRACKS.length];

  useEffect(() => {
    if (mode === 'typing') {
      speakEnglish(currentItem.word);
    }
  }, [itemIdx, packIdx, mode, currentItem.word]);

  const handleTypingChange = (val: string) => {
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    const target = currentItem.word.toLowerCase();
    const clean = val.toLowerCase();

    if (clean.length > typed.length) {
      setTotalKeystrokes((n) => n + 1);
      const nextChar = clean[clean.length - 1];
      const expectedChar = target[typed.length];
      if (nextChar !== expectedChar) {
        // qwerty-learner muscle-memory rule: reset word on typo!
        setHadError(true);
        setTyped('');
        triggerHaptic('warning');
        window.setTimeout(() => setHadError(false), 360);
        return;
      }
      setCorrectKeystrokes((n) => n + 1);
    }

    setTyped(clean);

    if (clean === target) {
      const nextDone = completedCount + 1;
      setCompletedCount(nextDone);
      const elapsedMin = Math.max(0.05, (Date.now() - (startTimeRef.current ?? Date.now())) / 60_000);
      const calcWpm = Math.round((correctKeystrokes + 1) / 5 / elapsedMin);
      setWpm(calcWpm);
      if (calcWpm > bestWpm) onUpdateBestWpm(calcWpm);
      triggerHaptic('success');
      setTyped('');
      setItemIdx((i) => (i + 1) % pack.items.length);
    }
  };

  const accuracy =
    totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;

  const checkDictation = () => {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(Boolean);
    const targetWords = normalize(dictTrack.text);
    const userWords = normalize(dictInput);
    let hits = 0;
    targetWords.forEach((w, i) => {
      if (userWords[i] === w) hits += 1;
    });
    const matchPct = Math.round((hits / Math.max(1, targetWords.length)) * 100);
    setDictChecked({ matchPct });
    onShowToast(`Độ chính xác chính tả: ${matchPct}%`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="seg">
          <button type="button" className={mode === 'typing' ? 'on' : ''} onClick={() => setMode('typing')}>
            Speed Vocabulary Typing (Qwerty)
          </button>
          <button type="button" className={mode === 'dictation' ? 'on' : ''} onClick={() => setMode('dictation')}>
            Audio Sentence Dictation (Nghe Chép)
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <span className="tag">WPM: {wpm || bestWpm}</span>
          <span className="tag" style={{ color: 'var(--green)', background: 'var(--green-s)' }}>
            Accuracy: {accuracy}%
          </span>
          <span className="tag">Đã gõ: {completedCount} từ</span>
        </div>
      </div>

      {mode === 'typing' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="filters" style={{ marginBottom: 0 }}>
            {QWERTY_DICTIONARY_PACKS.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                className={`fp ${idx === packIdx ? 'on' : ''}`}
                onClick={() => {
                  setPackIdx(idx);
                  setItemIdx(0);
                  setTyped('');
                }}
              >
                <span>{p.name}</span>
                <span className="tag">{p.level}</span>
              </button>
            ))}
          </div>

          <div
            className="panel"
            style={{
              maxWidth: 720,
              width: '100%',
              margin: '0 auto',
              padding: '32px 24px',
              textAlign: 'center',
              borderColor: hadError ? 'var(--rose)' : undefined,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
              <span className="tag">{pack.name}</span>
              <span className="tag">
                {(itemIdx % pack.items.length) + 1}/{pack.items.length}
              </span>
            </div>

            {/* Letter-by-Letter Target Display */}
            <div
              className="mono"
              style={{
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              {currentItem.word.split('').map((ch, idx) => {
                const isDone = idx < typed.length;
                return (
                  <span
                    key={idx}
                    style={{
                      color: hadError
                        ? 'var(--rose)'
                        : isDone
                          ? 'var(--green)'
                          : 'var(--dim)',
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
              <span className="mono" style={{ color: 'var(--cyan)', fontSize: 13 }}>
                {currentItem.ipa}
              </span>
              <button type="button" className="ib sm" onClick={() => speakEnglish(currentItem.word)}>
                <IconVolume size={15} />
              </button>
            </div>

            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{currentItem.meaningVi}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
              {currentItem.example}
            </div>

            <input
              autoFocus
              className="input-field mono"
              style={{
                width: '100%',
                maxWidth: 380,
                height: 40,
                textAlign: 'center',
                fontSize: 16,
                letterSpacing: '0.06em',
              }}
              value={typed}
              onChange={(e) => handleTypingChange(e.target.value)}
              placeholder="Gõ chính xác từ trên (sai 1 ký tự sẽ reset)..."
            />
          </div>
        </div>
      ) : (
        <div className="panel" style={{ maxWidth: 760, width: '100%', margin: '0 auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="ph" style={{ marginBottom: 0 }}>
            <div>
              <b>{dictTrack.source}</b>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Nghe câu mẫu và chép lại chính xác từng từ (IELTS Listening / TED Dictation)
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="gb sm"
                onClick={() => {
                  setDictIdx((i) => (i + 1) % SHADOWING_TRACKS.length);
                  setDictInput('');
                  setDictChecked(null);
                }}
              >
                Bài tiếp theo
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="pb" onClick={() => speakEnglish(dictTrack.text, { rate: 0.9 })}>
              <IconVolume size={14} />
              <span>Nghe câu (0.9x)</span>
            </button>
            <button type="button" className="gb" onClick={() => speakEnglish(dictTrack.text, { rate: 0.7 })}>
              Nghe chậm (0.7x)
            </button>
            <button type="button" className="gb" onClick={() => setShowHint((h) => !h)}>
              {showHint ? 'Ẩn gợi ý chữ cái đầu' : 'Gợi ý chữ cái đầu'}
            </button>
          </div>

          {showHint && (
            <div className="mono" style={{ padding: 10, borderRadius: 10, background: 'var(--raised)', fontSize: 12.5, color: 'var(--cyan)' }}>
              {dictTrack.dictationHint}
            </div>
          )}

          <textarea
            className="textarea-field"
            rows={3}
            value={dictInput}
            onChange={(e) => setDictInput(e.target.value)}
            placeholder="Nhập lại toàn bộ câu bạn vừa nghe được..."
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <button type="button" className="pb" onClick={checkDictation}>
              Kiểm tra chính tả
            </button>
            {dictChecked && (
              <div style={{ fontSize: 13, fontWeight: 650 }}>
                Kết quả:{' '}
                <span className={dictChecked.matchPct >= 85 ? 'ok' : dictChecked.matchPct >= 60 ? 'warn' : 'low'}>
                  {dictChecked.matchPct}% chính xác
                </span>
              </div>
            )}
          </div>

          {dictChecked && (
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--raised)', border: '1px solid var(--line)', fontSize: 12.5 }}>
              <div><b>Đáp án gốc:</b> {dictTrack.text}</div>
              <div style={{ color: 'var(--muted)', marginTop: 4 }}>{dictTrack.translationVi}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
