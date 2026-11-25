import type { WritingPrompt } from '../../data/writingPrompts';
import type { AIConfig } from './tutorService';
import { hasNativeMacBridge, nativeHttpRequest } from '../phonetics/speechIO';

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
  source?: 'live' | 'builtin';
  fallbackReason?: string;
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

function roundHalfBand(val: number, min = 2.5, max = 9.0): number {
  const clamped = Math.min(max, Math.max(min, val));
  return Math.round(clamped * 2) / 2;
}

export function evaluateWriting(text: string, prompt: WritingPrompt): WritingEvaluationResult {
  const clean = text.trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  if (wordCount === 0) {
    return {
      overallBand: 0,
      taskResponse: 0,
      coherenceCohesion: 0,
      lexicalResource: 0,
      grammaticalRange: 0,
      wordCount: 0,
      sentenceCount: 0,
      academicWordRatio: 0,
      cohesiveDeviceCount: 0,
      inlineDiffs: [],
      coachSummaryVi: 'Vui lòng nhập nội dung bài viết trước khi chấm điểm.',
      source: 'builtin',
    };
  }

  const sentences = clean
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
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
  const academicWordRatio = Math.round((academicHits / wordCount) * 1000) / 10;

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

  if (wordCount < 25) {
    const grammarErrors = inlineDiffs.filter((d) => d.category === 'Grammar').length;
    const tr = roundHalfBand(2.5 + (wordCount / 25) * 1.5, 2.0, 4.0);
    const cc = roundHalfBand(2.5 + (sentenceCount >= 2 ? 0.5 : 0), 2.0, 4.0);
    const lr = roundHalfBand(3.0 + Math.min(1.0, academicHits * 0.4), 2.0, 4.5);
    const gr = roundHalfBand(3.5 - grammarErrors * 0.5, 2.0, 4.5);
    const overall = roundHalfBand((tr + cc + lr + gr) / 4, 2.0, 4.5);
    return {
      overallBand: overall,
      taskResponse: tr,
      coherenceCohesion: cc,
      lexicalResource: lr,
      grammaticalRange: gr,
      wordCount,
      sentenceCount,
      academicWordRatio,
      cohesiveDeviceCount,
      inlineDiffs,
      coachSummaryVi: `Bài viết hiện mới có ${wordCount} từ (tối thiểu nên viết ${prompt.minWords}+ từ). Chưa đủ dung lượng để đánh giá toàn diện các tiêu chí IELTS.`,
      source: 'builtin',
    };
  }

  // 1. Task Response (word coverage + prompt lexicon alignment)
  const coverageRatio = Math.min(1, wordCount / Math.max(80, prompt.minWords));
  const promptKeywordsUsed = prompt.band8Lexicon.filter((item) =>
    lower.includes(item.phrase.split(' ')[0].toLowerCase())
  ).length;
  const taskRaw = 4.5 + coverageRatio * 3.0 + Math.min(1.5, promptKeywordsUsed * 0.4);

  // 2. Coherence & Cohesion
  const avgSentenceLen = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const cohesionBonus = Math.min(2.0, cohesiveDeviceCount * 0.45);
  const structureBonus = avgSentenceLen >= 13 && avgSentenceLen <= 28 ? 1.0 : 0.4;
  const coherenceRaw = 5.0 + cohesionBonus + structureBonus;

  // 3. Lexical Resource
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ''))).size;
  const ttr = uniqueWords / wordCount;
  const lexicalPenalty = inlineDiffs.filter((d) => d.category === 'Lexical Upgrade').length * 0.35;
  const lexicalRaw = 5.2 + Math.min(1.6, academicHits * 0.35) + (ttr > 0.58 ? 1.0 : 0.4) - lexicalPenalty;

  // 4. Grammatical Range & Accuracy
  const grammarErrors = inlineDiffs.filter((d) => d.category === 'Grammar').length;
  const hasComplexClause = /\b(although|while|whereas|which|that|because|not only|had we)\b/i.test(clean);
  const grammarRaw = 5.5 + (hasComplexClause ? 1.5 : 0.4) + (sentenceCount >= 3 ? 0.6 : 0) - grammarErrors * 0.6;

  const taskResponse = roundHalfBand(taskRaw, 4.0, 9.0);
  const coherenceCohesion = roundHalfBand(coherenceRaw, 4.0, 9.0);
  const lexicalResource = roundHalfBand(lexicalRaw, 4.0, 9.0);
  const grammaticalRange = roundHalfBand(grammarRaw, 4.0, 9.0);
  const overallBand = roundHalfBand(
    (taskResponse + coherenceCohesion + lexicalResource + grammaticalRange) / 4,
    4.0,
    9.0
  );

  let coachSummaryVi: string;
  if (wordCount < 60) {
    coachSummaryVi = `Bài viết hiện còn ngắn (${wordCount} từ). Hãy mở rộng đủ ý theo 4 phần dàn ý bên trái (mục tiêu ${prompt.minWords}+ từ) để tăng điểm Task Response.`;
  } else if (inlineDiffs.length > 0) {
    coachSummaryVi = `Phát hiện ${inlineDiffs.length} điểm có thể sửa ngữ pháp hoặc nâng cấp từ vựng ngay bên dưới. Xử lý các In-Line Diff này sẽ giúp tăng thêm 0.5–1.0 Band.`;
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
    source: 'builtin',
  };
}

export async function evaluateWritingWithAI(
  text: string,
  prompt: WritingPrompt,
  config: AIConfig
): Promise<WritingEvaluationResult> {
  const local = evaluateWriting(text, prompt);
  if (local.wordCount === 0 || config.provider === 'builtin') {
    return local;
  }

  const sysInstruction =
    `You are an IELTS Writing examiner. Grade the essay against prompt "${prompt.title}": "${prompt.promptText}". ` +
    `Return strict JSON with keys: overallBand (number 0-9), taskResponse (number), coherenceCohesion (number), lexicalResource (number), grammaticalRange (number), coachSummaryVi (string).`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    if (config.provider === 'openai' && config.apiKey.trim()) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: sysInstruction },
            { role: 'user', content: text },
          ],
        }),
      });
      if (!res.ok) {
        return { ...local, source: 'builtin', fallbackReason: `OpenAI HTTP ${res.status}` };
      }
      const data = await res.json();
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
      if (typeof parsed.overallBand === 'number') {
        return {
          ...local,
          overallBand: roundHalfBand(parsed.overallBand, 2.0, 9.0),
          taskResponse: typeof parsed.taskResponse === 'number' ? roundHalfBand(parsed.taskResponse, 2.0, 9.0) : local.taskResponse,
          coherenceCohesion: typeof parsed.coherenceCohesion === 'number' ? roundHalfBand(parsed.coherenceCohesion, 2.0, 9.0) : local.coherenceCohesion,
          lexicalResource: typeof parsed.lexicalResource === 'number' ? roundHalfBand(parsed.lexicalResource, 2.0, 9.0) : local.lexicalResource,
          grammaticalRange: typeof parsed.grammaticalRange === 'number' ? roundHalfBand(parsed.grammaticalRange, 2.0, 9.0) : local.grammaticalRange,
          coachSummaryVi: typeof parsed.coachSummaryVi === 'string' && parsed.coachSummaryVi ? parsed.coachSummaryVi : local.coachSummaryVi,
          source: 'live',
        };
      }
    }

    if (config.provider === 'gemini' && config.apiKey.trim()) {
      const model = config.model || 'gemini-2.0-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.apiKey.trim(),
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: sysInstruction }] },
          contents: [{ role: 'user', parts: [{ text }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      if (!res.ok) {
        return { ...local, source: 'builtin', fallbackReason: `Gemini HTTP ${res.status}` };
      }
      const data = await res.json();
      const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}');
      if (typeof parsed.overallBand === 'number') {
        return {
          ...local,
          overallBand: roundHalfBand(parsed.overallBand, 2.0, 9.0),
          taskResponse: typeof parsed.taskResponse === 'number' ? roundHalfBand(parsed.taskResponse, 2.0, 9.0) : local.taskResponse,
          coherenceCohesion: typeof parsed.coherenceCohesion === 'number' ? roundHalfBand(parsed.coherenceCohesion, 2.0, 9.0) : local.coherenceCohesion,
          lexicalResource: typeof parsed.lexicalResource === 'number' ? roundHalfBand(parsed.lexicalResource, 2.0, 9.0) : local.lexicalResource,
          grammaticalRange: typeof parsed.grammaticalRange === 'number' ? roundHalfBand(parsed.grammaticalRange, 2.0, 9.0) : local.grammaticalRange,
          coachSummaryVi: typeof parsed.coachSummaryVi === 'string' && parsed.coachSummaryVi ? parsed.coachSummaryVi : local.coachSummaryVi,
          source: 'live',
        };
      }
    }

    if (config.provider === 'ollama' && config.ollamaUrl.trim()) {
      const ollamaPayload = JSON.stringify({
        model: config.model || 'llama3.2',
        stream: false,
        format: 'json',
        messages: [
          { role: 'system', content: sysInstruction },
          { role: 'user', content: text },
        ],
      });
      const endpoint = `${config.ollamaUrl.replace(/\/$/, '')}/api/chat`;
      let data: { message?: { content?: string } } | null = null;
      if (hasNativeMacBridge()) {
        const nr = await nativeHttpRequest({
          url: endpoint,
          method: 'POST',
          body: ollamaPayload,
          timeoutMs: 18_000,
          eventChannel: 'http',
        });
        if (!nr.ok) {
          return { ...local, source: 'builtin', fallbackReason: `Ollama HTTP ${nr.status || 'Network'}` };
        }
        data = JSON.parse(nr.text || '{}');
      } else {
        const res = await fetch(endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: ollamaPayload,
        });
        if (!res.ok) {
          return { ...local, source: 'builtin', fallbackReason: `Ollama HTTP ${res.status}` };
        }
        data = await res.json();
      }
      const parsed = JSON.parse(data?.message?.content ?? '{}');
      if (typeof parsed.overallBand === 'number') {
        return {
          ...local,
          overallBand: roundHalfBand(parsed.overallBand, 2.0, 9.0),
          coachSummaryVi: typeof parsed.coachSummaryVi === 'string' && parsed.coachSummaryVi ? parsed.coachSummaryVi : local.coachSummaryVi,
          source: 'live',
        };
      }
    }

    return {
      ...local,
      source: 'builtin',
      fallbackReason: 'Chưa cấu hình API Key / Endpoint hợp lệ — đang dùng bộ chấm cục bộ.',
    };
  } catch (err) {
    const reason = err instanceof Error && err.name === 'AbortError'
      ? 'Hết thời gian chờ API (15s)'
      : 'Không thể kết nối tới AI Provider';
    return { ...local, source: 'builtin', fallbackReason: reason };
  } finally {
    clearTimeout(timer);
  }
}
