const { UiManager } = require("akkajs-dom/page")

new UiManager(
  // require("./events.js"),
  new Worker("./js/events.out.js"),
  require("./dom-handlers.js")
)
