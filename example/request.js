var Service = require('../service')
var s = new Service()
var request = {
  category: 'act',
  value: 'o.ri'
}

var hook = a => b => (c, d) => (c ? a(c) : b(d))
var hk = hook(error => console.error(error))

s.request(request, hk(results => {
  var uri = s.createURI(request)
  console.log(JSON.stringify({ uri, request, results }))
}))
