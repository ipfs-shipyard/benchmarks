'use strict'

const { file } = require('./lib/fixtures')
const run = require('./lib/runner')
const { build } = require('./schema/results')
const fs = require('fs')
const { description, strategy } = require('./config').parseParams()

/**
 * Add file benchmark using IPFS api add.
 * js0 -> js0 - A local test from one JS IPFS node to the same nod
 * @async
 * @function unixFsAdd
 * @param {array} peerArray - An array of IPFS peers used during the test.
 * @param {string} name - Name of the test used as sending results to the file with same name and data point in dashboard.
 * @param {boolean} warmup - Not implemented.
 * @param {string} fileSet - Describes file or list of files used for the test.
 * @param {Object} meta - Metadata fields to return with result (eg. version, target)
 * @return {Promise<Object>} The data from the benchamrk
 */
async function unixFsAdd (peerArray, name, warmup, fileSet, meta) {
  const filePath = await file(fileSet)
  const fileStream = fs.createReadStream(filePath)
  console.log(` Adding files using strategy ${strategy}`)
  const start = process.hrtime()
  const peer = peerArray[0]
  // output file and dashboard name will match strategy.  default is balanced
  await peer.add(fileStream, { strategy: strategy })
  const end = process.hrtime(start)
  return build({
    name: name,
    warmup: warmup,
    file: filePath,
    meta: meta,
    description: `Add file ${description} js0 -> js0`,
    file_set: fileSet,
    duration: {
      s: end[0],
      ms: end[1] / 1000000
    }
  })
}

run(unixFsAdd)
