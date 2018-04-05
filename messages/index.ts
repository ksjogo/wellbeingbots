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

bot.recognizer(recognizer)

const timeout = ms => new Promise(res => setTimeout(res, ms))

async function lookup (type: string, college = 'catz') {
    let timer = await timeout(5000)
    return Promise.resolve('Johnny')
}

bot.dialog('Triage', [
    (session, args, next) => {
        let entities = args.intent.entities
        session.dialogData.entities = args.intent.entities
        session.send(`Okay, I identified the main problem to likely be ${entities[0].type}. Let me look up the expert for you.`)
        session.sendTyping()
        lookup(entities).then((expert: string) => {
            session.send(`That seems to be ${expert}`)
            builder.Prompts.choice(session, 'How can I help best?', ['Get email address', 'Get Phone number'])
        })
    },
    (session, results) => {
        session.send(JSON.stringify(results))
        session.endDialog('ok')
    },
],
).triggerAction({
    matches: 'Triage',
    onInterrupted: session => {
        session.send('Please provide a destination')
    },
})

bot.dialog('Clippy', [
    (session, args, next) => {
        session.send({
            text: 'As you wish, Bill.',
            value: 'clippy',
            name: 'clippy',
        } as builder.IMessage)
    }],
).triggerAction({
    matches: 'Clippy',
})

bot.dialog('Greeting', [
    (session, args, next) => {
        session.send('You reached Greeting intent, you said \'%s\'.', session.message.text)
    }],
).triggerAction({
    matches: 'Greeting',
})

bot.dialog('Help', [
    (session, args, next) => {
        session.sendTyping()
        session.send('You opened the welfare faq. Let me look for an answer.', session.message.text)
        session.sendTyping()
        qna.recognize(session, (err, faq) => {
            if (err) throw err
            session.send(faq.answers[0].answer)
        })
    }],
).triggerAction({
    matches: 'Clippy',
})

bot.dialog('None', [
    (session, args, next) => {
        session.send('Sorry, I did not understand \'%s\'.', session.message.text)
    }],
).triggerAction({
    matches: 'None',
})

bot.dialog('Cancel', [
    (session, args, next) => {
        session.send('You canceled')
    }],
).triggerAction({
    matches: 'Cancel',
})

bot.use(builder.Middleware.sendTyping())

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
