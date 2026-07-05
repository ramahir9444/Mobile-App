/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#F0FDF4',      // soft green backdrops
          primary: '#0B1B3D',    // Deep Blue
          secondary: '#10B981',  // Soft Green
          dark: '#0F172A',       // Header/body text slate-black
          neutral: '#64748B',    // slate label grey
          success: '#10B981',    // green success
          warning: '#F97316',    // Warm Orange (Accent)
          error: '#EF4444',      // error red
          cardBg: '#FFFFFF',
          bodyBg: '#FAF9F6',     // Off White
        }
      }
    },
  },
  plugins: [],
}
