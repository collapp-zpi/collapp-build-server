const path = require("path");
const fs = require("fs");

async function moveFiles() {
  const buildPath = path.join(__dirname, "out");

  fs.copyFileSync(
    path.join(__dirname, "src", "build", "global.css"),
    path.join(buildPath, "src", "build", "global.css")
  );
  fs.copyFileSync(
    path.join(__dirname, "src", "build", "App.js"),
    path.join(buildPath, "src", "build", "App.js")
  );
  fs.copyFileSync(
    path.join(__dirname, "src", "build", "index.js"),
    path.join(buildPath, "src", "build", "index.js")
  );
  fs.copyFileSync(
    path.join(__dirname, "src", "build", "index.js"),
    path.join(buildPath, "src", "build", "index.js")
  );
  fs.copyFileSync(
    path.join(__dirname, "webpack.js"),
    path.join(buildPath, "webpack.js")
  );
  fs.copyFileSync(
    path.join(__dirname, ".env"),
    path.join(buildPath, ".env")
  );
}

module.exports = { moveFiles };
