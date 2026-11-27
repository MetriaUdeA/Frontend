import type { Idioma } from './idioma.ts'

export type EntradaInformacion = {
  titulo: string
  detalle: string
  consecuencia: string | null
  valor: number | null
  moneda: string | null
}
export type Catalogo = { fuente: string, fechaRevision: string, entradas: EntradaInformacion[] }
export type SeccionInformacion = 'tarifas' | 'horarios' | 'normas'

export async function consultarInformacion(seccion: SeccionInformacion, idioma: Idioma, signal: AbortSignal): Promise<Catalogo> {
  const respuesta = await fetch(`/api/informacion/${seccion}?idioma=${idioma.toUpperCase()}`, { signal })
  if (!respuesta.ok) throw new Error('Información no disponible')
  return respuesta.json() as Promise<Catalogo>
}
