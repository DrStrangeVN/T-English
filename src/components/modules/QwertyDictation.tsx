import React, { useEffect, useRef, useState } from 'react';
import { QWERTY_DICTIONARY_PACKS } from '../../data/dictionaries';
import { SHADOWING_TRACKS } from '../../data/shadowingMedia';
import { speakEnglish, triggerHaptic } from '../../core/phonetics/speechIO';
import { playErrorSound, playKeyClickSound, playSuccessSound } from '../../core/phonetics/soundEffects';
import { IconVolume } from '../icons/Icons';

interface QwertyDictationProps {
  bestWpm: number;
  soundEffectsEnabled: boolean;
  onUpdateBestWpm: (wpm: number) => void;
  onShowToast: (msg: string) => void;
}

export const QwertyDictation: React.FC<QwertyDictationProps> = ({
  bestWpm,
  soundEffectsEnabled,
  onUpdateBestWpm,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'typing' | 'dictation'>('typing');
  const [packIdx, setPackIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [hadError, setHadError] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [wpmHistory, setWpmHistory] = useState<number[]>([52, 58, 61, 64, 68]);

  // Audio Dictation state
  const [dictIdx, setDictIdx] = useState(0);
  const [dictInput, setDictInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [dictChecked, setDictChecked] = useState<null | {
    matchPct: number;
    wordComparison: Array<{ expected: string; got: string; match: boolean }>;
  }>(null);

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
        if (soundEffectsEnabled) playErrorSound();
        setHadError(true);
        setTyped('');
        triggerHaptic('warning');
        window.setTimeout(() => setHadError(false), 360);
        return;
      }
      if (soundEffectsEnabled) playKeyClickSound();
      setCorrectKeystrokes((n) => n + 1);
    }

    setTyped(clean);

    if (clean === target) {
      const nextDone = completedCount + 1;
      setCompletedCount(nextDone);
      const elapsedMin = Math.max(0.05, (Date.now() - (startTimeRef.current ?? Date.now())) / 60_000);
      const calcWpm = Math.min(180, Math.round((correctKeystrokes + 1) / 5 / elapsedMin));
      setWpm(calcWpm);
      setWpmHistory((prev) => [...prev.slice(-11), calcWpm]);
      if (calcWpm > bestWpm) onUpdateBestWpm(calcWpm);
      if (soundEffectsEnabled) playSuccessSound();
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
    const wordComparison = targetWords.map((w, i) => {
      const got = userWords[i] ?? '';
      const match = got === w;
      if (match) hits += 1;
      return { expected: w, got, match };
    });
    const matchPct = Math.round((hits / Math.max(1, targetWords.length)) * 100);
    setDictChecked({ matchPct, wordComparison });
    if (matchPct >= 85 && soundEffectsEnabled) playSuccessSound();
    onShowToast(`Độ chính xác chính tả: ${matchPct}%`);
  };

  const maxWpmHist = Math.max(80, ...wpmHistory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="seg">
          <button type="button" className={mode === 'typing' ? 'on' : ''} onClick={() => setMode('typing')}>
            Monkeytype Speed Vocabulary (60 từ)
          </button>
          <button type="button" className={mode === 'dictation' ? 'on' : ''} onClick={() => setMode('dictation')}>
            DailyDictation Nghe Chép (8 bài)
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {mode === 'typing' && (
            <button type="button" className={`gb sm ${zenMode ? 'hl' : ''}`} onClick={() => setZenMode((z) => !z)}>
              {zenMode ? 'Thoát Zen Mode' : 'Zen Focus Mode'}
            </button>
          )}
          <span className="tag">WPM: {wpm || bestWpm}</span>
          <span className="tag" style={{ color: 'var(--green)', background: 'var(--green-s)' }}>
            Accuracy: {accuracy}%
          </span>
          <span className="tag">Đã gõ: {completedCount} từ</span>
        </div>
      </div>

      {mode === 'typing' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!zenMode && (
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
          )}

          <div
            className="panel"
            style={{
              maxWidth: 740,
              width: '100%',
              margin: '0 auto',
              padding: zenMode ? '46px 24px' : '30px 24px',
              textAlign: 'center',
              borderColor: hadError ? 'var(--rose)' : undefined,
            }}
          >
            {!zenMode && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
                <span className="tag">{pack.name}</span>
                <span className="tag">
                  {(itemIdx % pack.items.length) + 1}/{pack.items.length}
                </span>
              </div>
            )}

            <div className="mono" style={{ fontSize: 36, fontWeight: 700, letterSpacing: '0.09em', marginBottom: 8 }}>
              {currentItem.word.split('').map((ch, idx) => {
                const isDone = idx < typed.length;
                const isCaret = idx === typed.length;
                return (
                  <span
                    key={idx}
                    style={{
                      color: hadError ? 'var(--rose)' : isDone ? 'var(--green)' : 'var(--dim)',
                      borderBottom: isCaret ? '2px solid var(--cyan)' : '2px solid transparent',
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
              <span className="mono" style={{ color: 'var(--cyan)', fontSize: 13 }}>{currentItem.ipa}</span>
              <button type="button" className="ib sm" onClick={() => speakEnglish(currentItem.word)}>
                <IconVolume size={15} />
              </button>
            </div>

            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{currentItem.meaningVi}</div>
            {!zenMode && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>{currentItem.example}</div>
            )}

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
              placeholder="Gõ chính xác từng ký tự..."
            />

            {!zenMode && (
              <div style={{ marginTop: 22, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                  Biểu đồ Tốc độ Gõ (Live WPM Sparkline)
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, height: 48 }}>
                  {wpmHistory.map((val, idx) => (
                    <div
                      key={idx}
                      title={`${val} WPM`}
                      style={{
                        width: 14,
                        height: Math.max(8, Math.round((val / maxWpmHist) * 42)),
                        borderRadius: 4,
                        background: idx === wpmHistory.length - 1 ? 'var(--cyan)' : 'var(--indigo)',
                        opacity: idx === wpmHistory.length - 1 ? 1 : 0.65,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="panel" style={{ maxWidth: 800, width: '100%', margin: '0 auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="ph" style={{ marginBottom: 0 }}>
            <div>
              <b>{dictTrack.source}</b>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Nghe câu mẫu và chép lại chính xác từng từ · Bài {dictIdx + 1}/{SHADOWING_TRACKS.length}
              </div>
            </div>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="pb" onClick={() => speakEnglish(dictTrack.text, { accent: dictTrack.accent, rate: 0.9 })}>
              <IconVolume size={14} />
              <span>Nghe câu ({dictTrack.accent})</span>
            </button>
            <button type="button" className="gb" onClick={() => speakEnglish(dictTrack.text, { accent: dictTrack.accent, rate: 0.7 })}>
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
              Kiểm tra &amp; Giải phẫu Connected Speech
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
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--raised)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {dictChecked.wordComparison.map((wc, idx) => (
                  <span
                    key={idx}
                    className="tag"
                    style={{
                      fontSize: 12,
                      color: wc.match ? 'var(--green)' : 'var(--rose)',
                      background: wc.match ? 'var(--green-s)' : 'var(--rose-s)',
                    }}
                  >
                    {wc.expected}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{dictTrack.translationVi}</div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 650 }}>Chú ý nuốt âm / nối âm (Coach Notes):</div>
                {dictTrack.connectedSpeechBreakdown.map((cs, i) => (
                  <div key={i} style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                    <b>{cs.raw}</b> <span className="mono" style={{ color: 'var(--cyan)' }}>{cs.naturalIpa}</span> — {cs.ruleVi}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
