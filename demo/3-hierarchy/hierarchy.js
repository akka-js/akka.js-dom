/** @jsx h */
const h = require("virtual-dom/h")
const { ActorSystem } = require("akkajs")
const { DomActor, localPort } = require("../../work")

const system = ActorSystem.create()

class RootNode extends DomActor {
  constructor () {
    super("root")
  }
  postMount () {
    this.spawn(new Node(1))
  }
  render () {
    return <div />
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
    return <ul className='tree'>{[
      Array(this.level - 1).fill().map(() => { return <li>{this.level}</li> }),
      <li className='last'>{this.level}</li>
    ]}</ul>
  }
  receive (msg) {
    if (this.level < 10) {
      this.spawn(new Node(this.level + 1))
    }
  }
}

system.spawn(new RootNode())

module.exports = {
  localPort
}
