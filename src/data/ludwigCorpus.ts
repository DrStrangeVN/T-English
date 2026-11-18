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
