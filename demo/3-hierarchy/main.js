const { UiManager } = require("../../page")

new UiManager(
  new Worker("./js/hierarchy.out.js")
)
