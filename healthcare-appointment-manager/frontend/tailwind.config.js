/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7f6",
          500: "#0f766e",
          600: "#0d6058",
          700: "#0a4a44",
        },
      },
    },
  },
  plugins: [],
};
