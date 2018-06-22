/** @jsx h */
const akkajs = require("akkajs")
const { localPort, WorkerProxy } = require("../../work")

const system = akkajs.ActorSystem.create("pong")

const proxy = system.spawn(new WorkerProxy())
setTimeout(() => {
    proxy.tell({
      channelOpen: "ping"
    })
  },
  500
)

class Something extends akkajs.Actor {
  constructor () {
    super()
    this.receive = this.receive.bind(this)
    this.operative = this.operative.bind(this)
  }
  preStart () {
    console.log("qui finalmente so quello che faccio")
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

// have to proper handle this ...
setTimeout( function () {
  system.spawn(new Something())
}, 800)

module.exports = {
  localPort
}
