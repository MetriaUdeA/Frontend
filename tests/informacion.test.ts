import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { guardarIdioma, leerIdioma } from '../src/idioma.ts'
import { consultarInformacion } from '../src/informacion.ts'

test('recuerda el idioma y usa español si el valor no es válido', () => {
  let valor = ''
  const almacen = { getItem: () => valor, setItem: (_clave: string, nuevo: string) => { valor = nuevo } }
  assert.equal(leerIdioma(almacen), 'es')
  guardarIdioma(almacen, 'en')
  assert.equal(leerIdioma(almacen), 'en')
  valor = 'fr'
  assert.equal(leerIdioma(almacen), 'es')
})

test('continúa si el navegador bloquea el almacenamiento', () => {
  const almacen = { getItem: () => { throw new Error('denegado') }, setItem: () => { throw new Error('denegado') } }
  assert.equal(leerIdioma(almacen), 'es')
  assert.doesNotThrow(() => guardarIdioma(almacen, 'en'))
})

test('consulta el catálogo en el idioma elegido', async () => {
  const anterior = globalThis.fetch
  try {
    globalThis.fetch = async (url) => {
      assert.equal(url, '/api/informacion/normas?idioma=EN')
      return Response.json({ fuente: 'https://example.org', fechaRevision: '2026-11-26', entradas: [{ titulo: 'Rules' }] })
    }
    assert.equal((await consultarInformacion('normas', 'en', new AbortController().signal)).entradas[0].titulo, 'Rules')
  } finally { globalThis.fetch = anterior }
})

test('informa errores del servidor', async () => {
  const anterior = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response(null, { status: 503 })
    await assert.rejects(consultarInformacion('horarios', 'es', new AbortController().signal))
  } finally { globalThis.fetch = anterior }
})
