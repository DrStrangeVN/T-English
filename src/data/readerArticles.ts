export interface ReaderSentence {
  id: string;
  timestamp: string;
  en: string;
  vi: string;
}

export interface ReaderQuizQuestion {
  q: string;
  options: string[];
  answerIdx: number;
  explainVi: string;
}

export interface ReaderArticle {
  id: string;
  kind: 'Engoo Daily News' | 'YouTube Transcript' | 'Tech Essay' | 'IELTS Reading';
  title: string;
  source: string;
  cefr: 'B1' | 'B2' | 'C1' | 'C2';
  minutes: number;
  vocabPreview: Array<{
    word: string;
    ipa: string;
    pos: string;
    meaningVi: string;
  }>;
  sentences: ReaderSentence[];
  comprehensionQuiz: ReaderQuizQuestion[];
  discussionQuestions: string[];
}

export interface WordGloss {
  ipa: string;
  pos: string;
  meaningVi: string;
  meaningEn: string;
  collocation: string;
}

export const READER_GLOSSARY: Record<string, WordGloss> = {
  comprehensible: { ipa: '/ˌkɑːm.prɪˈhen.sə.bəl/', pos: 'adj', meaningVi: 'có thể hiểu được (vừa tầm nhận thức)', meaningEn: 'able to be understood naturally from context', collocation: 'comprehensible input' },
  acquisition: { ipa: '/ˌæk.wɪˈzɪʃ.ən/', pos: 'noun', meaningVi: 'sự thụ đắc ngôn ngữ một cách tự nhiên', meaningEn: 'the natural process of gaining a skill or language', collocation: 'language acquisition' },
  subconsciously: { ipa: '/ˌsʌbˈkɑːn.ʃəs.li/', pos: 'adv', meaningVi: 'một cách vô thức, tự nhiên không gượng ép', meaningEn: 'without deliberate conscious effort', collocation: 'absorb subconsciously' },
  resilient: { ipa: '/rɪˈzɪl.i.ənt/', pos: 'adj', meaningVi: 'bền bỉ, phục hồi nhanh', meaningEn: 'quick to recover from setbacks or load', collocation: 'resilient habits' },
  architecture: { ipa: '/ˈɑːr.kɪ.tek.tʃər/', pos: 'noun', meaningVi: 'kiến trúc, cấu trúc tổng thể', meaningEn: 'the underlying structure of a complex system', collocation: 'software architecture' },
  latency: { ipa: '/ˈleɪ.tən.si/', pos: 'noun', meaningVi: 'độ trễ xử lý', meaningEn: 'delay before a transfer of data or response begins', collocation: 'ultra-low latency' },
  bottleneck: { ipa: '/ˈbɑː.təl.nek/', pos: 'noun', meaningVi: 'điểm nghẽn cổ chai', meaningEn: 'a constraint slowing down total throughput', collocation: 'remove a bottleneck' },
  ubiquitous: { ipa: '/juːˈbɪk.wɪ.təs/', pos: 'adj', meaningVi: 'có mặt ở khắp mọi nơi', meaningEn: 'found everywhere simultaneously', collocation: 'ubiquitous presence' },
  pragmatic: { ipa: '/præɡˈmæt.ɪk/', pos: 'adj', meaningVi: 'thực tế, chú trọng kết quả', meaningEn: 'focused on practical results rather than theory', collocation: 'pragmatic strategy' },
  mitigate: { ipa: '/ˈmɪt.ɪ.ɡeɪt/', pos: 'verb', meaningVi: 'giảm thiểu rủi ro/tác động xấu', meaningEn: 'to reduce severity or impact', collocation: 'mitigate cognitive overload' },
  eloquent: { ipa: '/ˈel.ə.kwənt/', pos: 'adj', meaningVi: 'trôi chảy, giàu sức thuyết phục', meaningEn: 'fluent and persuasive in expression', collocation: 'eloquent articulation' },
  tradeoff: { ipa: '/ˈtreɪd.ɔːf/', pos: 'noun', meaningVi: 'sự đánh đổi cân nhắc', meaningEn: 'compromise between competing properties', collocation: 'speed-accuracy tradeoff' },
  proliferation: { ipa: '/prəˌlɪf.ərˈeɪ.ʃən/', pos: 'noun', meaningVi: 'sự gia tăng nhanh chóng, bùng nổ', meaningEn: 'rapid increase in numbers or spread', collocation: 'proliferation of AI' },
  conducive: { ipa: '/kənˈduː.sɪv/', pos: 'adj', meaningVi: 'tạo điều kiện thuận lợi cho', meaningEn: 'making a positive outcome likely', collocation: 'conducive to deep focus' },
  consolidation: { ipa: '/kənˌsɑː.lɪˈdeɪ.ʃən/', pos: 'noun', meaningVi: 'sự củng cố vững chắc (trí nhớ)', meaningEn: 'making memory or systems stronger and unified', collocation: 'memory consolidation' },
  intermittent: { ipa: '/ˌɪn.tərˈmɪt.ənt/', pos: 'adj', meaningVi: 'ngắt quãng, chập chờn', meaningEn: 'occurring irregularly rather than continuously', collocation: 'intermittent connectivity' },
  unprecedented: { ipa: '/ʌnˈpres.ɪ.den.tɪd/', pos: 'adj', meaningVi: 'chưa từng có tiền lệ', meaningEn: 'never done or known before', collocation: 'unprecedented speed' },
  compelling: { ipa: '/kəmˈpel.ɪŋ/', pos: 'adj', meaningVi: 'đầy sức thuyết phục', meaningEn: 'evoking strong interest or agreement', collocation: 'compelling evidence' },
  exacerbate: { ipa: '/ɪɡˈzæs.ər.beɪt/', pos: 'verb', meaningVi: 'làm trầm trọng thêm', meaningEn: 'to make an existing problem worse', collocation: 'exacerbate fatigue' },
  sustainable: { ipa: '/səˈsteɪ.nə.bəl/', pos: 'adj', meaningVi: 'bền vững lâu dài', meaningEn: 'able to continue over a long period', collocation: 'sustainable routine' },
  empathy: { ipa: '/ˈem.pə.θi/', pos: 'noun', meaningVi: 'sự thấu cảm', meaningEn: 'ability to understand another person’s feelings', collocation: 'genuine human empathy' },
  cognitive: { ipa: '/ˈkɑːɡ.nə.tɪv/', pos: 'adj', meaningVi: 'thuộc về nhận thức, tư duy', meaningEn: 'related to conscious mental processes', collocation: 'cognitive load' },
  passive: { ipa: '/ˈpæs.ɪv/', pos: 'adj', meaningVi: 'thụ động', meaningEn: 'receiving without active production', collocation: 'passive vocabulary' },
  shadowing: { ipa: '/ˈʃæd.əʊ.ɪŋ/', pos: 'noun', meaningVi: 'kỹ thuật nghe và nhại lại ngay theo người bản xứ', meaningEn: 'repeating spoken audio almost simultaneously', collocation: 'daily shadowing' },
  pipeline: { ipa: '/ˈpaɪp.laɪn/', pos: 'noun', meaningVi: 'chuỗi quy trình xử lý liên hoàn', meaningEn: 'series of sequential processing stages', collocation: 'on-device pipeline' },
};

export const READER_ARTICLES: ReaderArticle[] = [
  {
    id: 'art-1',
    kind: 'Engoo Daily News',
    title: 'Why 1,000 Hours of Comprehensible Input Beats Rote Memorization',
    source: 'Engoo 5-Step Method · Enjoy 1000H',
    cefr: 'C1',
    minutes: 6,
    vocabPreview: [
      { word: 'acquisition', ipa: '/ˌæk.wɪˈzɪʃ.ən/', pos: 'noun', meaningVi: 'sự thụ đắc ngôn ngữ tự nhiên' },
      { word: 'comprehensible', ipa: '/ˌkɑːm.prɪˈhen.sə.bəl/', pos: 'adj', meaningVi: 'dễ hiểu vừa tầm' },
      { word: 'mitigate', ipa: '/ˈmɪt.ɪ.ɡeɪt/', pos: 'verb', meaningVi: 'giảm thiểu' },
      { word: 'eloquent', ipa: '/ˈel.ə.kwənt/', pos: 'adj', meaningVi: 'hùng biện, lưu loát' },
    ],
    sentences: [
      { id: 's-1', timestamp: '00:12', en: 'True language acquisition happens subconsciously when you consume comprehensible input slightly above your current level.', vi: 'Sự thụ đắc ngôn ngữ thực sự diễn ra một cách tự nhiên khi bạn tiếp nhận ngữ liệu dễ hiểu cao hơn một chút so với trình độ hiện tại.' },
      { id: 's-2', timestamp: '00:28', en: 'Instead of isolating random vocabulary lists, mining complete sentences helps mitigate cognitive overload and builds resilient recall.', vi: 'Thay vì học tách rời các danh sách từ ngẫu nhiên, việc khai thác trọn vẹn cả câu giúp giảm quá tải nhận thức và tạo trí nhớ bền vững.' },
      { id: 's-3', timestamp: '00:45', en: 'When you pair spaced repetition with daily shadowing, passive recognition transforms into eloquent spoken fluency.', vi: 'Khi bạn kết hợp lặp lại ngắt quãng với luyện nhại câu hằng ngày, vốn từ thụ động sẽ chuyển hóa thành khả năng nói trôi chảy đầy thuyết phục.' },
      { id: 's-4', timestamp: '01:02', en: 'Consistency remains far more decisive than occasional weekend marathons because memory consolidation thrives on daily cues.', vi: 'Sự đều đặn đóng vai trò quyết định hơn nhiều so với việc học dồn cuối tuần vì quá trình củng cố trí nhớ cần những tín hiệu nhắc lại hằng ngày.' },
    ],
    comprehensionQuiz: [
      {
        q: 'According to the article, what level of English input produces the best natural acquisition?',
        options: [
          'Extremely difficult academic texts with 50% unknown words',
          'Comprehensible input slightly above your current level',
          'Isolated random vocabulary lists without sentences',
        ],
        answerIdx: 1,
        explainVi: 'Nguyên lý i+1 của Krashen: ngữ liệu vừa hiểu được và cao hơn trình độ hiện tại một chút.',
      },
      {
        q: 'Why is mining complete sentences recommended over isolated word lists?',
        options: [
          'It mitigates cognitive overload and strengthens context-based recall',
          'It eliminates the need to practice speaking aloud',
          'It requires studying only on weekends',
        ],
        answerIdx: 0,
        explainVi: 'Đào cả câu giúp giảm tải nhận thức và giữ ngữ cảnh thực tế.',
      },
    ],
    discussionQuestions: [
      'How do you currently balance passive listening input with active speaking practice in your daily routine?',
      'Which topic (technology, news, podcasts, or movies) keeps you most motivated to reach 1,000 hours?',
      'Have you noticed a difference when memorizing full sentences compared to isolated words?',
    ],
  },
  {
    id: 'art-2',
    kind: 'Tech Essay',
    title: 'Designing Low-Latency Voice Agents on Apple Silicon',
    source: 'T-English Engineering Digest',
    cefr: 'C1',
    minutes: 5,
    vocabPreview: [
      { word: 'latency', ipa: '/ˈleɪ.tən.si/', pos: 'noun', meaningVi: 'độ trễ xử lý' },
      { word: 'tradeoff', ipa: '/ˈtreɪd.ɔːf/', pos: 'noun', meaningVi: 'sự đánh đổi' },
      { word: 'ubiquitous', ipa: '/juːˈbɪk.wɪ.təs/', pos: 'adj', meaningVi: 'phổ biến khắp nơi' },
      { word: 'bottleneck', ipa: '/ˈbɑː.təl.nek/', pos: 'noun', meaningVi: 'điểm nghẽn' },
    ],
    sentences: [
      { id: 's-5', timestamp: '00:05', en: 'Running Whisper models locally eliminates network latency, which makes real-time pronunciation coaching feel immediate.', vi: 'Việc chạy mô hình Whisper trực tiếp trên máy loại bỏ độ trễ mạng, giúp quá trình chấm điểm phát âm theo thời gian thực diễn ra tức thì.' },
      { id: 's-6', timestamp: '00:21', en: 'Every engineering architecture faces a pragmatic tradeoff between model precision and battery efficiency on mobile devices.', vi: 'Mọi kiến trúc kỹ thuật đều đối mặt với sự đánh đổi thực tế giữa độ chính xác mô hình và hiệu quả pin trên thiết bị di động.' },
      { id: 's-7', timestamp: '00:39', en: 'Although cloud models remain ubiquitous, hybrid on-device pipelines remove the single biggest bottleneck for commuters.', vi: 'Dù mô hình đám mây vẫn phổ biến khắp nơi, quy trình lai chạy trên thiết bị giúp gỡ bỏ điểm nghẽn lớn nhất cho người học khi di chuyển.' },
      { id: 's-8', timestamp: '00:54', en: 'Protecting voice biometrics locally also fosters user trust while avoiding recurring API expenditure.', vi: 'Bảo vệ sinh trắc học giọng nói cục bộ còn tạo niềm tin cho người dùng đồng thời tránh chi phí API phát sinh liên tục.' },
    ],
    comprehensionQuiz: [
      {
        q: 'What primary tradeoff must mobile voice architectures navigate?',
        options: [
          'Model precision versus battery efficiency on mobile devices',
          'Screen brightness versus font size',
          'Dark mode versus Light mode',
        ],
        answerIdx: 0,
        explainVi: 'Kiến trúc di động luôn cân bằng giữa độ chính xác AI và thời lượng pin.',
      },
    ],
    discussionQuestions: [
      'Why does sub-150ms latency matter so much when practicing conversational speaking with an AI tutor?',
      'Do you prefer offline privacy on-device or larger cloud models when practicing English?',
    ],
  },
  {
    id: 'art-3',
    kind: 'Engoo Daily News',
    title: 'Sleep & Spaced Repetition: How Nighttime Consolidation Locks In Vocabulary',
    source: 'Engoo Science & Memory Desk',
    cefr: 'B2',
    minutes: 5,
    vocabPreview: [
      { word: 'consolidation', ipa: '/kənˌsɑː.lɪˈdeɪ.ʃən/', pos: 'noun', meaningVi: 'sự củng cố trí nhớ' },
      { word: 'sustainable', ipa: '/səˈsteɪ.nə.bəl/', pos: 'adj', meaningVi: 'bền vững' },
      { word: 'exacerbate', ipa: '/ɪɡˈzæs.ər.beɪt/', pos: 'verb', meaningVi: 'làm trầm trọng thêm' },
    ],
    sentences: [
      { id: 's-9', timestamp: '00:10', en: 'Neuroscientists have found compelling evidence that reviewing challenging words ten minutes before sleep boosts memory consolidation.', vi: 'Các nhà khoa học thần kinh tìm thấy bằng chứng thuyết phục rằng ôn lại từ khó 10 phút trước khi ngủ giúp tăng cường củng cố trí nhớ.' },
      { id: 's-10', timestamp: '00:26', en: 'During deep sleep, the hippocampus replays newly encountered phrases and transfers them into long-term cortical storage.', vi: 'Trong giấc ngủ sâu, hồi hải mã phát lại những cụm từ mới gặp và chuyển chúng vào kho lưu trữ dài hạn trên vỏ não.' },
      { id: 's-11', timestamp: '00:44', en: 'Conversely, chronic sleep deprivation can exacerbate forgetting and undermine otherwise sustainable study habits.', vi: 'Ngược lại, thiếu ngủ kéo dài có thể làm trầm trọng thêm sự quên lãng và phá vỡ thói quen học tập bền vững.' },
    ],
    comprehensionQuiz: [
      {
        q: 'When is a particularly effective time to review difficult flashcards according to neuroscience?',
        options: [
          'Right before going to sleep',
          'Only once per month for three hours',
          'While multitasking in noisy meetings',
        ],
        answerIdx: 0,
        explainVi: 'Ôn 10 phút trước khi ngủ tận dụng quá trình củng cố trí nhớ trong giấc ngủ sâu.',
      },
    ],
    discussionQuestions: [
      'What time of day do you feel sharpest for learning new vocabulary versus reviewing old cards?',
      'How many cards per day feels sustainable for your personal schedule?',
    ],
  },
  {
    id: 'art-4',
    kind: 'IELTS Reading',
    title: 'The Economics of Minimalist Interfaces in Attention-Scarce Workplaces',
    source: 'IELTS Academic Reading Passage',
    cefr: 'C2',
    minutes: 7,
    vocabPreview: [
      { word: 'conducive', ipa: '/kənˈduː.sɪv/', pos: 'adj', meaningVi: 'tạo điều kiện thuận lợi' },
      { word: 'proliferation', ipa: '/prəˌlɪf.ərˈeɪ.ʃən/', pos: 'noun', meaningVi: 'sự bùng nổ tràn lan' },
      { word: 'cognitive', ipa: '/ˈkɑːɡ.nə.tɪv/', pos: 'adj', meaningVi: 'thuộc nhận thức' },
    ],
    sentences: [
      { id: 's-12', timestamp: '00:08', en: 'Amid the proliferation of notification-heavy software, calm neutral interfaces have emerged as a competitive advantage.', vi: 'Giữa sự bùng nổ của các phần mềm ngập tràn thông báo, giao diện trung tính tĩnh lặng đã nổi lên như một lợi thế cạnh tranh.' },
      { id: 's-13', timestamp: '00:25', en: 'Removing decorative gradients and visual noise frees working memory, creating an environment conducive to deep comprehension.', vi: 'Việc loại bỏ các dải màu chuyển sắc trang trí và nhiễu thị giác giúp giải phóng trí nhớ làm việc, tạo môi trường thuận lợi cho sự thấu hiểu sâu.' },
      { id: 's-14', timestamp: '00:42', en: 'Unprecedented clarity in typography enables professionals to scan complex technical prose with minimal cognitive friction.', vi: 'Độ sắc nét chưa từng có về kiểu chữ giúp giới chuyên môn đọc lướt văn bản kỹ thuật phức tạp với ma sát nhận thức tối thiểu.' },
    ],
    comprehensionQuiz: [
      {
        q: 'How does removing visual clutter benefit learners and knowledge workers?',
        options: [
          'It frees working memory for deeper comprehension',
          'It forces them to memorize fewer words',
          'It eliminates the need for dark mode',
        ],
        answerIdx: 0,
        explainVi: 'Giảm nhiễu thị giác giúp giải phóng bộ nhớ làm việc (working memory).',
      },
    ],
    discussionQuestions: [
      'Do cluttered, overly gamified apps distract you from deep language learning?',
      'How does typography clarity influence your reading endurance on Mac and iPhone?',
    ],
  },
];
