import { useEffect, useRef, useState } from 'react'
import type { IdiomaTarifa, Ruta } from './rutas'

type Mapa = {
  on: (evento: string, callback: () => void) => void
  addSource: (id: string, fuente: unknown) => void
  addLayer: (capa: unknown) => void
  fitBounds: (limites: [[number, number], [number, number]], opciones: unknown) => void
  remove: () => void
}
type MapLibre = { Map: new (opciones: unknown) => Mapa }

const VERSION = '6.11.2'
const base = `https://unpkg.com/maplibre-gl@${VERSION}/dist`

export function MapaRecorrido({ ruta, idioma }: { ruta: Ruta, idioma: IdiomaTarifa }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  const clave = import.meta.env.VITE_MAPTILER_KEY as string | undefined

  useEffect(() => {
    if (!clave || !contenedor.current) return
    let cancelado = false
    let mapa: Mapa | undefined
    const estilo = document.createElement('link')
    estilo.rel = 'stylesheet'
    estilo.href = `${base}/maplibre-gl.css`
    document.head.appendChild(estilo)
    const iniciar = (maplibre: MapLibre) => {
      if (cancelado || !contenedor.current) return
      try {
        mapa = new maplibre.Map({
          container: contenedor.current,
          style: `https://api.maptiler.com/maps/streets-v4/style.json?key=${encodeURIComponent(clave)}`,
          center: [-75.57, 6.24], zoom: 11,
        })
        mapa.on('error', () => { if (!cancelado) setError(true) })
        mapa.on('load', () => {
          if (cancelado || !mapa) return
          const features = ruta.trazados.map((t) => ({
            type: 'Feature', properties: { tipo: t.tipo, linea: t.linea }, geometry: t.geometria,
          }))
          mapa.addSource('recorrido', { type: 'geojson', data: { type: 'FeatureCollection', features } })
          mapa.addLayer({ id: 'transporte', type: 'line', source: 'recorrido',
            filter: ['==', ['get', 'tipo'], 'TRANSPORTE'],
            paint: { 'line-color': '#007a38', 'line-width': 6 } })
          mapa.addLayer({ id: 'caminata', type: 'line', source: 'recorrido',
            filter: ['==', ['get', 'tipo'], 'CAMINATA'],
            paint: { 'line-color': '#0072ce', 'line-width': 4, 'line-dasharray': [2, 2] } })
          const puntos = ruta.trazados.flatMap((t) => t.geometria.coordinates)
          if (puntos.length) {
            const longitudes = puntos.map((p) => p[0])
            const latitudes = puntos.map((p) => p[1])
            mapa.fitBounds([[Math.min(...longitudes), Math.min(...latitudes)],
              [Math.max(...longitudes), Math.max(...latitudes)]], { padding: 40, maxZoom: 15 })
          }
        })
      } catch {
        if (!cancelado) setError(true)
      }
    }
    const modulo = `${base}/maplibre-gl.mjs`
    import(/* @vite-ignore */ modulo)
      .then((maplibre: MapLibre) => iniciar(maplibre))
      .catch(() => { if (!cancelado) setError(true) })
    return () => { cancelado = true; mapa?.remove(); estilo.remove() }
  }, [clave, ruta])

  const mensaje = idioma === 'es'
    ? 'El mapa no está disponible. Las opciones del viaje siguen disponibles.'
    : 'The map is unavailable. Journey options are still available.'
  return <section>
    {(!clave || error) && <p role="status">{mensaje}</p>}
    <div ref={contenedor} className="mapa-recorrido" hidden={!clave || error}
      aria-label={idioma === 'es' ? 'Mapa del recorrido seleccionado' : 'Selected journey map'} />
  </section>
}
