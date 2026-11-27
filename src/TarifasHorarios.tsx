import { useEffect, useState } from 'react'
import type { Idioma } from './idioma'
import { consultarInformacion } from './informacion'
import type { Catalogo } from './informacion'
import type { TarifaRuta } from './rutas'
import { TarifaAproximada } from './TarifaAproximada'

const textos = {
  es: { titulo: 'Tarifas y horarios', viaje: 'Tarifa de la ruta seleccionada', tarifas: 'Tarifas de referencia', horarios: 'Horarios de servicio', revisado: 'Fuente oficial · Revisado', fuente: 'Consultar la fuente oficial y sus condiciones', nota: 'Los valores pueden cambiar. La tarifa del planeador es una estimación basada en el perfil eventual y no garantiza el cobro real. Consulta la fuente oficial antes de viajar.', estacion: 'Consultar horarios por estación', cargando: 'Cargando información…', error: 'No pudimos cargar la información. Inténtalo de nuevo.' },
  en: { titulo: 'Fares and schedules', viaje: 'Selected route fare', tarifas: 'Reference fares', horarios: 'Service schedules', revisado: 'Official source · Reviewed', fuente: 'Consult the official source and conditions', nota: 'Fares may change. The planner fare is an estimate based on the occasional profile and does not guarantee the actual charge. Check the official source before travelling.', estacion: 'Check station schedules', cargando: 'Loading information…', error: 'Could not load the information. Please try again.' },
} as const

export function TarifasHorarios({ idioma, tarifa }: { idioma: Idioma, tarifa: TarifaRuta | null }) {
  const [datos, setDatos] = useState<{ idioma: Idioma, tarifas: Catalogo | null, horarios: Catalogo | null } | null>(null)
  const t = textos[idioma]
  useEffect(() => {
    const controlador = new AbortController()
    Promise.all([consultarInformacion('tarifas', idioma, controlador.signal), consultarInformacion('horarios', idioma, controlador.signal)])
      .then(([tarifas, horarios]) => { if (!controlador.signal.aborted) setDatos({ idioma, tarifas, horarios }) })
      .catch(() => { if (!controlador.signal.aborted) setDatos({ idioma, tarifas: null, horarios: null }) })
    return () => controlador.abort()
  }, [idioma])
  return <section className="tarjeta informacion">
    <h2>{t.titulo}</h2>
    {tarifa && <section><h3>{t.viaje}</h3><TarifaAproximada tarifa={tarifa} idioma={idioma} /></section>}
    {!datos || datos.idioma !== idioma ? <p role="status">{t.cargando}</p>
      : !datos.tarifas || !datos.horarios ? <p role="alert" className="texto-error">{t.error}</p> : <>
        <p>{t.nota}</p>
        <h3>{t.tarifas}</h3>
        <p>{t.revisado}: {datos.tarifas.fechaRevision} · <a href={datos.tarifas.fuente} target="_blank" rel="noreferrer">{t.fuente}</a></p>
        <ul className="lista-informacion">{datos.tarifas.entradas.map((entrada) => <li key={entrada.titulo}>
          <strong>{entrada.titulo}: {new Intl.NumberFormat(idioma === 'es' ? 'es-CO' : 'en-US').format(entrada.valor ?? 0)} {entrada.moneda}</strong>
          <p>{entrada.detalle}</p>
        </li>)}</ul>
        <h3>{t.horarios}</h3>
        <p>{t.revisado}: {datos.horarios.fechaRevision} · <a href={datos.horarios.fuente} target="_blank" rel="noreferrer">{t.fuente}</a></p>
        <ul className="lista-informacion">{datos.horarios.entradas.map((entrada) => <li key={entrada.titulo}><strong>{entrada.titulo}</strong><p>{entrada.detalle}</p></li>)}</ul>
        <a href="https://www.metrodemedellin.gov.co/usuarios/sistema-integrado/" target="_blank" rel="noreferrer">{t.estacion}</a>
      </>}
  </section>
}
