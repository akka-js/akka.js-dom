const akkajs = require('akkajs')
const diff = require('virtual-dom/diff')
const createElement = require('virtual-dom/create-element')

const toJson = require('vdom-as-json').toJson
const serializePatch = require('vdom-serialized-patch/serialize')

const systems = new Map()

/* initialization is location aware local / worker / sharedworker */
class LocalPort {
  constructor() {
    this.postMessage = this.postMessage.bind(this)
    this.onmessage = this.onmessage.bind(this)
  }
  onmessage(msg) { throw "local akkajs-dom onmessage should be assigned" }
  postMessage(e) {
    localOnMessage({"data": e})
  }
}

let localPort = undefined
const sharedWorkerPort = {}

const localOnMessage =  function(e) {
  const sys = systems.get(getSystemPath(e.data.id))
  sys.select(e.data.id).tell(e.data.value)
}
let localPostMessage = undefined

let binded = false
try {
  if (global instanceof SharedWorkerGlobalScope) {
    onconnect = function(e) {
      sharedWorkerPort.port = e.ports[0]

      sharedWorkerPort.port.onmessage = localOnMessage

      localPostMessage = function(e) {sharedWorkerPort.port.postMessage(e)}

      //just helpers ...
      sharedWorkerPort.postMessage = function(e) {sharedWorkerPort.port.postMessage(e)}
      sharedWorkerPort.tellTo = function(rec, msg) {
        sharedWorkerPort.port.postMessage({
          "id": rec,
          "value": msg
        })
      }
    }
    binded = true
  }
} catch (e) {}

try {
  if (!binded && global instanceof WorkerGlobalScope) {
    onmessage = localOnMessage
    localPostMessage = postMessage
    binded = true
  }
} catch (e) {}

if (!binded) {
  localPort = new LocalPort()
  localPostMessage = function(e) {localPort.onmessage({"data": e})}
}


//helper function
const getSystemPath = function(actorPath) {
  const splitted = actorPath.split('/')
  return (splitted[0] + "//" + splitted[2] + "/" + splitted[3])
}

/* dom actor implementation */

class DomActor extends akkajs.Actor {
  constructor(parentNode) {
    super()
    // internal usage
    this.parentNode = parentNode
    this.mount = this.mount.bind(this)

    // filled by user
    // dom management
    this.render = this.render.bind(this)
    this.events = this.events.bind(this)
    this.postMount = this.postMount.bind(this)
    // actor management
    this.receive = this.receive.bind(this)
    this.preStart = this.preStart.bind(this)
    this.postStop = this.postStop.bind(this)

    // called by user
    this.update = this.update.bind(this)
    // events preferred, but register is still available
    this.register = this.register.bind(this)
  }
  update(newValue) {
    const newNode = this.render(newValue)
    const serializedPatch =
      serializePatch(diff(this.node, newNode))
    serializedPatch.update = this.path()
    serializedPatch.id = this.path()
    localPostMessage(serializedPatch)
    this.node = newNode
  }
  mount() {
    if (this.node === undefined) {
      this.node = this.render()
    }

    const node = toJson(this.node)
    node.create = this.parentNode
    node.id = this.path()
    localPostMessage(node)

    const events = this.events()
    for (const k in events) {
      this.register(k, events[k])
    }

    this.postMount()
  }
  events() { }
  register(eventName, eventFunction) {
    const reg = {}
    reg.register = eventName
    reg.function = eventFunction.name
    reg.id = this.path()

    systems.set(getSystemPath(this.path()), this.system())
    localPostMessage(reg)
  }
  preStart() {
    if (this.parentNode === undefined) {
      const lio = this.path().lastIndexOf("/")
      this.parentNode = this.path().substring(0, lio)
    }

    this.mount()
  }
  postStop() {
    localPostMessage({"remove": this.path()})
  }
  postMount() { }
}

module.exports = {
  DomActor,
  localPort,
  sharedWorkerPort
}
