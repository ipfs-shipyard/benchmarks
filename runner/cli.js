'user strict'

const argv = require('yargs').argv
const get = require('simple-get')
const config = require('./config')

const opts = {
  url: `http://localhost:${config.server.port}/`,
  body: {
    commit: argv.commit || '',
    target: argv.target || '',
    clinic: argv.clinic || { enabled: false }
  },
  json: true,
  headers: {
    'x-ipfs-benchmarks-api-key': config.server.apikey
  }
}
get.post(opts, function (err, res) {
  if (err) throw err
  res.pipe(process.stdout) // `res` is a stream
})
