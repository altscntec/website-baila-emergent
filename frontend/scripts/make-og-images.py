#!/usr/bin/env python3
"""
Generate the 1200x630 link-preview ("Open Graph") cards used when a Baila
Dembow URL is shared on WhatsApp / Facebook / iMessage / LinkedIn / X.

Why this exists: link scrapers don't run JavaScript, so they only see the
og:image baked into the HTML. A raw event poster is the wrong shape (portrait,
and 2MB+ — WhatsApp often skips images over ~300KB). These cards are 1.91:1,
~100-150KB JPEGs, committed under public/images/og/.

Usage (needs Pillow):  python3 scripts/make-og-images.py

  og-default.jpg    evergreen brand card (site hero + logo). Never goes stale.
  og-halloween.jpg  Halloween 2026 card.

To make a card for the next flagship event: add a make_event_card(...) call
at the bottom, drop the file in public/images/og/, then set `og_image` on that
event in src/utils/constants.js. The homepage + /events pick up the soonest
upcoming featured event's og_image automatically (see routeSeo in App.js) and
fall back to og-default.jpg once nothing is upcoming.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent / "public"
OUT = ROOT / "images" / "og"
W, H = 1200, 630
IMPACT = "/System/Library/Fonts/Supplemental/Impact.ttf"
ARIAL_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"


def cover(im, w, h):
    """Scale to fill w x h, centre-crop."""
    s = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def paste_logo(canvas, height, xy, anchor="la"):
    logo = Image.open(ROOT / "images/branding/baila-logo-white.png").convert("RGBA")
    logo = logo.resize((round(logo.width * height / logo.height), height), Image.LANCZOS)
    x, y = xy
    if anchor == "ma":  # horizontally centred
        x -= logo.width // 2
    canvas.alpha_composite(logo, (x, y))


def save_jpeg(canvas, name):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    canvas.convert("RGB").save(path, "JPEG", quality=82, optimize=True, progressive=True)
    print(f"{name}: {path.stat().st_size // 1024} KB")


def make_default_card():
    hero = Image.open(ROOT / "images/world/barrio-hero-real.jpg").convert("RGB")
    canvas = cover(hero, W, H).convert("RGBA")
    # darken the top so the logo reads, same idea as the live hero gradient
    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(shade)
    for y in range(H):
        a = int(150 * max(0, 1 - y / (H * 0.55)))
        d.line([(0, y), (W, y)], fill=(0, 0, 0, a))
    canvas.alpha_composite(shade)
    paste_logo(canvas, 215, (W // 2, 18), anchor="ma")
    save_jpeg(canvas, "og-default.jpg")


def make_event_card(poster_path, out_name, kicker, title_lines, sub, pill, accent=(255, 107, 0)):
    poster = Image.open(poster_path).convert("RGB")
    # blurred, darkened poster as the backdrop
    bg = cover(poster, W, H).filter(ImageFilter.GaussianBlur(26))
    canvas = Image.alpha_composite(bg.convert("RGBA"), Image.new("RGBA", (W, H), (8, 6, 11, 175)))
    # left-to-right fade so the text column is clean
    fade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(fade)
    for x in range(W):
        d.line([(x, 0), (x, H)], fill=(8, 6, 11, int(120 * max(0, 1 - x / (W * 0.62)))))
    canvas.alpha_composite(fade)

    # sharp poster on the right, rounded with a soft shadow + light border
    ph = 570
    pw = round(poster.width * ph / poster.height)
    p = poster.resize((pw, ph), Image.LANCZOS).convert("RGBA")
    mask = Image.new("L", (pw, ph), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, pw - 1, ph - 1), 18, fill=255)
    px, py = W - pw - 70, (H - ph) // 2
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((px, py + 10, px + pw, py + ph + 10), 18, fill=(0, 0, 0, 200))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    p.putalpha(mask)
    canvas.alpha_composite(p, (px, py))
    ImageDraw.Draw(canvas).rounded_rectangle((px, py, px + pw - 1, py + ph - 1), 18, outline=(255, 255, 255, 90), width=3)

    d = ImageDraw.Draw(canvas)
    x = 64
    d.text((x, 58), kicker, font=ImageFont.truetype(ARIAL_BLACK, 27), fill=accent)
    title_font = ImageFont.truetype(IMPACT, 112)
    y = 104
    for line in title_lines:
        d.text((x, y), line, font=title_font, fill=(255, 255, 255))
        y += 108
    d.text((x, y + 10), sub, font=ImageFont.truetype(ARIAL_BLACK, 22), fill=(235, 235, 235))
    # call-to-action pill
    pf = ImageFont.truetype(ARIAL_BLACK, 26)
    tw = d.textlength(pill, font=pf)
    pill_y = y + 62
    d.rounded_rectangle((x, pill_y, x + tw + 56, pill_y + 58), 29, fill=accent)
    d.text((x + 28, pill_y + 13), pill, font=pf, fill=(0, 0, 0))
    paste_logo(canvas, 74, (x - 4, H - 98))
    save_jpeg(canvas, out_name)


if __name__ == "__main__":
    make_default_card()
    make_event_card(
        ROOT / "images/events/halloween-ijland-oct31-2026.png",
        "og-halloween.jpg",
        kicker="SAT 31 OCTOBER 2026",
        title_lines=["THE LATIN", "HALLOWEEN"],
        sub="IJLAND AMSTERDAM  ·  23:00 - 05:00  ·  18+",
        pill="TICKETS ON SALE NOW",
    )
    make_event_card(
        ROOT / "images/events/rotterdam-reverse-muertos-nov7-2026.png",
        "og-muertos-rotterdam.jpg",
        kicker="SAT 7 NOVEMBER 2026",
        title_lines=["DÍA DE", "MUERTOS"],
        sub="REVERSE ROTTERDAM  ·  23:00 - 05:00  ·  18+",
        pill="TICKETS ON SALE NOW",
        accent=(60, 220, 120),
    )
