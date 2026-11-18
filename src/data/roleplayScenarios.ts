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
      'From a scalability perspective...',
      'The primary bottleneck here is...',
      'An intentional tradeoff we can make is...',
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
      'Yesterday I wrapped up...',
      'I am currently blocked by...',
      'To mitigate the risk, I propose...',
    ],
  },
  {
    id: 'ielts-part2',
    category: 'IELTS Speaking',
    title: 'IELTS Speaking Part 2: Technology & Learning',
    level: 'C1',
    roleAi: 'IELTS Senior Examiner',
    roleUser: 'IELTS Candidate (Target 8.0)',
    openingLine:
      'Now I am going to give you a topic and I would like you to talk about it for one to two minutes. You have one minute to prepare.',
    openingLineVi:
      'Bây giờ tôi sẽ đưa bạn một chủ đề và bạn hãy nói về nó trong 1 đến 2 phút. Bạn có 1 phút để chuẩn bị.',
    suggestedExpressions: [
      'What strikes me most is...',
      'It has fundamentally transformed the way...',
      'Looking ahead, I firmly believe...',
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
      'Chúng tôi rất vui được gửi thư mời nhận việc tới bạn! Sau khi xem qua gói đãi ngộ, bạn có suy nghĩ hay câu hỏi nào không?',
    suggestedExpressions: [
      'I genuinely appreciate the offer, and...',
      'Based on my track record of...',
      'Is there flexibility around the base or equity?',
    ],
  },
  {
    id: 'drill-perspective',
    category: 'Pattern Drill',
    title: 'Pattern Drill: Expressing Nuanced Opinions',
    level: 'B2',
    roleAi: 'Speaking Coach',
    roleUser: 'Learner (10-sentence fluency drill)',
    openingLine:
      'Pattern of the day: "From my perspective, [X] is paramount because [Y]." Try transforming your opinion on remote work using this exact structure!',
    openingLineVi:
      'Mẫu câu hôm nay: "From my perspective, [X] is paramount because [Y]." Hãy thử diễn đạt quan điểm của bạn về làm việc từ xa theo đúng cấu trúc này!',
    suggestedExpressions: [
      'From my perspective, asynchronous clarity is paramount because...',
      'On the flip side, synchronous collaboration remains vital when...',
    ],
  },
];
