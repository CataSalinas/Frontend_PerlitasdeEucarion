/**
 * Configuración de la API.
 * Vite reemplaza `globalThis.VITE_API_URL` por el valor de .env en vite.config.js.
 * En las pruebas Karma/Webpack se define el mismo valor por defecto.
 * Así evitamos `import.meta.env` en código compartido con Jasmine.
 */
export const API_URL = String(
  globalThis.VITE_API_URL || '/api/v1'
).replace(/\/$/, '')
