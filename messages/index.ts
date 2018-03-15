/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add
natural language support to a bot.
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-luis
-----------------------------------------------------------------------------*/
console.log('crap')

import * as builder from 'botbuilder'
import * as botbuilderAzure from 'botbuilder-azure'
import * as path from 'path'

let connector = new builder.ChatConnector({
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

// Make sure you add code to validate these fields
let luisAppId = process.env.LuisAppId
let luisAPIKey = process.env.LuisAPIKey
let luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com'

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey

// Main dialog with LUIS
let recognizer = new builder.LuisRecognizer(LuisModelUrl)
let intents = new builder.IntentDialog({ recognizers: [recognizer] })
    .matches('Greeting', (session) => {
        session.send('You reached Greeting intent, you said \'%s\'.', session.message.text)
    })
    .matches('Help', (session) => {
        session.send('You reached Help intent, you said \'%s\'.', session.message.text)
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

const listener = connector.listen()
let inner = connector.listen()
module.exports = function (context) {
    inner(context.req, context.res)
}
