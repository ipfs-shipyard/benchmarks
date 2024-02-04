'use strict'

const getResponse = {
  $id: 'getResponse',
  200: {
    description: 'Successful response',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        jobId: { type: 'integer' },
        work: {
          type: 'object',
          properties: {
            commit: { type: 'string' },
            clinic: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' }
              }
            },
            benchmarks: {
              type: 'object',
              properties: {
                tests: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            },
            remote: { type: 'boolean' },
            nightly: { type: 'boolean' }
          }
        },
        status: { type: 'string' },
        queued: { type: 'string' },
        started: { type: 'string' }
      }
    }
  }
}

module.exports = {
  getResponse
}
