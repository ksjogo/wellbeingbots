import { observable } from 'mobx'
import autobind from 'autobind-decorator'
import { DirectLine } from 'botframework-webchat/built/BotChat'
import * as querystring from 'querystring'

export default class AppState {
  @observable chatLine: DirectLine = null

  @observable clippyAgent: any = null

  async remote (command: string, args: any) {
    if (command !== 'chattoken')
      return Promise.resolve({})

    const url = `https://wellbeingbots.azure-api.net/${command}?${querystring.stringify(args)}`
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
    let response = await fetch(url, {
      method: 'POST',
      headers: headers,
    })
    return response.json()
  }
}
