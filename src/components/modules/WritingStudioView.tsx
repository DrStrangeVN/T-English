import React, { useEffect, useMemo, useState } from 'react';
import { WRITING_PROMPTS, type WritingPrompt } from '../../data/writingPrompts';
import { searchLudwigCorpus } from '../../data/ludwigCorpus';
import {
  evaluateWriting,
  evaluateWritingWithAI,
  type WritingEvaluationResult,
} from '../../core/ai/writingEvaluator';
import type { AIConfig } from '../../core/ai/tutorService';
import { playSuccessSound } from '../../core/phonetics/soundEffects';
import { IconClock, IconSearch, IconSparkChat } from '../icons/Icons';

interface WritingStudioViewProps {
  aiConfig?: AIConfig;
  writingDrafts?: Record<string, string>;
  onUpdateDraft?: (promptId: string, text: string) => void;
  onRecordWritingMinutes: (mins: number) => void;
  onSavePhraseToFsrs: (word: string, meaningVi: string, sentence: string) => void;
  onShowToast: (msg: string) => void;
}

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const WritingStudioView: React.FC<WritingStudioViewProps> = ({
  aiConfig,
  writingDrafts = {},
  onUpdateDraft,
  onRecordWritingMinutes,
  onSavePhraseToFsrs,
  onShowToast,
}) => {
  const [promptIdx, setPromptIdx] = useState(0);
  const initialPrompt = WRITING_PROMPTS[0];
  const [essay, setEssay] = useState(
    writingDrafts[initialPrompt.id] ?? initialPrompt.starterDraft
  );
  const [evaluation, setEvaluation] = useState<WritingEvaluationResult | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(initialPrompt.timeLimitMin * 60);
  const [ludwigQuery, setLudwigQuery] = useState('mitigate * risk');

  const prompt: WritingPrompt = WRITING_PROMPTS[promptIdx] ?? WRITING_PROMPTS[0];

  useEffect(() => {
    if (!timerActive) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerActive]);

  const updateEssayText = (nextText: string, targetPromptId: string = prompt.id) => {
    setEssay(nextText);
    onUpdateDraft?.(targetPromptId, nextText);
  };

  const handleSelectPrompt = (idx: number) => {
    setPromptIdx(idx);
    const next = WRITING_PROMPTS[idx] ?? WRITING_PROMPTS[0];
    setEssay(writingDrafts[next.id] ?? next.starterDraft);
    setEvaluation(null);
    setTimerActive(false);
    setSecondsLeft(next.timeLimitMin * 60);
  };

  const wordCount = useMemo(
    () => (essay.trim() ? essay.trim().split(/\s+/).filter(Boolean).length : 0),
    [essay]
  );

  const ludwigResults = useMemo(() => searchLudwigCorpus(ludwigQuery), [ludwigQuery]);

  const handleEvaluate = async () => {
    if (wordCount === 0 || isGrading) {
      if (wordCount === 0) onShowToast('Hãy viết nội dung bài luận trước khi chấm điểm.');
      return;
    }

    setIsGrading(true);
    try {
      const res = aiConfig
        ? await evaluateWritingWithAI(essay, prompt, aiConfig)
        : evaluateWriting(essay, prompt);
      setEvaluation(res);
      onRecordWritingMinutes(4);
      playSuccessSound();
      onShowToast(
        `Điểm Writing (${res.source === 'live' ? 'Live AI' : 'Offline Rubric'}): Band ${res.overallBand.toFixed(1)}`
      );
    } finally {
      setIsGrading(false);
    }
  };

  const handleApplyDiff = (originalSpan: string, replacement: string, reasonVi: string) => {
    const firstOpt = replacement.split('/')[0].trim();
    const pattern = new RegExp(escapeRegExp(originalSpan), 'i');
    const nextEssay = pattern.test(essay)
      ? essay.replace(pattern, firstOpt)
      : `${essay.trim()} ${firstOpt}`.trim();
    updateEssayText(nextEssay);
    onSavePhraseToFsrs(firstOpt, reasonVi, `${firstOpt} (${prompt.title})`);
    const updatedEval = evaluateWriting(nextEssay, prompt);
    setEvaluation(updatedEval);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Compact 1-Row Prompt Selector */}
      <div className="compact-picker">
        <div className="compact-picker-scroll">
          {WRITING_PROMPTS.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              className={`fp ${idx === promptIdx ? 'on' : ''}`}
              onClick={() => handleSelectPrompt(idx)}
            >
              <span>{p.category}: {p.title.slice(0, 24)}…</span>
              <span className="tag">{p.cefr}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Split-Pane Exam Canvas */}
      <div className="split-2">
        {/* Left Pane: Prompt, Outline, Lexicon & Ludwig Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="ph" style={{ marginBottom: 0 }}>
              <div>
                <b>{prompt.title}</b>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {prompt.category} · Tối thiểu {prompt.minWords} từ · Thời lượng {prompt.timeLimitMin}p
                </div>
              </div>
              <span className="tag">{prompt.cefr}</span>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: 'var(--raised)',
                border: '1px solid var(--line)',
                fontSize: 13.5,
                lineHeight: 1.6,
              }}
            >
              {prompt.promptText}
            </div>

            {prompt.chart && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: 'var(--raised)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 640, color: 'var(--cyan)' }}>
                  Biểu đồ Số liệu Task 1: {prompt.chart.caption}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {prompt.chart.series.map((row) => (
                    <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>{row.label}</span>
                        <b className="mono">
                          {row.value} {prompt.chart!.unit}
                          {row.secondary !== undefined ? ` · ${row.secondary} min/day` : ''}
                        </b>
                      </div>
                      <div className="bar" style={{ height: 7 }}>
                        <div
                          style={{
                            width: `${Math.min(100, row.value)}%`,
                            background: row.color || 'var(--cyan)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 11.5, fontWeight: 620, color: 'var(--muted)', marginBottom: 5 }}>
                Dàn ý gợi ý (4 bước chuẩn Band 8.0+):
              </div>
              <ul
                style={{
                  paddingLeft: 18,
                  fontSize: 12,
                  color: 'var(--muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {prompt.outlineVi.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ fontSize: 11.5, fontWeight: 620, color: 'var(--muted)', marginBottom: 6 }}>
                Cụm từ Band 8.0+ (bấm để chèn vào bài viết):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {prompt.band8Lexicon.map((lex) => (
                  <button
                    key={lex.phrase}
                    type="button"
                    className="gb sm"
                    title={lex.meaningVi}
                    onClick={() =>
                      updateEssayText(essay.trim() ? `${essay.trim()} ${lex.phrase}` : lex.phrase)
                    }
                  >
                    + {lex.phrase}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ludwig.guru Context & Collocation Engine */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="ph" style={{ marginBottom: 0 }}>
              <div>
                <b>Ludwig.guru Context Search</b>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Tra cứu cách viết chuẩn báo chí bằng toán tử <kbd>*</kbd> hoặc <kbd>vs</kbd>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconSearch size={14} />
              <input
                id="ludwig-search-input"
                name="ludwigQuery"
                aria-label="Tra cứu collocation Ludwig.guru"
                className="input-field"
                style={{ flex: 1 }}
                value={ludwigQuery}
                onChange={(e) => setLudwigQuery(e.target.value)}
                placeholder="VD: mitigate * risk, depend on vs depend of, strike a * balance..."
              />
            </div>

            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {[
                'mitigate * risk',
                'depend on vs depend of',
                'discuss vs discuss about',
                'strike a * balance',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="gb sm"
                  onClick={() => setLudwigQuery(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxHeight: 220,
                overflowY: 'auto',
              }}
            >
              {ludwigResults.length === 0 ? (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 10,
                    background: 'var(--raised)',
                    border: '1px solid var(--line)',
                    fontSize: 12,
                    color: 'var(--muted)',
                  }}
                >
                  Không tìm thấy mẫu collocation khớp với &ldquo;{ludwigQuery}&rdquo;. Thử từ khóa ngắn hơn hoặc chọn preset phía trên.
                </div>
              ) : (
                ludwigResults.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      padding: '9px 11px',
                      borderRadius: 10,
                      background: 'var(--raised)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <b style={{ fontSize: 12.5, color: 'var(--green)' }}>{entry.preferredPhrase}</b>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span className="tag">{entry.preferredFreqPct}% chuẩn</span>
                        <button
                          type="button"
                          className="gb sm"
                          onClick={() => {
                            const phrase = entry.preferredPhrase.split('/')[0].replace(/\[.*?\]/g, '').trim();
                            updateEssayText(essay.trim() ? `${essay.trim()} ${phrase}` : phrase);
                            onShowToast(`Đã chèn "${phrase}" vào bài viết`);
                          }}
                        >
                          + Chèn
                        </button>
                      </div>
                    </div>
                    {entry.alternativePhrase && (
                      <div style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>
                        Tránh: {entry.alternativePhrase} ({entry.alternativeFreqPct}%)
                      </div>
                    )}
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>
                      {entry.explanationVi}
                    </div>
                    {entry.examples[0] && (
                      <div style={{ fontSize: 11, marginTop: 4 }}>
                        <span className="tag" style={{ marginRight: 6 }}>{entry.examples[0].source}</span>
                        <span>{entry.examples[0].sentence}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Pane: Editor, Timer, 4-Criteria Score, In-Line Diff & Model Comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="tag"
                  style={{ color: wordCount >= prompt.minWords ? 'var(--green)' : 'var(--amber)' }}
                >
                  {wordCount} / {prompt.minWords} từ
                </span>
                <button
                  type="button"
                  aria-label="Bật tắt đồng hồ đếm ngược làm bài"
                  className={`gb sm ${timerActive ? 'hl' : ''}`}
                  onClick={() => setTimerActive((t) => !t)}
                >
                  <IconClock size={12} />
                  <span className="mono">{mm}:{ss}</span>
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="gb sm"
                  onClick={() => {
                    updateEssayText(prompt.modelBand85);
                    setEvaluation(null);
                  }}
                >
                  Nạp thử bài Band 8.5
                </button>
                <button
                  type="button"
                  className="gb sm"
                  onClick={() => setShowModels((m) => !m)}
                >
                  {showModels ? 'Ẩn bài mẫu' : 'So sánh Band 6.5 vs 8.5'}
                </button>
              </div>
            </div>

            <textarea
              id="writing-essay-editor"
              name="essay"
              aria-label="Soạn thảo bài viết IELTS hoặc RFC"
              className="textarea-field"
              rows={9}
              value={essay}
              onChange={(e) => updateEssayText(e.target.value)}
              placeholder="Viết bài luận hoặc Engineering RFC tại đây..."
              style={{ lineHeight: 1.6, fontSize: 13 }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                {wordCount === 0
                  ? 'Hãy nhập nội dung bài viết để mở khóa nút chấm điểm.'
                  : 'Thử giữ câu mẫu có lỗi ("I am agree", "discuss about") để xem In-Line Diff.'}
              </span>
              <button
                type="button"
                className="pb"
                disabled={wordCount === 0 || isGrading}
                onClick={handleEvaluate}
              >
                <IconSparkChat size={14} />
                <span>{isGrading ? 'Đang chấm điểm...' : 'Chấm điểm IELTS & Diff'}</span>
              </button>
            </div>
          </div>

          {evaluation && (
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="ph" style={{ marginBottom: 0, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <b>Kết quả Cambridge Write &amp; Improve</b>
                    <span
                      className="tag"
                      style={{
                        color: evaluation.source === 'live' ? 'var(--green)' : 'var(--muted)',
                        background: evaluation.source === 'live' ? 'var(--green-s)' : 'var(--raised)',
                      }}
                    >
                      {evaluation.source === 'live' ? 'Live AI' : 'Offline Rubric'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                    {evaluation.coachSummaryVi}
                  </div>
                  {evaluation.fallbackReason && (
                    <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 3 }}>
                      Chế độ Offline dự phòng: {evaluation.fallbackReason}
                    </div>
                  )}
                </div>
                <span
                  className="tag"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--cyan)',
                    background: 'var(--cyan-s)',
                  }}
                >
                  Band {evaluation.overallBand.toFixed(1)}
                </span>
              </div>

              <div
                className="u-box"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}
              >
                <div className="u-col">
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Task Response</div>
                  <div className="kpi-val" style={{ fontSize: 18 }}>{evaluation.taskResponse.toFixed(1)}</div>
                </div>
                <div className="u-col">
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Coherence</div>
                  <div className="kpi-val" style={{ fontSize: 18 }}>{evaluation.coherenceCohesion.toFixed(1)}</div>
                </div>
                <div className="u-col">
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Lexical</div>
                  <div className="kpi-val" style={{ fontSize: 18 }}>{evaluation.lexicalResource.toFixed(1)}</div>
                </div>
                <div className="u-col">
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Grammar</div>
                  <div className="kpi-val" style={{ fontSize: 18 }}>{evaluation.grammaticalRange.toFixed(1)}</div>
                </div>
              </div>

              {evaluation.inlineDiffs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 650 }}>In-Line Diff &amp; Nâng cấp Band 8.0+:</div>
                  {evaluation.inlineDiffs.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'var(--raised)',
                        border: '1px solid var(--line)',
                        fontSize: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <span
                            style={{
                              color: 'var(--rose)',
                              textDecoration: 'line-through',
                              marginRight: 8,
                            }}
                          >
                            {d.originalSpan}
                          </span>
                          <span style={{ color: 'var(--green)', fontWeight: 650 }}>
                            → {d.replacement}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="gb sm"
                          onClick={() => handleApplyDiff(d.originalSpan, d.replacement, d.reasonVi)}
                        >
                          Áp dụng &amp; Lưu
                        </button>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                        {d.reasonVi}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showModels && (
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <b>Đối chiếu Bài mẫu Band 6.5 vs Band 8.5</b>
              <div className="u-box">
                <div className="u-col">
                  <div style={{ fontSize: 11, fontWeight: 650, color: 'var(--amber)', marginBottom: 4 }}>
                    Band 6.5 (Câu đơn giản, lặp ý)
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{prompt.modelBand65}</div>
                </div>
                <div className="u-col">
                  <div style={{ fontSize: 11, fontWeight: 650, color: 'var(--green)', marginBottom: 4 }}>
                    Band 8.5 (Cấu trúc C1, Collocation sắc bén)
                  </div>
                  <div style={{ fontSize: 12 }}>{prompt.modelBand85}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
