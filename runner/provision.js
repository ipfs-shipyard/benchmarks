'use strict'

const path = require('path')
const config = require('./config')
const { hashElement } = require('folder-hash')
const local = require('./local')
const remote = require('./remote')
const fs = require('fs')
const hashFile = '/dirHash.txt'

const options = {
  folders: { include: ['.*'] },
  files: { include: ['deploy.txt', '*.js', '*.*/*js', '*.json', '**/*.json', '*.sh'] }
}

const dirHash = (dir) => {
  config.log.info('Creating a hash over the [../tests] folder:')
  return hashElement(dir, options)
}

const writeHash = (hash, dir) => {
  let hashPath = path.join(dir, hashFile)
  try {
    fs.writeFileSync(hashPath, hash.hash)
    config.log.info(`Written local hash: [${hash.hash}]`)
  } catch (e) {
    throw Error(e)
  }
}

const checkHash = async (hashPath) => {
  try {
    let hash = await remote.run(`cat ${hashPath}`)
    config.log.info(`Remote hash is: [${hash}]`)
    return hash
  } catch (e) {
    if (e.message.includes('No such file or directory')) {
      return ''
    } else {
      config.log.error(e)
      throw Error(e)
    }
  }
}

const cloneIpfsRemote = async (commit) => {
  try {
    // FIXME: Switch based on js-minion/go-minion/etc.
    // let jsOut = await remote.run(`${config.benchmarks.remotePath}getJsIpfs.sh ${config.ipfs.path} ${commit || ''}`)
    let jsOut = await remote.run(`${config.benchmarks.remotePath}getJsIpfs.sh ${config.ipfs.path}`)
    config.log.info(jsOut)
    // let goOut = await remote.run(`${config.benchmarks.remotePath}getGoIpfs.sh ${config.ipfs.path} ${commit || ''}`)
    let goOut = await remote.run(`${config.benchmarks.remotePath}getGoIpfs.sh ${config.ipfs.path}`)
    config.log.info(goOut)
    return
  } catch (e) {
    config.log.error(e)
    throw Error(e)
  }
}

const ensure = async (commit) => {
  try {
    let hash = await dirHash(config.benchmarks.path)
    await writeHash(hash, config.benchmarks.path)
    let remotehash = await checkHash(path.join(config.benchmarks.remotePath, hashFile))
    if (remotehash !== hash.hash) {
      config.log.info(`Tests on [${config.benchmarks.host}] are out of sync, updating...`)
      let ansible = await local.run(config.provison.command)
      config.log.info(ansible)
    } else {
      config.log.info(`Tests on [${config.benchmarks.host}] are up to date.`)
    }
    // provision required commit of ipfs
    await cloneIpfsRemote(commit)
  } catch (e) {
    throw Error(e)
  }
}

module.exports = {
  dirHash: dirHash,
  ensure: ensure,
  writeHash: writeHash
}
