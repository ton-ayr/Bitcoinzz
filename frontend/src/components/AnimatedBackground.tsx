'use client';

import Box from '@mui/material/Box';
import { keyframes } from '@mui/material/styles';
import { colors } from '@/theme/tokens';

// Movimento lento das manchas de luz. Só `transform` (barato para a GPU).
const drift = keyframes`
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  33%  { transform: translate3d(6vw, -4vh, 0) scale(1.08); }
  66%  { transform: translate3d(-4vw, 5vh, 0) scale(0.95); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
`;

const blobs = [
  {
    color: colors.blurple,
    size: '46vmax',
    top: '-18%',
    left: '-12%',
    duration: '26s',
    opacity: 0.5,
  },
  { color: colors.violet, size: '38vmax', top: '35%', left: '62%', duration: '32s', opacity: 0.38 },
  { color: '#2B6CF6', size: '30vmax', top: '70%', left: '-8%', duration: '38s', opacity: 0.3 },
];

/**
 * Fundo fixo atrás de toda a aplicação: manchas de luz blurple/violeta desfocadas que
 * se movem devagar. É o que aparece "através" dos cards de vidro.
 */
export function AnimatedBackground() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        pointerEvents: 'none',
        backgroundColor: colors.background,
      }}
    >
      {blobs.map((blob) => (
        <Box
          key={blob.color}
          sx={{
            position: 'absolute',
            top: blob.top,
            left: blob.left,
            width: blob.size,
            height: blob.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 65%)`,
            opacity: blob.opacity,
            filter: 'blur(60px)',
            willChange: 'transform',
            animation: `${drift} ${blob.duration} ease-in-out infinite`,
          }}
        />
      ))}
      {/* Grade sutil para dar profundidade ao vidro. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black 0%, transparent 75%)',
        }}
      />
    </Box>
  );
}
