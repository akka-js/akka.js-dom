const { UiManager } = require("../../page")

// new UiManager(
//   new Worker("./js/prime.out.js")
//   // new SharedWorker("./js/prime.out.js")
// )

new UiManager(
  require("./spawner.js"),
  { handlers: require("./dom-handlers.js") }
)
