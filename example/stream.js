var { concat, pipe } = require('mississippi')
var Service = require('../service')
var s = new Service()
var request = {
  category: 'mch',
  value: '新田美波'
}

pipe(
  s.createStream(request),
  concat(results => console.log(JSON.stringify(results))),
  error => (error && console.error(error))
)
