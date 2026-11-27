export type Lugar = {
  id: string | null
  nombre: string
  latitud: number
  longitud: number
  tipo: 'ESTACION' | 'DIRECCION'
  linea: string | null
}

export type RespuestaBusqueda = {
  lugares: Lugar[]
  direccionesDisponibles: boolean
  alcanceRed: string
}

export function tieneCaracteresDeControl(texto: string): boolean {
  return [...texto].some((caracter) => {
    const codigo = caracter.codePointAt(0)!
    return codigo <= 0x1f || (codigo >= 0x7f && codigo <= 0x9f)
  })
}

export function textoValido(texto: string): boolean {
  const normalizado = texto.trim().normalize('NFC')
  const longitud = [...normalizado].length
  return longitud >= 3 && longitud <= 200 && !tieneCaracteresDeControl(texto)
}

export async function buscarLugares(texto: string, signal: AbortSignal): Promise<RespuestaBusqueda> {
  const parametros = new URLSearchParams({ texto: texto.trim().normalize('NFC') })
  const respuesta = await fetch(`/api/planeacion/lugares?${parametros}`, {
    signal,
    cache: 'no-store',
  })
  if (!respuesta.ok) throw new Error('Error de búsqueda')
  return respuesta.json() as Promise<RespuestaBusqueda>
}
