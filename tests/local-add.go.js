'use strict'

const os = require('os')
const util = require('util')
const execute = util.promisify(util.promisify(require('child_process').exec))
const { file } = require('./lib/fixtures.js')
const { build } = require('./schema/results')
const run = require('./lib/runner')
const conf = { tmpPath: os.tmpdir() }

/**
 * Add file benchmark using IPFS api add using the go daemon.
 * go0 -> go0 - A local test from one JS IPFS node to the same nod
 * @async
 * @function unixFsAdd
 * @param {array} peerArray - An array of IPFS peers used during the test.
 * @param {string} name - Name of the test used as sending results to the file with same name and data point in dashboard.
 * @param {boolean} warmup - Not implemented.
 * @param {string} fileSet - Describes file or list of files used for the test.
 * @param {Object} meta - Metadata fields to return with result (eg. version, target)
 * @return {Promise<Object>} The data from the benchamrk
 */

const unixFsAddGo = async (peerArray, name, warmup, fileSet, meta) => {
  const filePath = await file(fileSet)
  const start = process.hrtime()
  let command = `export IPFS_PATH=${conf.tmpPath}/ipfs0 && ipfs add ${filePath} > /dev/null`
  await execute(command)
  const end = process.hrtime(start)
  return build({
    name: name,
    warmup: warmup,
    file_set: fileSet,
    file: filePath,
    meta: { ...meta, project: 'go-ipfs' },
    description: 'Add files (balanced). go0 -> go0',
    duration: {
      s: end[0],
      ms: end[1] / 1000000
    }
  }, 'go')
}

run(unixFsAddGo, 1, 'go')
