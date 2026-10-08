'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useState, type FormEvent, type ReactNode } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FOCUS_ITEM } from '@/components/FocusGroup';
import { MoneyField } from '@/components/MoneyField';
import { PageHeader } from '@/components/PageHeader';
import { useBalance, usePosition, useQuote } from '@/features/dashboard/queries';
import { formatBRL, formatBTC } from '@/lib/format';
import { ApiError, errorMessage } from '@/lib/http';
import { satsToBtc, toCents, toReais } from '@/lib/money';
import { relativeTime } from '@/lib/time';
import { useNow } from '@/lib/use-now';
import { FifoPlan } from './FifoPlan';
import { useSell } from './mutations';
import { QuickPercentChips } from './QuickPercentChips';
import { salePreview, toOpenInvestments } from './sale-preview';
import { SuccessPanel } from './SuccessPanel';
import { SummaryList } from './SummaryList';
import { PANEL_SX, TradeLayout } from './TradeLayout';

const brl = (cents: number) => formatBRL(toReais(cents));
const btc = (sats: number) => formatBTC(satsToBtc(sats));

const TITLE = 'Vender bitcoin';

export function SellView() {
  const balance = useBalance();
  const quote = useQuote();
  const position = usePosition();
  const sell = useSell();
  const now = useNow();
  const [amountCents, setAmountCents] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Venda usa a cotação de COMPRA do mercado (o preço que o mercado paga).
  const priceCents = quote.data ? toCents(quote.data.buy) : null;
  const investments = position.data ? toOpenInvestments(position.data.investments) : null;
  const balanceCents = balance.data ? toCents(balance.data.balance) : null;
  const preview =
    investments && priceCents !== null
      ? salePreview({ amountCents, investments, priceCents })
      : null;
  const noBitcoins = investments?.length === 0;

  const apiFieldError =
    sell.error instanceof ApiError ? sell.error.fieldMessage('amount') : undefined;
  const fieldError =
    (preview && !noBitcoins && (submitted || amountCents > 0) ? preview.error : null) ??
    apiFieldError;
  const formError = sell.isError && !apiFieldError ? errorMessage(sell.error) : null;

  function changeAmount(cents: number) {
    setAmountCents(cents);
    if (sell.isError) sell.reset();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (preview && !preview.error) setConfirming(true);
  }

  function confirm() {
    sell.mutate(amountCents, { onSettled: () => setConfirming(false) });
  }

  function startOver() {
    sell.reset();
    setAmountCents(0);
    setSubmitted(false);
  }

  if (sell.isSuccess) {
    const result = sell.data;
    return (
      <>
        <PageHeader title={TITLE} />
        <SuccessPanel
          title="Venda realizada!"
          description={
            result.reinvestment
              ? 'O valor já está no seu saldo. A sobra do investimento vendido em parte continua investida.'
              : 'O valor já está no seu saldo, e os detalhes foram enviados para o seu e-mail.'
          }
          rows={[
            { label: 'Valor resgatado', value: formatBRL(result.amount), emphasis: true },
            { label: 'BTC vendido', value: formatBTC(result.btcAmount) },
            { label: 'Cotação de compra', value: formatBRL(result.btcPrice) },
            ...(result.reinvestment
              ? [
                  {
                    label: 'Reinvestimento',
                    value: `${formatBTC(result.reinvestment.btcAmount)} (${formatBRL(result.reinvestment.amount)})`,
                  },
                ]
              : []),
            { label: 'Novo saldo', value: formatBRL(result.balance) },
          ]}
          actions={
            <>
              <Button
                className={FOCUS_ITEM}
                component={NextLink}
                href="/statement"
                variant="contained"
              >
                Ver no extrato
              </Button>
              <Button className={FOCUS_ITEM} variant="outlined" onClick={startOver}>
                Nova venda
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
  const show = (value: ReactNode, failed: boolean) =>
    value ?? (failed ? 'Indisponível' : loadingValue);

  const valid = Boolean(preview && !preview.error);
  const priceText = priceCents !== null ? brl(priceCents) : null;
  const soldText = preview ? (valid ? `≈ ${btc(preview.soldSats)}` : '—') : null;
  const receiveText = valid ? brl(amountCents) : '—';
  const balanceAfterText =
    balanceCents === null ? null : valid ? brl(balanceCents + amountCents) : '—';
  const reinvestmentText =
    preview?.reinvestment &&
    `${btc(preview.reinvestment.btcSats)} (${brl(preview.reinvestment.investedCents)})`;

  return (
    <>
      <PageHeader
        title={TITLE}
        subtitle="Resgate em reais pela cotação de compra do Mercado Bitcoin."
      />
      <TradeLayout
        form={
          <Card component="form" noValidate onSubmit={handleSubmit} sx={PANEL_SX}>
            <Stack spacing={2.5}>
              <Typography variant="h6" component="h2">
                Quanto você quer resgatar?
              </Typography>
              {noBitcoins && (
                <Alert
                  severity="info"
                  action={
                    <Button component={NextLink} href="/buy" size="small" color="inherit">
                      Comprar
                    </Button>
                  }
                >
                  Você ainda não tem bitcoins para vender.
                </Alert>
              )}
              {position.isError && (
                <Alert
                  severity="error"
                  action={
                    <Button size="small" color="inherit" onClick={() => position.refetch()}>
                      Tentar de novo
                    </Button>
                  }
                >
                  Não foi possível carregar os seus investimentos.
                </Alert>
              )}
              {formError && (
                <Alert severity="error" role="alert">
                  {formError}
                </Alert>
              )}
              <MoneyField
                label="Valor da venda"
                value={amountCents}
                onChange={changeAmount}
                autoFocus
                fullWidth
                error={Boolean(fieldError)}
                helperText={
                  fieldError ??
                  (preview && !noBitcoins
                    ? `Máximo para venda agora: ${brl(preview.positionValueCents)}`
                    : ' ')
                }
              />
              <QuickPercentChips
                totalCents={preview?.positionValueCents ?? null}
                onPick={changeAmount}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={!preview || noBitcoins}
              >
                Revisar venda
              </Button>
            </Stack>
          </Card>
        }
        summary={
          <Card component="aside" aria-label="Prévia da venda" sx={PANEL_SX}>
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
                { label: 'Cotação de compra', value: show(priceText, quote.isError) },
                {
                  label: 'BTC vendido (estimado)',
                  value: show(soldText, quote.isError || position.isError),
                },
                { label: 'Você recebe', value: receiveText, emphasis: true },
                { label: 'Saldo depois', value: show(balanceAfterText, balance.isError) },
              ]}
            />

            <Typography variant="subtitle2" component="h3" sx={{ mt: 2.5, mb: 1 }}>
              Como a venda acontece (FIFO)
            </Typography>
            {valid && preview ? (
              <FifoPlan steps={preview.steps} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Os investimentos mais antigos são vendidos primeiro. Se um deles for vendido em
                parte, a sobra vira um reinvestimento com a mesma data e cotação da compra.
                {investments && investments.length > 0 && (
                  <>
                    {' '}
                    Você tem {investments.length}{' '}
                    {investments.length === 1 ? 'investimento aberto' : 'investimentos abertos'}.
                  </>
                )}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              {quote.data && now && (
                <>Cotação atualizada {relativeTime(quote.data.updatedAt, now)}. </>
              )}
              A venda usa a cotação do momento da confirmação, por isso o BTC vendido pode variar um
              pouco.
            </Typography>
          </Card>
        }
      />

      <ConfirmDialog
        open={confirming}
        title="Revise a venda"
        confirmLabel="Confirmar venda"
        loading={sell.isPending}
        onConfirm={confirm}
        onClose={() => setConfirming(false)}
      >
        <SummaryList
          rows={[
            { label: 'Você recebe', value: receiveText, emphasis: true },
            { label: 'Cotação de compra', value: priceText ?? '—' },
            { label: 'BTC vendido (estimado)', value: soldText ?? '—' },
            ...(reinvestmentText ? [{ label: 'Reinvestimento', value: reinvestmentText }] : []),
            { label: 'Saldo depois', value: balanceAfterText ?? '—' },
          ]}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          A cotação é atualizada a cada 15 s; a venda usa a do momento da confirmação.
        </Typography>
      </ConfirmDialog>
    </>
  );
}
