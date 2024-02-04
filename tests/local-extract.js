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
 * @param {string} version - Version of IPFS used in benchmark.
 * @return {Promise<Object>} The data from the benchamrk
 */
async function localExtract (peerArray, name, warmup, fileSet, version) {
  const filePath = await file(fileSet)
  const fileStream = fs.createReadStream(filePath)
  const peer = peerArray[0]
  let end
  for await (const { cid } of peer.add(fileStream)) {
    const start = process.hrtime()
    for await (const chunk of peer.cat(cid)) { }
    end = process.hrtime(start)
  }

  return build({
    name: 'localExtract',
    warmup: warmup,
    file: filePath,
    meta: { version: version },
    description: 'Cat file (local) js0 -> js0',
    file_set: fileSet,
    duration: { s: end[0],
      ms: end[1] / 1000000 }
  })
}
run(localExtract)
