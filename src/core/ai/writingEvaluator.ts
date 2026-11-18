import type { WritingPrompt } from '../../data/writingPrompts';

export interface WritingInlineDiff {
  id: string;
  originalSpan: string;
  replacement: string;
  category: 'Grammar' | 'Lexical Upgrade' | 'Cohesion';
  reasonVi: string;
}

export interface WritingEvaluationResult {
  overallBand: number;
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  wordCount: number;
  sentenceCount: number;
  academicWordRatio: number;
  cohesiveDeviceCount: number;
  inlineDiffs: WritingInlineDiff[];
  coachSummaryVi: string;
}

const COHESIVE_DEVICES = [
  'however',
  'moreover',
  'furthermore',
  'consequently',
  'nevertheless',
  'although',
  'whereas',
  'while',
  'therefore',
  'overall',
  'meanwhile',
  'additionally',
  'not only',
  'on the one hand',
  'on the other hand',
  'in conclusion',
  'conversely',
];

const ACADEMIC_WORDS = [
  'mitigate',
  'ubiquitous',
  'resilient',
  'pragmatic',
  'conducive',
  'proliferation',
  'latency',
  'bottleneck',
  'tradeoff',
  'eloquent',
  'unprecedented',
  'exacerbate',
  'sustainable',
  'trajectory',
  'conspicuous',
  'leverage',
  'consensus',
  'asynchronous',
  'architectural',
  'perspective',
  'compelling',
  'contend',
  'augment',
  'supplant',
  'paramount',
  'pivotal',
  'expenditure',
  'negligible',
  'pronounced',
  'deterministic',
  'intermittent',
];

const DIFF_RULES: Array<{
  pattern: RegExp;
  replacement: string;
  category: WritingInlineDiff['category'];
  reasonVi: string;
}> = [
  {
    pattern: /\bi am agree\b/gi,
    replacement: 'I firmly contend / I agree',
    category: 'Grammar',
    reasonVi: '"Agree" là động từ thường, tuyệt đối không đi với to-be "am". Nâng cấp C1: "I firmly contend".',
  },
  {
    pattern: /\bdiscuss about\b/gi,
    replacement: 'discuss / examine',
    category: 'Grammar',
    reasonVi: '"Discuss" là ngoại động từ không dùng kèm "about".',
  },
  {
    pattern: /\bin the other hand\b/gi,
    replacement: 'on the other hand',
    category: 'Cohesion',
    reasonVi: 'Thành ngữ đối chiếu chuẩn luôn dùng giới từ "on".',
  },
  {
    pattern: /\baccording to me\b/gi,
    replacement: 'from my perspective',
    category: 'Lexical Upgrade',
    reasonVi: 'Người bản xứ không viết "according to me" trong văn học thuật/IELTS.',
  },
  {
    pattern: /\bmore better\b/gi,
    replacement: 'substantially better / far more effective',
    category: 'Grammar',
    reasonVi: 'Không ghép "more" trước dạng so sánh hơn "better".',
  },
  {
    pattern: /\bvery good\b/gi,
    replacement: 'exceptionally compelling / highly effective',
    category: 'Lexical Upgrade',
    reasonVi: 'Tránh từ "very + tính từ đơn giản" để tăng điểm Lexical Resource lên Band 7.5+.',
  },
  {
    pattern: /\bvery important\b/gi,
    replacement: 'paramount / pivotal',
    category: 'Lexical Upgrade',
    reasonVi: 'Thay "very important" bằng "paramount" hoặc "pivotal" chuẩn C1.',
  },
  {
    pattern: /\bvery common\b/gi,
    replacement: 'ubiquitous / widespread',
    category: 'Lexical Upgrade',
    reasonVi: 'Dùng "ubiquitous" để nâng cấp vốn từ học thuật Band 8.0.',
  },
  {
    pattern: /\ba lot of\b/gi,
    replacement: 'a substantial number of / extensive',
    category: 'Lexical Upgrade',
    reasonVi: '"A lot of" hơi mang tính văn nói; văn viết chuẩn nên dùng "extensive" hoặc "a multitude of".',
  },
  {
    pattern: /\bwent down a lot\b/gi,
    replacement: 'exhibited a pronounced downward trajectory',
    category: 'Lexical Upgrade',
    reasonVi: 'Cụm mô tả số liệu Task 1 Band 8.0 thay thế hoàn hảo cho "went down a lot".',
  },
  {
    pattern: /\bhas a problem\b/gi,
    replacement: 'encounters a latency bottleneck',
    category: 'Lexical Upgrade',
    reasonVi: 'Diễn đạt chuyên sâu và cụ thể hơn trong báo cáo kỹ thuật/RFC.',
  },
];

function roundHalfBand(val: number): number {
  const clamped = Math.min(9.0, Math.max(4.0, val));
  return Math.round(clamped * 2) / 2;
}

export function evaluateWriting(text: string, prompt: WritingPrompt): WritingEvaluationResult {
  const clean = text.trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const sentences = clean
    ? clean
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2)
    : [];
  const sentenceCount = sentences.length;
  const lower = clean.toLowerCase();

  let cohesiveDeviceCount = 0;
  for (const dev of COHESIVE_DEVICES) {
    if (lower.includes(dev)) cohesiveDeviceCount += 1;
  }

  let academicHits = 0;
  for (const w of words) {
    const norm = w.toLowerCase().replace(/[^a-z]/g, '');
    if (ACADEMIC_WORDS.includes(norm)) academicHits += 1;
  }
  const academicWordRatio = wordCount > 0 ? Math.round((academicHits / wordCount) * 1000) / 10 : 0;

  const inlineDiffs: WritingInlineDiff[] = [];
  DIFF_RULES.forEach((rule, idx) => {
    const match = clean.match(rule.pattern);
    if (match) {
      inlineDiffs.push({
        id: `diff-${idx}`,
        originalSpan: match[0],
        replacement: rule.replacement,
        category: rule.category,
        reasonVi: rule.reasonVi,
      });
    }
  });

  // 1. Task Response (word coverage + prompt lexicon alignment)
  const coverageRatio = Math.min(1, wordCount / Math.max(80, prompt.minWords));
  const promptKeywordsUsed = prompt.band8Lexicon.filter((item) =>
    lower.includes(item.phrase.split(' ')[0].toLowerCase())
  ).length;
  const taskRaw = 5.0 + coverageRatio * 2.5 + Math.min(1.5, promptKeywordsUsed * 0.4);

  // 2. Coherence & Cohesion
  const avgSentenceLen = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const cohesionBonus = Math.min(2.0, cohesiveDeviceCount * 0.45);
  const structureBonus = avgSentenceLen >= 13 && avgSentenceLen <= 28 ? 1.0 : 0.4;
  const coherenceRaw = 5.0 + cohesionBonus + structureBonus;

  // 3. Lexical Resource
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ''))).size;
  const ttr = wordCount > 0 ? uniqueWords / wordCount : 0;
  const lexicalPenalty = inlineDiffs.filter((d) => d.category === 'Lexical Upgrade').length * 0.35;
  const lexicalRaw = 5.2 + Math.min(1.6, academicHits * 0.35) + (ttr > 0.58 ? 1.0 : 0.4) - lexicalPenalty;

  // 4. Grammatical Range & Accuracy
  const grammarErrors = inlineDiffs.filter((d) => d.category === 'Grammar').length;
  const hasComplexClause = /\b(although|while|whereas|which|that|because|not only|had we)\b/i.test(clean);
  const grammarRaw = 5.5 + (hasComplexClause ? 1.5 : 0.4) + (sentenceCount >= 3 ? 0.6 : 0) - grammarErrors * 0.6;

  const taskResponse = roundHalfBand(taskRaw);
  const coherenceCohesion = roundHalfBand(coherenceRaw);
  const lexicalResource = roundHalfBand(lexicalRaw);
  const grammaticalRange = roundHalfBand(grammarRaw);
  const overallBand = roundHalfBand(
    (taskResponse + coherenceCohesion + lexicalResource + grammaticalRange) / 4
  );

  let coachSummaryVi: string;
  if (wordCount < 40) {
    coachSummaryVi =
      'Bài viết hiện còn quá ngắn. Hãy mở rộng đủ ý theo 4 phần dàn ý bên trái (mục tiêu ' +
      prompt.minWords +
      '+ từ) để đạt điểm Task Response cao.';
  } else if (inlineDiffs.length > 0) {
    coachSummaryVi = `Phát hiện ${inlineDiffs.length} điểm có thể sửa ngữ pháp hoặc nâng cấp từ vựng ngay bên dưới. Chỉ cần xử lý các In-Line Diff này và bổ sung thêm từ nối học thuật, bài viết sẽ tăng thêm 0.5–1.0 Band.`;
  } else {
    coachSummaryVi =
      'Bài viết có cấu trúc mạch lạc và không mắc lỗi ngữ pháp phổ biến. Hãy đối chiếu với Model Band 8.5 để tinh chỉnh thêm sắc thái cụm từ (Collocations).';
  }

  return {
    overallBand,
    taskResponse,
    coherenceCohesion,
    lexicalResource,
    grammaticalRange,
    wordCount,
    sentenceCount,
    academicWordRatio,
    cohesiveDeviceCount,
    inlineDiffs,
    coachSummaryVi,
  };
}
