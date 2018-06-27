const { UiManager } = require("../../page")

new UiManager(
  require("./logging.js"),
  { name: "page" }
)

new UiManager(
  new Worker("./js/logging.out.js"),
  { name: "worker" }
)

new UiManager(
  new SharedWorker("./js/logging.out.js"),
  { name: "sharedworker" }
)
