'use strict'

const { build } = require('./schema/results')
const run = require('./lib/runner')
const NodeFactory = require('./lib/node-factory')

/**
 * Initialize an IPFS peer benchmark.
 * js0 -> js0 - A local test from one JS IPFS node to the same node
 * @async
 * @function unixFsAddBrowser
 * @param {array} browser - An array of headless browsers that contain IPFS tests.
 * @param {string} name - Name of the test used as sending results to the file with same name and data point in dashboard.
 * @param {boolean} warmup - Not implemented.
 * @param {string} fileSet - Describes file or list of files used for the test.
 * @param {Object} meta - Metadata fields to return with result (eg. version, target)
 * @return {Promise<Object>} The data from the benchamrk
 */

async function initializeNode (node, name, warmup, fileSet, meta) {
  const start = process.hrtime()
  const nodeFactory = new NodeFactory()
  await nodeFactory.add('nodejs', {
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
  await nodeFactory.stop('nodejs')
  return build({
    name: name,
    wamrup: warmup,
    file: 'none',
    meta: meta,
    description: 'Node initialization (local) js0 -> js0',
    file_set: 'none',
    duration: { s: end[0],
      ms: end[1] / 1000000 }
  })
}

run(initializeNode)
