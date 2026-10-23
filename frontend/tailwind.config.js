/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#E2231A', // Warm vibrant red from KFC/food theme
          hover: '#C81E1E',
          light: '#FEE2E2',
          subtle: '#FFF1F1',
        },
        secondary: {
          DEFAULT: '#F59E0B', // Warm amber / golden yellow
          light: '#FEF3C7',
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
          border: '#86EFAC',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          border: '#FDE68A',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          border: '#FCA5A5',
        },
        warm: {
          bg: '#f0c48eff', // Soft warm cream background from second image
          card: '#FFFFFF',
          border: '#EFE8DE',
          surface: '#F5EFE6',
          muted: '#78716C',
          dark: '#1C1917',
        },
        brand: {
          bg: '#FAF5EF',
          card: '#FFFFFF',
          text: '#1C1917',
          muted: '#78716C',
          border: '#EFE8DE',
        },
        admin: {
          primary: '#636B2F',
          primaryHover: '#525927',
          secondary: '#BAC095',
          accent: '#D4DE95',
          dark: '#3D4127',
          darkText: '#3D4127',
          bg: '#F8F9F3',
          card: '#FFFFFF',
          border: '#E3E6D3',
          sidebar: '#222514',
          sidebarHover: '#2E321C',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(41, 37, 36, 0.05), 0 2px 6px -1px rgba(41, 37, 36, 0.03)',
        'card': '0 2px 14px rgba(41, 37, 36, 0.04)',
        'floating': '0 10px 30px -5px rgba(226, 35, 26, 0.3)',
      }
    },
  },
  plugins: [],
}
