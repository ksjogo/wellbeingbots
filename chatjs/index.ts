const js = require('!raw-loader!../embed/dist/bundle.js')

module.exports = function (context, req) {
    context.res.setHeader('content-type', 'application/javascript; charset=utf-8')
    context.res.raw(js)
}