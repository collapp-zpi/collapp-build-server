const path = require("path");
const fs = require("fs");

async function moveFiles() {
  const buildPath = path.resolve(__dirname, "out");

  fs.copyFileSync(
    path.resolve(__dirname, "src", "build", "global.css"),
    path.resolve(buildPath, "src", "build", "global.css")
  );
  fs.copyFileSync(
    path.resolve(__dirname, "src", "build", "App.js"),
    path.resolve(buildPath, "src", "build", "App.js")
  );
  fs.copyFileSync(
    path.resolve(__dirname, "src", "build", "index.js"),
    path.resolve(buildPath, "src", "build", "index.js")
  );
  fs.copyFileSync(
    path.resolve(__dirname, "src", "build", "index.js"),
    path.resolve(buildPath, "src", "build", "index.js")
  );
  fs.copyFileSync(
    path.resolve(__dirname, ".babelrc"),
    path.resolve(buildPath, ".babelrc")
  );
  fs.copyFileSync(
    path.resolve(__dirname, "webpack.js"),
    path.resolve(buildPath, "webpack.js")
  );
}

module.exports = { moveFiles };
