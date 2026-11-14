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
