const path = require("path")
module.exports = {
  entry: {
    main: "./main.js",
    pingpong: "./pingpong.js",
    ping: "./ping.js",
    pong: "./pong.js"
  },
  output: {
    path: path.join(__dirname, "js"),
    filename: "[name].out.js",
    chunkFilename: "[id].chunk.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  }
}
