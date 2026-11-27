import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { buscarLugares, textoValido, tieneCaracteresDeControl } from '../src/busqueda.ts'

test('acepta una búsqueda de tres caracteres', () => {
  assert.equal(textoValido('  metro  '), true)
  assert.equal(textoValido('abc'), true)
})

test('rechaza búsquedas cortas, excesivas o con controles', () => {
  assert.equal(textoValido('a\u0301b'), false)
  assert.equal(textoValido('a'.repeat(201)), false)
  assert.equal(textoValido('abc\n'), false)
})

test('detecta controles C0 y C1 sin rechazar caracteres vecinos', () => {
  for (const codigo of [0, 31, 127, 159]) {
    assert.equal(tieneCaracteresDeControl(`abc${String.fromCodePoint(codigo)}`), true)
  }
  assert.equal(tieneCaracteresDeControl(' abc~á😀'), false)
})

test('envía la búsqueda al backend y conserva el estado de Photon', async () => {
  const anterior = globalThis.fetch
  try {
    globalThis.fetch = async (url, opciones) => {
      assert.equal(url, '/api/planeacion/lugares?texto=San+Antonio')
      assert.equal(opciones?.cache, 'no-store')
      return new Response(JSON.stringify({
        lugares: [{ id: 'metro-1', nombre: 'San Antonio', latitud: 6.2, longitud: -75.5, tipo: 'ESTACION', linea: 'A' }],
        direccionesDisponibles: false,
        alcanceRed: 'RED_CARGADA',
      }), { status: 200 })
    }
    const resultado = await buscarLugares(' San Antonio ', new AbortController().signal)
    assert.equal(resultado.lugares[0].id, 'metro-1')
    assert.equal(resultado.direccionesDisponibles, false)
  } finally {
    globalThis.fetch = anterior
  }
})

test('distingue un fallo de conexión de una lista vacía', async () => {
  const anterior = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response(null, { status: 500 })
    await assert.rejects(buscarLugares('metro', new AbortController().signal))
  } finally {
    globalThis.fetch = anterior
  }
})
