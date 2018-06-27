const { UiManager } = require("../../page")

new UiManager(
  require("./simple.js")
  // new Worker("./js/simple.out.js")
  // new SharedWorker("./js/simple.out.js")
)
