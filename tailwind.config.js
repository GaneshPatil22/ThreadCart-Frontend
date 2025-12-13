module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#e11d48",
        "primary-hover": "#be123c",
        // Accent color for prices, stats, and emphasis text (non-error contexts)
        accent: "#1e293b",
        "accent-hover": "#0f172a",
        "accent-light": "#f1f5f9",
        background: "#f9f9f9",
        "text-primary": "#1f2937",
        "text-secondary": "#6b7280",
        border: "#e5e7eb",
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};