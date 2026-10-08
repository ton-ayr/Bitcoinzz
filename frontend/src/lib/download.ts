/** Baixa um texto como arquivo, gerado no próprio navegador (nada passa pelo servidor). */
export function downloadTextFile(filename: string, content: string, type = 'text/csv') {
  // O BOM (﻿) avisa o Excel que o arquivo é UTF-8; sem ele, os acentos quebram.
  const blob = new Blob(['﻿', content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
