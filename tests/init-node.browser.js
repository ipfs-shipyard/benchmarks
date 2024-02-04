'use strict'

const { build } = require('./schema/results')
const run = require('./lib/runner')

/**
 * Initialize an IPFS peer benchmark test in the browser.
 * js0 -> js0 - A local test from one JS IPFS node to the same node
 * @async
 * @function unixFsAddBrowser
 * @param {array} browser - An array of headless browsers that contain IPFS tests.
 * @param {string} name - Name of the test used as sending results to the file with same name and data point in dashboard.
 * @param {boolean} warmup - Not implemented.
 * @param {string} fileSet - Describes file or list of files used for the test.
 * @param {Object} meta - Metadata fields to return with result (eg. version, target)
 * @return {Promise<Object>} The data from the benchamrk
 */
async function initializeNodeBrowser (node, name, warmup, fileSet, meta) {
  const page = node[0].page
  await page.click('.initializeNode')
  const t = await page.waitFor('.initializeNode_s_ready')
  const element = await page.waitFor('.initializeNode_ms_ready')
  const timeS = await page.evaluate(t => t.textContent, t)
  const timeMs = await page.evaluate(element => element.textContent, element)
  return build({
    name: name,
    warmup: 'off',
    file: '',
    meta: meta,
    description: 'Node initialization (local) js0 -> js0',
    file_set: 'none',
    duration: { s: parseInt(timeS.split(':')[1]),
      ms: parseInt(timeMs.split(':')[1]) / 1000000 }
  })
}

run(initializeNodeBrowser, 1, 'browser')
