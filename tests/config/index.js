'use strict'
const uuidv1 = require('uuid/v1')
const guid = process.env.GUID || uuidv1()
const fileSetParam = (process.env.FILESET && process.env.FILESET.toLowerCase()) || false
const verify = process.env.VERIFYOFF && process.env.VERIFYOFF.toLowerCase() === 'true'
const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    s: 'strategy',
    t: 'transport',
    m: 'muxer',
    e: 'encryption'
  }
})

const tests = { 'unixFsAdd': [{
  'warmup': 'Off',
  'fileSet': ['OneKBFile', 'OneMBFile', 'One4MBFile', 'One64MBFile'] } ],
'localExtract': [{
  'warmup': 'Off',
  'fileSet': ['OneKBFile', 'OneMBFile', 'One4MBFile', 'One64MBFile'] } ],
'localTransfer': [{
  'warmup': 'Off',
  'fileSet': ['OneKBFile', 'OneMBFile', 'One4MBFile', 'One64MBFile'] } ],
'multiPeerTransfer': [{
  'warmup': 'Off',
  'fileSet': ['OneKBFile', 'OneMBFile', 'One4MBFile', 'One64MBFile'] } ],
'addMultiKb': [{
  'warmup': 'Off',
  'fileSet': ['Hundred1KBFile'] } ],
'initializeNode': [{
  'warmup': 'Off',
  'fileSet': ['None'] }],
'initializeNodeBrowser': [{
  'warmup': 'Off',
  'fileSet': ['None'] }],
'unixFsAddBrowser': [{
  'warmup': 'Off',
  'fileSet': ['OneKBFile', 'OneMBFile', 'One4MBFile', 'One64MBFile'] }],
'addMultiKbBrowser': [{
  'warmup': 'Off',
  'fileSet': ['Hundred1KBFile'] } ],
'peerTransferBrowser': [{
  'warmup': 'Off',
  'fileSet': ['OneKBFile', 'OneMBFile'] }],
'unixFsAddGo': [{
  'warmup': 'Off',
  'fileSet': ['OneKBFile', 'OneMBFile', 'One4MBFile', 'One64MBFile'] } ],
'extractJs2Go': [{
  'warmup': 'Off',
  'fileSet': ['OneKBFile', 'OneMBFile', 'One4MBFile', 'One64MBFile'] } ],
'extractGo2Js': [{
  'warmup': 'Off',
  'fileSet': ['OneKBFile', 'OneMBFile', 'One4MBFile', 'One64MBFile'] } ],
'pubsubMessage': [{
  'warmup': 'Off',
  'fileSet': ['None'] }]
}
const parseParams = () => {
  let name = '_'
  let desc = '('
  let strategy = 'balanced'
  if (argv.strategy) {
    if (argv.strategy === 'trickle') {
      name = `${name}trickle`
      desc = `${desc}trickle`
      strategy = 'trickle'
    } else {
      name = `${name}balanced`
      desc = `${desc}balanced`
    }
  } else {
    if (argv.transport === 'ws') {
      name = `${name}ws_`
      desc = `${desc}websocket, `
    } else {
      name = `${name}tcp_`
      desc = `${desc}tcp, `
    }
    if (argv.muxer === 'spdy') {
      name = `${name}spdy`
      desc = `${desc}spdy`
    } else {
      name = `${name}mplex`
      desc = `${desc}mplex`
    }
    if (argv.encryption === 'secio') {
      name = `${name}_secio`
      desc = `${desc}, secio`
    }
  }
  desc = `${desc})`
  let target = argv.target
  return { name, description: desc, strategy, target }
}
const config = {
  test: tests,
  fileSetParam: fileSetParam,
  verify: verify,
  guid: guid,
  parseParams: parseParams
}

module.exports = config
