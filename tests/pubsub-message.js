'use strict'

const { build } = require('./schema/results')
const run = require('./lib/runner')
const promiseRetry = require('promise-retry')

/**
 * Pubsub publish & receive a message
 * js0 -> js1 - A test between two JS IPFS node
 * @async
 * @function pubsubMessage
 * @param {array} peerArray - An array of IPFS peers used during the test.
 * @param {string} name - Name of the test used as sending results to the file with same name and data point in dashboard.
 * @param {boolean} warmup - Not implemented.
 * @param {string} fileSet - Describes file or list of files used for the test.
 * @param {Object} meta - Metadata fields to return with result (eg. version, target)
 * @return {Promise<Object>} The data from the benchamrk
 */
async function pubsubMessage (peerArray, name, warmup, fileSet, meta) {
  const topic = 'ipfs-benchmark'
  const peerA = peerArray[0]
  const peerB = peerArray[1]

  // connect peers
  const peerAId = await peerA.id()
  const peerBId = await peerB.id()

  await peerB.swarm.connect(peerAId.addresses[0])

  return new Promise((resolve, reject) => {
    const start = process.hrtime()

    // Subscribe topic
    peerB.pubsub.subscribe(topic, () => {
      const end = process.hrtime(start)
      resolve(build({
        name: 'pubsubMessage',
        warmup: warmup,
        file: 'none',
        meta: meta,
        description: 'Pubsub publish & receive a message.  js0 -> js1',
        file_set: 'none',
        duration: {
          s: end[0],
          ms: end[1] / 1000000
        }
      }))
    })

    // wait for peerA to know about peerB subscription
    let peers
    promiseRetry(async (retry, number) => {
      peers = await peerA.pubsub.peers(topic)
      if (peers.length && peers.includes(peerBId.id)) {
        return Promise.resolve()
      } else {
        retry()
      }
    }).then(() => {
      // Publish
      return peerA.pubsub.publish(topic, Buffer.from('data'))
    }).catch((err) => reject(err))
  })
}

run(pubsubMessage, 2, 'nodejs', { EXPERIMENTAL: {
  pubsub: true
} })
