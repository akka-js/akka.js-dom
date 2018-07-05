const akkajs = require("akkajs")
const diff = require("virtual-dom/diff")

const toJson = require("vdom-as-json").toJson
const serializePatch = require("vdom-serialized-patch/serialize")

const { LogLevel } = require("./log")

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
  if (e.data.id !== undefined) {
    const sys = systems.get(getSystemPath(e.data.id))
    sys.select(e.data.id).tell(e.data.value)
  }
}

let binded = false
try {
  if (global instanceof SharedWorkerGlobalScope) {
    onconnect = function (e) {
      sharedWorkerPort.port = e.ports[0]

      sharedWorkerPort.port.onmessage = localOnMessage

      localPostMessage = function (e) { sharedWorkerPort.port.postMessage(e) }
    }
    binded = true
  }
} catch (e) {}

try {
  if (!binded && global instanceof WorkerGlobalScope) {
    global.onmessage = localOnMessage
    localPostMessage = global.postMessage
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
    const proxyRegistration = {
      id: this.path(),
      proxyRegistration: true
    }

    systems.set(getSystemPath(this.path()), this.system())
    localPostMessage(proxyRegistration)
  }
  receive (msg) {
    if (msg !== undefined) {
      if (msg.channelOpen !== undefined) {
        const child = this.spawn(new Channel(msg.channelOpen))
        this.ports.set(msg.channelOpen, child)
      } else if (msg.channelName !== undefined) {
        this.ports.get(msg.channelName).tell(msg)
      } else if (msg.getChannel !== undefined) {
        msg.answerTo.tell({channel: this.ports.get(msg.getChannel)})
      } else {
        localPostMessage(`unmatched proxy message ${msg}`)
      }
    }
  }
}

class Channel extends akkajs.Actor {
  constructor (channelOpen) {
    super()
    this.channelOpen = channelOpen
    this.receive = this.receive.bind(this)
    this.operative = this.operative.bind(this)
    this.portReceive = this.portReceive.bind(this)
    this.subscribers = []
  }
  portReceive (msg) {
    for (let sub of this.subscribers) {
      sub.tell(msg.data)
    }
  }
  preStart () {
    localPostMessage({
      id: this.path(),
      channelOpen: this.channelOpen
    })
    this.timeout = setTimeout(() => {
      this.self().tell({timeout: true})
    }, 100)
  }
  receive (msg) {
    if (msg !== undefined) {
      if (msg.timeout !== undefined) {
        // console.log("retry!")
        this.preStart()
      } else if (msg.channelName !== undefined) {
        clearTimeout(this.timeout)
        this.port = msg.channelPort
        this.port.onmessage = this.portReceive
        this.become(this.operative)
      } else if (msg.subscribe !== undefined) {
        this.subscribers.push(msg.subscribe)
      }
    }
  }
  operative (msg) {
    if (msg !== undefined) {
      if (msg.channelName !== undefined) {
        this.port = msg.channelPort
        this.port.onmessage = this.portReceive
      } else if (msg.subscribe !== undefined) {
        this.subscribers.push(msg.subscribe)
      } else {
        // console.log(`Channel ${this.channelOpen} received ${msg}`)
        // localPostMessage(`Channel ${this.channelOpen} received ${msg}`)
        this.port.postMessage(msg)
      }
    }
  }
}

class ChannelClient extends akkajs.Actor {
  constructor (proxy, channelName) {
    super()
    this.proxy = proxy
    this.channelName = channelName
    this.receive = this.receive.bind(this)
    this.postConnect = this.postConnect.bind(this)
  }
  postConnect () { }
  preStart () {
    this.proxy.tell({
      channelOpen: this.channelName
    })
    setTimeout(
      () => this.proxy.tell({
        getChannel: this.channelName,
        answerTo: this.self()
      }),
      0
    )
  }
  receive (msg) {
    if (msg !== undefined) {
      if (msg.channel !== undefined) {
        this.channel = msg.channel
        this.channel.tell({subscribe: this.self()})
        this.postConnect()
      }
    }
  }
}

class ConnectedChannel extends ChannelClient {
  constructor (proxy, channelName) {
    super(proxy, channelName)
    this.checkConnection = this.checkConnection.bind(this)
    this.postAvailable = this.postAvailable.bind(this)
    this.consumeInFlight = this.consumeInFlight.bind(this)
    this.operative = this.operative.bind(this)
  }
  postConnect () {
    this.become(this.checkConnection)
    setTimeout(
      () => this.channel.tell({available: true}),
      10
    )
    this.timeout = setTimeout(
      () => this.self().tell({retry: true}),
      100
    )
  }
  checkConnection (msg) {
    clearTimeout(this.timeout)
    if (msg !== undefined) {
      if (msg.retry !== undefined) {
        setTimeout(
          () => this.channel.tell({available: true}),
          10
        )
        this.timeout = setTimeout(
          () => this.self().tell({retry: true}),
          100
        )
      } else if (msg.available !== undefined) {
        this.timeout = setTimeout(
          () => this.self().tell({noInFlight: true}),
          100
        )
        this.become(this.consumeInFlight)
      }
    }
  }
  consumeInFlight (msg) {
    if (msg !== undefined) {
      if (msg.retry !== undefined || msg.available !== undefined) { } else {
        clearTimeout(this.timeout)
        this.postAvailable()
        this.become(this.operative)

        if (msg.noInFlight === undefined) {
          this.self().tell(msg)
        }
      }
    }
  }
  postAvailable () { }
  operative (msg) { }
}

class Logger {
  constructor (system, level) {
    this.logger = system.spawn(new LoggerActor(level))
    this.debug = this.debug.bind(this)
    this.info = this.info.bind(this)
    this.warn = this.warn.bind(this)
    this.error = this.error.bind(this)
  }
  debug (txt) {
    this.logger.tell({
      level: LogLevel.debug,
      text: txt
    })
  }
  info (txt) {
    this.logger.tell({
      level: LogLevel.info,
      text: txt
    })
  }
  warn (txt) {
    this.logger.tell({
      level: LogLevel.warning,
      text: txt
    })
  }
  error (txt) {
    this.logger.tell({
      level: LogLevel.error,
      text: txt
    })
  }
}

class LoggerActor extends akkajs.Actor {
  constructor (level) {
    super()
    this.level = level
  }
  receive (msg) {
    if (msg !== undefined) {
      if (msg.level - this.level >= 0) {
        localPostMessage({
          log: msg.text,
          level: msg.level
        })
      }
    }
  }
}

module.exports = {
  DomActor,
  localPort,
  WorkerProxy,
  ChannelClient,
  ConnectedChannel,
  LogLevel,
  Logger
}
