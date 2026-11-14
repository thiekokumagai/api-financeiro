/**
 * Período do Dashboard: o front envia início e fim já como instantes ISO
 * (meia-noite e 23:59:59.999 locais); sem datas, "hoje" no horário do servidor.
 */
export function resolveDashboardPeriod(
  startDate?: string,
  endDate?: string,
): { start: Date; end: Date } {
  if (startDate && endDate) {
    return { start: new Date(startDate), end: new Date(endDate) };
  }

  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  return {
    start: new Date(y, m, d, 0, 0, 0, 0),
    end: new Date(y, m, d, 23, 59, 59, 999),
  };
}

/** Quantidade de dias corridos do período (mínimo 1). */
export function countPeriodDays(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

/**
 * Período anterior para comparação: mesmo tamanho, imediatamente antes, e cortado no
 * mesmo ponto em que o atual está agora. "Hoje" às 14h compara com "ontem até 14h";
 * "7 dias" (com hoje pela metade) compara com os 7 dias anteriores cortados igual.
 * null quando o período atual ainda nem começou.
 */
export function resolvePreviousPeriod(
  start: Date,
  end: Date,
  now: Date = new Date(),
): { start: Date; end: Date } | null {
  const cutoff = Math.min(end.getTime(), now.getTime());
  if (cutoff < start.getTime()) return null;

  const length = end.getTime() - start.getTime() + 1;
  const prevStart = new Date(start.getTime() - length);
  const prevEnd = new Date(prevStart.getTime() + (cutoff - start.getTime()));
  return { start: prevStart, end: prevEnd };
}
