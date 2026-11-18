import React, { useEffect, useMemo, useState } from 'react';
import { WRITING_PROMPTS, type WritingPrompt } from '../../data/writingPrompts';
import { searchLudwigCorpus } from '../../data/ludwigCorpus';
import { evaluateWriting, type WritingEvaluationResult } from '../../core/ai/writingEvaluator';
import { playSuccessSound } from '../../core/phonetics/soundEffects';
import { IconClock, IconSearch, IconSparkChat } from '../icons/Icons';

interface WritingStudioViewProps {
  onRecordWritingMinutes: (mins: number) => void;
  onSavePhraseToFsrs: (word: string, meaningVi: string, sentence: string) => void;
  onShowToast: (msg: string) => void;
}

export const WritingStudioView: React.FC<WritingStudioViewProps> = ({
  onRecordWritingMinutes,
  onSavePhraseToFsrs,
  onShowToast,
}) => {
  const [promptIdx, setPromptIdx] = useState(0);
  const [essay, setEssay] = useState(WRITING_PROMPTS[0].starterDraft);
  const [evaluation, setEvaluation] = useState<WritingEvaluationResult | null>(null);
  const [showModels, setShowModels] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WRITING_PROMPTS[0].timeLimitMin * 60);
  const [ludwigQuery, setLudwigQuery] = useState('mitigate * risk');

  const prompt: WritingPrompt = WRITING_PROMPTS[promptIdx] ?? WRITING_PROMPTS[0];

  useEffect(() => {
    if (!timerActive) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerActive]);

  const handleSelectPrompt = (idx: number) => {
    setPromptIdx(idx);
    const next = WRITING_PROMPTS[idx];
    setEssay(next.starterDraft);
    setEvaluation(null);
    setTimerActive(false);
    setSecondsLeft(next.timeLimitMin * 60);
  };

  const wordCount = useMemo(
    () => (essay.trim() ? essay.trim().split(/\s+/).filter(Boolean).length : 0),
    [essay]
  );

  const ludwigResults = useMemo(() => searchLudwigCorpus(ludwigQuery), [ludwigQuery]);

  const handleEvaluate = () => {
    const res = evaluateWriting(essay, prompt);
    setEvaluation(res);
    onRecordWritingMinutes(4);
    playSuccessSound();
    onShowToast(`Điểm Writing ước tính: Band ${res.overallBand.toFixed(1)}`);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Prompt Selector */}
      <div className="filters" style={{ marginBottom: 0 }}>
        {WRITING_PROMPTS.map((p, idx) => (
          <button
            key={p.id}
            type="button"
            className={`fp ${idx === promptIdx ? 'on' : ''}`}
            onClick={() => handleSelectPrompt(idx)}
          >
            <span>{p.category}: {p.title.slice(0, 26)}...</span>
            <span className="tag">{p.cefr}</span>
          </button>
        ))}
      </div>

      {/* Split-Pane Exam Canvas (Cambridge Write & Improve + IELTS Simulator) */}
      <div className="split-2">
        {/* Left Pane: Prompt, 4-Part Outline, Band 8 Lexicon & Ludwig Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

            <div style={{ padding: 12, borderRadius: 12, background: 'var(--raised)', border: '1px solid var(--line)', fontSize: 13, lineHeight: 1.55 }}>
              {prompt.promptText}
            </div>

            <div>
              <div style={{ fontSize: 11.5, fontWeight: 620, color: 'var(--muted)', marginBottom: 5 }}>
                Dàn ý gợi ý (4 bước chuẩn Band 8.0+):
              </div>
              <ul style={{ paddingLeft: 18, fontSize: 12, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                    onClick={() => setEssay((prev) => `${prev.trim()} ${lex.phrase}`)}
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
                className="input-field"
                style={{ flex: 1 }}
                value={ludwigQuery}
                onChange={(e) => setLudwigQuery(e.target.value)}
                placeholder="VD: mitigate * risk, depend on vs depend of, strike a * balance..."
              />
            </div>

            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {['mitigate * risk', 'depend on vs depend of', 'discuss vs discuss about', 'strike a * balance'].map((preset) => (
                <button key={preset} type="button" className="gb sm" onClick={() => setLudwigQuery(preset)}>
                  {preset}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {ludwigResults.map((entry) => (
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
                    <b style={{ fontSize: 12, color: 'var(--green)' }}>{entry.preferredPhrase}</b>
                    <span className="tag">{entry.preferredFreqPct}% chuẩn</span>
                  </div>
                  {entry.alternativePhrase && (
                    <div style={{ fontSize: 11, color: 'var(--rose)', marginTop: 2 }}>
                      Tránh: {entry.alternativePhrase} ({entry.alternativeFreqPct}%)
                    </div>
                  )}
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>{entry.explanationVi}</div>
                  {entry.examples[0] && (
                    <div style={{ fontSize: 11, marginTop: 4 }}>
                      <span className="tag" style={{ marginRight: 6 }}>{entry.examples[0].source}</span>
                      <span>{entry.examples[0].sentence}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Editor, Timer, 4-Criteria Score, In-Line Diff & Model Comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="tag" style={{ color: wordCount >= prompt.minWords ? 'var(--green)' : 'var(--amber)' }}>
                  {wordCount} / {prompt.minWords} từ
                </span>
                <button
                  type="button"
                  className={`gb sm ${timerActive ? 'hl' : ''}`}
                  onClick={() => setTimerActive((t) => !t)}
                >
                  <IconClock size={12} />
                  <span className="mono">{mm}:{ss}</span>
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="gb sm" onClick={() => setEssay(prompt.modelBand85)}>
                  Nạp thử bài Band 8.5
                </button>
                <button type="button" className="gb sm" onClick={() => setShowModels((m) => !m)}>
                  {showModels ? 'Ẩn bài mẫu' : 'So sánh Band 6.5 vs 8.5'}
                </button>
              </div>
            </div>

            <textarea
              className="textarea-field"
              rows={9}
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Viết bài luận hoặc Engineering RFC tại đây..."
              style={{ lineHeight: 1.6, fontSize: 13 }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                Thử giữ câu mẫu có lỗi (&ldquo;I am agree&rdquo;, &ldquo;discuss about&rdquo;) để xem In-Line Diff.
              </span>
              <button type="button" className="pb" onClick={handleEvaluate}>
                <IconSparkChat size={14} />
                <span>Chấm điểm IELTS &amp; Diff</span>
              </button>
            </div>
          </div>

          {evaluation && (
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="ph" style={{ marginBottom: 0 }}>
                <div>
                  <b>Kết quả Cambridge Write &amp; Improve</b>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{evaluation.coachSummaryVi}</div>
                </div>
                <span className="tag" style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)', background: 'var(--cyan-s)' }}>
                  Band {evaluation.overallBand.toFixed(1)}
                </span>
              </div>

              <div className="u-box" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <span style={{ color: 'var(--rose)', textDecoration: 'line-through', marginRight: 8 }}>
                            {d.originalSpan}
                          </span>
                          <span style={{ color: 'var(--green)', fontWeight: 650 }}>→ {d.replacement}</span>
                        </div>
                        <button
                          type="button"
                          className="gb sm"
                          onClick={() => {
                            const firstOpt = d.replacement.split('/')[0].trim();
                            setEssay((prev) => prev.replace(d.originalSpan, firstOpt));
                            onSavePhraseToFsrs(firstOpt, d.reasonVi, `${firstOpt} (${prompt.title})`);
                          }}
                        >
                          Áp dụng &amp; Lưu
                        </button>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{d.reasonVi}</div>
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
