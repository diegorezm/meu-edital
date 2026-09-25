"""Generate app artwork from the existing vector mark.

Requires: python -m pip install pillow svg.path
Run from the repository root: python scripts/generate-brand-assets.py
"""

from pathlib import Path
import re

from PIL import Image, ImageDraw, ImageFilter
from svg.path import parse_path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/expo.icon/Assets/expo-symbol 2.svg"
OUTPUT = ROOT / "assets/images"
TOP = (49, 159, 245)
BOTTOM = (12, 97, 210)
SPLASH_BLUE = (32, 138, 239)


def mark_points():
    source = SOURCE.read_text(encoding="utf-8")
    d = re.search(r'<path d="([^"]+)"', source).group(1)
    points = []
    for segment in parse_path(d):
        count = max(2, int(segment.length() / 2))
        points.extend(segment.point(i / count) for i in range(count))
    return points


POINTS = mark_points()


def mark_mask(size, width_ratio):
    scale = 4
    target = size * scale
    width = target * width_ratio
    height = width * 606 / 652
    left = (target - width) / 2
    top = (target - height) / 2
    polygon = [(left + p.real * width / 652, top + p.imag * height / 606) for p in POINTS]
    mask = Image.new("L", (target, target), 0)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)


def background(size):
    image = Image.new("RGB", (size, size))
    pixels = image.load()
    for y in range(size):
        for x in range(size):
            t = min(1, max(0, (x * 0.32 + y * 0.68) / (size - 1)))
            pixels[x, y] = tuple(round(a * (1 - t) + b * t) for a, b in zip(TOP, BOTTOM))
    return image.convert("RGBA")


def overlay_mark(image, mask, shadow=False):
    if shadow:
        shadow_layer = Image.new("RGBA", image.size, (4, 52, 122, 0))
        shadow_alpha = mask.filter(ImageFilter.GaussianBlur(image.width * 0.018)).point(lambda a: round(a * 0.30))
        shadow_layer.putalpha(shadow_alpha)
        image.alpha_composite(shadow_layer, (0, round(image.width * 0.012)))
    white = Image.new("RGBA", image.size, "white")
    white.putalpha(mask)
    image.alpha_composite(white)
    return image


def save(image, name):
    image.save(OUTPUT / name, optimize=True)


icon = overlay_mark(background(1024), mark_mask(1024, 0.65), shadow=True)
save(icon, "brand-icon.png")

adaptive_background = background(512)
save(adaptive_background, "brand-android-background.png")

adaptive_mask = mark_mask(512, 0.49)
foreground = Image.new("RGBA", (512, 512), (255, 255, 255, 0))
save(overlay_mark(foreground, adaptive_mask), "brand-android-foreground.png")
save(overlay_mark(Image.new("RGBA", (512, 512), (255, 255, 255, 0)), adaptive_mask), "brand-android-monochrome.png")

splash = Image.new("RGBA", (512, 512), (255, 255, 255, 0))
save(overlay_mark(splash, mark_mask(512, 0.84)), "brand-splash-icon.png")

favicon = overlay_mark(background(96), mark_mask(96, 0.72))
save(favicon, "brand-favicon.png")

# A quick visual guide to the icon, Android mask and launch screen.
preview = Image.new("RGB", (1200, 420), "#f5f7fb")
preview.paste(icon.resize((300, 300), Image.Resampling.LANCZOS), (60, 60))
circle = Image.new("L", (300, 300), 0)
ImageDraw.Draw(circle).ellipse((0, 0, 299, 299), fill=255)
adaptive = adaptive_background.copy()
adaptive.alpha_composite(foreground)
adaptive = adaptive.resize((300, 300), Image.Resampling.LANCZOS)
preview.paste(adaptive.convert("RGB"), (450, 60), circle)
screen = Image.new("RGBA", (300, 300), SPLASH_BLUE + (255,))
screen.alpha_composite(splash.resize((110, 110), Image.Resampling.LANCZOS), (95, 95))
preview.paste(screen.convert("RGB"), (840, 60))
preview.save(OUTPUT / "brand-preview.png", optimize=True)
