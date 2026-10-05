/* =====================================================================
   El Patio Beach Club · la carta
   Lo único que se edita para cambiar platos y precios.
   - precio: número en RD$ (sin comas). Para tamaños: sizes: [{ n: "Para 2", p: 2900 }, ...]
   - nota: texto corto junto al precio («según tamaño»)
   - tags: "popular", "compartir", "veg", "picante", "nuevo"
   - foto: nombre de la imagen en assets/img (sin -480.webp), opcional
   - en / desc_en / nota_en: versión en inglés
   - fuente: de dónde sale el plato (no se muestra; sirve para el README)

   IMPORTANTE: el restaurante no tiene carta publicada. Los platos salen de
   reseñas y fotos reales; los PRECIOS SON DE REFERENCIA (propuestos) hasta
   que el cliente envíe su carta. Mientras preciosConfirmados sea false, la
   página muestra «Precios de referencia».
   ===================================================================== */
window.CARTA = {
  preciosConfirmados: false,
  categorias: [
    {
      id: "para-picar", nombre: "Para picar", en: "To start",
      items: [
        { id: "calamares-fritos", nombre: "Calamares fritos", en: "Fried calamari", precio: 650, tags: [], foto: "calamares-fritos",
          desc: "Anillos de calamar dorados, con limón y salsa para mojar.",
          desc_en: "Golden squid rings with lime and dipping sauce.",
          fuente: "Foto del restaurante en Tripadvisor" },
        { id: "bruschetta", nombre: "Bruschetta de tomate y albahaca", en: "Tomato & basil bruschetta", precio: 390, tags: ["veg"],
          desc: "Pan tostado con tomate fresco y albahaca.",
          desc_en: "Toasted bread with fresh tomato and basil.",
          fuente: "Reseña de John H en Tripadvisor (2015)" },
        { id: "tostones", nombre: "Tostones", en: "Tostones", precio: 250, tags: ["veg", "compartir"],
          desc: "Plátano verde frito, bien crujiente.",
          desc_en: "Crispy fried green plantains.",
          fuente: "Reseña de ecosur en Tripadvisor (2017)" }
      ]
    },
    {
      id: "del-mar", nombre: "Del mar", en: "From the sea",
      items: [
        { id: "paella-mariscos", nombre: "Paella de mariscos", en: "Seafood paella", precio: 1450, tags: ["popular"], foto: "paella-mariscos",
          desc: "Arroz con camarones, calamar, mejillones y langosta, servido en la paellera.",
          desc_en: "Rice with shrimp, squid, mussels and lobster, served in the pan.",
          fuente: "Reseñas de ecosur y Jennykola en Tripadvisor; foto del restaurante" },
        { id: "langosta-parrilla", nombre: "Langosta a la parrilla", en: "Grilled lobster", precio: 1950, nota: "según tamaño", nota_en: "by size", tags: ["popular"], foto: "langosta-parrilla",
          desc: "Langosta del Caribe a la parrilla, con limón.",
          desc_en: "Grilled Caribbean lobster with lime.",
          fuente: "Reseñas de Tanya H y Nerio T en Tripadvisor; foto del restaurante" },
        { id: "pescado-frito", nombre: "Pescado frito entero", en: "Whole fried fish", precio: 1200, nota: "según tamaño", nota_en: "by size", tags: ["popular"], foto: "pescado-frito",
          desc: "Pescado fresco frito entero, con papas fritas y limón.",
          desc_en: "Whole fresh fish, fried, with fries and lime.",
          fuente: "Reseña de ScubaTravelers en Tripadvisor (2023); foto" },
        { id: "parrillada-mariscos", nombre: "Parrillada de mariscos", en: "Seafood grill platter", precio: 2450, tags: ["compartir"],
          desc: "Pulpo, calamar, dorado y langosta a la parrilla, para compartir.",
          desc_en: "Grilled octopus, squid, mahi-mahi and lobster, to share.",
          fuente: "Reseña de John H en Tripadvisor (2015)" },
        { id: "langostinos-plancha", nombre: "Langostinos a la plancha", en: "Griddled king prawns", precio: 1350, tags: [],
          desc: "Langostinos enteros a la plancha.",
          desc_en: "Whole king prawns on the griddle.",
          fuente: "Reseña de ScubaTravelers en Tripadvisor (2023)" },
        { id: "pasta-langosta", nombre: "Pasta con langosta", en: "Lobster pasta", precio: 1650, tags: [],
          desc: "Pasta con langosta en su punto.",
          desc_en: "Pasta with perfectly cooked lobster.",
          fuente: "Reseña de John H en Tripadvisor (2015)" }
      ]
    },
    {
      id: "para-beber", nombre: "Para beber", en: "Drinks",
      items: [
        { id: "mai-tai", nombre: "Mai Tai", en: "Mai Tai", precio: 450, tags: ["popular"],
          desc: "El cóctel que recomiendan las reseñas.",
          desc_en: "The cocktail reviewers tell you to try.",
          fuente: "Reseña de Tanya H en Tripadvisor (2016)" },
        { id: "vino-rosado", nombre: "Copa de vino rosado", en: "Glass of rosé", precio: 450, tags: [],
          desc: "Para brindar cuando el sol toca el agua.",
          desc_en: "For a toast as the sun meets the water.",
          fuente: "Reseña de Nerio T en Tripadvisor (2025)" },
        { id: "cerveza", nombre: "Cerveza bien fría", en: "Ice-cold beer", precio: 200, tags: [],
          desc: "Cerveza nacional, del cubo al vaso.",
          desc_en: "Local beer, straight from the ice bucket.",
          fuente: "Reseñas en Google (vía Wanderlog)" },
        { id: "espresso", nombre: "Espresso", en: "Espresso", precio: 120, tags: [],
          desc: "Para cerrar la comida frente al mar.",
          desc_en: "To finish your meal by the sea.",
          fuente: "Reseña de Ana Sylvia Troccoli en Tripadvisor (2015)" }
      ]
    }
  ]
};
