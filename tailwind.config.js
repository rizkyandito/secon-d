export default {
  darkMode: 'class',
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { brand:'#06b6d4', brand2:'#6366f1', brand3:'#f43f5e', brand4:'#22c55e' },
      boxShadow: { card:'0 20px 40px -15px rgba(2,6,23,.25)' }
    }
  },
  plugins: []
}