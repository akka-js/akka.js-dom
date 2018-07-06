const { ActorSystem } = require("akkajs")
const { localPort } = require("../../work")
const { PrimeUI } = require("./prime-commons")

const system = ActorSystem.create()

system.spawn(new PrimeUI())

module.exports = {
  localPort
}
