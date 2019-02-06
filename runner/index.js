'use strict'
require('make-promises-safe') // installs an 'unhandledRejection' handler
const schedule = require('node-schedule')
const fastify = require('fastify')({
  logger: true
})
const headerSchema = require('./lib/schema/header')
const addSchema = require('./lib/schema/add')
const getSchema = require('./lib/schema/get')
const restartSchema = require('./lib/schema/restart')
const config = require('./config')
const runner = require('./runner')
const Queue = require('./queue')
const docs = {
  benchmarks: config.server.api.benchmarks,
  clinic: config.server.api.clinic
}
docs.benchmarks.txt = `Benchmarks run with their own set of files mandated by the type of test.`
docs.clinic.txt = `For clinic runs you can request to run wit a specific fileset.`

// This function exits the main process, relying on process manager to restart
// so that a new version of the runner can be applied on next startup
const stopFn = (cb) => {
  config.log.info('Exiting for restart.')
  cb()
  fastify.close(() => {
    process.exit(0)
  })
}

const queue = new Queue(stopFn, runner)

// run this every day at midnight, at least
schedule.scheduleJob('0 0 * * *', function () {
  queue.add({
    commit: '',
    clinic: {
      enabled: true
    },
    remote: true,
    nightly: true
  })
})

fastify.register(require('fastify-swagger'), {
  routePrefix: '/docs',
  swagger: {
    info: {
      title: 'IPFS Runner API',
      description: 'Running benchmkarks for IPFS projects. For more documentation see https://github.com/ipfs/benchmarks',
      version: '1.0.0'
    },
    host: config.server.hostname,
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  },
  exposeRoute: true
})

fastify.addSchema(headerSchema.headers)
fastify.addSchema(addSchema.addBody)
fastify.addSchema(addSchema.addResponse)

// add a new task to the queue
fastify.route({
  method: 'POST',
  url: '/',
  schema: {
    description: 'Add a job run to the queue.',
    body: 'addBody#',
    headers: 'protect#',
    response: 'addResponse#'
  },
  handler: async (request, reply) => {
    let task = queue.add({
      commit: request.body.commit,
      clinic: request.body.clinic,
      benchmarks: request.body.benchmarks,
      remote: true,
      nightly: true
    })
    return task
  }
})

fastify.addSchema(getSchema.getResponse)

// list tasks
fastify.route({
  method: 'GET',
  url: '/',
  schema: {
    description: 'List all jobs in the Queue',
    response: 'getResponse#'
  },
  handler: async (request, reply) => {
    let status = queue.getStatus()
    fastify.log.info('getting queue status', status)
    return status
  }
})

// we do want to be able to drain the queue
fastify.route({
  method: 'POST',
  url: '/drain',
  schema: {
    description: 'Drain all non active jobs from the queue and return the queue status',
    headers: 'protect#',
    response: 'getResponse#'
  },
  handler: async (request, reply) => {
    return queue.drain()
  }
})

fastify.addSchema(restartSchema.restartResponse)

// after CD deployed new code we queue a restart of the runner
fastify.route({
  method: 'POST',
  url: '/restart',
  schema: {
    description: 'Schedule a restart in the queu and return the scheduled job',
    headers: 'protect#',
    response: 'restartResponse#'
  },
  handler: async (request, reply) => {
    let task = queue.add({
      restart: true
    })
    return task
  }
})

// Run the server!
const start = async () => {
  try {
    await fastify.listen(config.server.port, '0.0.0.0')
    fastify.log.info(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
