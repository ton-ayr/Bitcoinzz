'use client';

import AddCardRoundedIcon from '@mui/icons-material/AddCardRounded';
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import { motion } from 'motion/react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { FOCUS_ITEM, FocusGroup } from '@/components/FocusGroup';
import { Logo } from '@/components/Logo';
import { isActivePath, NAV_ITEMS, type NavHref } from '@/lib/nav';
import { glassSurface } from '@/theme/theme';
import { colors } from '@/theme/tokens';

const DRAWER_WIDTH = 264;

const ICONS: Record<NavHref, typeof DashboardRoundedIcon> = {
  '/dashboard': DashboardRoundedIcon,
  '/deposit': AddCardRoundedIcon,
  '/buy': CallMadeRoundedIcon,
  '/sell': CallReceivedRoundedIcon,
  '/statement': ReceiptLongRoundedIcon,
};

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  // Recarga completa: nenhum dado da sessão anterior fica na memória (ver lib/api-client.ts).
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign('/login');
}

/** Moldura das telas logadas: menu lateral (gaveta no celular) + conteúdo. */
export function AppShell({ user, children }: { user: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = (variant: 'desktop' | 'mobile') => (
    <Stack sx={{ height: '100%', p: 2 }}>
      <Box sx={{ px: 1, py: 1.5, mb: 2 }}>
        <Logo />
      </Box>

      <FocusGroup component="nav" aria-label="Menu principal">
        <List disablePadding sx={{ display: 'grid', gap: 0.5 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = ICONS[item.href];
            return (
              <ListItemButton
                key={item.href}
                className={FOCUS_ITEM}
                component={NextLink}
                href={item.href}
                selected={active}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMobileOpen(false)}
                sx={{ position: 'relative', py: 1.1 }}
              >
                {active && (
                  // Indicador do item ativo: desliza entre os itens ao trocar de tela.
                  <Box
                    component={motion.span}
                    layoutId={`nav-active-${variant}`}
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 3,
                      borderRadius: 3,
                      bgcolor: 'primary.main',
                      boxShadow: `0 0 12px ${colors.blurple}`,
                    }}
                  />
                )}
                <ListItemIcon
                  sx={{ minWidth: 40, color: active ? colors.blurpleLight : 'text.secondary' }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontWeight: active ? 700 : 500 } } }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </FocusGroup>

      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>{user}</Box>
        <Tooltip title="Sair">
          <IconButton onClick={logout} aria-label="Sair">
            <LogoutRoundedIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ ...glassSurface, display: { md: 'none' }, borderWidth: '0 0 1px 0' }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <MenuRoundedIcon />
          </IconButton>
          <Logo size={32} />
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {navigation('mobile')}
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, borderWidth: '0 1px 0 0' },
        }}
      >
        {navigation('desktop')}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3, lg: 5 },
          pt: { xs: 11, md: 5 },
          pb: 6,
        }}
      >
        <Box sx={{ maxWidth: 1280, mx: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  );
}
