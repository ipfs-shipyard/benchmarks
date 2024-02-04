'use strict'

const fs = require('fs')
const { file } = require('./lib/fixtures.js')
const { build } = require('./schema/results')
const run = require('./lib/runner')
const { once } = require('stream-iterators-utils')
const { description } = require('./config').parseParams()

/**
 * Cat file between two peers using catReadableStream.
 * js0 -> js1 - A test between two JS IPFS nodes
 * @async
 * @function localTransfer
 * @param {array} peerArray - An array of IPFS peers used during the test.
 * @param {string} name - Name of the test used as sending results to the file with same name and data point in dashboard.
 * @param {boolean} warmup - Not implemented.
 * @param {string} fileSet - Describes file or list of files used for the test.
 * @param {Object} meta - Metadata fields to return with result (eg. version, target)
 * @return {Promise<Object>} The data from the benchamrk
 */
const localTransfer = async (peerArray, name, warmup, fileSet, meta) => {
  const filePath = await file(fileSet)
  const fileStream = fs.createReadStream(filePath)
  const peerA = peerArray[0]
  const peerB = peerArray[1]
  const peerAId = await peerA.id()
  peerB.swarm.connect(peerAId.addresses[0])
  const inserted = await peerA.add(fileStream)
  const start = process.hrtime()
  let stream = peerB.catReadableStream(inserted[0].hash)
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
    meta: meta,
    description: `Cat file ${description} js0 -> js1`,
    duration: {
      s: end[0],
      ms: end[1] / 1000000
    }
  })
}

run(localTransfer, 3)
