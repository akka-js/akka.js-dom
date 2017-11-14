const { UiManager } = require("akkajs-dom/page")

new UiManager(
  new Worker("./js/todo.out.js"),
  require("./dom-handlers.js")
)
