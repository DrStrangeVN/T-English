# T-English v2.0 — Siêu Ứng Dụng Học Tiếng Anh (iPhone & Mac)

Ứng dụng học tiếng Anh đa nền tảng chạy song song trên **macOS (AppKit + NSVisualEffectView + WKWebView)** và **iPhone (iOS Capacitor + PWA)**, tuân thủ thiết kế **Minimal Specular Liquid Glass (macOS Tahoe 26)**.

## Toàn Bộ Hệ Sinh Thái Tính Năng (v2.0)
1. **Command Center Dashboard**: KPI 4 cột chuẩn Geist 1px Structural Grid, **Heatmap 365 ngày**, Ma trận 6 kỹ năng CEFR, đồng hồ 1,000 giờ, Smart Daily Study Queue 25 phút, dự báo FSRS 14 ngày & Heatmap 44 âm vị IPA.
2. **CEFR Curriculum & Placement Test**: Bài kiểm tra xếp lớp 12 câu (`A1 → C2`) kèm cây 6 Unit Ngữ pháp–Giao tiếp (*Test-English + Babbel*), viết lại câu Transformation Drill & Quiz mở khóa.
3. **AI Phonetics, Minimal Pairs & Shadowing Studio**: Sơ đồ mặt cắt khoang miệng **SVG động (`VocalTractSVG`)**, luyện **12 cặp âm Minimal Pairs** kèm Ear Training Quiz, **Coach Shane Connected Speech Breakdown**, Pitch Contour $F_0$ & AB-Loop (`Space`, `R`, `L`).
4. **Real-Time AI Roleplay & Live Tutor**: 8 kịch bản thực chiến (*System Design, Daily Standup, IELTS Full 3-Part Mock, Pattern Drills*) kèm **3-Star Mission Checklist**, chế độ **Live Voice Call**, AI Long-Term Memory Ledger & **Explain My Mistake**.
5. **IELTS Writing & Ludwig Context Studio**: Chia đôi màn hình kiểu *Cambridge Write & Improve* — chấm điểm 4 tiêu chí IELTS (`Task Response, Coherence, Lexical, Grammar`), **In-Line Diff**, đối chiếu bài mẫu Band 6.5 vs 8.5 và bộ tìm kiếm ngữ cảnh **Ludwig.guru** (`*` / `vs`).
6. **FSRS v5, YouGlish & Membean Word Roots**: 24 thẻ đa tầng (*US / UK / AUS* YouGlish context), **12 gốc từ Hy Lạp/Latin (`WordRootGraph` 72 từ phái sinh)**, phím tắt `Space`/`1`/`2`/`3`/`4`, Batch Bar (`99px`) & xuất CSV chuẩn Anki.
7. **Engoo 5-Step Dual-Sub Reader**: Đọc báo theo quy trình 5 bước (*Key Vocabulary → Đọc & Nghe Song ngữ phím `A`/`S`/`D` → Comprehension Quiz → Thảo luận AI*), Popover tra từ `364px` & Grammar X-Ray.
8. **Monkeytype Qwerty & DailyDictation Lab**: 60 từ vựng 6 bộ đề, Zen Focus Mode, âm thanh phím cơ Web Audio API, sparkline WPM & nghe chép 8 bài nối âm.
9. **`⌘K` Command Palette, `364px` macOS Menu Bar Popover & Floating Mini-Dock**: Tích hợp tìm kiếm Ludwig ngay trong `⌘K`, đồng hồ Pomodoro `25:00` và Audio Loop nổi xuyên suốt.

## Cài đặt & Chạy trên Mac / iPhone

```bash
# Cài dependencies
npm install

# Chạy bản dev trên trình duyệt
npm run dev

# Chạy 16 unit tests (FSRS v5, IPA Scorer, AI Tutor, Writing Evaluator, Ludwig, CEFR)
npm run test

# Đóng gói & cài đặt T-English.app trực tiếp lên macOS
npm run build:macos

# Đồng bộ dự án iPhone (Capacitor iOS — yêu cầu máy có cài Xcode + CocoaPods)
npm run sync:ios
```
