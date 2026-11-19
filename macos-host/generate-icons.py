#!/usr/bin/env python3
"""
Generate Minimal Specular Liquid Glass app icons for macOS (.icns) and iOS/PWA (.png).
Uses 4x supersampling with Pillow + macOS `iconutil` for crisp retina rendering.
"""
from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
MACOS_DIR = ROOT / "macos-host"
PUBLIC_DIR = ROOT / "public"
ICONSET_DIR = MACOS_DIR / "AppIcon.iconset"


def draw_icon(size: int, *, mac_squircle_inset: bool) -> Image.Image:
    scale = 4
    canvas = size * scale
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # macOS Big Sur / Tahoe icons sit on an ~824/1024 inset squircle with 100/1024 margin.
    # iOS/PWA icons are full-bleed square (OS applies its own mask).
    margin = round(canvas * 0.0976) if mac_squircle_inset else 0
    box = [margin, margin, canvas - margin - 1, canvas - margin - 1]
    inner_size = canvas - 2 * margin
    radius = round(inner_size * 0.225) if mac_squircle_inset else 0

    bg_color = (20, 23, 32, 255)        # #141720 Deep Slate Dark
    surface_color = (24, 28, 40, 255)   # #181C28 Elevated Specular Surface
    border_color = (255, 255, 255, 72)  # Crisp specular hairline
    fg_color = (243, 245, 249, 255)     # #F3F5F9
    cyan_color = (56, 189, 248, 255)    # #38BDF8

    if mac_squircle_inset:
        draw.rounded_rectangle(box, radius=radius, fill=bg_color, outline=border_color, width=max(4, round(inner_size * 0.018)))
        inner_pad = round(inner_size * 0.025)
        draw.rounded_rectangle(
            [box[0] + inner_pad, box[1] + inner_pad, box[2] - inner_pad, box[3] - inner_pad],
            radius=max(4, radius - inner_pad),
            fill=surface_color,
        )
    else:
        draw.rectangle(box, fill=surface_color)

    # Geometry inside active square — crisp "T" with generous separation before cyan dot
    cx = canvas / 2
    cy = canvas / 2
    mark_w = inner_size * 0.56
    stroke = max(6, round(inner_size * 0.072))
    r_cap = stroke / 2

    top_y = cy - mark_w * 0.36
    bot_y = cy + mark_w * 0.38
    left_x = cx - mark_w * 0.45
    right_x = cx + mark_w * 0.45
    foot_left = cx - mark_w * 0.20
    foot_right = cx + mark_w * 0.20

    def draw_capsule(x1: float, y1: float, x2: float, y2: float) -> None:
        draw.line([(x1, y1), (x2, y2)], fill=fg_color, width=stroke)
        for px, py in ((x1, y1), (x2, y2)):
            draw.ellipse([px - r_cap, py - r_cap, px + r_cap, py + r_cap], fill=fg_color)

    # Monogram "T"
    draw_capsule(left_x, top_y, right_x, top_y)
    draw_capsule(cx, top_y, cx, bot_y)
    draw_capsule(foot_left, bot_y, foot_right, bot_y)

    # Accent Sky Cyan dot cleanly separated from bottom foot
    dot_r = inner_size * 0.064
    dot_cx = cx + mark_w * 0.41
    dot_cy = bot_y - mark_w * 0.06
    draw.ellipse(
        [dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r],
        fill=cyan_color,
    )

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

    # iOS & PWA PNG icons
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    draw_icon(180, mac_squircle_inset=False).save(PUBLIC_DIR / "apple-touch-icon.png", "PNG")
    draw_icon(192, mac_squircle_inset=True).save(PUBLIC_DIR / "icon-192.png", "PNG")
    draw_icon(512, mac_squircle_inset=True).save(PUBLIC_DIR / "icon-512.png", "PNG")
    print(f"Generated {icns_path} and PNG icons in {PUBLIC_DIR}")


if __name__ == "__main__":
    main()
