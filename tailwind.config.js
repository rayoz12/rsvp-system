/** @type {import('tailwindcss').Config} */
export default {
  content: ["./static/content/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'pastel-yellow': "#FAEDCB",
        'pastel-green': "#C9E4DE",
        'pastel-blue': "#C6DEF1",
        'pastel-purple': "#DBCDF0",
        'pastel-pink': "#F2C6DE",
        'pastel-cream': "#F7D9C4",
        'pastel-cream-lighter': "#FAE5D7",
        'secondary': "#113748",
        "primary": "#FFC819"
      }
    },
  },
  plugins: []
}

