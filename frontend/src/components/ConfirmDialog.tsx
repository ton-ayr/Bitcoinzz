'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import type { ReactNode } from 'react';
import { FOCUS_ITEM, FocusGroup } from '@/components/FocusGroup';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Diálogo "revise e confirme" das operações. Enquanto confirma, não fecha. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <FocusGroup sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', width: '100%' }}>
          <Button className={FOCUS_ITEM} variant="outlined" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button className={FOCUS_ITEM} variant="contained" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </FocusGroup>
      </DialogActions>
    </Dialog>
  );
}
