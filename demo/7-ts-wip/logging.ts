import { ActorSystem, Actor } from "akkajs"
import { Logger, LogLevel } from "../../work"

const system = ActorSystem.create()

const log = new Logger(system, LogLevel.info)

// log.debug("debug log - not shown")
// log.info("info log")
// log.warn("warning log")
// log.error("error log")

class Example extends Actor {
  receive (msg : any) {
    log.warn("received "+msg)
  }
}

const actor = system.spawn(new Example())

setTimeout(
  () => actor.tell("CIAO"),
  1000
)

export { localPort } from "../../work"
