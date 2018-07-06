import * as h from "virtual-dom/h"
/** @jsx h */
import { ActorSystem, Actor } from "akkajs"
import { Logger, LogLevel, DomActor } from "../../work"

const system = ActorSystem.create()

const log = new Logger(system, LogLevel.info)

class Example extends Actor {
  receive (msg : any) {
    log.warn("received "+msg)
  }
}

const example = system.spawn(new Example())

setTimeout(
  () => example.tell("hello world!"),
  500
)

class LabelActor extends DomActor {
  constructor () {
    super("root")
  }
  render: () => any = () => {
    return <label>Hello world!</label>
  }
  receive = () => { }
}

system.spawn(new LabelActor())

export { localPort } from "../../work"
