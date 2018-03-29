import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import DevTools from 'mobx-react-devtools'
import AppState from './AppState'
import { hot } from 'react-hot-loader'
import { Chat } from './Chat'

@observer
class App extends React.Component<{ appState: AppState }, {}> {
    render () {
        return (
            <div>
                <Chat appState={this.props.appState} />
                {location.hostname === 'localhost' ?
                    <DevTools /> : <div />}
            </div>
        )
    }
}

export default hot(module)(App)
