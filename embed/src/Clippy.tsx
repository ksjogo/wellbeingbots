import * as React from 'react'
import { observer, inject } from 'mobx-react'
import * as Spinner from 'react-spinkit'
import * as ClippyJS from 'clippy'
import AppState from './AppState'

@observer
export class Clippy extends React.Component<{ appState: AppState }, {}> {

    componentDidMount () {
        if (!this.props.appState.clippyAgent) {
            (ClippyJS as any).load('Clippy', (agent) => {
                this.props.appState.clippyAgent = agent
                agent.show()
                this.forceUpdate()
            }, () => { return })
        }
    }
    render () {
        return <div className='clippybox'>
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
        </div>
    }
}
