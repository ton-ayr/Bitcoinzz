'use client';

// Prévia do design system. Disponível só em desenvolvimento, em /design.

import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import { keyframes } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { motion, type Variants } from 'motion/react';
import Card from '@mui/material/Card';
import { FOCUS_ITEM, FocusGroup } from '@/components/FocusGroup';
import { formatBRL, formatBTC, formatPercent } from '@/lib/format';
import { colors, gradients } from '@/theme/tokens';

const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(35, 165, 90, 0.6); }
  70%  { box-shadow: 0 0 0 10px rgba(35, 165, 90, 0); }
  100% { box-shadow: 0 0 0 0 rgba(35, 165, 90, 0); }
`;

// Entrada em sequência: cada filho aparece 80 ms depois do anterior.
const container: Variants = { show: { transition: { staggerChildren: 0.08 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function DesignPreview() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Box component={motion.div} variants={container} initial="hidden" animate="show">
        <Stack
          component={motion.div}
          variants={item}
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', mb: 6 }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 3,
              display: 'grid',
              placeItems: 'center',
              backgroundImage: gradients.primary,
              fontWeight: 800,
              fontSize: 22,
              boxShadow: '0 8px 24px -6px rgba(88,101,242,0.6)',
            }}
          >
            ₿
          </Box>
          <Typography variant="h6" component="span">
            Bitcoinzz
          </Typography>
          <Chip label="Prévia do design system" color="primary" size="small" />
        </Stack>

        <Box component={motion.div} variants={item} sx={{ mb: 5 }}>
          <Typography variant="h2" component="h1" sx={{ fontSize: { xs: 36, md: 56 } }}>
            Seu bitcoin,{' '}
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
          <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 560 }}>
            Dark mode, vidro fosco e detalhes em blurple. Passe o mouse nos cards e nos botões: o
            item em foco se destaca e os outros ficam foscos.
          </Typography>
        </Box>

        <FocusGroup
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            mb: 5,
          }}
        >
          <Box component={motion.div} variants={item}>
            <Card className={FOCUS_ITEM} sx={{ p: 3, height: '100%' }}>
              <Typography variant="overline" color="text.secondary">
                Saldo disponível
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {formatBRL(1250.5)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {formatBTC(0.00058381)} investidos
              </Typography>
            </Card>
          </Box>

          <Box component={motion.div} variants={item}>
            <Card className={FOCUS_ITEM} sx={{ p: 3, height: '100%' }}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="overline" color="text.secondary">
                  Cotação BTC
                </Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: colors.success,
                      animation: `${pulse} 2s infinite`,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    ao vivo
                  </Typography>
                </Stack>
              </Stack>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {formatBRL(427253)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Venda {formatBRL(427254)}
              </Typography>
            </Card>
          </Box>

          <Box component={motion.div} variants={item}>
            <Card className={FOCUS_ITEM} sx={{ p: 3, height: '100%' }}>
              <Typography variant="overline" color="text.secondary">
                Variação das posições
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Chip icon={<ArrowUpwardRoundedIcon />} label={formatPercent(25)} color="success" />
                <Chip
                  icon={<ArrowDownwardRoundedIcon />}
                  label={formatPercent(-3.12)}
                  color="error"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                Verde para alta, vermelho para queda.
              </Typography>
            </Card>
          </Box>
        </FocusGroup>

        <Box component={motion.div} variants={item}>
          <Card sx={{ p: { xs: 3, md: 4 }, '&:hover': { transform: 'none' } }}>
            <Typography variant="h6">Comprar bitcoin</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Botões e campos do formulário.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <TextField label="Valor (R$)" placeholder="0,00" fullWidth />
              <TextField label="Estimativa" value={formatBTC(0.00058381)} fullWidth disabled />
            </Stack>
            <FocusGroup sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button className={FOCUS_ITEM} variant="contained" size="large">
                Comprar BTC
              </Button>
              <Button className={FOCUS_ITEM} variant="outlined" size="large">
                Depositar
              </Button>
              <Button className={FOCUS_ITEM} variant="text" size="large">
                Ver extrato
              </Button>
            </FocusGroup>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 3 }}>
              <Chip label="Depósito" />
              <Chip label="Compra" color="primary" />
              <Chip label="Venda" color="success" />
              <Chip label="Reinvestimento" variant="outlined" />
            </Stack>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}
