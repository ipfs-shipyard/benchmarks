'use strict'

const path = require('path')
const _ = require('lodash')
const remoteTestsPath = process.env.REMOTE_FOLDER || '~/ipfs/tests/'
const remoteIpfsPath = process.env.REMOTE_FOLDER || '~/ipfs/'
const uuidv1 = require('uuid/v1')
const locations = ['local', 'remote']
const clinicOperations = ['doctor', 'flame', 'bubbleProf']
const clinicFilesets = ['One4MBFile', 'One64MBFile']
const tmpOut = '/tmp/out'
const params = `OUT_FOLDER=${tmpOut} REMOTE=true GUID=${uuidv1()} `
const remotePreNode = `killall node 2>/dev/null; killall ipfs 2>/dev/null; source ~/.nvm/nvm.sh && `

const testAbstracts = [
  {
    name: 'localTransfer_tcp_mplex',
    file: 'local-transfer.js -t tcp -m mplex',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'localTransfer_ws_mplex',
    file: 'local-transfer.js -t ws -m mplex',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'localTransfer_ws_mplex',
    file: 'local-transfer.js -t ws -m mplex',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'localTransfer_tcp_mplex_secio',
    file: 'local-transfer.js -t tcp -m mplex -e secio',
    defaultFor: [ 'js-minion', 'js-minion-lite' ]
  },
  {
    name: 'localTransfer_ws_mplex_secio',
    file: 'local-transfer.js -t ws -m mplex -e secio',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'localTransfer_tcp_spdy',
    file: 'local-transfer.js -t tcp -m spdy',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'localTransfer_ws_spdy',
    file: 'local-transfer.js -t ws -m spdy',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'localTransfer_tcp_spdy_secio',
    file: 'local-transfer.js -t tcp -m spdy -e secio',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'localTransfer_ws_spdy_secio',
    file: 'local-transfer.js -t ws -m spdy -e secio',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'unixFsAdd_balanced',
    file: 'local-add.js -s balanced',
    defaultFor: [ 'js-minion', 'js-minion-lite' ]
  },
  {
    name: 'unixFsAdd_trickle',
    file: 'local-add.js -s trickle',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'localExtract',
    file: 'local-extract.js',
    defaultFor: [ 'js-minion', 'js-minion-lite' ]
  },
  {
    name: 'multiPeerTransfer_tcp_mplex',
    file: 'multi-peer-transfer.js -t tcp -m mplex',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'multiPeerTransfer_ws_mplex',
    file: 'multi-peer-transfer.js -t ws -m mplex',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'multiPeerTransfer_tcp_mplex_secio',
    file: 'multi-peer-transfer.js -t tcp -m mplex -e secio',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'multiPeerTransfer_ws_mplex_secio',
    file: 'multi-peer-transfer.js -t ws -m mplex -e secio',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'multiPeerTransfer_tcp_spdy',
    file: 'multi-peer-transfer.js -t tcp -m spdy',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'multiPeerTransfer_ws_spdy',
    file: 'multi-peer-transfer.js -t ws -m spdy',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'multiPeerTransfer_tcp_spdy_secio',
    file: 'multi-peer-transfer.js -t tcp -m spdy -e secio',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'multiPeerTransfer_ws_spdy_secio',
    file: 'multi-peer-transfer.js -t ws -m spdy -e secio',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'addMultiKb_balanced',
    file: 'add-multi-kb -s balanced',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'addMultiKb_trickle',
    file: 'add-multi-kb.js -s trickle',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'initializeNodeBrowser',
    file: 'init-node.browser.js',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'unixFsAddBrowser_balanced',
    file: 'local-add.browser.js -s balanced',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'addMultiKbBrowser_balanced',
    file: 'add-multi-kb.browser.js -s balanced',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'unixFsAddGo_balanced',
    file: 'local-add.go.js -s balanced',
    defaultFor: [ 'js-minion', 'go-minion' ]
  },
  {
    name: 'peerTransferBrowser_ws_mplex',
    file: 'peer-transfer.browser.js -t ws -m mplex',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'pubsubMessage',
    file: 'pubsub-message.js',
    defaultFor: [ 'js-minion' ]
  },
  {
    name: 'extractJs2Go_tcp_mplex_secio',
    file: 'extract-js2.go.js -t tcp -m mplex -e secio',
    defaultFor: [ 'go-minion' ]
  },
  {
    name: 'extractGo2Js_tcp_mplex_secio',
    file: 'extract-go2.js -t tcp -m mplex -e secio',
    defaultFor: [ 'go-minion' ]
  }
]

const clinicRuns = {
  doctor: {
    fileSets: ['One4MBFile', 'One64MBFile']
  },
  flame: {
    fileSets: ['One4MBFile', 'One64MBFile']
  },
  bubbleProf: {
    fileSets: ['One4MBFile']
  }
}

const testDefaults = {
  path: {
    remote: remoteTestsPath,
    local: path.join(__dirname, '/../tests')
  },
  params: params,
  remotePreCommand: remotePreNode
}

const getCommand = (test, loc) => {
  return `${loc === 'remote' ? remotePreNode : ''} ${testDefaults.params} node ${testDefaults.path[loc]}/${test.file}`
}

const getClinicCommands = (test, operation, loc) => {
  if (locations.includes(loc) && clinicOperations.includes(operation)) {
    let variations = []
    for (let fileSet of clinicRuns[operation].fileSets) {
      let shellCommand = `${loc === 'remote' ? remotePreNode : ''} FILESET="${fileSet}" clinic ${operation} --dest ${tmpOut}/${test.name}/ -- node ${testDefaults.path[loc]}/${test.file}`
      variations.push({
        command: shellCommand,
        fileSet: fileSet,
        benchmarkName: test.name,
        operation: operation
      })
    }
    return variations
  } else {
    throw Error(`getClinicCommands requires an operation from ${clinicOperations} and a location from ${locations}`)
  }
}

const constructTests = (loc, doClinic, testNames, target) => {
  let tests = []
  let testItems = []
  if (testNames && testNames.length > 0) {
    testItems = testNames
  } else {
    if (target) {
      testItems = testAbstracts.filter(
        testAbstract => testAbstract.defaultFor.includes(target)
      )
    } else {
      testItems = testAbstracts
    }
  }
  for (let testAbstract of testItems) {
    if (typeof testAbstract === 'string') {
      testAbstract = _.find(testAbstracts, { name: testAbstract })
    }
    if (testAbstract) {
      let test = {
        name: testAbstract.name,
        benchmark: getCommand(testAbstract, loc)
      }
      if (doClinic) {
        test.doctor = getClinicCommands(testAbstract, 'doctor', loc)
        test.flame = getClinicCommands(testAbstract, 'flame', loc)
        test.bubbleProf = getClinicCommands(testAbstract, 'bubbleProf', loc)
      }
      tests.push(test)
    }
  }
  return tests
}

module.exports = {
  testAbstracts,
  constructTests,
  tmpOut,
  remoteIpfsPath,
  remoteTestsPath,
  clinicOperations,
  clinicFilesets
}
