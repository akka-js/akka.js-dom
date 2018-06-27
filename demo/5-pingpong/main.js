const { UiManager } = require("../../page")

new UiManager(
  // require("./ping.js"),
  new SharedWorker("./js/ping.out.js"),
  {
    name: "ping",
    handlers: require("./dom-handlers.js")
  }
)

new UiManager(
  // require("./pong.js"),
  new Worker("./js/pong.out.js"),
  // new SharedWorker("./js/pong.out.js"),
  {
    name: "pong",
    handlers: require("./dom-handlers.js")
  }
)
