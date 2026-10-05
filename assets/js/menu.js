/* =====================================================================
   El Patio Beach Club · la carta
   Búsqueda (sin importar tildes ni mayúsculas), filtros, barra de
   categorías con la sección visible resaltada e impresión.
   La carta en sí viene de menu-data.js (tools/build.py la escribe en HTML).
   ===================================================================== */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function iniciar() {
    const en = window.patioLang === "en";
    const buscar = $("[data-buscar]");
    const limpiar = $("[data-limpiar]");
    const filtros = $("[data-filtros]");
    const vacia = $("[data-carta-vacia]");
    const resumen = $("[data-carta-resumen]");
    const cats = $$("[data-cat]");
    const items = $$("[data-item]");
    const pista = $("[data-cat-pista]");
    const enlaces = $$("[data-cat-link]");
    let filtro = "todos";

    /* ---------------- búsqueda y filtros */
    function aplicar() {
      const q = norm(buscar.value);
      const palabras = q.split(/\s+/).filter(Boolean);
      let visibles = 0;
      items.forEach((it) => {
        const pasaFiltro = filtro === "todos" || it.dataset.filtros.split(" ").includes(filtro);
        const pasaTexto = palabras.every((p) => it.dataset.buscar.includes(p));
        const ver = pasaFiltro && pasaTexto;
        it.classList.toggle("oculto", !ver);
        if (ver) visibles++;
      });
      cats.forEach((c) => {
        const alguno = $$("[data-item]:not(.oculto)", c).length > 0;
        c.classList.toggle("oculta", !alguno);
        const link = enlaces.find((l) => l.dataset.catLink === c.id);
        if (link) link.hidden = !alguno;
      });
      vacia.hidden = visibles > 0;
      limpiar.hidden = !buscar.value;
      const total = items.length;
      if (visibles === total) resumen.textContent = "";
      else if (visibles === 0) resumen.textContent = "";
      else resumen.textContent = en
        ? `${visibles} ${visibles === 1 ? "dish" : "dishes"}${q ? ` matching “${buscar.value.trim()}”` : ""}`
        : `${visibles} ${visibles === 1 ? "plato" : "platos"}${q ? ` con «${buscar.value.trim()}»` : ""}`;
      actualizarFlechas();
    }
    buscar.addEventListener("input", aplicar);
    buscar.addEventListener("keydown", (e) => { if (e.key === "Escape" && buscar.value) { buscar.value = ""; aplicar(); } });
    limpiar.addEventListener("click", () => { buscar.value = ""; aplicar(); buscar.focus(); });
    filtros.addEventListener("click", (e) => {
      const b = e.target.closest("[data-filtro]");
      if (!b) return;
      filtro = b.dataset.filtro;
      $$("[data-filtro]", filtros).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      aplicar();
    });
    $("[data-ver-todo]")?.addEventListener("click", () => {
      buscar.value = "";
      filtro = "todos";
      $$("[data-filtro]", filtros).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.filtro === "todos")));
      aplicar();
      buscar.focus();
    });

    /* ---------------- categorías: resaltar la visible */
    const marcar = (id) => {
      enlaces.forEach((l) => {
        const activa = l.dataset.catLink === id;
        l.classList.toggle("activa", activa);
        if (activa) {
          l.setAttribute("aria-current", "location");
          const destino = l.offsetLeft - (pista.clientWidth - l.offsetWidth) / 2;
          pista.scrollTo({ left: destino, behavior: sinMovimiento ? "auto" : "smooth" });
        } else l.removeAttribute("aria-current");
      });
    };
    let actual = null;
    const revisar = () => {
      const tope = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cabecera-h")) || 64) + 90;
      let elegida = null;
      for (const c of cats) {
        if (c.classList.contains("oculta")) continue;
        if (c.getBoundingClientRect().top - tope <= 0) elegida = c;
      }
      if (!elegida) elegida = cats.find((c) => !c.classList.contains("oculta"));
      if (elegida && elegida.id !== actual) { actual = elegida.id; marcar(actual); }
    };
    let pendiente = false;
    addEventListener("scroll", () => { if (!pendiente) { pendiente = true; requestAnimationFrame(() => { revisar(); pendiente = false; }); } }, { passive: true });
    revisar();

    /* ---------------- flechas de la barra de categorías */
    const ant = $("[data-cat-ant]");
    const sig = $("[data-cat-sig]");
    function actualizarFlechas() {
      const max = pista.scrollWidth - pista.clientWidth;
      ant.disabled = pista.scrollLeft <= 2;
      sig.disabled = pista.scrollLeft >= max - 2;
    }
    ant.addEventListener("click", () => pista.scrollBy({ left: -pista.clientWidth * 0.7, behavior: sinMovimiento ? "auto" : "smooth" }));
    sig.addEventListener("click", () => pista.scrollBy({ left: pista.clientWidth * 0.7, behavior: sinMovimiento ? "auto" : "smooth" }));
    pista.addEventListener("scroll", () => requestAnimationFrame(actualizarFlechas), { passive: true });
    addEventListener("resize", actualizarFlechas);
    actualizarFlechas();

    /* ---------------- imprimir */
    $("[data-imprimir]")?.addEventListener("click", () => window.print());

    if (new URLSearchParams(location.search).get("q")) {
      buscar.value = new URLSearchParams(location.search).get("q");
      aplicar();
    }
  }

  if (window.patioLang) iniciar();
  else document.addEventListener("patio:listo", iniciar, { once: true });
})();
