/** @jsx h */
const h = require("virtual-dom/h")
const { ActorSystem } = require("akkajs")
const { DomActor, localPort, WorkerProxy } = require("../../work")

const domHandlers = require("./dom-handlers.js")

const system = ActorSystem.create()

// class PingPong extends DomActor {
//   constructor () {
//     super("root")
//     this.status = 0
//     this.name = "ping"
//   }
//   render (value) {
//     return <div className='box'>{[
//       <h1>PingPong</h1>,
//       <p>{"received " + value + " pings"}</p>
//     ]}</div>
//   }
//   postMount () {
//     this.spawn(new Button())
//     this.update(this.status)
//   }
//   receive () {
//     this.update(++this.status)
//   }
// }

// class Button extends DomActor {
//   render () {
//     return <button>Send Ping</button>
//   }
//   events () {
//     return { "click": domHandlers.click }
//   }
//   receive () {
//     // sharedWorkerPort.tellTo(
//     //   "akka://default/user/ping",
//     //   "ping"
//     // )
//   }
// }

// system.spawn(new PingPong())

// const other = (self.name === "ping") ? "pong" : "ping"

if (self.name === "ping") { // name option is mostly unsupported ...
  system.spawn(new WorkerProxy("pong"))
}
// const pongWorkerProxy = system.spawn(new WorkerProxy(other))

module.exports = {
  localPort
}
