"""Redibuja el logo de El Patio Beach Club en SVG.

"El patio" se convierte a curvas desde Pacifico y "Beach Club" desde Courgette
(ambas SIL OFL, muy parecidas a las letras del logo original). El sol, la vela
y la ola se dibujan a mano. El SVG no depende de ninguna fuente instalada.

Uso:  python tools/make_logo.py
Genera assets/img/logo.svg, logo-claro.svg, favicon.svg y source/logo-paths.json
"""
import json
import re
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "source" / "fonts"
OUT = ROOT / "assets" / "img"

AZUL = "#0C7DAD"      # «El patio» del logo
NARANJA = "#E9743A"   # «Beach Club»
SOL = "#F5A623"
AGUA = "#1AA6C4"


def texto_a_path(fuente, texto, size, x, y):
    """Devuelve (path, ancho, caja) del texto con la línea base en y."""
    font = TTFont(FONTS / fuente)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    s = size / font["head"].unitsPerEm
    hmtx = font["hmtx"]
    pen = SVGPathPen(gs)
    bpen = BoundsPen(gs)
    cursor = 0
    for ch in texto:
        g = cmap[ord(ch)]
        t = (s, 0, 0, -s, x + cursor * s, y)
        gs[g].draw(TransformPen(pen, t))
        gs[g].draw(TransformPen(bpen, t))
        cursor += hmtx[g][0]
    d = re.sub(r"-?\d+\.\d+", lambda m: f"{float(m.group()):.1f}".rstrip("0").rstrip("."), pen.getCommands())
    return d, cursor * s, bpen.bounds


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    patio, w_patio, caja_p = texto_a_path("Pacifico-Regular.ttf", "El patio", 100, 0, 100)
    fin = caja_p[2]
    # Ícono: sol detrás de una vela que sale de la ola
    ix = fin + 6
    sol = f"M{ix + 62:.1f} 30a24 24 0 1 1-48 0a24 24 0 1 1 48 0Z"
    vela = (f"M{ix:.1f} 104C{ix + 22:.1f} 86 {ix + 46:.1f} 52 {ix + 66:.1f} 6"
            f"C{ix + 72:.1f} 40 {ix + 68:.1f} 78 {ix + 54:.1f} 104Z")
    linea_vela = f"M{ix + 14:.1f} 98C{ix + 32:.1f} 76 {ix + 50:.1f} 46 {ix + 62:.1f} 20"
    ola = (f"M120 128C190 104 250 140 320 118S{ix + 20:.1f} 96 {ix + 96:.1f} 122")
    beach, w_beach, caja_b = texto_a_path("Courgette-Regular.ttf", "Beach Club", 54, 0, 0)
    bx = ix + 96 - w_beach
    beach, _, caja_b = texto_a_path("Courgette-Regular.ttf", "Beach Club", 54, bx, 182)
    ancho = ix + 104
    vb = f"-6 -2 {ancho + 12:.0f} 200"

    def svg(color_texto, titulo=True):
        t = "<title>El Patio Beach Club</title>" if titulo else ""
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="El Patio Beach Club">{t}'
            f'<defs><linearGradient id="o" x1="0" x2="1"><stop offset="0" stop-color="{AGUA}"/><stop offset=".7" stop-color="{AZUL}"/><stop offset="1" stop-color="{SOL}"/></linearGradient></defs>'
            f'<path d="{sol}" fill="{SOL}"/>'
            f'<path d="{vela}" fill="{AZUL}"/><path d="{linea_vela}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>'
            f'<path d="{ola}" fill="none" stroke="url(#o)" stroke-width="9" stroke-linecap="round"/>'
            f'<path d="{patio}" fill="{color_texto}"/>'
            f'<path d="{beach}" fill="{NARANJA}"/></svg>\n'
        )

    (OUT / "logo.svg").write_text(svg(AZUL), encoding="utf-8")
    (OUT / "logo-claro.svg").write_text(svg("#FFFFFF"), encoding="utf-8")
    fav = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        '<rect width="64" height="64" rx="14" fill="#0A2E3B"/>'
        f'<circle cx="40" cy="22" r="10" fill="{SOL}"/>'
        f'<path d="M16 46C24 38 32 26 38 12C41 26 40 38 34 46Z" fill="#fff"/>'
        f'<path d="M8 50C18 44 26 54 36 48S50 44 56 50" fill="none" stroke="{AGUA}" stroke-width="5" stroke-linecap="round"/>'
        '</svg>\n'
    )
    (OUT / "favicon.svg").write_text(fav, encoding="utf-8")
    datos = {"viewBox": vb, "patio": patio, "beach": beach, "sol": sol, "vela": vela, "lineaVela": linea_vela,
             "ola": ola, "colores": {"azul": AZUL, "naranja": NARANJA, "sol": SOL, "agua": AGUA}}
    (ROOT / "source" / "logo-paths.json").write_text(json.dumps(datos), encoding="utf-8")
    print("Logo listo:", OUT / "logo.svg", f"ancho {ancho:.0f}")


if __name__ == "__main__":
    build()
