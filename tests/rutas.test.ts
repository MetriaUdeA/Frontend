import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { descripcionesPasos, formatearTarifa, planearViaje } from '../src/rutas.ts'

test('formatea la tarifa en español indicando COP', () => {
  assert.equal(formatearTarifa({ tarifaAproximada: 3820, moneda: 'COP' }, 'es'), '3.820 COP')
})

test('formatea una tarifa con transbordos en inglés', () => {
  assert.equal(formatearTarifa({ tarifaAproximada: 8670, moneda: 'COP' }, 'en'), '8,670 COP')
})

test('informa una tarifa no calculada sin convertirla en cero', () => {
  assert.equal(formatearTarifa({ tarifaAproximada: null, moneda: 'COP' }, 'es'), 'Tarifa no calculada')
  assert.equal(formatearTarifa({ tarifaAproximada: null, moneda: 'COP' }, 'en'), 'Fare not calculated')
})

test('envía la selección a la API sin enviar el nombre de la dirección', async () => {
  const anterior = globalThis.fetch
  try {
    globalThis.fetch = async (url, opciones) => {
      assert.equal(url, '/api/planeacion/rutas')
      assert.equal(opciones?.method, 'POST')
      assert.deepEqual(JSON.parse(String(opciones?.body)), {
        origen: { tipo: 'ESTACION', id: 'metro-22' },
        destino: { tipo: 'DIRECCION', latitud: 6.2, longitud: -75.5 },
        idioma: 'ES',
      })
      return new Response(JSON.stringify({ estado: 'OK', rutas: [] }), { status: 200 })
    }
    const respuesta = await planearViaje(
      { tipo: 'ESTACION', id: 'metro-22', nombre: 'Niquía', latitud: 6.3, longitud: -75.5, linea: 'A' },
      { tipo: 'DIRECCION', id: null, nombre: 'Privado', latitud: 6.2, longitud: -75.5, linea: null },
      new AbortController().signal,
    )
    assert.equal(respuesta.estado, 'OK')
  } finally {
    globalThis.fetch = anterior
  }
})

test('informa cuando la API de rutas falla', async () => {
  const anterior = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response(null, { status: 500 })
    const lugar = { tipo: 'ESTACION' as const, id: 'metro-22', nombre: 'Niquía', latitud: 6.3, longitud: -75.5, linea: 'A' }
    await assert.rejects(planearViaje(lugar, lugar, new AbortController().signal))
  } finally {
    globalThis.fetch = anterior
  }
})

test('solicita instrucciones en inglés y conserva los pasos recibidos', async () => {
  const anterior = globalThis.fetch
  try {
    globalThis.fetch = async (_url, opciones) => {
      assert.equal(JSON.parse(String(opciones?.body)).idioma, 'EN')
      return Response.json({ estado: 'OK', rutas: [{ pasos: [{ accion: 'ABORDAR', descripcion: 'Board at Norte' }] }] })
    }
    const lugar = { tipo: 'ESTACION' as const, id: 'metro-22', nombre: 'Niquía', latitud: 6.3, longitud: -75.5, linea: 'A' }
    const respuesta = await planearViaje(lugar, lugar, new AbortController().signal, 'en')
    assert.equal(respuesta.rutas[0].pasos?.[0].descripcion, 'Board at Norte')
  } finally {
    globalThis.fetch = anterior
  }
})

test('obtiene las descripciones ordenadas de instrucciones válidas', () => {
  assert.deepEqual(descripcionesPasos([{ descripcion: 'Aborda' }, { descripcion: 'Bájate' }]), ['Aborda', 'Bájate'])
})

test('considera no disponibles instrucciones ausentes o inválidas', () => {
  for (const pasos of [undefined, null, [], {}, [null], [{ descripcion: '' }], [{ descripcion: 42 }]]) {
    assert.equal(descripcionesPasos(pasos), null)
  }
})
