import { useEffect, useState } from 'react'
import type { Lugar } from './busqueda'
import { descripcionesPasos, planearViaje } from './rutas'
import type { IdiomaTarifa, RespuestaRutas, TarifaRuta } from './rutas'
import { TarifaAproximada } from './TarifaAproximada'
import { MapaRecorrido } from './MapaRecorrido'

const textos = {
  es: {
    cargando: 'Calculando opciones…', error: 'No pudimos calcular el viaje. Inténtalo de nuevo.',
    FUERA_DE_COBERTURA: 'Selecciona una estación habilitada o una dirección a menos de 800 m de ella.',
    MISMA_ESTACION: 'El origen y el destino tienen la misma estación de acceso.',
    SIN_RUTA: 'No encontramos una conexión en la red disponible.',
    MAS_ECONOMICA: 'Más económica entre rutas con tarifa calculada', MAS_RAPIDA: 'Más rápida', MENOS_TRANSBORDOS: 'Menos transbordos',
    duracion: 'Duración estimada', transbordos: 'Transbordos',
    nota: 'Tiempo aproximado sin espera de vehículos. El acceso a pie se estima en línea recta.',
    seleccionar: 'Seleccionar ruta',
    verPasos: 'Ver instrucciones', ocultarPasos: 'Ocultar instrucciones',
    instrucciones: 'Instrucciones del viaje', origen: 'Origen', destino: 'Destino',
    pasosNoDisponibles: 'Las instrucciones no están disponibles. Comprueba que el servidor esté actualizado y reinícialo.',
  },
  en: {
    cargando: 'Calculating options…', error: 'Could not plan your journey. Please try again.',
    FUERA_DE_COBERTURA: 'Select a supported station or an address within 800 m of one.',
    MISMA_ESTACION: 'The origin and destination use the same access station.',
    SIN_RUTA: 'No connection was found in the available network.',
    MAS_ECONOMICA: 'Cheapest among routes with a calculated fare', MAS_RAPIDA: 'Fastest', MENOS_TRANSBORDOS: 'Fewest transfers',
    duracion: 'Estimated duration', transbordos: 'Transfers',
    nota: 'Approximate time excludes waiting. Walking access is estimated in a straight line.',
    seleccionar: 'Select route',
    verPasos: 'View directions', ocultarPasos: 'Hide directions',
    instrucciones: 'Journey directions', origen: 'Origin', destino: 'Destination',
    pasosNoDisponibles: 'Directions are unavailable. Check that the server is up to date and restart it.',
  },
} as const

export function ResultadosRutas({ origen, destino, idioma, alCambiarTarifa }: {
  origen: Lugar, destino: Lugar, idioma: IdiomaTarifa, alCambiarTarifa: (tarifa: TarifaRuta | null) => void
}) {
  const [respuesta, setRespuesta] = useState<{ idioma: IdiomaTarifa, resultado: RespuestaRutas | null } | null>(null)
  const [seleccionada, setSeleccionada] = useState<string | null>(null)
  const [detalle, setDetalle] = useState(false)
  const t = textos[idioma]

  useEffect(() => {
    const controlador = new AbortController()
    planearViaje(origen, destino, controlador.signal, idioma)
      .then((r) => { if (!controlador.signal.aborted) setRespuesta({ idioma, resultado: r }) })
      .catch(() => { if (!controlador.signal.aborted) setRespuesta({ idioma, resultado: null }) })
    return () => controlador.abort()
  }, [origen, destino, idioma])

  useEffect(() => {
    if (!respuesta || respuesta.idioma !== idioma) return
    const resultado = respuesta.resultado
    const ruta = resultado?.estado === 'OK'
      ? resultado.rutas.find((r) => r.etiquetas.join('-') === seleccionada) ?? resultado.rutas[0] : null
    alCambiarTarifa(ruta ?? null)
  }, [respuesta, seleccionada, idioma, alCambiarTarifa])

  if (!respuesta || respuesta.idioma !== idioma) return <p aria-live="polite">{t.cargando}</p>
  if (!respuesta.resultado) return <p className="texto-error" role="alert">{t.error}</p>
  const resultado = respuesta.resultado
  if (resultado.estado !== 'OK') return <p aria-live="polite">{t[resultado.estado]}</p>
  if (resultado.rutas.length === 0) return <p role="status">{t.SIN_RUTA}</p>
  const rutaSeleccionada = resultado.rutas.find((r) => r.etiquetas.join('-') === seleccionada) ?? resultado.rutas[0]
  const claveSeleccionada = rutaSeleccionada.etiquetas.join('-')
  const pasos = descripcionesPasos(rutaSeleccionada.pasos)
  return <section aria-live="polite" className="resultados-rutas">
    <p>{t.nota}</p>
    {resultado.rutas.map((ruta) => <article className="opcion-ruta" key={ruta.etiquetas.join('-')}>
      <h3>{ruta.etiquetas.map((etiqueta) => t[etiqueta]).join(' · ')}</h3>
      <p>{t.duracion}: {ruta.duracionMin} min · {t.transbordos}: {ruta.transbordos}</p>
      <TarifaAproximada tarifa={ruta} idioma={idioma} />
      <button type="button" aria-pressed={claveSeleccionada === ruta.etiquetas.join('-')}
        onClick={() => { setSeleccionada(ruta.etiquetas.join('-')); setDetalle(false) }}>{t.seleccionar}</button>
    </article>)}
    {pasos ? <>
      <button className="boton-instrucciones" type="button" aria-expanded={detalle} aria-controls="instrucciones-viaje"
        onClick={() => setDetalle(!detalle)}>{detalle ? t.ocultarPasos : t.verPasos}</button>
      <section id="instrucciones-viaje" className="instrucciones-viaje" hidden={!detalle}>
        <h3>{t.instrucciones}</h3>
        <p>{t.origen}: {origen.nombre} · {t.destino}: {destino.nombre}</p>
        <ol>{pasos.map((descripcion, indice) => <li key={indice}>{descripcion}</li>)}</ol>
      </section>
    </> : <p role="status" className="texto-aviso">{t.pasosNoDisponibles}</p>}
    <MapaRecorrido key={claveSeleccionada} ruta={rutaSeleccionada} idioma={idioma} />
  </section>
}
