import { hasNativeMacBridge, nativeHttpRequest } from '../phonetics/speechIO';

/**
 * Multi-Provider AI Tutor & Linguistic Engine
 * Supports live OpenAI / Gemini / Local Ollama endpoints (with native macOS HTTP bridge for zero-CORS Ollama),
 * multi-turn conversation history, transparent fallback reporting, and Memory Ledger.
 */

export type AIProvider = 'builtin' | 'openai' | 'gemini' | 'ollama';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  ollamaUrl: string;
}

export interface MemoryLedgerItem {
  id: string;
  mistakePattern: string;
  targetVocab: string;
  userGoal: string;
  lastPracticedAt: number;
  resolved: boolean;
}

export interface TurnCorrection {
  original: string;
  highlightedIssues: Array<{ text: string; isError: boolean }>;
  corrected: string;
  c1Upgrade: string;
  explainVi: string;
  extractedVocab: string[];
  detectedMistakePattern?: string;
  score: number;
}

export interface TutorReply {
  aiText: string;
  aiTextVi: string;
  correction: TurnCorrection;
  memoryTriggered?: string;
  source: 'live' | 'fallback';
  fallbackReason?: string;
}

export interface SyntaxClause {
  role: 'Main Clause' | 'Relative Clause' | 'Participle / Adverbial Phrase' | 'Prepositional Phrase';
  text: string;
  explanationVi: string;
}

const GRAMMAR_RULES: Array<{
  pattern: RegExp;
  fix: (m: string) => string;
  explainVi: string;
  issueSnippet: string;
  memoryLabel: string;
}> = [
  {
    pattern: /\bi am agree\b/gi,
    fix: () => 'I agree',
    issueSnippet: 'am agree',
    memoryLabel: 'I am agree -> I agree',
    explainVi: '"Agree" là động từ thường, KHÔNG đi kèm động từ to-be "am/is/are". Hãy dùng trực tiếp "I agree" hoặc "I completely agree".',
  },
  {
    pattern: /\bdiscuss about\b/gi,
    fix: () => 'discuss',
    issueSnippet: 'discuss about',
    memoryLabel: 'discuss about -> discuss',
    explainVi: 'Động từ "discuss" mang nghĩa "thảo luận về..." nên là ngoại động từ, không dùng giới từ "about" phía sau.',
  },
  {
    pattern: /\bdepend of\b/gi,
    fix: () => 'depend on',
    issueSnippet: 'depend of',
    memoryLabel: 'depend of -> depend on',
    explainVi: 'Cụm cố định trong tiếng Anh là "depend on" (hoặc "rely on"), không dùng "of".',
  },
  {
    pattern: /\bin the other hand\b/gi,
    fix: () => 'on the other hand',
    issueSnippet: 'in the other hand',
    memoryLabel: 'in the other hand -> on the other hand',
    explainVi: 'Thành ngữ chuyển ý chuẩn luôn dùng giới từ "on": "On the other hand" (Mặt khác).',
  },
  {
    pattern: /\bmore better\b/gi,
    fix: () => 'much better',
    issueSnippet: 'more better',
    memoryLabel: 'more better -> much better',
    explainVi: '"Better" đã là dạng so sánh hơn của "good", không ghép thêm "more". Muốn nhấn mạnh hãy dùng "much better" hoặc "far better".',
  },
  {
    pattern: /\byesterday i go\b/gi,
    fix: () => 'yesterday I went',
    issueSnippet: 'yesterday I go',
    memoryLabel: 'yesterday I go -> yesterday I went',
    explainVi: 'Có trạng từ chỉ quá khứ "yesterday" nên động từ "go" phải chia ở thì quá khứ đơn là "went".',
  },
  {
    pattern: /\bhave many experience\b/gi,
    fix: () => 'have extensive experience',
    issueSnippet: 'many experience',
    memoryLabel: 'many experience -> extensive experience',
    explainVi: '"Experience" (kinh nghiệm) là danh từ không đếm được, không dùng "many". Hãy dùng "a lot of experience" hoặc cấp C1 "extensive experience".',
  },
  {
    pattern: /\baccording to me\b/gi,
    fix: () => 'in my opinion / from my perspective',
    issueSnippet: 'according to me',
    memoryLabel: 'according to me -> from my perspective',
    explainVi: 'Người bản xứ không dùng "according to me". Hãy thay bằng "In my view" hoặc "From my perspective".',
  },
];

function upgradeSentenceToC1(text: string): string {
  return text
    .replace(/\bvery good\b/gi, 'exceptionally compelling')
    .replace(/\bvery important\b/gi, 'paramount')
    .replace(/\bvery hard\b/gi, 'particularly demanding')
    .replace(/\bi think\b/gi, 'From my perspective,')
    .replace(/\bbecause\b/gi, 'primarily due to the fact that')
    .replace(/\bmake it better\b/gi, 'elevate its overall quality')
    .replace(/\bhelp\b/gi, 'facilitate')
    .replace(/\buse\b/gi, 'leverage')
    .replace(/\bproblem\b/gi, 'bottleneck')
    .replace(/\bfix\b/gi, 'address and remediate');
}

export function analyzeUtteranceLocally(userText: string): TurnCorrection {
  const trimmed = userText.trim() || 'I think this system design is very important.';
  let corrected = trimmed;
  const explanations: string[] = [];
  const issueSnippets: string[] = [];
  let detectedMistakePattern: string | undefined;

  for (const rule of GRAMMAR_RULES) {
    if (rule.pattern.test(corrected)) {
      corrected = corrected.replace(rule.pattern, rule.fix);
      explanations.push(rule.explainVi);
      issueSnippets.push(rule.issueSnippet);
      if (!detectedMistakePattern) detectedMistakePattern = rule.memoryLabel;
    }
  }

  corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
  if (!/[.!?]$/.test(corrected)) corrected += '.';

  let c1Upgrade = upgradeSentenceToC1(corrected);
  if (c1Upgrade === corrected) {
    c1Upgrade = `From an analytical standpoint, ${corrected.charAt(0).toLowerCase()}${corrected.slice(1)}`;
  }

  const highlightedIssues: Array<{ text: string; isError: boolean }> = [];
  if (issueSnippets.length > 0) {
    const lowerOrig = trimmed.toLowerCase();
    const firstSnippet = issueSnippets[0].toLowerCase();
    const idx = lowerOrig.indexOf(firstSnippet);
    if (idx !== -1) {
      if (idx > 0) highlightedIssues.push({ text: trimmed.slice(0, idx), isError: false });
      highlightedIssues.push({ text: trimmed.slice(idx, idx + firstSnippet.length), isError: true });
      if (idx + firstSnippet.length < trimmed.length) {
        highlightedIssues.push({ text: trimmed.slice(idx + firstSnippet.length), isError: false });
      }
    } else {
      highlightedIssues.push({ text: trimmed, isError: false });
    }
  } else {
    highlightedIssues.push({ text: trimmed, isError: false });
  }

  const words = corrected
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 6)
    .slice(0, 3);

  const score = Math.max(62, 95 - issueSnippets.length * 14);
  const explainVi =
    explanations.length > 0
      ? explanations.join(' ')
      : 'Cấu trúc ngữ pháp của bạn đã chính xác. Để tự nhiên và đạt band C1/IELTS 7.5+ hơn, hãy nâng cấp động từ và cụm nối ý như phần gợi ý Idiomatic Upgrade.';

  return {
    original: trimmed,
    highlightedIssues,
    corrected,
    c1Upgrade,
    explainVi,
    extractedVocab: words.length > 0 ? words : ['perspective', 'articulate'],
    detectedMistakePattern,
    score,
  };
}

export async function generateTutorReply(params: {
  scenarioTitle: string;
  scenarioPrompt: string;
  userText: string;
  history?: Array<{ sender: 'ai' | 'user'; text: string }>;
  memoryLedger: MemoryLedgerItem[];
  config: AIConfig;
}): Promise<TutorReply> {
  const { scenarioTitle, scenarioPrompt, userText, history = [], memoryLedger, config } = params;
  const localCorrection = analyzeUtteranceLocally(userText);

  const activeMemory = memoryLedger.find((m) => !m.resolved);
  const memoryCue = activeMemory
    ? `By the way, try using "${activeMemory.targetVocab}" in your next answer so we reinforce what we practiced earlier.`
    : '';

  const recentHistory = history.slice(-8);
  const systemPrompt =
    `You are T-English AI Tutor in scenario "${scenarioTitle}" (${scenarioPrompt}). ` +
    `Return strict JSON with keys: aiText, aiTextVi, corrected, c1Upgrade, explainVi, score (0-100). ` +
    (activeMemory ? `Remind learner to reuse target word "${activeMemory.targetVocab}".` : '');

  let fallbackReason: string | undefined;

  if (config.provider !== 'builtin') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    try {
      if (config.provider === 'openai') {
        if (!config.apiKey.trim()) {
          fallbackReason = 'Chưa nhập OpenAI API Key';
        } else {
          const messages = [
            { role: 'system', content: systemPrompt },
            ...recentHistory.map((h) => ({
              role: h.sender === 'ai' ? 'assistant' : 'user',
              content: h.text,
            })),
            { role: 'user', content: userText },
          ];
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.apiKey.trim()}`,
            },
            body: JSON.stringify({
              model: config.model || 'gpt-4o-mini',
              temperature: 0.4,
              response_format: { type: 'json_object' },
              messages,
            }),
          });
          if (!res.ok) {
            fallbackReason = `OpenAI HTTP ${res.status}`;
          } else {
            const data = await res.json();
            const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
            if (parsed.aiText) {
              return {
                aiText: parsed.aiText,
                aiTextVi: parsed.aiTextVi || 'Phản hồi trực tiếp từ OpenAI Tutor.',
                correction: {
                  ...localCorrection,
                  corrected: parsed.corrected || localCorrection.corrected,
                  c1Upgrade: parsed.c1Upgrade || localCorrection.c1Upgrade,
                  explainVi: parsed.explainVi || localCorrection.explainVi,
                  score: typeof parsed.score === 'number' ? parsed.score : localCorrection.score,
                },
                memoryTriggered: activeMemory?.targetVocab,
                source: 'live',
              };
            }
            fallbackReason = 'OpenAI trả về JSON thiếu aiText';
          }
        }
      } else if (config.provider === 'gemini') {
        if (!config.apiKey.trim()) {
          fallbackReason = 'Chưa nhập Gemini API Key';
        } else {
          const model = config.model || 'gemini-2.0-flash';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
          const contents = [
            ...recentHistory.map((h) => ({
              role: h.sender === 'ai' ? 'model' : 'user',
              parts: [{ text: h.text }],
            })),
            { role: 'user', parts: [{ text: userText }] },
          ];
          const res = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': config.apiKey.trim(),
            },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents,
              generationConfig: { responseMimeType: 'application/json' },
            }),
          });
          if (!res.ok) {
            fallbackReason = `Gemini HTTP ${res.status}`;
          } else {
            const data = await res.json();
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
            const parsed = JSON.parse(raw);
            if (parsed.aiText) {
              return {
                aiText: parsed.aiText,
                aiTextVi: parsed.aiTextVi || 'Phản hồi trực tiếp từ Gemini Tutor.',
                correction: {
                  ...localCorrection,
                  corrected: parsed.corrected || localCorrection.corrected,
                  c1Upgrade: parsed.c1Upgrade || localCorrection.c1Upgrade,
                  explainVi: parsed.explainVi || localCorrection.explainVi,
                  score: typeof parsed.score === 'number' ? parsed.score : localCorrection.score,
                },
                memoryTriggered: activeMemory?.targetVocab,
                source: 'live',
              };
            }
            fallbackReason = 'Gemini trả về JSON thiếu aiText';
          }
        }
      } else if (config.provider === 'ollama') {
        if (!config.ollamaUrl.trim()) {
          fallbackReason = 'Chưa cấu hình Ollama URL';
        } else {
          const messages = [
            { role: 'system', content: systemPrompt },
            ...recentHistory.map((h) => ({
              role: h.sender === 'ai' ? 'assistant' : 'user',
              content: h.text,
            })),
            { role: 'user', content: userText },
          ];
          const ollamaPayload = JSON.stringify({
            model: config.model || 'llama3.2',
            stream: false,
            format: 'json',
            messages,
          });
          const ollamaEndpoint = `${config.ollamaUrl.replace(/\/$/, '')}/api/chat`;
          let rawData: { message?: { content?: string } } | null = null;
          if (hasNativeMacBridge()) {
            const nr = await nativeHttpRequest({
              url: ollamaEndpoint,
              method: 'POST',
              body: ollamaPayload,
              timeoutMs: 18_000,
              eventChannel: 'http',
            });
            if (!nr.ok) {
              fallbackReason = `Ollama HTTP ${nr.status || 'Network'}`;
            } else {
              rawData = JSON.parse(nr.text || '{}');
            }
          } else {
            const res = await fetch(ollamaEndpoint, {
              method: 'POST',
              signal: controller.signal,
              headers: { 'Content-Type': 'application/json' },
              body: ollamaPayload,
            });
            if (!res.ok) {
              fallbackReason = `Ollama HTTP ${res.status}`;
            } else {
              rawData = await res.json();
            }
          }
          if (rawData) {
            const parsed = JSON.parse(rawData.message?.content ?? '{}');
            if (parsed.aiText) {
              return {
                aiText: parsed.aiText,
                aiTextVi: parsed.aiTextVi || 'Phản hồi từ Local Ollama Tutor.',
                correction: {
                  ...localCorrection,
                  corrected: parsed.corrected || localCorrection.corrected,
                  c1Upgrade: parsed.c1Upgrade || localCorrection.c1Upgrade,
                  explainVi: parsed.explainVi || localCorrection.explainVi,
                },
                memoryTriggered: activeMemory?.targetVocab,
                source: 'live',
              };
            }
            fallbackReason = 'Ollama trả về JSON thiếu aiText';
          }
        }
      }
    } catch (err) {
      fallbackReason =
        err instanceof Error && err.name === 'AbortError'
          ? 'Hết thời gian chờ phản hồi AI (15s)'
          : 'Lỗi mạng hoặc CORS khi gọi AI Provider';
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Built-in context-aware Linguistic Tutor fallback
  const lower = userText.toLowerCase();
  let aiText: string;
  let aiTextVi: string;

  if (lower.includes('latency') || lower.includes('scale') || lower.includes('cache') || lower.includes('system')) {
    aiText = `That makes a lot of sense. What tradeoff would you accept between write consistency and p99 latency under heavy load? ${memoryCue}`.trim();
    aiTextVi = `Rất hợp lý. Bạn sẵn sàng đánh đổi điều gì giữa tính nhất quán khi ghi và độ trễ p99 khi hệ thống chịu tải cao?`;
  } else if (lower.includes('ielts') || lower.includes('opinion') || lower.includes('technology') || lower.includes('agree')) {
    aiText = `Good point. Could you support that argument with a concrete real-world example and mention one potential drawback? ${memoryCue}`.trim();
    aiTextVi = `Luận điểm tốt đấy. Bạn có thể củng cố ý kiến đó bằng một ví dụ thực tế cụ thể và nêu thêm một nhược điểm tiềm ẩn không?`;
  } else {
    aiText = `I hear you—and notice how clean "${localCorrection.c1Upgrade}" sounds! How would you elaborate on the next step in this situation? ${memoryCue}`.trim();
    aiTextVi = `Mình hiểu ý bạn rồi — hãy để ý cách diễn đạt nâng cấp rất tự nhiên ở thẻ bên cạnh! Bạn sẽ triển khai bước tiếp theo trong tình huống này như thế nào?`;
  }

  return {
    aiText,
    aiTextVi,
    correction: localCorrection,
    memoryTriggered: activeMemory?.targetVocab,
    source: 'fallback',
    fallbackReason,
  };
}

/**
 * Grammar X-Ray: Splits a complex English sentence into syntactic clauses.
 */
export function analyzeSentenceSyntax(sentence: string): SyntaxClause[] {
  const clean = sentence.trim();
  if (!clean) return [];

  const clauses: SyntaxClause[] = [];
  const relMatch = clean.match(/\b(which|that|who|whose|where)\b[^,.;]*/i);
  const advMatch = clean.match(/\b(although|because|while|since|whereas|if|when)\b[^,.;]*/i);

  if (advMatch && advMatch.index !== undefined) {
    const before = clean.slice(0, advMatch.index).trim();
    if (before) {
      clauses.push({
        role: 'Main Clause',
        text: before.replace(/,$/, ''),
        explanationVi: 'Mệnh đề chính truyền đạt thông điệp cốt lõi của cả câu.',
      });
    }
    clauses.push({
      role: 'Participle / Adverbial Phrase',
      text: advMatch[0],
      explanationVi: 'Mệnh đề trạng ngữ bổ sung nguyên nhân, điều kiện hoặc sự tương phản.',
    });
  } else if (relMatch && relMatch.index !== undefined) {
    const before = clean.slice(0, relMatch.index).trim();
    if (before) {
      clauses.push({
        role: 'Main Clause',
        text: before.replace(/,$/, ''),
        explanationVi: 'Mệnh đề chính xác định chủ thể và hành động trung tâm.',
      });
    }
    clauses.push({
      role: 'Relative Clause',
      text: relMatch[0],
      explanationVi: 'Mệnh đề quan hệ bổ nghĩa trực tiếp cho danh từ đứng trước.',
    });
  } else {
    const parts = clean.split(/,\s+/).filter(Boolean);
    if (parts.length > 1) {
      clauses.push({
        role: 'Main Clause',
        text: parts[0],
        explanationVi: 'Mệnh đề mở đầu xác lập khung ngữ nghĩa chính.',
      });
      parts.slice(1).forEach((p) =>
        clauses.push({
          role: 'Prepositional Phrase',
          text: p,
          explanationVi: 'Cụm bổ sung ngữ cảnh, kết quả hoặc chi tiết mở rộng.',
        })
      );
    } else {
      clauses.push({
        role: 'Main Clause',
        text: clean,
        explanationVi: 'Câu đơn hoàn chỉnh gồm Chủ ngữ – Động từ – Tân ngữ rõ ràng.',
      });
    }
  }

  return clauses;
}
