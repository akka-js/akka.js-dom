const { UiManager } = require("akkajs-dom/page")

new UiManager(
  new Worker("./js/events.out.js"),
  require("./dom-handlers.js")
)
