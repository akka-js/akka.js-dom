/** @jsx h */
const h = require("virtual-dom/h")
const { ActorSystem } = require("akkajs")
const { Logger, LogLevel, localPort } = require("../../work")

const system = ActorSystem.create()

const log = new Logger(system, LogLevel.debug)

log.debug("debug log - not shown")
log.info("info log")
log.warn("warning log")
log.error("error log")

module.exports = {
  localPort
}
