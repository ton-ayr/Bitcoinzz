'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useState, type FormEvent, type ReactNode } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FOCUS_ITEM, FocusGroup } from '@/components/FocusGroup';
import { MoneyField } from '@/components/MoneyField';
import { PageHeader } from '@/components/PageHeader';
import { useBalance, useQuote } from '@/features/dashboard/queries';
import { formatBRL, formatBTC } from '@/lib/format';
import { ApiError, errorMessage } from '@/lib/http';
import { satsToBtc, toCents, toReais } from '@/lib/money';
import { relativeTime } from '@/lib/time';
import { useNow } from '@/lib/use-now';
import { usePurchase } from './mutations';
import { percentOf, purchasePreview } from './preview';
import { SuccessPanel } from './SuccessPanel';
import { SummaryList } from './SummaryList';
import { PANEL_SX, TradeLayout } from './TradeLayout';

// Atalhos que preenchem uma parte do saldo disponível.
const QUICK_PERCENTS = [
  { label: '25%', percent: 25 },
  { label: '50%', percent: 50 },
  { label: 'Tudo', percent: 100 },
];

const brl = (cents: number) => formatBRL(toReais(cents));

const TITLE = 'Comprar bitcoin';

export function PurchaseView() {
  const balance = useBalance();
  const quote = useQuote();
  const purchase = usePurchase();
  const now = useNow();
  const [amountCents, setAmountCents] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const balanceCents = balance.data ? toCents(balance.data.balance) : null;
  // Compra usa a cotação de VENDA do mercado (o preço que o mercado cobra).
  const priceCents = quote.data ? toCents(quote.data.sell) : null;
  const ready = balanceCents !== null && priceCents !== null;
  const preview = purchasePreview({ amountCents, balanceCents: balanceCents ?? 0, priceCents });

  const apiFieldError =
    purchase.error instanceof ApiError ? purchase.error.fieldMessage('amount') : undefined;
  const fieldError =
    (ready && (submitted || amountCents > 0) ? preview.error : null) ?? apiFieldError;
  const formError = purchase.isError && !apiFieldError ? errorMessage(purchase.error) : null;

  function changeAmount(cents: number) {
    setAmountCents(cents);
    if (purchase.isError) purchase.reset();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (ready && !preview.error) setConfirming(true);
  }

  function confirm() {
    purchase.mutate(amountCents, { onSettled: () => setConfirming(false) });
  }

  function startOver() {
    purchase.reset();
    setAmountCents(0);
    setSubmitted(false);
  }

  if (purchase.isSuccess) {
    const result = purchase.data;
    return (
      <>
        <PageHeader title={TITLE} />
        <SuccessPanel
          title="Compra realizada!"
          description="O investimento já aparece no dashboard, e os detalhes foram enviados para o seu e-mail."
          rows={[
            { label: 'Você comprou', value: formatBTC(result.btcAmount), emphasis: true },
            { label: 'Valor investido', value: formatBRL(result.amount) },
            { label: 'Cotação de venda', value: formatBRL(result.btcPrice) },
            { label: 'Novo saldo', value: formatBRL(result.balance) },
          ]}
          actions={
            <>
              <Button
                className={FOCUS_ITEM}
                component={NextLink}
                href="/dashboard"
                variant="contained"
              >
                Ver no dashboard
              </Button>
              <Button className={FOCUS_ITEM} variant="outlined" onClick={startOver}>
                Nova compra
              </Button>
            </>
          }
        />
      </>
    );
  }

  const loadingValue = <Skeleton width={110} sx={{ display: 'inline-block' }} />;
  const show = (value: ReactNode, failed: boolean) =>
    value ?? (failed ? 'Indisponível' : loadingValue);

  const priceText = priceCents !== null ? brl(priceCents) : null;
  const btcText =
    preview.btcSats === null
      ? null
      : amountCents === 0
        ? '—'
        : `≈ ${formatBTC(satsToBtc(preview.btcSats))}`;
  const balanceAfterText =
    balanceCents === null
      ? null
      : preview.balanceAfterCents < 0
        ? '—'
        : brl(preview.balanceAfterCents);

  return (
    <>
      <PageHeader
        title={TITLE}
        subtitle="Converta seu saldo em bitcoin pela cotação de venda do Mercado Bitcoin."
      />
      <TradeLayout
        form={
          <Card component="form" noValidate onSubmit={handleSubmit} sx={PANEL_SX}>
            <Stack spacing={2.5}>
              <Typography variant="h6" component="h2">
                Quanto você quer investir?
              </Typography>
              {balanceCents === 0 && (
                <Alert
                  severity="info"
                  action={
                    <Button component={NextLink} href="/deposit" size="small" color="inherit">
                      Depositar
                    </Button>
                  }
                >
                  Você ainda não tem saldo para investir.
                </Alert>
              )}
              {formError && (
                <Alert severity="error" role="alert">
                  {formError}
                </Alert>
              )}
              <MoneyField
                label="Valor da compra"
                value={amountCents}
                onChange={changeAmount}
                autoFocus
                fullWidth
                error={Boolean(fieldError)}
                helperText={
                  fieldError ?? (balanceCents !== null ? `Disponível: ${brl(balanceCents)}` : ' ')
                }
              />
              <FocusGroup sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {QUICK_PERCENTS.map(({ label, percent }) => (
                  <Chip
                    key={label}
                    className={FOCUS_ITEM}
                    label={label}
                    variant="outlined"
                    disabled={!balanceCents}
                    onClick={() => changeAmount(percentOf(balanceCents ?? 0, percent))}
                  />
                ))}
              </FocusGroup>
              <Button type="submit" variant="contained" size="large" fullWidth disabled={!ready}>
                Revisar compra
              </Button>
            </Stack>
          </Card>
        }
        summary={
          <Card component="aside" aria-label="Prévia da compra" sx={PANEL_SX}>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              Prévia
            </Typography>
            {quote.isError && (
              <Alert
                severity="warning"
                sx={{ mb: 1 }}
                action={
                  <Button size="small" color="inherit" onClick={() => quote.refetch()}>
                    Tentar de novo
                  </Button>
                }
              >
                Cotação indisponível no momento.
              </Alert>
            )}
            <SummaryList
              rows={[
                { label: 'Cotação de venda', value: show(priceText, quote.isError) },
                {
                  label: 'Você recebe (estimado)',
                  value: show(btcText, quote.isError),
                  emphasis: true,
                },
                {
                  label: 'Saldo atual',
                  value: show(balanceCents !== null ? brl(balanceCents) : null, balance.isError),
                },
                { label: 'Saldo depois', value: show(balanceAfterText, balance.isError) },
              ]}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              {quote.data && now && (
                <>Cotação atualizada {relativeTime(quote.data.updatedAt, now)}. </>
              )}
              A compra usa a cotação do momento da confirmação, por isso o BTC final pode variar um
              pouco.
            </Typography>
          </Card>
        }
      />

      <ConfirmDialog
        open={confirming}
        title="Revise a compra"
        confirmLabel="Confirmar compra"
        loading={purchase.isPending}
        onConfirm={confirm}
        onClose={() => setConfirming(false)}
      >
        <SummaryList
          rows={[
            { label: 'Valor', value: brl(amountCents) },
            { label: 'Cotação de venda', value: priceText ?? '—' },
            { label: 'Você recebe (estimado)', value: btcText ?? '—', emphasis: true },
            { label: 'Saldo depois', value: balanceAfterText ?? '—' },
          ]}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          A cotação é atualizada a cada 15 s; a compra usa a do momento da confirmação.
        </Typography>
      </ConfirmDialog>
    </>
  );
}
