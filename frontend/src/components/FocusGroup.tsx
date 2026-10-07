'use client';

import Box, { type BoxProps } from '@mui/material/Box';
import { motionTokens } from '@/theme/tokens';

/** Classe que marca quem participa do efeito de foco (cards, botões...). */
export const FOCUS_ITEM = 'focus-item';

const item = `.${FOCUS_ITEM}`;

/**
 * Grupo com "efeito de foco": quando o mouse (ou o Tab do teclado) está sobre um item,
 * ele fica em destaque (estilo de hover do tema) e os OUTROS itens do grupo ficam foscos.
 * Feito só com CSS (`:has`), sem estado no React.
 */
export function FocusGroup({ sx, ...props }: BoxProps) {
  return (
    <Box
      {...props}
      sx={[
        {
          [`& ${item}`]: {
            transition: `opacity ${motionTokens.base} ${motionTokens.easing}, filter ${motionTokens.base} ${motionTokens.easing}`,
          },
          [`&:has(${item}:hover) ${item}:not(:hover), &:has(${item}:focus-visible) ${item}:not(:focus-visible)`]:
            {
              opacity: 0.55,
              filter: 'saturate(0.6) blur(1px)',
            },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
