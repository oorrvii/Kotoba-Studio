export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F5F0',
        surface: '#FFFFFF',
        'surface-muted': '#F0EEE8',
        ink: '#252522',

        'ink-muted': '#66655E',
        border: '#E7E3DA',
        vermilion: '#B84A3A',
        'vermilion-dark': '#963B30',
        'vermilion-soft': '#F6E6E2',
        sage: '#71816D',
        'sage-dark': '#546350',
        sand: '#D9C7AE',
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans JP"', 'system-ui', 'sans-serif'],
        jp: ['"Noto Sans JP"', 'Inter', '"Hiragino Sans"', '"Yu Gothic"', 'sans-serif'],
      },
      borderRadius: { card: '16px' },
      boxShadow: {
        card: '0 1px 2px rgba(37,37,34,0.04), 0 4px 16px rgba(37,37,34,0.04)',
        pop: '0 12px 40px rgba(37,37,34,0.16)',
      },
      maxWidth: { page: '1440px' },
      keyframes: {
        'card-in': { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { 'card-in': 'card-in 220ms ease-out' },
    },
  },
  plugins: [],
}
