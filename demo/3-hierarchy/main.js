const { UiManager } = require("akkajs-dom/page")

new UiManager(
  new Worker("./js/hierarchy.out.js")
)
