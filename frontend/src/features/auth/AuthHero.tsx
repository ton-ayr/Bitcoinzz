'use client';

import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import { FOCUS_ITEM, FocusGroup } from '@/components/FocusGroup';
import { Logo } from '@/components/Logo';
import { colors, gradients } from '@/theme/tokens';

const features = [
  {
    icon: ShowChartRoundedIcon,
    title: 'Cotação ao vivo',
    text: 'Preços do Mercado Bitcoin a cada 15 s.',
  },
  {
    icon: ReceiptLongRoundedIcon,
    title: 'Extrato transparente',
    text: 'Cada operação com data e cotação.',
  },
  {
    icon: ShieldRoundedIcon,
    title: 'Sessão protegida',
    text: 'Seu token nunca fica exposto no navegador.',
  },
];

// Linha decorativa de "preço" (não são dados reais): desenhada com animação ao abrir a tela.
const CHART_PATH =
  'M0 120 C 40 110, 60 70, 100 80 S 160 130, 200 95 S 260 40, 300 55 S 360 90, 400 30';

export function AuthHero() {
  return (
    <Stack spacing={5} sx={{ maxWidth: 520 }}>
      <Logo />

      <div>
        <Typography
          variant="h2"
          component="p"
          sx={{ fontSize: { md: 44, lg: 52 }, lineHeight: 1.08 }}
        >
          Invista em bitcoin{' '}
          <Box
            component="span"
            sx={{
              backgroundImage: gradients.text,
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            com estilo.
          </Box>
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2, fontSize: 17 }}>
          Deposite, compre e venda pela cotação real, acompanhando cada centavo.
        </Typography>
      </div>

      <Box aria-hidden sx={{ width: '100%', maxWidth: 440 }}>
        <svg viewBox="0 0 400 140" width="100%" role="presentation">
          <defs>
            <linearGradient id="hero-line" x1="0" x2="1">
              <stop offset="0" stopColor={colors.blurple} />
              <stop offset="1" stopColor={colors.violet} />
            </linearGradient>
            <linearGradient id="hero-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={colors.blurple} stopOpacity="0.35" />
              <stop offset="1" stopColor={colors.blurple} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={`${CHART_PATH} L400 140 L0 140 Z`}
            fill="url(#hero-area)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          />
          <motion.path
            d={CHART_PATH}
            fill="none"
            stroke="url(#hero-line)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
      </Box>

      <FocusGroup sx={{ display: 'grid', gap: 1.5 }}>
        {features.map(({ icon: Icon, title, text }) => (
          <Card
            key={title}
            className={FOCUS_ITEM}
            sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(88, 101, 242, 0.16)',
                color: colors.blurpleLight,
                flexShrink: 0,
              }}
            >
              <Icon />
            </Box>
            <div>
              <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {text}
              </Typography>
            </div>
          </Card>
        ))}
      </FocusGroup>
    </Stack>
  );
}
