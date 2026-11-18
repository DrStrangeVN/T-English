export interface ReaderSentence {
  id: string;
  timestamp: string;
  en: string;
  vi: string;
}

export interface ReaderArticle {
  id: string;
  kind: 'YouTube Transcript' | 'Tech Essay' | 'IELTS Reading';
  title: string;
  source: string;
  cefr: 'B2' | 'C1' | 'C2';
  minutes: number;
  sentences: ReaderSentence[];
}

export interface WordGloss {
  ipa: string;
  pos: string;
  meaningVi: string;
  meaningEn: string;
  collocation: string;
}

export const READER_GLOSSARY: Record<string, WordGloss> = {
  comprehensible: {
    ipa: '/ˌkɑːm.prɪˈhen.sə.bəl/',
    pos: 'adj',
    meaningVi: 'có thể hiểu được (vừa tầm nhận thức)',
    meaningEn: 'able to be understood naturally from context',
    collocation: 'comprehensible input',
  },
  acquisition: {
    ipa: '/ˌæk.wɪˈzɪʃ.ən/',
    pos: 'noun',
    meaningVi: 'sự thụ đắc ngôn ngữ một cách tự nhiên',
    meaningEn: 'the natural process of gaining a skill or language',
    collocation: 'language acquisition',
  },
  subconsciously: {
    ipa: '/ˌsʌbˈkɑːn.ʃəs.li/',
    pos: 'adv',
    meaningVi: 'một cách vô thức, tự nhiên không gượng ép',
    meaningEn: 'without deliberate conscious effort',
    collocation: 'absorb subconsciously',
  },
  resilient: {
    ipa: '/rɪˈzɪl.i.ənt/',
    pos: 'adj',
    meaningVi: 'bền bỉ, phục hồi nhanh',
    meaningEn: 'quick to recover from setbacks or load',
    collocation: 'resilient habits',
  },
  architecture: {
    ipa: '/ˈɑːr.kɪ.tek.tʃər/',
    pos: 'noun',
    meaningVi: 'kiến trúc, cấu trúc tổng thể',
    meaningEn: 'the underlying structure of a complex system',
    collocation: 'software architecture',
  },
  latency: {
    ipa: '/ˈleɪ.tən.si/',
    pos: 'noun',
    meaningVi: 'độ trễ xử lý',
    meaningEn: 'delay before a transfer of data or response begins',
    collocation: 'ultra-low latency',
  },
  bottleneck: {
    ipa: '/ˈbɑː.təl.nek/',
    pos: 'noun',
    meaningVi: 'điểm nghẽn cổ chai',
    meaningEn: 'a constraint slowing down total throughput',
    collocation: 'remove a bottleneck',
  },
  ubiquitous: {
    ipa: '/juːˈbɪk.wɪ.təs/',
    pos: 'adj',
    meaningVi: 'có mặt ở khắp mọi nơi',
    meaningEn: 'found everywhere simultaneously',
    collocation: 'ubiquitous presence',
  },
  pragmatic: {
    ipa: '/præɡˈmæt.ɪk/',
    pos: 'adj',
    meaningVi: 'thực tế, chú trọng kết quả',
    meaningEn: 'focused on practical results rather than theory',
    collocation: 'pragmatic strategy',
  },
  mitigate: {
    ipa: '/ˈmɪt.ɪ.ɡeɪt/',
    pos: 'verb',
    meaningVi: 'giảm thiểu rủi ro/tác động xấu',
    meaningEn: 'to reduce severity or impact',
    collocation: 'mitigate cognitive overload',
  },
  eloquent: {
    ipa: '/ˈel.ə.kwənt/',
    pos: 'adj',
    meaningVi: 'trôi chảy, giàu sức thuyết phục',
    meaningEn: 'fluent and persuasive in expression',
    collocation: 'eloquent articulation',
  },
  tradeoff: {
    ipa: '/ˈtreɪd.ɔːf/',
    pos: 'noun',
    meaningVi: 'sự đánh đổi cân nhắc',
    meaningEn: 'compromise between competing properties',
    collocation: 'speed-accuracy tradeoff',
  },
};

export const READER_ARTICLES: ReaderArticle[] = [
  {
    id: 'art-1',
    kind: 'YouTube Transcript',
    title: 'Why 1,000 Hours of Comprehensible Input Beats Rote Memorization',
    source: 'Stephen Krashen / Enjoy 1000H Methodology',
    cefr: 'C1',
    minutes: 6,
    sentences: [
      {
        id: 's-1',
        timestamp: '00:12',
        en: 'True language acquisition happens subconsciously when you consume comprehensible input slightly above your current level.',
        vi: 'Sự thụ đắc ngôn ngữ thực sự diễn ra một cách tự nhiên khi bạn tiếp nhận ngữ liệu dễ hiểu cao hơn một chút so với trình độ hiện tại.',
      },
      {
        id: 's-2',
        timestamp: '00:28',
        en: 'Instead of isolating random vocabulary lists, mining complete sentences helps mitigate cognitive overload and builds resilient recall.',
        vi: 'Thay vì học tách rời các danh sách từ ngẫu nhiên, việc khai thác trọn vẹn cả câu giúp giảm quá tải nhận thức và tạo trí nhớ bền vững.',
      },
      {
        id: 's-3',
        timestamp: '00:45',
        en: 'When you pair spaced repetition with daily shadowing, passive recognition transforms into eloquent spoken fluency.',
        vi: 'Khi bạn kết hợp lặp lại ngắt quãng với luyện nhại câu hằng ngày, vốn từ thụ động sẽ chuyển hóa thành khả năng nói trôi chảy đầy thuyết phục.',
      },
    ],
  },
  {
    id: 'art-2',
    kind: 'Tech Essay',
    title: 'Designing Low-Latency Voice Agents on Apple Silicon',
    source: 'T-English Engineering Digest',
    cefr: 'C1',
    minutes: 5,
    sentences: [
      {
        id: 's-4',
        timestamp: '00:05',
        en: 'Running Whisper models locally eliminates network latency, which makes real-time pronunciation coaching feel immediate.',
        vi: 'Việc chạy mô hình Whisper trực tiếp trên máy loại bỏ độ trễ mạng, giúp quá trình chấm điểm phát âm theo thời gian thực diễn ra tức thì.',
      },
      {
        id: 's-5',
        timestamp: '00:21',
        en: 'Every engineering architecture faces a pragmatic tradeoff between model precision and battery efficiency on mobile devices.',
        vi: 'Mọi kiến trúc kỹ thuật đều phải đối mặt với sự đánh đổi thực tế giữa độ chính xác của mô hình và mức tiêu thụ pin trên thiết bị di động.',
      },
      {
        id: 's-6',
        timestamp: '00:39',
        en: 'Although cloud models remain ubiquitous, hybrid on-device pipelines remove the single biggest bottleneck for commuters.',
        vi: 'Dù các mô hình đám mây vẫn phổ biến khắp nơi, quy trình lai chạy trực tiếp trên thiết bị giúp gỡ bỏ điểm nghẽn lớn nhất cho người học khi di chuyển.',
      },
    ],
  },
];
