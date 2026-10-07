import type { FieldValues, Path, UseFormRegisterReturn, UseFormSetError } from 'react-hook-form';
import { ApiError } from './http';

/**
 * Liga o `register` do React Hook Form a um TextField do MUI.
 * O MUI precisa do `ref` no `inputRef` (o `<input>` de verdade), e não na `<div>` de fora.
 */
export function muiField<Name extends string>({ ref, ...rest }: UseFormRegisterReturn<Name>) {
  return { ...rest, inputRef: ref };
}

/**
 * Coloca os erros de campo que vieram da API (`details`) embaixo de cada input.
 * Devolve true se algum erro de campo foi aplicado.
 */
export function applyApiFieldErrors<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof ApiError)) return false;
  let applied = false;
  for (const detail of error.details) {
    const field = fields.find((name) => name === detail.field);
    if (field) {
      setError(field, { type: 'server', message: detail.message });
      applied = true;
    }
  }
  return applied;
}
