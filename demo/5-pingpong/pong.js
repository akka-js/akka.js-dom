/** @jsx h */
const akkajs = require("akkajs")
const { localPort, WorkerProxy, ChannelClient, ConnectedChannel} = require("../../work")

const system = akkajs.ActorSystem.create("pong")

const proxy = system.spawn(new WorkerProxy())

class PingChannel extends ConnectedChannel {
  postAvailable () {
    this.count = 0
  }
  operative (msg) {
    // if (msg != undefined && msg instanceof String && msg.startsWith("PING")) {
      this.channel.tell("PONG " + this.count)
      this.count += 1
    // }
  }
}

ping = system.spawn(new PingChannel(proxy, "ping"))

module.exports = {
  localPort
}
