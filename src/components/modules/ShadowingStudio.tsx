import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SHADOWING_TRACKS } from '../../data/shadowingMedia';
import { MINIMAL_PAIRS_DATA } from '../../data/minimalPairs';
import {
  estimatePitchHz,
  evaluatePronunciation,
  tokenizeIpa,
  wordToIpa,
  type SentencePronunciationResult,
} from '../../core/phonetics/ipaScorer';
import {
  speakEnglish,
  startSpeechCapture,
  stopSpeaking,
  triggerHaptic,
  type SpeechRecognitionSession,
} from '../../core/phonetics/speechIO';
import { playErrorSound, playSuccessSound } from '../../core/phonetics/soundEffects';
import { VocalTractSVG } from '../common/VocalTractSVG';
import { IconMic, IconPlay, IconRepeat, IconVolume } from '../icons/Icons';

interface ShadowingStudioProps {
  onRecordScore: (score: number, weakSymbols: string[]) => void;
  onShowToast: (msg: string) => void;
}

export const ShadowingStudio: React.FC<ShadowingStudioProps> = ({
  onRecordScore,
  onShowToast,
}) => {
  const [studioTab, setStudioTab] = useState<'shadowing' | 'minimal'>('shadowing');
  const [trackIdx, setTrackIdx] = useState(0);
  const [customText, setCustomText] = useState(SHADOWING_TRACKS[0].text);
  const [rate, setRate] = useState(1.0);
  const [looping, setLooping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [micNote, setMicNote] = useState('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [inspectedPhoneme, setInspectedPhoneme] = useState('θ');
  const [result, setResult] = useState<SentencePronunciationResult>(() =>
    evaluatePronunciation(
      SHADOWING_TRACKS[0].text,
      'Consistency matters far more than intensity when you want to build lasting fluency in English'
    )
  );

  // Minimal Pairs Drill state
  const [mpIdx, setMpIdx] = useState(0);
  const [quizTarget, setQuizTarget] = useState<'A' | 'B'>('A');
  const [quizPairIdx, setQuizPairIdx] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  const recSessionRef = useRef<SpeechRecognitionSession | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchSamplesRef = useRef<number[]>([]);
  const pitchTimerRef = useRef<number | null>(null);
  const loopTimerRef = useRef<number | null>(null);

  const loopingRef = useRef(looping);
  loopingRef.current = looping;
  const playActionRef = useRef<() => void>(() => undefined);
  const recordActionRef = useRef<() => void>(() => undefined);

  const track = SHADOWING_TRACKS[trackIdx];
  const contrast = MINIMAL_PAIRS_DATA[mpIdx] ?? MINIMAL_PAIRS_DATA[0];
  const activePair = contrast.pairs[quizPairIdx % contrast.pairs.length];

  const selectTrack = (idx: number) => {
    stopSpeaking();
    if (loopTimerRef.current) window.clearTimeout(loopTimerRef.current);
    setIsPlaying(false);
    setTrackIdx(idx);
    const next = SHADOWING_TRACKS[idx];
    setCustomText(next.text);
    const initialEval = evaluatePronunciation(next.text, next.text);
    setResult(initialEval);
    setSpokenText('');
    setMicNote('');
  };

  const handlePlay = () => {
    if (isPlaying) {
      stopSpeaking();
      if (loopTimerRef.current) window.clearTimeout(loopTimerRef.current);
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    const playOnce = () => {
      speakEnglish(customText, {
        accent: track.accent,
        rate,
        onEnd: () => {
          if (loopingRef.current) {
            loopTimerRef.current = window.setTimeout(playOnce, 600);
          } else {
            setIsPlaying(false);
          }
        },
      });
    };
    playOnce();
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (loopTimerRef.current) window.clearTimeout(loopTimerRef.current);
      if (pitchTimerRef.current) window.clearInterval(pitchTimerRef.current);
      recSessionRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => undefined);
    };
  }, []);

  const stopRecordingAndScore = (finalTranscript: string) => {
    recSessionRef.current?.stop();
    recSessionRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    if (pitchTimerRef.current) {
      window.clearInterval(pitchTimerRef.current);
      pitchTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    setIsRecording(false);

    const textToScore = (finalTranscript || spokenText).trim();
    if (!textToScore) {
      setMicNote('Chưa nhận diện được giọng nói — hãy nói gần micro hơn hoặc nhập câu đọc thử vào ô bên dưới để chấm điểm.');
      onShowToast('Không có dữ liệu giọng nói để chấm điểm');
      return;
    }

    const rawPitches = pitchSamplesRef.current;
    let normalizedPitch: number[] | undefined;
    if (rawPitches.length >= 6) {
      normalizedPitch = Array.from({ length: 24 }, (_, idx) => {
        const sample = rawPitches[Math.min(rawPitches.length - 1, Math.floor((idx / 24) * rawPitches.length))];
        return Math.min(94, Math.max(16, Math.round(((sample - 80) / 240) * 70 + 20)));
      });
    }

    const evaluation = evaluatePronunciation(customText, textToScore, normalizedPitch);
    setResult(evaluation);
    if (evaluation.weakPhonemes[0]) {
      setInspectedPhoneme(evaluation.weakPhonemes[0].symbol);
    }
    onRecordScore(
      evaluation.overallScore,
      evaluation.weakPhonemes.map((p) => p.symbol)
    );
    triggerHaptic(evaluation.overallScore >= 85 ? 'success' : 'light');
    onShowToast(`Điểm phát âm: ${evaluation.overallScore}/100 (IELTS ${evaluation.ieltsBandEstimate})`);
  };

  const handleToggleRecord = async () => {
    if (isRecording) {
      stopRecordingAndScore(spokenText);
      return;
    }

    setMicNote('');
    setSpokenText('');
    pitchSamplesRef.current = [];
    setIsRecording(true);

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        if (typeof MediaRecorder !== 'undefined') {
          try {
            recordedChunksRef.current = [];
            const mr = new MediaRecorder(stream);
            mr.ondataavailable = (ev) => {
              if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
            };
            mr.onstop = () => {
              if (recordedChunksRef.current.length > 0 && typeof URL !== 'undefined') {
                const blob = new Blob(recordedChunksRef.current, { type: mr.mimeType || 'audio/webm' });
                const nextUrl = URL.createObjectURL(blob);
                setRecordedAudioUrl((prevUrl) => {
                  if (prevUrl) URL.revokeObjectURL(prevUrl);
                  return nextUrl;
                });
              }
            };
            mr.start();
            mediaRecorderRef.current = mr;
          } catch {
            // Optional self-recording fallback
          }
        }
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        src.connect(analyser);
        const buf = new Float32Array(analyser.fftSize);
        // Sample F0 at ~12.5 Hz (every 80ms), capped at 240 samples to preserve battery/CPU
        pitchTimerRef.current = window.setInterval(() => {
          if (!streamRef.current) return;
          analyser.getFloatTimeDomainData(buf);
          const f0 = estimatePitchHz(buf, ctx.sampleRate);
          if (f0) {
            if (pitchSamplesRef.current.length >= 240) {
              pitchSamplesRef.current.shift();
            }
            pitchSamplesRef.current.push(f0);
          }
        }, 80);
      }
    } catch {
      setMicNote('Không truy cập được micro vật lý — hãy nhập câu đọc thử vào ô bên dưới để kiểm tra.');
    }

    const session = startSpeechCapture({
      onInterim: (txt) => setSpokenText(txt),
      onFinal: (txt) => {
        setSpokenText(txt);
        stopRecordingAndScore(txt);
      },
      onError: (err) => {
        setMicNote(`Ghi âm giọng nói: ${err}`);
      },
    });
    recSessionRef.current = session;
  };

  playActionRef.current = handlePlay;
  recordActionRef.current = () => void handleToggleRecord();

  useEffect(() => {
    if (studioTab !== 'shadowing') return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        playActionRef.current();
      } else if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        recordActionRef.current();
      } else if (e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setLooping((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [studioTab]);

  const pitchPaths = useMemo(() => {
    const toPath = (pts: number[]) =>
      pts
        .map((val, idx) => {
          const x = Math.round((idx / (pts.length - 1)) * 560);
          const y = Math.round(100 - val);
          return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
        })
        .join(' ');
    return {
      nativePath: toPath(result.pitchNative),
      userPath: toPath(result.pitchUser),
    };
  }, [result]);

  const playBlindMinimalWord = () => {
    const pick: 'A' | 'B' = Math.random() > 0.5 ? 'A' : 'B';
    setQuizTarget(pick);
    setQuizFeedback(null);
    speakEnglish(pick === 'A' ? activePair.wordA : activePair.wordB, { rate: 0.9 });
  };

  const checkMinimalChoice = (choice: 'A' | 'B') => {
    const targetWord = quizTarget === 'A' ? activePair.wordA : activePair.wordB;
    const targetIpa = quizTarget === 'A' ? activePair.ipaA : activePair.ipaB;
    if (choice === quizTarget) {
      playSuccessSound();
      setQuizFeedback(`Chuẩn xác! Từ vừa đọc là "${targetWord}" ${targetIpa}.`);
    } else {
      playErrorSound();
      setQuizFeedback(`Chưa đúng — từ vừa đọc là "${targetWord}" ${targetIpa}. Hãy nghe lại và so sánh!`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="seg">
          <button type="button" className={studioTab === 'shadowing' ? 'on' : ''} onClick={() => setStudioTab('shadowing')}>
            Shadowing &amp; Voice Mirror ({SHADOWING_TRACKS.length} bài)
          </button>
          <button
            type="button"
            className={studioTab === 'minimal' ? 'on' : ''}
            onClick={() => {
              setStudioTab('minimal');
              setInspectedPhoneme(contrast.phonemeA);
            }}
          >
            Minimal Pairs &amp; Ending Sounds ({MINIMAL_PAIRS_DATA.length} cặp)
          </button>
        </div>
      </div>

      {studioTab === 'shadowing' ? (
        <>
          <div className="compact-picker">
            <div className="compact-picker-scroll">
              {SHADOWING_TRACKS.map((t, idx) => (
                <button
                  key={t.id}
                  type="button"
                  className={`fp ${idx === trackIdx ? 'on' : ''}`}
                  onClick={() => selectTrack(idx)}
                >
                  <span>{t.source}</span>
                  <span className="tag">{t.cefr}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="split-2">
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="ph" style={{ marginBottom: 2 }}>
                <div>
                  <b>{track.source}</b>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {track.accent} · {track.durationSec}s · <kbd>Space</kbd> Nghe · <kbd>R</kbd> Thu âm · <kbd>L</kbd> Lặp
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {[0.75, 0.9, 1.0, 1.25].map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      className={`gb sm ${rate === sp ? 'hl' : ''}`}
                      onClick={() => setRate(sp)}
                    >
                      {sp}x
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                id="shadowing-target-text"
                name="shadowing-target-text"
                className="textarea-field"
                rows={2}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                aria-label="Câu luyện phát âm Shadowing"
              />
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{track.translationVi}</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="pb" onClick={handlePlay}>
                  <IconPlay size={14} />
                  <span>{isPlaying ? 'Dừng phát' : 'Nghe mẫu bản xứ'}</span>
                </button>
                <button
                  type="button"
                  className="gb"
                  style={{
                    borderColor: isRecording ? 'var(--rose)' : undefined,
                    color: isRecording ? 'var(--rose)' : undefined,
                    background: isRecording ? 'var(--rose-s)' : undefined,
                  }}
                  onClick={handleToggleRecord}
                >
                  <IconMic size={14} />
                  <span>{isRecording ? 'Dừng & Chấm IPA' : 'Thu âm Shadowing'}</span>
                </button>
                <button
                  type="button"
                  className={`gb ${looping ? 'hl' : ''}`}
                  onClick={() => setLooping((v) => !v)}
                >
                  <IconRepeat size={14} />
                  <span>AB-Loop {looping ? 'Bật' : 'Tắt'}</span>
                </button>
                {recordedAudioUrl && (
                  <>
                    <button
                      type="button"
                      className="gb sm hl"
                      onClick={() => {
                        const a = new Audio(recordedAudioUrl);
                        void a.play().catch(() => onShowToast('Không thể phát đoạn ghi âm vừa thu'));
                      }}
                    >
                      <IconVolume size={13} />
                      <span>Nghe lại giọng bạn</span>
                    </button>
                    <button
                      type="button"
                      className="gb sm"
                      onClick={() => {
                        speakEnglish(customText, {
                          accent: track.accent,
                          rate,
                          onEnd: () => {
                            window.setTimeout(() => {
                              const a = new Audio(recordedAudioUrl);
                              void a.play().catch(() => undefined);
                            }, 350);
                          },
                        });
                      }}
                    >
                      <span>So sánh A/B (Mẫu → Bạn)</span>
                    </button>
                  </>
                )}
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: 'var(--raised)',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                  <span>Đường Cao độ Giọng nói (Pitch Contour F0)</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: 'var(--cyan)' }}>— Giọng chuẩn</span>
                    <span style={{ color: 'var(--green)' }}>— Giọng của bạn</span>
                  </div>
                </div>
                <svg viewBox="0 0 560 100" style={{ width: '100%', height: 84, overflow: 'visible' }}>
                  <line x1="0" y1="25" x2="560" y2="25" stroke="var(--line)" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="560" y2="50" stroke="var(--line)" strokeDasharray="3 3" />
                  <line x1="0" y1="75" x2="560" y2="75" stroke="var(--line)" strokeDasharray="3 3" />
                  <path d={pitchPaths.nativePath} fill="none" stroke="var(--cyan)" strokeWidth="2.4" strokeLinecap="round" />
                  <path d={pitchPaths.userPath} fill="none" stroke="var(--green)" strokeWidth="2.2" strokeDasharray="5 3" strokeLinecap="round" />
                </svg>
              </div>

              <div>
                <div style={{ fontSize: 11.5, fontWeight: 620, color: 'var(--muted)', marginBottom: 8 }}>
                  Phân tích từng từ &amp; âm vị IPA (bấm vào từ để nghe + xem khẩu hình):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.words.map((w, idx) => {
                    const color =
                      w.status === 'ok' ? 'var(--green)' : w.status === 'warn' ? 'var(--amber)' : 'var(--rose)';
                    return (
                      <button
                        key={`${w.word}-${idx}`}
                        type="button"
                        onClick={() => {
                          speakEnglish(w.word, { accent: track.accent, rate: 0.85 });
                          const tokens = tokenizeIpa(wordToIpa(w.word));
                          if (tokens[0]) setInspectedPhoneme(tokens[0]);
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 10,
                          border: '1px solid var(--line)',
                          background: 'var(--raised)',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ fontWeight: 650, fontSize: 13, color }}>{w.word}</div>
                        <div className="mono" style={{ fontSize: 10.5, color: 'var(--muted)' }}>
                          {w.ipa} · {w.score}%
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <div style={{ fontSize: 11.5, fontWeight: 650, marginBottom: 6 }}>
                  Giải phẫu Nối âm &amp; Nuốt âm (Connected Speech — Coach Shane Method):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {track.connectedSpeechBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 9,
                        background: 'var(--raised)',
                        border: '1px solid var(--line)',
                        fontSize: 11.5,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{item.raw}</span>{' '}
                      <span className="mono" style={{ color: 'var(--cyan)' }}>{item.naturalIpa}</span>
                      <div style={{ color: 'var(--muted)', marginTop: 2 }}>{item.ruleVi}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="panel">
                <div className="ph">
                  <b>Chỉ số Phát âm GOP &amp; IELTS</b>
                  <span className="tag" style={{ color: 'var(--cyan)', background: 'var(--cyan-s)' }}>
                    IELTS ~ {result.ieltsBandEstimate}
                  </span>
                </div>

                <div
                  style={{
                    borderRadius: 12,
                    background: 'var(--raised)',
                    border: '1px solid var(--line)',
                    padding: '10px 12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div className="u-col">
                    <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Tổng điểm</div>
                    <div className="kpi-val ok" style={{ fontSize: 18 }}>{result.overallScore}%</div>
                  </div>
                  <div className="u-col">
                    <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Chính xác</div>
                    <div className="kpi-val" style={{ fontSize: 18 }}>{result.accuracy}%</div>
                  </div>
                  <div className="u-col">
                    <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Trôi chảy</div>
                    <div className="kpi-val" style={{ fontSize: 18 }}>{result.fluency}%</div>
                  </div>
                  <div className="u-col">
                    <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Ngữ điệu</div>
                    <div className="kpi-val" style={{ fontSize: 18 }}>{result.intonation}%</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label htmlFor="shadowing-spoken-input" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                    Bản ghi âm nhận diện (hoặc nhập câu đọc thử để chấm điểm IPA):
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <input
                      id="shadowing-spoken-input"
                      name="shadowing-spoken-input"
                      className="input-field"
                      style={{ flex: '1 1 180px', minWidth: 0 }}
                      value={spokenText}
                      onChange={(e) => setSpokenText(e.target.value)}
                      placeholder="VD: We design dis architecture to be resilien..."
                    />
                    <button
                      type="button"
                      className="gb"
                      onClick={() => stopRecordingAndScore(spokenText)}
                    >
                      Chấm điểm
                    </button>
                  </div>
                  {micNote && <div style={{ fontSize: 11, color: 'var(--amber)' }}>{micNote}</div>}
                </div>
              </div>

              <VocalTractSVG phoneme={inspectedPhoneme} />

              <div className="panel">
                <div className="ph">
                  <b>Sửa khẩu hình Âm vị yếu</b>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.weakPhonemes.length > 0 ? (
                    result.weakPhonemes.map((wp) => (
                      <button
                        key={wp.symbol}
                        type="button"
                        onClick={() => setInspectedPhoneme(wp.symbol)}
                        style={{
                          textAlign: 'left',
                          padding: '8px 10px',
                          borderRadius: 10,
                          border: '1px solid var(--line)',
                          background: wp.status === 'low' ? 'var(--rose-s)' : 'var(--amber-s)',
                        }}
                      >
                        <div style={{ fontWeight: 650, fontSize: 12 }}>
                          Âm <span className="mono">/{wp.symbol}/</span> · {wp.score}% (bấm xem khoang miệng)
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{wp.tipVi}</div>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: 10, borderRadius: 10, background: 'var(--green-s)', color: 'var(--green)', fontSize: 12 }}>
                      Xuất sắc! Toàn bộ âm vị trong câu đều đạt ngưỡng bản xứ (&ge; 85%).
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="filters" style={{ marginBottom: 0 }}>
            {MINIMAL_PAIRS_DATA.map((mp, idx) => (
              <button
                key={mp.id}
                type="button"
                className={`fp ${idx === mpIdx ? 'on' : ''}`}
                onClick={() => {
                  setMpIdx(idx);
                  setQuizPairIdx(0);
                  setQuizFeedback(null);
                  setInspectedPhoneme(mp.phonemeA);
                }}
              >
                <span className="mono" style={{ fontWeight: 700 }}>{mp.title}</span>
              </button>
            ))}
          </div>

          <div className="split-2">
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="ph" style={{ marginBottom: 0 }}>
                <div>
                  <b>{contrast.title}</b>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{contrast.learnerPainPointVi}</div>
                </div>
              </div>

              <div style={{ padding: 11, borderRadius: 10, background: 'var(--raised)', border: '1px solid var(--line)', fontSize: 12 }}>
                <b>Khác biệt khẩu hình:</b> {contrast.mouthContrastVi}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {contrast.pairs.map((p, idx) => (
                  <div
                    key={idx}
                    className="u-box"
                    style={{
                      borderColor: idx === quizPairIdx ? 'var(--cyan)' : undefined,
                    }}
                  >
                    <button
                      type="button"
                      className="u-col"
                      style={{ textAlign: 'left' }}
                      onClick={() => {
                        setInspectedPhoneme(contrast.phonemeA);
                        speakEnglish(`${p.wordA}. ${p.sentenceA}`);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b style={{ fontSize: 14, color: 'var(--cyan)' }}>{p.wordA}</b>
                        <span className="mono" style={{ fontSize: 11 }}>{p.ipaA}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{p.meaningViA}</div>
                    </button>

                    <button
                      type="button"
                      className="u-col"
                      style={{ textAlign: 'left' }}
                      onClick={() => {
                        setInspectedPhoneme(contrast.phonemeB);
                        speakEnglish(`${p.wordB}. ${p.sentenceB}`);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b style={{ fontSize: 14, color: 'var(--indigo)' }}>{p.wordB}</b>
                        <span className="mono" style={{ fontSize: 11 }}>{p.ipaB}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{p.meaningViB}</div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`gb ${inspectedPhoneme === contrast.phonemeA ? 'hl' : ''}`}
                  style={{ flex: '1 1 140px', justifyContent: 'center' }}
                  onClick={() => setInspectedPhoneme(contrast.phonemeA)}
                >
                  Xem khẩu hình /{contrast.phonemeA}/
                </button>
                <button
                  type="button"
                  className={`gb ${inspectedPhoneme === contrast.phonemeB ? 'hl' : ''}`}
                  style={{ flex: '1 1 140px', justifyContent: 'center' }}
                  onClick={() => setInspectedPhoneme(contrast.phonemeB)}
                >
                  Xem khẩu hình /{contrast.phonemeB}/
                </button>
              </div>

              <VocalTractSVG phoneme={inspectedPhoneme} />

              <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="ph" style={{ marginBottom: 0 }}>
                  <b>Bài Test Tai Nghe Phân Biệt Âm</b>
                  <button
                    type="button"
                    className="gb sm"
                    onClick={() => {
                      setQuizPairIdx((i) => (i + 1) % contrast.pairs.length);
                      setQuizFeedback(null);
                    }}
                  >
                    Đổi cặp từ
                  </button>
                </div>

                <button type="button" className="pb" onClick={playBlindMinimalWord}>
                  <IconVolume size={14} />
                  <span>Phát ngẫu nhiên ({activePair.wordA} / {activePair.wordB})</span>
                </button>

                <div className="grid2">
                  <button type="button" className="gb" style={{ justifyContent: 'center', height: 40 }} onClick={() => checkMinimalChoice('A')}>
                    Nghe thấy: <b>{activePair.wordA}</b> ({activePair.ipaA})
                  </button>
                  <button type="button" className="gb" style={{ justifyContent: 'center', height: 40 }} onClick={() => checkMinimalChoice('B')}>
                    Nghe thấy: <b>{activePair.wordB}</b> ({activePair.ipaB})
                  </button>
                </div>

                {quizFeedback && (
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: 9,
                      background: quizFeedback.startsWith('Chuẩn') ? 'var(--green-s)' : 'var(--rose-s)',
                      color: quizFeedback.startsWith('Chuẩn') ? 'var(--green)' : 'var(--rose)',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {quizFeedback}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
