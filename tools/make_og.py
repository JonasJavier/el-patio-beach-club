"""Genera og-image.jpg (1200x630), los íconos PNG y favicon.ico.

La imagen OG es lo que se ve al compartir el enlace por WhatsApp: el atardecer
real sobre la bahía de Bayahíbe, el logo redibujado y el titular.
Necesita source/logo-claro-900.png (el logo claro renderizado desde el SVG).
Uso:  python tools/make_og.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "source" / "fonts"
IMG = ROOT / "assets" / "img"
MAR = (10, 46, 59)
NARANJA = (240, 138, 50)
SOL = (245, 166, 35)
BLANCO = (255, 255, 255)
SS = 2


def fuente(nombre, tam, peso=None):
    f = ImageFont.truetype(str(FONTS / nombre), tam)
    if peso:
        try:
            f.set_variation_by_axes([peso])
        except Exception:
            pass
    return f


def og():
    W, H = 1200 * SS, 630 * SS
    foto = Image.open(ROOT / "source" / "instagram" / "atardecer-bahia.webp").convert("RGB")
    foto = ImageOps.fit(foto, (W, H), centering=(0.5, 0.42))
    base = foto.convert("RGBA")
    velo = Image.new("RGBA", (W, H))
    dv = ImageDraw.Draw(velo)
    for y in range(H):
        t = y / H
        a = int(30 + 215 * max(0, (t - 0.38) / 0.62) ** 0.8)
        dv.line([(0, y), (W, y)], fill=MAR + (min(a, 238),))
    base = Image.alpha_composite(base, velo)
    from PIL import ImageFilter
    halo = Image.new("RGBA", (W, H))
    ImageDraw.Draw(halo).ellipse((-120 * SS, -140 * SS, 620 * SS, 330 * SS), fill=MAR + (200,))
    halo = halo.filter(ImageFilter.GaussianBlur(70 * SS))
    base = Image.alpha_composite(base, halo)
    logo = Image.open(ROOT / "source" / "logo-claro-900.png").convert("RGBA")
    lw = 380 * SS
    logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
    base.alpha_composite(logo, (70 * SS, 52 * SS))
    d = ImageDraw.Draw(base)
    titulo = fuente("Gloock-Regular.ttf", 64 * SS)
    d.text((72 * SS, 360 * SS), "El atardecer de Bayahíbe", font=titulo, fill=BLANCO)
    d.text((72 * SS, 434 * SS), "se ve desde tu mesa.", font=titulo, fill=(255, 205, 120))
    sub = fuente("HankenGrotesk[wght].ttf", 28 * SS, 600)
    d.text((74 * SS, 536 * SS), "Restaurante y lounge en la playa · C. La Bahía 17, Bayahíbe", font=sub, fill=(232, 241, 242))
    final = base.convert("RGB").resize((1200, 630), Image.LANCZOS)
    final.save(IMG / "og-image.jpg", "JPEG", quality=84, optimize=True, progressive=True)
    print("og-image.jpg listo")


def icono(tam, margen=0.0, redondeo=True):
    S = tam * 4
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if redondeo:
        d.rounded_rectangle((0, 0, S - 1, S - 1), radius=round(S * 0.22), fill=MAR)
    else:
        d.rectangle((0, 0, S, S), fill=MAR)
    k = (S - 2 * S * margen) / 64
    o = S * margen

    def p(x, y):
        return (o + x * k, o + y * k)

    r = 10 * k
    cx, cy = p(40, 22)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=SOL)
    d.polygon([p(16, 46), p(24, 38), p(32, 26), p(38, 12), p(40, 26), p(39, 38), p(34, 46)], fill=BLANCO)
    d.line([p(8, 50), p(18, 45), p(27, 52), p(36, 48), p(46, 45), p(56, 50)], fill=(26, 166, 196), width=round(5 * k), joint="curve")
    return im.resize((tam, tam), Image.LANCZOS)


def iconos():
    icono(180, redondeo=False).convert("RGB").save(IMG / "apple-touch-icon.png", optimize=True)
    icono(192).save(IMG / "icon-192.png", optimize=True)
    icono(512).save(IMG / "icon-512.png", optimize=True)
    icono(512, margen=0.12, redondeo=False).save(IMG / "icon-maskable-512.png", optimize=True)
    icono(32).save(IMG / "favicon-32.png", optimize=True)
    Image.open(IMG / "icon-512.png").convert("RGBA").save(IMG / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("íconos listos")


if __name__ == "__main__":
    og()
    iconos()
