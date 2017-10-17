/** @jsx h */
const h = require('virtual-dom/h')
const patch = require('virtual-dom/patch')
const createElement = require('virtual-dom/create-element')

const fromJson = require('vdom-as-json').fromJson
const applyPatch = require('vdom-serialized-patch/patch')

const uiManagement = function(worker, handlers, orElse) {
  const elems = new Map()

  return function(e) {
    if (e.data.create !== undefined) {
      // console.log("creating "+e.data.create)
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
      // console.log("updating")
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
      // console.log("registering function")
      const elem = elems.get(e.data.id)
      const funName = e.data.function

      elem.addEventListener(e.data.register, function(event) {
        const msg = {}
        msg.id = e.data.id
        msg.value = handlers[funName](event)

        worker.postMessage(msg)
      }, false)
    } else {
      orElse(e)
    }
  }
}

class UiManager {
  constructor(worker, handlers, unmatchedFun) {
    this.worker = worker
    this.handlers = handlers
    this.unmatchedFun = unmatchedFun
    if (unmatchedFun === undefined) {
     this.unmatchedFun = function(e) {
       console.log("unmatched message %o", e.data)
     }
    }
    if (worker instanceof SharedWorker) {
      this.worker.port.onmessage = uiManagement(this.worker.port, this.handlers, this.unmatchedFun)
    } else if (worker instanceof Worker) {
      this.worker.onmessage = uiManagement(this.worker, this.handlers, this.unmatchedFun)
    } else if (this.worker.localPort !== undefined){
      this.worker.localPort.onmessage = uiManagement(this.worker.localPort, this.handlers, this.unmatchedFun)
    } else {
     throw "Invalid Worker in UiManager, should be one of Worker, SharedWorker, or have a localPort"
    }
  }
}

module.exports = {
  UiManager
}
