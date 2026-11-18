import React, { useMemo, useState } from 'react';
import { READER_ARTICLES, READER_GLOSSARY, type ReaderArticle } from '../../data/readerArticles';
import { analyzeSentenceSyntax, type SyntaxClause } from '../../core/ai/tutorService';
import { wordToIpa } from '../../core/phonetics/ipaScorer';
import { speakEnglish } from '../../core/phonetics/speechIO';
import { IconPlus, IconVolume } from '../icons/Icons';

interface ImmersiveReaderProps {
  wordFamiliarity: Record<string, 1 | 2 | 3 | 4 | 5>;
  onSetWordFamiliarity: (word: string, level: 1 | 2 | 3 | 4 | 5) => void;
  onMineSentence: (payload: {
    word: string;
    ipa: string;
    meaningVi: string;
    clozeSentence: string;
    translationVi: string;
    sourceTitle: string;
  }) => void;
  onShowToast: (msg: string) => void;
}

export const ImmersiveReader: React.FC<ImmersiveReaderProps> = ({
  wordFamiliarity,
  onSetWordFamiliarity,
  onMineSentence,
  onShowToast,
}) => {
  const [articles, setArticles] = useState<ReaderArticle[]>(READER_ARTICLES);
  const [activeId, setActiveId] = useState(READER_ARTICLES[0].id);
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

  const article = useMemo(
    () => articles.find((a) => a.id === activeId) ?? articles[0],
    [articles, activeId]
  );

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

    const custom: ReaderArticle = {
      id: `custom-${Date.now()}`,
      kind: 'YouTube Transcript',
      title: importTitle.trim() || 'Ngữ liệu nhập tùy chỉnh',
      source: 'Imported Article / YouTube Subtitles',
      cefr: 'B2',
      minutes: Math.max(2, Math.ceil(lines.length / 3)),
      sentences: lines.map((line, i) => ({
        id: `cs-${i}`,
        timestamp: `00:${String(i * 12).padStart(2, '0')}`,
        en: line,
        vi: 'Bản dịch ngữ cảnh — bấm vào từng từ để tra nghĩa và đào câu sang FSRS.',
      })),
    };
    setArticles((prev) => [custom, ...prev]);
    setActiveId(custom.id);
    setImportTitle('');
    setImportBody('');
    setShowImport(false);
    onShowToast('Đã nạp ngữ liệu mới vào Immersive Reader');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Article Selector + Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div className="filters" style={{ marginBottom: 0 }}>
          {articles.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`fp ${a.id === article.id ? 'on' : ''}`}
              onClick={() => {
                setActiveId(a.id);
                setInspectedWord(null);
              }}
            >
              <span>{a.kind}</span>
              <span className="tag">{a.cefr}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className={`gb ${blurVi ? 'hl' : ''}`}
            onClick={() => setBlurVi((v) => !v)}
          >
            {blurVi ? 'Hiện phụ đề Việt' : 'Làm mờ phụ đề Việt'}
          </button>
          <button type="button" className="pb" onClick={() => setShowImport((v) => !v)}>
            <IconPlus size={14} />
            <span>Nhập bài / Transcript</span>
          </button>
        </div>
      </div>

      {showImport && (
        <form onSubmit={handleImportSubmit} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontWeight: 650 }}>Dán nội dung YouTube Transcript, Podcast hoặc Bài báo tiếng Anh</div>
          <input
            className="input-field"
            placeholder="Tiêu đề bài đọc / Video..."
            value={importTitle}
            onChange={(e) => setImportTitle(e.target.value)}
          />
          <textarea
            className="textarea-field"
            rows={4}
            required
            placeholder="Dán đoạn văn tiếng Anh tại đây. Hệ thống sẽ tự tách câu để bấm tra từ và phân tích Syntax X-Ray..."
            value={importBody}
            onChange={(e) => setImportBody(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="gb" onClick={() => setShowImport(false)}>
              Đóng
            </button>
            <button type="submit" className="pb">
              Phân tích ngữ liệu
            </button>
          </div>
        </form>
      )}

      <div className="split-2">
        {/* Left: Bilingual Interactive Sentences */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="ph" style={{ marginBottom: 0 }}>
            <div>
              <b>{article.title}</b>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {article.source} · ~{article.minutes} phút đọc · Bấm từng từ để tra nghĩa &amp; đào câu
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
            {article.sentences.map((sent) => (
              <div
                key={sent.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--line)',
                  background: 'var(--raised)',
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
                      onClick={() => {
                        setXraySentence(sent.en);
                        setXrayClauses(analyzeSentenceSyntax(sent.en));
                      }}
                    >
                      Grammar X-Ray
                    </button>
                    <button
                      type="button"
                      className="ib sm"
                      onClick={() => speakEnglish(sent.en)}
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
                        onClick={() => {
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
            ))}
          </div>
        </div>

        {/* Right: 364px Liquid Glass Word Popover + AI Syntax X-Ray */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
          {inspectedWord && inspectedGloss ? (
            <div className="pop-float" style={{ width: '100%', maxWidth: 364 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{inspectedGloss.key}</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--cyan)' }}>
                    {inspectedGloss.ipa} · {inspectedGloss.pos}
                  </div>
                </div>
                <button type="button" className="ib" onClick={() => speakEnglish(inspectedGloss.key)}>
                  <IconVolume size={16} />
                </button>
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
                Bấm vào bất kỳ từ tiếng Anh nào trong bài đọc bên trái để mở thẻ tra từ kính mờ, đánh dấu 5 cấp độ thuộc từ và đào nguyên câu vào FSRS.
              </div>
            </div>
          )}

          {/* Grammar X-Ray Panel */}
          <div className="panel" style={{ width: '100%' }}>
            <div className="ph">
              <b>AI Syntax &amp; Grammar X-Ray</b>
            </div>
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
                Bấm nút <b>Grammar X-Ray</b> ở bất kỳ câu nào để bóc tách Mệnh đề chính, Mệnh đề quan hệ và Cụm trạng ngữ.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
