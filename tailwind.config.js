const colors = require("tailwindcss/colors");
const plugin = require("tailwindcss/plugin");

module.exports = {
  mode: "jit",
  purge: {
    enabled: true,
    content: [
      "./src/build/plugin/components/**/*.{js,jsx,ts,tsx}",
      "./src/build/**/*.{js,jsx,ts,tsx}",
      "./out/src/build/plugin/components/**/*.{js,jsx,ts,tsx}",
      "./out/src/build/**/*.{js,jsx,ts,tsx}",
    ],
  },
  darkMode: false,
  theme: {
    colors: {
      transparent: "transparent",
      ...colors,
    },
    screens: {
      xsm: "360px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      xxl: "1920px",
      xxxl: "2560px",
    },

    extend: {
      spacing: {
        128: "32rem",
        144: "36rem",
        164: "42rem",
        192: "50rem",
      },
      maxWidth: {
        "8xl": "90rem",
        "9xl": "100rem",
        "10xl": "108rem",
        "screen-3xl": "1920px",
      },
      fontFamily: {
        merienda: ["Merienda One"],
        frederica: ["Fredericka the Great"],
      },
      fontSize: {
        "2xs": ".6rem",
        "3xs": ".5rem",
        "4xs": ".4rem",
        "8xl": "6rem",
      },
    },
  },
  variants: {
    extend: {
      textColor: ["selection"],
      backgroundColor: ["selection"],
    },
  },
  plugins: [
    require("@tailwindcss/aspect-ratio"),
    require("tailwindcss-textshadow"),
    require("tailwindcss-selection-variant"),
    require("tailwind-scrollbar"),
    plugin(function ({ addVariant, e, postcss }) {
      addVariant("firefox", ({ container, separator }) => {
        const isFirefoxRule = postcss.atRule({
          name: "-moz-document",

          params: "url-prefix()",
        });

        isFirefoxRule.append(container.nodes);

        container.append(isFirefoxRule);

        isFirefoxRule.walkRules((rule) => {
          rule.selector = `.${e(
            `firefox${separator}${rule.selector.slice(1)}`
          )}`;
        });
      });
    }),
  ],
};
