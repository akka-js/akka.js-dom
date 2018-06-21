const { UiManager, defaultUnamtchedFunction } = require("../../page")

new UiManager(
  new SharedWorker("./js/ping.out.js"),
  require("./dom-handlers.js"),
  defaultUnamtchedFunction,
  "ping"
)

new UiManager(
  // require("./pingpong.js"),
  new SharedWorker("./js/pong.out.js", { name : "pong" }),
  require("./dom-handlers.js"),
  defaultUnamtchedFunction,
  "pong"
)
