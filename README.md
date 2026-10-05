# El Patio Beach Club · propuesta de sitio web

**Ver en línea:** https://jonasjavier.github.io/el-patio-beach-club/ · **En inglés:** https://jonasjavier.github.io/el-patio-beach-club/?lang=en

Propuesta de sitio web preparada para **El Patio Beach Club**, restaurante y lounge en la arena de la bahía de Bayahíbe (C. La Bahía #17, La Altagracia), frente a la playa de donde salen los barcos a Isla Saona y Catalina.

> **Esto es una propuesta, no el sitio oficial del restaurante.** Lleva `noindex` para que Google no la muestre (ver «Quitar el modo propuesta»). Las fotos, el logo y la marca pertenecen a El Patio Beach Club y se usan solo para presentarle esta propuesta.

---

## Páginas y funciones

| Página | Qué tiene |
|---|---|
| **Inicio** `/` | Foto real del atardecer sobre la bahía a pantalla completa, estado en vivo («Abierto ahora · hasta la medianoche») y hora del atardecer de hoy, acciones rápidas en móvil, **El atardecer de hoy**, platos con precio en RD$ y ≈ US$, el lugar (techo de cana, tumbonas, la bahía), aviso para quien vuelve de Saona o Catalina, reseñas con fuente y fecha, adelanto de eventos y de la galería, preguntas frecuentes, horario con el día de hoy resaltado, mapa bajo demanda y cierre «¿Te guardamos una mesa para el atardecer?». |
| **La carta** `/carta/` | Platos y bebidas con precio en pesos y su equivalente en dólares, buscador (no distingue tildes ni mayúsculas), filtros (lo más pedido, del mar, para compartir, vegetariano), barra de categorías fija y versión imprimible con QR para las mesas. |
| **Eventos** `/eventos/` | Cumpleaños, cenas de empresa, fiestas temáticas (como la cena blanca) y grupos de excursión; buffet, menú servido o picadera; cotización en 3 pasos que llega armada por WhatsApp e incluye la hora del atardecer de ese día. |
| **Galería** `/galeria/` | 18 fotos con filtros (atardeceres, la playa, platos, eventos) y visor a pantalla completa (flechas del teclado, Esc y deslizar con el dedo). |
| **404** | Página propia: «Esta página se la llevó la marea». |

**En todas las páginas:** reservas por WhatsApp (sin fechas pasadas, solo horas válidas y la hora sugerida para el atardecer marcada), barra inferior tipo app en el teléfono, menú móvil con el estado y el atardecer del día, versión en inglés con `?lang=en` y pie con QR en escritorio.

### El elemento propio: «El atardecer de hoy»
Lo que más repiten las reseñas es el atardecer («the best place to watch the sunset»). El sitio calcula, para las coordenadas exactas del restaurante, a qué hora sale y se pone el sol cada día. Lo muestra sobre un dibujo del horizonte de la bahía con la cuenta regresiva, sugiere a qué hora llegar y abre la reserva con esa hora ya elegida. También avisa la hora del atardecer en el formulario de reservas y en la cotización de eventos. El cálculo coincide con timeanddate.com (La Romana) con una diferencia de un minuto o menos.

## Qué mejora frente a lo que tienen hoy

- **Una página propia.** Hoy el negocio solo tiene Instagram, la ficha de Google y una ficha vieja de Tripadvisor con el nombre anterior. Con este sitio, el turista que busca dónde comer en Bayahíbe encuentra la carta, el horario y la ubicación en un solo lugar.
- **El atardecer como argumento de venta.** El sitio convierte el mejor atributo del lugar en una reserva: «hoy el sol se pone a las 6:21 p. m., llega a las 5:30».
- **Reservas en menos de un minuto por WhatsApp**, con fecha, hora, personas, dónde sentarse y ocasión. El mensaje llega ordenado y el personal solo confirma.
- **Carta clara para turistas**, con precios en pesos y en dólares y versión en inglés.
- **Eventos y grupos de excursión**, con una página para cotizar.
- **Rápido y liviano en el teléfono**: fotos optimizadas (14.8 MB de originales → 4.2 MB en todas las versiones), sin dependencias.

## Ver en local

Requiere Python 3 (Pillow solo para regenerar imágenes; `qrcode` para el QR).

```bash
python tools/build.py
python tools/servidor.py
```

Luego abre http://localhost:8734/el-patio-beach-club/ (el servidor imita la ruta de GitHub Pages). Cada vez que cambies algo en `src/` o `assets/`, vuelve a correr `python tools/build.py`.

## Publicar

**GitHub Pages (como está ahora).** El repositorio es público y el flujo `.github/workflows/pages.yml` publica la carpeta `site/` cada vez que se sube algo a `main`. En GitHub, en *Settings → Pages*, la fuente debe ser **GitHub Actions**. Antes de subir cambios, corre `python tools/build.py` y haz commit de `site/`.

**Netlify (alternativa).** Conectar el repo, rama `main`, *Build command* vacío, *Publish directory* `site`. Si se publica en la raíz de un dominio (sin `/el-patio-beach-club`), cambia `SITE_URL` en `assets/js/config.js` y vuelve a compilar: el build ajusta todas las rutas solo.

## Quiero cambiar…

| Quiero cambiar… | Archivo |
|---|---|
| Teléfono, WhatsApp, dirección, coordenadas, redes | `assets/js/config.js` |
| Horario (y con él el estado abierto/cerrado, la tabla, las horas de reserva y el JSON-LD) | `assets/js/config.js` → `horario` |
| La dirección del sitio (canonical, Open Graph, QR, JSON-LD y rutas) | `assets/js/config.js` → `SITE_URL` |
| Cuántos minutos antes del atardecer sugerimos llegar | `assets/js/config.js` → `atardecer.llegarAntes` |
| Tasa para mostrar los dólares | `assets/js/config.js` → `tasaUSD` |
| Platos, precios, descripciones, fotos de platos | `assets/js/menu-data.js` (cuando los precios estén confirmados, pon `preciosConfirmados: true`) |
| Platos del carrusel del inicio | `src/pages/index.html` (`{{favoritos ids="…"}}`) |
| Textos de una página | `src/pages/*.html` |
| Encabezado, pie, diálogo de reserva | `src/partials/*.html` |
| Textos en inglés | `assets/js/i18n-en.js` (el build avisa si falta alguno) |
| Colores, tipografía, espacios | `assets/css/styles.css` (variables en `:root`) |
| Una foto | reemplaza el original en `source/`, ajusta `tools/optimize_images.py` y corre `python tools/optimize_images.py` |
| Imagen para WhatsApp/redes (og-image) | `python tools/make_og.py` |
| Logo | `python tools/make_logo.py` (redibujado en SVG) |
| Mapa estático | `python tools/make_map.py` |

Después de cualquier cambio: `python tools/build.py`.

## Por confirmar con el cliente

- **La carta y los precios.** El restaurante no tiene carta publicada en ningún sitio, y la destacada «Menú» de Instagram solo se ve con sesión iniciada. Los platos salen de reseñas y fotos reales (ver «Fuentes»); **los precios son de referencia, propuestos por nosotros**, calibrados con el rango de Bayahíbe (15–25 US$ por persona en restaurantes de rango medio). La página lo indica con «Precios de referencia» hasta que el cliente envíe su carta.
- **Horario.** Se usó el de Instagram: lunes a domingo, de 10:00 a. m. a 12:00 a. m. Google dice de 8:00 a. m. a 10:00 p. m. (domingo hasta las 9:00 p. m.).
- **Dirección.** Instagram y Tripadvisor dicen «C. La Bahía #17»; Google dice «Carr. Bayahíbe 1». Se usó la de Instagram, con las coordenadas de Google.
- **Platos que hay que confirmar** porque las reseñas son antiguas (2015–2017): bruschetta, pasta con langosta, parrillada de mariscos y espresso. También si ofrecen pizza (algunos directorios lo mencionan).
- **Fotos.** Las de platos son de la ficha de Tripadvisor del mismo local y algunas son antiguas; conviene pedir fotos actuales de la carta. No se usó ninguna foto de stock.
- **Formas de pago, dólares, estacionamiento y tumbonas** (si son para clientes del restaurante): no hay datos públicos y la página no los menciona.
- **Capacidad para eventos** y si hacen bodas en la playa.
- **Texto en inglés:** traducción nuestra; conviene que alguien del restaurante la revise.
- **Propuesto (no es dato del restaurante):** la hora sugerida para llegar (40 minutos antes del atardecer, en intervalos de 30), la última reserva 90 minutos antes del cierre y la tasa de 63 RD$ por dólar.

## Quitar el modo propuesta (cuando sea el sitio oficial)

1. En `src/partials/head.html` borra `<meta name="robots" content="noindex, nofollow">`.
2. En `src/partials/footer.html` quita la nota «Propuesta de sitio web preparada para…».
3. Si hay dominio propio, cambia `SITE_URL` en `assets/js/config.js`, corre `python tools/build.py` y publica.

En GitHub Pages un `robots.txt` dentro de `/el-patio-beach-club/` no tiene efecto (los buscadores solo leen el de la raíz del dominio), por eso la propuesta se protege con la etiqueta `noindex`.

## Siguientes pasos (fase 2)

- **Dominio propio** (por ejemplo `elpatiobayahibe.com`) y enlazarlo desde Instagram y la ficha de Google; pedir a Tripadvisor que actualice el nombre de la ficha.
- **Carta real con precios** y fotos nuevas de los platos más pedidos.
- **Formularios conectados**: que las reservas y cotizaciones lleguen también a un correo o a una hoja de cálculo.
- **QR en las mesas** con la carta imprimible (ya viene en `/carta/`, botón «Imprimir carta»).
- **Italiano**: Bayahíbe recibe muchos turistas italianos; con el diccionario actual se puede sumar una tercera lengua.
- **Delivery o pedidos para llevar**, si el restaurante lo ofrece.

## Estructura

```
assets/css/styles.css      sistema de diseño (tokens en :root, mobile-first)
assets/js/config.js        nombre, contacto, dirección, coordenadas, horario, SITE_URL, tasa US$
assets/js/menu-data.js     la carta (lo único que se edita para platos y precios)
assets/js/main.js          idioma, estado abierto/cerrado, reloj del atardecer, navegación, barra móvil, reservas, carrusel, galería, mapa
assets/js/menu.js          buscador, filtros, categorías e impresión de la carta
assets/js/i18n-en.js       diccionario español → inglés
assets/img/                fotos WebP (480/800/1200/1600), logo SVG, og-image.jpg, íconos, mapa
assets/fonts/              Gloock y Hanken Grotesk (woff2, alojadas en el sitio)
src/pages/  src/partials/  plantillas (inicio, carta, eventos, galería, 404) y piezas compartidas
site/                      sitio compilado que publica GitHub Pages (no editar a mano)
source/                    fotos originales, fuentes TTF y logo renderizado (no se publican)
tools/                     build.py, servidor.py, optimize_images.py, make_logo.py, make_og.py, make_map.py
```

**Diseño.** Paleta del logo y de la bahía: azul bahía `#0B6E99` (el «El patio» del logo), turquesa `#36B5C4`, mar de noche `#0A2E3B`, naranja `#F08A32` (el «Beach Club» del logo, color de acción), sol `#F6B33D`, arena `#EADBC0`, espuma `#F4F8F7`, cana `#9C6B36`, verde de WhatsApp `#0F8443`. Tipografía: Gloock para títulos y Hanken Grotesk para el resto.

## Fuentes y créditos

**Datos (consultados el 5 de octubre de 2026)**
- Instagram @elpatiobeachclub: «Restaurante Lounge en la Playa · Playa Bayahibe c/ la Bahia no.17 · (829) 261-0033 · Lunes a Domingo 10am–12Am», logo, fotos y destacadas (Bar, Menú, Así somos, Eventos): https://www.instagram.com/elpatiobeachclub/
- Google Maps: 4.1/5, «Carr. Bayahibe 1, Bayahíbe 23000», teléfono, coordenadas 18.3672818, -68.8409097 y horario de 8:00 a. m. a 10:00 p. m.
- Tripadvisor, ficha «El Patio Lounge Bar» (C. La Bahía #17), 4.1/5 con 52 opiniones: reseñas sobre la paella de mariscos, la langosta, el pescado entero, los langostinos, el Mai Tai, el rosado y el atardecer: https://www.tripadvisor.com/Restaurant_Review-g663484-d7761758-Reviews-El_Patio_Lounge_Bar-Bayahibe_La_Altagracia_Province_Dominican_Republic.html (se descartaron reseñas que hablan de otro «El Patio» en España, con precios en euros).
- Wanderlog (reseña de Google de Lulu, enero de 2021): https://wanderlog.com/place/details/2804570/el-patio-beach-club
- Precios de referencia de Bayahíbe: blog Viajamos con vos, diciembre de 2025.
- Horas del sol: algoritmo NOAA, comparado con timeanddate.com (La Romana).
- Se descartaron dos cuentas homónimas que no son este restaurante: Instagram @elpatiobeach y Facebook «El Patio Beach» (beach clubs en Italia).

**Fotos**
- Atardecer sobre la bahía, bahía con barcos, mesas bajo el techo de cana, cena blanca y buffet: Instagram de El Patio Beach Club (2025–2026).
- Paella de mariscos, langosta, calamares, pescado frito, copas al atardecer, tumbonas, mesas frente al mar y canapés: ficha de Tripadvisor del mismo local (fotos del restaurante y de clientes).
- Mapa estático: © colaboradores de OpenStreetMap (ODbL).
- Fotos de stock: ninguna.

**Logo:** redibujado en SVG a partir del logo de Instagram; «El patio» y «Beach Club» convertidos a curvas desde Pacifico y Courgette (SIL OFL). **Fuentes del sitio:** Gloock y Hanken Grotesk (SIL OFL).
