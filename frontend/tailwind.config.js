/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-root': '#0F172A',
        'bg-surface': '#1E293B',
        'bg-surface-raised': '#334155',
        'bg-sidebar': '#0B1120',
        'border-default': '#334155',
        'border-subtle': '#1E293B',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-tertiary': '#64748B',
        primary: '#38BDF8',
        'primary-hover': '#7DD3FC',
        'primary-dark': '#0284C7',
        'status-healthy': '#22C55E',
        'status-warning': '#F59E0B',
        'status-critical': '#EF4444',
        'status-unknown': '#6B7280',
        'status-maintenance': '#8B5CF6',
        'status-info': '#3B82F6',
        'chart-cpu': '#38BDF8',
        'chart-ram': '#A78BFA',
        'chart-disk': '#34D399',
        'chart-network': '#FBBF24',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
