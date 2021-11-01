const path = require("path");
const chalk = require("chalk");
const fs = require("fs");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const remoteComponentConfig = require("./remote-component.config").resolve;

const toml = require("toml");
const yaml = require("yamljs");
const json5 = require("json5");

const compiler = webpack({
  mode: "development",
  devtool: "source-map",
  plugins: [
    new webpack.EnvironmentPlugin({
      "process.env.NODE_ENV": "development",
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(
            __dirname,
            "src",
            "build",
            "plugin",
            "logic",
            "server.js"
          ),
          to: path.resolve(__dirname, "dist", "server.js"),
        },
      ],
      options: {
        concurrency: 100,
      },
    }),
  ],
  entry: {
    main: path.resolve(__dirname, "src", "build", "index.js"),
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs",
    filename: "entry.js",
  },
  externals: {
    ...Object.keys(remoteComponentConfig).reduce(
      (obj, key) => ({ ...obj, [key]: key }),
      {}
    ),
    "remote-component.config.js": "remote-component.config.js",
  },
  module: {
    rules: [
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
          },
          {
            loader: "postcss-loader",
          },
          "sass-loader",
        ],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ["file-loader"],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(csv|tsv)$/i,
        use: ["csv-loader"],
      },
      {
        test: /\.xml$/i,
        use: ["xml-loader"],
      },
      {
        test: /\.toml$/i,
        type: "json",
        parser: {
          parse: toml.parse,
        },
      },
      {
        test: /\.yaml$/i,
        type: "json",
        parser: {
          parse: yaml.parse,
        },
      },
      {
        test: /\.json5$/i,
        type: "json",
        parser: {
          parse: json5.parse,
        },
      },
    ],
  },
});

async function runBuild(plugin, onFinish) {
  console.log(chalk.green(`${plugin.name} plugin -> build started...`));

  // Clear out directory
  const p = path.join(__dirname, "dist");
  if (fs.existsSync(p)) {
    fs.rmdirSync(p, { recursive: true });
  }

  compiler.run((err, stats) => {
    if (!err)
      console.log(
        chalk.green.bold(`'${plugin.name}' plugin -> seccessful build`)
      );
    else {
      console.log(chalk.red("There were some build errors"));
      console.log(err);
    }
    compiler.close(() => {
      onFinish(!err, stats.toJson("minimal"));
    });
  });
}

module.exports = { runBuild };
