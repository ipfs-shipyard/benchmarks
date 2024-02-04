'use strict'

const fs = require('fs')
const { build } = require('./schema/results')
const { file } = require('./lib/fixtures')
const run = require('./lib/runner')
const { once } = require('stream-iterators-utils')

/**
 * Retrive file from local peer using catReadableStream.
 * js0 -> js0 - A local test from one JS IPFS node to the same nod
 * @async
 * @function localExtract
 * @param {array} peerArray - An array of IPFS peers used during the test.
 * @param {string} name - Name of the test used as sending results to the file with same name and data point in dashboard.
 * @param {boolean} warmup - Not implemented.
 * @param {string} fileSet - Describes file or list of files used for the test.
 * @param {Object} meta - Metadata fields to return with result (eg. version, target)
 * @return {Promise<Object>} The data from the benchamrk
 */
async function localExtract (peerArray, name, warmup, fileSet, meta) {
  const filePath = await file(fileSet)
  const fileStream = fs.createReadStream(filePath)
  const peer = peerArray[0]
  const inserted = await peer.add(fileStream)
  const start = process.hrtime()
  let stream = peer.catReadableStream(inserted[0].hash)
  // endof steam
  stream.resume()

  // we cannot use end-of-stream/pump for some reason here
  // investigate.
  // https://github.com/ipfs/js-ipfs/issues/1774
  await once(stream, 'end')

  const end = process.hrtime(start)
  return build({
    name: 'localExtract',
    warmup: warmup,
    file: filePath,
    meta: meta,
    description: 'Cat file (local) js0 -> js0',
    file_set: fileSet,
    duration: { s: end[0],
      ms: end[1] / 1000000 }
  })
}
run(localExtract)
