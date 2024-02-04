'use strict'

const { build } = require('./schema/results')
const run = require('./lib/runner')
const NodeFactory = require('./lib/node-factory')

async function initializeNodeHttp (node, name, warmup, fileSet, meta) {
  const start = process.hrtime()
  const nodeFactory = new NodeFactory()
  await nodeFactory.add('http', {
    'Addresses': {
      'API': '/ip4/127.0.0.1/tcp/6012',
      'Gateway': '/ip4/127.0.0.1/tcp/9191',
      'Swarm': [
        '/ip4/0.0.0.0/tcp/7012',
        '/ip4/127.0.0.1/tcp/3022/ws'
      ]
    },
    'Bootstrap': []
  }, { 'empty-repo': true })
  const end = process.hrtime(start)
  await nodeFactory.stop('http')
  return build({
    name: name,
    wamrup: warmup,
    file: '',
    meta: meta,
    description: 'Initialize node without pre-generated key',
    file_set: '',
    duration: { s: end[0],
      ms: end[1] / 1000000 }
  })
}

run(initializeNodeHttp)
