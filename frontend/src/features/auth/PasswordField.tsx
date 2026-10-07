'use client';

import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { forwardRef, useState } from 'react';

/** Campo de senha com o botão de mostrar/ocultar. */
export const PasswordField = forwardRef<HTMLInputElement, TextFieldProps>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <TextField
        {...props}
        inputRef={ref}
        type={visible ? 'text' : 'password'}
        slotProps={{
          ...props.slotProps,
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={() => setVisible((current) => !current)}
                  aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {visible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    );
  },
);
