const akkajs = require("akkajs")
const diff = require("virtual-dom/diff")

const toJson = require("vdom-as-json").toJson
const serializePatch = require("vdom-serialized-patch/serialize")

const systems = new Map()

/* initialization is location aware local / worker / sharedworker */
class LocalPort {
  constructor () {
    this.postMessage = this.postMessage.bind(this)
    this.onmessage = this.onmessage.bind(this)
  }
  onmessage (msg) { throw "local akkajs-dom onmessage should be assigned" }
  postMessage (e) {
    localOnMessage({"data": e})
  }
}

let localPort = undefined
const sharedWorkerPort = {}

const localOnMessage = function (e) {
  const sys = systems.get(getSystemPath(e.data.id))
  sys.select(e.data.id).tell(e.data.value)
}

let binded = false
try {
  if (global instanceof SharedWorkerGlobalScope) {
    onconnect = function (e) {
      sharedWorkerPort.port = e.ports[0]

      sharedWorkerPort.port.onmessage = localOnMessage

      localPostMessage = function (e) { sharedWorkerPort.port.postMessage(e) }

      // just helpers ...
      // sharedWorkerPort.postMessage = function (e) { sharedWorkerPort.port.postMessage(e) }
      // sharedWorkerPort.tellTo = function (rec, msg) {
      //   sharedWorkerPort.port.postMessage({
      //     "id": rec,
      //     "value": msg
      //   })
      // }
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
  localPostMessage = function (e) { localPort.onmessage({"data": e}) }
}

// helper function
const getSystemPath = function (actorPath) {
  const splitted = actorPath.split("/")
  return (splitted[0] + "//" + splitted[2] + "/" + splitted[3])
}

/* dom actor implementation */

class DomActor extends akkajs.Actor {
  constructor (parentNode) {
    super()
    // internal usage
    this.parentNode = parentNode
    this.mount = this.mount.bind(this)

    // filled by user
    // dom management
    this.render = this.render.bind(this)
    this.events = this.events.bind(this)
    this.postMount = this.postMount.bind(this)
    this.postUnmount = this.postUnmount.bind(this)
    // actor management
    this.receive = this.receive.bind(this)
    this.preStart = this.preStart.bind(this)
    this.postStop = this.postStop.bind(this)

    // called by user
    this.update = this.update.bind(this)
    // events preferred, but register is still available
    this.register = this.register.bind(this)
  }
  update (newValue) {
    const newNode = this.render(newValue)
    const serializedPatch =
      serializePatch(diff(this.node, newNode))
    serializedPatch.update = this.path()
    serializedPatch.id = this.path()
    localPostMessage(serializedPatch)
    this.node = newNode
  }
  mount () {
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
  events () { }
  register (eventName, eventFunction) {
    const reg = {}
    reg.register = eventName
    reg.function = eventFunction.name
    reg.id = this.path()

    systems.set(getSystemPath(this.path()), this.system())
    localPostMessage(reg)
  }
  preStart () {
    if (this.parentNode === undefined) {
      const lio = this.path().lastIndexOf("/")
      this.parentNode = this.path().substring(0, lio)
    }

    this.mount()
  }
  postStop () {
    localPostMessage({"remove": this.path()})

    this.postUnmount()
  }
  postMount () { }
  postUnmount () { }
}

/* WorkerProxy implementation */

class WorkerProxy extends akkajs.Actor {
  constructor () {
    super()
    this.receive = this.receive.bind(this)
    this.ports = new Map()
  }
  preStart () {
    localPostMessage("starting")
    const proxyRegistration = {
      "id": this.path(),
      "proxyRegistration": true
    }

    systems.set(getSystemPath(this.path()), this.system())
    localPostMessage(proxyRegistration)
  }
  receive (msg) {
    if (msg !== undefined) {
      if (msg.channelOpen !== undefined) {
        localPostMessage(`opening channel ${msg.channelOpen}`)
        localPostMessage({
          "id": this.path(),
          "channelOpen": msg.channelOpen
        })
      } else if (msg.channelName !== undefined) {
        if (this.ports.has(msg.channelName)) {
          this.ports.get(msg.channelName).tell({update: msg.channelPort})
        } else {
          const child = this.spawn(new Channel(msg.channelPort))
          this.ports.set(msg.channelName, child)
        }
      } else if (msg.getChannel !== undefined) {
        msg.answerTo.tell({channel: this.ports.get(msg.getChannel)})
      } else {
        localPostMessage(`unmatched proxy message ${msg}`)
      }
    }
  }
}

class Channel extends akkajs.Actor {
  constructor (port) {
    super()
    this.receive = this.receive.bind(this)
    this.setupPort = this.setupPort.bind(this)
    this.portReceive = this.portReceive.bind(this)
    this.port = port
    this.subscribers = []
  }
  portReceive (msg) {
    for (let sub of this.subscribers) {
      sub.tell(msg.data)
    }
  }
  setupPort (port) {
    port.onmessage = this.portReceive
  }
  preStart () {
    this.setupPort(this.port)
  }
  receive (msg) {
    if (msg !== undefined) {
      if (msg.update !== undefined) {
        this.port = msg.update
        this.setupPort(this.port)
      } else if (msg.subscribe !== undefined) {
        localPostMessage(`subscribing ${msg.subscribe}`)
        this.subscribers.push(msg.subscribe)
      } else {
        localPostMessage(`Channel received unknown ${msg} in receive ${this.port}`)
        this.port.postMessage(msg)
      }
    }
  }
}

// class WorkerProxy extends akkajs.Actor {
//   constructor (workerName, pollTime = 1000) {
//     super()
//     this.workerName = workerName
//     this.pollTime = pollTime
//     this.receive = this.receive.bind(this)
//     this.triggerTimeout = this.triggerTimeout.bind(this)
//     this.performRequest = this.performRequest.bind(this)
//     this.operative = this.operative.bind(this)
//   }
//   triggerTimeout () {
//     this.timeout = setTimeout(
//       this.self().tell({"timeout": true}),
//       this.pollTime
//     )
//   }
//   performRequest () {
//     this.triggerTimeout()
//     return setTimeout(
//       this.workerReq,
//       this.pollTime
//     )
//   }
//   preStart () {
//     this.workerReq = {
//       "id": this.path(),
//       "worker": this.workerName
//     }

//     this.triggerTimeout()
//     systems.set(getSystemPath(this.path()), this.system())
//     localPostMessage(this.workerReq)
//   }
//   receive (msg) {
//     try {
//       clearTimeout(this.timeout)
//     } catch (e) {}
//     if (msg !== undefined && msg.timeout !== undefined) {
//       localPostMessage(`${this.workerName} available ${msg}`)
//       this.remotePort = msg
//       this.become(this.operative)
//     } else {
//       this.performRequest()
//     }
//   }
//   operative (msg) {
//     if (msg instanceof MessagePort) {
//       this.port = msg
//       localPostMessage(`messageport registerd ${msg}`)
//     } else if (msg !== undefined) {
//       this.port.postMessage(msg)
//     }
//     // remotePort.postMessage("PIPPO")
//   }
// }

module.exports = {
  DomActor,
  localPort,
  WorkerProxy
}
