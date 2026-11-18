import React, { useEffect, useState } from 'react';
import { ROLEPLAY_SCENARIOS, type RoleplayScenario } from '../../data/roleplayScenarios';
import {
  generateTutorReply,
  type AIConfig,
  type MemoryLedgerItem,
  type TurnCorrection,
} from '../../core/ai/tutorService';
import { speakEnglish, startSpeechCapture, triggerHaptic } from '../../core/phonetics/speechIO';
import { playSuccessSound } from '../../core/phonetics/soundEffects';
import { IconCheck, IconMic, IconPlus, IconSend, IconVolume } from '../icons/Icons';

interface ChatTurn {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  textVi?: string;
  correction?: TurnCorrection;
  memoryTriggered?: string;
}

interface AITutorViewProps {
  aiConfig: AIConfig;
  memoryLedger: MemoryLedgerItem[];
  initialTopicPrompt?: string | null;
  onSaveWordToFsrs: (word: string, contextSentence: string) => void;
  onRecordPracticeMinutes: (mins: number) => void;
  onShowToast: (msg: string) => void;
}

export const AITutorView: React.FC<AITutorViewProps> = ({
  aiConfig,
  memoryLedger,
  initialTopicPrompt,
  onSaveWordToFsrs,
  onRecordPracticeMinutes,
  onShowToast,
}) => {
  const [scenario, setScenario] = useState<RoleplayScenario>(ROLEPLAY_SCENARIOS[0]);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: ROLEPLAY_SCENARIOS[0].openingLine,
      textVi: ROLEPLAY_SCENARIOS[0].openingLineVi,
    },
  ]);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedExplainId, setExpandedExplainId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [handsFreeCall, setHandsFreeCall] = useState(false);
  const [ieltsSeconds, setIeltsSeconds] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (initialTopicPrompt) {
      setDraft(initialTopicPrompt);
    }
  }, [initialTopicPrompt]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setIeltsSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const handleSelectScenario = (sc: RoleplayScenario) => {
    setScenario(sc);
    setCompletedMissions([]);
    setTurns([
      {
        id: `init-${sc.id}`,
        sender: 'ai',
        text: sc.openingLine,
        textVi: sc.openingLineVi,
      },
    ]);
    setExpandedExplainId(null);
    setTimerRunning(false);
    setIeltsSeconds(60);
  };

  const handleVoiceMic = () => {
    if (listening) return;
    setListening(true);
    startSpeechCapture({
      onInterim: (txt) => setDraft(txt),
      onFinal: (txt) => {
        setListening(false);
        setDraft(txt);
        if (handsFreeCall && txt.trim()) {
          void handleSend(txt);
        }
      },
      onError: (err) => {
        setListening(false);
        onShowToast(`Voice capture: ${err}`);
      },
    });
  };

  const handleSend = async (overrideText?: string) => {
    const content = (overrideText ?? draft).trim();
    if (!content || loading) return;

    setDraft('');
    setLoading(true);
    const userTurnId = `u-${Date.now()}`;

    // Check 3-Star Missions against user utterance
    const lowerContent = content.toLowerCase();
    const newlyCompleted: string[] = [];
    scenario.missions.forEach((m) => {
      if (
        !completedMissions.includes(m.id) &&
        m.checkKeywords.some((kw) => lowerContent.includes(kw.toLowerCase()))
      ) {
        newlyCompleted.push(m.id);
      }
    });
    if (newlyCompleted.length > 0) {
      const updated = [...completedMissions, ...newlyCompleted];
      setCompletedMissions(updated);
      playSuccessSound();
      if (updated.length === scenario.missions.length) {
        onShowToast('Tuyệt vời! Bạn đã đạt đủ 3/3 Nhiệm vụ của kịch bản này!');
      }
    }

    const reply = await generateTutorReply({
      scenarioTitle: scenario.title,
      scenarioPrompt: `${scenario.roleAi} talking to ${scenario.roleUser}`,
      userText: content,
      memoryLedger,
      config: aiConfig,
    });

    const userTurn: ChatTurn = {
      id: userTurnId,
      sender: 'user',
      text: content,
      correction: reply.correction,
    };

    const aiTurn: ChatTurn = {
      id: `a-${Date.now() + 1}`,
      sender: 'ai',
      text: reply.aiText,
      textVi: reply.aiTextVi,
      memoryTriggered: reply.memoryTriggered,
    };

    setTurns((prev) => [...prev, userTurn, aiTurn]);
    setExpandedExplainId(userTurnId);
    setLoading(false);
    onRecordPracticeMinutes(3);
    speakEnglish(reply.aiText, {
      onEnd: () => {
        if (handsFreeCall) {
          handleVoiceMic();
        }
      },
    });
    triggerHaptic('light');
  };

  return (
    <div className="split-2">
      {/* Left: Conversation Thread, 3-Star Mission Checklist & Live Corrections */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 560 }}>
        <div className="ph" style={{ marginBottom: 0 }}>
          <div>
            <b>{scenario.title}</b>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              AI: {scenario.roleAi} · Bạn: {scenario.roleUser}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              className={`gb sm ${handsFreeCall ? 'hl' : ''}`}
              onClick={() => setHandsFreeCall((v) => !v)}
              title="Tự động bật mic nghe tiếp sau khi AI trả lời xong"
            >
              <IconMic size={12} />
              <span>{handsFreeCall ? 'Live Call: Bật' : 'Live Call'}</span>
            </button>
            <span className="tag">{scenario.level}</span>
          </div>
        </div>

        {/* Duolingo Max / Speak style 3-Star Mission Checklist */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 650, color: 'var(--cyan)' }}>
              3-Star Roleplay Missions ({completedMissions.length}/{scenario.missions.length})
            </span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {scenario.targetVocab.map((tv) => (
                <span key={tv} className="tag">{tv}</span>
              ))}
            </div>
          </div>
          {scenario.missions.map((m) => {
            const done = completedMissions.includes(m.id);
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11.5,
                  color: done ? 'var(--green)' : 'var(--muted)',
                }}
              >
                <span className={`chk ${done ? 'on' : ''}`} style={{ width: 14, height: 14 }}>
                  {done && <IconCheck size={10} />}
                </span>
                <span style={{ textDecoration: done ? 'line-through' : 'none' }}>{m.labelVi}</span>
              </div>
            );
          })}
        </div>

        {/* IELTS Part 2 Cue Card & Prep/Speak Timer */}
        {scenario.ieltsPart2Cue && (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--line)',
              background: 'var(--cyan-s)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <b style={{ fontSize: 12.5 }}>IELTS Speaking Part 2 Cue Card</b>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="tag mono">
                  {String(Math.floor(ieltsSeconds / 60)).padStart(2, '0')}:
                  {String(ieltsSeconds % 60).padStart(2, '0')}
                </span>
                <button type="button" className="gb sm" onClick={() => setTimerRunning((r) => !r)}>
                  {timerRunning ? 'Tạm dừng' : 'Chuẩn bị 1p'}
                </button>
                <button
                  type="button"
                  className="gb sm"
                  onClick={() => {
                    setIeltsSeconds(120);
                    setTimerRunning(true);
                  }}
                >
                  Nói 2p
                </button>
              </div>
            </div>
            <div style={{ fontWeight: 600, fontSize: 12.5 }}>{scenario.ieltsPart2Cue.topic}</div>
            <ul style={{ paddingLeft: 18, marginTop: 4, fontSize: 11.5, color: 'var(--muted)' }}>
              {scenario.ieltsPart2Cue.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4, maxHeight: 340 }}>
          {turns.map((t) => (
            <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                style={{
                  alignSelf: t.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  padding: '10px 13px',
                  borderRadius: 13,
                  border: '1px solid var(--line)',
                  background: t.sender === 'user' ? 'var(--sel)' : 'var(--raised)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 650, color: t.sender === 'ai' ? 'var(--cyan)' : 'var(--muted)' }}>
                    {t.sender === 'ai' ? scenario.roleAi : 'Bạn'}
                  </span>
                  <button type="button" className="ib sm" onClick={() => speakEnglish(t.text)} title="Nghe lại">
                    <IconVolume size={13} />
                  </button>
                </div>
                <div style={{ fontSize: 13 }}>{t.text}</div>
                {t.textVi && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>{t.textVi}</div>}
                {t.memoryTriggered && (
                  <div style={{ marginTop: 6 }}>
                    <span className="tag" style={{ color: 'var(--indigo)', background: 'var(--indigo-s)' }}>
                      AI Memory nhắc từ: {t.memoryTriggered}
                    </span>
                  </div>
                )}
              </div>

              {t.correction && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid var(--line)',
                    background: 'var(--panel)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 650, color: 'var(--muted)' }}>
                      Phân tích &amp; Nâng cấp C1 · Điểm: <b className="ok">{t.correction.score}/100</b>
                    </span>
                    <button
                      type="button"
                      className="gb sm hl"
                      onClick={() => setExpandedExplainId((cur) => (cur === t.id ? null : t.id))}
                    >
                      Explain My Mistake
                    </button>
                  </div>

                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>Câu gốc: </span>
                    {t.correction.highlightedIssues.map((seg, i) => (
                      <span
                        key={i}
                        style={
                          seg.isError
                            ? { color: 'var(--rose)', textDecoration: 'underline wavy var(--rose)', fontWeight: 620 }
                            : undefined
                        }
                      >
                        {seg.text}
                      </span>
                    ))}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--green)' }}>
                    <b>Sửa chuẩn:</b> {t.correction.corrected}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--indigo)' }}>
                    <b>Nâng cấp C1/Native:</b> {t.correction.c1Upgrade}
                  </div>

                  {expandedExplainId === t.id && (
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: 9,
                        background: 'var(--raised)',
                        fontSize: 11.5,
                        color: 'var(--muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div>{t.correction.explainVi}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span>Lưu nhanh vào FSRS:</span>
                        {t.correction.extractedVocab.map((w) => (
                          <button
                            key={w}
                            type="button"
                            className="gb sm"
                            onClick={() => onSaveWordToFsrs(w, t.correction!.c1Upgrade)}
                          >
                            <IconPlus size={11} />
                            <span>{w}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Suggested Expressions & Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {scenario.suggestedExpressions.map((expr) => (
              <button
                key={expr}
                type="button"
                className="gb sm"
                onClick={() => setDraft((prev) => (prev ? `${prev} ${expr}` : expr))}
              >
                + {expr}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="ib"
              style={{
                border: '1px solid var(--line)',
                color: listening ? 'var(--rose)' : undefined,
                background: listening ? 'var(--rose-s)' : 'var(--raised)',
              }}
              onClick={handleVoiceMic}
              title="Nói bằng Micro"
            >
              <IconMic size={15} />
            </button>
            <input
              className="input-field"
              style={{ flex: 1, height: 34 }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSend();
              }}
              placeholder="Nhập hoặc nói câu trả lời tiếng Anh để hoàn thành 3 nhiệm vụ..."
            />
            <button type="button" className="pb" disabled={loading} onClick={() => void handleSend()}>
              <IconSend size={13} />
              <span>{loading ? 'Đang phân tích...' : 'Gửi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right: 8 Scenarios & AI Memory Ledger */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="panel">
          <div className="ph">
            <b>Kịch bản Roleplay &amp; Pattern Drills ({ROLEPLAY_SCENARIOS.length})</b>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 340, overflowY: 'auto' }}>
            {ROLEPLAY_SCENARIOS.map((sc) => {
              const active = sc.id === scenario.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(sc)}
                  style={{
                    textAlign: 'left',
                    padding: '9px 11px',
                    borderRadius: 11,
                    border: `1px solid ${active ? 'var(--cyan)' : 'var(--line)'}`,
                    background: active ? 'var(--sel)' : 'var(--raised)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 620, fontSize: 12.5 }}>{sc.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {sc.category} · {sc.roleAi}
                    </div>
                  </div>
                  <span className="tag">{sc.level}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="ph">
            <div>
              <b>AI Long-Term Memory Ledger</b>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Gia sư AI ghi nhớ mục tiêu và lỗi sai cũ giữa các buổi học
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {memoryLedger.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '9px 11px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  background: 'var(--raised)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 620, fontSize: 12 }}>Mục tiêu: {m.targetVocab}</span>
                  <span className="tag" style={{ color: m.resolved ? 'var(--green)' : 'var(--amber)' }}>
                    {m.resolved ? 'Đã khắc phục' : 'Đang theo dõi'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                  Mẫu lỗi cần tránh: <span className="mono">{m.mistakePattern}</span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--dim)', marginTop: 2 }}>{m.userGoal}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
