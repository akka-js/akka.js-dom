/** @jsx h */
const h = require("virtual-dom/h")
const { ActorSystem } = require("akkajs")
const { DomActor } = require("akkajs-dom/work")

const domHandlers = require("./dom-handlers.js")

const system = ActorSystem.create()

class EchoKeys extends DomActor {
  constructor () {
    super("root")
  }
  render (value) {
    if (this.status === undefined || value === undefined) {
      this.status = ""
    } else {
      this.status += value
    }

    return <div>{[
      <label>click me</label>,
      <p>{this.status}</p>
    ]}</div>
  }
  events () {
    return { "click": domHandlers.click }
  }
  receive (msg) {
    this.update(msg)
  }
}

system.spawn(new EchoKeys())
