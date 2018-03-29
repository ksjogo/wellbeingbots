import * as React from 'react'
import { observer, inject } from 'mobx-react'
import * as Spinner from 'react-spinkit'
import * as ClippyJS from 'clippy'
import AppState from './AppState'
import autobind from 'autobind-decorator'
import { autorun } from 'mobx'
const logo = require('../style/logo.png')

@observer
export class Clippy extends React.Component<{ appState: AppState }, {}> {

    constructor(...args) {
        super(...args)
        autorun(() => {
            if (this.props.appState.clippyMsStyle && !this.props.appState.clippyAgent) {
                (ClippyJS as any).load('Clippy', (agent) => {
                    this.props.appState.clippyAgent = agent
                    agent.show()
                    this.forceUpdate()
                }, () => { return })
            }
        })
    }

    @autobind
    toggle () {
        this.props.appState.chatEnabled = true
        this.props.appState.hidden = !this.props.appState.hidden
    }

    render () {
        return <div className='clippybox' onClick={this.toggle}>
            {!this.props.appState.clippyMsStyle ?
                <img className='chatLogoCR' src={logo} />
                :
                <div
                    ref={
                        (wrapper) => {
                            if (wrapper && this.props.appState.clippyAgent) {
                                try {
                                    this.props.appState.clippyAgent._el[0].parentElement.removeChild(this.props.appState.clippyAgent._el[0])
                                    wrapper.appendChild(this.props.appState.clippyAgent._el[0])
                                } catch (e) { return }
                            }
                        }} />
            }
        </div>
    }
}
