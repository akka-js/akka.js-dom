
# Akka.Js DOM

[![NPM](https://nodei.co/npm/akkajs-dom.png)](https://nodei.co/npm/akkajs-dom/)

Minimalistic Framework for frontend applications built on top of [Akka.js](https://www.npmjs.com/package/akkajs)

___Featuring:___

  - Local Mutable State (with VDOM)
  - Page / application separation
  - Location transparency for application
  - Real parallelism (multithread via Workers)
  - Fully asynchronous
  - Easy inter-workers communication

## Install

```bash
npm install --save akkajs-dom
```

## Quick start

Ensure you have installed `npm` and clone this repository.
Go into one of the examples in the demo directory and run:

```bash
npm install
npm run build
npm run serve
```

and you will get the result from a modern browser at `http://localhost:3000`.

The examples are intended to be considered "live" and you are encouraged to play with them!

## Overview

***We assume you have some understanding of basic Akka.Js concepts. Otherwise take first the [Akka.js Quick Start](https://github.com/akka-js/akka.js_bindings#quick-start)***

Akka.Js DOM has 2 core components:

  - `UiManager`
  - `DomActor`

### UiManager

`UiManager` is the minimal "in-page" driver, with an extremely small footprint that manage operations with the DOM, it __needs__ to be loaded straight in page.
This hook accept, as for now, 3 possible kind of objects to bind to the page:

  1. a module that exports a `localPort`, it's purpose is mainly for debug or for few elements that needs to be displayed asap in page
  2. a `Worker`
  3. a `SharedWorker`

all you need to do is to instantiate one `UiManager` per component you have to visualize in page.

import it as:
```javascript
const { UiManager } = require("akkajs-dom/page")
```

and then one of:
```javascript
new UiManager(
  require("./simple.js") // for debugging purposes
)
```
```javascript
new UiManager(
  new Worker("./js/simple.out.js")
)
```
```javascript
new UiManager(
  new SharedWorker("./js/simple.out.js")
)
```


A `UiManager` constructor accepts a second optional argument.
```javascript
{
  name: componentName, // default to a random ID
  handlers: handlersModule, // module containing functions that have to be run on events, default to undefined
  unmatchedFun: defaultUnmatchedFunction // what to do if an unhandled message is received in page, default to log it
}
```

Functions in `handlersModule` should return results in a serializable format (e.g. Json, string, ...) since results will be propagated through a `MessageChannel`.

example:
```javascript
const { UiManager } = require("akkajs-dom/page")

new UiManager(
  new Worker("./js/simple.out.js"),
  {
    name: "simple",
    handlers: require("dom-handlers.js")
  }
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
|`this.postMount()`| Is an hook triggered after the element is mounted in page ___NOTE:___ `preStart` is reserved |
|`this.postUnmount()`| Is an hook triggered after the element is unmounted from the page ___NOTE:___ `postStop` is reserved |
|`this.events(map)`| Should return a map of the events to be intercepted on the relative DOM elemnt. The format of each entry is `eventName -> eventFunction` please note functions used here should be accessible by both `UiManager` and `DomActor` |

there are also some methods intended to be used from within the `Actor` itself:

___Methods___

|Method|Description|
|-------|----------|
|`this.update(value)`| Used to update the status, will trigger a `render` call containing the specified `value` |
|`this.register(eventName, eventFunction)`| Low level interface to register DOM events, functions should be accessible from `UiManager` and `DomActor` (prefer the `events` notation) |

### Logging

Given the fact that you can spawn your `DomActor`s in environments where `console.log` is not available we provide a simple interface for having a cross compatible logging system.

the mandatory import will looks like:
```javascript
const { Logger, LogLevel } = require("akkajs-dom/work")
```

to have a Logger you should have already an ActorSystem spawned

```javascript
const log = new Logger(actorSystem, LogLevel.<desiredlevel>)
```

available logging levels are:
```javascript
{
  off,
  error,
  warning,
  info,
  debug
}
```

and finally you can use your logger:
```javascript
log.debug(text)
log.info(text)
log.warn(text)
log.error(text)
```

### Inter-Communication

__[in-development]__

Akka.Js DOM provides you a common way to communicate peer-to-peer in between different components.

The preferred way is to open a specular bidirectional communication channel.

In page you spawn to `UIManager` and be sure to provide a `name` option.
```javascript
const { UiManager } = require("akkajs-dom/page")

new UiManager(
  new SharedWorker("./js/ping.out.js"),
  {
    name: "ping",
    handlers: require("./dom-handlers.js")
  }
)

new UiManager(
  new Worker("./js/pong.out.js"),
  {
    name: "pong",
    handlers: require("./dom-handlers.js")
  }
)
```

Now in the two workers you can:
```javascript
// Spawn a proxy actor to make this worker available for external communication
const proxy = system.spawn(new WorkerProxy())

// define a "ConnectedChannel" Actor that will connect to another Worker
class PongChannel extends ConnectedChannel {
  postAvailable () {
    // triggered when the bounded worker is available
    this.channel
  }
  operative (msg) {
    // behavior available for user
  }
}

system.spawn(new PongChannel(proxy, "pong")) // the name here is the channel we wanna connect
```

_TODO:_ describe the full API.

## Compile

To compile and build this project simply:

```bash
npm install
npm run build
```

IT tests are based on the demo projects:

```bash
npm run buildDemo # needed only once
npm test
```
