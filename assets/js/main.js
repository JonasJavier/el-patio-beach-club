/* =====================================================================
   El Patio Beach Club · comportamiento general
   Idioma (ES/EN), estado abierto/cerrado, reloj del atardecer, navegación,
   barra móvil, reservas por WhatsApp, carrusel, galería y mapa.
   Los datos (horario, coordenadas, WhatsApp) salen de config.js.
   ===================================================================== */
(() => {
  "use strict";

  const S = window.SITIO;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const raiz = document.documentElement;
  const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const comportamiento = sinMovimiento ? "auto" : "smooth";

  /* ------------------------------------------------------------ idioma */
  let LANG = raiz.lang === "en" ? "en" : "es";
  let EN = {};
  const norm = (s) => String(s).replace(/\s+/g, " ").trim();
  const t = (es) => (LANG === "en" && EN[norm(es)]) || es;

  function aplicarIdioma() {
    if (LANG !== "en") return;
    $$("[data-i18n]").forEach((el) => {
      if (el.dataset.i18n === "html") {
        const v = EN[norm(el.innerHTML)];
        if (v) el.innerHTML = v;
      } else {
        const v = EN[norm(el.textContent)];
        if (v) el.textContent = v;
      }
    });
    $$("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(",").forEach((a) => {
        a = a.trim();
        const v = EN[norm(el.getAttribute(a) || "")];
        if (v) el.setAttribute(a, v);
      });
    });
    $$("[data-en]").forEach((el) => { if (el.dataset.en) el.textContent = el.dataset.en; });
    document.title = EN[norm(document.title)] || document.title;
  }

  function prepararSelectorIdioma() {
    $$("[data-idioma]").forEach((a) => {
      const destino = LANG === "en" ? "es" : "en";
      a.href = "?lang=" + destino;
      a.hreflang = destino;
      a.lang = destino;
      a.textContent = a.classList.contains("idioma--hoja") ? (destino === "en" ? "English" : "Español") : destino.toUpperCase();
      a.setAttribute("aria-label", destino === "en" ? "Read in English" : "Ver en español");
    });
  }

  function cargarIdioma(listo) {
    prepararSelectorIdioma();
    if (LANG !== "en") return listo();
    const src = document.currentScript?.dataset.i18nSrc || $("script[data-i18n-src]")?.dataset.i18nSrc;
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => { EN = window.I18N_EN || {}; aplicarIdioma(); raiz.classList.remove("i18n-cargando"); listo(); };
    s.onerror = () => { raiz.classList.remove("i18n-cargando"); listo(); };
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------ horas y fechas */
  const aMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const aHorario = (lista) => lista.map((d) => (d ? { abre: aMin(d.abre), cierra: aMin(d.cierra) } : null));
  const HORARIO_SITIO = aHorario(S.horario);
  const HORARIO = HORARIO_SITIO;
  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const DIAS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const MESES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  /** Fecha y hora actuales en Santo Domingo, sin importar la hora del teléfono. */
  function ahoraSD(fecha = new Date()) {
    const partes = new Intl.DateTimeFormat("en-US", {
      timeZone: S.zonaHoraria, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(fecha);
    const p = (tipo) => partes.find((x) => x.type === tipo).value;
    const dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { dia: dias[p("weekday")], min: (Number(p("hour")) % 24) * 60 + Number(p("minute")), y: Number(p("year")), m: Number(p("month")), d: Number(p("day")) };
  }

  /** 7:00 a. m. · 9:30 p. m. · medianoche (o 7:00 AM en inglés) */
  function fmtHora(min) {
    min = Math.round(min);
    if (min % 1440 === 0) return LANG === "en" ? "midnight" : "medianoche";
    const m = ((min % 1440) + 1440) % 1440;
    const h24 = Math.floor(m / 60);
    const mm = String(m % 60).padStart(2, "0");
    const h12 = h24 % 12 || 12;
    return LANG === "en" ? `${h12}:${mm} ${h24 < 12 ? "AM" : "PM"}` : `${h12}:${mm} ${h24 < 12 ? "a. m." : "p. m."}`;
  }
  const art = (min) => (min % 1440 === 0 || Math.floor((min % 1440) / 60) % 12 === 1 ? "la" : "las");
  const conArt = (min) => (LANG === "en" ? fmtHora(min) : `${art(min)} ${fmtHora(min)}`);
  /** Igual que conArt pero cerrando la frase: «a las 5:30 p. m.» no lleva otro punto. */
  const conArtP = (min) => { const s = conArt(min); return s.endsWith(".") ? s : s + "."; };
  const iso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const sumarDias = (s, n) => { const [y, m, d] = s.split("-").map(Number); const f = new Date(Date.UTC(y, m - 1, d + n)); return iso(f.getUTCFullYear(), f.getUTCMonth() + 1, f.getUTCDate()); };
  const diaSemana = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
  const hoySD = () => { const a = ahoraSD(); return iso(a.y, a.m, a.d); };
  function fechaLarga(s) {
    const [, m, d] = s.split("-").map(Number);
    const ds = diaSemana(s);
    return LANG === "en" ? `${DIAS_EN[ds]}, ${MESES_EN[m - 1]} ${d}` : `${DIAS[ds]} ${d} de ${MESES[m - 1]}`;
  }
  const duracion = (min) => {
    const h = Math.floor(min / 60), m = Math.round(min % 60);
    if (LANG === "en") return h ? `${h} h ${m} min` : `${m} min`;
    return h ? `${h} h ${m} min` : `${m} min`;
  };

  /* ------------------------------------------------------------ estado abierto/cerrado */
  function calcularEstado(fecha = new Date(), HOR = HORARIO_SITIO) {
    const { dia, min } = ahoraSD(fecha);
    const ayer = HOR[(dia + 6) % 7];
    let cierre = null;
    if (ayer && ayer.cierra > 1440 && min < ayer.cierra - 1440) cierre = ayer.cierra - 1440;
    const hoy = HOR[dia];
    if (cierre === null && hoy && min >= hoy.abre && min < hoy.cierra) cierre = hoy.cierra;
    if (cierre !== null) {
      if (cierre - min <= 30) return { tipo: "pronto", corto: LANG === "en" ? "Closing soon" : "Cierra pronto", texto: LANG === "en" ? `Closing soon · at ${fmtHora(cierre)}` : `Cierra pronto · a ${conArt(cierre)}` };
      return { tipo: "abierto", corto: LANG === "en" ? "Open now" : "Abierto ahora", texto: LANG === "en" ? `Open now · until ${fmtHora(cierre)}` : `Abierto ahora · hasta ${conArt(cierre)}` };
    }
    if (hoy && min < hoy.abre) {
      return { tipo: "cerrado", corto: LANG === "en" ? `Opens ${fmtHora(hoy.abre)}` : `Abre ${fmtHora(hoy.abre)}`, texto: LANG === "en" ? `Opens today at ${fmtHora(hoy.abre)}` : `Abre hoy a ${conArt(hoy.abre)}` };
    }
    for (let k = 1; k <= 7; k++) {
      const d = (dia + k) % 7;
      if (HOR[d]) {
        const cuando = k === 1 ? (LANG === "en" ? "tomorrow" : "mañana") : (LANG === "en" ? DIAS_EN[d] : "el " + DIAS[d]);
        return { tipo: "cerrado", corto: LANG === "en" ? "Closed now" : "Cerrado ahora", texto: LANG === "en" ? `Opens ${cuando} at ${fmtHora(HOR[d].abre)}` : `Abre ${cuando} a ${conArt(HOR[d].abre)}` };
      }
    }
    return { tipo: "cerrado", corto: t("Cerrado"), texto: t("Cerrado") };
  }
  // Para probar: patioEstado(new Date("2026-10-09T23:45:00-04:00")), con un horario opcional (formato de config.js)
  window.patioEstado = (fecha, horario) => calcularEstado(fecha, horario ? aHorario(horario) : HORARIO_SITIO);

  function pintarEstado() {
    const e = calcularEstado();
    $$("[data-estado]").forEach((el) => {
      el.dataset.tipo = e.tipo;
      const txt = el.querySelector("[data-estado-texto]");
      if (txt) txt.textContent = e.texto;
      const corto = el.querySelector("[data-estado-corto]");
      if (corto) corto.textContent = e.corto;
    });
    const { dia } = ahoraSD();
    $$(".horario__tabla tr").forEach((tr) => {
      const esHoy = Number(tr.dataset.dia) === dia;
      tr.classList.toggle("es-hoy", esHoy);
      const th = tr.querySelector("th");
      if (th) th.dataset.hoy = LANG === "en" ? "Today" : "Hoy";
      if (esHoy) tr.setAttribute("aria-current", "date"); else tr.removeAttribute("aria-current");
    });
  }

  /* ------------------------------------------------------------ el sol sobre la bahía */
  /** Salida o puesta del sol (minutos desde medianoche, hora de Santo Domingo, UTC-4)
      para una fecha YYYY-MM-DD en las coordenadas del restaurante. Algoritmo NOAA. */
  function horaSol(fechaISO, salida) {
    const [y, m, d] = fechaISO.split("-").map(Number);
    const N = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 864e5);
    const rad = Math.PI / 180, deg = 180 / Math.PI;
    const lat = S.geo.lat, lngHora = S.geo.lng / 15;
    const tt = N + ((salida ? 6 : 18) - lngHora) / 24;
    const M = 0.9856 * tt - 3.289;
    let L = M + 1.916 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 282.634;
    L = ((L % 360) + 360) % 360;
    let RA = deg * Math.atan(0.91764 * Math.tan(L * rad));
    RA = ((RA % 360) + 360) % 360;
    RA = (RA + Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90) / 15;
    const sinDec = 0.39782 * Math.sin(L * rad);
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (Math.cos(90.833 * rad) - sinDec * Math.sin(lat * rad)) / (cosDec * Math.cos(lat * rad));
    let H = deg * Math.acos(cosH);
    if (salida) H = 360 - H;
    const T = H / 15 + RA - 0.06571 * tt - 6.622;
    let utc = (T - lngHora) % 24;
    if (utc < 0) utc += 24;
    let local = (utc - 4) % 24;
    if (local < 0) local += 24;
    return local * 60;
  }
  window.patioSol = (fecha) => ({ sale: fmtHora(horaSol(fecha, true)), pone: fmtHora(horaSol(fecha, false)) });

  const redondear = (min, paso) => Math.floor(min / paso) * paso;
  /** Hora sugerida para llegar: antes de la puesta, en múltiplos del intervalo de reservas. */
  const llegadaSugerida = (fecha) => redondear(horaSol(fecha, false) - S.atardecer.llegarAntes, S.reservas.intervalo);

  function textoAtardecerHoy() {
    const hoy = hoySD();
    const pone = horaSol(hoy, false);
    const ahora = ahoraSD().min;
    if (ahora > pone + 15) {
      const man = horaSol(sumarDias(hoy, 1), false);
      return LANG === "en" ? `Tomorrow's sunset: ${fmtHora(man)}` : `Atardecer de mañana: ${fmtHora(man)}`;
    }
    return LANG === "en" ? `Today's sunset: ${fmtHora(pone)}` : `Atardecer hoy: ${fmtHora(pone)}`;
  }

  let fechaSol = null;
  function pintarSol() {
    $$("[data-atardecer-texto]").forEach((el) => { el.textContent = textoAtardecerHoy(); });
    const caja = $("[data-atardecer]");
    if (!caja) return;
    const hoy = hoySD();
    const fecha = fechaSol || hoy;
    const esHoy = fecha === hoy;
    const sale = horaSol(fecha, true);
    const pone = horaSol(fecha, false);
    const ahora = ahoraSD().min;
    $("[data-sol-puesta]", caja).textContent = fmtHora(pone);
    $("[data-sol-sale-txt]", caja).textContent = (LANG === "en" ? "Sunrise " : "Sale ") + fmtHora(sale);
    $("[data-sol-pone-txt]", caja).textContent = (LANG === "en" ? "Sunset " : "Se pone ") + fmtHora(pone);
    const falta = $("[data-sol-falta]", caja);
    const consejo = $("[data-sol-consejo]", caja);
    const llegar = llegadaSugerida(fecha);
    let p;
    if (!esHoy) {
      p = 1;
      falta.textContent = LANG === "en" ? `On ${fechaLarga(fecha)}.` : `El ${fechaLarga(fecha)}.`;
      consejo.textContent = LANG === "en" ? `To watch it from your table, arrive by ${fmtHora(llegar)}.` : `Para verlo desde la mesa, llega a ${conArtP(llegar)}`;
    } else if (ahora < sale) {
      p = 0;
      falta.textContent = LANG === "en" ? `The sun isn't up yet. It sets in ${duracion(pone - ahora)}.` : `El sol todavía no ha salido. Se pone en ${duracion(pone - ahora)}.`;
      consejo.textContent = LANG === "en" ? `Arrive by ${fmtHora(llegar)} to catch it from your table.` : `Llega a ${conArt(llegar)} para verlo desde la mesa.`;
    } else if (ahora < pone - 10) {
      p = (ahora - sale) / (pone - sale);
      falta.textContent = LANG === "en" ? `${duracion(pone - ahora)} to go.` : `Faltan ${duracion(pone - ahora)}.`;
      consejo.textContent = ahora < llegar
        ? (LANG === "en" ? `To watch it from your table, arrive by ${fmtHora(llegar)}.` : `Para verlo desde la mesa, llega a ${conArtP(llegar)}`)
        : (LANG === "en" ? "It's close: come now and ask for a table on the sand." : "Ya casi: ven ahora y pide una mesa en la arena.");
    } else if (ahora <= pone + 15) {
      p = Math.min(1, (ahora - sale) / (pone - sale));
      falta.textContent = LANG === "en" ? "The sun is setting right now over the bay." : "El sol se está poniendo ahora mismo sobre la bahía.";
      consejo.textContent = "";
    } else {
      p = 1.04;
      const man = horaSol(sumarDias(hoy, 1), false);
      falta.textContent = LANG === "en" ? `Today it already set. Tomorrow it sets at ${fmtHora(man)}.` : `Hoy ya se puso. Mañana se pone a ${conArtP(man)}`;
      consejo.textContent = LANG === "en" ? "The bar stays open until midnight." : "La barra sigue abierta hasta la medianoche.";
    }
    // posición del sol sobre la curva (Bézier cuadrática del SVG)
    const P0 = [48, 214], P1 = [320, -110], P2 = [592, 214];
    const q = Math.max(-0.04, Math.min(1.04, p));
    const x = (1 - q) ** 2 * P0[0] + 2 * (1 - q) * q * P1[0] + q ** 2 * P2[0];
    const y = (1 - q) ** 2 * P0[1] + 2 * (1 - q) * q * P1[1] + q ** 2 * P2[1];
    const punto = $("[data-sol-punto]", caja), brillo = $("[data-sol-brillo]", caja);
    punto.setAttribute("cx", x.toFixed(1)); punto.setAttribute("cy", y.toFixed(1));
    brillo.setAttribute("cx", x.toFixed(1)); brillo.setAttribute("cy", y.toFixed(1));
    caja.classList.toggle("atardecer--noche", q > 1 || q <= 0);
    $("[data-sol-recorrido]", caja).style.strokeDashoffset = String(100 - Math.max(0, Math.min(1, q)) * 100);
    $("[data-sol-resumen]", caja).textContent = LANG === "en"
      ? `Sun path over Bayahíbe bay: rises at ${fmtHora(sale)}, sets at ${fmtHora(pone)}.`
      : `Recorrido del sol sobre la bahía de Bayahíbe: sale a ${conArt(sale)} y se pone a ${conArtP(pone)}`;
  }

  function prepararSol() {
    const input = $("[data-sol-fecha]");
    if (input) {
      const hoy = hoySD();
      input.min = hoy;
      input.max = sumarDias(hoy, 365);
      input.value = hoy;
      input.addEventListener("change", () => { fechaSol = input.value && input.value >= hoy ? input.value : null; pintarSol(); });
    }
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-reservar-atardecer]");
      if (!b) return;
      const hoy = hoySD();
      let fecha = fechaSol || hoy;
      if (fecha === hoy && ahoraSD().min > llegadaSugerida(hoy) - 30) fecha = sumarDias(hoy, 1);
      abrirReserva({ fecha, hora: llegadaSugerida(fecha), ocasion: "Ver el atardecer", area: "En la arena, frente al agua" });
    });
    pintarSol();
  }

  /* ------------------------------------------------------------ utilidades */
  let avisoTimer;
  function avisar(texto) {
    const el = $("[data-aviso]");
    if (!el) return;
    el.textContent = texto;
    el.classList.add("visible");
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => el.classList.remove("visible"), 2600);
  }
  const abrirWhatsApp = (texto) => {
    const url = `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(texto)}`;
    const w = window.open(url, "_blank", "noopener");
    if (!w) location.href = url;
    return url;
  };
  window.patioUltimoWhatsApp = null;

  /* ------------------------------------------------------------ diálogos */
  function abrirDialogo(dlg) {
    if (!dlg || dlg.open) return;
    dlg.showModal();
    document.body.classList.add("con-dialogo");
  }
  function prepararDialogos() {
    $$("dialog").forEach((dlg) => {
      dlg.addEventListener("close", () => { if (!$$("dialog").some((d) => d.open)) document.body.classList.remove("con-dialogo"); });
      dlg.addEventListener("click", (e) => {
        if (e.target === dlg && !dlg.classList.contains("visor")) dlg.close();
        if (e.target.closest("[data-cerrar]")) dlg.close();
      });
    });
  }

  /* ------------------------------------------------------------ encabezado y navegación */
  function prepararCabecera() {
    const cab = $("[data-cabecera]");
    if (!cab) return;
    const sobreHero = document.body.classList.contains("pagina-inicio");
    const revisar = () => cab.classList.toggle("cabecera--sobre", sobreHero && scrollY < 40);
    revisar();
    addEventListener("scroll", revisar, { passive: true });
  }

  function prepararNav() {
    const hoja = $("#hoja-nav");
    const boton = $("[data-abrir-nav]");
    if (!hoja || !boton) return;
    boton.addEventListener("click", () => { abrirDialogo(hoja); boton.setAttribute("aria-expanded", "true"); });
    hoja.addEventListener("close", () => boton.setAttribute("aria-expanded", "false"));
    $$("a", hoja).forEach((a) => a.addEventListener("click", () => hoja.close()));
    matchMedia("(min-width: 1024px)").addEventListener("change", (e) => { if (e.matches && hoja.open) hoja.close(); });
  }

  function prepararBarra() {
    const barra = $("[data-barra]");
    if (!barra) return;
    let ultimo = scrollY;
    let pendiente = false;
    const revisar = () => {
      const y = scrollY;
      const alFinal = innerHeight + y >= document.documentElement.scrollHeight - 40;
      if (alFinal || y < 120 || y < ultimo - 6) barra.classList.remove("oculta");
      else if (y > ultimo + 6) barra.classList.add("oculta");
      ultimo = y;
      pendiente = false;
    };
    addEventListener("scroll", () => { if (!pendiente) { pendiente = true; requestAnimationFrame(revisar); } }, { passive: true });
  }

  function prepararContadores() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-contador] [data-menos], [data-contador] [data-mas]");
      if (!btn) return;
      const input = btn.closest("[data-contador]").querySelector("input");
      const min = Number(input.min || 1), max = Number(input.max || 20);
      input.value = Math.max(min, Math.min(max, (parseInt(input.value, 10) || min) + (btn.hasAttribute("data-mas") ? 1 : -1)));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  /* ------------------------------------------------------------ reservas */
  function horasDelDia(fecha) {
    const h = HORARIO[diaSemana(fecha)];
    if (!h) return [];
    const r = S.reservas;
    let desde = h.abre;
    if (fecha === hoySD()) desde = Math.max(desde, Math.ceil((ahoraSD().min + 30) / r.intervalo) * r.intervalo);
    const lista = [];
    for (let m = desde; m <= h.cierra - r.minutosAntesDelCierre; m += r.intervalo) lista.push(m);
    return lista;
  }

  function rellenarHoras(form, preferida) {
    const sel = form.elements.hora;
    const fecha = form.elements.fecha.value;
    const anterior = preferida ?? Number(sel.value);
    const horas = fecha ? horasDelDia(fecha) : [];
    const ayuda = $("[data-hora-ayuda]", form);
    const sol = $("[data-fecha-sol]", form);
    sel.innerHTML = "";
    if (sol) sol.textContent = fecha ? (LANG === "en" ? `Sunset that day: ${fmtHora(horaSol(fecha, false))}` : `Ese día el sol se pone a ${conArtP(horaSol(fecha, false))}`) : "";
    if (!horas.length) {
      sel.innerHTML = `<option value="">${t("Sin horarios ese día")}</option>`;
      ayuda.textContent = fecha === hoySD() ? t("Por hoy ya no tomamos reservas. Prueba con mañana.") : "";
      return;
    }
    const sugerida = llegadaSugerida(fecha);
    const marca = LANG === "en" ? " · sunset" : " · atardecer";
    sel.innerHTML = `<option value="">${t("Escoge una hora")}</option>` + horas.map((m) => `<option value="${m}">${m === 1440 ? (LANG === "en" ? "Midnight" : "Medianoche") : fmtHora(m)}${m === sugerida ? marca : ""}</option>`).join("");
    if (horas.includes(Number(anterior))) sel.value = String(anterior);
    ayuda.textContent = horas.includes(sugerida) ? (LANG === "en" ? `For the sunset, book ${fmtHora(sugerida)}.` : `Para el atardecer, reserva a ${conArtP(sugerida)}`) : "";
  }

  function error(form, campo, texto) {
    const el = form.elements[campo];
    const caja = el.closest(".campo");
    const p = $(`#${el.id}-error`);
    caja?.classList.toggle("con-error", Boolean(texto));
    if (texto) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
    if (p) p.textContent = texto || "";
    return !texto;
  }

  function abrirReserva(op = {}) {
    const dlg = $("#dialogo-reserva");
    const form = $("[data-form-reserva]");
    if (!dlg || !form) return;
    const hoy = hoySD();
    const f = form.elements.fecha;
    f.min = hoy;
    f.max = sumarDias(hoy, S.reservas.diasAdelante);
    if (op.fecha) f.value = op.fecha;
    else if (!f.value || f.value < hoy) f.value = horasDelDia(hoy).length ? hoy : sumarDias(hoy, 1);
    form.elements.personas.max = S.reservas.maxPersonas;
    if (op.ocasion) form.elements.ocasion.value = op.ocasion;
    if (op.area) form.elements.area.value = op.area;
    rellenarHoras(form, op.hora);
    ["fecha", "hora", "nombre"].forEach((c) => error(form, c, ""));
    abrirDialogo(dlg);
  }

  function prepararReservas() {
    const form = $("[data-form-reserva]");
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-abrir-reserva]");
      if (b) { e.preventDefault(); $("#hoja-nav")?.close(); abrirReserva({ ocasion: b.dataset.ocasion }); }
    });
    if (!form) return;
    form.elements.fecha.addEventListener("change", () => { rellenarHoras(form); error(form, "fecha", ""); });
    form.elements.hora.addEventListener("change", () => error(form, "hora", ""));
    form.elements.nombre.addEventListener("input", () => error(form, "nombre", ""));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const el = form.elements;
      const hoy = hoySD();
      let ok = true;
      if (!el.fecha.value) ok = error(form, "fecha", t("Elige la fecha.")) && ok;
      else if (el.fecha.value < hoy) ok = error(form, "fecha", t("Esa fecha ya pasó. Elige hoy o un día próximo.")) && ok;
      else if (el.fecha.value > el.fecha.max) ok = error(form, "fecha", t("Reservamos hasta con 90 días de anticipación.")) && ok;
      if (!el.hora.value) ok = error(form, "hora", t("Escoge una hora.")) && ok;
      if (el.nombre.value.trim().length < 2) ok = error(form, "nombre", t("Escribe tu nombre para la reserva.")) && ok;
      if (!ok) { form.querySelector("[aria-invalid='true']")?.focus(); return; }
      const personas = Math.max(1, Math.min(S.reservas.maxPersonas, parseInt(el.personas.value, 10) || 1));
      const hora = Number(el.hora.value);
      const notas = el.notas.value.trim();
      const pone = horaSol(el.fecha.value, false);
      const nl = "\n";
      const txt = LANG === "en"
        ? `Hello, El Patio Beach Club! I'd like to book a table:${nl}${nl}*Date:* ${fechaLarga(el.fecha.value)}${nl}*Time:* ${fmtHora(hora)}${nl}*Guests:* ${personas}${nl}*Where:* ${t(el.area.value)}${nl}` +
          (el.ocasion.value ? `*Occasion:* ${t(el.ocasion.value)}${nl}` : "") + `*Name:* ${el.nombre.value.trim()}${nl}` + (notas ? `*Notes:* ${notas}${nl}` : "") +
          `${nl}(Sunset that day: ${fmtHora(pone)})${nl}${nl}Thank you!`
        : `Hola, El Patio Beach Club. Quisiera reservar una mesa:${nl}${nl}*Fecha:* ${fechaLarga(el.fecha.value)}${nl}*Hora:* ${fmtHora(hora)}${nl}*Personas:* ${personas}${nl}*Dónde:* ${el.area.value}${nl}` +
          (el.ocasion.value ? `*Ocasión:* ${el.ocasion.value}${nl}` : "") + `*A nombre de:* ${el.nombre.value.trim()}${nl}` + (notas ? `*Notas:* ${notas}${nl}` : "") +
          `${nl}(Ese día el sol se pone a ${conArt(pone)})${nl}${nl}¡Gracias!`;
      window.patioUltimoWhatsApp = abrirWhatsApp(txt);
      $("#dialogo-reserva").close();
      avisar(t("Abrimos WhatsApp con tu reserva"));
    });
  }

  /* ------------------------------------------------------------ cotización de eventos */
  function prepararEventos() {
    const form = $("[data-form-evento]");
    if (!form) return;
    const hoy = hoySD();
    form.elements.fecha.min = hoy;
    const sol = $("[data-fecha-evento-sol]");
    form.elements.fecha.addEventListener("change", () => {
      const f = form.elements.fecha.value;
      if (sol) sol.textContent = f ? (LANG === "en" ? `That day the sun sets at ${fmtHora(horaSol(f, false))}: plan the group photo for then.` : `Ese día el sol se pone a ${conArt(horaSol(f, false))}: planifica la foto del grupo para esa hora.`) : "";
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const el = form.elements;
      let ok = true;
      if (!el.fecha.value) ok = error(form, "fecha", t("Elige la fecha.")) && ok;
      else if (el.fecha.value < hoy) ok = error(form, "fecha", t("Esa fecha ya pasó. Elige hoy o un día próximo.")) && ok;
      else error(form, "fecha", "");
      const p = parseInt(el.personas.value, 10);
      if (!p || p < 2) ok = error(form, "personas", t("Indica cuántas personas, mínimo 2.")) && ok;
      else error(form, "personas", "");
      if (el.nombre.value.trim().length < 2) ok = error(form, "nombre", t("Escribe tu nombre.")) && ok;
      else error(form, "nombre", "");
      if (!ok) { form.querySelector("[aria-invalid='true']")?.focus(); return; }
      const nl = "\n";
      const det = el.detalles.value.trim();
      const pone = fmtHora(horaSol(el.fecha.value, false));
      const txt = LANG === "en"
        ? `Hello, El Patio Beach Club! I'd like a quote for an event:${nl}${nl}*Event:* ${t(el.tipo.value)}${nl}*Date:* ${fechaLarga(el.fecha.value)} (sunset ${pone})${nl}*Guests:* ${p}${nl}*When:* ${t(el.momento.value)}${nl}*Format:* ${t(el.formato.value)}${nl}*Name:* ${el.nombre.value.trim()}${nl}` + (det ? `*Details:* ${det}${nl}` : "") + `${nl}Thank you!`
        : `Hola, El Patio Beach Club. Quisiera cotizar un evento:${nl}${nl}*Evento:* ${el.tipo.value}${nl}*Fecha:* ${fechaLarga(el.fecha.value)} (atardecer ${pone})${nl}*Personas:* ${p}${nl}*Momento:* ${el.momento.value}${nl}*Formato:* ${el.formato.value}${nl}*A nombre de:* ${el.nombre.value.trim()}${nl}` + (det ? `*Detalles:* ${det}${nl}` : "") + `${nl}¡Gracias!`;
      window.patioUltimoWhatsApp = abrirWhatsApp(txt);
      avisar(t("Abrimos WhatsApp con tu cotización"));
    });
  }

  /* ------------------------------------------------------------ carrusel */
  function prepararCarruseles() {
    $$("[data-carrusel]").forEach((car) => {
      const pista = $("[data-pista]", car);
      const seccion = car.closest("section") || document;
      const ant = $("[data-flechas] [data-ant]", seccion);
      const sig = $("[data-flechas] [data-sig]", seccion);
      const barra = $("[data-progreso]", car);
      const actualizar = () => {
        const max = pista.scrollWidth - pista.clientWidth;
        if (ant) ant.disabled = pista.scrollLeft <= 2;
        if (sig) sig.disabled = pista.scrollLeft >= max - 2;
        if (barra) barra.style.transform = `scaleX(${Math.min(1, (pista.scrollLeft + pista.clientWidth) / pista.scrollWidth)})`;
        car.classList.toggle("carrusel--quieto", max <= 2);
      };
      const mover = (dir) => pista.scrollBy({ left: dir * pista.clientWidth, behavior: comportamiento });
      ant?.addEventListener("click", () => mover(-1));
      sig?.addEventListener("click", () => mover(1));
      pista.addEventListener("scroll", () => requestAnimationFrame(actualizar), { passive: true });
      addEventListener("resize", actualizar);
      actualizar();
      let x0 = 0, s0 = 0, activo = false, movio = false;
      pista.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        activo = true; movio = false; x0 = e.clientX; s0 = pista.scrollLeft;
      });
      addEventListener("pointermove", (e) => {
        if (!activo) return;
        const dx = e.clientX - x0;
        if (!movio && Math.abs(dx) > 5) { movio = true; car.classList.add("arrastrando"); }
        if (movio) { pista.scrollLeft = s0 - dx; e.preventDefault(); }
      });
      addEventListener("pointerup", () => {
        if (!activo) return;
        activo = false;
        if (movio) {
          car.classList.remove("arrastrando");
          const tarjeta = pista.firstElementChild;
          if (tarjeta) {
            const paso = tarjeta.getBoundingClientRect().width + parseFloat(getComputedStyle(pista).columnGap || 0);
            pista.scrollTo({ left: Math.round(pista.scrollLeft / paso) * paso, behavior: comportamiento });
          }
        }
      });
      pista.addEventListener("click", (e) => { if (movio) { e.preventDefault(); e.stopPropagation(); movio = false; } }, true);
      pista.addEventListener("dragstart", (e) => e.preventDefault());
    });
  }

  /* ------------------------------------------------------------ galería y visor */
  function prepararGaleria() {
    const visor = $("#visor");
    if (!visor || !$("[data-galeria]")) return;
    const img = $("[data-visor-img]", visor);
    const texto = $("[data-visor-texto]", visor);
    const cuenta = $("[data-visor-cuenta]", visor);
    let lista = [];
    let i = 0;
    const mostrar = (n) => {
      i = (n + lista.length) % lista.length;
      const b = lista[i];
      const mini = b.querySelector("img");
      img.src = b.dataset.grande;
      img.alt = mini.alt;
      texto.textContent = mini.alt;
      cuenta.textContent = `${i + 1} / ${lista.length}`;
      [lista[(i + 1) % lista.length], lista[(i - 1 + lista.length) % lista.length]].forEach((v) => { const p = new Image(); p.src = v.dataset.grande; });
    };
    document.addEventListener("click", (e) => {
      const b = e.target.closest(".mosaico__boton");
      if (!b) return;
      lista = $$(".mosaico__boton", b.closest("[data-galeria]")).filter((x) => !x.closest("li").hidden);
      mostrar(lista.indexOf(b));
      abrirDialogo(visor);
    });
    $("[data-visor-ant]", visor).addEventListener("click", () => mostrar(i - 1));
    $("[data-visor-sig]", visor).addEventListener("click", () => mostrar(i + 1));
    visor.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); mostrar(i - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); mostrar(i + 1); }
    });
    let x0 = null;
    const fig = $(".visor__figura", visor);
    fig.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
    fig.addEventListener("pointerup", (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) mostrar(i + (dx < 0 ? 1 : -1));
    });
    const filtros = $("[data-galeria-filtros]");
    filtros?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-filtro]");
      if (!b) return;
      $$("[data-filtro]", filtros).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $$("[data-galeria] li").forEach((li) => { li.hidden = b.dataset.filtro !== "todo" && li.dataset.cat !== b.dataset.filtro; });
    });
  }

  /* ------------------------------------------------------------ mapa bajo demanda */
  function prepararMapa() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cargar-mapa]");
      if (!b) return;
      const caja = b.closest("[data-mapa]");
      const f = document.createElement("iframe");
      f.src = S.enlaces.mapaEmbed;
      f.title = t("Mapa de El Patio Beach Club en Google Maps");
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      f.allowFullscreen = true;
      caja.innerHTML = "";
      caja.appendChild(f);
    });
  }

  /* ------------------------------------------------------------ apariciones suaves */
  function prepararApariciones() {
    if (sinMovimiento || !("IntersectionObserver" in window)) return;
    const els = $$(".seccion .encabezado, .atardecer__texto, .lugar__foto, .cita, .tipo, .eventos-teaser__texto");
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("visto"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.setAttribute("data-aparece", "");
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------ inicio */
  function iniciar() {
    prepararDialogos();
    prepararCabecera();
    prepararNav();
    prepararBarra();
    prepararContadores();
    prepararReservas();
    prepararEventos();
    prepararSol();
    prepararCarruseles();
    prepararGaleria();
    prepararMapa();
    prepararApariciones();
    pintarEstado();
    setInterval(() => { pintarEstado(); pintarSol(); }, 60 * 1000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { pintarEstado(); pintarSol(); } });
    window.patioT = t;
    window.patioLang = LANG;
    document.dispatchEvent(new CustomEvent("patio:listo", { detail: { lang: LANG } }));
  }

  cargarIdioma(iniciar);
})();
