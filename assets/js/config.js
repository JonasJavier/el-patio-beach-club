/* =====================================================================
   El Patio Beach Club · configuración del sitio
   ÚNICO lugar para nombre, contacto, dirección, coordenadas, horario y
   SITE_URL. tools/build.py también lee este archivo (canonical, Open Graph,
   JSON-LD, QR, rutas de GitHub Pages), así que después de cambiar algo corre:
   python tools/build.py
   Formato: JSON dentro de JS. Los comentarios van en líneas propias (//).
   ===================================================================== */
window.SITIO = {
  "nombre": "El Patio Beach Club",
  // Dirección pública del sitio (GitHub Pages). Con dominio propio, cámbiala aquí.
  "SITE_URL": "https://jonasjavier.github.io/el-patio-beach-club",

  "telefono": "+18292610033",
  "telefonoTexto": "829-261-0033",
  "whatsapp": "18292610033",
  "email": "",

  "direccion": {
    "calle": "C. La Bahía #17",
    "sector": "Playa de Bayahíbe",
    "ciudad": "Bayahíbe",
    "provincia": "La Altagracia",
    "codigoPostal": "23000",
    "pais": "DO",
    "referencia": "En la arena de la bahía de Bayahíbe, donde fondean los barcos de Saona y Catalina"
  },
  "geo": { "lat": 18.3672818, "lng": -68.8409097 },

  "enlaces": {
    "maps": "https://www.google.com/maps/dir/?api=1&destination=18.3672818%2C-68.8409097",
    "waze": "https://waze.com/ul?ll=18.3672818%2C-68.8409097&navigate=yes",
    "mapaEmbed": "https://www.google.com/maps?q=El%20Patio%20Beach%20Club%2C%20Bayah%C3%ADbe&ll=18.3672818,-68.8409097&z=17&output=embed",
    "instagram": "https://www.instagram.com/elpatiobeachclub/",
    "instagramUsuario": "@elpatiobeachclub",
    "tripadvisor": "https://www.tripadvisor.com/Restaurant_Review-g663484-d7761758-Reviews-El_Patio_Lounge_Bar-Bayahibe_La_Altagracia_Province_Dominican_Republic.html"
  },

  "zonaHoraria": "America/Santo_Domingo",
  // Un elemento por día: 0 = domingo ... 6 = sábado. Horas en 24 h.
  // Si cierra después de medianoche, usa 25:00, 26:00... Día cerrado: null.
  // Por confirmar: Instagram dice «Lunes a Domingo 10am-12am»; Google dice 8:00 a. m.-10:00 p. m.
  "horario": [
    { "abre": "10:00", "cierra": "24:00" },
    { "abre": "10:00", "cierra": "24:00" },
    { "abre": "10:00", "cierra": "24:00" },
    { "abre": "10:00", "cierra": "24:00" },
    { "abre": "10:00", "cierra": "24:00" },
    { "abre": "10:00", "cierra": "24:00" },
    { "abre": "10:00", "cierra": "24:00" }
  ],
  "reservas": { "minutosAntesDelCierre": 90, "intervalo": 30, "diasAdelante": 90, "maxPersonas": 30 },
  // Para el reloj del atardecer: minutos antes de la puesta del sol que sugerimos llegar.
  "atardecer": { "llegarAntes": 40 },
  // Precios: equivalencia aproximada en dólares para turistas (RD$ por US$).
  "tasaUSD": 63,

  "fundacion": "",
  "rangoPrecios": "RD$ 800 – 2,500"
};
