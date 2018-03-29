import fetch from 'node-fetch'

module.exports = function (context, req) {
    (async function () {
        context.res.setHeader('content-type', 'text/plain; charset=utf-8')
        try {
            const url = 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken'
            let reponse = await fetch(url, {
                method: 'POST', headers: {
                    'Ocp-Apim-Subscription-Key': `${process.env['BingSpeech']}`,
                },
            })
            let token = await reponse.text()
            context.res.setHeader('content-type', 'text/plain; charset=utf-8')
            context.res.raw(token)
        } catch (e) {
            context.res.raw('')
        }
    })()
}
