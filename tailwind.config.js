module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#e11d48",
        "primary-hover": "#be123c",
        background: "#f9f9f9",
        "text-primary": "#1f2937",
        "text-secondary": "#6b7280",
        border: "#e5e7eb",
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};