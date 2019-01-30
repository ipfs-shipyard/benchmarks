'use strict'

const config = require('./config')
const remote = require('./remote.js')
const local = require('./local.js')
const provision = require('./provision')
const persistence = require('./persistence')
const retrieve = require('./retrieve')
const ipfs = require('./ipfs')
const rmfr = require('rmfr')
const os = require('os')
const util = require('util')
const fs = require('fs')
const writeFile = util.promisify(fs.writeFile)
const mkDir = util.promisify(fs.mkdir)
const runCommand = (command, name) => {
  if (config.stage === 'local') {
    return local.run(command, name)
  } else {
    return remote.run(command, name)
  }
}

const run = async (params) => {
  config.stage = params.remote ? 'remote' : 'local'
  let results = []
  const now = Date.now()
  const targetDir = `${os.tmpdir()}/${now}`
  config.log.info(`Target Directory: ${targetDir}`)
  try {
    await mkDir(`${targetDir}`, { recursive: true })
    console.log('tmpDir:', targetDir)
  } catch (e) {
    throw (e)
  }
  if (config.stage !== 'local') {
    try {
      await provision.ensure(params.commit)
    } catch (e) {
      config.log.error(e)
    }
  }
  for (let test of config.benchmarks.tests) {
    // first run the benchmark straight up
    try {
      await mkDir(`${targetDir}/${test.name}`, { recursive: true })
      let result = await runCommand(test.benchmark, test.name)
      config.log.debug(`Writing results ${targetDir}/${test.name}/results.json`)
      // console.log(result)
      await writeFile(`${targetDir}/${test.name}/results.json`, JSON.stringify(result, null, 2))
      if (Object.keys(result).length) {
        results.push(result)
      } else {
        config.log.info(`Skipping empty result: ${result}`)
      }
    } catch (e) {
      config.log.error(e)
      // TODO:  maybe trigger an alert here ??
    }
    if (config.benchmarks.clinic || params.clinic) { // then run it with each of the clinic tools
      config.log.info(`Running clinic: default [${config.benchmarks.clinic}] param [${params.clinic}]`)
      try {
        for (let op of ['doctor', 'flame', 'bubbleProf']) {
          for (let run of test[op]) {
            config.log.debug(`${run.benchmarkName}`)
            await runCommand(run.command)
            // retrieve the clinic files
            await retrieve(config, run, targetDir)
            // cleanup clinic files remotely
            await runCommand(config.benchmarks.cleanup)
          }
        }
      } catch (e) {
        config.log.error(e)
      }
    } else {
      config.log.info(`not running clinic: default [${config.benchmarks.clinic}] param [${params.clinic}]`)
    }
  }
  try {
    config.log.info(`Moving ${config.logFile} to ${targetDir}/stdout.log`)
    fs.rename(config.logFile, `${targetDir}/stdout.log`, (err) => {
      config.log.error(err)
    })
    config.log.info(`Uploading ${targetDir} to IPFS network`)
    const storeOutput = await ipfs.store(targetDir)
    // config.log.debug(storeOutput)
    const sha = ipfs.parse(storeOutput, now)
    config.log.info(`sha: ${sha}`)
    // config.log.debug(results)
    results.map((arrOfResultObjects) => {
      arrOfResultObjects.map((obj) => {
        // add the sha to each measurement
        obj.meta.sha = (typeof sha !== 'undefined' && sha) ? sha : 'none'
        return obj
      })
    })
  } catch (e) {
    config.log.error(`Error storing on IPFS network: ${e}`)
  }
  try {
    config.log.debug(`Persisting results in DB`)
    for (let result of results) {
      config.log.debug(`DB store: ${JSON.stringify(result)}`)
      await persistence.store(result)
    }
    // cleanup tmpout
    rmfr(targetDir)
  } catch (e) {
    throw e
  }
}

module.exports = run
