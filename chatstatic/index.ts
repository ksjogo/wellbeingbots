const text = require('!raw-loader!./index.html').
    replace('${scriptFile}', !process.env.WEBSITE_INSTANCE_ID ?
        'http://localhost:3000/static/bundle.js' :
        'https://wellbeingbots.azurewebsites.net/api/chatjs')

module.exports = function (context: any, req: any) {
    context.res.setHeader('content-type', 'text/html; charset=utf-8')
    context.res.raw(text)
}
