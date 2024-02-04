'use strict'

const fs = require('fs')
const { file } = require('./lib/fixtures.js')
const { build } = require('./schema/results')
const { once } = require('stream-iterators-utils')
const run = require('./lib/runner')
const { description } = require('./config').parseParams()

/**
 * With the same file inserted into 4 peers, this test captures the time for a 5th peer to retrieve file from swarm using catReadableStream.
 * js01234 -> js5 - A test from multiple JS IPFS nodes to a single JS IPFS node
 * @async
 * @function multiPeerTransfer
 * @param {array} peerArray - An array of IPFS peers used during the test.
 * @param {string} name - Name of the test used as sending results to the file with same name and data point in dashboard.
 * @param {boolean} warmup - Not implemented.
 * @param {string} fileSet - Describes file or list of files used for the test.
 * @param {Object} meta - Metadata fields to return with result (eg. version, target)
 * @return {Promise<Object>} The data from the benchamrk
 */
const multiPeerTransfer = async (node, name, warmup, fileSet, meta) => {
  const filePath = await file(fileSet)
  const fileStream = fs.createReadStream(filePath)
  const peerA = node[0]
  const peerB = node[1]
  const peerC = node[2]
  const peerD = node[3]
  const peerE = node[4]
  const peerAId = await peerA.id()
  const peerBId = await peerB.id()
  const peerCId = await peerC.id()
  const peerDId = await peerD.id()
  const inserted = await peerA.add(fileStream)
  await peerB.add(fileStream)
  await peerC.add(fileStream)
  await peerD.add(fileStream)
  peerE.swarm.connect(peerAId.addresses[0])
  peerE.swarm.connect(peerBId.addresses[0])
  peerE.swarm.connect(peerCId.addresses[0])
  peerE.swarm.connect(peerDId.addresses[0])
  const start = process.hrtime()
  let stream = peerE.catReadableStream(inserted[0].hash)
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
    description: `Cat file ${description} js01234 -> js5`,
    meta: meta,
    duration: {
      s: end[0],
      ms: end[1] / 1000000
    }
  })
}

run(multiPeerTransfer, 5)
