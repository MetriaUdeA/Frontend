import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { buscarLugares, textoValido, tieneCaracteresDeControl } from './busqueda'
import type { Lugar, RespuestaBusqueda } from './busqueda'
import { ResultadosRutas } from './ResultadosRutas'
import { almacenLocal, guardarIdioma, leerIdioma } from './idioma'
import { TarifasHorarios } from './TarifasHorarios'
import { Normas } from './Normas'
import { MapaRed } from './MapaRed'
import type { TarifaRuta } from './rutas'

const textos = {
  es: {
    idioma: 'Idioma', subtituloMarca: 'Tu viaje, más fácil', navegacion: 'Planea tu viaje',
    etiqueta: 'TU VIAJE COMIENZA AQUÍ', titulo: '¿A dónde quieres ir?',
    introduccion: 'Encuentra tu punto de partida y tu destino en la red del Metro de Medellín.',
    tituloFormulario: 'Planea tu recorrido', descripcion: 'Busca una estación, parada o dirección para comenzar.',
    origen: 'Origen', destino: 'Destino', origenEjemplo: '¿Desde dónde sales?', destinoEjemplo: '¿A dónde vas?',
    ayuda: 'Escribe al menos 3 caracteres para ver sugerencias.',
    privacidad: 'Al buscar, el texto se envía a Photon para sugerir direcciones y lugares.',
    buscando: 'Buscando sugerencias…', sinResultados: 'No encontramos resultados. Revisa el texto e inténtalo de nuevo.',
    falloPhoton: 'Las sugerencias de direcciones no están disponibles por ahora.',
    sinLocales: 'No encontramos estaciones ni paradas locales.',
    falloBackend: 'No pudimos conectar con el servidor. Inténtalo de nuevo.',
    estacion: 'Estación o parada', direccion: 'Dirección o lugar', linea: 'Línea',
    seleccionado: 'Seleccionado', completo: '¡Tus lugares están listos!',
    completoAyuda: 'Guardamos tu selección en esta pantalla. El cálculo de rutas estará disponible en una próxima etapa.',
    pendiente: 'Selecciona un origen y un destino para continuar.',
    limite: 'Escribe hasta 200 caracteres y evita caracteres de control.',
    pie: 'Metria · Prototipo académico', aviso: 'Información de la red del Metro de Medellín.',
    menu: 'Secciones', tarifasHorarios: 'Tarifas y horarios', normas: 'Normas', mapas: 'Mapas de la red',
  },
  en: {
    idioma: 'Language', subtituloMarca: 'Your journey, made easier', navegacion: 'Plan your trip',
    etiqueta: 'YOUR JOURNEY STARTS HERE', titulo: 'Where would you like to go?',
    introduccion: 'Find your starting point and destination on the Medellín Metro network.',
    tituloFormulario: 'Plan your journey', descripcion: 'Search for a station, stop or address to get started.',
    origen: 'Origin', destino: 'Destination', origenEjemplo: 'Where are you starting?', destinoEjemplo: 'Where are you going?',
    ayuda: 'Enter at least 3 characters to see suggestions.',
    privacidad: 'Your search text is sent to Photon to suggest addresses and places.',
    buscando: 'Searching for suggestions…', sinResultados: 'No results found. Check your search and try again.',
    falloPhoton: 'Address suggestions are temporarily unavailable.',
    sinLocales: 'No local stations or stops were found.',
    falloBackend: 'Could not connect to the server. Please try again.',
    estacion: 'Station or stop', direccion: 'Address or place', linea: 'Line',
    seleccionado: 'Selected', completo: 'Your places are ready!',
    completoAyuda: 'Your selection is kept on this screen. Route planning will be available in a later stage.',
    pendiente: 'Select an origin and destination to continue.',
    limite: 'Enter up to 200 characters and avoid control characters.',
    pie: 'Metria · Academic prototype', aviso: 'Medellín Metro network information.',
    menu: 'Sections', tarifasHorarios: 'Fares and schedules', normas: 'Rules', mapas: 'Network maps',
  },
} as const

type Idioma = keyof typeof textos
type Textos = (typeof textos)[Idioma]

function Icono({ tipo }: { tipo: 'origen' | 'destino' | 'buscar' | 'listo' }) {
  if (tipo === 'buscar') return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
  if (tipo === 'listo') return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
  if (tipo === 'destino') return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></svg>
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" /></svg>
}

function CampoLugar({ etiqueta, placeholder, tipo, textos: t, seleccionado, alSeleccionar }: {
  etiqueta: string
  placeholder: string
  tipo: 'origen' | 'destino'
  textos: Textos
  seleccionado: Lugar | null
  alSeleccionar: (lugar: Lugar | null) => void
}) {
  const id = useId()
  const [texto, setTexto] = useState('')
  const [respuesta, setRespuesta] = useState<RespuestaBusqueda | null>(null)
  const [estado, setEstado] = useState<'inicial' | 'cargando' | 'listo' | 'error'>('inicial')
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(-1)
  const tieneFoco = useRef(false)

  useEffect(() => {
    if (seleccionado || !textoValido(texto)) return
    const controlador = new AbortController()
    const espera = window.setTimeout(() => {
      setEstado('cargando')
      buscarLugares(texto, controlador.signal)
        .then((resultado) => {
          if (controlador.signal.aborted) return
          setRespuesta(resultado)
          setEstado('listo')
          setAbierto(tieneFoco.current)
          setActivo(-1)
        })
        .catch(() => {
          if (!controlador.signal.aborted) {
            setRespuesta(null)
            setEstado('error')
          }
        })
    }, 400)
    return () => { window.clearTimeout(espera); controlador.abort() }
  }, [texto, seleccionado])

  function elegir(lugar: Lugar) {
    setTexto(lugar.nombre)
    setRespuesta(null)
    setEstado('inicial')
    setAbierto(false)
    setActivo(-1)
    alSeleccionar(lugar)
  }

  function manejarTecla(evento: KeyboardEvent<HTMLInputElement>) {
    const cantidad = respuesta?.lugares.length ?? 0
    if (evento.key === 'Escape') { setAbierto(false); setActivo(-1) }
    if (!cantidad) return
    if (evento.key === 'ArrowDown') {
      evento.preventDefault(); setAbierto(true); setActivo((valor) => (valor + 1) % cantidad)
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault(); setAbierto(true); setActivo((valor) => (valor <= 0 ? cantidad - 1 : valor - 1))
    } else if (evento.key === 'Enter' && abierto && activo >= 0 && respuesta) {
      evento.preventDefault(); elegir(respuesta.lugares[activo])
    }
  }

  const longitud = [...texto.trim().normalize('NFC')].length
  const invalido = texto.length > 0 && (longitud > 200 || tieneCaracteresDeControl(texto))
  const sugerencias = abierto && !seleccionado && estado === 'listo' && (respuesta?.lugares.length ?? 0) > 0

  return <div className="campo">
    <label htmlFor={id}>{etiqueta}</label>
    <div className="entrada">
      <span className={`marcador marcador--${tipo}`}><Icono tipo={tipo} /></span>
      <input id={id} value={texto} placeholder={placeholder} autoComplete="off" role="combobox"
        aria-autocomplete="list" aria-expanded={Boolean(sugerencias)}
        aria-controls={`${id}-lista`} aria-describedby={`${id}-ayuda`}
        aria-activedescendant={sugerencias && activo >= 0 ? `${id}-opcion-${activo}` : undefined}
        aria-invalid={invalido || undefined}
        onKeyDown={manejarTecla}
        onFocus={() => { tieneFoco.current = true; if (respuesta) setAbierto(true) }}
        onBlur={() => { tieneFoco.current = false; setAbierto(false) }}
        onChange={(evento) => {
          setTexto(evento.target.value); alSeleccionar(null)
          setRespuesta(null); setEstado('inicial'); setAbierto(false); setActivo(-1)
        }} />
      <span className="icono-buscar"><Icono tipo="buscar" /></span>
    </div>
    <div id={`${id}-ayuda`} className="estado-campo" aria-live="polite">
      {seleccionado ? <span className="texto-exito">{t.seleccionado}: {seleccionado.linea ? `${t.linea} ${seleccionado.linea}` : t.direccion}</span>
        : invalido ? <span className="texto-error">{t.limite}</span>
          : estado === 'cargando' ? t.buscando
            : estado === 'error' ? <span className="texto-error">{t.falloBackend}</span>
              : estado === 'listo' && respuesta ? <>
                {!respuesta.direccionesDisponibles && <span className="texto-aviso">{t.falloPhoton} {respuesta.lugares.length === 0 && t.sinLocales}</span>}
                {respuesta.direccionesDisponibles && respuesta.lugares.length === 0 && t.sinResultados}
              </> : t.ayuda}
    </div>
    {sugerencias && respuesta && <ul id={`${id}-lista`} role="listbox" className="sugerencias">
      {respuesta.lugares.map((lugar, indice) => <li key={`${lugar.tipo}-${lugar.id ?? indice}-${indice}`}
        id={`${id}-opcion-${indice}`} role="option" aria-selected={activo === indice}
        className={activo === indice ? 'sugerencia activa' : 'sugerencia'}
        onMouseDown={(evento) => evento.preventDefault()}
        onClick={() => elegir(lugar)}>
        <span>{lugar.nombre}</span>
        <small>{lugar.tipo === 'ESTACION' ? t.estacion : t.direccion}{lugar.linea ? ` · ${t.linea} ${lugar.linea}` : ''}</small>
      </li>)}
    </ul>}
  </div>
}

function App() {
  const [idioma, setIdioma] = useState<Idioma>(() => leerIdioma(almacenLocal()))
  const [origen, setOrigen] = useState<Lugar | null>(null)
  const [destino, setDestino] = useState<Lugar | null>(null)
  const [seccion, setSeccion] = useState<'planeacion' | 'tarifas' | 'normas' | 'mapas'>('planeacion')
  const [tarifa, setTarifa] = useState<TarifaRuta | null>(null)
  const t = textos[idioma]

  useEffect(() => { document.documentElement.lang = idioma; guardarIdioma(almacenLocal(), idioma) }, [idioma])

  return <>
    <header className="cabecera">
      <div className="contenedor cabecera__contenido">
        <a className="marca" href="/" aria-label="Metria">
          <span className="marca__simbolo" aria-hidden="true"><span /><span /><span /></span>
          <span><strong>metria<span className="marca__punto">.</span></strong><small>{t.subtituloMarca}</small></span>
        </a>
        <div className="cabecera__derecha">
          <span className="navegacion-activa">{t.navegacion}</span>
          <label className="selector-idioma"><span className="sr-only">{t.idioma}</span>
            <select value={idioma} onChange={(evento) => setIdioma(evento.target.value as Idioma)}>
              <option value="es">ES</option><option value="en">EN</option>
            </select>
          </label>
        </div>
      </div>
    </header>
    <main>
      <nav className="contenedor navegacion-secciones" aria-label={t.menu}>
        <button type="button" aria-pressed={seccion === 'planeacion'} onClick={() => setSeccion('planeacion')}>{t.navegacion}</button>
        <button type="button" aria-pressed={seccion === 'tarifas'} onClick={() => setSeccion('tarifas')}>{t.tarifasHorarios}</button>
        <button type="button" aria-pressed={seccion === 'normas'} onClick={() => setSeccion('normas')}>{t.normas}</button>
        <button type="button" aria-pressed={seccion === 'mapas'} onClick={() => setSeccion('mapas')}>{t.mapas}</button>
      </nav>
      <div hidden={seccion !== 'planeacion'}>
      <section className="intro contenedor">
        <div className="intro__texto">
          <div className="eyebrow"><span />{t.etiqueta}</div>
          <h1>{t.titulo}</h1>
          <p>{t.introduccion}</p>
        </div>
        <div className="diagrama" aria-hidden="true">
          <span className="diagrama__nodo diagrama__nodo--uno" />
          <span className="diagrama__nodo diagrama__nodo--dos" />
          <span className="diagrama__nodo diagrama__nodo--tres" />
          <span className="diagrama__nodo diagrama__nodo--cuatro" />
          <span className="diagrama__nodo diagrama__nodo--cinco" />
        </div>
      </section>
      <section className="zona-formulario">
        <div className="contenedor">
          <div className="tarjeta">
            <div className="tarjeta__encabezado">
              <span className="tarjeta__icono"><Icono tipo="destino" /></span>
              <div><h2>{t.tituloFormulario}</h2><p>{t.descripcion}</p></div>
            </div>
            <div className="campos">
              <CampoLugar etiqueta={t.origen} placeholder={t.origenEjemplo} tipo="origen" textos={t}
                seleccionado={origen} alSeleccionar={(lugar) => { setTarifa(null); setOrigen(lugar) }} />
              <CampoLugar etiqueta={t.destino} placeholder={t.destinoEjemplo} tipo="destino" textos={t}
                seleccionado={destino} alSeleccionar={(lugar) => { setTarifa(null); setDestino(lugar) }} />
            </div>
            <p className="privacidad">{t.privacidad}</p>
            {origen && destino
              ? <ResultadosRutas key={JSON.stringify([origen, destino])} origen={origen} destino={destino} idioma={idioma} alCambiarTarifa={setTarifa} />
              : <div className="resumen" aria-live="polite"><p>{t.pendiente}</p></div>}
          </div>
        </div>
      </section>
      </div>
      {seccion !== 'planeacion' && <div className="zona-informacion contenedor">
        {seccion === 'tarifas' && <TarifasHorarios idioma={idioma} tarifa={tarifa} />}
        {seccion === 'normas' && <Normas idioma={idioma} />}
        {seccion === 'mapas' && <MapaRed idioma={idioma} />}
      </div>}
    </main>
    <footer className="pie"><div className="contenedor pie__contenido"><strong>{t.pie}</strong><span>{t.aviso}</span></div></footer>
  </>
}

export default App
