/** @jsx h */
const akkajs = require("akkajs")
const { localPort, WorkerProxy } = require("../../work")

const system = akkajs.ActorSystem.create("pong")

const proxy = system.spawn(new WorkerProxy())
proxy.tell({
  channelOpen: "ping"
})

class Something extends akkajs.Actor {
  constructor () {
    super()
    this.receive = this.receive.bind(this)
    this.operative = this.operative.bind(this)
  }
  preStart () {
    proxy.tell({
      getChannel: "ping",
      answerTo: this.self()
    })
  }
  receive (msg) {
    if (msg !== undefined) {
      if (msg.channel !== undefined) {
        this.ping = msg.channel
        msg.channel.tell({subscribe: this.self()})
        this.become(this.operative)
      }
    }
  }
  operative (msg) {
    this.ping.tell("HEY!")
    proxy.tell(`PONG received ${msg}`)
  }
}

setTimeout( function () {
  system.spawn(new Something())
}, 100)

module.exports = {
  localPort
}
