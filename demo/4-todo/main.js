const { UiManager } = require("../../page")

new UiManager(
  new Worker("./js/todo.out.js"),
  { handlers: require("./dom-handlers.js") }
)
