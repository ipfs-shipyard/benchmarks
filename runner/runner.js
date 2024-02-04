'use strict'

const rmfr = require('rmfr')
const os = require('os')
const util = require('util')
const fs = require('fs')
const writeFile = util.promisify(fs.writeFile)
const fsReadfile = util.promisify(fs.readFile)
const fsTruncate = util.promisify(fs.truncate)
const mkDir = util.promisify(fs.mkdir)

const config = require('./config')
const remote = require('./remote.js')
const local = require('./local.js')
const provision = require('./provision')
const persistence = require('./persistence')
const compress = require('./compress')
const retrieve = require('./retrieve')
const ipfs = require('./ipfs')
const configBenchmarks = require('./lib/configBenchmarks')
const runCommand = (command, name) => {
  if (config.stage === 'local') {
    return local.run(command, name)
  } else {
    return remote.run(command, name)
  }
}

const enrichResultsMetas = (arrOfResultObjects, props) => {
  arrOfResultObjects.map((obj) => {
    if (Object.keys(props).length) {
      Object.assign(obj.meta, props)
    }
    return obj
  })
}

// clear the log file
const clearFile = async (path) => {
  const fd = fs.openSync(config.logFile, 'r+')
  await fsTruncate(fd)
  fs.closeSync(fd)
}

const run = async (params) => {
  config.log.debug(params)
  // start with a clean logfile
  config.log.info(`Clearing logs at ${config.logFile}`)
  await clearFile()
  config.stage = params.remote ? 'remote' : 'local'
  let results = []
  const now = Date.now()
  const targetDir = `${config.dataDir}/${now}`
  config.log.info(`Target Directory: ${targetDir}`)
  try {
    await mkDir(`${targetDir}`, { recursive: true })
    config.log.info('targetDir:', targetDir)
  } catch (e) {
    throw (e)
  }
  if (config.stage !== 'local') {
    try {
      await provision.ensure(params.commit)
    } catch (e) {
      config.log.error(e)
      throw (e)
    }
  }
  let benchmarks
  if (params.benchmarks && params.benchmarks.tests && params.benchmarks.tests.length) {
    const testsJson = JSON.stringify(params.benchmarks.tests)
    config.log.info(`Running benchmarks from parameters: ${testsJson}`)
    benchmarks = configBenchmarks.constructTests(config.stage, params.clinic.enabled, params.benchmarks.tests)
    config.log.error(`The following benchmarks were constructed ${JSON.stringify(benchmarks)}`)
    if (!benchmarks) {
      config.log.error(`no valid benchmarks found in ${testsJson}`)
    }
  } else {
    config.log.info('Running ALL default benchmarks for', params.target)
    benchmarks = configBenchmarks.constructTests(config.stage, params.clinic.enabled, null, params.target)
  }
  for (let test of benchmarks) {
    // first run the benchmark straight up
    try {
      await mkDir(`${targetDir}/${test.name}`, { recursive: true })
      let arrResult = await runCommand(test.benchmark + ` --target=${params.target}`, test.name)
      config.log.debug(`Writing results ${targetDir}/${test.name}/results.json`)
      await writeFile(`${targetDir}/${test.name}/results.json`, JSON.stringify(arrResult, null, 2))
      if (arrResult.length) {
        let objMeta = {}
        if (params.nightly) {
          objMeta.nightly = true
        }
        if (params.tag) {
          objMeta.tag = params.tag
        }
        enrichResultsMetas(arrResult, objMeta)
        results.push(arrResult)
      } else {
        config.log.info(`Skipping empty result array: ${arrResult}`)
      }
    } catch (e) {
      config.log.error(e)
      // TODO:  maybe trigger an alert here ??
    }
    if (config.benchmarks.clinic || params.clinic.enabled) { // then run it with each of the clinic tools
      config.log.info(`Running clinic: default [${config.benchmarks.clinic}] param [${params.clinic.enabled}]`)
      try {
        for (let op of ['doctor', 'flame', 'bubbleProf']) {
          for (let run of test[op]) {
            config.log.debug(`${run.benchmarkName}`)
            await runCommand(run.command)
            // retrieve the clinic files
            const clinicOperationPath = await retrieve(config, run, targetDir)
            // cleanup clinic files remotely
            await runCommand(config.benchmarks.cleanup)
            // compress the clinic files
            await compress.clinicFiles(clinicOperationPath)
          }
        }
      } catch (e) {
        config.log.error(e)
      }
    } else {
      config.log.info(`not running clinic: default [${config.benchmarks.clinic}] param [${params.clinic.enabled}]`)
    }
  }
  let isUploaded = false
  let sha
  try {
    try {
      config.log.info(`Copying logs from ${config.logFile} to ${targetDir}/stdout.log`)
      const logs = await fsReadfile(config.logFile)
      await writeFile(`${targetDir}/stdout.log`, logs)
    } catch (err) {
      config.log.error(err, 'Error copying logs')
    }
    config.log.info(`Uploading ${targetDir} to IPFS network`)
    const storeOutput = await ipfs.store(targetDir)
    // config.log.debug(storeOutput)
    sha = ipfs.parse(storeOutput, now)
    config.log.info(`sha: ${sha}`)
    // config.log.debug(results)
    results.map((arrOfResultObjects) => {
      arrOfResultObjects.map((obj) => {
        // add the sha to each measurement
        const _sha = (typeof sha !== 'undefined' && sha) ? sha : 'none'
        enrichResultsMetas(arrOfResultObjects, {sha: _sha})
        return obj
      })
    })
    isUploaded = true
  } catch (e) {
    config.log.error({ e }, 'Error storing on IPFS network')
  }
  try {
    config.log.debug(`Persisting results in DB`)
    for (let result of results) {
      config.log.debug(`DB store: ${JSON.stringify(result)}`)
      await persistence.store(result)
    }
  } catch (e) {
    throw e
  }
  // cleanup tmpout
  try {
    // cleanup tmpout
    if (isUploaded) {
      await rmfr(targetDir)
      config.log.info(`Files are uploaded to [https://cloudflare-ipfs.com/ipfs/${sha}]`)
    } else {
      config.log.error(`Files haven't been uploaded, not removing them from [${targetDir}]`)
    }
  } catch (e) {
    throw e
  }
}

module.exports = run
