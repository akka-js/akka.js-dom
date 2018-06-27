
const LogLevel = {
  off:      10,
  error:    3,
  warning:  2,
  info:     1,
  debug:    0
}

if (Object.freeze) { Object.freeze(LogLevel) }

module.exports = {
  LogLevel
}
