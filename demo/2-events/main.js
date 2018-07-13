const { UiManager } = require("../../page")

new UiManager(
  // require("./events.js"),
  new Worker("./js/events.out.js"),
  { handlers: require("./dom-handlers.js") }
)
