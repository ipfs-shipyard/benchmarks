'use strict'

const { build } = require('./schema/results')
const run = require('./lib/runner')
const { file } = require('./lib/fixtures')
const { description } = require('./config').parseParams()

/**
 * Retrive file between two peers in the browser.
 * js0 -> js1 - A test between two JS IPFS node
 * @async
 * @function peerTransferBrowser
 * @param {array} browser - An array of headless browsers that contain IPFS tests.
 * @param {string} name - Name of the test used as sending results to the file with same name and data point in dashboard.
 * @param {boolean} warmup - Not implemented.
 * @param {string} fileSet - Describes file or list of files used for the test.
 * @param {Object} meta - Metadata fields to return with result (eg. version, target)
 * @return {Promise<Object>} The data from the benchamrk
 */
async function peerTransferBrowser (browser, name, warmup, fileSet, meta) {
  const filePath = await file(fileSet)
  const page = browser[0].page
  await page.reload()
  page.on('console', msg => console.log('PAGE LOG:', msg._text))
  const elementHandle = await page.$('.peerTransfer')
  await elementHandle.uploadFile(filePath)
  const t = await page.waitFor('.peerTransfer_s_ready', { timeout: 200000 })
  const element = await page.waitFor('.peerTransfer_ms_ready')
  const timeS = await page.evaluate(t => t.textContent, t)
  const timeMs = await page.evaluate(element => element.textContent, element)
  return build({
    name: name,
    warmup: 'off',
    file: filePath,
    meta: meta,
    description: `Cat file ${description} js0 -> js1`,
    file_set: fileSet,
    duration: { s: parseInt(timeS.split(':')[1]),
      ms: parseInt(timeMs.split(':')[1]) / 1000000 }
  })
}

run(peerTransferBrowser, 1, 'browser')
