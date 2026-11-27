import { formatearTarifa } from './rutas'
import type { IdiomaTarifa, TarifaRuta } from './rutas'

const textos = {
  es: { etiqueta: 'Tarifa estimada · Cívica al portador o eventual', red: 'Red Metro', arvi: 'Cable Arví · tarifa general supuesta', aviso: 'La tarifa general de Arví es un supuesto; otras categorías pueden pagar menos. Verifica las condiciones oficiales.', fuente: 'Consultar condiciones oficiales', revision: 'Fuente revisada' },
  en: { etiqueta: 'Estimated fare · Bearer or occasional Cívica', red: 'Metro network', arvi: 'Arví cable · assumed general fare', aviso: 'The Arví general fare is assumed; other categories may pay less. Check the official conditions.', fuente: 'Check official conditions', revision: 'Source reviewed' },
}

// HU03 podrá incluir este componente en cada opción de ruta real.
export function TarifaAproximada({ tarifa, idioma }: { tarifa: TarifaRuta, idioma: IdiomaTarifa }) {
  const t = textos[idioma]
  const arvi = tarifa.desgloseTarifa?.some((cobro) => cobro.tipo === 'ARVI_GENERAL')
  return <div className="tarifa-aproximada"><p>
    <span>{t.etiqueta}: </span>
    <strong>{formatearTarifa(tarifa, idioma)}</strong>
  </p>
    {tarifa.desgloseTarifa?.map((cobro, indice) => <p key={indice}>{cobro.tipo === 'ARVI_GENERAL' ? t.arvi : t.red}: {formatearTarifa({ tarifaAproximada: cobro.valor, moneda: tarifa.moneda }, idioma)}</p>)}
    {arvi && <p>{t.aviso} <a href="https://www.metrodemedellin.gov.co/usuarios#tarifas-arvi" target="_blank" rel="noreferrer">{t.fuente}</a></p>}
    {tarifa.fechaRevisionTarifa && <p>{t.revision}: {tarifa.fechaRevisionTarifa} · <a href="https://www.metrodemedellin.gov.co/usuarios#tarifas" target="_blank" rel="noreferrer">{t.fuente}</a></p>}
  </div>
}
