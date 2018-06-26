/** @jsx h */
const akkajs = require("akkajs")
const { localPort, WorkerProxy, ChannelClient, ConnectedChannel} = require("../../work")

const system = akkajs.ActorSystem.create("ping")

const proxy = system.spawn(new WorkerProxy())

class PongChannel extends ConnectedChannel {
  postAvailable () {
    console.log("POST AVAILABLE")
    this.count = 10
    this.channel.tell("PING")
  }
  operative (msg) {
    console.log("message is ", msg)
    if (this.count > 0) {
      this.channel.tell("PING " + this.count)
      this.count -= 1
    }
  }
}

pong = system.spawn(new PongChannel(proxy, "pong"))

module.exports = {
  localPort
}
