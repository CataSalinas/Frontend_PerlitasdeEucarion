import { useCallback, useEffect, useState } from 'react'

/**
 * Hook pequeño para cargar datos de la API con estados carga/error y recarga manual.
 * `cargar` debe ser una función que devuelva Promise; los parámetros que cambien
 * deben pasarse en `dependencias` (por ejemplo, el :id de la ruta).
 */
export function useRecurso(cargar, dependencias = []) {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError(null)

    cargar()
      .then((resultado) => { if (activo) setDatos(resultado) })
      .catch((e) => { if (activo) setError(e.message || 'Error inesperado') })
      .finally(() => { if (activo) setCargando(false) })

    return () => { activo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { datos, cargando, error, recargar, setDatos }
}
