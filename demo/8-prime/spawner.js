/** @jsx h */
const h = require("virtual-dom/h")
const { ActorSystem } = require("akkajs")
const { DomActor, localPort } = require("../../work")
const { UiManager } = require("../../page")
const { PrimeUI } = require("./prime-commons")

const domHandlers = require("./dom-handlers.js")

const system = ActorSystem.create()

class Spawner extends DomActor {
  constructor () {
    super("root")
  }
  postMount () {
    system.spawn(new PrimeUI("Get Primes [Page] - Don't press!!!"))
  }
  render () {
    return <button>Spawn!</button>
  }
  events () {
    return { "click": domHandlers.click }
  }
  receive () {
    new UiManager(
      new Worker("./js/prime.out.js"),
      { handlers: domHandlers }
    )
  }
}

system.spawn(new Spawner())

module.exports = {
  localPort
}
