/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brief: {
          bgDark:  "#0A1E33",
          bgLight: "#F9FAFB",
          text:    "#1F2937",
          aqua:    "#22C1DC",
          blue:    "#2563EB"
        }
      },
      boxShadow: { card: "0 8px 20px rgba(0,0,0,0.15)" },
      borderRadius: { xl2: "1.25rem" }
    },
  },
  plugins: [],
}
