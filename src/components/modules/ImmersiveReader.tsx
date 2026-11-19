import React, { useEffect, useMemo, useState } from 'react';
import { READER_ARTICLES, READER_GLOSSARY, type ReaderArticle } from '../../data/readerArticles';
import { analyzeSentenceSyntax, type SyntaxClause } from '../../core/ai/tutorService';
import { wordToIpa } from '../../core/phonetics/ipaScorer';
import { speakEnglish } from '../../core/phonetics/speechIO';
import { playSuccessSound } from '../../core/phonetics/soundEffects';
import { IconPlus, IconSparkChat, IconVolume } from '../icons/Icons';

interface ImmersiveReaderProps {
  wordFamiliarity: Record<string, 1 | 2 | 3 | 4 | 5>;
  customArticles?: ReaderArticle[];
  onAddCustomArticle?: (article: ReaderArticle) => void;
  onSetWordFamiliarity: (word: string, level: 1 | 2 | 3 | 4 | 5) => void;
  onMineSentence: (payload: {
    word: string;
    ipa: string;
    meaningVi: string;
    clozeSentence: string;
    translationVi: string;
    sourceTitle: string;
  }) => void;
  onDiscussWithTutor: (question: string) => void;
  onShowToast: (msg: string) => void;
}

export const ImmersiveReader: React.FC<ImmersiveReaderProps> = ({
  wordFamiliarity,
  customArticles = [],
  onAddCustomArticle,
  onSetWordFamiliarity,
  onMineSentence,
  onDiscussWithTutor,
  onShowToast,
}) => {
  const [localAddedArticles, setLocalAddedArticles] = useState<ReaderArticle[]>([]);
  const articles = useMemo(() => {
    const merged = [...customArticles, ...localAddedArticles, ...READER_ARTICLES];
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [customArticles, localAddedArticles]);

  const [activeId, setActiveId] = useState(articles[0]?.id ?? READER_ARTICLES[0].id);
  const [lessonStep, setLessonStep] = useState<1 | 2 | 3 | 4>(2);
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(0);
  const [blurVi, setBlurVi] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importTitle, setImportTitle] = useState('');
  const [importBody, setImportBody] = useState('');

  const [inspectedWord, setInspectedWord] = useState<{
    word: string;
    sentenceEn: string;
    sentenceVi: string;
  } | null>(null);

  const [xraySentence, setXraySentence] = useState<string | null>(null);
  const [xrayClauses, setXrayClauses] = useState<SyntaxClause[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  const article = useMemo(
    () => articles.find((a) => a.id === activeId) ?? articles[0],
    [articles, activeId]
  );

  // Language Reactor style keyboard shortcuts A (prev), S (speak), D (next)
  useEffect(() => {
    if (lessonStep !== 2) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.metaKey || e.ctrlKey) return;
      const k = e.key.toLowerCase();
      if (k === 'a') {
        e.preventDefault();
        setActiveSentenceIdx((i) => Math.max(0, i - 1));
      } else if (k === 'd') {
        e.preventDefault();
        setActiveSentenceIdx((i) => Math.min(article.sentences.length - 1, i + 1));
      } else if (k === 's') {
        e.preventDefault();
        const s = article.sentences[activeSentenceIdx];
        if (s) speakEnglish(s.en);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lessonStep, article.sentences, activeSentenceIdx]);

  const inspectedGloss = useMemo(() => {
    if (!inspectedWord) return null;
    const key = inspectedWord.word.toLowerCase().replace(/[^a-z]/g, '');
    const known = READER_GLOSSARY[key];
    return {
      key,
      ipa: known?.ipa ?? `/${wordToIpa(key)}/`,
      pos: known?.pos ?? 'vocab',
      meaningVi: known?.meaningVi ?? `Từ vựng ngữ cảnh trong bài (${key})`,
      meaningEn: known?.meaningEn ?? 'Contextual vocabulary item mined from reader',
      collocation: known?.collocation ?? `${key} in context`,
      level: wordFamiliarity[key] ?? 2,
    };
  }, [inspectedWord, wordFamiliarity]);

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = importBody
      .split(/(?<=[.!?])\s+|\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 6);
    if (lines.length === 0) return;

    // Extract matching glossary words from the imported body for Step 1 Key Vocabulary
    const tokens = Array.from(
      new Set(
        importBody
          .toLowerCase()
          .split(/[^a-z]+/)
          .filter((w) => w.length >= 3)
      )
    );
    const matchedVocab = tokens
      .filter((w) => Boolean(READER_GLOSSARY[w]))
      .slice(0, 8)
      .map((w) => ({
        word: w,
        ipa: READER_GLOSSARY[w].ipa,
        pos: READER_GLOSSARY[w].pos,
        meaningVi: READER_GLOSSARY[w].meaningVi,
      }));

    const custom: ReaderArticle = {
      id: `custom-${Date.now()}`,
      kind: 'YouTube Transcript',
      title: importTitle.trim() || 'Ngữ liệu nhập tùy chỉnh',
      source: 'Imported Article / YouTube Subtitles',
      cefr: 'B2',
      minutes: Math.max(2, Math.ceil(lines.length / 3)),
      vocabPreview: matchedVocab,
      sentences: lines.map((line, i) => ({
        id: `cs-${i}`,
        timestamp: `00:${String(i * 12).padStart(2, '0')}`,
        en: line,
        vi: 'Bản dịch ngữ cảnh — bấm vào từng từ để tra nghĩa và đào câu sang FSRS.',
      })),
      comprehensionQuiz: [],
      discussionQuestions: ['What is the key takeaway from this imported text?'],
    };

    if (onAddCustomArticle) {
      onAddCustomArticle(custom);
    } else {
      setLocalAddedArticles((prev) => [custom, ...prev]);
    }
    setActiveId(custom.id);
    setActiveSentenceIdx(0);
    setLessonStep(2);
    setImportTitle('');
    setImportBody('');
    setShowImport(false);
    onShowToast('Đã nạp ngữ liệu mới vào Engoo 5-Step Reader');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Article Selector + Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div className="filters" style={{ marginBottom: 0 }}>
          {articles.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`fp ${a.id === article.id ? 'on' : ''}`}
              onClick={() => {
                setActiveId(a.id);
                setActiveSentenceIdx(0);
                setInspectedWord(null);
                setQuizAnswers({});
              }}
            >
              <span>{a.kind} · {a.title.slice(0, 22)}...</span>
              <span className="tag">{a.cefr}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className={`gb ${blurVi ? 'hl' : ''}`} onClick={() => setBlurVi((v) => !v)}>
            {blurVi ? 'Hiện phụ đề Việt' : 'Làm mờ phụ đề Việt'}
          </button>
          <button type="button" className="pb" onClick={() => setShowImport((v) => !v)}>
            <IconPlus size={14} />
            <span>Nhập bài / Transcript</span>
          </button>
        </div>
      </div>

      {/* Engoo 5-Step Lesson Stepper */}
      <div className="seg" style={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
        <button type="button" className={lessonStep === 1 ? 'on' : ''} onClick={() => setLessonStep(1)}>
          1. Key Vocabulary ({article.vocabPreview.length})
        </button>
        <button type="button" className={lessonStep === 2 ? 'on' : ''} onClick={() => setLessonStep(2)}>
          2. Đọc &amp; Nghe Song ngữ (A/S/D)
        </button>
        <button type="button" className={lessonStep === 3 ? 'on' : ''} onClick={() => setLessonStep(3)}>
          3. Comprehension Quiz ({article.comprehensionQuiz.length})
        </button>
        <button type="button" className={lessonStep === 4 ? 'on' : ''} onClick={() => setLessonStep(4)}>
          4. Thảo luận AI ({article.discussionQuestions.length})
        </button>
      </div>

      {showImport && (
        <form onSubmit={handleImportSubmit} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontWeight: 650 }}>Dán nội dung YouTube Transcript, Podcast hoặc Bài báo tiếng Anh</div>
          <input
            id="reader-import-title"
            name="importTitle"
            aria-label="Tiêu đề bài đọc hoặc video"
            className="input-field"
            placeholder="Tiêu đề bài đọc / Video..."
            value={importTitle}
            onChange={(e) => setImportTitle(e.target.value)}
          />
          <textarea
            id="reader-import-body"
            name="importBody"
            aria-label="Nội dung đoạn văn tiếng Anh để nạp vào Reader"
            className="textarea-field"
            rows={4}
            required
            placeholder="Dán đoạn văn tiếng Anh tại đây..."
            value={importBody}
            onChange={(e) => setImportBody(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="gb" onClick={() => setShowImport(false)}>Đóng</button>
            <button type="submit" className="pb">Phân tích ngữ liệu</button>
          </div>
        </form>
      )}

      {lessonStep === 1 && (
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="ph" style={{ marginBottom: 0, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <b>Bước 1 (Engoo Method): Nắm trước Từ vựng Trọng tâm</b>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                Nghe và làm quen trước các từ khóa học thuật xuất hiện trong bài &ldquo;{article.title}&rdquo;
              </div>
            </div>
            <button type="button" className="pb sm" onClick={() => setLessonStep(2)}>
              Sang Bước 2: Đọc bài →
            </button>
          </div>

          {article.vocabPreview.length === 0 ? (
            <div
              style={{
                padding: '14px',
                borderRadius: 12,
                background: 'var(--raised)',
                border: '1px solid var(--line)',
                fontSize: 12.5,
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span>
                Ngữ liệu nhập tự do chưa có sẵn danh sách từ khóa cố định. Chuyển sang Bước 2 để bấm trực tiếp vào bất kỳ từ nào và tự đào câu sang FSRS v5.
              </span>
              <button type="button" className="gb sm" onClick={() => setLessonStep(2)}>
                Mở Bước 2 →
              </button>
            </div>
          ) : (
            <div className="cards">
              {article.vocabPreview.map((v) => (
                <div key={v.word} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <b style={{ fontSize: 15 }}>{v.word}</b>{' '}
                      <span className="mono" style={{ color: 'var(--cyan)', fontSize: 12 }}>{v.ipa}</span>
                    </div>
                    <button
                      type="button"
                      className="ib sm"
                      aria-label={`Nghe phát âm từ ${v.word}`}
                      onClick={() => speakEnglish(v.word)}
                    >
                      <IconVolume size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: 12.5 }}>{v.meaningVi}</div>
                  <span className="tag" style={{ alignSelf: 'flex-start' }}>{v.pos}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {lessonStep === 2 && (
        <div className="split-2">
          {/* Left: Bilingual Interactive Sentences */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <div className="ph" style={{ marginBottom: 0, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <b>{article.title}</b>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {article.source} · Phím tắt: <kbd>A</kbd> Trước · <kbd>S</kbd> Nghe · <kbd>D</kbd> Tiếp
                </div>
              </div>
              <button
                type="button"
                className="gb sm"
                onClick={() => speakEnglish(article.sentences.map((s) => s.en).join(' '))}
              >
                <IconVolume size={13} />
                <span>Đọc toàn bài</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {article.sentences.map((sent, idx) => {
                const isActive = idx === activeSentenceIdx;
                return (
                  <div
                    key={sent.id}
                    onClick={() => setActiveSentenceIdx(idx)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: `1px solid ${isActive ? 'var(--cyan)' : 'var(--line)'}`,
                      background: isActive ? 'var(--sel)' : 'var(--raised)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span className="tag mono">{sent.timestamp}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="gb sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setXraySentence(sent.en);
                            setXrayClauses(analyzeSentenceSyntax(sent.en));
                          }}
                        >
                          Grammar X-Ray
                        </button>
                        <button
                          type="button"
                          className="ib sm"
                          aria-label={`Nghe câu số ${idx + 1}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            speakEnglish(sent.en);
                          }}
                          title="Nghe câu này"
                        >
                          <IconVolume size={13} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                      {sent.en.split(/(\s+)/).map((tok, i) => {
                        if (/^\s+$/.test(tok)) return tok;
                        const clean = tok.toLowerCase().replace(/[^a-z]/g, '');
                        const lv = wordFamiliarity[clean] ?? (READER_GLOSSARY[clean] ? 2 : 5);
                        return (
                          <span
                            key={i}
                            className={`w-tok lv${lv}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedWord({ word: tok, sentenceEn: sent.en, sentenceVi: sent.vi });
                              speakEnglish(clean || tok);
                            }}
                          >
                            {tok}
                          </span>
                        );
                      })}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--muted)',
                        filter: blurVi ? 'blur(5px)' : 'none',
                        transition: 'filter var(--dur-fast) var(--ease)',
                      }}
                    >
                      {sent.vi}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: 364px Liquid Glass Word Popover + AI Syntax X-Ray */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start', minWidth: 0 }}>
            {inspectedWord && inspectedGloss ? (
              <div className="pop-float reader-popover" style={{ width: '100%', maxWidth: 364 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{inspectedGloss.key}</div>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--cyan)' }}>
                      {inspectedGloss.ipa} · {inspectedGloss.pos}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      className="ib"
                      aria-label={`Nghe phát âm ${inspectedGloss.key}`}
                      onClick={() => speakEnglish(inspectedGloss.key)}
                    >
                      <IconVolume size={16} />
                    </button>
                    <button
                      type="button"
                      className="gb sm"
                      aria-label="Đóng thẻ tra từ"
                      onClick={() => setInspectedWord(null)}
                    >
                      Đóng
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{inspectedGloss.meaningVi}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{inspectedGloss.meaningEn}</div>
                <div style={{ fontSize: 11.5, color: 'var(--indigo)', marginBottom: 10 }}>
                  Collocation: {inspectedGloss.collocation}
                </div>

                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                  Mức độ thuộc từ (LingQ 1 → 5):
                </div>
                <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
                  {([1, 2, 3, 4, 5] as const).map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      className={`gb sm ${inspectedGloss.level === lv ? 'hl' : ''}`}
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => onSetWordFamiliarity(inspectedGloss.key, lv)}
                    >
                      {lv === 5 ? 'Known' : `Lv${lv}`}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="pb"
                  style={{ width: '100%' }}
                  onClick={() => {
                    const escaped = inspectedGloss.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const cloze = inspectedWord.sentenceEn.replace(
                      new RegExp(`\\b${escaped}\\b`, 'i'),
                      `{{${inspectedGloss.key}}}`
                    );
                    onMineSentence({
                      word: inspectedGloss.key,
                      ipa: inspectedGloss.ipa,
                      meaningVi: inspectedGloss.meaningVi,
                      clozeSentence: cloze,
                      translationVi: inspectedWord.sentenceVi,
                      sourceTitle: article.title,
                    });
                  }}
                >
                  <IconPlus size={14} />
                  <span>Mine Sentence sang FSRS v5</span>
                </button>
              </div>
            ) : (
              <div className="panel" style={{ width: '100%' }}>
                <div style={{ fontWeight: 650, marginBottom: 4 }}>Từ điển Popover 364px</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Bấm vào bất kỳ từ tiếng Anh nào trong bài đọc để mở thẻ tra từ kính mờ và đào nguyên câu sang FSRS.
                </div>
              </div>
            )}

            <div className="panel" style={{ width: '100%' }}>
              <div className="ph"><b>AI Syntax &amp; Grammar X-Ray</b></div>
              {xraySentence ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{xraySentence}</div>
                  {xrayClauses.map((cl, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid var(--line)',
                        background: 'var(--raised)',
                      }}
                    >
                      <span className="tag" style={{ color: 'var(--cyan)', background: 'var(--cyan-s)', marginBottom: 4 }}>
                        {cl.role}
                      </span>
                      <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4 }}>{cl.text}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{cl.explanationVi}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Bấm <b>Grammar X-Ray</b> ở từng câu để bóc tách Mệnh đề chính, Mệnh đề quan hệ và Cụm trạng ngữ.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {lessonStep === 3 && (
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="ph" style={{ marginBottom: 0, flexWrap: 'wrap', gap: 8 }}>
            <b>Bước 3: Kiểm tra Đọc hiểu (Reading Comprehension Quiz)</b>
            <button type="button" className="pb sm" onClick={() => setLessonStep(4)}>
              Sang Bước 4: Thảo luận AI →
            </button>
          </div>
          {article.comprehensionQuiz.length === 0 ? (
            <div
              style={{
                padding: '14px',
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'var(--raised)',
                fontSize: 12.5,
                color: 'var(--muted)',
              }}
            >
              Ngữ liệu nhập tùy chỉnh chưa có bộ câu hỏi trắc nghiệm. Bạn có thể chuyển sang Bước 4 để thảo luận nội dung bài viết với AI Tutor.
            </div>
          ) : (
            article.comprehensionQuiz.map((q, qIdx) => {
              const picked = quizAnswers[qIdx];
              return (
                <div
                  key={qIdx}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid var(--line)',
                    background: 'var(--raised)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ fontWeight: 650, fontSize: 13 }}>{qIdx + 1}. {q.q}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                            padding: '7px 10px',
                            textAlign: 'left',
                            borderColor: isPicked ? (isRight ? 'var(--green)' : 'var(--rose)') : undefined,
                            color: isPicked ? (isRight ? 'var(--green)' : 'var(--rose)') : undefined,
                          }}
                          onClick={() => {
                            setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
                            if (isRight) playSuccessSound();
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {picked !== undefined && (
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{q.explainVi}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {lessonStep === 4 && (
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="ph" style={{ marginBottom: 0 }}>
            <div>
              <b>Bước 4: Câu hỏi Thảo luận Mở (Engoo Discussion Flow)</b>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                Chọn một câu hỏi để luyện nói trả lời trực tiếp cùng Gia sư AI Tutor
              </div>
            </div>
          </div>
          {article.discussionQuestions.map((dq, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'var(--raised)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 560, flex: 1, minWidth: 220 }}>
                {idx + 1}. {dq}
              </div>
              <button type="button" className="pb sm" onClick={() => onDiscussWithTutor(dq)}>
                <IconSparkChat size={13} />
                <span>Thảo luận với AI Tutor</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
