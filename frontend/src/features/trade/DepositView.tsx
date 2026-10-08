'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useState, type FormEvent } from 'react';
import { FOCUS_ITEM, FocusGroup } from '@/components/FocusGroup';
import { MoneyField } from '@/components/MoneyField';
import { PageHeader } from '@/components/PageHeader';
import { useBalance } from '@/features/dashboard/queries';
import { formatBRL } from '@/lib/format';
import { ApiError, errorMessage } from '@/lib/http';
import { toCents, toReais } from '@/lib/money';
import { useDeposit } from './mutations';
import { depositPreview, MAX_DEPOSIT_CENTS } from './preview';
import { SuccessPanel } from './SuccessPanel';
import { SummaryList } from './SummaryList';
import { PANEL_SX, TradeLayout } from './TradeLayout';

// Atalhos que SOMAM ao valor digitado.
const QUICK_AMOUNTS = [
  { label: '+ R$ 100', cents: 10_000 },
  { label: '+ R$ 500', cents: 50_000 },
  { label: '+ R$ 1.000', cents: 100_000 },
];

const brl = (cents: number) => formatBRL(toReais(cents));

const TITLE = 'Depositar';

export function DepositView() {
  const balance = useBalance();
  const deposit = useDeposit();
  const [amountCents, setAmountCents] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const balanceCents = balance.data ? toCents(balance.data.balance) : null;
  const preview = depositPreview(amountCents, balanceCents ?? 0);

  // "Informe o valor" só aparece depois de tentar enviar; o limite aparece enquanto se digita.
  const apiFieldError =
    deposit.error instanceof ApiError ? deposit.error.fieldMessage('amount') : undefined;
  const fieldError = (submitted || amountCents > 0 ? preview.error : null) ?? apiFieldError;
  const formError = deposit.isError && !apiFieldError ? errorMessage(deposit.error) : null;

  function changeAmount(cents: number) {
    setAmountCents(cents);
    if (deposit.isError) deposit.reset();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!preview.error) deposit.mutate(amountCents);
  }

  function startOver() {
    deposit.reset();
    setAmountCents(0);
    setSubmitted(false);
  }

  if (deposit.isSuccess) {
    return (
      <>
        <PageHeader title={TITLE} />
        <SuccessPanel
          title="Depósito realizado!"
          description="O valor já está disponível para investir."
          rows={[
            { label: 'Valor depositado', value: brl(deposit.variables) },
            { label: 'Novo saldo', value: formatBRL(deposit.data.balance), emphasis: true },
          ]}
          actions={
            <>
              <Button className={FOCUS_ITEM} component={NextLink} href="/buy" variant="contained">
                Comprar bitcoin
              </Button>
              <Button className={FOCUS_ITEM} variant="outlined" onClick={startOver}>
                Novo depósito
              </Button>
              <Button
                className={FOCUS_ITEM}
                component={NextLink}
                href="/dashboard"
                variant="outlined"
              >
                Ir para o dashboard
              </Button>
            </>
          }
        />
      </>
    );
  }

  const loadingValue = <Skeleton width={110} sx={{ display: 'inline-block' }} />;
  const balanceValue = (cents: number) =>
    balanceCents !== null ? brl(cents) : balance.isError ? 'Indisponível' : loadingValue;

  return (
    <>
      <PageHeader
        title={TITLE}
        subtitle="Adicione saldo para investir em bitcoin. O dinheiro é simulado: nada é cobrado."
      />
      <TradeLayout
        form={
          <Card component="form" noValidate onSubmit={handleSubmit} sx={PANEL_SX}>
            <Stack spacing={2.5}>
              <Typography variant="h6" component="h2">
                Quanto você quer depositar?
              </Typography>
              {formError && (
                <Alert severity="error" role="alert">
                  {formError}
                </Alert>
              )}
              <MoneyField
                label="Valor do depósito"
                value={amountCents}
                onChange={changeAmount}
                autoFocus
                fullWidth
                error={Boolean(fieldError)}
                helperText={fieldError ?? `Até ${brl(MAX_DEPOSIT_CENTS)} por depósito`}
              />
              <FocusGroup sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {QUICK_AMOUNTS.map(({ label, cents }) => (
                  <Chip
                    key={cents}
                    className={FOCUS_ITEM}
                    label={label}
                    variant="outlined"
                    onClick={() => changeAmount(amountCents + cents)}
                  />
                ))}
              </FocusGroup>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                loading={deposit.isPending}
              >
                Depositar
              </Button>
            </Stack>
          </Card>
        }
        summary={
          <Card component="aside" aria-label="Resumo do depósito" sx={PANEL_SX}>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              Resumo
            </Typography>
            <SummaryList
              rows={[
                { label: 'Saldo atual', value: balanceValue(balanceCents ?? 0) },
                { label: 'Depósito', value: `+ ${brl(amountCents)}` },
                {
                  label: 'Saldo depois',
                  value:
                    amountCents > 0 && preview.error
                      ? '—'
                      : balanceValue(preview.balanceAfterCents),
                  emphasis: true,
                },
              ]}
            />
          </Card>
        }
      />
    </>
  );
}
