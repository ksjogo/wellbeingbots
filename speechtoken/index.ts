import fetch from 'node-fetch'

module.exports = function (context, req) {
    (async function () {
        try {
            const url = 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken'
            let reponse = await fetch(url, {
                method: 'POST', headers: {
                    'Ocp-Apim-Subscription-Key': `${process.env['BingSpeech']}`,
                },
            })
            let token = await reponse.text()
            context.res = {
                body: {
                    token: token,
                },
            }
        } catch (e) {
            context.res = {
                status: 400,
                body: 'Please pass a name on the query string or in the request body',
            }
        } finally {
            context.done()
        }
    })()
}
