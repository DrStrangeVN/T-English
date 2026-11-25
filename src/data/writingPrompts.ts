export interface WritingChartSpec {
  kind: 'bar' | 'line';
  unit: string;
  caption: string;
  series: Array<{ label: string; value: number; secondary?: number; color?: string }>;
}

export interface WritingPrompt {
  id: string;
  category: 'IELTS Task 2' | 'IELTS Task 1' | 'Tech RFC & Workplace';
  title: string;
  cefr: 'B2' | 'C1' | 'C2';
  timeLimitMin: number;
  minWords: number;
  promptText: string;
  chart?: WritingChartSpec;
  outlineVi: string[];
  band8Lexicon: Array<{ phrase: string; meaningVi: string }>;
  starterDraft: string;
  modelBand65: string;
  modelBand85: string;
}

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'wp-ielts2-ai',
    category: 'IELTS Task 2',
    title: 'AI Tutors vs Traditional Classroom Instruction',
    cefr: 'C1',
    timeLimitMin: 40,
    minWords: 250,
    promptText:
      'Some people believe that artificial intelligence tutors will eventually replace human language teachers, while others argue that human interaction remains irreplaceable. Discuss both views and give your own opinion.',
    outlineVi: [
      'Mở bài: Paraphrase 2 luồng quan điểm + Thesis khẳng định mô hình Hybrid kết hợp là tối ưu.',
      'Thân bài 1: Lợi thế của AI (cá nhân hóa FSRS, chấm IPA tức thì, học 24/7).',
      'Thân bài 2: Giá trị của giáo viên (thấu cảm, sắc thái văn hóa, dẫn dắt cảm xúc).',
      'Kết bài: Tóm tắt và khẳng định AI là đòn bẩy nâng tầm thay vì thay thế hoàn toàn.',
    ],
    band8Lexicon: [
      { phrase: 'tailor-made pedagogical feedback', meaningVi: 'phản hồi sư phạm cá nhân hóa riêng' },
      { phrase: 'ubiquitous accessibility', meaningVi: 'khả năng tiếp cận ở khắp mọi nơi' },
      { phrase: 'genuine human empathy', meaningVi: 'sự thấu cảm chân thành của con người' },
      { phrase: 'strike a pragmatic balance', meaningVi: 'đạt được sự cân bằng thực tế' },
      { phrase: 'augment rather than supplant', meaningVi: 'bổ trợ nâng tầm thay vì thay thế' },
    ],
    starterDraft:
      'In recent years, many people think AI apps are very good for learning English because they are cheap and always available. However, I am agree that human teachers are still very important for students.',
    modelBand65:
      'Nowadays, technology develops very fast and many learners use AI apps to study English. On the one hand, AI tools are convenient because students can practice speaking anytime at home without feeling shy. On the other hand, human teachers understand students better and can motivate them when they feel tired. In conclusion, I think both AI and teachers are helpful.',
    modelBand85:
      'The proliferation of generative artificial intelligence has sparked an intense debate over whether algorithmic tutors will eventually supplant traditional classroom educators. While automated platforms offer unprecedented personalization and ubiquitous accessibility, I firmly contend that technology should augment rather than replace genuine human mentorship. By combining immediate diagnostic precision with human empathy, learners achieve lasting communicative mastery.',
  },
  {
    id: 'wp-ielts2-remote',
    category: 'IELTS Task 2',
    title: 'Remote Engineering & Urban Decentralization',
    cefr: 'C1',
    timeLimitMin: 40,
    minWords: 250,
    promptText:
      'Many knowledge workers now work remotely from home rather than commuting to central offices. Do the advantages of this trend outweigh the disadvantages for individuals and society?',
    outlineVi: [
      'Mở bài: Giới thiệu xu hướng làm việc phân tán + Nêu rõ lợi ích vượt trội hơn nhược điểm.',
      'Thân bài 1: Giảm ùn tắc/khí thải đô thị và bảo vệ thời gian tập trung sâu (deep work).',
      'Thân bài 2: Nguy cơ cô lập xã hội được giảm thiểu (mitigate) nhờ giao tiếp bất đồng bộ rõ ràng.',
      'Kết bài: Khẳng định tính bền vững của mô hình làm việc linh hoạt.',
    ],
    band8Lexicon: [
      { phrase: 'asynchronous collaboration', meaningVi: 'phối hợp làm việc bất đồng bộ' },
      { phrase: 'mitigate urban congestion', meaningVi: 'giảm thiểu ùn tắc đô thị' },
      { phrase: 'conducive to deep concentration', meaningVi: 'thuận lợi cho sự tập trung sâu' },
      { phrase: 'blur the boundary between', meaningVi: 'làm mờ ranh giới giữa' },
    ],
    starterDraft:
      'Working from home is becoming very common today. It helps workers save time in traffic every morning, although sometimes people feel lonely and discuss about work too late at night.',
    modelBand65:
      'More and more companies allow employees to work from home. The biggest advantage is saving commuting time and money. Moreover, traffic jams in big cities are reduced. However, working remotely can make team communication harder. Overall, I believe the benefits are greater than the drawbacks.',
    modelBand85:
      'The transition toward distributed knowledge work has fundamentally reshaped modern urban life. Although remote arrangements can occasionally blur the boundary between professional obligations and personal rest, the environmental and productivity gains far outweigh these drawbacks. When organizations cultivate clear asynchronous collaboration, remote work proves both sustainable for cities and conducive to deep concentration.',
  },
  {
    id: 'wp-ielts2-privacy',
    category: 'IELTS Task 2',
    title: 'On-Device AI Privacy vs Cloud Personalization',
    cefr: 'C2',
    timeLimitMin: 40,
    minWords: 250,
    promptText:
      'Modern applications collect vast amounts of personal voice and behavioral data to personalize user experiences. Should governments mandate strict local-first processing, or allow cloud data collection with user consent?',
    outlineVi: [
      'Mở bài: Đặt vấn đề xung đột giữa cá nhân hóa đám mây và quyền riêng tư dữ liệu giọng nói.',
      'Thân bài 1: Rủi ro rò rỉ dữ liệu sinh trắc học khi gửi toàn bộ lên máy chủ tập trung.',
      'Thân bài 2: Giải pháp kỹ thuật dung hòa — xử lý cục bộ trên chip thiết bị (Core ML) và mã hóa đồng bộ.',
      'Kết bài: Đề xuất chuẩn mực "Privacy by Architecture" kết hợp minh bạch lựa chọn.',
    ],
    band8Lexicon: [
      { phrase: 'biometric voiceprints', meaningVi: 'dấu vân tay giọng nói sinh trắc học' },
      { phrase: 'at the expense of privacy', meaningVi: 'đánh đổi bằng sự hy sinh quyền riêng tư' },
      { phrase: 'stringent regulatory guardrails', meaningVi: 'hành lang pháp lý nghiêm ngặt' },
      { phrase: 'local-first computation', meaningVi: 'tính toán ưu tiên ngay trên thiết bị' },
    ],
    starterDraft:
      'Many apps collect voice data from users to give better answers. According to me, this is very dangerous because hackers can steal private recordings.',
    modelBand65:
      'Nowadays, smartphones collect a lot of personal information to improve AI features. While this makes apps smarter, many people worry about data leaks. Therefore, governments should require companies to process sensitive voice data on the device whenever possible.',
    modelBand85:
      'The rapid expansion of personalized software has ignited concern over whether convenience is being pursued at the expense of digital privacy. Because voice recordings constitute irreplaceable biometric signatures, reliance on centralized cloud storage poses systemic security risks. Consequently, policymakers should incentivize local-first computation while enforcing stringent regulatory guardrails for any cloud telemetry.',
  },
  {
    id: 'wp-ielts2-lifelong',
    category: 'IELTS Task 2',
    title: 'Continuous Upskilling in the Era of Rapid Automation',
    cefr: 'B2',
    timeLimitMin: 40,
    minWords: 250,
    promptText:
      'Because technology changes career requirements every few years, universities should focus on teaching adaptability and self-learning skills rather than specialized technical facts. To what extent do you agree or disagree?',
    outlineVi: [
      'Mở bài: Đồng ý một phần lớn — tư duy tự học là nền tảng, nhưng vẫn cần kiến thức chuyên môn lõi.',
      'Thân bài 1: Kiến thức công cụ cụ thể nhanh lỗi thời, trong khi năng lực meta-learning tồn tại suốt đời.',
      'Thân bài 2: Không thể dạy "tự học" trong chân không; sinh viên cần dự án thực chiến để rèn luyện.',
      'Kết bài: Kết hợp nền tảng chuyên ngành vững + phương pháp học suốt đời.',
    ],
    band8Lexicon: [
      { phrase: 'perpetual technological obsolescence', meaningVi: 'sự lỗi thời liên tục của công nghệ' },
      { phrase: 'metacognitive agility', meaningVi: 'sự linh hoạt trong phương pháp tự học' },
      { phrase: 'strike a pragmatic balance', meaningVi: 'cân bằng thực tiễn' },
    ],
    starterDraft:
      'Technology changes very fast today so university degrees become old quickly. In the other hand, students still need basic coding skills to find a first job.',
    modelBand65:
      'With rapid automation, many technical skills taught at university soon become outdated. I largely agree that schools should teach students how to learn independently. Nevertheless, foundational domain knowledge remains essential for entry-level roles.',
    modelBand85:
      'Amid perpetual technological obsolescence, higher education can no longer rely on static factual instruction alone. While domain fundamentals provide essential scaffolding for early-career engineers, metacognitive agility ultimately determines long-term resilience. Universities must therefore embed deliberate self-learning habits directly into rigorous technical curricula.',
  },
  {
    id: 'wp-ielts1-latency',
    category: 'IELTS Task 1',
    title: 'Line Chart: On-Device vs Cloud AI Inference Latency',
    cefr: 'B2',
    timeLimitMin: 20,
    minWords: 150,
    promptText:
      'The chart compares average speech recognition latency (ms) and hourly server cost across Cloud API, Hybrid Edge, and On-Device Apple Silicon pipelines between 2022 and 2026. Summarize the main features and make comparisons.',
    chart: {
      kind: 'bar',
      unit: 'ms',
      caption: '2026 Speech Recognition Latency (ms) — 2022 Baseline vs 2026',
      series: [
        { label: 'Cloud API', value: 420, secondary: 680, color: 'var(--rose)' },
        { label: 'Hybrid Edge', value: 230, secondary: 590, color: 'var(--amber)' },
        { label: 'On-Device Apple Silicon', value: 110, secondary: 540, color: 'var(--green)' },
      ],
    },
    outlineVi: [
      'Mở bài: Paraphrase đề bài so sánh độ trễ (ms) & chi phí giờ của 3 kiến trúc giai đoạn 2022–2026.',
      'Overview: Cả 3 đều giảm độ trễ, trong đó On-Device giảm mạnh nhất (<120ms) và chi phí server bằng 0.',
      'Body 1: Số liệu Cloud API (680ms → 420ms) vs Hybrid Edge (590ms → 230ms).',
      'Body 2: Sự bứt phá của On-Device Apple Silicon (540ms → 110ms) và lợi thế chi phí cận biên.',
    ],
    band8Lexicon: [
      { phrase: 'exhibited a pronounced downward trajectory', meaningVi: 'thể hiện xu hướng giảm rõ rệt' },
      { phrase: 'plummeted nearly fivefold', meaningVi: 'giảm mạnh gần năm lần' },
      { phrase: 'negligible marginal cost', meaningVi: 'chi phí cận biên không đáng kể' },
    ],
    starterDraft:
      'The chart shows the latency of three AI systems from 2022 to 2026. Overall, on-device latency went down a lot and became the fastest option in 2026.',
    modelBand65:
      'The graph illustrates how speech recognition latency changed across three pipelines between 2022 and 2026. Overall, all three became faster, but On-Device AI saw the largest drop from 540ms to 110ms while eliminating server costs.',
    modelBand85:
      'The provided comparison illustrates shifts in speech-to-text inference latency and operational expenditure across three deployment architectures from 2022 to 2026. Overall, while all pipelines experienced steady latency reductions, on-device Apple Silicon execution exhibited the most pronounced downward trajectory, reaching sub-120ms responsiveness at negligible marginal server cost.',
  },
  {
    id: 'wp-ielts1-retention',
    category: 'IELTS Task 1',
    title: 'Bar Chart: Memory Retention FSRS v5 vs SM-2 vs Cramming',
    cefr: 'C1',
    timeLimitMin: 20,
    minWords: 150,
    promptText:
      'The bar chart illustrates 90-day vocabulary recall percentages and average daily review minutes across three study methods: Cramming, Classic SM-2, and FSRS v5 across four age groups.',
    chart: {
      kind: 'bar',
      unit: '% recall',
      caption: '90-Day Vocabulary Recall Rate (%) vs Daily Minutes',
      series: [
        { label: 'Cramming', value: 18, secondary: 42, color: 'var(--rose)' },
        { label: 'Classic SM-2', value: 78, secondary: 26, color: 'var(--amber)' },
        { label: 'FSRS v5', value: 91, secondary: 18, color: 'var(--green)' },
      ],
    },
    outlineVi: [
      'Mở bài: Giới thiệu biểu đồ cột so sánh tỷ lệ nhớ sau 90 ngày và thời gian ôn mỗi ngày.',
      'Overview: FSRS v5 đạt tỷ lệ nhớ cao nhất (~91%) với số phút ôn ít hơn 30% so với SM-2.',
      'Body 1: So sánh Cramming (tụt xuống ~18% sau 90 ngày) với hai thuật toán lặp lại ngắt quãng.',
      'Body 2: Độ ổn định đồng đều của FSRS v5 trên cả 4 nhóm tuổi.',
    ],
    band8Lexicon: [
      { phrase: 'consistently outperformed', meaningVi: 'liên tục vượt trội hơn' },
      { phrase: 'marginal difference across cohorts', meaningVi: 'chênh lệch không đáng kể giữa các nhóm tuổi' },
      { phrase: 'precipitous decline', meaningVi: 'sự sụt giảm dốc đứng' },
    ],
    starterDraft:
      'The bar chart compares three memory methods after 90 days. FSRS v5 had the highest percentage in all groups while cramming fell very low.',
    modelBand65:
      'The chart compares 90-day recall rates among cramming, SM-2, and FSRS v5. Overall, FSRS v5 achieved roughly 91% retention with fewer daily minutes, whereas cramming suffered a sharp decline.',
    modelBand85:
      'The bar chart compares 90-day vocabulary retention rates and daily study time across cramming, classic SM-2, and FSRS v5 among four age demographics. Overall, FSRS v5 consistently outperformed alternative approaches across every cohort, maintaining roughly 91% recall while requiring 30% fewer daily review minutes than SM-2.',
  },
  {
    id: 'wp-ielts1-immersion',
    category: 'IELTS Task 1',
    title: 'Table: Weekly Study Allocation of C1 Achievers',
    cefr: 'B2',
    timeLimitMin: 20,
    minWords: 150,
    promptText:
      'The table presents how learners who reached CEFR C1 within 12 months allocated their weekly hours across Listening Input, Shadowing, AI Conversation, FSRS Review, and Writing Feedback.',
    chart: {
      kind: 'bar',
      unit: '% time',
      caption: 'Weekly Study Time Allocation of C1 Achievers (%)',
      series: [
        { label: 'Input (Listen/Read)', value: 45, color: 'var(--cyan)' },
        { label: 'Shadowing IPA', value: 18, color: 'var(--indigo)' },
        { label: 'AI Speaking', value: 14, color: 'var(--green)' },
        { label: 'FSRS Review', value: 13, color: 'var(--amber)' },
        { label: 'Writing Lab', value: 10, color: 'var(--pink)' },
      ],
    },
    outlineVi: [
      'Mở bài: Paraphrase bảng phân bổ thời gian học hàng tuần của nhóm đạt C1 sau 12 tháng.',
      'Overview: Nghe/Đọc thụ đắc chiếm tỷ trọng lớn nhất (45%), tiếp đến là luyện Nói/Shadowing (30%).',
      'Body 1: Phân tích nhóm Input (Nghe Podcast/YouTube & Đọc bài song ngữ).',
      'Body 2: Phân tích nhóm Output & Recall (Shadowing, AI Roleplay, FSRS, Writing).',
    ],
    band8Lexicon: [
      { phrase: 'accounted for the lion’s share', meaningVi: 'chiếm phần tỷ trọng lớn nhất' },
      { phrase: 'complementary distribution', meaningVi: 'sự phân bổ bổ trợ lẫn nhau' },
    ],
    starterDraft:
      'The table shows how successful learners spent their time each week. Listening and reading took the most hours compared to writing.',
    modelBand65:
      'The table details weekly study hours across five learning activities. Comprehensible listening and reading accounted for the largest portion at 45%, followed by active speaking and shadowing.',
    modelBand85:
      'The table breaks down the weekly time allocation across five study modalities among learners who attained C1 proficiency within one year. Overall, comprehensible listening and reading accounted for the lion’s share of total effort, complemented by focused daily blocks of phoneme shadowing and spaced recall.',
  },
  {
    id: 'wp-ielts1-process',
    category: 'IELTS Task 1',
    title: 'Process Diagram: On-Device Speech-to-IPA Evaluation Pipeline',
    cefr: 'C1',
    timeLimitMin: 20,
    minWords: 150,
    promptText:
      'The diagram illustrates the five-stage pipeline transforming raw microphone audio into phoneme-level IPA scores and articulatory feedback inside a native Apple application.',
    chart: {
      kind: 'bar',
      unit: 'ms',
      caption: 'Stage Processing Budget in On-Device Speech-to-IPA Pipeline (ms)',
      series: [
        { label: '1. Mic Capture & VAD', value: 18, color: 'var(--cyan)' },
        { label: '2. Pitch F0 & Features', value: 22, color: 'var(--indigo)' },
        { label: '3. Speech Recognition', value: 48, color: 'var(--amber)' },
        { label: '4. IPA Alignment (GOP)', value: 14, color: 'var(--green)' },
        { label: '5. Mouth SVG Feedback', value: 8, color: 'var(--pink)' },
      ],
    },
    outlineVi: [
      'Mở bài: Giới thiệu sơ đồ quy trình 5 bước biến âm thanh micro thành điểm IPA.',
      'Overview: Quy trình khép kín gồm thu âm PCM, tách tần số F0 & nhận diện từ, đối sánh IPA và phản hồi.',
      'Body 1: Giai đoạn 1–3 (Audio capture → Autocorrelation F0 & Speech-to-Text → IPA tokenization).',
      'Body 2: Giai đoạn 4–5 (Levenshtein alignment → Highlight lỗi & gợi ý khẩu hình SVG).',
    ],
    band8Lexicon: [
      { phrase: 'sequentially processed through', meaningVi: 'được xử lý tuần tự qua' },
      { phrase: 'culminates in actionable diagnostics', meaningVi: 'kết thúc bằng chẩn đoán hữu ích' },
    ],
    starterDraft:
      'The diagram shows five steps to score English pronunciation. First, the microphone records the voice, and finally the screen displays weak phonemes.',
    modelBand65:
      'The flow chart depicts five stages in scoring spoken English. Initially, raw audio is captured by the microphone and analyzed for pitch. Subsequently, recognized words are converted to IPA tokens and compared against native targets.',
    modelBand85:
      'The diagram outlines the five-stage on-device pipeline that converts raw microphone audio into phoneme-level pronunciation diagnostics. Overall, the linear workflow moves from acoustic signal capture and pitch extraction through IPA alignment, culminating in color-coded visual feedback.',
  },
  {
    id: 'wp-tech-rfc',
    category: 'Tech RFC & Workplace',
    title: 'Engineering RFC: Migrating to Local-First SQLite + CRDT Sync',
    cefr: 'C1',
    timeLimitMin: 25,
    minWords: 150,
    promptText:
      'Write a concise Engineering RFC executive summary proposing a migration from REST-only state fetching to a Local-First SQLite + CRDT synchronization engine for our iPhone and macOS apps. Clearly state the bottleneck, architecture, and tradeoffs.',
    outlineVi: [
      'Context & Bottleneck: Điểm nghẽn khi mất mạng làm gián đoạn lật thẻ FSRS.',
      'Proposed Solution: Local-First SQLite + đồng bộ ngầm CRDT.',
      'Tradeoffs: Đánh đổi ~15MB bộ nhớ đệm để đạt phản hồi UI 0ms.',
      'Rollout: Thử nghiệm nội bộ và đo lường crash-free rate.',
    ],
    band8Lexicon: [
      { phrase: 'eliminate network round-trip bottlenecks', meaningVi: 'loại bỏ điểm nghẽn chờ mạng khứ hồi' },
      { phrase: 'conflict-free state convergence', meaningVi: 'hội tụ trạng thái không xung đột' },
      { phrase: 'acceptable storage overhead tradeoff', meaningVi: 'đánh đổi dung lượng chấp nhận được' },
    ],
    starterDraft:
      'Currently our app has a problem when users lose internet connection. I think we should use a local database so the app is more better and faster.',
    modelBand65:
      'This RFC proposes moving our app data to local SQLite. Right now, flashcard reviews wait for server responses, causing lag on slow connections. By storing data locally on Mac and iPhone, users can study offline.',
    modelBand85:
      'This RFC proposes transitioning our client data layer to a local-first SQLite architecture backed by CRDT synchronization. Currently, synchronous REST calls introduce a conspicuous latency bottleneck during mobile commutes. Adopting local-first persistence guarantees instantaneous UI responsiveness and resilient offline study, with only a modest storage tradeoff on client devices.',
  },
  {
    id: 'wp-tech-postmortem',
    category: 'Tech RFC & Workplace',
    title: 'Blameless Incident Postmortem: WebSocket Reconnect Storm',
    cefr: 'C1',
    timeLimitMin: 20,
    minWords: 140,
    promptText:
      'Draft an executive incident postmortem explaining a 14-minute API degradation caused by clients reconnecting simultaneously without exponential backoff jitter. Include Root Cause, Impact, and Action Items.',
    outlineVi: [
      'Summary & Impact: Nêu thời gian ảnh hưởng (14 phút) và tỷ lệ request lỗi.',
      'Root Cause: Thiếu jitter trong cơ chế retry khiến hàng loạt client kết nối lại cùng 1 giây.',
      'Remediation & Prevention: Bổ sung exponential backoff + full jitter & circuit breaker.',
    ],
    band8Lexicon: [
      { phrase: 'thundering herd retry storm', meaningVi: 'cơn bão kết nối lại đồng loạt' },
      { phrase: 'mitigate cascading saturation', meaningVi: 'giảm thiểu quá tải dây chuyền' },
      { phrase: 'exponential backoff with jitter', meaningVi: 'giãn nhịp thử lại tăng dần kèm nhiễu ngẫu nhiên' },
    ],
    starterDraft:
      'Yesterday our server crashed for 14 minutes because too many users reconnected at the same time. We will fix the client code so it waits longer before trying again.',
    modelBand65:
      'On Tuesday, our API experienced a 14-minute outage affecting 18% of requests. The root cause was a reconnect storm after a brief load balancer restart. To prevent recurrence, we are adding randomized backoff delays.',
    modelBand85:
      'Between 09:12 and 09:26 UTC, 18% of live tutor sessions experienced degraded availability due to a thundering herd retry storm. Following a brief proxy reload, mobile clients attempted simultaneous reconnection without jitter, saturating worker pools. We are deploying exponential backoff with full jitter and stricter edge rate limiting to mitigate cascading saturation.',
  },
  {
    id: 'wp-tech-pr-review',
    category: 'Tech RFC & Workplace',
    title: 'Constructive Architecture Feedback on Pull Request',
    cefr: 'B2',
    timeLimitMin: 15,
    minWords: 110,
    promptText:
      'Write a respectful, clear, and actionable code review message to a teammate whose PR duplicates FSRS scheduling logic across Web and macOS modules and introduces decorative CSS gradients that violate our design tokens.',
    outlineVi: [
      'Acknowledge strengths: Khen ngợi phần kiểm thử và luồng UX rõ ràng.',
      'Actionable point 1: Gộp logic FSRS vào một shared helper duy nhất (tránh duplicate).',
      'Actionable point 2: Chuyển CSS sang dùng var(--panel) chuẩn Tahoe 26 thay vì gradient.',
    ],
    band8Lexicon: [
      { phrase: 'consolidate duplicated logic into', meaningVi: 'hợp nhất logic trùng lặp vào' },
      { phrase: 'preserve visual consistency across', meaningVi: 'giữ đồng nhất giao diện trên' },
      { phrase: 'non-blocking nitpick', meaningVi: 'góp ý nhỏ không chặn merge' },
    ],
    starterDraft:
      'Good job on this PR! However, you copied the FSRS function twice and used linear-gradient which is not allowed. Please fix it.',
    modelBand65:
      'Thanks for putting this together—the flashcard flow feels smooth! Two quick requests before merging: could we extract the duplicated FSRS calculation into a shared helper, and replace the gradient background with var(--panel) tokens?',
    modelBand85:
      'Great work on the keyboard shortcut ergonomics here! Before we land this, let us consolidate the duplicated scheduling calculation into our shared FSRS helper so future weight updates stay synchronized. Additionally, please replace the linear-gradient fill with standard --panel and --specular tokens to preserve visual consistency across Dark and Light modes.',
  },
  {
    id: 'wp-biz-stakeholder',
    category: 'Tech RFC & Workplace',
    title: 'Stakeholder Update: Reprioritizing Latency Over New Widgets',
    cefr: 'C1',
    timeLimitMin: 20,
    minWords: 130,
    promptText:
      'Write an email to product stakeholders explaining why engineering recommends spending two weeks cutting audio startup latency and fixing Safari layout overflow before building cosmetic dashboard widgets.',
    outlineVi: [
      'Context: Ghi nhận tầm quan trọng của các widget mới.',
      'Data-backed rationale: Độ trễ âm thanh hiện tại ảnh hưởng trực tiếp tới tỷ lệ giữ chân ngày 7.',
      'Proposal & Timeline: Dành 2 tuần xử lý lõi rồi quay lại triển khai widget mượt mà hơn.',
    ],
    band8Lexicon: [
      { phrase: 'directly correlates with retention', meaningVi: 'tương quan trực tiếp với tỷ lệ giữ chân' },
      { phrase: 'sequence our roadmap pragmatically', meaningVi: 'sắp xếp lộ trình một cách thực tế' },
      { phrase: 'compound engineering velocity', meaningVi: 'tăng tốc độ phát triển bền vững' },
    ],
    starterDraft:
      'Hi team, I think we should delay the new dashboard widgets for two weeks because the app is slow and Safari mobile has bugs.',
    modelBand65:
      'Hi everyone, while we are excited about the new widgets, telemetry shows audio latency and mobile overflow hurt Day-7 retention. We propose dedicating the next sprint to core performance before shipping those widgets.',
    modelBand85:
      'Hi team, while the proposed analytics widgets remain a high priority for Q4, recent telemetry indicates that audio startup latency directly correlates with Day-7 retention drops. To sequence our roadmap pragmatically, engineering recommends dedicating this two-week sprint to sub-150ms audio initialization and Safari responsive polish, enabling us to ship the new widgets on a resilient foundation.',
  },
];
