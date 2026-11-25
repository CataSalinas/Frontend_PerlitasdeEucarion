import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext.jsx'
import { leerSesion } from '../src/services/api.js'
import Navbar from '../src/components/Navbar.jsx'
import { iniciarSesion } from './helpers.jsx'

function renderizar(rol) {
  iniciarSesion(rol)
  return render(
    <MemoryRouter>
      <AuthProvider><Navbar /></AuthProvider>
    </MemoryRouter>
  )
}

describe('Navbar por rol', () => {
  it('ADMIN ve todos los enlaces y el botón de cerrar sesión', async () => {
    renderizar('ADMIN')
    await waitFor(() => expect(screen.getByRole('link', { name: /Panel/ })).toBeTruthy())

    expect(screen.getByRole('link', { name: /Productos/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Categorías/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Órdenes/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Registrar venta/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Usuarios/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cerrar sesión/ })).toBeTruthy()
    expect(screen.getByText('ADMIN')).toBeTruthy()
  })

  it('VENDEDOR solo ve Panel, Productos y Órdenes', async () => {
    renderizar('VENDEDOR')
    await waitFor(() => expect(screen.getByRole('link', { name: /Panel/ })).toBeTruthy())

    expect(screen.getByRole('link', { name: /Productos/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Órdenes/ })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Categorías/ })).toBeNull()
    expect(screen.queryByRole('link', { name: /Registrar venta/ })).toBeNull()
    expect(screen.queryByRole('link', { name: /Usuarios/ })).toBeNull()
  })

  it('cerrar sesión limpia los datos guardados', async () => {
    renderizar('ADMIN')
    const boton = await screen.findByRole('button', { name: /Cerrar sesión/ })
    fireEvent.click(boton)
    await waitFor(() => expect(leerSesion()).toBeNull())
  })
})
