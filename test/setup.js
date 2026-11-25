import { cleanup } from '@testing-library/react'

if (typeof window.fetch !== 'function') {
  window.fetch = () => Promise.reject(new Error('fetch no mockeado'))
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  // Desmonta lo que cada prueba dejó en el DOM: sin esto, varias pruebas
  // encontraban elementos de la spec anterior y fallaban de forma aleatoria.
  // karma-webpack compila cada spec por separado, así que además se limpia
  // el body para no depender de que RTL sea la misma instancia en todos.
  cleanup()
  document.body.innerHTML = ''
})
