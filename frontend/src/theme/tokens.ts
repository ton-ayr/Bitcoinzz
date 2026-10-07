/**
 * Tokens do design system (dark + blurple + glassmorphism).
 * Toda cor da interface sai daqui, para o visual ficar consistente.
 */
export const colors = {
  background: '#0B0C10',
  surface: '#16171D',
  surfaceRaised: '#1D1E26',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',

  blurple: '#5865F2',
  blurpleLight: '#7983F5',
  blurpleDark: '#4752C4',
  violet: '#9B59F6',

  success: '#23A55A',
  error: '#F23F43',
  warning: '#F0B232',
  bitcoin: '#F7931A',

  textPrimary: '#F2F3F5',
  textSecondary: '#A3A6B4',
  textMuted: '#80848E',
} as const;

/** "Vidro fosco": fundo translúcido + desfoque do que está atrás. */
export const glass = {
  background: 'rgba(22, 23, 29, 0.42)',
  backgroundHover: 'rgba(29, 30, 38, 0.52)',
  // Reflexo fino na borda de cima, típico de vidro.
  highlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.07)',
  blur: 'blur(18px) saturate(140%)',
  // Navegadores sem backdrop-filter recebem uma superfície sólida (texto continua legível).
  fallback: colors.surface,
} as const;

export const gradients = {
  primary: `linear-gradient(135deg, ${colors.blurple} 0%, ${colors.violet} 100%)`,
  primaryHover: `linear-gradient(135deg, ${colors.blurpleLight} 0%, ${colors.violet} 100%)`,
  text: `linear-gradient(135deg, ${colors.blurpleLight} 0%, ${colors.violet} 100%)`,
} as const;

/** Brilho blurple usado em hovers e foco. */
export const glow = {
  soft: '0 0 0 1px rgba(88, 101, 242, 0.25), 0 12px 40px -12px rgba(88, 101, 242, 0.45)',
  strong: '0 10px 30px -6px rgba(88, 101, 242, 0.6)',
  focusRing: '0 0 0 3px rgba(88, 101, 242, 0.35)',
} as const;

export const motionTokens = {
  fast: '150ms',
  base: '220ms',
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;
