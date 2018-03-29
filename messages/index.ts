import * as builder from 'botbuilder'
import * as botbuilderAzure from 'botbuilder-azure'
import * as path from 'path'
import { QnAMakerRecognizer } from 'botbuilder-cognitiveservices'

let connector = new botbuilderAzure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    openIdMetadata: process.env['BotOpenIdMetadata'],
} as any)

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot.
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

let tableName = 'botdata'
let azureTableClient = new botbuilderAzure.AzureTableClient(tableName, process.env['AzureWebJobsStorage'])
let tableStorage = new botbuilderAzure.AzureBotStorage({ gzipData: false }, azureTableClient)

let bot = new builder.UniversalBot(connector)
bot.localePath(path.join(__dirname, './locale'))
bot.set('storage', tableStorage)

let luisAppId = process.env.LuisAppId
let luisAPIKey = process.env.LuisAPIKey
const LuisModelUrl = `https://westeurope.api.cognitive.microsoft.com/luis/v2.0/apps/${luisAppId}?subscription-key=${luisAPIKey}`

const qna = new QnAMakerRecognizer({
    knowledgeBaseId: process.env['QNA_KB'],
    subscriptionKey: process.env['QNA_CODE'],
})

let recognizer = new builder.LuisRecognizer(LuisModelUrl)
let intents = new builder.IntentDialog({ recognizers: [recognizer] })
    .matches('Clippy', (session) => {
        session.send({
            text: 'As you wish, Bill.',
            value: 'clippy',
            name: 'clippy',
        } as builder.IMessage)
    })
    .matches('Greeting', (session) => {
        session.send('You reached Greeting intent, you said \'%s\'.', session.message.text)
    })
    .matches('Help', (session) => {
        session.sendTyping()
        session.send('You opened the welfare faq. Let me look for an answer.', session.message.text)
        session.sendTyping()
        qna.recognize(session, (err, faq) => {
            if (err) throw err
            session.send(faq.answers[0].answer)
        })
    })
    .matches('Cancel', (session) => {
        session.send('You reached Cancel intent, you said \'%s\'.', session.message.text)
    })
    /*
    .matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
    */
    .onDefault((session) => {
        session.send('Sorry, I did not understand \'%s\'.', session.message.text)
    })

bot.dialog('/', intents)

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                bot.send(new builder.Message()
                    .address(message.address)
                    .text("Hello! I'm your personal welfare bot. You can just talk to me and I will try to help immediately and forward you to the right human, as well. What can I help you with? "))
            }
        })
    }
})

const listener = connector.listen()
module.exports = function (context) {
    if (!context.req.body)
        context.req.body = {}
    listener(context, context.req)
}
