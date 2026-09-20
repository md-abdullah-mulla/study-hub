#!/usr/bin/env python3
"""
App icon generator (one-time / on demand).

The app version (PWA) and the desktop app both need real PNG icons. Instead of
hand-drawing them in a graphics program, the mark is drawn here from simple
geometry, so the icons can always be regenerated at any size and stay exactly in
the brand colours (brand-700 → brand-500, the same gradient as the sidebar logo).

Run:  python3 tools/make-icons.py
Out:  client/public/icons/*.png   +   client/public/favicon.ico
"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, '..', 'client', 'public', 'icons')

# brand palette (client/tailwind.config.js)
BRAND_700 = (29, 68, 184)    # #1d44b8
BRAND_600 = (37, 84, 224)    # #2554e0
BRAND_500 = (59, 108, 246)   # #3b6cf6
WHITE = (255, 255, 255)

SS = 4  # supersampling factor: draw big, then shrink for smooth edges


def gradient(size):
    """Diagonal gradient from brand-700 (top-left) to brand-500 (bottom-right)."""
    img = Image.new('RGB', (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            if t < 0.5:  # first half: 700 → 600
                k = t * 2
                a, b = BRAND_700, BRAND_600
            else:        # second half: 600 → 500
                k = (t - 0.5) * 2
                a, b = BRAND_600, BRAND_500
            px[x, y] = (
                round(a[0] + (b[0] - a[0]) * k),
                round(a[1] + (b[1] - a[1]) * k),
                round(a[2] + (b[2] - a[2]) * k),
            )
    return img


def rounded_mask(size, radius_ratio=0.225):
    """Rounded-square mask (the shape Android/Chrome show for an app icon)."""
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    r = int(size * radius_ratio)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=r, fill=255)
    return mask


def draw_cap(img, size, scale=1.0):
    """
    The mark: a graduation cap (mortarboard) + a rising bar chart underneath —
    'study' plus 'progress', which is what the app is about.
    """
    draw = ImageDraw.Draw(img)
    cx = size / 2
    # everything is designed on a 1024 grid, then scaled
    u = (size / 1024.0) * scale

    def X(v):
        return cx + (v - 512) * u

    def Y(v, shift=0):
        return (v - 512) * u + size / 2 + shift * u

    # --- mortarboard (a rhombus seen at an angle) --------------------------
    # drawn first so the head and the bars below stay clearly separated
    board = [(X(512), Y(132)), (X(824), Y(352)), (X(512), Y(572)), (X(200), Y(352))]
    draw.polygon(board, fill=WHITE)

    # --- cap body (the part that sits on the head) -------------------------
    body = [X(356), Y(340), X(668), Y(566)]
    draw.pieslice(body, start=0, end=180, fill=WHITE)

    # --- tassel ------------------------------------------------------------
    draw.line([(X(824), Y(352)), (X(824), Y(500))], fill=WHITE, width=max(2, int(22 * u)))
    r = 26 * u
    draw.ellipse((X(824) - r, Y(534) - r, X(824) + r, Y(534) + r), fill=WHITE)

    # --- rising bars (progress) -------------------------------------------
    # kept short and low so even a 16px favicon still reads as 'cap + bars'
    for bx, top in ((384, 706), (512, 664), (640, 612)):
        draw.rounded_rectangle(
            (X(bx) - 44 * u, Y(top), X(bx) + 44 * u, Y(872)),
            radius=26 * u,
            fill=WHITE,
        )


def make_icon(size, rounded=True, mark_scale=1.0, opaque_bg=False):
    big = size * SS
    bg = gradient(big)
    if rounded and not opaque_bg:
        bg = bg.convert('RGBA')
        bg.putalpha(rounded_mask(big))
    else:
        bg = bg.convert('RGBA')
    draw_cap(bg, big, scale=mark_scale)
    return bg.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    targets = [
        # file name, size, rounded, mark scale, opaque background
        ('icon-192.png', 192, True, 1.0, False),
        ('icon-512.png', 512, True, 1.0, False),
        # maskable: Android crops to a circle/squircle, so the mark sits inside
        # the inner 80% safe zone and the gradient bleeds to the edges
        ('icon-maskable-192.png', 192, False, 0.78, True),
        ('icon-maskable-512.png', 512, False, 0.78, True),
        # iOS ignores transparency and applies its own rounding
        ('apple-touch-icon.png', 180, False, 0.86, True),
        ('icon-1024.png', 1024, True, 1.0, False),
        # small browser favicon
        ('favicon-32.png', 32, True, 1.0, False),
        ('favicon-16.png', 16, True, 1.0, False),
    ]

    for name, size, rounded, scale, opaque in targets:
        icon = make_icon(size, rounded=rounded, mark_scale=scale, opaque_bg=opaque)
        icon.save(os.path.join(OUT_DIR, name))
        print(f'wrote icons/{name}  ({size}×{size})')

    # multi-size .ico for old browsers / Windows shortcuts
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    base = make_icon(256, rounded=True, mark_scale=1.0)
    base.save(
        os.path.join(HERE, '..', 'client', 'public', 'favicon.ico'),
        sizes=ico_sizes,
    )
    print('wrote favicon.ico  (16→256)')


if __name__ == '__main__':
    main()
