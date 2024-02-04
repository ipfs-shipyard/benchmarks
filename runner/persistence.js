'use strict'

const Influx = require('influx')
const moment = require('moment')
const config = require('./config')

const influx = new Influx.InfluxDB({
  host: config.influxdb.host,
  database: config.influxdb.db,
  schema: config.influxdb.schema
})

const parseDuration = (objDuration) => {
  let ms = ((objDuration.s * 1000) + objDuration.ms)
  return parseFloat(ms)
}

const writePoints = (data) => {
  if (!Array.isArray(data)) {
    data = [data]
  }
  const timeStamp = moment().toDate()
  let payload = []
  for (let point of data) {
    config.log.info(`${point.name} data point: `, point)
    payload.push({
      measurement: point.name,
      tags: { warmup: point.warmup || 'tbd',
        commit: point.meta.commit || 'tbd',
        project: point.meta.project || 'tbd',
        file_set: point.file_set || 'tbd',
        version: point.meta.version.version || 'tbd',
        target: point.meta.target || 'tbd',
        repo: point.meta.version.repo || 'tbd',
        guid: point.meta.guid || 'tbd',
        sha: point.meta.sha || 'tbd',
        branch: point.meta.branch || 'tbd',
        nightly: point.meta.nightly || false,
        tag: point.meta.tag || 'none'
      },
      fields: { duration: parseDuration(point.duration), ipfs_sha: point.meta.sha || 'no upload' },
      timestamp: timeStamp
    })
    payload.push({
      measurement: `${point.name}${config.benchmarks.measurements.memory}`,
      tags: { warmup: point.warmup || 'tbd',
        commit: point.meta.commit || 'tbd',
        project: point.meta.project || 'tbd',
        file_set: point.file_set || 'tbd',
        version: point.meta.version.version || 'tbd',
        target: point.meta.target || 'tbd',
        repo: point.meta.version.repo || 'tbd',
        guid: point.meta.guid || 'tbd',
        sha: point.meta.sha || 'tbd',
        branch: point.meta.branch || 'tbd',
        nightly: point.meta.nightly || false
      },
      fields: { memory: point.memory, ipfs_sha: point.meta.sha || 'no upload' },
      timestamp: timeStamp
    })
    payload.push({
      measurement: `${point.name}${config.benchmarks.measurements.cpu}`,
      tags: { warmup: point.warmup || 'tbd',
        commit: point.meta.commit || 'tbd',
        project: point.meta.project || 'tbd',
        file_set: point.file_set || 'tbd',
        version: point.meta.version.version || 'tbd',
        target: point.meta.target || 'tbd',
        repo: point.meta.version.repo || 'tbd',
        guid: point.meta.guid || 'tbd',
        sha: point.meta.sha || 'tbd',
        branch: point.meta.branch || 'tbd',
        nightly: point.meta.nightly || false
      },
      fields: { cpu: point.cpu, ipfs_sha: point.meta.sha || 'no upload' },
      timestamp: timeStamp
    })
  }
  influx.writePoints(payload)
}

const ensureDb = async (db) => {
  let names = await influx.getDatabaseNames()
  if (!names.includes(db)) {
    return influx.createDatabase(db)
  } else {
    return influx
  }
}

const store = async (result) => {
  try {
    await ensureDb('benchmarks')
    await writePoints(result)
  } catch (err) {
    config.log.error(err)
  }
  return true
}

module.exports = {
  store: store
}
