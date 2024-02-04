'use strict'

const os = require('os')
const fs = require('fs')
const { build } = require('./schema/results')
const { file } = require('./lib/fixtures')
const run = require('./lib/runner')
const NodeFactory = require('./lib/node-factory')
const util = require('util')
const execute = util.promisify(util.promisify(require('child_process').exec))
const conf = { tmpPath: os.tmpdir() }
const { description } = require('./config').parseParams()
const argv = require('minimist')(process.argv.slice(2))

async function extractJs2Go (ipfs, name, warmup, fileSet, meta) {
  //  Runner returns the NodeJS ipfs but we need to create the Go ipfs
  const nodeFactory = new NodeFactory()
  try {
    await nodeFactory.add('go')
  } catch (e) {
    console.log(e)
    return
  }
  const filePath = await file(fileSet)
  const fileStream = fs.createReadStream(filePath)
  const peer = ipfs[0]
  const inserted = await peer.add(fileStream)

  const peerId = await peer.id()
  const protocal = argv.t === 'ws' ? 'ws' : 'tcp'
  // output file and dashboard name will match trategy.  default is balanced
  name = protocal === 'ws' ? `${name}Ws` : name
  const id = protocal === 'ws' ? 2 : 0
  let command = `export IPFS_PATH=${conf.tmpPath}/ipfs0 && /home/ubuntu/ipfs/go-ipfs/cmd/ipfs/ipfs swarm connect ${peerId.addresses[id]}`
  try {
    await execute(command)
  } catch (e) {
    console.log(e)
    await nodeFactory.stop('go')
    return
  }

  const start = process.hrtime()
  command = `export IPFS_PATH=${conf.tmpPath}/ipfs0 && ipfs cat ${inserted[0].hash}  > /dev/null`
  try {
    await execute(command)
  } catch (e) {
    console.log(e)
    await nodeFactory.stop('go')
    return
  }
  const end = process.hrtime(start)
  await nodeFactory.stop('go')
  return build({
    name: name,
    warmup: warmup,
    file: filePath,
    meta: meta,
    description: `Cat file ${description}`,
    file_set: fileSet,
    duration: { s: end[0],
      ms: end[1] / 1000000 }
  })
}
run(extractJs2Go)
