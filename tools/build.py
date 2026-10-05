"""Compila el sitio de src/ a site/ (la carpeta que publica GitHub Pages).

Uso:  python tools/build.py

- Une las páginas de src/pages con los parciales de src/partials (head, header,
  footer, diálogos), así el encabezado y el pie no se repiten a mano.
- Lee assets/js/config.js (SITE_URL, contacto, horario) y assets/js/menu-data.js
  (la carta) para escribir canonical, Open Graph, JSON-LD, QR, horario y carta.
- Si SITE_URL tiene una ruta (GitHub Pages: /el-patio-beach-club), la agrega a
  todos los enlaces y recursos internos.
- Pone ?v=<hash> en CSS y JS para que nunca se sirva una versión vieja.
- Copia assets/ a site/assets y revisa que cada texto marcado con data-i18n
  tenga traducción en assets/js/i18n-en.js.
Solo usa la librería estándar, salvo el QR (paquete "qrcode").
"""
import hashlib
import html
import json
import re
import shutil
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
ASSETS = ROOT / "assets"
OUT = ROOT / "site"

DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
SCHEMA_DIAS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

# Fotos de la galería: categoría para los filtros y texto alternativo
GALERIA = {
    "atardecer-bahia": "atardecer", "atardecer-barcos": "atardecer", "copas-atardecer": "atardecer",
    "bahia-barcos": "playa", "playa-tumbonas": "playa", "mesas-frente-al-mar": "playa",
    "mesa-vista-mar": "playa", "almuerzo-junto-al-agua": "playa",
    "paella-mariscos": "platos", "paella-plato": "platos", "langosta-parrilla": "platos",
    "pescado-frito": "platos", "calamares-fritos": "platos", "mariscos-plato": "platos",
    "mariscos-noche": "platos",
    "evento-cena-blanca": "eventos", "buffet-evento": "eventos", "canapes": "eventos",
}
ALT = {
    "atardecer-bahia": "Atardecer naranja sobre la bahía de Bayahíbe, con catamaranes y lanchas fondeados.",
    "atardecer-barcos": "Último sol sobre la bahía de Bayahíbe, con veleros recortados en el horizonte.",
    "copas-atardecer": "Copas de vino y una botella sobre la mesa, con el sol poniéndose sobre el agua.",
    "bahia-barcos": "Agua turquesa de la bahía de Bayahíbe con lanchas fondeadas, vista desde El Patio.",
    "playa-tumbonas": "Tumbonas blancas en la arena, bajo las palmas, frente a la playa de Bayahíbe.",
    "mesas-frente-al-mar": "Mesas montadas bajo el techo de cana, abiertas a la playa y al mar turquesa.",
    "mesa-vista-mar": "Mesa con mantel blanco y copas, con el mar turquesa de fondo.",
    "almuerzo-junto-al-agua": "Platos servidos en una mesa al borde del agua turquesa.",
    "paella-mariscos": "Paella de mariscos con langosta, camarones y mejillones en la paellera.",
    "paella-plato": "Paella de mariscos con limón y ensalada.",
    "langosta-parrilla": "Langosta a la parrilla con limón.",
    "pescado-frito": "Pescado frito entero con papas fritas y limón.",
    "calamares-fritos": "Calamares fritos con limón y salsa.",
    "mariscos-plato": "Plato de mariscos servido de noche, con una botella de cerveza.",
    "mariscos-noche": "Cena de mariscos de noche frente a la bahía, con hielera y copa.",
    "evento-cena-blanca": "Cena de evento con invitados vestidos de blanco, mesas largas bajo los árboles y luces.",
    "buffet-evento": "Bandejas de buffet con ensaladas y pasta en un evento en El Patio.",
    "canapes": "Torre de canapés para un evento.",
}


# ---------------------------------------------------------------- utilidades
def leer_objeto_js(ruta, variable):
    """Lee `window.X = {...};` de un .js y lo devuelve como dict."""
    txt = ruta.read_text(encoding="utf-8")
    txt = re.sub(r"/\*.*?\*/", "", txt, flags=re.S)
    txt = re.sub(r"(?m)^\s*//.*$", "", txt)
    cuerpo = txt[txt.index("=", txt.index(variable)) + 1:].strip().rstrip(";")
    cuerpo = re.sub(r'([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":', cuerpo)
    cuerpo = re.sub(r",(\s*[}\]])", r"\1", cuerpo)
    return json.loads(cuerpo)


def h(x):
    return html.escape(str(x), quote=True)


def norm(t):
    t = unicodedata.normalize("NFD", t.lower())
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


def a_min(hhmm):
    hh, mm = hhmm.split(":")
    return int(hh) * 60 + int(mm)


def fmt_hora(minutos):
    if minutos % 1440 == 0:
        return "medianoche"
    m = minutos % 1440
    h24, mm = divmod(m, 60)
    suf = "a. m." if h24 < 12 else "p. m."
    return f"{h24 % 12 or 12}:{mm:02d} {suf}"


def hash_archivo(p):
    return hashlib.md5(p.read_bytes()).hexdigest()[:8]


# ---------------------------------------------------------------- datos
CFG = leer_objeto_js(ASSETS / "js" / "config.js", "SITIO")
CARTA = leer_objeto_js(ASSETS / "js" / "menu-data.js", "CARTA")
IMGS = json.loads((ROOT / "tools" / "images.json").read_text(encoding="utf-8"))
LOGO = json.loads((ROOT / "source" / "logo-paths.json").read_text(encoding="utf-8"))
SITE_URL = CFG["SITE_URL"].rstrip("/")
BASE = urlparse(SITE_URL).path.rstrip("/")  # "/el-patio-beach-club" en GitHub Pages
TASA = CFG.get("tasaUSD") or 0

PLATOS = {}
for cat in CARTA["categorias"]:
    for it in cat["items"]:
        it["_cat"] = cat
        PLATOS[it["id"]] = it

HORARIO = [None if d is None else (a_min(d["abre"]), a_min(d["cierra"])) for d in CFG["horario"]]


def precio(n):
    return f"RD$ {n:,}"


def usd(n):
    return f"≈ US$ {round(n / TASA)}" if TASA else ""


def precio_html(it, clase="precio"):
    nota = f' <span class="{clase}__nota" data-en="{h(it.get("nota_en", ""))}">{h(it["nota"])}</span>' if it.get("nota") else ""
    return (f'<span class="{clase}"><span class="{clase}__rd">{precio(it["precio"])}</span>'
            f'<span class="{clase}__usd">{usd(it["precio"])}</span>{nota}</span>')


# ---------------------------------------------------------------- piezas HTML
def img_tag(nombre, alt, sizes="100vw", clase="", prioridad=False):
    info = IMGS[nombre]
    anchos = info["anchos"]
    mayor = anchos[-1]
    alto = round(mayor / info["ratio"])
    srcset = ", ".join(f"/assets/img/{nombre}-{a}.webp {a}w" for a in anchos)
    src = f"/assets/img/{nombre}-{min(anchos, key=lambda a: abs(a - 800))}.webp"
    carga = 'fetchpriority="high" decoding="async"' if prioridad else 'loading="lazy" decoding="async"'
    i18n = ' data-i18n-attr="alt"' if alt else ""
    cl = f' class="{clase}"' if clase else ""
    return (f'<img{cl} src="{src}" srcset="{srcset}" sizes="{sizes}" width="{mayor}" height="{alto}" '
            f'alt="{h(alt)}"{i18n} {carga}>')


def picture_tag(nombre, movil, alt, sizes, clase):
    im = IMGS[movil]
    srcset_m = ", ".join(f"/assets/img/{movil}-{a}.webp {a}w" for a in im["anchos"])
    w = im["anchos"][-1]
    return (f'<picture class="{clase}"><source media="(max-width: 767px)" type="image/webp" srcset="{srcset_m}" '
            f'sizes="100vw" width="{w}" height="{round(w / im["ratio"])}">'
            f'{img_tag(nombre, alt, sizes, prioridad=True)}</picture>')


def preload_tags(spec):
    if not spec:
        return ""
    out = []
    for parte in spec.split(";"):
        nombre, sizes, media = [x.strip() for x in parte.split("|")]
        srcset = ", ".join(f"/assets/img/{nombre}-{a}.webp {a}w" for a in IMGS[nombre]["anchos"])
        m = "" if media == "all" else f' media="{media}"'
        out.append(f'<link rel="preload" as="image" type="image/webp" imagesrcset="{srcset}" imagesizes="{sizes}"{m} fetchpriority="high">')
    return "\n".join(out)


def logo_svg(clase="logo"):
    c = LOGO["colores"]
    return (f'<svg class="{clase}" viewBox="{LOGO["viewBox"]}" aria-hidden="true" focusable="false">'
            f'<defs><linearGradient id="ola-{clase}" x1="0" x2="1"><stop offset="0" stop-color="{c["agua"]}"/>'
            f'<stop offset=".7" stop-color="{c["azul"]}"/><stop offset="1" stop-color="{c["sol"]}"/></linearGradient></defs>'
            f'<path d="{LOGO["sol"]}" fill="{c["sol"]}"/><path d="{LOGO["vela"]}" fill="var(--logo-vela, {c["azul"]})"/>'
            f'<path d="{LOGO["lineaVela"]}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>'
            f'<path d="{LOGO["ola"]}" fill="none" stroke="url(#ola-{clase})" stroke-width="9" stroke-linecap="round"/>'
            f'<path d="{LOGO["patio"]}" fill="currentColor"/><path d="{LOGO["beach"]}" fill="var(--logo-beach, {c["naranja"]})"/></svg>')


def favoritos(ids):
    out = []
    for i in ids:
        it = PLATOS[i]
        foto = img_tag(it["foto"], it["nombre"], "(min-width: 1280px) 300px, (min-width: 1024px) 31vw, (min-width: 768px) 44vw, 78vw")
        out.append(
            f'<li class="plato"><div class="plato__foto">{foto}</div>'
            f'<div class="plato__cuerpo"><div class="plato__linea"><h3 class="plato__nombre" data-en="{h(it["en"])}">{h(it["nombre"])}</h3>'
            f'{precio_html(it)}</div>'
            f'<p class="plato__desc" data-en="{h(it["desc_en"])}">{h(it["desc"])}</p></div></li>')
    return "\n".join(out)


def galeria(ids, modo=""):
    sizes = "(min-width: 1024px) 24vw, (min-width: 768px) 33vw, 50vw"
    if modo == "adelanto":
        sizes = "(min-width: 1024px) 32vw, 50vw"
    out = []
    for i in ids:
        info = IMGS[i]
        grande = f"/assets/img/{i}-{info['anchos'][-1]}.webp"
        out.append(
            f'<li class="mosaico__item" data-cat="{GALERIA[i]}"><button class="mosaico__boton" type="button" '
            f'data-grande="{grande}" aria-label="Ver foto en grande" data-i18n-attr="aria-label">'
            f'{img_tag(i, ALT[i], sizes)}</button></li>')
    return "\n".join(out)


ETIQUETAS = {"popular": "Lo más pedido", "compartir": "Para compartir", "veg": "Vegetariano", "picante": "Picante", "nuevo": "Nuevo"}


def carta_categorias():
    return "\n".join(
        f'<a class="categorias__link" href="#{c["id"]}" data-cat-link="{c["id"]}" data-en="{h(c["en"])}">{h(c["nombre"])}</a>'
        for c in CARTA["categorias"])


def carta_completa():
    out = []
    for c in CARTA["categorias"]:
        items = []
        for it in c["items"]:
            tags = list(it.get("tags", []))
            buscar = norm(" ".join([it["nombre"], it.get("desc", ""), it.get("en", ""), it.get("desc_en", ""), c["nombre"], c["en"]]))
            foto = f'<div class="item__foto">{img_tag(it["foto"], it["nombre"], "96px")}</div>' if it.get("foto") else ""
            etiquetas = "".join(f'<li class="etiqueta etiqueta--{t}" data-i18n>{ETIQUETAS[t]}</li>' for t in tags)
            etiquetas = f'<ul class="etiquetas">{etiquetas}</ul>' if etiquetas else ""
            desc = f'<p class="item__desc" data-en="{h(it.get("desc_en", ""))}">{h(it["desc"])}</p>' if it.get("desc") else ""
            items.append(
                f'<li class="item{" item--foto" if foto else ""}" data-item="{it["id"]}" data-filtros="{" ".join(tags + [c["id"]])}" data-buscar="{h(buscar)}">'
                f'{foto}<div class="item__cuerpo"><div class="item__linea"><h3 class="item__nombre" data-en="{h(it.get("en", it["nombre"]))}">{h(it["nombre"])}</h3>'
                f'<span class="item__puntos" aria-hidden="true"></span>{precio_html(it, "item__precio")}</div>{desc}{etiquetas}</div></li>')
        out.append(
            f'<section class="cat" id="{c["id"]}" data-cat aria-labelledby="cat-{c["id"]}">'
            f'<h2 class="cat__titulo" id="cat-{c["id"]}" data-en="{h(c["en"])}">{h(c["nombre"])}</h2>'
            f'<ul class="cat__lista">{"".join(items)}</ul></section>')
    return "\n".join(out)


def grupos_horario():
    grupos = []
    for d in range(7):
        if grupos and HORARIO[d] == HORARIO[grupos[-1][-1]]:
            grupos[-1].append(d)
        else:
            grupos.append([d])
    return grupos


def nombre_grupo(dias):
    if len(dias) == 7:
        return "Todos los días"
    if len(dias) == 1:
        return DIAS[dias[0]]
    if len(dias) == 2:
        return f"{DIAS[dias[0]]} y {DIAS[dias[1]].lower()}"
    return f"{DIAS[dias[0]]} a {DIAS[dias[-1]].lower()}"


def rango(hor):
    return "Cerrado" if hor is None else f"{fmt_hora(hor[0])} – {fmt_hora(hor[1])}"


def horario_tabla():
    filas = "".join(f'<tr data-dia="{d}"><th scope="row" data-i18n>{DIAS[d]}</th><td data-i18n>{rango(HORARIO[d])}</td></tr>'
                    for d in [1, 2, 3, 4, 5, 6, 0])
    return f'<table class="horario__tabla"><caption class="sr-only" data-i18n>Horario por día</caption><tbody>{filas}</tbody></table>'


def horario_corto():
    filas = "".join(f'<li><span data-i18n>{nombre_grupo(g)}</span><span data-i18n>{rango(HORARIO[g[0]])}</span></li>'
                    for g in grupos_horario())
    return f'<ul class="horario-corto">{filas}</ul>'


def qr_svg(url, etiqueta):
    import qrcode
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2)
    q.add_data(url)
    q.make(fit=True)
    m = q.get_matrix()
    n = len(m)
    trazos = []
    for y, fila in enumerate(m):
        x = 0
        while x < n:
            if fila[x]:
                ini = x
                while x < n and fila[x]:
                    x += 1
                trazos.append(f"M{ini} {y}h{x - ini}v1h-{x - ini}z")
            else:
                x += 1
    return (f'<svg class="qr" viewBox="0 0 {n} {n}" role="img" aria-label="{h(etiqueta)}" shape-rendering="crispEdges">'
            f'<rect width="{n}" height="{n}" fill="#fff"/><path d="{"".join(trazos)}" fill="#0A2E3B"/></svg>')


def jsonld():
    especs = []
    for g in grupos_horario():
        hor = HORARIO[g[0]]
        if hor is None:
            continue
        especs.append({"@type": "OpeningHoursSpecification", "dayOfWeek": [SCHEMA_DIAS[d] for d in g],
                       "opens": f"{hor[0] // 60:02d}:{hor[0] % 60:02d}",
                       "closes": f"{(hor[1] % 1440) // 60:02d}:{hor[1] % 60:02d}"})
    d = CFG["direccion"]
    data = {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "@id": f"{SITE_URL}/#restaurante",
        "name": CFG["nombre"],
        "url": f"{SITE_URL}/",
        "image": [f"{SITE_URL}/assets/img/og-image.jpg", f"{SITE_URL}/assets/img/mesas-frente-al-mar-1428.webp"],
        "logo": f"{SITE_URL}/assets/img/logo.svg",
        "description": "Restaurante y lounge en la arena de la bahía de Bayahíbe: mariscos, paella, langosta y cócteles frente al atardecer.",
        "telephone": "+1-" + CFG["telefonoTexto"],
        "address": {"@type": "PostalAddress", "streetAddress": d["calle"], "addressLocality": d["ciudad"],
                    "addressRegion": d["provincia"], "postalCode": d["codigoPostal"], "addressCountry": d["pais"]},
        "geo": {"@type": "GeoCoordinates", "latitude": CFG["geo"]["lat"], "longitude": CFG["geo"]["lng"]},
        "hasMap": f'https://www.google.com/maps/search/?api=1&query={CFG["geo"]["lat"]}%2C{CFG["geo"]["lng"]}',
        "servesCuisine": ["Mariscos", "Caribeña", "Dominicana"],
        "priceRange": CFG["rangoPrecios"],
        "currenciesAccepted": "DOP, USD",
        "openingHoursSpecification": especs,
        "hasMenu": f"{SITE_URL}/carta/",
        "acceptsReservations": True,
        "sameAs": [CFG["enlaces"]["instagram"], CFG["enlaces"]["tripadvisor"]],
    }
    if CFG.get("email"):
        data["email"] = CFG["email"]
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>"


# ---------------------------------------------------------------- plantillas
def parsear_pagina(txt):
    m = re.match(r"---\n(.*?)\n---\n", txt, re.S)
    meta = {}
    for linea in m.group(1).splitlines():
        k, v = linea.split(":", 1)
        meta[k.strip()] = v.strip()
    return meta, txt[m.end():]


def args(cadena):
    a = dict(re.findall(r'(\w+)="([^"]*)"', cadena))
    for flag in re.findall(r'(?<![\w"=])(\w+)(?=\s|$)', re.sub(r'\w+="[^"]*"', "", cadena)):
        a[flag] = True
    return a


def con_base(doc):
    """Agrega la ruta de GitHub Pages a los enlaces y recursos internos."""
    if not BASE:
        return doc
    return re.sub(r'(["\s,(])/(?=(assets/|carta/|eventos/|galeria/|favicon|manifest|404|#|"))', rf"\1{BASE}/", doc)


def render(meta, cuerpo, versiones):
    def incluir(t):
        return re.sub(r"\{\{>\s*(\w+)\s*\}\}", lambda m: incluir((SRC / "partials" / f"{m.group(1)}.html").read_text(encoding="utf-8")), t)

    t = incluir(cuerpo)
    pagina = meta["pagina"]
    canonical = SITE_URL + meta["ruta"]
    scripts = ""
    if meta.get("scripts"):
        for s in [x.strip() for x in meta["scripts"].split(",")]:
            scripts += f'<script src="/assets/js/{s}.js?v={versiones[f"js/{s}.js"]}" defer></script>\n'
    d = CFG["direccion"]
    precios_ref = "" if CARTA.get("preciosConfirmados") else '<p class="nota-precios" data-i18n>Precios de referencia, por confirmar con el restaurante.</p>'
    simples = {
        "titulo": h(meta["titulo"]), "og_titulo": h(meta.get("og_titulo", meta["titulo"])),
        "descripcion": h(meta["descripcion"]), "canonical": canonical, "site_url": SITE_URL,
        "preload": preload_tags(meta.get("preload", "")), "scripts": scripts.strip(),
        "jsonld": jsonld() if pagina in ("inicio", "carta", "eventos") else "",
        "tel": CFG["telefono"], "tel_texto": CFG["telefonoTexto"], "wa": CFG["whatsapp"],
        "maps": h(CFG["enlaces"]["maps"]), "waze": h(CFG["enlaces"]["waze"]),
        "instagram": CFG["enlaces"]["instagram"], "instagram_usuario": CFG["enlaces"]["instagramUsuario"],
        "tripadvisor": h(CFG["enlaces"]["tripadvisor"]),
        "calle": h(d["calle"]), "sector": h(d["sector"]), "ciudad": h(d["ciudad"]), "cp": d["codigoPostal"],
        "provincia": h(d["provincia"]),
        "logo": logo_svg(), "logo_pie": logo_svg("logo logo--pie"),
        "horario_tabla": horario_tabla(), "horario_corto": horario_corto(),
        "abre_texto": fmt_hora(min(x[0] for x in HORARIO if x)),
        "qr": qr_svg(SITE_URL + "/", "Código QR para abrir el sitio de El Patio Beach Club"),
        "qr_carta": qr_svg(SITE_URL + "/carta/", "Código QR de la carta de El Patio Beach Club"),
        "carta_categorias": carta_categorias(), "carta_completa": carta_completa(),
        "nota_precios": precios_ref,
    }

    def macro(m):
        nombre, resto = m.group(1), (m.group(2) or "").strip()
        a = args(resto)
        if nombre.startswith("v:"):
            return versiones[nombre[2:]]
        if nombre.startswith("cur:"):
            return ' aria-current="page"' if nombre[4:] == pagina else ""
        if nombre == "img":
            return img_tag(a["nombre"], a.get("alt", ""), a.get("sizes", "100vw"), a.get("clase", ""), bool(a.get("prioridad")))
        if nombre == "picture":
            return picture_tag(a["nombre"], a["movil"], a["alt"], a["sizes"], a.get("clase", ""))
        ids = [x.strip() for x in a.get("ids", "").split(",") if x.strip()]
        if nombre == "favoritos":
            return favoritos(ids)
        if nombre == "galeria":
            return galeria(ids, a.get("modo", ""))
        if nombre in simples:
            return simples[nombre]
        raise KeyError(f"Marcador desconocido: {{{{{nombre}}}}} en {meta['salida']}")

    doc = re.sub(r"\{\{\s*([\w:/.\-]+)((?:\s+[^}]*)?)\}\}", macro, t)
    return con_base(doc)


# ---------------------------------------------------------------- i18n
def revisar_i18n(paginas_html):
    ruta = ASSETS / "js" / "i18n-en.js"
    dic_txt = ruta.read_text(encoding="utf-8") if ruta.exists() else ""
    claves = {json.loads('"' + m.group(1) + '"') for m in re.finditer(r'^\s*"((?:[^"\\]|\\.)*)"\s*:', dic_txt, re.M)}

    def n(s):
        return re.sub(r"\s+", " ", html.unescape(s)).strip()

    faltan = []
    for doc in paginas_html.values():
        for m in re.finditer(r'<(\w+)([^>]*?)\sdata-i18n(?:="(html)"|(?=[\s>]))([^>]*)>(.*?)</\1>', doc, re.S):
            contenido = m.group(5)
            clave = n(contenido) if m.group(3) == "html" else n(re.sub(r"<[^>]+>", "", contenido))
            if clave and clave not in claves:
                faltan.append(clave)
        for m in re.finditer(r'<[^>]*data-i18n-attr="([^"]+)"[^>]*>', doc):
            etiqueta = m.group(0)
            for attr in m.group(1).split(","):
                v = re.search(rf'\s{attr.strip()}="([^"]*)"', etiqueta)
                if v and v.group(1) and n(v.group(1)) not in claves:
                    faltan.append(n(v.group(1)))
    faltan = sorted(set(faltan))
    (ROOT / "tools" / "i18n-faltantes.txt").write_text("\n".join(faltan), encoding="utf-8")
    return faltan


# ---------------------------------------------------------------- principal
def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    shutil.copytree(ASSETS, OUT / "assets")
    versiones = {}
    for p in (ASSETS / "css").glob("*.css"):
        versiones[f"css/{p.name}"] = hash_archivo(p)
    for p in (ASSETS / "js").glob("*.js"):
        versiones[f"js/{p.name}"] = hash_archivo(p)

    paginas = {}
    for archivo in sorted((SRC / "pages").glob("*.html")):
        meta, cuerpo = parsear_pagina(archivo.read_text(encoding="utf-8"))
        doc = render(meta, cuerpo, versiones)
        destino = OUT / meta["salida"]
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(doc, encoding="utf-8", newline="\n")
        paginas[meta["salida"]] = doc
        print(f"  {meta['salida']:22s} {len(doc) // 1024:4d} KB")

    manifest = (SRC / "manifest.webmanifest").read_text(encoding="utf-8").replace('"/', f'"{BASE}/')
    (OUT / "manifest.webmanifest").write_text(manifest, encoding="utf-8", newline="\n")
    shutil.copy(ASSETS / "img" / "favicon.ico", OUT / "favicon.ico")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")

    faltan = revisar_i18n(paginas)
    print(f"\nSITE_URL: {SITE_URL}   (ruta base: {BASE or '/'})")
    print("Versiones:", ", ".join(f"{k}={v}" for k, v in sorted(versiones.items())))
    print(f"Atención: {len(faltan)} textos sin traducción (ver tools/i18n-faltantes.txt)" if faltan else "Traducciones completas.")


if __name__ == "__main__":
    main()
