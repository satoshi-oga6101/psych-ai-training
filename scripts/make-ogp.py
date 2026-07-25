#!/usr/bin/env python3
"""make-ogp.py — SNS共有カード（docs/assets/ogp.png）を作り直す。

    python3 scripts/make-ogp.py

サイトのビルドとは無関係の補助スクリプト。画像の文言や色を変えたいときだけ使う。
Pillow が要る（`pip3 install Pillow`）。macOS のヒラギノ角ゴシックを使うため
mac 以外では FONT_DIR を差し替えること。

方針:
  - 演習数などの数字は入れない（増減のたびに作り直しになるため）
  - URLは入れない（サムネイルで潰れて読めず、SNS側がドメインを自動表示する）
  - 背景はダークグリーン #467010（臨床催眠本の表紙色）。サイトのアクセント（紺）とは
    別だが、カードとサイトが同時に視界に入らないため問題にならない。むしろ白と青系が
    多いSNSのタイムラインでは緑の方が目に留まる。
  - 画像を差し替えるときは、各SNSのキャッシュが残るのでファイル名を変え、
    index.html の og:image も合わせて直す。
"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630          # OGPの標準サイズ（1.91:1）
PAD = 86                  # 端は切られることがあるので内側に余白を取る
BG = (70, 112, 16)        # #467010
FG = (255, 255, 255)
SUB_FG = (240, 246, 232)

FONT_DIR = "/System/Library/Fonts"
OUT = os.path.join(os.path.dirname(__file__), "..", "docs", "assets", "ogp.png")

HEADLINE = "AI心理面接演習教材サイト"
EYEBROW = "大学院生・心理臨床の学習者へ"
SUB = "生成AIを「演習の実行環境」として使うプロンプト教材"
AUTHOR = "緒賀 郷志"


def font(weight, size):
    return ImageFont.truetype(f"{FONT_DIR}/ヒラギノ角ゴシック W{weight}.ttc", size)


def text_w(draw, s, f, spacing=0):
    if spacing == 0:
        return draw.textlength(s, font=f)
    return sum(draw.textlength(c, font=f) for c in s) + spacing * (len(s) - 1)


def draw_ls(draw, xy, s, f, fill, spacing=0):
    """字間（letter-spacing）付きで描く"""
    x, y = xy
    for c in s:
        draw.text((x, y), c, font=f, fill=fill)
        x += draw.textlength(c, font=f) + spacing


def fit_size(draw, s, weight, start, max_w, spacing=0):
    """max_w に収まる最大サイズを探す（文言を変えてもはみ出さないように）"""
    size = start
    while size > 10 and text_w(draw, s, font(weight, size), spacing) > max_w:
        size -= 2
    return size


def main():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    usable = W - PAD * 2

    h_size = fit_size(d, HEADLINE, 6, 96, usable)
    e_size = fit_size(d, EYEBROW, 3, 30, usable, spacing=5.4)
    f_head, f_eye = font(6, h_size), font(3, e_size)
    f_sub, f_auth = font(3, 33), font(5, 34)

    y = 150
    draw_ls(d, (PAD, y), EYEBROW, f_eye, FG, spacing=5.4)
    y += 62
    d.text((PAD, y), HEADLINE, font=f_head, fill=FG)
    y += h_size + 44
    d.rectangle([PAD, y, PAD + 96, y + 5], fill=FG)
    y += 34
    d.text((PAD, y), SUB, font=f_sub, fill=SUB_FG)

    # 著者名は右詰め
    d.text((W - PAD - text_w(d, AUTHOR, f_auth), H - 92), AUTHOR, font=f_auth, fill=FG)

    out = os.path.normpath(OUT)
    img.save(out, "PNG", optimize=True)
    print(f"✓ {out} ({W}x{H}, {os.path.getsize(out) // 1024}KB)")


if __name__ == "__main__":
    main()
