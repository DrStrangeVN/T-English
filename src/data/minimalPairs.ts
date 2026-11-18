export interface MinimalPairExample {
  wordA: string;
  ipaA: string;
  meaningViA: string;
  wordB: string;
  ipaB: string;
  meaningViB: string;
  sentenceA: string;
  sentenceB: string;
}

export interface MinimalPairContrast {
  id: string;
  phonemeA: string;
  phonemeB: string;
  title: string;
  learnerPainPointVi: string;
  mouthContrastVi: string;
  pairs: MinimalPairExample[];
}

export const MINIMAL_PAIRS_DATA: MinimalPairContrast[] = [
  {
    id: 'mp-theta-s',
    phonemeA: 'θ',
    phonemeB: 's',
    title: '/θ/ (think) vs /s/ (sink)',
    learnerPainPointVi: 'Người Việt thường thụt lưỡi vào trong khiến âm /θ/ biến thành /s/ hoặc /t/.',
    mouthContrastVi: 'Với /θ/: Đặt đầu lưỡi nhô nhẹ ra GIỮA hai hàm răng rồi thổi hơi. Với /s/: Đầu lưỡi nằm SAU răng cửa, hai hàm răng khép gần nhau.',
    pairs: [
      { wordA: 'think', ipaA: '/θɪŋk/', meaningViA: 'suy nghĩ', wordB: 'sink', ipaB: '/sɪŋk/', meaningViB: 'chìm xuống / bồn rửa', sentenceA: 'I think this architecture scales well.', sentenceB: 'Do not let technical debt sink the project.' },
      { wordA: 'thick', ipaA: '/θɪk/', meaningViA: 'dày đặc', wordB: 'sick', ipaB: '/sɪk/', meaningViB: 'bị ốm', sentenceA: 'Read through the thick documentation carefully.', sentenceB: 'He called in sick before the morning standup.' },
      { wordA: 'thumb', ipaA: '/θʌm/', meaningViA: 'ngón cái', wordB: 'sum', ipaB: '/sʌm/', meaningViB: 'tổng số', sentenceA: 'Mobile drawers should be reachable with one thumb.', sentenceB: 'The sum of small daily habits creates fluency.' },
      { wordA: 'path', ipaA: '/pæθ/', meaningViA: 'con đường / lộ trình', wordB: 'pass', ipaB: '/pæs/', meaningViB: 'vượt qua', sentenceA: 'Choose the critical path with the lowest latency.', sentenceB: 'All unit tests must pass before merging.' },
    ],
  },
  {
    id: 'mp-short-long-i',
    phonemeA: 'ɪ',
    phonemeB: 'iː',
    title: '/ɪ/ (ship) vs /iː/ (sheep)',
    learnerPainPointVi: 'Đọc cả hai âm thành âm "i" tiếng Việt giống hệt nhau, không phân biệt độ căng cơ miệng.',
    mouthContrastVi: 'Với /ɪ/: Môi và má thả lỏng hoàn toàn, âm ngắn hơi pha nhẹ /ê/. Với /iː/: Kéo căng khóe miệng sang hai bên như đang mỉm cười, ngân dài hơi.',
    pairs: [
      { wordA: 'ship', ipaA: '/ʃɪp/', meaningViA: 'con tàu / phát hành', wordB: 'sheep', ipaB: '/ʃiːp/', meaningViB: 'con cừu', sentenceA: 'We plan to ship the macOS build tonight.', sentenceB: 'The sheep grazed quietly on the hillside.' },
      { wordA: 'live', ipaA: '/lɪv/', meaningViA: 'sống, cư trú', wordB: 'leave', ipaB: '/liːv/', meaningViB: 'rời đi', sentenceA: 'Where do you currently live and work?', sentenceB: 'Never leave unhandled promises in async code.' },
      { wordA: 'bit', ipaA: '/bɪt/', meaningViA: 'một chút / bit', wordB: 'beat', ipaB: '/biːt/', meaningViB: 'đánh bại / nhịp', sentenceA: 'Flip a single bit in the status register.', sentenceB: 'Consistent input will beat rote memorization.' },
      { wordA: 'sit', ipaA: '/sɪt/', meaningViA: 'ngồi xuống', wordB: 'seat', ipaB: '/siːt/', meaningViB: 'chỗ ngồi', sentenceA: 'Please sit down and review the proposal.', sentenceB: 'Take a seat near the whiteboard.' },
    ],
  },
  {
    id: 'mp-ae-e',
    phonemeA: 'æ',
    phonemeB: 'e',
    title: '/æ/ (bad) vs /e/ (bed)',
    learnerPainPointVi: 'Mở hàm không đủ rộng khi phát âm /æ/, khiến "bad" nghe giống hệt "bed".',
    mouthContrastVi: 'Với /æ/: Hạ hàm dưới thật thấp (miệng mở rộng cả dọc lẫn ngang, pha giữa A và E). Với /e/: Hàm chỉ hạ nhẹ tự nhiên.',
    pairs: [
      { wordA: 'bad', ipaA: '/bæd/', meaningViA: 'tệ, xấu', wordB: 'bed', ipaB: '/bed/', meaningViB: 'chiếc giường', sentenceA: 'Caching stale tokens is a bad practice.', sentenceB: 'Review five flashcards before going to bed.' },
      { wordA: 'pan', ipaA: '/pæn/', meaningViA: 'chiếc chảo', wordB: 'pen', ipaB: '/pen/', meaningViB: 'cây bút', sentenceA: 'Pan across the timeline to inspect pitch.', sentenceB: 'Jot down key collocations with a pen.' },
      { wordA: 'man', ipaA: '/mæn/', meaningViA: 'người đàn ông', wordB: 'men', ipaB: '/men/', meaningViB: 'những người đàn ông', sentenceA: 'One man designed the initial compiler.', sentenceB: 'Both men agreed on the API contract.' },
      { wordA: 'track', ipaA: '/træk/', meaningViA: 'theo dõi', wordB: 'trek', ipaB: '/trek/', meaningViB: 'hành trình dài', sentenceA: 'Track your 1,000-hour immersion progress daily.', sentenceB: 'Learning a language is a rewarding trek.' },
    ],
  },
  {
    id: 'mp-sh-s',
    phonemeA: 'ʃ',
    phonemeB: 's',
    title: '/ʃ/ (she) vs /s/ (sea)',
    learnerPainPointVi: 'Không chu môi khi đọc /ʃ/ (sh), làm cho "she" và "share" bị bẹt thành "see".',
    mouthContrastVi: 'Với /ʃ/: Chu tròn môi về phía trước, nâng mặt lưỡi tạo luồng hơi dày như ra hiệu "Suỵt!". Với /s/: Môi bè tự nhiên, hơi mảnh qua kẽ răng.',
    pairs: [
      { wordA: 'she', ipaA: '/ʃiː/', meaningViA: 'cô ấy', wordB: 'sea', ipaB: '/siː/', meaningViB: 'biển cả', sentenceA: 'She articulated the system tradeoffs clearly.', sentenceB: 'Subsea cables carry global internet traffic.' },
      { wordA: 'sheet', ipaA: '/ʃiːt/', meaningViA: 'tấm phẳng', wordB: 'seat', ipaB: '/siːt/', meaningViB: 'ghế ngồi', sentenceA: 'Place primary content inside a matte inset sheet.', sentenceB: 'Reserve a seat for the keynote session.' },
      { wordA: 'shell', ipaA: '/ʃel/', meaningViA: 'lớp vỏ / shell', wordB: 'sell', ipaB: '/sel/', meaningViB: 'bán hàng', sentenceA: 'Run the build script inside an interactive shell.', sentenceB: 'Great design helps sell complex software.' },
    ],
  },
  {
    id: 'mp-eth-d',
    phonemeA: 'ð',
    phonemeB: 'd',
    title: '/ð/ (they) vs /d/ (day)',
    learnerPainPointVi: 'Đọc "this, that, they, brother" thành âm "đ" (/d/) cứng của tiếng Việt.',
    mouthContrastVi: 'Với /ð/: Kẹp nhẹ đầu lưỡi giữa hai răng, thổi hơi kèm rung dây thanh quản liên tục. Với /d/: Đầu lưỡi đập vào lợi trên rồi bật ra.',
    pairs: [
      { wordA: 'they', ipaA: '/ðeɪ/', meaningViA: 'họ, chúng', wordB: 'day', ipaB: '/deɪ/', meaningViB: 'ngày', sentenceA: 'They deployed the microservice every day.', sentenceB: 'Consistency each day compounds over a year.' },
      { wordA: 'then', ipaA: '/ðen/', meaningViA: 'sau đó', wordB: 'den', ipaB: '/den/', meaningViB: 'phòng nhỏ', sentenceA: 'Record your voice, then compare the pitch contour.', sentenceB: 'He set up a quiet study den at home.' },
      { wordA: 'breathe', ipaA: '/briːð/', meaningViA: 'hít thở', wordB: 'breed', ipaB: '/briːd/', meaningViB: 'nuôi dưỡng', sentenceA: 'Pause and breathe between long clauses.', sentenceB: 'Shared ownership breeds engineering excellence.' },
    ],
  },
  {
    id: 'mp-r-l',
    phonemeA: 'r',
    phonemeB: 'l',
    title: '/r/ (right) vs /l/ (light)',
    learnerPainPointVi: 'Lẫn lộn vị trí đầu lưỡi chạm hay không chạm vòm miệng trong cụm phụ âm.',
    mouthContrastVi: 'Với /r/: Đầu lưỡi cong lên nhưng KHÔNG chạm vòm miệng, môi hơi chu. Với /l/: Đầu lưỡi chạm chắc vào gờ lợi ngay sau răng cửa trên.',
    pairs: [
      { wordA: 'right', ipaA: '/raɪt/', meaningViA: 'đúng đắn', wordB: 'light', ipaB: '/laɪt/', meaningViB: 'ánh sáng', sentenceA: 'Pick the right data structure for fast lookups.', sentenceB: 'Switch between Dark and Light mode seamlessly.' },
      { wordA: 'frame', ipaA: '/freɪm/', meaningViA: 'khung hình', wordB: 'flame', ipaB: '/fleɪm/', meaningViB: 'ngọn lửa', sentenceA: 'Every animation frame renders within 16 milliseconds.', sentenceB: 'Daily streaks keep your learning flame alive.' },
      { wordA: 'load', ipaA: '/ləʊd/', meaningViA: 'tải trọng', wordB: 'road', ipaB: '/rəʊd/', meaningViB: 'con đường', sentenceA: 'Keep cognitive load low during review sessions.', sentenceB: 'Immersion is the fastest road to natural fluency.' },
    ],
  },
  {
    id: 'mp-u-short-long',
    phonemeA: 'ʊ',
    phonemeB: 'uː',
    title: '/ʊ/ (pull) vs /uː/ (pool)',
    learnerPainPointVi: 'Chu môi quá dài cho âm ngắn /ʊ/ hoặc đọc lướt quá ngắn cho âm dài /uː/.',
    mouthContrastVi: 'Với /ʊ/: Môi chỉ hơi tròn, hàm thả lỏng, âm bật ngắn gọn. Với /uː/: Chu tròn môi nhỏ như thổi sáo và ngân dài rõ rệt.',
    pairs: [
      { wordA: 'pull', ipaA: '/pʊl/', meaningViA: 'kéo về (git pull)', wordB: 'pool', ipaB: '/puːl/', meaningViB: 'hồ bơi / nhóm tài nguyên', sentenceA: 'Pull the latest branch before starting work.', sentenceB: 'Tune the database connection pool size carefully.' },
      { wordA: 'full', ipaA: '/fʊl/', meaningViA: 'đầy đủ', wordB: 'fool', ipaB: '/fuːl/', meaningViB: 'đánh lừa', sentenceA: 'Run the full test suite before release.', sentenceB: 'Vanity metrics can fool engineering teams.' },
    ],
  },
  {
    id: 'mp-v-w',
    phonemeA: 'v',
    phonemeB: 'w',
    title: '/v/ (vest) vs /w/ (west)',
    learnerPainPointVi: 'Miền Nam Việt Nam hay đọc /v/ thành /j/ hoặc /w/, còn một số bạn lại đọc /w/ thành /v/.',
    mouthContrastVi: 'Với /v/: Răng cửa trên BẮT BUỘC chạm nhẹ lên môi dưới và rung. Với /w/: Hai môi chu tròn, tuyệt đối KHÔNG để răng chạm môi.',
    pairs: [
      { wordA: 'vest', ipaA: '/vest/', meaningViA: 'áo ghi-lê', wordB: 'west', ipaB: '/west/', meaningViB: 'hướng Tây', sentenceA: 'Wear a bright safety vest on site.', sentenceB: 'Deploy replicas in both US-East and US-West.' },
      { wordA: 'vine', ipaA: '/vaɪn/', meaningViA: 'dây leo', wordB: 'wine', ipaB: '/waɪn/', meaningViB: 'rượu vang', sentenceA: 'The ivy vine climbed up the stone wall.', sentenceB: 'They celebrated the launch with dinner and wine.' },
    ],
  },
  {
    id: 'mp-ch-sh',
    phonemeA: 'tʃ',
    phonemeB: 'ʃ',
    title: '/tʃ/ (cheap) vs /ʃ/ (sheep)',
    learnerPainPointVi: 'Đọc thiếu độ bật chặn hơi ở đầu âm /tʃ/, làm "cheap" và "watch" biến thành "sheep" và "wash".',
    mouthContrastVi: 'Với /tʃ/: Chặn luồng hơi bằng đầu lưỡi chạm lợi trên rồi bật nổ mạnh thành /ʃ/. Với /ʃ/: Không chặn hơi, thổi liên tục êm ái.',
    pairs: [
      { wordA: 'cheap', ipaA: '/tʃiːp/', meaningViA: 'rẻ tiền', wordB: 'sheep', ipaB: '/ʃiːp/', meaningViB: 'con cừu', sentenceA: 'On-device inference makes speech scoring cheap.', sentenceB: 'Count sheep if you struggle to fall asleep.' },
      { wordA: 'watch', ipaA: '/wɑːtʃ/', meaningViA: 'xem / đồng hồ', wordB: 'wash', ipaB: '/wɑːʃ/', meaningViB: 'rửa sạch', sentenceA: 'Watch native speakers in YouGlish clips.', sentenceB: 'Do not wash out glass contrast with neon tints.' },
    ],
  },
  {
    id: 'mp-cup-carp',
    phonemeA: 'ʌ',
    phonemeB: 'ɑː',
    title: '/ʌ/ (cut) vs /ɑː/ (cart)',
    learnerPainPointVi: 'Không phân biệt âm /ʌ/ ngắn gọn ở giữa miệng với âm /ɑː/ mở rộng họng ngân dài.',
    mouthContrastVi: 'Với /ʌ/: Miệng mở vừa, bật âm /ă/ ngắn dứt khoát. Với /ɑː/: Hạ hàm sâu tối đa như khi bác sĩ khám họng và ngân dài.',
    pairs: [
      { wordA: 'cut', ipaA: '/kʌt/', meaningViA: 'cắt giảm', wordB: 'cart', ipaB: '/kɑːrt/', meaningViB: 'xe đẩy hàng', sentenceA: 'Cut unnecessary boilerplate from the codebase.', sentenceB: 'Checkout latency affects shopping cart conversion.' },
      { wordA: 'duck', ipaA: '/dʌk/', meaningViA: 'con vịt', wordB: 'dark', ipaB: '/dɑːrk/', meaningViB: 'bóng tối / Dark mode', sentenceA: 'Explain bugs to a rubber duck to clarify thinking.', sentenceB: 'Dark mode uses a clean #0C0E14 canvas.' },
    ],
  },
  {
    id: 'mp-hot-hall',
    phonemeA: 'ɒ',
    phonemeB: 'ɔː',
    title: '/ɒ/ (cot) vs /ɔː/ (caught)',
    learnerPainPointVi: 'Đọc cả hai thành âm "o" ngắn giống nhau, mất sự ngân sâu của /ɔː/.',
    mouthContrastVi: 'Với /ɒ/: Mở tròn nhẹ, phát âm ngắn. Với /ɔː/: Chu môi tròn sâu hơn, hạ cuống lưỡi và kéo dài hơi.',
    pairs: [
      { wordA: 'cot', ipaA: '/kɒt/', meaningViA: 'giường gấp', wordB: 'caught', ipaB: '/kɔːt/', meaningViB: 'bị bắt / nắm được', sentenceA: 'He rested on a portable cot at the camp.', sentenceB: 'Strict TypeScript caught the bug before runtime.' },
      { wordA: 'not', ipaA: '/nɒt/', meaningViA: 'không', wordB: 'naught', ipaB: '/nɔːt/', meaningViB: 'con số không', sentenceA: 'Do not optimize prematurely without profiling.', sentenceB: 'All that effort came to naught without tests.' },
    ],
  },
  {
    id: 'mp-j-z',
    phonemeA: 'dʒ',
    phonemeB: 'z',
    title: '/dʒ/ (jet) vs /z/ (zip)',
    learnerPainPointVi: 'Đọc các từ như "page, edge, job" thiếu lực bật tắc–xát của /dʒ/.',
    mouthContrastVi: 'Với /dʒ/: Chu môi, chặn hơi bằng mặt lưỡi rồi bật mạnh kèm rung cổ họng. Với /z/: Khép nhẹ răng, rung thanh quản xì hơi qua kẽ răng.',
    pairs: [
      { wordA: 'jealous', ipaA: '/ˈdʒel.əs/', meaningViA: 'ghen tị', wordB: 'zealous', ipaB: '/ˈzel.əs/', meaningViB: 'nhiệt huyết sục sôi', sentenceA: 'Healthy teams celebrate wins instead of feeling jealous.', sentenceB: 'Zealous learners practice shadowing every morning.' },
      { wordA: 'ridge', ipaA: '/rɪdʒ/', meaningViA: 'đỉnh dãy núi', wordB: 'rise', ipaB: '/raɪz/', meaningViB: 'tăng lên', sentenceA: 'The trail climbs steeply along the mountain ridge.', sentenceB: 'Active vocabulary will rise steadily each week.' },
    ],
  },
];
