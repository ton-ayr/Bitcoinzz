'use client';

import { alpha, createTheme, type CSSObject } from '@mui/material/styles';
import { colors, glass, glow, gradients, motionTokens } from './tokens';

const transition = (properties: string[]) =>
  properties
    .map((property) => `${property} ${motionTokens.base} ${motionTokens.easing}`)
    .join(', ');

/** Superfície de vidro reutilizada por Card, Paper, Dialog e Menu. */
export const glassSurface: CSSObject = {
  backgroundColor: glass.background,
  backgroundImage: 'none',
  backdropFilter: glass.blur,
  WebkitBackdropFilter: glass.blur,
  border: `1px solid ${colors.border}`,
  boxShadow: glass.highlight,
  '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))': {
    backgroundColor: glass.fallback,
  },
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.blurple,
      light: colors.blurpleLight,
      dark: colors.blurpleDark,
      contrastText: '#FFFFFF',
    },
    secondary: { main: colors.violet },
    success: { main: colors.success },
    error: { main: colors.error },
    warning: { main: colors.warning },
    background: { default: colors.background, paper: colors.surface },
    text: { primary: colors.textPrimary, secondary: colors.textSecondary },
    divider: colors.border,
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'var(--font-jakarta), system-ui, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 800, letterSpacing: '-0.03em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: 0 },
    overline: { fontWeight: 700, letterSpacing: '0.12em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background,
          // Números com a mesma largura: colunas de R$ e BTC ficam alinhadas.
          fontVariantNumeric: 'tabular-nums',
          WebkitFontSmoothing: 'antialiased',
        },
        '::selection': { backgroundColor: alpha(colors.blurple, 0.45), color: '#fff' },
        '*:focus-visible': { outline: `2px solid ${colors.blurpleLight}`, outlineOffset: 2 },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: colors.surfaceRaised,
          borderRadius: 10,
          border: `2px solid ${colors.background}`,
        },
        '*::-webkit-scrollbar-thumb:hover': { backgroundColor: alpha(colors.blurple, 0.5) },
        // Acessibilidade: quem pede "reduzir movimento" não recebe animações.
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: { root: { ...glassSurface } },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          ...glassSurface,
          borderRadius: 18,
          transition: transition(['transform', 'box-shadow', 'border-color', 'background-color']),
          '&:hover': {
            borderColor: alpha(colors.blurple, 0.45),
            backgroundColor: glass.backgroundHover,
            boxShadow: `${glass.highlight}, ${glow.soft}`,
            transform: 'translateY(-3px)',
          },
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      // Estilo para uma combinação de props (botão principal): gradiente + glow + brilho no hover.
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            backgroundImage: gradients.primary,
            // Micro-interação: um brilho atravessa o botão no hover.
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)',
              transform: 'translateX(-120%)',
              transition: `transform 600ms ${motionTokens.easing}`,
            },
            '&:hover': {
              backgroundImage: gradients.primaryHover,
              boxShadow: glow.strong,
              transform: 'translateY(-2px)',
            },
            '&:hover::after': { transform: 'translateX(120%)' },
            '&:active': { transform: 'translateY(0) scale(0.98)' },
            '&.Mui-disabled': { backgroundImage: 'none', color: colors.textMuted },
          },
        },
      ],
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 18,
          position: 'relative',
          overflow: 'hidden',
          transition: transition(['transform', 'box-shadow', 'background-color', 'border-color']),
          '&:active': { transform: 'scale(0.98)' },
        },
        outlined: {
          borderColor: alpha(colors.blurple, 0.5),
          '&:hover': {
            borderColor: colors.blurple,
            backgroundColor: alpha(colors.blurple, 0.1),
            boxShadow: glow.soft,
            transform: 'translateY(-2px)',
          },
        },
        text: {
          '&:hover': { backgroundColor: alpha(colors.blurple, 0.1) },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: transition(['transform', 'background-color', 'color']),
          '&:hover': {
            backgroundColor: alpha(colors.blurple, 0.14),
            color: colors.blurpleLight,
            transform: 'scale(1.08)',
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          transition: transition(['box-shadow', 'background-color']),
          '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.borderStrong },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(colors.blurple, 0.6) },
          '&.Mui-focused': { boxShadow: glow.focusRing, backgroundColor: 'rgba(255,255,255,0.05)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.blurple,
            borderWidth: 1,
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
        colorSuccess: { backgroundColor: alpha(colors.success, 0.16), color: '#5BD18C' },
        colorError: { backgroundColor: alpha(colors.error, 0.16), color: '#FF7A7D' },
        colorPrimary: { backgroundColor: alpha(colors.blurple, 0.18), color: colors.blurpleLight },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: transition(['background-color', 'color']),
          '&:hover': { backgroundColor: alpha(colors.blurple, 0.1) },
          '&.Mui-selected': {
            backgroundColor: alpha(colors.blurple, 0.18),
            color: colors.textPrimary,
            '&:hover': { backgroundColor: alpha(colors.blurple, 0.24) },
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: transition(['background-color']),
          '&:hover': { backgroundColor: alpha(colors.blurple, 0.07) },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: colors.border },
        head: { color: colors.textSecondary, fontWeight: 600 },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: { ...glassSurface, borderRadius: 20 },
      },
    },

    MuiBackdrop: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(5, 6, 9, 0.6)', backdropFilter: 'blur(4px)' },
        invisible: { backgroundColor: 'transparent', backdropFilter: 'none' },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          ...glassSurface,
          backgroundColor: 'rgba(29, 30, 38, 0.92)',
          fontSize: 13,
          padding: '6px 10px',
        },
      },
    },

    MuiSkeleton: {
      styleOverrides: { root: { backgroundColor: 'rgba(255, 255, 255, 0.06)' } },
    },
  },
});
