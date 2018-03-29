import * as React from 'react'
import { observer, inject } from 'mobx-react'
import { Chat as WebChat, DirectLine, EventActivity, Message } from 'botframework-webchat'
import 'botframework-webchat/botchat.css'
import * as Spinner from 'react-spinkit'
import { Clippy } from './Clippy'
import AppState from './AppState'
import autobind from 'autobind-decorator'

@observer
export class Chat extends React.Component<{ appState: AppState }, {}> {
    async componentDidMount () {
        try {
            let data = await this.props.appState.remote('chattoken', {})
            this.props.appState.chatLine = new DirectLine({ token: data.token })
            this.props.appState.chatLine.activity$.filter(activity => {
                if (activity.from.id !== 'user') {
                    this.props.appState.clippyAgent.animate()
                    switch (activity.type) {
                        case 'message':
                            return !!activity.entities
                        default:
                            return false
                    }
                }
            }).subscribe(this.onActivity)
        } catch (e) {
            console.error(e)
        }
    }

    @autobind
    async onActivity (activity: Message) {
        activity.entities.forEach(async (thing) => {
            console.log(thing.action)
        })
    }

    @autobind
    sendActivity (name: string, value: any) {
        this.props.appState.chatLine
            .postActivity({ type: 'event', value: value, from: { id: 'user' }, name: name })
            .subscribe(id => console.log('success'))
    }

    render () {
        return <div className={this.props.appState.hidden ? 'chatbox' : 'chatbox chatboxShown'}>
            <div className='clippyContainer'>
                <Clippy appState={this.props.appState} />
            </div>
            <div className='webchat'>
                {this.props.appState.chatLine ? <WebChat
                    adaptiveCardsHostConfig={{}}
                    bot={{ id: 'bot' }}
                    user={{ id: 'user' }}
                    chatTitle='Common Room'
                    botConnection={this.props.appState.chatLine}
                /> : <Spinner />}
            </div>
        </div>
    }
}
