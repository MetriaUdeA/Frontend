export type Idioma = 'es' | 'en'
const CLAVE = 'metria-idioma'

export function almacenLocal(): Storage | null {
  try { return window.localStorage } catch { return null }
}

export function leerIdioma(almacen: Pick<Storage, 'getItem'> | null): Idioma {
  try { return almacen?.getItem(CLAVE) === 'en' ? 'en' : 'es' } catch { return 'es' }
}

export function guardarIdioma(almacen: Pick<Storage, 'setItem'> | null, idioma: Idioma): void {
  try { almacen?.setItem(CLAVE, idioma) } catch { /* El idioma sigue disponible durante la visita. */ }
}
