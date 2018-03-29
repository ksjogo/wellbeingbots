import fetch from 'node-fetch'

module.exports = function (context, req) {
    (async function () {
        try {
            const url = 'https://webchat.botframework.com/api/tokens'
            let reponse = await fetch(url, {
                method: 'GET', headers: {
                    Authorization: `BotConnector ${process.env['BotAuth']}`,
                },
            })
            let token = await reponse.json()
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
