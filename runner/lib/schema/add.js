'use strict'

const addBody = {
  $id: 'addBody',
  type: 'object',
  properties: {
    commit: {
      type: 'string',
      description: 'Commit to test against'
    },
    target: {
      type: 'string',
      description: 'currently js-minion or go-minion',
      enum: ['js-minion', 'js-minion-lite', 'go-minion']
    },
    nightly: {
      type: 'boolean',
      default: false,
      description: 'Set the "nightly" flag in meta data'
    },
    tag: {
      type: 'string',
      description: 'arbitrary metsdata that gets propagated to the metrics DB as "tag"'
    },
    benchmarks: {
      type: 'object',
      properties: {
        tests: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Names of benchmark tests to be run'
        }
      }
    },
    clinic: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: false },
        tests: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    }
  },
  required: ['commit', 'target']
}

const addResponse = {
  $id: 'addResponse',
  200: {
    description: 'Succesful response',
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
      nightly: { type: 'boolean' },
      tag: { type: 'string' },
      id: { type: 'integer' }
    }
  }
}

module.exports = {
  addBody,
  addResponse
}
