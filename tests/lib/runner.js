'use strict'
const NodeFactory = require('./node-factory')
const config = require('../config')
const clean = require('./clean')
const { store } = require('./output')
const genTests = require('../util/create-files')
const { name, target } = require('../config').parseParams()
async function runner (test, nodeCount = 2, type = 'nodejs', options) {
  if (!config.verify) {
    await genTests()
  }
  const arrResults = []
  const nodeFactory = new NodeFactory()
  const node = []
  for (let i = 0; i < nodeCount; i++) {
    try {
      node.push(await nodeFactory.add(type, options, i))
    } catch (e) {
      console.log(e)
    }
  }
  const version = await node[0].version()
  const meta = {
    version,
    target
  }
  try {
    for (let subTest of config.test[test.name]) {
      if (config.fileSetParam) {
        arrResults.push(await test(node, `${test.name}${name}`, subTest.warmup.toLowerCase(), config.fileSetParam, meta))
      } else {
        for (let fileSet of subTest.fileSet) {
          arrResults.push(await test(node, `${test.name}${name}`, subTest.warmup.toLowerCase(), fileSet, meta))
        }
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('ERROR -- Run "npm run generateFiles" then run test again.')
      await nodeFactory.stop(type)
      clean.peerRepos()
      process.exit(1)
    }
    console.log(err)
    console.log(err.message)
    await nodeFactory.stop(type)
    clean.peerRepos()
    process.exit(1)
  }
  store(arrResults)
  await nodeFactory.stop(type)
  clean.peerRepos()
}
module.exports = runner
