export interface ShadowingSegment {
  id: string;
  source: string;
  accent: 'US General' | 'UK RP';
  cefr: 'B1' | 'B2' | 'C1' | 'C2';
  text: string;
  translationVi: string;
  linkingNotes: string[];
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
    dictationHint: 'A_______, I t______ we could grab a quick c_____ before d_____ into the a___________ review this morning.',
    durationSec: 5.2,
  },
];
