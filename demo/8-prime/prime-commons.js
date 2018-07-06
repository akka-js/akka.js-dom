/** @jsx h */
const h = require("virtual-dom/h")
const { Actor } = require("akkajs")
const { DomActor } = require("../../work")

const domHandlers = require("./dom-handlers.js")

class PrimeUI extends DomActor {
  constructor () {
    super("root")
  }
  render (value) {
    return <div className='box'>{[
      <h1>{value}</h1>
    ]}</div>
  }
  postMount () {
    this.spawn(new StartButton())
  }
  receive (msg) {
    this.update(msg)
  }
}

class StartButton extends DomActor {
  render () {
    if (this.status === undefined || this.status === false) {
      return <button>Get primes</button>
    } else {
      return <div />
    }
  }
  events () {
    return { "click": domHandlers.click }
  }
  receive (msg) {
    if (this.status === undefined || this.status === false) {
      this.status = true
      this.spawn(new PrimeFinder(this.parent())).tell(0)
    }

    this.update()
  }
}

const nextPrime = function (last) {
  let num = last + 1
  while (true) {
    let check = num - 1
    while (
      check > 1 &&
      num % check !== 0
    ) {
      check -= 1
    }
    if (check <= 1) {
      break
    } else {
      num += 1
    }
  }
  return num
}

class PrimeFinder extends Actor {
  constructor (primeUI) {
    super()
    this.primeUI = primeUI
  }
  receive (last) {
    let next = nextPrime(last)
    this.primeUI.tell(next)
    // if we wanna stop it .. because messages are scheduled on setImmediate
    // setTimeout(() => {this.self().tell(next)}, 0)
    this.self().tell(next)
  }
}

module.exports = {
  PrimeUI
}
