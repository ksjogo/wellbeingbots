const js = require('!raw-loader!../embed/dist/bundle.js')

module.exports = function (context, req) {
    context.res = {
        status: 200,
        body: js,
        headers: {
            'content-type': 'text/plain',
        },
    }
    context.done()
}
