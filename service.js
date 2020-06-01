var xtend = require('xtend')
var trumpet = require('trumpet')
var inherits = require('inherits')
var urlencode = require('urlencode')
var { duplex, through, concat } = require('mississippi')
var DoozinService = require('@ishiduca/doozin-service')

function DoozinServiceEcToranoanaJp () {
  if (!(this instanceof DoozinServiceEcToranoanaJp)) {
    return new DoozinServiceEcToranoanaJp()
  }

  var origin = 'https://ec.toranoana.jp'
  var searchHome = origin + '/tora_r/ec/app/catalog/list/'
  var hyperquest = xtend(
    DoozinService.defaultConfig.hyperquest, { origin, searchHome }
  )
  var config = xtend(DoozinService.defaultConfig, { hyperquest })

  DoozinService.call(this, config)
}

inherits(DoozinServiceEcToranoanaJp, DoozinService)
module.exports = DoozinServiceEcToranoanaJp

DoozinServiceEcToranoanaJp.prototype.createURI = function (params) {
  var { category, value, opts } = params
  var maps = {
    mak: 'searchMaker',
    act: 'searchActor',
    nam: 'searchCommodityName',
    mch: 'searchChara',
    gnr: 'searchWord',
    kyw: 'searchWord',
    com: 'searchWord'
  }
  var query = xtend({
    searchCategoryCode: '04',
    // searchChildrenCategoryCode: 'cot',
    searchBackorderFlg: 0,
    searchUsedItemFlg: 1,
    searchDisplay: 12,
    detailSearch: true
  }, { [maps[category]]: value }, opts)

  return this.config.hyperquest.searchHome + '?' +
    urlencode.stringify(query, this.config.urlencode)
}

DoozinServiceEcToranoanaJp.prototype.createOpts = function (params) {
  return xtend({
    method: this.config.hyperquest.method,
    headers: xtend(this.config.hyperquest.headers, { cookie: 'adflg=0' })
  })
}

DoozinServiceEcToranoanaJp.prototype.scraper = function () {
  var tr = trumpet()
  var rs = through.obj()
  var i = 0
  var isBingo = false
  var selector = '#search-result-container.pull-right div ul.list li.list__item div.search-result-inside-container'
  var mid = through.obj()
  mid.on('pipe', src => (i += 1))
  mid.on('unpipe', src => ((i -= 1) || mid.end()))
  mid.pipe(rs)

  tr.selectAll(selector, div => {
    isBingo = true
    var src = through.obj()
    var snk = through.obj()
    var tr = trumpet()
    var links = []

    snk.pipe(mid, { end: false })
    src.pipe(concat(x => {
      var result = x.reduce((a, b) => xtend(a, b), {})
      snk.end(result)
    }))

    tr.select('div.product_img a', a => {
      a.getAttribute('href', href => {
        var urlOfTitle = this.config.hyperquest.origin + href
        src.write({ urlOfTitle })
      })
      var tr = trumpet()
      tr.select('img', img => {
        img.getAttribute('data-src', srcOfThumbnail => {
          src.write({ srcOfThumbnail })
        })
        img.getAttribute('alt', title => {
          src.write({ title })
        })
      })
      a.createReadStream().pipe(tr)
    })

    tr.selectAll('div.product_desc ul.product_labels li a', a => {
      var tr = trumpet()
      a.createReadStream().pipe(tr).pipe(concat(buffer => {
        a.getAttribute('href', h => {
          var href = this.config.hyperquest.origin + h
          var text = String(buffer).replace(/<[^>]+?>/g, '')
          links.push({ href, text })
        })
      }))
    })

    div.createReadStream().pipe(tr)
      .once('end', () => src.end({ links }))
  })
  tr.once('end', () => isBingo || mid.end())

  return duplex.obj(tr, rs)
}
