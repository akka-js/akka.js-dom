
# Akka.Js DOM

Minimalistic Framework for frontend applications built on top of [Akka.js](https://www.npmjs.com/package/akkajs)

___Featuring:___

  - Local Mutable State (with VDOM)
  - Page / application separation
  - Location transparency for application
  - Real parallelism (multithread via Workers)
  - Asynchronous

## Quick start

Ensure you have installed `npm` and clone this repository.
Go into one of the examples in the demo directory and run:

```bash
npm install
npm run build
npm run serve
```

and you will get the result.

The examples are intended to be considered as "live" and you are encouraged to play with them!

## Basic concept

We assume you have some basic understanding of basic Akka.Js concepts.

Akka.Js DOM has 2 core components:

  - `UiManager`
  - `DomActor`

and they are intended to be kept separated (in different compilation units possibly).

### UiManager

`UiManager` is the minimal "in-page" interface, with an extremely small footprint that operates on the DOM, it has to be loaded straight in page and the constructor accept, as for now, 3 possible objects:

  1- a module that exports a `localPort`, it's purpose is mainly for debug or for few elements that needs to be displayed asap in page.
  2- a `Worker`.
  3- a `SharedWorker`.

all you need to do is to instantiate one `UiManager` per component you have to visualize in page.

example:
```javascript
const { UiManager } = require("akkajs-dom/page")

new UiManager(
  require("./simple.js") // for debugging purposes
  // new Worker("./js/simple.out.js")
  // new SharedWorker("./js/simple.out.js")
)
```

A `UiManager` constructor accepts a second optional argument that is module containing functions that have to be run on events, the returning value of these functions has to be serializable since it will be sent as a message to the relative `Actor`.


example:
```javascript
const { UiManager } = require("akkajs-dom/page")

new UiManager(
  new Worker("./js/simple.out.js"),
  require("dom-handlers.js")
)
```

### DomActor

`DomActor` is an *enanched* `Actor` that is ready to interact with the DOM, it has an extended API to enable defining UI components.

example:
```javascript
const { DomActor } = require("akkajs-dom/work")

class Clock extends DomActor {
  constructor () {
    super("root")
  }
  render (value) {
    return <h3>Hello world!</h3>
  }
  receive (msg) {
    this.update(msg)
  }
}
```

The default constructor of `DomActor` accept a *String*.
Calling the default constructor with the optional *String* is mandatory for top-level UI components and the value should be the `id` of an element already present in page.
If not specified the binding element is by default appended to the `parent` `DomActor`.

The `DomActor` lifecycle is mapped 1 to 1 with the rendering in page, this does mean that spawning a `DomActor` will render something in page while killing it will remove the element from the page.

The full available API is composed on top of the basic `akkajs.Actor` one and it adds the following user-overridable functions (already binded to this by default)

___Methods___

|Method|Description|
|-------|----------|
|`this.render(value)`| Will return the content to be visualized |
|`this.postMount()`| Is an hook triggered after the element is mounted in page ___NOTE:___ 'preStart' is reserved |
|`this.postUnmount()`| Is an hook triggered after the element is unmounted from the page ___NOTE:___ 'postStop' is reserved |
|`this.events(map)`| Should return a map of the events to be intercepted on the relative DOM the format of each entry is `eventName -> eventFunction` please note that this functions should be accessible by both `UiManager` and `DomActor` |

there are also some methods intended to be used from within the `Actor` itself:

___Methods___

|Method|Description|
|-------|----------|
|`this.update(value)`| Used to update the status, will trigger a `render` call containing the specified `value` |
|`this.register(eventName, eventFunction)`| Low level interface to register DOM events, functions should be accessible from `UiManager` and `DomActor` (prefer the `events` notation) |
