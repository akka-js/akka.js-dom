/** @jsx h */
const h = require("virtual-dom/h")
const patch = require("virtual-dom/patch")
const createElement = require("virtual-dom/create-element")

const fromJson = require("vdom-as-json").fromJson
const applyPatch = require("vdom-serialized-patch/patch")

const { LogLevel } = require("./log")

const workers = new Map()
const proxies = new Map()
const channels = new Map()

const uiManagement = function (worker, handlers, orElse, name) {
  const elems = new Map()

  return function (e) {
    // UI management
    if (e.data.create !== undefined) {
      const elem = createElement(fromJson(e.data))
      if (elems.has(e.data.create)) {
        elems
          .get(e.data.create)
          .appendChild(elem)
      } else {
        document
          .getElementById(e.data.create)
          .appendChild(elem)
      }
      elems.set(e.data.id, elem)
    } else if (e.data.update !== undefined) {
      applyPatch(elems.get(e.data.id), e.data)
    } else if (e.data.remove !== undefined) {
      const node = elems.get(e.data.remove)

      try {
        node.parentNode.removeChild(node)
      } catch (e) {}
      try {
        node.remove()
      } catch (e) {}

      elems.delete(e.data.remove)
    } else if (e.data.register) {
      const elem = elems.get(e.data.id)
      const funName = e.data.function

      elem.addEventListener(e.data.register, function (event) {
        const msg = {}
        msg.id = e.data.id
        msg.value = handlers[funName](event)

        worker.postMessage(msg)
      }, false)
    // workers communication management
    } else if (e.data.proxyRegistration !== undefined) {
      proxies.set(name, e.data.id)
    } else if (e.data.channelOpen !== undefined) {

      if (channels.has(name + e.data.channelOpen)) {
        const channel = channels.get(name + e.data.channelOpen)

        worker.postMessage({
          id: e.data.id,
          value: {
            channelName: e.data.channelOpen,
            channelPort: channel.port2
          }
        }, [channel.port2])
      } else {
        const channel = new MessageChannel()
        channels.set(e.data.channelOpen + name, channel)
  
        worker.postMessage({
          id: e.data.id,
          value: {
            channelName: e.data.channelOpen,
            channelPort: channel.port1
          }
        }, [channel.port1])
      }
    // Logging functionality
    } else if (e.data.log !== undefined) {
      const text = `[${name}] ${e.data.log}`
      switch (e.data.level) {
        case LogLevel.debug:
          console.debug(text)
          break
        case LogLevel.info:
          console.info(text)
          break
        case LogLevel.warning:
          console.warn(text)
          break
        case LogLevel.error:
          console.error(text)
          break
      }
    } else {
      orElse(e)
    }
  }
}

const defaultUnmatchedFunction = function (e) {
  console.log("unmatched message %o", e.data)
}

const randomName = function () {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

class UiManager {
  constructor (worker,
      { name = randomName(),
        handlers = undefined,
        unmatchedFun = defaultUnmatchedFunction
      } = {
        name: randomName(),
        handlers: undefined,
        unmatchedFun: defaultUnmatchedFunction
      }) {
    this.worker = worker
    this.handlers = handlers
    this.unmatchedFun = unmatchedFun
    this.name = name
    if (unmatchedFun === undefined) {
      this.unmatchedFun = defaultUnmatchedFunction
    }
    if (worker instanceof SharedWorker) {
      this.worker.port.onmessage = uiManagement(this.worker.port, this.handlers, this.unmatchedFun, this.name)
      workers.set(this.name, this.worker.port)
    } else if (worker instanceof Worker) {
      this.worker.onmessage = uiManagement(this.worker, this.handlers, this.unmatchedFun, this.name)
      workers.set(this.name, this.worker)
    } else if (this.worker.localPort !== undefined) {
      this.worker.localPort.onmessage = uiManagement(this.worker.localPort, this.handlers, this.unmatchedFun, this.name)
      workers.set(this.name, this.worker.localPort)
    } else {
      throw "Invalid Worker in UiManager, should be one of Worker, SharedWorker, or a module with localPort exported"
    }
  }
}

module.exports = {
  UiManager,
  defaultUnmatchedFunction
}
