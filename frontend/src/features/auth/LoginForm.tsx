'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { safeNextPath } from '@/lib/access';
import { api } from '@/lib/api-client';
import { applyApiFieldErrors, muiField } from '@/lib/forms';
import { ApiError } from '@/lib/http';
import { PasswordField } from './PasswordField';
import { loginSchema, type LoginData, type LoginInput } from './schemas';
import { usePrewarmApi } from './usePrewarmApi';

const CONNECTION_ERROR = 'Não foi possível conectar. Verifique sua internet e tente novamente.';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('reason') === 'expired';
  const [formError, setFormError] = useState<string | null>(null);
  usePrewarmApi();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput, unknown, LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginData) {
    setFormError(null);
    try {
      await api.post('auth/login', data);
      router.replace(safeNextPath(searchParams.get('next')));
      router.refresh();
    } catch (error) {
      if (applyApiFieldErrors(error, ['email', 'password'], setError)) return;
      // 401 (credenciais), 429 (muitas tentativas) e demais erros com a mensagem da API.
      setFormError(error instanceof ApiError ? error.message : CONNECTION_ERROR);
    }
  }

  return (
    <Card
      component={motion.form}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      sx={{ p: { xs: 3, sm: 4 }, '&:hover': { transform: 'none' } }}
    >
      <Stack spacing={2.5}>
        <div>
          <Typography variant="h4" component="h1">
            Entrar
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Que bom ter você de volta! Acesse sua carteira.
          </Typography>
        </div>

        {sessionExpired && !formError && (
          <Alert severity="info">Sua sessão expirou. Entre novamente.</Alert>
        )}
        {formError && (
          <Alert severity="error" role="alert">
            {formError}
          </Alert>
        )}

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          autoFocus
          fullWidth
          {...muiField(register('email'))}
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
        />
        <PasswordField
          label="Senha"
          autoComplete="current-password"
          fullWidth
          {...register('password')}
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
        />

        <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
          Entrar
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Não tem conta?{' '}
          {/* Sem prefetch: logo após o login o Next pré-carregaria /register já com sessão, e o
              proxy o redireciona para o dashboard (o prefetch acabava em 404 no console). */}
          <Link component={NextLink} href="/register" prefetch={false} sx={{ fontWeight: 700 }}>
            Criar conta
          </Link>
        </Typography>
      </Stack>
    </Card>
  );
}
