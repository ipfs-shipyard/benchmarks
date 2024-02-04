'use strict'

const { build } = require('./schema/results')
const run = require('./lib/runner')
const { file } = require('./lib/fixtures')
const { description, strategy } = require('./config').parseParams()

/**
 * Add file benchmark using IPFS api add in the browser.
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
async function unixFsAddBrowser (browser, name, warmup, fileSet, meta) {
  console.log(` Adding files using strategy ${strategy}`)
  const filePath = await file(fileSet)
  const page = browser[0].page
  await page.reload()
  const elementHandle = await page.$('.addLocalFile')
  await elementHandle.uploadFile(filePath)
  const t = await page.waitFor('.addLocalFile_s_ready')
  const element = await page.waitFor('.addLocalFile_ms_ready')
  const timeS = await page.evaluate(t => t.textContent, t)
  const timeMs = await page.evaluate(element => element.textContent, element)
  return build({
    name: name,
    warmup: 'off',
    file: filePath,
    meta: meta,
    description: `Add file ${description} js0 -> js0`,
    file_set: fileSet,
    duration: { s: parseInt(timeS.split(':')[1]),
      ms: parseInt(timeMs.split(':')[1]) / 1000000 }
  })
}

run(unixFsAddBrowser, 1, 'browser')
