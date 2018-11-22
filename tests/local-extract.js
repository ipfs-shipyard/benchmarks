'use strict'

const fs = require('fs')
const ipfsNode = require('./lib/create-node.js')
const { build } = require('./schema/results')
const { store } = require('./lib/output')
const fixtures = require('./lib/fixtures')
const clean = require('./lib/clean')

const testName = 'unixFS-extract'

async function localExtract (node, name, subtest, testClass) {
  try {
    const fileStream = fs.createReadStream(fixtures[testClass])
    const inserted = await node.files.add(fileStream)
    const start = process.hrtime()
    const validCID = inserted[0].hash
    await node.files.get(validCID)
    const end = process.hrtime(start)
    return build({
      name: name,
      subtest: subtest,
      file: fixtures[testClass],
      description: 'Get file to local repo',
      testClass: testClass,
      duration: { s: end[0],
        ms: end[1] / 1000000 }
    })
  } catch (err) {
    throw Error(err)
  }
}

async function scenarios () {
  try {
    let arrResults = []
    const node = await ipfsNode()
    arrResults.push(await localExtract(node, testName, 'empty-repo', 'smallfile'))
    const node1 = await ipfsNode({
      'Addresses': {
        'API': '/ip4/127.0.0.1/tcp/5013',
        'Gateway': '/ip4/127.0.0.1/tcp/9092',
        'Swarm': [
          '/ip4/0.0.0.0/tcp/4013',
          '/ip4/127.0.0.1/tcp/4015/ws'
        ]
      },
      'Bootstrap': []
    })

    const r = await localExtract(node1, testName, 'empty-repo', 'largefile')
    arrResults.push(r)

    arrResults.push(await localExtract(node1, testName, 'populated-repo', 'smallfile'))

    arrResults.push(await localExtract(node, testName, 'populated-repo', 'largefile'))

    store(arrResults)

    node.stop()
    node1.stop()
    clean.peerRepos()
  } catch (err) {
    throw Error(err)
  }
}
scenarios()

module.exports = localExtract
