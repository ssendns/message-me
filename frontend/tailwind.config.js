/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        primary: "#4F46E5",
        secondary: "#6366F1",
        background: "#F9FAFB",
        foreground: "#111827",
        accent: "#E11D48",
        muted: "#9CA3AF",
      },
      spacing: {
        layout: "1.5rem",
        section: "2.5rem",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        card: "1.25rem",
      },
      maxWidth: {
        screen: "1280px",
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0,0,0,0.05)",
        card: "0 6px 16px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
