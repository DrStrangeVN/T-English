export interface RoleplayMission {
  id: string;
  labelVi: string;
  checkKeywords: string[];
}

export interface RoleplayScenario {
  id: string;
  category: 'Tech & Work' | 'IELTS Speaking' | 'Daily Life' | 'Pattern Drill';
  title: string;
  level: 'B1' | 'B2' | 'C1' | 'C2';
  roleAi: string;
  roleUser: string;
  openingLine: string;
  openingLineVi: string;
  suggestedExpressions: string[];
  targetVocab: string[];
  missions: RoleplayMission[];
  ieltsPart2Cue?: {
    topic: string;
    bullets: string[];
  };
}

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'tech-sysdesign',
    category: 'Tech & Work',
    title: 'Big Tech System Design Interview',
    level: 'C1',
    roleAi: 'Staff Engineer Interviewer',
    roleUser: 'Senior Candidate',
    openingLine:
      "Thanks for walking me through the requirements. Let's dive in: how would you design a low-latency notification pipeline resilient to traffic spikes?",
    openingLineVi:
      'Cảm ơn bạn đã điểm qua yêu cầu. Hãy đi sâu vào chi tiết: bạn sẽ thiết kế hệ thống gửi thông báo độ trễ thấp và chịu tải đột biến như thế nào?',
    suggestedExpressions: [
      'From a scalability perspective, we should decouple ingestion using a queue...',
      'The primary bottleneck here is database write contention...',
      'An intentional tradeoff we can make is eventual consistency for lower latency.',
    ],
    targetVocab: ['resilient', 'bottleneck', 'tradeoff', 'latency'],
    missions: [
      { id: 'm1', labelVi: 'Đề cập hướng xử lý độ trễ / tải (latency / queue / cache)', checkKeywords: ['latency', 'queue', 'cache', 'scale', 'async'] },
      { id: 'm2', labelVi: 'Phân tích ít nhất 1 điểm nghẽn (bottleneck) hoặc sự đánh đổi (tradeoff)', checkKeywords: ['bottleneck', 'tradeoff', 'consistency', 'throughput'] },
      { id: 'm3', labelVi: 'Nêu giải pháp chịu lỗi (resilient / retry / rate limit)', checkKeywords: ['resilient', 'retry', 'limit', 'mitigate', 'failover'] },
    ],
  },
  {
    id: 'tech-standup',
    category: 'Tech & Work',
    title: 'Engineering Daily Standup & Blocker Sync',
    level: 'B2',
    roleAi: 'Engineering Manager',
    roleUser: 'Product Engineer',
    openingLine:
      'Morning! Before we wrap up standup, how is the iOS audio sync branch looking, and are there any blockers holding up the release?',
    openingLineVi:
      'Chào buổi sáng! Trước khi kết thúc standup, nhánh đồng bộ âm thanh iOS tiến triển sao rồi và có vướng mắc nào cản trở bản phát hành không?',
    suggestedExpressions: [
      'Yesterday I wrapped up the FSRS storage layer and unit tests...',
      'I am currently blocked by intermittent WebKit permissions...',
      'To mitigate the risk, I propose shipping the core MVP behind a flag.',
    ],
    targetVocab: ['mitigate', 'intermittent', 'iron out', 'pragmatic'],
    missions: [
      { id: 'm1', labelVi: 'Báo cáo tiến độ đã hoàn thành hôm qua (wrapped up / shipped / finished)', checkKeywords: ['yesterday', 'finished', 'completed', 'wrapped', 'tested'] },
      { id: 'm2', labelVi: 'Nêu rõ vướng mắc hiện tại (blocker / issue / bottleneck)', checkKeywords: ['block', 'issue', 'intermittent', 'bug', 'bottleneck'] },
      { id: 'm3', labelVi: 'Đề xuất hành động giảm thiểu rủi ro (mitigate / propose / plan)', checkKeywords: ['mitigate', 'propose', 'plan', 'fix', 'iron'] },
    ],
  },
  {
    id: 'tech-pr-debate',
    category: 'Tech & Work',
    title: 'Code Review & Architecture Tradeoff Sync',
    level: 'C1',
    roleAi: 'Tech Lead',
    roleUser: 'Senior Developer',
    openingLine:
      'I read your pull request—great test coverage! One question though: why did you keep SQLite local-first instead of querying the REST endpoint directly?',
    openingLineVi:
      'Mình đã xem PR của bạn — test rất kỹ! Một câu hỏi nhỏ: sao bạn giữ SQLite local-first thay vì gọi thẳng REST endpoint?',
    suggestedExpressions: [
      'From my perspective, eliminating network latency creates a responsive UX...',
      'I concede it adds sync complexity, but we mitigate that with CRDTs.',
      'Let us strike a balance between simplicity and offline resilience.',
    ],
    targetVocab: ['perspective', 'concede', 'resilient', 'strike a balance'],
    missions: [
      { id: 'm1', labelVi: 'Nêu quan điểm bằng cụm C1 (perspective / view)', checkKeywords: ['perspective', 'view', 'standpoint'] },
      { id: 'm2', labelVi: 'Thừa nhận nhược điểm một cách khách quan (tradeoff / concede / complexity)', checkKeywords: ['tradeoff', 'concede', 'although', 'while', 'complexity'] },
      { id: 'm3', labelVi: 'Đưa ra kết luận đồng thuận (balance / agree / mitigate)', checkKeywords: ['balance', 'agree', 'mitigate', 'offline', 'resilient'] },
    ],
  },
  {
    id: 'ielts-full-mock',
    category: 'IELTS Speaking',
    title: 'IELTS Speaking Full Mock (Part 1 → 2 → 3)',
    level: 'C1',
    roleAi: 'IELTS Senior Examiner',
    roleUser: 'IELTS Candidate (Target 8.0)',
    openingLine:
      'Good afternoon. Welcome to the speaking test. Let us start with Part 1 and then move to your Part 2 Cue Card: How has technology changed the way you learn English?',
    openingLineVi:
      'Chào buổi chiều. Chào mừng đến bài thi nói. Hãy bắt đầu với Part 1 rồi chuyển sang Cue Card Part 2: Công nghệ đã thay đổi cách bạn học tiếng Anh như thế nào?',
    suggestedExpressions: [
      'What strikes me most is how ubiquitous on-device AI tutors have become...',
      'It has fundamentally transformed my pronunciation and recall...',
      'Not only does it save time, but it also eliminates speaking anxiety.',
    ],
    targetVocab: ['ubiquitous', 'eloquent', 'sustainable', 'perspective'],
    missions: [
      { id: 'm1', labelVi: 'Mở rộng câu trả lời kèm ví dụ thực tế cụ thể (for instance / example)', checkKeywords: ['example', 'instance', 'personally', 'daily', 'app'] },
      { id: 'm2', labelVi: 'Sử dụng ít nhất 1 từ vựng C1/C2 (ubiquitous, resilient, mitigate, eloquent)', checkKeywords: ['ubiquitous', 'resilient', 'mitigate', 'eloquent', 'sustainable', 'pragmatic'] },
      { id: 'm3', labelVi: 'Thể hiện quan điểm cân bằng hai chiều cho Part 3 (however / although / while)', checkKeywords: ['however', 'although', 'while', 'balance', 'other hand'] },
    ],
    ieltsPart2Cue: {
      topic: 'Describe an application or tool that dramatically improved a skill you wanted to learn.',
      bullets: [
        'What the tool is and how you discovered it',
        'How consistently you used it in your daily routine',
        'What specific obstacle it helped you overcome',
        'And explain why you would recommend it to others',
      ],
    },
  },
  {
    id: 'daily-negotiation',
    category: 'Daily Life',
    title: 'Executive Salary & Offer Negotiation',
    level: 'C1',
    roleAi: 'VP of Talent',
    roleUser: 'Incoming Lead',
    openingLine:
      'We are thrilled to extend an offer to you! Having reviewed the compensation package, what thoughts or questions do you have?',
    openingLineVi:
      'Chúng tôi rất vui gửi thư mời nhận việc tới bạn! Sau khi xem qua gói đãi ngộ, bạn có suy nghĩ hay câu hỏi nào không?',
    suggestedExpressions: [
      'I genuinely appreciate the offer and am excited to join the team...',
      'Based on my track record of shipping resilient cross-platform apps...',
      'Is there flexibility around the base salary or equity component?',
    ],
    targetVocab: ['appreciate', 'leverage', 'flexibility', 'consensus'],
    missions: [
      { id: 'm1', labelVi: 'Bày tỏ sự trân trọng và nhiệt huyết trước khi đàm phán', checkKeywords: ['appreciate', 'excited', 'thrilled', 'thank'] },
      { id: 'm2', labelVi: 'Chứng minh giá trị đóng góp bằng thành tích thực tế', checkKeywords: ['experience', 'track', 'delivered', 'built', 'impact', 'value'] },
      { id: 'm3', labelVi: 'Đặt câu hỏi mở khéo léo về mức lương/cổ phần', checkKeywords: ['flexibility', 'equity', 'base', 'compensation', 'package', 'discuss'] },
    ],
  },
  {
    id: 'daily-airport',
    category: 'Daily Life',
    title: 'International Airport Customs & Flight Rebooking',
    level: 'B1',
    roleAi: 'Airline Gate Agent',
    roleUser: 'Business Traveler',
    openingLine:
      'Good evening! Your connecting flight to San Francisco was delayed due to fog. How can I help rebook your itinerary tonight?',
    openingLineVi:
      'Chào buổi tối! Chuyến bay nối chuyến đi San Francisco của bạn bị hoãn do sương mù. Tôi có thể hỗ trợ đổi lịch trình tối nay như thế nào?',
    suggestedExpressions: [
      'Could you check if there is an earlier direct flight tomorrow morning?',
      'I have an important stakeholder meeting at 10 AM...',
      'Would the airline cover a hotel voucher for tonight?',
    ],
    targetVocab: ['itinerary', 'earlier', 'voucher', 'stakeholder'],
    missions: [
      { id: 'm1', labelVi: 'Hỏi chuyến bay thay thế sớm nhất', checkKeywords: ['flight', 'earlier', 'morning', 'direct', 'rebook'] },
      { id: 'm2', labelVi: 'Trình bày lý do công việc/lịch hẹn quan trọng', checkKeywords: ['meeting', 'conference', 'schedule', 'important', 'tomorrow'] },
      { id: 'm3', labelVi: 'Yêu cầu hỗ trợ phòng chờ hoặc voucher khách sạn', checkKeywords: ['hotel', 'voucher', 'lounge', 'cover', 'meal'] },
    ],
  },
  {
    id: 'drill-perspective',
    category: 'Pattern Drill',
    title: 'Pattern Drill: Expressing Nuanced Opinions (C1)',
    level: 'B2',
    roleAi: 'Speaking Coach',
    roleUser: 'Learner (Fluency Drill)',
    openingLine:
      'Pattern of the day: "From my perspective, [X] is paramount because [Y]." Try transforming your opinion on AI voice tutors using this exact structure!',
    openingLineVi:
      'Mẫu câu hôm nay: "From my perspective, [X] is paramount because [Y]." Hãy thử diễn đạt quan điểm về gia sư AI theo đúng cấu trúc này!',
    suggestedExpressions: [
      'From my perspective, daily shadowing is paramount because it trains muscle memory.',
      'On the other hand, human feedback remains essential when nuances matter.',
    ],
    targetVocab: ['perspective', 'paramount', 'because', 'on the other hand'],
    missions: [
      { id: 'm1', labelVi: 'Sử dụng đúng cụm mở đầu "From my perspective"', checkKeywords: ['from my perspective', 'perspective'] },
      { id: 'm2', labelVi: 'Dùng tính từ mạnh "paramount / vital / essential"', checkKeywords: ['paramount', 'vital', 'essential', 'pivotal'] },
      { id: 'm3', labelVi: 'Nêu lý do rõ ràng phía sau bằng "because / since"', checkKeywords: ['because', 'since', 'due to'] },
    ],
  },
  {
    id: 'drill-inversion',
    category: 'Pattern Drill',
    title: 'Pattern Drill: "Not only does..." Inversion Mastery',
    level: 'C1',
    roleAi: 'Grammar & Rhetoric Coach',
    roleUser: 'Band 8.0 Candidate',
    openingLine:
      'Challenge: Speak one sentence starting with "Not only does..." about spaced repetition or minimalist design!',
    openingLineVi:
      'Thử thách: Hãy nói một câu bắt đầu bằng đảo ngữ "Not only does..." về lặp lại ngắt quãng hoặc thiết kế tối giản!',
    suggestedExpressions: [
      'Not only does FSRS boost long-term recall, but it also saves thirty percent of study time.',
      'Not only does Liquid Glass look crisp, but it also reduces eye fatigue.',
    ],
    targetVocab: ['not only', 'does', 'but also'],
    missions: [
      { id: 'm1', labelVi: 'Mở đầu câu bằng "Not only"', checkKeywords: ['not only'] },
      { id: 'm2', labelVi: 'Đảo trợ động từ đúng chuẩn ("does" / "do" / "can")', checkKeywords: ['does', 'do', 'can', 'will'] },
      { id: 'm3', labelVi: 'Nối vế hai bằng "but ... also"', checkKeywords: ['but', 'also'] },
    ],
  },
];
