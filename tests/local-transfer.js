'use strict'

const fs = require('fs')
const { file } = require('./lib/fixtures.js')
const { build } = require('./schema/results')
const run = require('./lib/runner')
const { once } = require('stream-iterators-utils')

const localTransfer = async (node, name, warmup, fileSet, version) => {
  const filePath = await file(fileSet)
  const fileStream = fs.createReadStream(filePath)
  const peerA = node[0]
  const peerB = node[1]
  const peerAId = await peerA.id()
  peerB.swarm.connect(peerAId.addresses[0])
  const inserted = peerA.add ? await peerA.add(fileStream) : await peerA.files.add(fileStream)
  const start = process.hrtime()
  let stream = peerB.catReadableStream ? peerB.catReadableStream(inserted[0].hash) : peerB.files.catReadableStream(inserted[0].hash)
  // endof steam
  stream.resume()

  // we cannot use end-of-stream/pump for some reason here
  // investigate.
  // https://github.com/ipfs/js-ipfs/issues/1774
  await once(stream, 'end')

  const end = process.hrtime(start)

  return build({
    name: name,
    warmup: warmup,
    file_set: fileSet,
    file: filePath,
    meta: { version: version },
    description: 'Transfer file between two local nodes',
    duration: {
      s: end[0],
      ms: end[1] / 1000000
    }
  })
}

run(localTransfer, 3)
