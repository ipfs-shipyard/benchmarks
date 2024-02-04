'use strict'

const fs = require('fs')
const { build } = require('./schema/results')
const { file } = require('./lib/fixtures')
const run = require('./lib/runner')
const { description, strategy } = require('./config').parseParams()

/**
 * Add many small files benchmark using IPFS api add.
 * js0 -> js0 - A local test from one JS IPFS node to the same node
 * @async
 * @function addMultiKb
 * @param {array} peerArray - An array of IPFS peers used during the test.
 * @param {string} name - Name of the test used as sending results to the file with same name and data point in dashboard.
 * @param {boolean} warmup - Not implemented.
 * @param {string} fileSet - Describes file or list of files used for the test.
 * @param {Object} meta - Metadata fields to return with result (eg. version, target)
 * @return {Promise<Object>} The data from the benchamrk
 */
async function addMultiKb (node, name, warmup, fileSet, meta) {
  const fileArr = await file(fileSet)
  console.log(` Adding files using strategy ${strategy}`)
  const start = process.hrtime()
  const peer = node[0]

  // output file and dashboard name will match trategy.  default is balanced

  for (var i = 0, len = fileArr.length; i < len; i++) {
    const fileStream = fs.createReadStream(fileArr[i])
    await peer.add(fileStream, { strategy: strategy })
  }
  const end = process.hrtime(start)

  // Pass in test output to build and return

  return build({
    name: name,
    warmup: warmup,
    file: fileSet,
    meta: meta,
    description: `Add many small files ${description} js0 -> js0`,
    file_set: fileSet,
    duration: { s: end[0],
      ms: end[1] / 1000000 }
  })
}
run(addMultiKb)
