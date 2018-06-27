/** @jsx h */
const h = require("virtual-dom/h")
const { DomActor } = require("../../work")

const domHandlers = require("./dom-handlers.js")

class PingPongUI extends DomActor {
  constructor (name, channel) {
    super("root")
    this.status = 0
    this.name = name
    this.channel = channel
  }
  render () {
    return <div className='box'>{[
      <h1>{this.name}</h1>,
      <p>{`received ${this.status} pings`}</p>
    ]}</div>
  }
  postMount () {
    this.spawn(new Button(this.channel))
  }
  receive (msg) {
    ++this.status
    this.update()
  }
}

class Button extends DomActor {
  constructor (channel) {
    super()
    this.channel = channel
  }
  render () {
    return <button>Send</button>
  }
  events () {
    return { "click": domHandlers.click }
  }
  receive () {
    this.channel.tell("ping")
  }
}

module.exports = {
  PingPongUI
}
