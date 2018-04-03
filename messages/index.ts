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
            text: 'As you wish.',
            value: 'clippy',
            name: 'clippy',
        } as builder.IMessage)
    })
    .matches('Greeting', (session) => {
        session.send('Hello. How are you today?', session.message.text)
    })
    .matches('Help', (session) => {
        session.sendTyping()
        session.send('Let me look for an answer.', session.message.text)
        session.sendTyping()
        qna.recognize(session, (err, faq) => {
            if (err) throw err
            session.send(faq.answers[0].answer)
        })
    })
    .matches('Triage', (session) => {
        session.send("I'm sorry to hear that. I recommend [name]. Here is their contact info:", session.message.text)
    })
    .matches('Cancel', (session) => {
        session.send('Would you like to cancel your session? You said \'%s\'.', session.message.text)
    })
    /*
    .matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
    */
    .onDefault((session) => {
        session.send('Sorry, I did not understand \'%s\'.', session.message.text)
    })

bot.dialog('/', intents)

// Add first run dialog
bot.dialog('firstRun', function (session) {
    session.userData.firstRun = true
    session.send('Hello...').endDialog()
}).triggerAction({
    onFindAction: function (context, callback) {
        // Only trigger if we've never seen user before
        if (!context.userData.firstRun) {
            // Return a score of 1.1 to ensure the first run dialog wins
            callback(null, 1.1)
        } else {
            callback(null, 0.0)
        }
    },
})

const listener = connector.listen()
module.exports = function (context) {
    if (!context.req.body)
        context.req.body = {}
    listener(context, context.req)
}
