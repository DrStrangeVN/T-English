import React, { useMemo, useState } from 'react';
import {
  CURRICULUM_UNITS,
  evaluatePlacementScore,
  PLACEMENT_TEST_QUESTIONS,
} from '../../data/curriculumData';
import { speakEnglish, triggerHaptic } from '../../core/phonetics/speechIO';
import { playSuccessSound } from '../../core/phonetics/soundEffects';
import { IconCheck, IconVolume } from '../icons/Icons';

interface CurriculumViewProps {
  completedUnitIds: string[];
  cefrLevel: string;
  onCompleteUnit: (unitId: string) => void;
  onSavePlacementLevel: (cefr: string) => void;
  onShowToast: (msg: string) => void;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  completedUnitIds,
  cefrLevel,
  onCompleteUnit,
  onSavePlacementLevel,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'units' | 'placement'>('units');
  const [unitIdx, setUnitIdx] = useState(0);
  const [drillInput, setDrillInput] = useState('');
  const [drillResult, setDrillResult] = useState<null | boolean>(null);
  const [quizChoices, setQuizChoices] = useState<Record<number, number>>({});

  const [placementAnswers, setPlacementAnswers] = useState<Record<string, number>>({});
  const [placementSubmitted, setPlacementSubmitted] = useState(false);

  const unit = CURRICULUM_UNITS[unitIdx] ?? CURRICULUM_UNITS[0];

  const answeredCount = Object.keys(placementAnswers).length;
  const allPlacementAnswered = answeredCount === PLACEMENT_TEST_QUESTIONS.length;

  const placementResult = useMemo(() => {
    let correct = 0;
    PLACEMENT_TEST_QUESTIONS.forEach((q) => {
      if (placementAnswers[q.id] === q.correctIdx) correct += 1;
    });
    return {
      correct,
      total: PLACEMENT_TEST_QUESTIONS.length,
      ...evaluatePlacementScore(correct, PLACEMENT_TEST_QUESTIONS.length),
    };
  }, [placementAnswers]);

  const handleCheckDrill = () => {
    const norm = (s: string) => s.trim().toLowerCase().replace(/[.!?]+$/g, '');
    const ok =
      unit.transformationDrill.acceptedAnswers.some((a) => norm(a) === norm(drillInput)) ||
      norm(drillInput).includes(norm(unit.transformationDrill.hintKeyword));
    setDrillResult(ok);
    if (ok) {
      playSuccessSound();
      triggerHaptic('success');
      onShowToast('Chính xác! Cấu trúc câu đã chuẩn bản xứ.');
    }
  };

  const allQuizCorrect = unit.quiz.every((q, idx) => quizChoices[idx] === q.answerIdx);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="seg">
          <button type="button" className={mode === 'units' ? 'on' : ''} onClick={() => setMode('units')}>
            Lộ trình CEFR A1 → C2 ({completedUnitIds.length}/{CURRICULUM_UNITS.length} Units)
          </button>
          <button type="button" className={mode === 'placement' ? 'on' : ''} onClick={() => setMode('placement')}>
            Kiểm tra Xếp lớp (12 câu)
          </button>
        </div>

        <span className="tag" style={{ color: 'var(--cyan)', background: 'var(--cyan-s)' }}>
          Trình độ hiện tại: CEFR {cefrLevel}
        </span>
      </div>

      {mode === 'units' ? (
        <div className="split-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <div className="filters" style={{ marginBottom: 0 }}>
              {CURRICULUM_UNITS.map((u, idx) => {
                const done = completedUnitIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    className={`fp ${idx === unitIdx ? 'on' : ''}`}
                    onClick={() => {
                      setUnitIdx(idx);
                      setDrillInput('');
                      setDrillResult(null);
                      setQuizChoices({});
                    }}
                  >
                    <span>Unit {u.unitNumber}: {u.cefr}</span>
                    {done && <IconCheck size={12} />}
                  </button>
                );
              })}
            </div>

            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="ph" style={{ marginBottom: 0 }}>
                <div>
                  <b>Unit {unit.unitNumber}: {unit.title}</b>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{unit.subtitleVi}</div>
                </div>
                <span className="tag">{unit.cefr} · {unit.estimatedMin}p</span>
              </div>

              <div style={{ padding: 12, borderRadius: 12, background: 'var(--raised)', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 10.5, fontWeight: 650, color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Grammar Blueprint Formula
                </div>
                <div className="mono" style={{ fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                  {unit.grammarBlueprint.formula}
                </div>
                <div style={{ fontSize: 12 }}>{unit.grammarBlueprint.usageVi}</div>
                <div style={{ fontSize: 11.5, color: 'var(--amber)', marginTop: 6 }}>
                  <b>Lỗi hay gặp:</b> {unit.grammarBlueprint.commonMistakeVi}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, fontWeight: 620, color: 'var(--muted)', marginBottom: 6 }}>
                  Mẫu câu trọng tâm (bấm để nghe phát âm chuẩn):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {unit.keyPatterns.map((pat, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid var(--line)',
                        background: 'var(--raised)',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5 }}>{pat.en}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{pat.vi}</div>
                      </div>
                      <button
                        type="button"
                        className="ib sm"
                        aria-label={`Nghe mẫu câu: ${pat.en}`}
                        onClick={() => speakEnglish(pat.en)}
                      >
                        <IconVolume size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label htmlFor="curriculum-drill-input" style={{ fontWeight: 650 }}>
                Bài tập Viết lại câu (Sentence Transformation)
              </label>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {unit.transformationDrill.promptEn}
              </div>
              <input
                id="curriculum-drill-input"
                name="curriculum-drill"
                className="input-field"
                value={drillInput}
                onChange={(e) => setDrillInput(e.target.value)}
                placeholder={`Gợi ý từ khóa: ${unit.transformationDrill.hintKeyword}...`}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="pb sm" onClick={handleCheckDrill}>
                  Kiểm tra câu
                </button>
                {drillResult !== null && (
                  <span style={{ fontSize: 12, fontWeight: 620, color: drillResult ? 'var(--green)' : 'var(--rose)' }}>
                    {drillResult ? 'Chuẩn xác!' : `Đáp án mẫu: "${unit.transformationDrill.acceptedAnswers[0]}"`}
                  </span>
                )}
              </div>
              {drillResult !== null && (
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  {unit.transformationDrill.explanationVi}
                </div>
              )}
            </div>

            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="ph" style={{ marginBottom: 0 }}>
                <b>Kiểm tra Hoàn thành Unit {unit.unitNumber}</b>
              </div>
              {unit.quiz.map((q, qIdx) => {
                const picked = quizChoices[qIdx];
                return (
                  <div
                    key={qIdx}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: '1px solid var(--line)',
                      background: 'var(--raised)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{q.q}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {q.options.map((opt, oIdx) => {
                        const isPicked = picked === oIdx;
                        const isRight = oIdx === q.answerIdx;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            className="gb sm"
                            style={{
                              justifyContent: 'flex-start',
                              height: 'auto',
                              padding: '6px 10px',
                              textAlign: 'left',
                              borderColor: isPicked ? (isRight ? 'var(--green)' : 'var(--rose)') : undefined,
                              color: isPicked ? (isRight ? 'var(--green)' : 'var(--rose)') : undefined,
                            }}
                            onClick={() => setQuizChoices((prev) => ({ ...prev, [qIdx]: oIdx }))}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {picked !== undefined && (
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{q.explainVi}</div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                className="pb"
                disabled={!allQuizCorrect}
                style={{ opacity: allQuizCorrect ? 1 : 0.55 }}
                onClick={() => {
                  onCompleteUnit(unit.id);
                  playSuccessSound();
                }}
              >
                <IconCheck size={14} />
                <span>
                  {completedUnitIds.includes(unit.id)
                    ? `Đã hoàn thành Unit ${unit.unitNumber}`
                    : `Hoàn thành Unit ${unit.unitNumber}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Adaptive Placement Test View */
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="ph" style={{ marginBottom: 0 }}>
            <div>
              <b>Bài Kiểm Tra Xếp Lớp CEFR A1 → C2 (12 Câu)</b>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                Hoàn thành đầy đủ 12 câu để đánh giá chính xác Ngữ pháp, Từ vựng, Phát âm và Đọc hiểu
              </div>
            </div>
            <span className="tag">
              Đã chọn {answeredCount}/{PLACEMENT_TEST_QUESTIONS.length}
            </span>
          </div>

          <div className="cards">
            {PLACEMENT_TEST_QUESTIONS.map((q, idx) => {
              const picked = placementAnswers[q.id];
              return (
                <div key={q.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="tag">Câu {idx + 1} · {q.skill}</span>
                    <span className="tag">{q.cefrWeight}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{q.question}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {q.options.map((opt, oIdx) => {
                      const isPicked = picked === oIdx;
                      const showCheck = placementSubmitted && oIdx === q.correctIdx;
                      const showWrong = placementSubmitted && isPicked && oIdx !== q.correctIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          className={`gb sm ${isPicked && !placementSubmitted ? 'hl' : ''}`}
                          style={{
                            justifyContent: 'flex-start',
                            height: 'auto',
                            padding: '6px 10px',
                            textAlign: 'left',
                            borderColor: showCheck ? 'var(--green)' : showWrong ? 'var(--rose)' : undefined,
                            color: showCheck ? 'var(--green)' : showWrong ? 'var(--rose)' : undefined,
                          }}
                          onClick={() =>
                            !placementSubmitted &&
                            setPlacementAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                          }
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {placementSubmitted && (
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{q.explanationVi}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            {!placementSubmitted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="pb"
                  disabled={!allPlacementAnswered}
                  style={{ opacity: allPlacementAnswered ? 1 : 0.5, cursor: allPlacementAnswered ? 'pointer' : 'not-allowed' }}
                  onClick={() => {
                    if (!allPlacementAnswered) return;
                    setPlacementSubmitted(true);
                    onSavePlacementLevel(placementResult.cefr);
                    playSuccessSound();
                  }}
                >
                  Nộp bài &amp; Xếp hạng CEFR
                </button>
                {!allPlacementAnswered && (
                  <span style={{ fontSize: 11.5, color: 'var(--amber)' }}>
                    Còn thiếu {PLACEMENT_TEST_QUESTIONS.length - answeredCount} câu chưa chọn đáp án.
                  </span>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>
                    Kết quả: {placementResult.correct}/{placementResult.total} câu đúng → CEFR {placementResult.cefr} (IELTS ~ {placementResult.ieltsEstimate})
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    {placementResult.recommendationVi}
                  </div>
                </div>
                <button
                  type="button"
                  className="gb"
                  onClick={() => {
                    setPlacementSubmitted(false);
                    setPlacementAnswers({});
                  }}
                >
                  Làm lại bài test
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
