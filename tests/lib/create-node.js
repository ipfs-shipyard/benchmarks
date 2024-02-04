'use strict'

const { spawn } = require('child_process')
const path = require('path')
const rimraf = require('rimraf')
const defaultConfig = require('../config/default-config.json')
const defaultConfigGo = require('../config/default-config-go.json')
const goConfigs = require('../config/go-configs.json')
const fs = require('fs')
const util = require('util')
const fsMakeDir = util.promisify(fs.mkdir)
const fsWriteFile = util.promisify(fs.writeFile)
const rimrafPromise = util.promisify(rimraf)
const privateKey = require('../config/private-key.json')
const os = require('os')
const conf = { tmpPath: os.tmpdir() }
const { repoPath } = require('../package.json').config
const ipfsClient = require('ipfs-http-client')
const IPFSFactory = require('ipfsd-ctl')
const uuidv1 = require('uuid/v1')
const { once } = require('stream-iterators-utils')
const puppeteer = require('puppeteer')
const WS = require('libp2p-websockets')
const MPLEX = require('libp2p-mplex')
const TCP = require('libp2p-tcp')
const SPDY = require('libp2p-spdy')
const SECIO = require('libp2p-secio')
const argv = require('minimist')(process.argv.slice(2))

const initRepo = async (path) => {
  let init = spawn('ipfs', ['init'], { env: Object.assign(process.env, { IPFS_PATH: path }) })
  init.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })
  init.stderr.on('data', (errorData) => {
    console.error(`stderr: ${errorData}`)
  })
  init.on('close', (code, signal) => {
    console.log('Repo initialized')
  })
  await once(init, 'close')
  return init
}
const parseParams = (options) => {
  if (argv.t === 'ws') {
    options.libp2p.modules.transport.push(WS)
  } else {
    options.libp2p.modules.transport.push(TCP)
  }
  if (argv.m === 'spdy') {
    options.libp2p.modules.streamMuxer.push(SPDY)
  } else {
    options.libp2p.modules.streamMuxer.push(MPLEX)
  }
  if (argv.e === 'secio') {
    options.libp2p.modules.connEncryption.push(SECIO)
  }
}
const CreateNodeJs = async (opt, IPFS, count) => {
  const config = defaultConfig[count].config
  const libp2p = defaultConfig[count].libp2p
  const options = {
    init: { privateKey: privateKey[count].privKey },
    repo: `${repoPath}${String(uuidv1())}`,
    config,
    libp2p

  }
  const newOptions = { ...options, ...opt }
  parseParams(newOptions)
  const node = new IPFS(newOptions)
  node.on('ready', () => {
    console.log('Node ready')
  })
  node.on('error', (err) => {
    console.error(err)
  })
  node.on('stop', () => {
    console.log('Node stopped')
  })
  await once(node, 'ready')
  return node
}

const CreateBrowser = async (opt, IPFS, count) => {
  const testPath = path.join(__dirname, `../browser/build/index.html`)
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(`file://${testPath}`)
  return { page: page, browser: browser, version: () => { return '1' } }
}

const CreateHttp = async (opt, IPFS, count) => {
  let client
  const factory = IPFSFactory.create()
  const spawn = util.promisify(factory.spawn).bind(factory)
  const _ipfsd = await spawn({ initOptions: { bits: 1024 } })
  client = ipfsClient(_ipfsd.apiAddr)
  return client
}

const CreateGo = async (opt, IPFS, count = 0) => {
  const peerDir = `${conf.tmpPath}/ipfs${count}`
  const peerSpecificConf = goConfigs[count]
  const peerConf = Object.assign({}, defaultConfigGo, peerSpecificConf)
  await rimrafPromise(peerDir)
  await fsMakeDir(peerDir, { recursive: true })
  await initRepo(peerDir)
  await fsWriteFile(`${peerDir}/config`, JSON.stringify(peerConf))
  let peer = spawn('/home/ubuntu/ipfs/go-ipfs/cmd/ipfs/ipfs', ['daemon'], { env: Object.assign(process.env, { IPFS_PATH: peerDir }) })
  peer.version = function () { return '1' }
  peer.addresses = ''
  peer.stdout.on('data', (data) => {
    process.stdout.write('go-ipfs: ')
    process.stdout.write(data)
    let version = {}
    const addresses = []
    if (data.includes('Swarm announcing')) {
      addresses.push(data.toString('utf8').split('Swarm announcing')[1])
      peer.addresses = addresses
    }
    if (data.includes('go-ipfs version:')) {
      const stdArray = data.toString('utf8').split('\n')
      for (let item of stdArray) {
        if (item.includes('go-ipfs version:')) {
          version.version = item.split(':')[1].trim()
        }
        if (item.includes('Repo version:')) {
          version.repo = item.split(':')[1].trim()
        }
      }
      peer.version = function () {
        return version
      }
    }
    if (data.includes('Daemon is ready')) {
      peer.emit('done')
    }
  })
  peer.stderr.on('data', (data) => {
    console.error(`go-ipfs: ${data}`)
  })
  peer.on('close', (code, signal) => {
    console.error(`Daemon exited with code: ${code}`)
  })
  peer.on('done', () => {
    console.log('Daemon is ready')
  })
  await once(peer, 'done')

  return peer
}

module.exports = {
  CreateNodeJs,
  CreateGo,
  CreateBrowser,
  CreateHttp
}
