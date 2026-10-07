import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { forwardToApi } from '@/server/bff';
import { apiUrl, getSessionToken } from '@/server/session';
import { gradients } from '@/theme/tokens';

interface Profile {
  name: string;
  email: string;
}

async function fetchProfile(): Promise<Profile | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const response = await forwardToApi({ apiUrl: apiUrl(), method: 'GET', path: 'account', token });
  return response.ok ? ((await response.json()) as Profile) : null;
}

/**
 * Server Component: lê o cookie e busca o perfil NO SERVIDOR (o token não passa pelo navegador).
 * Fica dentro de um <Suspense>: o menu aparece na hora e o nome chega em streaming.
 */
export async function UserBadge() {
  const profile = await fetchProfile();

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Avatar sx={{ width: 36, height: 36, backgroundImage: gradients.primary, fontWeight: 700 }}>
        {profile?.name.charAt(0).toUpperCase() ?? '?'}
      </Avatar>
      <div style={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 700, fontSize: 14 }}>
          {profile?.name ?? 'Minha conta'}
        </Typography>
        <Typography noWrap variant="caption" color="text.secondary" component="p">
          {profile?.email ?? ''}
        </Typography>
      </div>
    </Stack>
  );
}

export function UserBadgeSkeleton() {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Skeleton variant="circular" width={36} height={36} />
      <div style={{ flexGrow: 1 }}>
        <Skeleton width="70%" />
        <Skeleton width="90%" height={14} />
      </div>
    </Stack>
  );
}
