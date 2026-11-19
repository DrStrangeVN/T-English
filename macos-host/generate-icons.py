#!/usr/bin/env python3
"""
Generate stylized "T-English" Minimal Specular Liquid Glass app icons
for macOS (.icns) and iOS/PWA (.png).
Features a stylized "T" + 3-bar Sky Cyan speech-wave "E" emblem and "ENGLISH" pill badge.
"""
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
MACOS_DIR = ROOT / "macos-host"
PUBLIC_DIR = ROOT / "public"
ICONSET_DIR = MACOS_DIR / "AppIcon.iconset"


def load_bold_font(px: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates: list[tuple[str, int]] = [
        ("/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf", 0),
        ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 0),
        ("/System/Library/Fonts/Avenir Next.ttc", 2),
        ("/System/Library/Fonts/HelveticaNeue.ttc", 1),
        ("/System/Library/Fonts/SFNSRounded.ttf", 0),
    ]
    for path_str, index in candidates:
        p = Path(path_str)
        if p.exists():
            try:
                return ImageFont.truetype(str(p), px, index=index)
            except OSError:
                continue
    return ImageFont.load_default()


def draw_icon(size: int, *, mac_squircle_inset: bool) -> Image.Image:
    scale = 4
    canvas = size * scale
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = round(canvas * 0.0976) if mac_squircle_inset else 0
    box = [margin, margin, canvas - margin - 1, canvas - margin - 1]
    inner = canvas - 2 * margin
    radius = round(inner * 0.225) if mac_squircle_inset else 0

    bg_color = (18, 21, 30, 255)         # #12151E Outer Rim
    surface_color = (24, 29, 42, 255)    # #181D2A Elevated Specular Glass
    pill_color = (30, 37, 54, 255)       # #1E2536 Badge Fill
    border_color = (255, 255, 255, 82)   # Crisp specular hairline
    cyan_border = (56, 189, 248, 160)    # Sky Cyan pill border
    fg_color = (244, 247, 252, 255)      # #F4F7FC Crisp White
    cyan_color = (56, 189, 248, 255)     # #38BDF8 Sky Cyan
    cyan_soft = (224, 242, 254, 255)     # #E0F2FE Text

    if mac_squircle_inset:
        draw.rounded_rectangle(
            box,
            radius=radius,
            fill=bg_color,
            outline=border_color,
            width=max(4, round(inner * 0.018)),
        )
        pad = round(inner * 0.024)
        draw.rounded_rectangle(
            [box[0] + pad, box[1] + pad, box[2] - pad, box[3] - pad],
            radius=max(4, radius - pad),
            fill=surface_color,
        )
    else:
        draw.rectangle(box, fill=surface_color)

    cx = canvas / 2
    cy = canvas / 2
    show_wordmark = size >= 64

    emblem_cy = cy - inner * (0.095 if show_wordmark else 0.0)
    stroke = max(6, round(inner * 0.066))
    r_cap = stroke / 2

    def draw_capsule(
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        color: tuple[int, int, int, int],
        w: int = stroke,
    ) -> None:
        r = w / 2
        draw.line([(x1, y1), (x2, y2)], fill=color, width=w)
        for px, py in ((x1, y1), (x2, y2)):
            draw.ellipse([px - r, py - r, px + r, py + r], fill=color)

    # Balanced composition:
    # Left/Top: Stylized T (symmetric top bar + stem + compact base foot)
    # Right (nestled cleanly under right wing of T with clear gap): 3 Sky Cyan speech-wave bars forming "E"
    t_stem_x = cx - inner * 0.145
    t_left = t_stem_x - inner * 0.145
    t_right = cx + inner * 0.145
    t_top_y = emblem_cy - inner * 0.165
    t_bot_y = emblem_cy + inner * 0.175

    # Clean stylized "T" with subtle serif foot and Sky Cyan speech-spark dot at top-right
    draw_capsule(t_left, t_top_y, t_right, t_top_y, fg_color)
    draw_capsule(t_stem_x, t_top_y, t_stem_x, t_bot_y, fg_color)
    draw_capsule(t_stem_x - inner * 0.070, t_bot_y, t_stem_x + inner * 0.070, t_bot_y, fg_color)

    # Clear horizontal gap between T foot right edge (-0.145 + 0.070 + 0.033 = -0.042)
    # and E left edge (e_x0 - 0.030 = +0.025)
    e_stroke = max(5, round(inner * 0.058))
    e_x0 = cx + inner * 0.055
    e_top_y = emblem_cy - inner * 0.030
    e_mid_y = emblem_cy + inner * 0.072
    e_bot_y = t_bot_y
    draw_capsule(e_x0, e_top_y, e_x0 + inner * 0.215, e_top_y, cyan_color, e_stroke)
    draw_capsule(e_x0, e_mid_y, e_x0 + inner * 0.155, e_mid_y, cyan_color, e_stroke)
    draw_capsule(e_x0, e_bot_y, e_x0 + inner * 0.235, e_bot_y, cyan_color, e_stroke)

    # Top-right accent dot aligned to the right edge of E
    dot_r = inner * 0.038
    dot_x = e_x0 + inner * 0.205
    dot_y = t_top_y
    draw.ellipse([dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r], fill=cyan_color)

    # Crisp "ENGLISH" capsule badge below emblem
    if show_wordmark:
        pill_w = inner * 0.64
        pill_h = inner * 0.175
        pill_cx = cx
        pill_cy = box[1] + inner * 0.775
        pill_rect = [
            pill_cx - pill_w / 2,
            pill_cy - pill_h / 2,
            pill_cx + pill_w / 2,
            pill_cy + pill_h / 2,
        ]
        draw.rounded_rectangle(
            pill_rect,
            radius=pill_h / 2,
            fill=pill_color,
            outline=cyan_border,
            width=max(3, round(inner * 0.012)),
        )

        font_px = max(16, round(inner * 0.092))
        font = load_bold_font(font_px)
        letters = list("ENGLISH")
        tracking = inner * 0.020
        widths = []
        for ch in letters:
            bb = draw.textbbox((0, 0), ch, font=font)
            widths.append(bb[2] - bb[0])
        total_w = sum(widths) + tracking * (len(letters) - 1)
        cur_x = pill_cx - total_w / 2
        for ch, w_ch in zip(letters, widths):
            draw.text((cur_x + w_ch / 2, pill_cy + inner * 0.004), ch, font=font, fill=cyan_soft, anchor="mm")
            cur_x += w_ch + tracking

    return img.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    if ICONSET_DIR.exists():
        shutil.rmtree(ICONSET_DIR)
    ICONSET_DIR.mkdir(parents=True, exist_ok=True)

    mac_specs = [
        ("icon_16x16.png", 16),
        ("icon_16x16@2x.png", 32),
        ("icon_32x32.png", 32),
        ("icon_32x32@2x.png", 64),
        ("icon_128x128.png", 128),
        ("icon_128x128@2x.png", 256),
        ("icon_256x256.png", 256),
        ("icon_256x256@2x.png", 512),
        ("icon_512x512.png", 512),
        ("icon_512x512@2x.png", 1024),
    ]
    for filename, px in mac_specs:
        draw_icon(px, mac_squircle_inset=True).save(ICONSET_DIR / filename, "PNG")

    icns_path = MACOS_DIR / "AppIcon.icns"
    subprocess.run(["iconutil", "-c", "icns", str(ICONSET_DIR), "-o", str(icns_path)], check=True)
    shutil.rmtree(ICONSET_DIR)

    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    draw_icon(180, mac_squircle_inset=False).save(PUBLIC_DIR / "apple-touch-icon.png", "PNG")
    draw_icon(192, mac_squircle_inset=True).save(PUBLIC_DIR / "icon-192.png", "PNG")
    draw_icon(512, mac_squircle_inset=True).save(PUBLIC_DIR / "icon-512.png", "PNG")
    print(f"Generated {icns_path} and PNG icons in {PUBLIC_DIR}")


if __name__ == "__main__":
    main()
