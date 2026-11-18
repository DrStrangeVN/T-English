# T-English — Siêu Ứng Dụng Học Tiếng Anh (iPhone & Mac)

Ứng dụng học tiếng Anh đa nền tảng chạy song song trên **macOS (AppKit + NSVisualEffectView + WKWebView)** và **iPhone (iOS Capacitor + PWA)**, tuân thủ thiết kế **Minimal Specular Liquid Glass (macOS Tahoe 26)**.

## Tính năng Cốt lõi (Hợp nhất tinh hoa từ 8 app thương mại & 6 repo mã nguồn mở)
1. **Command Center Dashboard**: KPI 4 cột chuẩn Geist 1px Structural Grid, đồng hồ tích lũy 1,000 giờ, Smart Daily Study Queue 25 phút, dự báo tải lượng FSRS 14 ngày & Ma trận 44 âm vị IPA kèm hướng dẫn khẩu hình tiếng Việt.
2. **AI Phonetics & Shadowing Studio**: Chấm điểm phát âm từng âm vị IPA, biểu đồ đường cao độ giọng nói (Pitch Contour F0), sóng âm AB-Loop (`Space`, `R`, `L`) và mẹo nối âm.
3. **Real-Time AI Roleplay & Live Tutor**: 3 chế độ (Pattern Drills, Roleplay IT/IELTS Part 2 có đồng hồ đếm ngược, Free Talk) kèm **AI Long-Term Memory Ledger**, sửa lỗi trực tiếp, nâng cấp câu lên mức C1/Native và nút **Explain My Mistake**.
4. **FSRS v5 Smart Flashcards & Sentence Miner**: Thuật toán lặp lại ngắt quãng FSRS v5 (Stability $S$, Difficulty $D$, Retrievability $R$), thẻ Cloze đa tầng, thanh **Batch Bar** nổi (`99px`) và xuất CSV chuẩn Anki.
5. **Immersive Reader & Dual-Sub Media Studio**: Đọc bài/xem transcript song ngữ tương tác từng từ, **Popover tra từ kính mờ 364px**, 5 mức độ thuộc từ LingQ và **AI Syntax & Grammar X-Ray**.
6. **Qwerty Dictation & Muscle-Memory Lab**: Gõ từ vựng tốc độ cao (sai tự động reset từ) & nghe chép chính tả IELTS/TED tính WPM và Accuracy.
7. **`⌘K` Command Palette & macOS Menu Bar Popover (364px)**: Tra từ nhanh, ôn thẻ FSRS ngay trên thanh Menu Bar macOS và chuyển đổi tức thì khung xem **Mac / iPhone 390×844 / 364px**.

## Cài đặt & Chạy trên Mac / iPhone

```bash
# Cài dependencies
npm install

# Chạy bản dev trên trình duyệt
npm run dev

# Chạy kiểm thử tự động (FSRS v5, IPA Scorer, AI Tutor)
npm run test

# Đóng gói & cài đặt T-English.app trực tiếp lên macOS
npm run build:macos

# Đồng bộ dự án iPhone (Capacitor iOS — yêu cầu máy có cài Xcode để mở Simulator/iPhone)
npm run sync:ios
```
