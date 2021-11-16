const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const remoteComponentConfig = require("./remote-component.config").resolve;
const Sentry = require("@sentry/node");
const toml = require("toml");
const yaml = require("yamljs");
const json5 = require("json5");

const ora = require("ora");
const safeDirectoryRemove =
  require("./src/utils/fileUtils").safeDirectoryRemove;

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
            loader: require.resolve("postcss-loader"),
            options: {
              postcssOptions: {
                plugins: {
                  "postcss-prefix-selector": {
                    prefix: ".collapp",
                    transform(prefix, selector, prefixedSelector, filepath) {
                      if (filepath.match(/node_modules/)) {
                        return selector; // Do not prefix styles imported from node_modules
                      }
                      return prefixedSelector;
                    },
                  },
                },
              },
            },
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

async function build() {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      compiler.close(() => {
        const errors = stats.toJson("minimal").errors.length > 0;
        resolve({
          success: err == null && !errors ? true : false,
          stats: stats.toJson("minimal"),
        });
      });
    });
  });
}

async function runBuild(plugin) {
  const buildSpinner = ora(`Build of a '${plugin.name}' plugin`).start();
  const p = path.join(__dirname, "dist");
  safeDirectoryRemove(p);

  try {
    const res = await build();
    if (res.success) {
      buildSpinner.succeed();
    } else {
      buildSpinner.fail();
    }
    return Promise.resolve(res);
  } catch (e) {
    buildSpinner.fail();
    Sentry.captureException(e);
  }
}

module.exports = { runBuild };
