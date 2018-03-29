import * as React from 'react'
import { observer, inject } from 'mobx-react'
import { Chat as WebChat, DirectLine, EventActivity, Message } from 'botframework-webchat'
import * as CognitiveServices from 'botframework-webchat/CognitiveServices.js'
import 'botframework-webchat/botchat.css'
import * as Spinner from 'react-spinkit'
import { Clippy } from './Clippy'
import AppState from './AppState'
import autobind from 'autobind-decorator'
import { autorun } from 'mobx';

@observer
export class Chat extends React.Component<{ appState: AppState }, {}> {
    constructor(...args) {
        super(...args)
        autorun(() => {
            this.props.appState.chatEnabled && this.loadChat()
        })
    }

    async loadChat () {
        try {
            let data = await this.props.appState.remote('chattoken', {})
            this.props.appState.chatLine = new DirectLine({ token: data.token })
            this.props.appState.chatLine.activity$.filter(activity => {
                if (activity.from.id !== 'user') {
                    this.props.appState.clippyMsStyle && this.props.appState.clippyAgent.animate()
                    switch ((activity as any).name) {
                        case 'clippy':
                            return true
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
        switch ((activity as any).name) {
            case 'clippy':
                this.props.appState.clippyMsStyle = !this.props.appState.clippyMsStyle
                setTimeout(() => { this.props.appState.clippyAgent && this.props.appState.clippyAgent.animate() }, 1000)
                break
            default:
                break
        }
    }

    @autobind
    sendActivity (name: string, value: any) {
        this.props.appState.chatLine
            .postActivity({ type: 'event', value: value, from: { id: 'user' }, name: name })
            .subscribe(id => console.log('success'))
    }

    getToken () {
        return fetch(
            'https://wellbeingbots.azurewebsites.net/api/speechtoken',
            {
                headers: {
                },
                method: 'POST',
            },
        ).then(res => res.text())
    }

    speechOptions = {
        speechRecognizer: new CognitiveServices.SpeechRecognizer({
            fetchCallback: (authFetchEventId) => this.getToken(),
            fetchOnExpiryCallback: (authFetchEventId) => this.getToken(),
        }),
        speechSynthesizer: new CognitiveServices.SpeechSynthesizer({
            gender: CognitiveServices.SynthesisGender.Female,
            fetchCallback: (authFetchEventId) => this.getToken(),
            fetchOnExpiryCallback: (authFetchEventId) => this.getToken(),
        }),
    }

    render () {
        return <div className={this.props.appState.hidden ? 'chatbox' : 'chatbox chatboxShown'}>
            <div className='clippyContainer'>
                <Clippy appState={this.props.appState} />
            </div>
            <div className='webchat'>
                {this.props.appState.chatLine ? <WebChat
                    adaptiveCardsHostConfig={{}}
                    speechOptions={this.speechOptions}
                    bot={{ id: 'bot' }}
                    user={{ id: 'user' }}
                    chatTitle='Common Room'
                    botConnection={this.props.appState.chatLine}
                /> :
                    <div className='wc-chatview-panel'>
                        <Spinner className='spinner' />
                    </div>}
            </div>
        </div>
    }
}
