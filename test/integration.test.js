import test from 'ava'
import * as path from 'path'
import { resolveTxt } from 'dns';

let server = undefined
let nightmare = undefined
test.before(t => {
  var express = require('express')
  var serveStatic = require('serve-static')

  const app = express()

  app.use(serveStatic(path.join(__dirname, '..', 'demo')))
  server = app.listen(4321)

  const Nightmare = require('nightmare')
  // nightmare = Nightmare()
  nightmare = Nightmare({
    show: true
  })
})

test.after("cleanup", t => {
  server.close()
  server = undefined
})

test.cb("Test demo: 1-simple", t => {
  t.plan(5)

  const selector = 'h3'
  nightmare
    .goto('http://localhost:4321/1-simple/index.html')
    .wait(selector)
    .wait(selector => document.querySelector(selector).innerText != "", selector)
    .evaluate(selector => {
      return document.querySelector(selector).innerText
    }, selector)
    .then(text => {
      const now = new Date()
      const date = new Date(text)
      t.is(now.getFullYear, date.getFullYear)
      t.is(now.getMonth,    date.getMonth)
      t.is(now.getDay,      date.getDay)
      t.is(now.getHours,    date.getHours)
      t.is(now.getMinutes,  date.getMinutes)
      t.end()
    })
    .catch(error => {
      console.error(error)
      t.fail()
      t.end()
    })
})

test.cb("Test demo: 2-events", t => {
  t.plan(1)

  const selector = 'button'
  const elemSelector = 'li'
  nightmare
    .goto('http://localhost:4321/2-events/index.html')
    .wait(selector)
    .click(selector)
    .wait(elemSelector)
    .evaluate(elemSelector => {
      return document.querySelector(elemSelector).innerText
    }, elemSelector)
    .then(text => {
      t.is(text, "click received")
      t.end()
    })
    .catch(error => {
      console.error(error)
      t.fail()
      t.end()
    })
})

test.cb("Test demo: 3-hierarchy", t => {
  t.plan(1)

  const selector = 'ul > li'
  nightmare
    .goto('http://localhost:4321/3-hierarchy/index.html')
    .wait(selector)
    .evaluate(selector => {
      return document.querySelector(selector).innerText
    }, selector)
    .then(text => {
      t.is(text, "1")
      t.end()
    })
    .catch(error => {
      console.error(error)
      t.fail()
      t.end()
    })
})

test.cb("Test demo: 4-todo", t => {
  t.plan(2)

  const selector = 'input'
  const liSelector = 'li'
  const remSelector = 'button'
  nightmare
    .goto('http://localhost:4321/4-todo/index.html')
    .wait(selector)
    .type(selector, "one\u000d")
    .wait(liSelector)
    .evaluate(liSelector => {
      return document.querySelector(liSelector).innerText
    }, liSelector)
    .then(text => {
      t.is(text, "oneX")

      nightmare
        .wait(remSelector)
        .click(remSelector)
        .wait(100)
        .exists(liSelector)
        .then(res => {
          t.is(res, false)
          t.end()
        })
        .catch(error => {
          console.error(error)
          t.fail()
          t.end()
        })
    })
    .catch(error => {
      console.error(error)
      t.fail()
      t.end()
    })
})

test.cb("Test demo: 5-pingpong", t => {
  t.plan(2)

  const button1Selector = '#root div:nth-child(1) button'
  const button2Selector = '#root div:nth-child(2) button'
  const text1Selector = '#root div:nth-child(1) p'
  const text2Selector = '#root div:nth-child(2) p'
  nightmare
    .goto('http://localhost:4321/5-pingpong/index.html')
    .wait(button1Selector)
    .wait(button2Selector)
    .wait(text1Selector)
    .wait(text2Selector)
    .click(button1Selector)
    .click(button2Selector)
    .click(button2Selector)
    .wait(100)
    .evaluate((text1Selector, text2Selector) => {
      return {
        text1: document.querySelector(text1Selector).innerText,
        text2: document.querySelector(text2Selector).innerText
      }
    }, text1Selector, text2Selector)
    .then(texts => {
      t.is(texts.text1, "received 2 pings")
      t.is(texts.text2, "received 1 pings")
      t.end()
    })
    .catch(error => {
      console.error(error)
      t.fail()
      t.end()
    })
})
