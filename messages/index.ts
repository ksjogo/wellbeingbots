import * as builder from 'botbuilder'
import * as botbuilderAzure from 'botbuilder-azure'
import * as path from 'path'
import { QnAMakerRecognizer } from 'botbuilder-cognitiveservices'

import * as Gremlin from 'gremlin'

import { promisify } from 'util'

let connector = new botbuilderAzure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    openIdMetadata: process.env['BotOpenIdMetadata'],
} as any)

let tableName = 'botdata'
let azureTableClient = new botbuilderAzure.AzureTableClient(tableName, process.env['AzureWebJobsStorage'])
let tableStorage = new botbuilderAzure.AzureBotStorage({ gzipData: false }, azureTableClient)

// g.v('d50d3daf-59bc-4dc9-8c0b-7c36671d0b4e').out('attached').inE('attached').outV().has('role')

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

const client = Gremlin.createClient(
    443,
    process.env['GRAPH_ENDPOINT'],
    {
        'session': false,
        'ssl': true,
        'user': `/dbs/${process.env['GRAPH_DB']}/colls/${process.env['GRAPH_TABLE']}`,
        'password': process.env['GRAPH_KEY'],
    } as any,
)

const execute = promisify(client.execute).bind(client)
const userid = `'d50d3daf-59bc-4dc9-8c0b-7c36671d0b4e'`

function query (thing) {
    return `g.v(${userid}).out('attached').inE('attached').outV().has('role')`
}
async function lookup (type: string, college = 'catz') {
    let result = await execute(query(type))
    return Promise.resolve(result[0])
}

bot.dialog('Triage', [
    (session, args, next) => {
        let entities = args.intent.entities
        session.conversationData.entities = args.intent.entities
        session.beginDialog('Find Expert')
    },
]).triggerAction({
    matches: 'Triage',
})

function createHeroCard (session, name, role = 'advisor') {
    return new builder.HeroCard(session)
        .title(name)
        .subtitle("Advisor at St. Catherine's")
        //        .text('Build and connect intelligent bots to interact with your users naturally wherever they are, from text/sms to Skype, Slack, Office 365 mail and other popular services.')
        .images([
            builder.CardImage.create(session, 'https://i.imgur.com/Z8dC8qH.jpg'),
        ])
}

bot.dialog('Find Expert', [(session, args, next) => {
    let entities: any[] = session.conversationData.entities
    let identified = entities.length > 0 ? entities[0].type : 'unknown'
    session.send(`Okay, that seem to be syptoms typical for a ${identified.toLowerCase()}. Let me look up the closest expert for you.`)
    session.sendTyping()
    lookup(identified).then((expert) => {
        session.conversationData.expert = expert
        let card = createHeroCard(session, expert.label)
        let msg = new builder.Message(session).addAttachment(card)
        session.send(msg)
        builder.Prompts.choice(session, 'How can he help best?', ['Show email address', 'Send direct message'])
    })
},
(session, results) => {
    if (results.response.index === 0)
        session.send(`That would be ${session.conversationData.expert.properties['e-mail'][0].value}`)
    else
        session.send(`He seems to be offline at the moment.`)
    session.endDialog('Hope I helped, can you write another query.')
}])

// I don't have any energy, I do nothing all day long and my mood is just awful

bot.dialog('Clippy', [
    (session, args, next) => {
        lookup('tst')
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

bot.dialog('/', (session, args, next) => {
    // got an image, what to do?
    session.send('what')
    session.send(JSON.stringify(args))
    session.conversationData.entities = [{ type: 'tf' }]
    session.beginDialog('Find Expert')
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
