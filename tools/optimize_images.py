"""Optimiza las fotos originales de source/ a WebP en varios anchos.

Uso:  python tools/optimize_images.py
Lee la lista FOTOS de abajo, recorta si hace falta y genera
assets/img/<nombre>-<ancho>.webp en 480, 800, 1200 y 1600 px (nunca amplía).
También escribe tools/images.json, que build.py usa para poner srcset,
width y height en cada <img>.

Para cambiar una foto: reemplaza el archivo en source/ (o cambia la ruta aquí)
y vuelve a correr el script y luego tools/build.py.
"""
import json
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source"
OUT = ROOT / "assets" / "img"
ANCHOS = [480, 800, 1200, 1600]
CALIDAD = 74

# nombre: (archivo en source/, recorte en fracciones (izq, arriba, der, abajo) o None, ajustes)
FOTOS = {
    # Instagram @elpatiobeachclub (2025-2026)
    "atardecer-bahia": ("instagram/atardecer-bahia.webp", (0.0, 0.14, 1.0, 0.70), {}),
    "atardecer-bahia-movil": ("instagram/atardecer-bahia.webp", (0.1, 0.0, 0.9, 1.0), {}),
    "bahia-barcos": ("instagram/bahia-barcos-vertical.jpg", None, {}),
    "mesas-frente-al-mar": ("instagram/mesas-frente-al-mar.jpg", None, {"brillo": 1.03}),
    "evento-cena-blanca": ("instagram/evento-cena-blanca.jpg", None, {}),
    "buffet-evento": ("instagram/terraza-techo-cana.jpg", (0.40, 0.50, 1.0, 1.0), {}),
    # Ficha de Tripadvisor del mismo local (antes «El Patio Lounge Bar»)
    "paella-mariscos": ("tripadvisor/ta-0e-31-d9-55-la-paella-de-masrisco.jpg", None, {}),
    "paella-plato": ("tripadvisor/ta-16-28-bb-ad-photo1jpg.jpg", (0.0, 0.1, 1.0, 0.85), {}),
    "langosta-parrilla": ("tripadvisor/ta-0b-01-de-01-el-patio-lounge-bar.jpg", None, {}),
    "calamares-fritos": ("tripadvisor/ta-0b-01-dd-c7-el-patio-lounge-bar.jpg", None, {}),
    "pescado-frito": ("tripadvisor/ta-27-f3-8e-43-caption.jpg", None, {}),
    "mariscos-noche": ("tripadvisor/ta-16-28-bb-ac-photo0jpg.jpg", (0.0, 0.1, 1.0, 0.9), {}),
    "mariscos-plato": ("tripadvisor/ta-27-f3-8e-44-caption.jpg", None, {}),
    "copas-atardecer": ("tripadvisor/ta-0e-31-d9-88-impresionante-puesta.jpg", None, {}),
    "atardecer-barcos": ("tripadvisor/ta-27-f3-8e-45-caption.jpg", None, {}),
    "playa-tumbonas": ("tripadvisor/ta-0e-31-d9-40-vista-impresionante.jpg", None, {}),
    "mesa-vista-mar": ("tripadvisor/ta-0a-83-f6-f7-creaciones-del-el-patio.jpg", None, {}),
    "almuerzo-junto-al-agua": ("tripadvisor/ta-0b-01-dc-bc-el-patio-lounge-bar.jpg", None, {}),
    "canapes": ("tripadvisor/ta-0a-83-f6-f0-creaciones-del-el-patio.jpg", (0.0, 0.15, 1.0, 0.85), {}),
}


def procesar(nombre, archivo, recorte, ajustes):
    im = Image.open(SRC / archivo)
    im = ImageOps.exif_transpose(im).convert("RGB")
    if recorte:
        w, h = im.size
        l, t, r, b = recorte
        im = im.crop((round(l * w), round(t * h), round(r * w), round(b * h)))
    if ajustes.get("brillo"):
        im = ImageEnhance.Brightness(im).enhance(ajustes["brillo"])
    if ajustes.get("saturacion"):
        im = ImageEnhance.Color(im).enhance(ajustes["saturacion"])
    w, h = im.size
    anchos = [a for a in ANCHOS if a <= w]
    # si la foto es más chica que 1600, agrega su ancho real como tope
    if w < ANCHOS[-1] and (not anchos or w > anchos[-1] * 1.15):
        anchos.append(w)
    hechos = []
    for a in anchos:
        alto = round(h * a / w)
        out = OUT / f"{nombre}-{a}.webp"
        im.resize((a, alto), Image.LANCZOS).save(out, "WEBP", quality=CALIDAD, method=6)
        hechos.append(a)
    return {"anchos": hechos, "w": w, "h": h, "ratio": round(w / h, 4), "origen": archivo}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    total = 0
    for nombre, (archivo, recorte, ajustes) in FOTOS.items():
        info = procesar(nombre, archivo, recorte, ajustes)
        manifest[nombre] = info
        peso = sum((OUT / f"{nombre}-{a}.webp").stat().st_size for a in info["anchos"])
        total += peso
        print(f"{nombre:28s} {info['w']}x{info['h']}  {info['anchos']}  {peso // 1024} KB")
    (ROOT / "tools" / "images.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    origen = sum(p.stat().st_size for p in SRC.rglob("*.jpg"))
    print(f"\nOriginales en source/: {origen / 1e6:.1f} MB  ->  WebP publicados: {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
