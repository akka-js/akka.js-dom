/** @jsx h */
const akkajs = require("akkajs")
const { localPort, WorkerProxy, ConnectedChannel } = require("../../work")
const { PingPongUI } = require("./pingpongui")

const system = akkajs.ActorSystem.create("pong")

const proxy = system.spawn(new WorkerProxy())

class PingChannel extends ConnectedChannel {
  postAvailable () {
    this.ui = this.spawn(new PingPongUI("Pong", this.channel))
  }
  operative (msg) {
    this.ui.tell(msg)
  }
}

ping = system.spawn(new PingChannel(proxy, "ping"))

module.exports = {
  localPort
}
