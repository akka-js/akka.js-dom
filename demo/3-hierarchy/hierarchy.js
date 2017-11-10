/** @jsx h */
const h = require("virtual-dom/h")
const { ActorSystem } = require("akkajs")
const { DomActor } = require("akkajs-dom/work")

const system = ActorSystem.create()

class RootNode extends DomActor {
  constructor () {
    super("root")
  }
  postMount () {
    this.spawn(new Node(1))
  }
  render () {
    return <div></div>
  }
}

class Node extends DomActor {
  constructor (level) {
    super()
    this.level = level
  }
  postMount () {
    setTimeout(
      () => { this.self().tell("next-level") },
      1000
    )
  }
  render () {
    return <ul>{[
      Array(this.level).fill().map(() => { return <li>{this.level}</li> } )
    ]}</ul>
  }
  receive (msg) {
    if (this.level < 10) {
      this.spawn(new Node(this.level + 1))
    }
  }
}

system.spawn(new RootNode())
