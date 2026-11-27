import type { Idioma } from './idioma'

const textos = {
  es: { titulo: 'Mapas de la red', nota: 'Consulta los mapas oficiales en el sitio del Metro de Medellín. La red del planeador puede ser más limitada.', ciudad: 'Mapa de la ciudad', esquema: 'Mapa esquemático', ayuda: 'En la página oficial selecciona el mapa correspondiente.' },
  en: { titulo: 'Network maps', nota: 'View the official maps on the Metro de Medellín website. The planner network may be more limited.', ciudad: 'City map', esquema: 'Schematic map', ayuda: 'Select the corresponding map on the official page.' },
} as const

export function MapaRed({ idioma }: { idioma: Idioma }) {
  const t = textos[idioma]
  const enlace = 'https://www.metrodemedellin.gov.co/usuarios/sistema-integrado/#mapas'
  return <section className="tarjeta informacion"><h2>{t.titulo}</h2><p>{t.nota}</p><p>{t.ayuda}</p>
    <ul><li><a href={enlace} target="_blank" rel="noreferrer">{t.ciudad}</a></li>
      <li><a href={enlace} target="_blank" rel="noreferrer">{t.esquema}</a></li></ul>
  </section>
}
