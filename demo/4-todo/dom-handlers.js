
const getValue = function (event) {
  event.preventDefault()
  if (event.keyCode === 13) {
    return event.srcElement.value
  }
}

const getKill = function (event) {
  if (event.srcElement.type === "submit") {
    return { "kill": true }
  }
}

module.exports = {
  getValue,
  getKill
}
