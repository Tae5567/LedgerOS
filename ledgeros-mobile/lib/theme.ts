export const colors = {
  navy: '#0B1F3B',
  blue: '#3A6FF7',
  blueLight: '#5B8FFF',
  green: '#22A06B',
  amber: '#F59E0B',
  red: '#D64545',
  gray: {
    50: '#F7F8FA',
    100: '#F1F2F4',
    200: '#E5E7EB',
    400: '#9CA3AF',
    500: '#717182',
    900: '#111827',
  },
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, color: colors.navy },
  h2: { fontSize: 24, fontWeight: '700' as const, color: colors.navy },
  h3: { fontSize: 20, fontWeight: '700' as const, color: colors.navy },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.gray[500] },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.gray[500] },
  label: { fontSize: 11, fontWeight: '600' as const, color: colors.gray[500], letterSpacing: 0.5 },
};