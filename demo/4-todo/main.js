const { UiManager } = require("../../page")

new UiManager(
  // require("./todo.js"),
  new Worker("./js/todo.out.js"),
  { handlers: require("./dom-handlers.js") }
)
