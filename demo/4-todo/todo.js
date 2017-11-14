/** @jsx h */
const h = require("virtual-dom/h")
const { ActorSystem } = require("akkajs")
const { DomActor } = require("akkajs-dom/work")

const domHandlers = require("./dom-handlers.js")

const system = ActorSystem.create()

class Input extends DomActor {
  render () {
    return <input placeholder={"type and ENTER"} value="" />
  }
  events () {
    return { "keyup": domHandlers.getValue }
  }
  receive (msg) {
    if (msg !== undefined) {
      this.parent().tell(msg)
      this.update()
    }
  }
}

class Elem extends DomActor {
  constructor (text) {
    super()
    this.text = text
  }
  render () {
    return <li>{[
      this.text,
      <button>X</button>
    ]}</li>
  }
  events () {
    return { "click": domHandlers.getKill }
  }
  receive (msg) {
    if (msg.kill) {
      this.self().kill()
    }
  }
}

class ToDoList extends DomActor {
  constructor (address) {
    super("root")
  }
  render (value) {
    return <ul />
  }
  postMount () {
    this.spawn(new Input())
  }
  receive (msg) {
    this.spawn(new Elem(msg))
  }
}

system.spawn(new ToDoList())
