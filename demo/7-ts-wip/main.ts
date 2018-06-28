import { UiManager } from "../../page"

import * as loggingModule from "./logging"

new UiManager(
  loggingModule,
  { name: "page" }
)

new UiManager(
  new Worker("./js/logging.out.js"),
  { name: "worker" }
)
