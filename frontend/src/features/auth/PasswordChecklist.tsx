'use client';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { colors } from '@/theme/tokens';
import { PASSWORD_RULES } from './schemas';

/** As regras da senha ficando verdes conforme a pessoa digita. */
export function PasswordChecklist({ password }: { password: string }) {
  return (
    <Stack
      component="ul"
      spacing={0.5}
      sx={{ listStyle: 'none', p: 0, m: 0 }}
      aria-label="Regras da senha"
    >
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <Stack
            key={rule.id}
            component="li"
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              color: ok ? colors.success : 'text.secondary',
              transition: 'color 200ms',
            }}
            data-ok={ok}
          >
            {ok ? (
              <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
            ) : (
              <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 18 }} />
            )}
            <Typography variant="body2" component="span">
              {rule.label}
              <span className="sr-only">{ok ? ' (atendida)' : ' (pendente)'}</span>
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
