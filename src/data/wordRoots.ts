export interface WordDerivative {
  word: string;
  ipa: string;
  pos: string;
  prefix?: string;
  suffix?: string;
  meaningVi: string;
  example: string;
  cefr: 'B2' | 'C1' | 'C2';
}

export interface WordRootNode {
  id: string;
  root: string;
  origin: 'Latin' | 'Greek';
  coreMeaningVi: string;
  coreMeaningEn: string;
  mnemonicVi: string;
  derivatives: WordDerivative[];
}

export const WORD_ROOTS_DATA: WordRootNode[] = [
  {
    id: 'root-spect',
    root: 'SPECT / SPEC',
    origin: 'Latin',
    coreMeaningVi: 'nhìn, quan sát, xem xét',
    coreMeaningEn: 'to look, see, or observe',
    mnemonicVi: 'Hãy nhớ "Spectacles" (kính mắt) hoặc "Spectator" (khán giả xem trận đấu).',
    derivatives: [
      { word: 'perspective', ipa: '/pərˈspek.tɪv/', pos: 'noun', prefix: 'per- (xuyên qua)', suffix: '-ive', meaningVi: 'góc nhìn, quan điểm toàn diện', example: 'From a scalability perspective, stateless workers are ideal.', cefr: 'B2' },
      { word: 'retrospect', ipa: '/ˈret.rə.spekt/', pos: 'noun', prefix: 'retro- (ngược về sau)', meaningVi: 'sự nhìn lại quá khứ, hồi tưởng', example: 'In retrospect, migrating incrementally was the safest choice.', cefr: 'C1' },
      { word: 'circumspect', ipa: '/ˈsɜː.kəm.spekt/', pos: 'adj', prefix: 'circum- (xung quanh)', meaningVi: 'thận trọng, nhìn trước ngó sau kỹ lưỡng', example: 'Regulators remain circumspect about autonomous financial agents.', cefr: 'C2' },
      { word: 'introspection', ipa: '/ˌɪn.trəˈspek.ʃən/', pos: 'noun', prefix: 'intro- (vào trong)', suffix: '-ion', meaningVi: 'sự tự nhìn nhận, chiêm nghiệm nội tâm', example: 'Quiet introspection helps leaders identify their own blind spots.', cefr: 'C2' },
      { word: 'conspicuous', ipa: '/kənˈspɪk.ju.əs/', pos: 'adj', prefix: 'con- (hoàn toàn)', suffix: '-ous', meaningVi: 'dễ thấy, đập ngay vào mắt, nổi bật', example: 'There was a conspicuous spike in memory consumption after deploy.', cefr: 'C1' },
      { word: 'speculate', ipa: '/ˈspek.jə.leɪt/', pos: 'verb', suffix: '-ate', meaningVi: 'suy đoán, đầu cơ', example: 'Engineers should profile first rather than speculate about bottlenecks.', cefr: 'B2' },
    ],
  },
  {
    id: 'root-struct',
    root: 'STRUCT',
    origin: 'Latin',
    coreMeaningVi: 'xây dựng, lắp ghép, cấu trúc',
    coreMeaningEn: 'to build or assemble',
    mnemonicVi: 'Nhớ từ quen thuộc "Structure" (cấu trúc) và "Construction" (xây dựng).',
    derivatives: [
      { word: 'infrastructure', ipa: '/ˈɪn.frəˌstrʌk.tʃər/', pos: 'noun', prefix: 'infra- (bên dưới)', meaningVi: 'cơ sở hạ tầng nền tảng', example: 'Cloud infrastructure must withstand single-zone hardware failures.', cefr: 'B2' },
      { word: 'obstruct', ipa: '/əbˈstrʌkt/', pos: 'verb', prefix: 'ob- (chống lại)', meaningVi: 'cản trở, làm tắc nghẽn', example: 'Unindexed queries can obstruct the entire transaction queue.', cefr: 'C1' },
      { word: 'constructive', ipa: '/kənˈstrʌk.tɪv/', pos: 'adj', prefix: 'con- (cùng nhau)', suffix: '-ive', meaningVi: 'mang tính xây dựng, đóng góp tích cực', example: 'Code reviews should always offer constructive technical feedback.', cefr: 'B2' },
      { word: 'restructure', ipa: '/ˌriːˈstrʌk.tʃər/', pos: 'verb', prefix: 're- (lại)', meaningVi: 'tái cấu trúc, tổ chức lại', example: 'We decided to restructure the monorepo into clean domain packages.', cefr: 'B2' },
      { word: 'instruct', ipa: '/ɪnˈstrʌkt/', pos: 'verb', prefix: 'in- (vào trong)', meaningVi: 'hướng dẫn, chỉ thị', example: 'System prompts instruct the model to return validated JSON.', cefr: 'B2' },
      { word: 'deconstruct', ipa: '/ˌdiː.kənˈstrʌkt/', pos: 'verb', prefix: 'de- (tháo gỡ)', meaningVi: 'bóc tách, phân rã để hiểu bản chất', example: 'Let us deconstruct this complex sentence into its core clauses.', cefr: 'C1' },
    ],
  },
  {
    id: 'root-mit',
    root: 'MIT / MISS',
    origin: 'Latin',
    coreMeaningVi: 'gửi đi, phóng đi, cho phép qua',
    coreMeaningEn: 'to send or let go',
    mnemonicVi: 'Nhớ từ "Mission" (sứ mệnh gửi đi) hoặc "Transmit" (truyền phát).',
    derivatives: [
      { word: 'intermittent', ipa: '/ˌɪn.tərˈmɪt.ənt/', pos: 'adj', prefix: 'inter- (giữa các quãng)', suffix: '-ent', meaningVi: 'chập chờn, ngắt quãng không liên tục', example: 'Intermittent network timeouts are harder to debug than total outages.', cefr: 'C1' },
      { word: 'transmit', ipa: '/trænzˈmɪt/', pos: 'verb', prefix: 'trans- (vượt qua)', meaningVi: 'truyền tải (tín hiệu, dữ liệu)', example: 'WebSockets transmit bidirectional events with minimal overhead.', cefr: 'B2' },
      { word: 'omit', ipa: '/əˈmɪt/', pos: 'verb', prefix: 'o- (bỏ qua)', meaningVi: 'lược bỏ, bỏ sót', example: 'Never omit error boundaries in production client applications.', cefr: 'C1' },
      { word: 'remit', ipa: '/rɪˈmɪt/', pos: 'noun / verb', prefix: 're- (gửi lại)', meaningVi: 'phạm vi trách nhiệm / chuyển tiền', example: 'Infrastructure security falls squarely within our team remit.', cefr: 'C2' },
      { word: 'emissary', ipa: '/ˈem.ɪ.ser.i/', pos: 'noun', prefix: 'e- (ra ngoài)', meaningVi: 'đặc phái viên, sứ giả', example: 'Developer advocates act as emissaries between product and community.', cefr: 'C2' },
      { word: 'premise', ipa: '/ˈprem.ɪs/', pos: 'noun', prefix: 'pre- (đặt trước)', meaningVi: 'tiền đề, giả định cốt lõi', example: 'Spaced repetition is built on the premise of active recall.', cefr: 'C1' },
    ],
  },
  {
    id: 'root-tract',
    root: 'TRACT',
    origin: 'Latin',
    coreMeaningVi: 'kéo, lôi cuốn, rút ra',
    coreMeaningEn: 'to pull, drag, or draw',
    mnemonicVi: 'Nhớ chiếc máy kéo "Tractor" hoặc "Attract" (thu hút).',
    derivatives: [
      { word: 'intractable', ipa: '/ɪnˈtræk.tə.bəl/', pos: 'adj', prefix: 'in- (không thể)', suffix: '-able', meaningVi: 'nan giải, cực kỳ khó giải quyết', example: 'Distributed consensus was once considered an intractable problem.', cefr: 'C2' },
      { word: 'protracted', ipa: '/prəˈtræk.tɪd/', pos: 'adj', prefix: 'pro- (kéo dài)', meaningVi: 'kéo dài lê thê, dai dẳng', example: 'Clear documentation prevents protracted onboarding cycles.', cefr: 'C2' },
      { word: 'extract', ipa: '/ɪkˈstrækt/', pos: 'verb', prefix: 'ex- (ra khỏi)', meaningVi: 'trích xuất, rút trích', example: 'Our pipeline extracts phoneme timestamps directly from audio.', cefr: 'B2' },
      { word: 'retract', ipa: '/rɪˈtrækt/', pos: 'verb', prefix: 're- (ngược lại)', meaningVi: 'rút lại (lời tuyên bố, quyết định)', example: 'The journal had to retract the flawed benchmark study.', cefr: 'C1' },
      { word: 'detract', ipa: '/dɪˈtrækt/', pos: 'verb', prefix: 'de- (lấy bớt)', meaningVi: 'làm giảm giá trị, làm lu mờ', example: 'Heavy visual gradients detract from typography and readability.', cefr: 'C1' },
      { word: 'abstract', ipa: '/ˈæb.strækt/', pos: 'adj / verb', prefix: 'ab- (tách ra)', meaningVi: 'trừu tượng hóa, tách khỏi chi tiết vụn vặt', example: 'Good interfaces abstract away complex platform differences.', cefr: 'B2' },
    ],
  },
  {
    id: 'root-duct',
    root: 'DUCT / DUC',
    origin: 'Latin',
    coreMeaningVi: 'dẫn dắt, chỉ huy, dẫn truyền',
    coreMeaningEn: 'to lead or guide',
    mnemonicVi: 'Nhớ "Conductor" (nhạc trưởng dẫn dắt dàn nhạc / chất dẫn điện).',
    derivatives: [
      { word: 'conducive', ipa: '/kənˈduː.sɪv/', pos: 'adj', prefix: 'con- (cùng)', suffix: '-ive', meaningVi: 'tạo điều kiện thuận lợi cho (đi với "to")', example: 'A calm minimalist interface is conducive to deep concentration.', cefr: 'C1' },
      { word: 'deduce', ipa: '/dɪˈduːs/', pos: 'verb', prefix: 'de- (từ trên xuống)', meaningVi: 'suy luận logic từ dữ kiện có sẵn', example: 'Learners can deduce the meaning of unfamiliar words from context.', cefr: 'C1' },
      { word: 'induce', ipa: '/ɪnˈduːs/', pos: 'verb', prefix: 'in- (vào trong)', meaningVi: 'gây ra, kích hoạt, thuyết phục', example: 'Sudden retry storms can induce cascading failures.', cefr: 'C1' },
      { word: 'abduct', ipa: '/æbˈdʌkt/', pos: 'verb', prefix: 'ab- (ra xa)', meaningVi: 'bắt cóc, kéo lệch ra ngoài', example: 'Do not let notifications abduct your attention during study blocks.', cefr: 'C1' },
      { word: 'productive', ipa: '/prəˈdʌk.tɪv/', pos: 'adj', prefix: 'pro- (tiến lên)', meaningVi: 'năng suất, tạo ra giá trị thực', example: 'Active recall is far more productive than passive reading.', cefr: 'B2' },
      { word: 'viaduct', ipa: '/ˈvaɪ.ə.dʌkt/', pos: 'noun', prefix: 'via- (con đường)', meaningVi: 'cầu cạn dẫn đường qua thung lũng', example: 'Spaced repetition acts as a viaduct bridging short- and long-term memory.', cefr: 'C2' },
    ],
  },
  {
    id: 'root-scrib',
    root: 'SCRIB / SCRIPT',
    origin: 'Latin',
    coreMeaningVi: 'viết, ghi chép, khắc chữ',
    coreMeaningEn: 'to write or record',
    mnemonicVi: 'Nhớ từ "Script" (kịch bản/mã lệnh) và "Describe" (mô tả).',
    derivatives: [
      { word: 'transcribe', ipa: '/trænˈskraɪb/', pos: 'verb', prefix: 'trans- (chuyển qua)', meaningVi: 'chuyển âm thanh thành văn bản phiên âm', example: 'WhisperKit can transcribe spoken English locally on Apple Silicon.', cefr: 'C1' },
      { word: 'prescribe', ipa: '/prɪˈskraɪb/', pos: 'verb', prefix: 'pre- (trước)', meaningVi: 'kê đơn, quy định giải pháp chuẩn', example: 'Apple HIG prescribes clear hierarchy and concentric corner radii.', cefr: 'C1' },
      { word: 'proscribe', ipa: '/prəʊˈskraɪb/', pos: 'verb', prefix: 'pro- (cấm)', meaningVi: 'cấm đoán, bài trừ nghiêm ngặt', example: 'Our design system strictly proscribes decorative neon gradients.', cefr: 'C2' },
      { word: 'circumscribe', ipa: '/ˈsɜː.kəm.skraɪb/', pos: 'verb', prefix: 'circum- (vòng quanh)', meaningVi: 'giới hạn trong phạm vi rõ ràng', example: 'Sandbox permissions circumscribe what untrusted plugins can access.', cefr: 'C2' },
      { word: 'ascribe', ipa: '/əˈskraɪb/', pos: 'verb', prefix: 'a- (gán cho)', meaningVi: 'quy nguyên nhân/công trạng cho', example: 'Polyglots ascribe fluency to thousands of hours of comprehensible input.', cefr: 'C2' },
      { word: 'manuscript', ipa: '/ˈmæn.jə.skrɪpt/', pos: 'noun', prefix: 'manu- (bằng tay)', meaningVi: 'bản thảo viết tay hoặc bản gốc', example: 'Always proofread your manuscript aloud to catch awkward phrasing.', cefr: 'B2' },
    ],
  },
  {
    id: 'root-port',
    root: 'PORT',
    origin: 'Latin',
    coreMeaningVi: 'mang, vác, vận chuyển',
    coreMeaningEn: 'to carry or bear',
    mnemonicVi: 'Nhớ "Export" (xuất khẩu - mang ra), "Import" (nhập vào), "Portable" (xách tay).',
    derivatives: [
      { word: 'comport', ipa: '/kəmˈpɔːrt/', pos: 'verb', prefix: 'com- (cùng)', meaningVi: 'cư xử, ứng xử / phù hợp với', example: 'Ensure your claims comport with the verified telemetry output.', cefr: 'C2' },
      { word: 'purport', ipa: '/pərˈpɔːrt/', pos: 'verb', prefix: 'pur- (về phía trước)', meaningVi: 'tự nhận là, có vẻ như ngụ ý', example: 'The tool purports to detect grammar issues in milliseconds.', cefr: 'C2' },
      { word: 'deportment', ipa: '/dɪˈpɔːrt.mənt/', pos: 'noun', prefix: 'de- (ra)', suffix: '-ment', meaningVi: 'tác phong, phong thái giao tiếp', example: 'Calm deportment matters greatly during executive interviews.', cefr: 'C2' },
      { word: 'portfolio', ipa: '/pɔːrtˈfəʊ.li.əʊ/', pos: 'noun', suffix: 'folio (tờ giấy)', meaningVi: 'hồ sơ năng lực / danh mục đầu tư', example: 'Ship open-source projects to strengthen your engineering portfolio.', cefr: 'B2' },
      { word: 'transportable', ipa: '/trænˈspɔːr.tə.bəl/', pos: 'adj', prefix: 'trans- (qua)', suffix: '-able', meaningVi: 'có thể mang theo di chuyển dễ dàng', example: 'Flashcard progress should be transportable across Mac and iPhone.', cefr: 'B2' },
      { word: 'opportune', ipa: '/ˌɑː.pərˈtuːn/', pos: 'adj', prefix: 'ob- (hướng tới cảng)', meaningVi: 'đúng thời điểm thuận lợi', example: 'Reviewing due cards right before sleep is an opportune habit.', cefr: 'C1' },
    ],
  },
  {
    id: 'root-dict',
    root: 'DICT / DIC',
    origin: 'Latin',
    coreMeaningVi: 'nói, tuyên bố, khẳng định',
    coreMeaningEn: 'to say, speak, or declare',
    mnemonicVi: 'Nhớ "Dictionary" (từ điển) và "Dictation" (nghe chép lời nói).',
    derivatives: [
      { word: 'contradict', ipa: '/ˌkɑːn.trəˈdɪkt/', pos: 'verb', prefix: 'contra- (ngược lại)', meaningVi: 'mâu thuẫn, bác bỏ lời nói trước', example: 'Do not let runtime logs contradict your status report.', cefr: 'B2' },
      { word: 'verdict', ipa: '/ˈvɜːr.dɪkt/', pos: 'noun', prefix: 'ver- (sự thật)', meaningVi: 'phán quyết, kết luận cuối cùng', example: 'Wait for the benchmark verdict before rewriting the parser.', cefr: 'C1' },
      { word: 'indict', ipa: '/ɪnˈdaɪt/', pos: 'verb', prefix: 'in- (chống lại)', meaningVi: 'buộc tội, lên án chính thức', example: 'User telemetry clearly indicts unoptimized image decoding.', cefr: 'C2' },
      { word: 'edict', ipa: '/ˈiː.dɪkt/', pos: 'noun', prefix: 'e- (ra ngoài)', meaningVi: 'sắc lệnh, quy định bắt buộc', example: 'Consistency comes from daily habit rather than top-down edicts.', cefr: 'C2' },
      { word: 'predictable', ipa: '/prɪˈdɪk.tə.bəl/', pos: 'adj', prefix: 'pre- (trước)', suffix: '-able', meaningVi: 'có thể dự đoán trước, ổn định', example: 'FSRS produces predictable long-term review intervals.', cefr: 'B2' },
      { word: 'diction', ipa: '/ˈdɪk.ʃən/', pos: 'noun', suffix: '-ion', meaningVi: 'cách lựa chọn từ ngữ & phát âm rõ chữ', example: 'Shadowing news anchors sharpens both diction and cadence.', cefr: 'C1' },
    ],
  },
  {
    id: 'root-ject',
    root: 'JECT',
    origin: 'Latin',
    coreMeaningVi: 'ném, phóng, đẩy ra',
    coreMeaningEn: 'to throw or cast',
    mnemonicVi: 'Nhớ "Projector" (máy chiếu phóng hình) và "Eject" (đẩy đĩa ra).',
    derivatives: [
      { word: 'conjecture', ipa: '/kənˈdʒek.tʃər/', pos: 'noun / verb', prefix: 'con- (ném chung vào)', meaningVi: 'sự phỏng đoán chưa có bằng chứng', example: 'Root-cause analysis relies on evidence rather than conjecture.', cefr: 'C2' },
      { word: 'trajectory', ipa: '/trəˈdʒek.tər.i/', pos: 'noun', prefix: 'trans- (vượt qua)', meaningVi: 'quỹ đạo, xu hướng phát triển', example: 'The chart exhibited a steep downward trajectory in latency.', cefr: 'C1' },
      { word: 'interject', ipa: '/ˌɪn.tərˈdʒekt/', pos: 'verb', prefix: 'inter- (xen vào giữa)', meaningVi: 'xen ngang, ngắt lời nhận xét', example: 'Politely interject during meetings with "May I add a quick point?"', cefr: 'C1' },
      { word: 'dejected', ipa: '/dɪˈdʒek.tɪd/', pos: 'adj', prefix: 'de- (xuống)', meaningVi: 'chán nản, sụp đổ tinh thần', example: 'Never feel dejected by early pronunciation scores; muscles adapt fast.', cefr: 'C1' },
      { word: 'abject', ipa: '/ˈæb.dʒekt/', pos: 'adj', prefix: 'ab- (vứt bỏ xuống thấp)', meaningVi: 'tồi tệ cùng cực, thảm hại', example: 'Shipping untested migrations can lead to abject chaos.', cefr: 'C2' },
      { word: 'objective', ipa: '/əbˈdʒek.tɪv/', pos: 'adj / noun', prefix: 'ob- (đặt ra trước mắt)', meaningVi: 'khách quan / mục tiêu đề ra', example: 'Phoneme GOP scores provide objective pronunciation metrics.', cefr: 'B2' },
    ],
  },
  {
    id: 'root-vers',
    root: 'VERS / VERT',
    origin: 'Latin',
    coreMeaningVi: 'xoay chuyển, đảo ngược, hướng về',
    coreMeaningEn: 'to turn or change direction',
    mnemonicVi: 'Nhớ "Reverse" (đảo ngược) và "Convert" (chuyển đổi).',
    derivatives: [
      { word: 'ubiquitous / versatile', ipa: '/ˈvɜːr.sə.təl/', pos: 'adj', suffix: '-ile', meaningVi: 'đa năng, xoay xở linh hoạt nhiều vai trò', example: 'SwiftUI and React form a versatile cross-device stack.', cefr: 'C1' },
      { word: 'converge', ipa: '/kənˈvɜːrdʒ/', pos: 'verb', prefix: 'con- (cùng xoay về)', meaningVi: 'hội tụ về một điểm chung', example: 'CRDT replicas eventually converge to the identical state.', cefr: 'C1' },
      { word: 'diverge', ipa: '/daɪˈvɜːrdʒ/', pos: 'verb', prefix: 'di- (tách đôi)', meaningVi: 'phân kỳ, rẽ nhánh khác biệt', example: 'Spoken idioms often diverge sharply from textbook grammar.', cefr: 'C1' },
      { word: 'inadvertent', ipa: '/ˌɪn.ədˈvɜːr.tənt/', pos: 'adj', prefix: 'in- (không) + ad- (hướng tới)', meaningVi: 'vô tình, sơ ý không chủ đích', example: 'An inadvertent typo triggered a word reset in typing practice.', cefr: 'C2' },
      { word: 'subvert', ipa: '/səbˈvɜːrt/', pos: 'verb', prefix: 'sub- (từ bên dưới)', meaningVi: 'lật đổ, làm đảo lộn', example: 'Heavy gradients subvert the calm discipline of Liquid Glass.', cefr: 'C2' },
      { word: 'aversion', ipa: '/əˈvɜːr.ʒən/', pos: 'noun', prefix: 'a- (quay đi khỏi)', meaningVi: 'sự ác cảm, e ngại né tránh', example: 'Many learners have an initial aversion to hearing their own recorded voice.', cefr: 'C1' },
    ],
  },
  {
    id: 'root-ced',
    root: 'CED / CEED / CESS',
    origin: 'Latin',
    coreMeaningVi: 'đi tới, nhường bước, tiếp nối',
    coreMeaningEn: 'to go, move, or yield',
    mnemonicVi: 'Nhớ "Proceed" (tiến hành tiếp), "Succeed" (đi tới thành công), "Access" (đi vào).',
    derivatives: [
      { word: 'unprecedented', ipa: '/ʌnˈpres.ɪ.den.tɪd/', pos: 'adj', prefix: 'un- (chưa) + pre- (trước)', meaningVi: 'chưa từng có tiền lệ trong lịch sử', example: 'On-device Core ML offers unprecedented real-time transcription speed.', cefr: 'C1' },
      { word: 'concede', ipa: '/kənˈsiːd/', pos: 'verb', prefix: 'con- (nhường hẳn)', meaningVi: 'thừa nhận, nhượng bộ một phần lập luận', example: 'I concede that synchronous APIs are simpler for tiny prototypes.', cefr: 'C1' },
      { word: 'recede', ipa: '/rɪˈsiːd/', pos: 'verb', prefix: 're- (lùi lại)', meaningVi: 'rút lui, mờ dần đi', example: 'Performance anxiety begins to recede after 20 hours of AI speaking.', cefr: 'C1' },
      { word: 'incessant', ipa: '/ɪnˈses.ənt/', pos: 'adj', prefix: 'in- (không ngừng)', meaningVi: 'liên miên không dứt', example: 'Incessant alerts fragment deep work and memory retention.', cefr: 'C2' },
      { word: 'exceed', ipa: '/ɪkˈsiːd/', pos: 'verb', prefix: 'ex- (vượt ra ngoài)', meaningVi: 'vượt quá giới hạn/kỳ vọng', example: 'Aim for speaking fluency that exceeds your written exam target.', cefr: 'B2' },
      { word: 'predecessor', ipa: '/ˈpred.ə.ses.ər/', pos: 'noun', prefix: 'pre- (đi trước)', meaningVi: 'người tiền nhiệm / phiên bản trước', example: 'FSRS v5 outperforms its SM-2 predecessor by nearly 30%.', cefr: 'C1' },
    ],
  },
  {
    id: 'root-pel',
    root: 'PEL / PULS',
    origin: 'Latin',
    coreMeaningVi: 'đẩy, thúc giục, xua đuổi',
    coreMeaningEn: 'to drive, push, or force',
    mnemonicVi: 'Nhớ "Propeller" (chân vịt đẩy tàu bay) và "Pulse" (nhịp đập đẩy máu).',
    derivatives: [
      { word: 'compelling', ipa: '/kəmˈpel.ɪŋ/', pos: 'adj', prefix: 'com- (thúc mạnh)', meaningVi: 'đầy sức thuyết phục, lôi cuốn không thể chối từ', example: 'Present a compelling architectural argument backed by benchmarks.', cefr: 'C1' },
      { word: 'propel', ipa: '/prəˈpel/', pos: 'verb', prefix: 'pro- (về phía trước)', meaningVi: 'thúc đẩy tiến vọt lên', example: 'Daily shadowing will propel your speaking band from 6.5 to 8.0.', cefr: 'C1' },
      { word: 'dispel', ipa: '/dɪˈspel/', pos: 'verb', prefix: 'dis- (tan rã ra)', meaningVi: 'xua tan (nỗi lo, hiểu lầm)', example: 'Clear data helps dispel myths about spaced repetition overhead.', cefr: 'C1' },
      { word: 'impulsive', ipa: '/ɪmˈpʌl.sɪv/', pos: 'adj', prefix: 'im- (bùng lên)', meaningVi: 'bốc đồng, hành động thiếu suy xét', example: 'Avoid impulsive rewrites without solid unit test coverage.', cefr: 'B2' },
      { word: 'repel', ipa: '/rɪˈpel/', pos: 'verb', prefix: 're- (đẩy ngược lại)', meaningVi: 'đẩy lùi, gây phản cảm', example: 'Cluttered UIs repel learners before habits can even form.', cefr: 'B2' },
      { word: 'expulsion', ipa: '/ɪkˈspʌl.ʃən/', pos: 'noun', prefix: 'ex- (ra khỏi)', meaningVi: 'sự trục xuất, đẩy ra ngoài', example: 'Sudden cache expulsion caused a temporary spike in database reads.', cefr: 'C2' },
    ],
  },
];
