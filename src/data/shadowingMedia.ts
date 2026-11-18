export interface ConnectedSpeechNote {
  raw: string;
  naturalIpa: string;
  ruleVi: string;
}

export interface ShadowingSegment {
  id: string;
  source: string;
  accent: 'US General' | 'UK RP';
  cefr: 'B1' | 'B2' | 'C1' | 'C2';
  text: string;
  translationVi: string;
  linkingNotes: string[];
  connectedSpeechBreakdown: ConnectedSpeechNote[];
  dictationHint: string;
  durationSec: number;
}

export const SHADOWING_TRACKS: ShadowingSegment[] = [
  {
    id: 'shad-1',
    source: 'TED Talk — Deliberate Practice',
    accent: 'US General',
    cefr: 'C1',
    text: 'Consistency matters far more than intensity when you want to build lasting fluency in English.',
    translationVi: 'Sự bền bỉ đều đặn quan trọng hơn nhiều so với cường độ dồn dập khi bạn muốn xây dựng sự trôi chảy lâu dài.',
    linkingNotes: [
      'want to → thường đọc nối nhanh thành /ˈwɑːnə/ trong giao tiếp tự nhiên',
      'fluency in → nối nhẹ âm /i/ sang /ɪ/ (fluency-y-in)',
      'Trọng âm câu rơi vào: CONSISTENCY, FAR MORE, INTENSITY, LASTING FLUENCY',
    ],
    connectedSpeechBreakdown: [
      { raw: 'want to', naturalIpa: '/ˈwɑː.nə/', ruleVi: 'Nuốt âm /t/ giữa hai nguyên âm và rút gọn "to" thành âm schwa /ə/.' },
      { raw: 'than intensity', naturalIpa: '/ðən‿ɪnˈten.sə.ti/', ruleVi: '"Than" không đọc mạnh thành /ðæn/ mà hạ thành /ðən/ rồi nối /n/ sang /ɪ/.' },
      { raw: 'in English', naturalIpa: '/ɪn‿ˈɪŋ.ɡlɪʃ/', ruleVi: 'Nối mượt phụ âm cuối /n/ với nguyên âm đầu /ɪ/.' },
    ],
    dictationHint: 'C__________ m______ far more than i________ when you want to build l______ f______ in English.',
    durationSec: 5.4,
  },
  {
    id: 'shad-2',
    source: 'Tech Keynote — Resilient Systems',
    accent: 'US General',
    cefr: 'C1',
    text: 'We designed this architecture to be resilient under load, eliminating every single bottleneck across regions.',
    translationVi: 'Chúng tôi thiết kế kiến trúc này để chịu tải cao, loại bỏ hoàn toàn từng điểm nghẽn trên mọi khu vực.',
    linkingNotes: [
      'designed this → nối mượt /d/ sang /ð/ (đặt lưỡi sẵn vị trí /ð/)',
      'under load → giữ âm cuối /d/ rõ ràng trước khi ngắt nhịp dấu phẩy',
      'Âm khó cần chú ý: /θ/ và /ð/ trong "this", /r/ trong "resilient", /t/ trong "bottleneck"',
    ],
    connectedSpeechBreakdown: [
      { raw: 'designed this', naturalIpa: '/dɪˈzaɪnd‿ðɪs/', ruleVi: 'Giữ khẩu hình âm /d/ và trượt thẳng đầu lưỡi ra răng cho âm /ð/ không ngắt hơi.' },
      { raw: 'to be', naturalIpa: '/tə‿bi/', ruleVi: 'Từ chức năng "to" giảm âm nhẹ thành /tə/.' },
      { raw: 'bottleneck across', naturalIpa: '/ˈbɑː.təl.nek‿əˈkrɔːs/', ruleVi: 'Nối phụ âm /k/ cuối sang nguyên âm đầu /ə/.' },
    ],
    dictationHint: 'We d_______ this a___________ to be r________ under load, e__________ every single b_________ across regions.',
    durationSec: 6.1,
  },
  {
    id: 'shad-3',
    source: 'IELTS Band 8.5 Speaking Sample',
    accent: 'UK RP',
    cefr: 'C2',
    text: 'Although technology has become ubiquitous, genuine human empathy remains irreplaceable in meaningful communication.',
    translationVi: 'Mặc dù công nghệ đã trở nên phổ biến khắp nơi, sự thấu cảm chân thành của con người vẫn không thể thay thế trong giao tiếp sâu sắc.',
    linkingNotes: [
      'Although → mở đầu bằng âm hữu thanh /ð/ rung cổ họng rõ',
      'ubiquitous → nhấn mạnh âm tiết thứ hai /juːˈbɪk.wɪ.təs/',
      'Lên nhẹ cao độ ở cuối mệnh đề phụ "ubiquitous↗" và hạ giọng dứt khoát ở "communication↘"',
    ],
    connectedSpeechBreakdown: [
      { raw: 'has become', naturalIpa: '/həz‿bɪˈkʌm/', ruleVi: 'Trợ động từ "has" đọc nhẹ thành /həz/ để nhường trọng âm cho "become".' },
      { raw: 'irreplaceable in', naturalIpa: '/ˌɪr.ɪˈpleɪ.sə.bəl‿ɪn/', ruleVi: 'Âm Dark L cuối từ nối liền mạch sang giới từ "in".' },
    ],
    dictationHint: 'A_______ technology has become u_________, genuine human e______ remains i____________ in meaningful c____________.',
    durationSec: 6.8,
  },
  {
    id: 'shad-4',
    source: 'Everyday Native Conversation',
    accent: 'US General',
    cefr: 'B2',
    text: 'Actually, I thought we could grab a quick coffee before diving into the architecture review this morning.',
    translationVi: 'Thực ra mình nghĩ tụi mình có thể tranh thủ uống nhanh ly cà phê trước khi bắt tay vào buổi review kiến trúc sáng nay.',
    linkingNotes: [
      'thought we → âm /θ/ đầu lưỡi kẹp nhẹ giữa hai răng, không đọc thành /t/',
      'grab a → nối âm phụ âm + nguyên âm thành "gra-buh"',
      'diving into → nối nhẹ thành "diving-into"',
    ],
    connectedSpeechBreakdown: [
      { raw: 'grab a', naturalIpa: '/ɡræb‿ə/', ruleVi: 'Phụ âm /b/ nối thẳng vào mạo từ giảm âm /ə/ tạo thành "gra-buh".' },
      { raw: 'the architecture', naturalIpa: '/ði‿ˈɑːr.kɪ.tek.tʃər/', ruleVi: '"The" đứng trước nguyên âm đọc thành /ði/ thay vì /ðə/.' },
    ],
    dictationHint: 'A_______, I t______ we could grab a quick c_____ before d_____ into the a___________ review this morning.',
    durationSec: 5.2,
  },
  {
    id: 'shad-5',
    source: 'Coach Shane Dictation — Fast Reductions',
    accent: 'US General',
    cefr: 'B2',
    text: 'Did you figure out what kind of tradeoff they were talking about at the meeting?',
    translationVi: 'Bạn đã tìm ra họ đang nói về kiểu đánh đổi nào trong cuộc họp chưa?',
    linkingNotes: [
      'Did you → biến âm hợp nhất thành /ˈdɪdʒuː/ (Did-ja)',
      'figure out → nối /r/ sang /aʊ/ (giọng Mỹ uốn lưỡi nối liền)',
      'kind of → rút gọn thành /ˈkaɪn.də/',
    ],
    connectedSpeechBreakdown: [
      { raw: 'Did you', naturalIpa: '/ˈdɪdʒ.uː/', ruleVi: 'Đồng hóa âm (Assimilation): /d/ + /j/ hợp nhất thành âm /dʒ/ ("Did-ja").' },
      { raw: 'kind of', naturalIpa: '/ˈkaɪn.də/', ruleVi: 'Âm /d/ nhẹ dần và "of" rút gọn còn /ə/ ("kinda").' },
      { raw: 'talking about at', naturalIpa: '/ˈtɔː.kɪŋ‿əˈbaʊt‿æt/', ruleVi: 'Cụm ba từ nối liền mạch theo nhịp 3 âm tiết.' },
    ],
    dictationHint: 'D__ you f_____ out what k___ of t_______ they were t______ about at the m______?',
    durationSec: 4.8,
  },
  {
    id: 'shad-6',
    source: 'BBC Radio — Cognitive Focus',
    accent: 'UK RP',
    cefr: 'C1',
    text: 'Minimalist environments are far more conducive to sustained concentration than cluttered screens.',
    translationVi: 'Môi trường tối giản tạo điều kiện thuận lợi hơn nhiều cho sự tập trung bền bỉ so với màn hình rối rắm.',
    linkingNotes: [
      'far more → giọng Anh không uốn /r/ ở "far" nhưng giữ nguyên âm dài /ɑː/',
      'conducive to → nối âm /v/ nhẹ sang /tə/',
    ],
    connectedSpeechBreakdown: [
      { raw: 'conducive to', naturalIpa: '/kənˈdjuː.sɪv‿tə/', ruleVi: 'Giữ độ rung nhẹ của /v/ trước khi bật /tə/.' },
      { raw: 'more conducive', naturalIpa: '/mɔː‿kənˈdjuː.sɪv/', ruleVi: 'Nhấn mạnh âm tiết thứ hai "-duc-" trong conducive.' },
    ],
    dictationHint: 'M_________ environments are far more c________ to s________ c____________ than c________ screens.',
    durationSec: 5.7,
  },
  {
    id: 'shad-7',
    source: 'Podcast — Career & Negotiation',
    accent: 'US General',
    cefr: 'C1',
    text: 'Rather than rushing into implementation, let us align all stakeholders so everyone is on the same page.',
    translationVi: 'Thay vì vội vàng bắt tay vào code ngay, hãy thống nhất tất cả các bên liên quan để mọi người cùng chung một góc nhìn.',
    linkingNotes: [
      'Rather than → hai âm /ð/ đi liền nhau, giữ đầu lưỡi sát răng',
      'is on → nối âm /z/ sang /ɑːn/ (i-zon)',
    ],
    connectedSpeechBreakdown: [
      { raw: 'Rather than', naturalIpa: '/ˈræð.ər‿ðən/', ruleVi: 'Hai từ đều chứa âm hữu thanh /ð/, "than" lướt thành /ðən/.' },
      { raw: 'is on the', naturalIpa: '/ɪz‿ɑːn‿ðə/', ruleVi: 'Nối /z/ của "is" sang nguyên âm của "on".' },
    ],
    dictationHint: 'R_____ than r______ into i_____________, let us a____ all s___________ so everyone is on the s___ page.',
    durationSec: 6.0,
  },
  {
    id: 'shad-8',
    source: 'IELTS Band 8.5 — Urban Future',
    accent: 'UK RP',
    cefr: 'C2',
    text: 'Not only does remote collaboration mitigate traffic congestion, but it also fosters deeper autonomy.',
    translationVi: 'Làm việc từ xa không chỉ giảm thiểu ùn tắc giao thông mà còn nuôi dưỡng tính tự chủ sâu sắc hơn.',
    linkingNotes: [
      'Not only → nối âm /t/ sang /əʊ/ (No-tonly)',
      'but it also → nối liên hoàn /t/ flap + /t/ sang /ɔːl/ (bu-ti-talso)',
    ],
    connectedSpeechBreakdown: [
      { raw: 'Not only', naturalIpa: '/nɒt‿ˈəʊn.li/', ruleVi: 'Âm /t/ nối trực tiếp sang nguyên âm đôi /əʊ/.' },
      { raw: 'but it also', naturalIpa: '/bʌt‿ɪt‿ˈɔːl.səʊ/', ruleVi: 'Ba từ chức năng lướt nhanh trước khi nhấn mạnh vào "also" và "fosters".' },
    ],
    dictationHint: 'N__ only does r_____ c____________ m_______ traffic c_________, but it also f______ deeper a_______.',
    durationSec: 6.4,
  },
];
