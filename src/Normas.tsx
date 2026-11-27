import { useEffect, useState } from 'react'
import type { Idioma } from './idioma'
import { consultarInformacion } from './informacion'
import type { Catalogo } from './informacion'

const textos = {
  es: { titulo: 'Normas de viaje', fuente: 'Consulta el reglamento oficial completo', revisado: 'Revisado', consecuencia: 'Posible consecuencia', cargando: 'Cargando normas…', error: 'No pudimos cargar las normas. Inténtalo de nuevo.', nota: 'Resumen orientativo; consulta el reglamento y sus condiciones completas.' },
  en: { titulo: 'Travel rules', fuente: 'Read the full official regulations', revisado: 'Reviewed', consecuencia: 'Possible consequence', cargando: 'Loading rules…', error: 'Could not load the rules. Please try again.', nota: 'This is a guide; consult the full regulations and conditions.' },
} as const

export function Normas({ idioma }: { idioma: Idioma }) {
  const [datos, setDatos] = useState<{ idioma: Idioma, catalogo: Catalogo | null } | null>(null)
  const t = textos[idioma]
  useEffect(() => {
    const controlador = new AbortController()
    consultarInformacion('normas', idioma, controlador.signal)
      .then((catalogo) => { if (!controlador.signal.aborted) setDatos({ idioma, catalogo }) })
      .catch(() => { if (!controlador.signal.aborted) setDatos({ idioma, catalogo: null }) })
    return () => controlador.abort()
  }, [idioma])
  return <section className="tarjeta informacion"><h2>{t.titulo}</h2>
    {!datos || datos.idioma !== idioma ? <p role="status">{t.cargando}</p>
      : !datos.catalogo ? <p role="alert" className="texto-error">{t.error}</p> : <>
        <p>{t.nota}</p>
        <p>{t.revisado}: {datos.catalogo.fechaRevision} · <a href={datos.catalogo.fuente} target="_blank" rel="noreferrer">{t.fuente}</a></p>
        <ul className="lista-informacion">{datos.catalogo.entradas.map((norma) => <li key={norma.titulo}>
          <strong>{norma.titulo}</strong><p>{norma.detalle}</p>
          {norma.consecuencia && <p><strong>{t.consecuencia}:</strong> {norma.consecuencia}</p>}
        </li>)}</ul>
      </>}
  </section>
}
