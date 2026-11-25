export interface LudwigEntry {
  id: string;
  queryPattern: string;
  category: 'Collocation (*)' | 'Comparison (vs)' | 'Academic Phrase';
  preferredPhrase: string;
  preferredFreqPct: number;
  alternativePhrase?: string;
  alternativeFreqPct?: number;
  explanationVi: string;
  examples: Array<{
    source: 'The Economist' | 'MIT Tech Review' | 'Nature' | 'New York Times' | 'IEEE Software';
    sentence: string;
  }>;
}

export const LUDWIG_CORPUS: LudwigEntry[] = [
  {
    id: 'lud-1',
    queryPattern: 'mitigate * risk',
    category: 'Collocation (*)',
    preferredPhrase: 'mitigate the risk / mitigate potential risks',
    preferredFreqPct: 89,
    explanationVi: 'Đi sau "mitigate" và trước "risk" phổ biến nhất là mạo từ "the" hoặc tính từ "potential / systemic / operational".',
    examples: [
      { source: 'IEEE Software', sentence: 'Canary deployments mitigate the risk of widespread production regressions.' },
      { source: 'The Economist', sentence: 'Central banks acted swiftly to mitigate systemic risk across credit markets.' },
    ],
  },
  {
    id: 'lud-2',
    queryPattern: 'depend on vs depend of',
    category: 'Comparison (vs)',
    preferredPhrase: 'depend on / depend upon',
    preferredFreqPct: 99,
    alternativePhrase: 'depend of (Sai ngữ pháp)',
    alternativeFreqPct: 1,
    explanationVi: 'Trong tiếng Anh chuẩn, "depend" LUÔN đi với giới từ "on" hoặc "upon", tuyệt đối không dùng "depend of".',
    examples: [
      { source: 'Nature', sentence: 'Long-term memory consolidation depends on spaced reactivation of neural pathways.' },
      { source: 'MIT Tech Review', sentence: 'Inference latency depends heavily on memory bandwidth rather than raw FLOPs.' },
    ],
  },
  {
    id: 'lud-3',
    queryPattern: 'discuss vs discuss about',
    category: 'Comparison (vs)',
    preferredPhrase: 'discuss [something] / hold a discussion about',
    preferredFreqPct: 97,
    alternativePhrase: 'discuss about (Thừa giới từ)',
    alternativeFreqPct: 3,
    explanationVi: 'Động từ "discuss" là ngoại động từ (đã mang sẵn nghĩa "thảo luận về"), không thêm "about" theo sau.',
    examples: [
      { source: 'New York Times', sentence: 'The panel met to discuss the ethical implications of autonomous agents.' },
      { source: 'IEEE Software', sentence: 'In this section, we discuss the architectural tradeoffs of local-first sync.' },
    ],
  },
  {
    id: 'lud-4',
    queryPattern: 'strike a * balance',
    category: 'Collocation (*)',
    preferredPhrase: 'strike a delicate / pragmatic / careful balance',
    preferredFreqPct: 92,
    explanationVi: 'Cụm C1 cực kỳ ăn điểm trong IELTS Writing & System Design: "strike a delicate/pragmatic balance between A and B".',
    examples: [
      { source: 'The Economist', sentence: 'Policymakers must strike a delicate balance between innovation and consumer safety.' },
      { source: 'MIT Tech Review', sentence: 'Hybrid models strike a pragmatic balance between on-device privacy and cloud scale.' },
    ],
  },
  {
    id: 'lud-5',
    queryPattern: 'at scale vs in scale',
    category: 'Comparison (vs)',
    preferredPhrase: 'at scale / on a large scale',
    preferredFreqPct: 95,
    alternativePhrase: 'in scale (Chỉ dùng sau "economies of / difference in")',
    alternativeFreqPct: 5,
    explanationVi: 'Khi nói "vận hành ở quy mô lớn", người bản xứ và kỹ sư luôn dùng "operate at scale" hoặc "on a global scale".',
    examples: [
      { source: 'IEEE Software', sentence: 'Small inefficiencies become expensive bottlenecks when running at scale.' },
      { source: 'MIT Tech Review', sentence: 'Deploying voice models at scale requires strict tail-latency guarantees.' },
    ],
  },
  {
    id: 'lud-6',
    queryPattern: 'play a * role',
    category: 'Collocation (*)',
    preferredPhrase: 'play a pivotal / paramount / instrumental role',
    preferredFreqPct: 94,
    explanationVi: 'Thay vì viết "play an important role" (B1), hãy nâng lên C1: "play a pivotal / instrumental / decisive role in...".',
    examples: [
      { source: 'Nature', sentence: 'Acoustic feedback plays a pivotal role in phonetic motor learning.' },
      { source: 'New York Times', sentence: 'Open-source benchmarks played an instrumental role in accelerating AI research.' },
    ],
  },
  {
    id: 'lud-7',
    queryPattern: 'on the other hand vs in the other hand',
    category: 'Comparison (vs)',
    preferredPhrase: 'on the other hand',
    preferredFreqPct: 99,
    alternativePhrase: 'in the other hand (Sai thành ngữ)',
    alternativeFreqPct: 1,
    explanationVi: 'Thành ngữ chuyển ý đối lập luôn dùng giới từ "on": "On the one hand..., on the other hand...".',
    examples: [
      { source: 'The Economist', sentence: 'On the other hand, strict regulation may raise compliance barriers for startups.' },
      { source: 'Nature', sentence: 'On the other hand, passive exposure without output yields slower speaking gains.' },
    ],
  },
  {
    id: 'lud-8',
    queryPattern: 'comprise vs compose',
    category: 'Comparison (vs)',
    preferredPhrase: 'comprise [parts] / be composed of [parts]',
    preferredFreqPct: 91,
    alternativePhrase: 'be comprised of (Tránh dùng trong văn học thuật chuẩn)',
    alternativeFreqPct: 9,
    explanationVi: 'Tổng thể "comprises" các phần (không dùng "of"), hoặc dùng bị động "is composed of".',
    examples: [
      { source: 'IEEE Software', sentence: 'The architecture comprises three decoupled layers: host shell, glass UI, and FSRS core.' },
      { source: 'Nature', sentence: 'Each module is composed of self-contained pure functions.' },
    ],
  },
  {
    id: 'lud-9',
    queryPattern: 'at * expense',
    category: 'Collocation (*)',
    preferredPhrase: 'at the expense of [something]',
    preferredFreqPct: 96,
    explanationVi: 'Diễn tả sự đánh đổi "đạt được A nhưng phải trả giá / hy sinh B": "Speed should not come at the expense of accuracy."',
    examples: [
      { source: 'MIT Tech Review', sentence: 'Higher compression should not come at the expense of phonetic intelligibility.' },
      { source: 'The Economist', sentence: 'Short-term growth often occurs at the expense of long-term resilience.' },
    ],
  },
  {
    id: 'lud-10',
    queryPattern: 'take * into account',
    category: 'Collocation (*)',
    preferredPhrase: 'take [something] into account / take into consideration',
    preferredFreqPct: 95,
    explanationVi: 'Cụm C1 cực hữu ích khi phân tích đánh đổi: "cân nhắc đến yếu tố X".',
    examples: [
      { source: 'The Economist', sentence: 'Forecasts must take regional inflation into account before setting targets.' },
    ],
  },
  {
    id: 'lud-11',
    queryPattern: 'pose a * threat',
    category: 'Collocation (*)',
    preferredPhrase: 'pose a serious / existential / direct threat to',
    preferredFreqPct: 93,
    alternativePhrase: 'make a threat to (Ít tự nhiên trong văn học thuật)',
    alternativeFreqPct: 7,
    explanationVi: 'Trong IELTS Writing & báo chí, danh từ "threat" đi chuẩn nhất với động từ "pose".',
    examples: [
      { source: 'New York Times', sentence: 'Unchecked misinformation poses a serious threat to public trust.' },
    ],
  },
  {
    id: 'lud-12',
    queryPattern: 'shed * light on',
    category: 'Academic Phrase',
    preferredPhrase: 'shed new / fresh light on [a topic]',
    preferredFreqPct: 94,
    explanationVi: 'Làm sáng tỏ một vấn đề phức tạp (thay cho "explain clearly").',
    examples: [
      { source: 'Nature', sentence: 'Sleep EEG recordings shed new light on nighttime memory consolidation.' },
    ],
  },
  {
    id: 'lud-13',
    queryPattern: 'in terms of vs in term of',
    category: 'Comparison (vs)',
    preferredPhrase: 'in terms of [criteria]',
    preferredFreqPct: 99,
    alternativePhrase: 'in term of (Thiếu "s")',
    alternativeFreqPct: 1,
    explanationVi: 'Luôn dùng số nhiều "terms": "In terms of latency and battery life..."',
    examples: [
      { source: 'IEEE Software', sentence: 'Native AppKit outperforms web wrappers in terms of startup responsiveness.' },
    ],
  },
  {
    id: 'lud-14',
    queryPattern: 'look forward to *',
    category: 'Academic Phrase',
    preferredPhrase: 'look forward to + V-ing / Noun',
    preferredFreqPct: 98,
    alternativePhrase: 'look forward to + V-infinitive (Lỗi phổ biến nhất trong email)',
    alternativeFreqPct: 2,
    explanationVi: '"To" ở đây là giới từ nên PHẢI theo sau bằng V-ing: "I look forward to hearing from you."',
    examples: [
      { source: 'New York Times', sentence: 'We look forward to collaborating closely with the design team next quarter.' },
    ],
  },
  {
    id: 'lud-15',
    queryPattern: 'bridge the * gap',
    category: 'Collocation (*)',
    preferredPhrase: 'bridge the gap / narrow the widening gap between A and B',
    preferredFreqPct: 96,
    explanationVi: 'Thu hẹp khoảng cách giữa lý thuyết và thực hành, hoặc giữa hai nhóm đối tượng.',
    examples: [
      { source: 'MIT Tech Review', sentence: 'Interactive roleplays bridge the gap between passive reading and fluent speech.' },
    ],
  },
  {
    id: 'lud-16',
    queryPattern: 'raise * awareness',
    category: 'Collocation (*)',
    preferredPhrase: 'raise public awareness of / heighten awareness about',
    preferredFreqPct: 94,
    alternativePhrase: 'increase awareness (Đúng nhưng kém mượt bằng raise)',
    alternativeFreqPct: 6,
    explanationVi: 'Collocation ăn điểm Band 8.0: "raise awareness of + [issue]".',
    examples: [
      { source: 'The Economist', sentence: 'Transparency reports helped raise public awareness of voice data privacy.' },
    ],
  },
  {
    id: 'lud-17',
    queryPattern: 'effect on vs affect on',
    category: 'Comparison (vs)',
    preferredPhrase: 'have a profound effect on / affect [something] directly',
    preferredFreqPct: 99,
    alternativePhrase: 'affect on (Sai ngữ pháp — affect là ngoại động từ)',
    alternativeFreqPct: 1,
    explanationVi: '"Affect" là động từ đi thẳng với tân ngữ (không dùng "on"); "Effect" là danh từ đi với "on".',
    examples: [
      { source: 'Nature', sentence: 'Consistent sleep schedules have a profound effect on vocabulary retention.' },
    ],
  },
  {
    id: 'lud-18',
    queryPattern: 'outweigh * drawbacks',
    category: 'Collocation (*)',
    preferredPhrase: 'far outweigh the drawbacks / outweigh the potential risks',
    preferredFreqPct: 95,
    explanationVi: 'Cụm đinh cho dạng bài IELTS Advantage/Disadvantage: lợi ích vượt xa nhược điểm.',
    examples: [
      { source: 'The Economist', sentence: 'The long-term productivity gains far outweigh the initial migration drawbacks.' },
    ],
  },
  {
    id: 'lud-19',
    queryPattern: 'conducive to *',
    category: 'Academic Phrase',
    preferredPhrase: 'conducive to deep focus / conducive to learning',
    preferredFreqPct: 97,
    alternativePhrase: 'conducive for (Sai giới từ)',
    alternativeFreqPct: 3,
    explanationVi: 'Tính từ "conducive" luôn đi với giới từ "to" + Danh từ / V-ing.',
    examples: [
      { source: 'MIT Tech Review', sentence: 'Calm, uncluttered workspaces are far more conducive to sustained concentration.' },
    ],
  },
  {
    id: 'lud-20',
    queryPattern: 'address * root cause',
    category: 'Collocation (*)',
    preferredPhrase: 'address the root cause / tackle the underlying cause',
    preferredFreqPct: 93,
    explanationVi: 'Giải quyết tận gốc vấn đề thay vì chỉ xử lý triệu chứng bề mặt.',
    examples: [
      { source: 'IEEE Software', sentence: 'Postmortems should address the root cause rather than blaming individuals.' },
    ],
  },
];

export function searchLudwigCorpus(rawQuery: string): LudwigEntry[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return LUDWIG_CORPUS;

  // Support wildcard '*' matching inside corpus patterns and sentences
  if (q.includes('*')) {
    const escaped = q.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
    const regex = new RegExp(escaped, 'i');
    const wildcardHits = LUDWIG_CORPUS.filter(
      (item) =>
        regex.test(item.queryPattern) ||
        regex.test(item.preferredPhrase) ||
        item.examples.some((ex) => regex.test(ex.sentence))
    );
    if (wildcardHits.length > 0) return wildcardHits;
  }

  const tokens = q.split(/\s+/).filter((t) => t !== 'vs' && t !== '*');
  return LUDWIG_CORPUS.filter((item) => {
    const haystack = [
      item.queryPattern,
      item.preferredPhrase,
      item.alternativePhrase ?? '',
      item.explanationVi,
      ...item.examples.map((e) => e.sentence),
    ]
      .join(' ')
      .toLowerCase();
    return tokens.every((tok) => haystack.includes(tok));
  });
}
