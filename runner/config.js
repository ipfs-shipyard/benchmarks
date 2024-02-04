'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const YAML = require('yaml')
const Influx = require('influx')
const util = require('util')
const Pino = require('pino')
const PinoPretty = require('pino-pretty')
const pinoms = require('pino-multi-stream').multistream
const PinoGetPrettyStream = require('pino/lib/tools').getPrettyStream
const mkDir = util.promisify(fs.mkdir)

let pino

const configBenchmarks = require('./lib/configBenchmarks')
const inventoryPath = process.env.INVENTORY || path.join(__dirname, '../infrastructure/inventory/inventory.yaml')
const playbookPath = path.join(__dirname, '../infrastructure/playbooks/benchmarks.yaml')
const HOME = process.env.HOME || process.env.USERPROFILE
const keyfile = process.env.BENCHMARK_KEY || path.join(HOME, '.ssh', 'id_rsa')
const memorySuffix = '_memory'
const cpuSuffix = '_cpu'
const ipfsAddress = process.env.IPFS_ADDRESS || '/dnsaddr/cluster.ipfs.io'
const ipfsUser = process.env.IPFS_USER || 'ipfsbenchmarks'
const ipfsPassword = process.env.IPFS_PASSWORD || false
const now = Date.now()
const logDir = `${os.tmpdir()}/${now}`
const logFile = `${logDir}/stdout.log`
const logLevel = process.env.LOGLEVEL || 'info'
const hostname = process.env.HOSTNAME || 'localhost'
const benchmarkUser = process.env.BENCHMARK_USER || process.env.USER || 'ubuntu'

mkDir(`${logDir}`, { recursive: true })

// pretty logs in local
if (process.env.NODE_ENV === 'test') {
  pino = Pino({
    enabled: false
  })
} else {
  let streams
  if (process.env.LOG_PRETTY && process.env.LOG_PRETTY === 'true') {
    let prettyStream = PinoGetPrettyStream({
      levelFirst: false,
      translateTime: true,
      colorize: true
    }, PinoPretty, process.stdout)

    streams = [
      { stream: fs.createWriteStream(logFile) },
      { level: logLevel, stream: prettyStream }
    ]
  } else {
    streams = [
      { stream: fs.createWriteStream(logFile) },
      { level: logLevel, stream: process.stdout }
    ]
  }
  pino = Pino({ name: 'runner', level: 'debug' }, pinoms(streams))
}
pino.info(`logFile: ${logFile}`)

const getInventory = () => {
  return YAML.parse(fs.readFileSync(inventoryPath, 'utf8'))
}

const getBenchmarkHostname = () => {
  return getInventory().all.children.minions.hosts
}

let loc = 'remote'
if (process.env.STAGE === 'local') {
  loc = 'local'
}

const runClinic = (process.env.CLINIC && (process.env.CLINIC === 'ON' || process.env.CLINIC === 'true' || process.env.CLINIC === true)) || false
const tests = configBenchmarks.constructTests(loc, runClinic)

const config = {
  provison: {
    command: `ansible-playbook -i ${inventoryPath} --key-file ${keyfile} ` +
      `--user ${benchmarkUser} ${playbookPath}`
  },
  log: pino,
  stage: process.env.STAGE || 'local',
  outFolder: process.env.OUT_FOLDER || configBenchmarks.tmpOut,
  dataDir: process.env.DATADIR || './data/',
  logFile: logFile, // where we store all the stuff that is to be sent to IPFS
  now: now,
  db: 'ipfs-db',
  server: {
    port: 9000,
    apikey: process.env.API_KEY || 'supersecret',
    hostname: hostname,
    schedule: process.env.RUN_NIGHTLY || true,
    api: {
      clinic: {
        operations: configBenchmarks.clinicOperations,
        filesets: configBenchmarks.clinicFilesets
      },
      benchmarks: {
        tests: configBenchmarks.testAbstracts
      }
    }
  },
  influxdb: {
    host: process.env.INFLUX_HOST || 'localhost',
    db: 'benchmarks',
    schema: [
      {
        measurement: tests[0].measurement,
        fields: {
          duration: Influx.FieldType.FLOAT,
          ipfs_sha: Influx.FieldType.STRING
        },
        tags: [
          'warmup',
          'commit',
          'project',
          'file_set',
          'branch',
          'guid',
          'version',
          'repo',
          'sha',
          'nightly',
          'tag'
        ]
      },
      {
        measurement: `${tests[0].measurement}${memorySuffix}`,
        fields: {
          memory: Influx.FieldType.INTEGER,
          ipfs_sha: Influx.FieldType.STRING
        },
        tags: [
          'warmup',
          'commit',
          'project',
          'file_set',
          'branch',
          'guid',
          'version',
          'repo',
          'sha',
          'nightly',
          'tag'
        ]
      },
      {
        measurement: `${tests[0].measurement}${cpuSuffix}`,
        fields: {
          cpu: Influx.FieldType.INTEGER,
          ipfs_sha: Influx.FieldType.STRING
        },
        tags: [
          'warmup',
          'commit',
          'project',
          'file_set',
          'branch',
          'guid',
          'version',
          'repo',
          'sha',
          'nightly'
        ]
      }
    ]
  },
  benchmarks: {
    clinic: runClinic,
    host: getBenchmarkHostname(),
    user: benchmarkUser,
    key: keyfile,
    path: path.join(__dirname, '../tests'),
    remotePath: configBenchmarks.remoteTestsPath,
    tests: tests,
    cleanup: `rm -Rf ${configBenchmarks.tmpOut}/*`,
    measurements: {
      memory: memorySuffix,
      cpu: cpuSuffix
    }
  },
  ipfs: {
    path: configBenchmarks.remoteIpfsPath,
    network: {
      address: ipfsAddress,
      user: ipfsUser,
      password: ipfsPassword
    }
  }
}

config.log.debug(config.benchmarks.tests)

module.exports = config
