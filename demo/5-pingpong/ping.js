/** @jsx h */
const akkajs = require("akkajs")
const { localPort, WorkerProxy} = require("../../work")

const system = akkajs.ActorSystem.create("ping")

const proxy = system.spawn(new WorkerProxy())
setTimeout(() => {
    proxy.tell({
      channelOpen: "pong"
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
    proxy.tell({
      getChannel: "pong",
      answerTo: this.self()
    })
  }
  receive (msg) {
    if (msg !== undefined) {
      if (msg.channel !== undefined) {
        this.pong = msg.channel
        msg.channel.tell({subscribe: this.self()})
        this.become(this.operative)
        //setTimeout( function () {
          msg.channel.tell("CIAO")
        //}, 1000)
      }
    }
  }
  operative (msg) {
    proxy.tell(`PING received: ${msg}`)
  }
}

// have to proper handle this ...
setTimeout( function () {
  system.spawn(new Something())
}, 1000)

module.exports = {
  localPort
}
