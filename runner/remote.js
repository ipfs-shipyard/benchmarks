'use strict'

const remoteExec = require('ssh-exec-plus')
const config = require('./config')

const run = (shell, name) => {
  config.log.info(`Running [${shell}] on host [${config.benchmarks.host}] for user [${config.benchmarks.user}] using [${config.benchmarks.key}]`)
  return new Promise((resolve, reject) => {
    remoteExec(shell, {
      user: config.benchmarks.user,
      host: config.benchmarks.host,
      key: config.benchmarks.key
    }, (err, stdout, stderr) => {
      config.log.debug({
        err: err,
        stdout: stdout,
        stderr: stderr
      })
      if (err || stderr) {
        reject(Error(stderr))
      }

      // if name is provided we assume it's a json file we read and pass back as the command's result.
      if (name) {
        let retrieveCommand = `cat ${config.outFolder}/${name}.json`
        config.log.info(`running  [${retrieveCommand}] on [${config.benchmarks.host}]`)
        remoteExec(retrieveCommand, {
          user: config.benchmarks.user,
          host: config.benchmarks.host,
          key: config.benchmarks.key
        }, (err, stdout, stderr) => {
          config.log.debug({
            err: err,
            stdout: stdout,
            stderr: stderr
          })
          if (err || stderr) {
            reject(new Error(stderr))
            return
          }
          if (stdout) {
            try {
              let objResults = JSON.parse(stdout)
              config.log.debug(objResults)
              resolve(objResults)
            } catch (e) {
              reject(e)
            }
          }
        })
      } else {
        resolve(stdout)
      }
    })
  })
}

module.exports = {
  run: run
}
