/** @jsx h */
const akkajs = require("akkajs")
const { localPort, WorkerProxy, ConnectedChannel } = require("../../work")
const { PingPongUI } = require("./pingpongui")

const system = akkajs.ActorSystem.create("ping")

const proxy = system.spawn(new WorkerProxy())

class PongChannel extends ConnectedChannel {
  postAvailable () {
    this.ui = this.spawn(new PingPongUI("Ping", this.channel))
  }
  operative (msg) {
    this.ui.tell(msg)
  }
}

pong = system.spawn(new PongChannel(proxy, "pong"))

module.exports = {
  localPort
}
