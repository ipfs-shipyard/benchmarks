'use strict'

const fs = require('fs')
const util = require('util')
const rmfr = require('rmfr')
const stat = util.promisify(fs.stat)
const readDir = util.promisify(fs.readdir)
const compressing = require('compressing')
const config = require('./config')

const _tgzDir = async (source, target) => {
  if (source && target) {
    config.log.info(`Compressing [${source}] to [${target}]`)
    await compressing.tgz.compressDir(source, target)
    return { result: 'ok' }
  } else {
    config.log.error(`compress.tgz - Source [${source}] and Target [${target}] are required`)
  }
}

const clinicFiles = async (path) => {
  try {
    let contents = await readDir(path)
    // find the dir
    let clinicDir
    for (let node of contents) {
      let stats = await stat(`${path}/${node}`)
      if (stats.isDirectory()) {
        clinicDir = node
        break
      }
    }
    if (clinicDir) {
      await _tgzDir(`${path}/${clinicDir}`, `${path}/${clinicDir}.tar.gz`)
      await rmfr(`${path}/${clinicDir}`)
    } else {
      config.log.error(`No clinic directory found in ${path}`)
    }
  } catch (e) {
    config.log.error(e)
    throw e
  }
}

module.exports = {
  _tgzDir,
  clinicFiles
}
