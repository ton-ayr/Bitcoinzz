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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { applyApiFieldErrors, muiField } from '@/lib/forms';
import { ApiError } from '@/lib/http';
import { PasswordChecklist } from './PasswordChecklist';
import { PasswordField } from './PasswordField';
import { registerSchema, type RegisterData, type RegisterInput } from './schemas';
import { usePrewarmApi } from './usePrewarmApi';

const CONNECTION_ERROR = 'Não foi possível conectar. Verifique sua internet e tente novamente.';

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  usePrewarmApi();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput, unknown, RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });
  const password = useWatch({ control, name: 'password' });

  async function onSubmit({ name, email, password }: RegisterData) {
    setFormError(null);
    try {
      const result = await api.post<{ name: string; loggedIn: boolean }>('auth/register', {
        name,
        email,
        password,
      });
      toast.success(`Conta criada! Bem-vindo(a), ${result.name.split(' ')[0]}.`);
      // Login automático; se ele falhar, a pessoa entra pela tela de login.
      router.replace(result.loggedIn ? '/dashboard' : '/login');
      router.refresh();
    } catch (error) {
      if (applyApiFieldErrors(error, ['name', 'email', 'password'], setError)) return;
      if (error instanceof ApiError && error.status === 409) {
        setError('email', { type: 'server', message: error.message });
        return;
      }
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
            Criar conta
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Comece a investir em poucos segundos.
          </Typography>
        </div>

        {formError && (
          <Alert severity="error" role="alert">
            {formError}
          </Alert>
        )}

        <TextField
          label="Nome"
          autoComplete="name"
          autoFocus
          fullWidth
          {...muiField(register('name'))}
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          fullWidth
          {...muiField(register('email'))}
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
        />
        <Stack spacing={1.25}>
          <PasswordField
            label="Senha"
            autoComplete="new-password"
            fullWidth
            {...register('password')}
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
          />
          <PasswordChecklist password={password} />
        </Stack>
        <PasswordField
          label="Confirmar senha"
          autoComplete="new-password"
          fullWidth
          {...register('confirmPassword')}
          error={Boolean(errors.confirmPassword)}
          helperText={errors.confirmPassword?.message}
        />

        <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
          Criar conta
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Já tem conta?{' '}
          <Link component={NextLink} href="/login" sx={{ fontWeight: 700 }}>
            Entrar
          </Link>
        </Typography>
      </Stack>
    </Card>
  );
}
