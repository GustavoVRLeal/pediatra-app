/* Conversões entre o formato digitado (pt-BR) e o formato do backend.
   As datas de nascimento são gravadas como meia-noite UTC, por isso
   usamos os métodos getUTC* para não "voltar um dia" no fuso do Brasil. */

/* "2022-03-10T00:00:00.000Z" -> "10/03/2022" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

/* Idade em anos e meses, útil em pediatria: "2 anos e 3 meses", "5 meses" */
export function formatAge(iso: string): string {
  const birth = new Date(iso);
  const now = new Date();

  let months =
    (now.getFullYear() - birth.getUTCFullYear()) * 12 +
    (now.getMonth() - birth.getUTCMonth());
  if (now.getDate() < birth.getUTCDate()) months -= 1;
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;

  if (years === 0) return plural(rest, 'mês', 'meses');
  if (rest === 0) return plural(years, 'ano', 'anos');
  return `${plural(years, 'ano', 'anos')} e ${plural(rest, 'mês', 'meses')}`;
}

/* "10/03/2022" -> "2022-03-10" (ou null se a data for inválida ou futura) */
export function parseBrDate(text: string): string | null {
  const match = text.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);

  // Rejeita datas como 31/02/2022 e datas no futuro
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCDate() !== Number(day) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getTime() > Date.now()
  ) {
    return null;
  }

  return iso;
}

/* Insere as barras enquanto o usuário digita: "10032022" -> "10/03/2022" */
export function maskDate(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/* "12,5" -> 12.5 (ou null se não for um número positivo) */
export function parsePositiveNumber(text: string): number | null {
  const value = Number(text.trim().replace(',', '.'));
  return text.trim() !== '' && Number.isFinite(value) && value > 0 ? value : null;
}

/* 12.5 -> "12,5" */
export function formatNumber(value: number): string {
  return String(value).replace('.', ',');
}
