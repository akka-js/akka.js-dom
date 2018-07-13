import { UiManager } from "../../page"

import * as exampleModule from "./example"

new UiManager(
  exampleModule,
  { name: "page" }
)

new UiManager(
  new Worker("./js/example.out.js"),
  { name: "worker" }
)
