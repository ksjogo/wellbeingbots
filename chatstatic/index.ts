const text = require('!raw-loader!./index.html')

module.exports = function (context, req) {
    context.log(process.env.WEBSITE_INSTANCE_ID)
    context.res = {
        status: 200,
        body: text,
        headers: {
            'content-type': 'text/plain',
        },
    }
    context.done()
}
