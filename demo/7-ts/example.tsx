// Disclaimer, it looks like TypeScript do not like VDoms other than React...
//
// https://github.com/parcel-bundler/parcel/issues/1095
//
// here is an hacked solution to live with this limitation.
// this comes with using `"jsx": "react"` in tsconfig.json
//
import * as h from "virtual-dom/h"
const React = { createElement: h }
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
  render = () => {
    return <label>Hello world!</label>
  }
}

system.spawn(new LabelActor())

export { localPort } from "../../work"
