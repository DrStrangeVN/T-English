export interface PlacementQuestion {
  id: string;
  cefrWeight: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  skill: 'Grammar' | 'Lexical' | 'Phonetics' | 'Reading';
  question: string;
  options: string[];
  correctIdx: number;
  explanationVi: string;
}

export interface CurriculumUnit {
  id: string;
  unitNumber: number;
  cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  title: string;
  subtitleVi: string;
  estimatedMin: number;
  grammarBlueprint: {
    formula: string;
    usageVi: string;
    commonMistakeVi: string;
  };
  keyPatterns: Array<{
    en: string;
    vi: string;
  }>;
  transformationDrill: {
    promptEn: string;
    hintKeyword: string;
    acceptedAnswers: string[];
    explanationVi: string;
  };
  quiz: Array<{
    q: string;
    options: string[];
    answerIdx: number;
    explainVi: string;
  }>;
}

export const PLACEMENT_TEST_QUESTIONS: PlacementQuestion[] = [
  {
    id: 'pq-1',
    cefrWeight: 'A1',
    skill: 'Grammar',
    question: 'She ______ to English podcasts for 20 minutes every morning.',
    options: ['listen', 'listens', 'listening', 'is listen'],
    correctIdx: 1,
    explanationVi: 'Chủ ngữ số ít "She" ở thì Hiện tại đơn diễn tả thói quen → động từ thêm -s ("listens").',
  },
  {
    id: 'pq-2',
    cefrWeight: 'A2',
    skill: 'Grammar',
    question: 'Yesterday morning, our team ______ the release notes before 9 AM.',
    options: ['publish', 'published', 'publishing', 'has publish'],
    correctIdx: 1,
    explanationVi: 'Có trạng từ thời gian quá khứ xác định "Yesterday morning" nên dùng Quá khứ đơn (published).',
  },
  {
    id: 'pq-3',
    cefrWeight: 'B1',
    skill: 'Grammar',
    question: 'Choose the natural sentence with NO redundant preposition:',
    options: [
      'We need to discuss about the database schema.',
      'We need to discuss the database schema.',
      'We are agree with the new schema.',
      'It depends of the server load.',
    ],
    correctIdx: 1,
    explanationVi: '"Discuss" là ngoại động từ, theo sau trực tiếp là tân ngữ mà không có "about".',
  },
  {
    id: 'pq-4',
    cefrWeight: 'B1',
    skill: 'Phonetics',
    question: 'Which word contains the voiceless dental fricative /θ/ (đặt đầu lưỡi giữa hai răng, không rung họng)?',
    options: ['these', 'weather', 'throughput', 'smooth'],
    correctIdx: 2,
    explanationVi: '"Throughput" bắt đầu bằng âm vô thanh /θ/, trong khi "these, weather, smooth" mang âm hữu thanh /ð/.',
  },
  {
    id: 'pq-5',
    cefrWeight: 'B1',
    skill: 'Lexical',
    question: 'Which option is the standard English idiom for presenting a contrasting point?',
    options: ['In the other hand', 'On the other hand', 'At the other hand', 'By the other hand'],
    correctIdx: 1,
    explanationVi: 'Thành ngữ chuẩn luôn là "On the other hand".',
  },
  {
    id: 'pq-6',
    cefrWeight: 'B2',
    skill: 'Lexical',
    question: 'Choosing eventual consistency over strict serializability is an intentional ______ to achieve lower latency.',
    options: ['tradeoff', 'bottleneck', 'remit', 'manuscript'],
    correctIdx: 0,
    explanationVi: '"Tradeoff" là sự đánh đổi có chủ đích giữa hai thuộc tính đối nghịch.',
  },
  {
    id: 'pq-7',
    cefrWeight: 'B2',
    skill: 'Grammar',
    question: 'Had we configured rate limiting earlier, the traffic spike ______ the authentication service.',
    options: ['will not crash', 'would not crash', 'would not have crashed', 'did not crash'],
    correctIdx: 2,
    explanationVi: 'Đảo ngữ câu điều kiện loại 3 diễn tả giả định trái với quá khứ: "would not have crashed".',
  },
  {
    id: 'pq-8',
    cefrWeight: 'B2',
    skill: 'Phonetics',
    question: 'In fast connected speech, "want to" and "going to" naturally reduce to:',
    options: ['wanna & gonna', 'wont & gont', 'wantuh & go-in', 'wana & gonaa'],
    correctIdx: 0,
    explanationVi: 'Âm /t/ bị nuốt/giảm nhẹ và giới từ "to" lướt về âm schwa /ə/: wanna /ˈwɑːnə/, gonna /ˈɡʌnə/.',
  },
  {
    id: 'pq-9',
    cefrWeight: 'C1',
    skill: 'Lexical',
    question: 'A calm, distraction-free interface is highly ______ to deep cognitive focus.',
    options: ['conducive', 'conspicuous', 'intermittent', 'circumspect'],
    correctIdx: 0,
    explanationVi: '"Conducive to something" mang nghĩa tạo điều kiện thuận lợi cho việc gì đó.',
  },
  {
    id: 'pq-10',
    cefrWeight: 'C1',
    skill: 'Grammar',
    question: 'Not only ______ network overhead, but local-first caching also guarantees offline resilience.',
    options: ['it reduces', 'does it reduce', 'reduces it', 'it did reduce'],
    correctIdx: 1,
    explanationVi: 'Khi "Not only" đứng đầu câu, mệnh đề đầu bắt buộc đảo trợ động từ lên trước chủ ngữ: "does it reduce".',
  },
  {
    id: 'pq-11',
    cefrWeight: 'C2',
    skill: 'Reading',
    question: 'What does "proscribe" mean in: "Our design system strictly proscribes decorative neon gradients"?',
    options: [
      'Recommends as a default',
      'Forbids or prohibits officially',
      'Generates automatically',
      'Measures performance impact',
    ],
    correctIdx: 1,
    explanationVi: '"Proscribe" nghĩa là cấm đoán nghiêm ngặt (trái nghĩa với "prescribe" là khuyên dùng/kê đơn).',
  },
  {
    id: 'pq-12',
    cefrWeight: 'C2',
    skill: 'Lexical',
    question: 'Premature optimization frequently ______ code complexity without yielding measurable gains.',
    options: ['mitigates', 'exacerbates', 'corroborates', 'ascribes'],
    correctIdx: 1,
    explanationVi: '"Exacerbate" (C2) nghĩa là làm trầm trọng thêm một vấn đề xấu.',
  },
];

export function evaluatePlacementScore(correctCount: number, total: number): {
  cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  ieltsEstimate: string;
  recommendationVi: string;
} {
  const ratio = correctCount / Math.max(1, total);
  if (ratio >= 0.91) {
    return { cefr: 'C2', ieltsEstimate: '8.5+', recommendationVi: 'Nền tảng xuất sắc! Hãy tập trung vào Nominalization (Unit 6), Idiomatic Precision và Writing Band 8.5.' };
  }
  if (ratio >= 0.75) {
    return { cefr: 'C1', ieltsEstimate: '7.5–8.0', recommendationVi: 'Trình độ nâng cao! Bắt đầu từ Unit 5 (Negative Inversion), Shadowing giọng bản xứ và IELTS Writing Task 2.' };
  }
  if (ratio >= 0.58) {
    return { cefr: 'B2', ieltsEstimate: '6.5–7.0', recommendationVi: 'Giao tiếp khá tốt! Tập trung Unit 4 (Technical Tradeoffs), Minimal Pairs và đọc tin Engoo mỗi ngày.' };
  }
  if (ratio >= 0.4) {
    return { cefr: 'B1', ieltsEstimate: '5.5–6.0', recommendationVi: 'Hãy củng cố Unit 3 (Connected Speech) và sửa triệt để lỗi dịch word-by-word từ tiếng Việt.' };
  }
  if (ratio >= 0.25) {
    return { cefr: 'A2', ieltsEstimate: '4.5–5.0', recommendationVi: 'Bắt đầu vững chắc từ Unit 2 để làm chủ phản xạ thì và loại bỏ giới từ thừa.' };
  }
  return { cefr: 'A1', ieltsEstimate: '3.5–4.0', recommendationVi: 'Khởi động từ Unit 1 với câu đơn nền tảng, FSRS 15 thẻ/ngày và Qwerty gõ từ vựng.' };
}

export const CURRICULUM_UNITS: CurriculumUnit[] = [
  {
    id: 'unit-a1-1',
    unitNumber: 1,
    cefr: 'A1',
    title: 'Everyday Sentence Skeleton & Rhythm of Simple Tenses',
    subtitleVi: 'Xây bộ khung câu Chủ ngữ – Động từ – Tân ngữ chuẩn xác và chia đúng Hiện tại / Quá khứ đơn',
    estimatedMin: 10,
    grammarBlueprint: {
      formula: 'Subject + Verb (s/es hoặc V-ed) + Object + Time Marker',
      usageVi: 'Tiếng Anh bắt buộc có động từ chia theo thì và chủ ngữ, ngay cả khi câu chỉ mang tính mô tả ("It IS fast" chứ không nói "It fast").',
      commonMistakeVi: 'Bỏ quên động từ to-be trước tính từ (Sai: "This app very useful" → Đúng: "This app is very useful").',
    },
    keyPatterns: [
      { en: 'She practices English pronunciation for twenty minutes every morning.', vi: 'Cô ấy luyện phát âm tiếng Anh hai mươi phút mỗi sáng.' },
      { en: 'The interface is clean, responsive, and easy to navigate.', vi: 'Giao diện sạch sẽ, phản hồi nhanh và dễ điều hướng.' },
      { en: 'Yesterday, I reviewed thirty flashcards on the train.', vi: 'Hôm qua tôi đã ôn ba mươi thẻ nhớ trên tàu.' },
    ],
    transformationDrill: {
      promptEn: 'Sửa câu thiếu động từ to-be: "My pronunciation much better today."',
      hintKeyword: 'pronunciation is much better',
      acceptedAnswers: [
        'My pronunciation is much better today.',
        'My pronunciation is much better today',
      ],
      explanationVi: 'Trước cụm tính từ "much better" bắt buộc có động từ to-be "is".',
    },
    quiz: [
      {
        q: 'Choose the correct sentence:',
        options: ['The audio very clear.', 'The audio is very clear.', 'The audio are very clear.'],
        answerIdx: 1,
        explainVi: '"The audio" là danh từ không đếm được/số ít nên đi với "is".',
      },
    ],
  },
  {
    id: 'unit-a2-2',
    unitNumber: 2,
    cefr: 'A2',
    title: 'Eliminating Vietnamese-English Direct Translations',
    subtitleVi: 'Xoá bỏ thói quen dịch từng chữ tiếng Việt sang tiếng Anh (Agree, Discuss, Depend)',
    estimatedMin: 12,
    grammarBlueprint: {
      formula: 'Subject + Action Verb (agree / discuss / emphasize) + Direct Object',
      usageVi: 'Trong tiếng Việt ta nói "đồng ý là (am agree)" hoặc "thảo luận về (discuss about)", nhưng trong tiếng Anh đây là các động từ đi trực tiếp không kèm to-be hay giới từ thừa.',
      commonMistakeVi: 'Sai: "I am agree with you" → Đúng: "I completely agree with you". Sai: "discuss about the plan" → Đúng: "discuss the plan".',
    },
    keyPatterns: [
      { en: 'I completely agree with your assessment of the timeline.', vi: 'Tôi hoàn toàn đồng ý với đánh giá của bạn về tiến độ.' },
      { en: 'Let us discuss the deployment checklist before noon.', vi: 'Hãy thảo luận danh sách kiểm tra triển khai trước buổi trưa.' },
      { en: 'Success depends on consistent daily practice.', vi: 'Thành công phụ thuộc vào việc luyện tập đều đặn hằng ngày.' },
    ],
    transformationDrill: {
      promptEn: 'Viết lại câu đúng ngữ pháp cho câu sai sau: "I am agree that we should discuss about the problem."',
      hintKeyword: 'I agree that we should discuss',
      acceptedAnswers: [
        'I agree that we should discuss the problem.',
        'I agree that we should discuss the problem',
      ],
      explanationVi: 'Bỏ "am" trước "agree" và bỏ "about" sau "discuss".',
    },
    quiz: [
      {
        q: 'Which sentence is grammatically natural?',
        options: [
          'I am agree with this architecture.',
          'I agree with this architecture.',
          'I am agreeing to this architecture always.',
        ],
        answerIdx: 1,
        explainVi: '"Agree" là động từ thường không đi sau "am".',
      },
      {
        q: 'Fill in the blank: "Response time ______ heavily on index selectivity."',
        options: ['depends of', 'depends on', 'is depend on'],
        answerIdx: 1,
        explainVi: 'Cụm chuẩn luôn là "depend on".',
      },
    ],
  },
  {
    id: 'unit-b1-3',
    unitNumber: 3,
    cefr: 'B1',
    title: 'Connected Speech & Natural Rhythm in Spoken English',
    subtitleVi: 'Quy tắc nối âm phụ âm–nguyên âm & giảm âm (Schwa /ə/) để nghe hiểu người bản xứ',
    estimatedMin: 15,
    grammarBlueprint: {
      formula: 'Consonant End + Vowel Start → Linked Syllable (hold_on → hol-don)',
      usageVi: 'Người bản xứ không đọc tách rời từng từ mà nối phụ âm cuối của từ trước vào nguyên âm đầu của từ sau, đồng thời hạ các từ chức năng (to, of, for, and) về âm lướt /ə/.',
      commonMistakeVi: 'Đọc đều đều từng từ với trọng âm ngang nhau khiến câu nói thiếu nhạc tính và khi nghe thực tế bị ngợp.',
    },
    keyPatterns: [
      { en: 'We need to figure it out (/ˈfɪɡ.jər.ɪ.taʊt/) before Friday.', vi: 'Chúng ta cần tìm ra cách giải quyết trước thứ Sáu.' },
      { en: 'What are you going to (/ˈɡə.nə/) work on (/wɜː.kɑːn/) today?', vi: 'Hôm nay bạn định làm phần việc gì?' },
      { en: 'Could you check it out (/tʃe.kɪ.taʊt/) when you have a minute?', vi: 'Bạn xem qua giúp mình khi rảnh một chút được không?' },
    ],
    transformationDrill: {
      promptEn: 'Viết dạng đầy đủ chuẩn văn viết của câu nói lướt: "We wanna wrap it up before lunch."',
      hintKeyword: 'want to',
      acceptedAnswers: [
        'We want to wrap it up before lunch.',
        'We want to wrap it up before lunch',
      ],
      explanationVi: '"Wanna" trong văn nói tương ứng với "want to" trong văn viết chuẩn.',
    },
    quiz: [
      {
        q: 'In natural fast speech, how is "kind of" typically reduced?',
        options: ['/ˈkaɪn.də/ (kinda)', '/ˈkɪnd.ɒf/', '/ˈkeɪnd.əʊ/'],
        answerIdx: 0,
        explainVi: 'Âm /d/ nối sang "of" giảm âm thành /ə/ tạo ra /ˈkaɪn.də/.',
      },
      {
        q: 'Which words receive primary stress in an English sentence?',
        options: [
          'Prepositions and articles (in, on, the, a)',
          'Content words (nouns, main verbs, adjectives, adverbs)',
          'Every single word equally',
        ],
        answerIdx: 1,
        explainVi: 'Chỉ các từ mang nội dung (Content words) mới được nhấn trọng âm và kéo dài.',
      },
    ],
  },
  {
    id: 'unit-b2-4',
    unitNumber: 4,
    cefr: 'B2',
    title: 'Articulating Technical Tradeoffs & Cause–Effect Precision',
    subtitleVi: 'Cấu trúc diễn đạt nguyên nhân–hệ quả và sự đánh đổi trong công việc & IELTS',
    estimatedMin: 18,
    grammarBlueprint: {
      formula: 'While [Option A] offers [Benefit 1], it introduces [Drawback], whereas [Option B] prioritizes [Benefit 2].',
      usageVi: 'Dùng để so sánh hai phương án một cách khách quan, chuyên nghiệp trong phỏng vấn System Design, thuyết trình hoặc IELTS Writing Task 2.',
      commonMistakeVi: 'Dùng lặp đi lặp lại "Because... so..." trong cùng một câu (tiếng Anh tuyệt đối không dùng cả Because lẫn So trong cùng 1 câu).',
    },
    keyPatterns: [
      { en: 'While client-side caching reduces latency, it introduces invalidation complexity.', vi: 'Mặc dù lưu bộ nhớ đệm phía client giúp giảm độ trễ, nó lại làm tăng độ phức tạp khi làm mới dữ liệu.' },
      { en: 'We opted for SQLite primarily due to its zero-latency local reads.', vi: 'Chúng tôi chọn SQLite chủ yếu nhờ khả năng đọc dữ liệu cục bộ không có độ trễ.' },
      { en: 'This bottleneck stems from unindexed foreign keys.', vi: 'Điểm nghẽn này bắt nguồn từ các khóa ngoại chưa được đánh chỉ mục.' },
    ],
    transformationDrill: {
      promptEn: 'Sửa câu mắc lỗi "Because... so...": "Because the payload was huge, so the request timed out."',
      hintKeyword: 'Because the payload was huge, the request timed out',
      acceptedAnswers: [
        'Because the payload was huge, the request timed out.',
        'The payload was huge, so the request timed out.',
      ],
      explanationVi: 'Chỉ giữ lại "Because" ở đầu câu HOẶC "so" ở giữa câu, không bao giờ dùng cả hai.',
    },
    quiz: [
      {
        q: 'Choose the sentence that is 100% grammatically correct:',
        options: [
          'Although the server was overloaded, but it remained responsive.',
          'Although the server was overloaded, it remained responsive.',
          'Because the query was slow, so we added an index.',
        ],
        answerIdx: 1,
        explainVi: 'Không dùng "Although... but..." hay "Because... so..." trong tiếng Anh.',
      },
    ],
  },
  {
    id: 'unit-c1-5',
    unitNumber: 5,
    cefr: 'C1',
    title: 'Negative Inversion & High-Impact Academic Framing (Band 8.0+)',
    subtitleVi: 'Đảo ngữ nhấn mạnh (Not only, Seldom, Only by) để nâng điểm Grammatical Range lên C1/C2',
    estimatedMin: 20,
    grammarBlueprint: {
      formula: 'Negative/Restrictive Adverbial (Not only / Seldom / Only by...) + Auxiliary (do/does/did/have/can) + Subject + Verb',
      usageVi: 'Đặt trạng từ phủ định hoặc giới hạn lên đầu câu và đảo trợ động từ lên trước chủ ngữ để tạo điểm nhấn hùng biện sắc bén trong bài viết IELTS Band 8.0+ và bài thuyết trình.',
      commonMistakeVi: 'Quên đảo trợ động từ lên trước chủ ngữ (VD viết sai: "Not only it saves time..." thay vì "Not only does it save time...").',
    },
    keyPatterns: [
      { en: 'Not only does spaced repetition strengthen recall, but it also halves study time.', vi: 'Lặp lại ngắt quãng không chỉ củng cố trí nhớ mà còn giảm một nửa thời gian học.' },
      { en: 'Seldom do engineering teams encounter such a clean architectural boundary.', vi: 'Hiếm khi các đội ngũ kỹ thuật gặp được một ranh giới kiến trúc sạch sẽ đến vậy.' },
      { en: 'Only by measuring real user telemetry can we verify the optimization.', vi: 'Chỉ bằng cách đo lường số liệu thực tế từ người dùng chúng ta mới kiểm chứng được việc tối ưu.' },
    ],
    transformationDrill: {
      promptEn: 'Viết lại bằng đảo ngữ "Not only": "It reduces latency and it improves battery life."',
      hintKeyword: 'Not only does it reduce latency',
      acceptedAnswers: [
        'Not only does it reduce latency, but it also improves battery life.',
        'Not only does it reduce latency, it also improves battery life.',
      ],
      explanationVi: 'Đưa "Not only" lên đầu câu, mượn trợ động từ "does" + chủ ngữ "it" + động từ nguyên mẫu "reduce".',
    },
    quiz: [
      {
        q: 'Complete the C1 inverted sentence: "Only by practicing aloud ______ natural intonation."',
        options: ['learners can master', 'can learners master', 'master learners can'],
        answerIdx: 1,
        explainVi: 'Sau cụm "Only by + V-ing" đứng đầu câu, mệnh đề chính phải đảo trợ động từ "can" lên trước chủ ngữ "learners".',
      },
    ],
  },
  {
    id: 'unit-c2-6',
    unitNumber: 6,
    cefr: 'C2',
    title: 'Nominalization & Concise Executive Synthesis',
    subtitleVi: 'Danh từ hóa cụm động từ và cô đọng văn phong cấp C2 / Staff Engineer / IELTS 8.5',
    estimatedMin: 22,
    grammarBlueprint: {
      formula: 'Verb Clause → Precision Noun Phrase + Strong Analytical Verb (exacerbate, mitigate, underscore, catalyze)',
      usageVi: 'Chuyển các mệnh đề dài dòng dùng động từ thường thành cụm danh từ cô đọng kết hợp với động từ học thuật mạnh để tăng mật độ thông tin.',
      commonMistakeVi: 'Lạm dụng câu bị động rườm rà thay vì dùng chủ ngữ là cụm danh từ kết hợp động từ tác động trực tiếp.',
    },
    keyPatterns: [
      { en: 'The proliferation of on-device models has catalyzed a shift toward local-first privacy.', vi: 'Sự bùng nổ của các mô hình chạy trên thiết bị đã thúc đẩy làn sóng dịch chuyển sang bảo mật cục bộ.' },
      { en: 'Premature optimization frequently exacerbates code complexity without yielding measurable gains.', vi: 'Việc tối ưu hóa quá sớm thường làm trầm trọng thêm độ phức tạp của mã nguồn mà không mang lại lợi ích đo đếm được.' },
    ],
    transformationDrill: {
      promptEn: 'Nâng cấp câu sau bằng động từ C2 "mitigate": "Rate limiting reduces the risk of outages."',
      hintKeyword: 'mitigates the risk',
      acceptedAnswers: [
        'Rate limiting mitigates the risk of outages.',
        'Rate limiting mitigates the risk of outages',
      ],
      explanationVi: 'Dùng "mitigates the risk" thay cho "reduces the risk" để chuẩn C1/C2.',
    },
    quiz: [
      {
        q: 'Which verb best replaces "make worse" in formal academic or engineering writing?',
        options: ['mitigate', 'exacerbate', 'corroborate', 'ameliorate'],
        answerIdx: 1,
        explainVi: '"Exacerbate" nghĩa là làm trầm trọng thêm (ngược nghĩa với "mitigate" và "ameliorate").',
      },
    ],
  },
];
