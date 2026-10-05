"""Genera la imagen estática del mapa (antes de cargar el iframe de Google Maps).

Usa teselas de OpenStreetMap (© colaboradores de OpenStreetMap, ODbL) alrededor
de las coordenadas del restaurante, las tiñe con la paleta del sitio y marca el
punto. Uso:  python tools/make_map.py
"""
import io
import math
import time
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parent.parent
LAT, LON = 18.3672818, -68.8409097  # El Patio Beach Club (Google Maps)
Z = 17
W, H = 1200, 720
UA = "ElPatioBeachClubPropuesta/1.0 (mapa estatico; contacto: cotpedro028@gmail.com)"


def tile_xy(lat, lon, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def main():
    cx, cy = tile_xy(LAT, LON, Z)
    px, py = cx * 256, cy * 256
    x0, y0 = px - W / 2, py - H / 2
    tx0, ty0 = int(x0 // 256), int(y0 // 256)
    tx1, ty1 = int((x0 + W) // 256), int((y0 + H) // 256)
    lienzo = Image.new("RGB", ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            url = f"https://tile.openstreetmap.org/{Z}/{tx}/{ty}.png"
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            data = urllib.request.urlopen(req, timeout=30).read()
            lienzo.paste(Image.open(io.BytesIO(data)).convert("RGB"), ((tx - tx0) * 256, (ty - ty0) * 256))
            time.sleep(0.3)
    ox, oy = x0 - tx0 * 256, y0 - ty0 * 256
    mapa = lienzo.crop((round(ox), round(oy), round(ox) + W, round(oy) + H))

    # tono de la casa: gris frío con un velo azul noche suave
    gris = ImageOps.grayscale(mapa)
    gris = ImageEnhance.Contrast(gris).enhance(1.05)
    mapa = ImageOps.colorize(gris, black="#0A2E3B", white="#F4F8F7", mid="#8DB8C2")

    d = ImageDraw.Draw(mapa, "RGBA")
    x, y = W / 2, H / 2
    d.ellipse((x - 46, y - 46, x + 46, y + 46), fill=(240, 138, 50, 60))
    d.ellipse((x - 17, y - 17, x + 17, y + 17), fill=(255, 255, 255, 255))
    d.ellipse((x - 12, y - 12, x + 12, y + 12), fill=(240, 138, 50, 255))
    out = ROOT / "assets" / "img"
    for a in (800, 1200):
        mapa.resize((a, round(H * a / W)), Image.LANCZOS).save(out / f"mapa-{a}.webp", "WEBP", quality=78, method=6)
    print("Mapa listo")


if __name__ == "__main__":
    main()
