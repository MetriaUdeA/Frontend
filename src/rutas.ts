// Contrato parcial de HU02. El resto de los datos de la ruta y el endpoint
// se definirán cuando HU03 proporcione rutas reales.
export type TarifaRuta = {
  tarifaAproximada: number | null
  moneda: 'COP'
  desgloseTarifa?: { tipo: 'RED_EVENTUAL' | 'ARVI_GENERAL', valor: number }[]
  fuenteTarifa?: string
  fechaRevisionTarifa?: string
}

export type IdiomaTarifa = 'es' | 'en'

import type { Lugar } from './busqueda.ts'

export type Trazado = {
  tipo: 'TRANSPORTE' | 'CAMINATA'
  linea: string | null
  geometria: { type: 'LineString', coordinates: [number, number][] }
}
export type PasoViaje = {
  accion: 'CAMINAR' | 'ABORDAR' | 'TRANSBORDAR' | 'BAJAR'
  linea: string | null
  estacion: string | null
  estacionAnterior: string | null
  direccionViaje: string | null
  paradas: number | null
  distanciaMetros: number | null
  descripcion: string
}
export type Ruta = TarifaRuta & {
  etiquetas: ('MAS_ECONOMICA' | 'MAS_RAPIDA' | 'MENOS_TRANSBORDOS')[]
  duracionMin: number
  transbordos: number
  trazados: Trazado[]
  pasos?: PasoViaje[] | null
}
export type RespuestaRutas = {
  estado: 'OK' | 'FUERA_DE_COBERTURA' | 'MISMA_ESTACION' | 'SIN_RUTA'
  rutas: Ruta[]
}

/** Una respuesta antigua o incompleta no debe ocultar el resto de la ruta. */
export function descripcionesPasos(pasos: unknown): string[] | null {
  if (!Array.isArray(pasos) || pasos.length === 0) return null
  const descripciones: string[] = []
  for (const paso of pasos) {
    if (!paso || typeof paso !== 'object' || typeof paso.descripcion !== 'string' || !paso.descripcion.trim()) return null
    descripciones.push(paso.descripcion)
  }
  return descripciones
}

export async function planearViaje(origen: Lugar, destino: Lugar, signal: AbortSignal, idioma: IdiomaTarifa = 'es'): Promise<RespuestaRutas> {
  const entrada = (lugar: Lugar) => lugar.tipo === 'ESTACION'
    ? { tipo: lugar.tipo, id: lugar.id }
    : { tipo: lugar.tipo, latitud: lugar.latitud, longitud: lugar.longitud }
  const respuesta = await fetch('/api/planeacion/rutas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ origen: entrada(origen), destino: entrada(destino), idioma: idioma.toUpperCase() }),
    signal,
  })
  if (!respuesta.ok) throw new Error('Error al planear')
  return respuesta.json() as Promise<RespuestaRutas>
}

export function formatearTarifa(tarifa: TarifaRuta, idioma: IdiomaTarifa): string {
  if (tarifa.tarifaAproximada === null || !Number.isFinite(tarifa.tarifaAproximada)) {
    return idioma === 'es' ? 'Tarifa no calculada' : 'Fare not calculated'
  }
  const localidad = idioma === 'es' ? 'es-CO' : 'en-US'
  return `${new Intl.NumberFormat(localidad, { maximumFractionDigits: 0 }).format(tarifa.tarifaAproximada)} ${tarifa.moneda}`
}
