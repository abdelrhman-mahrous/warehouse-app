export const today = () => new Date().toLocaleDateString('en-CA');
export const n = (v) => Number(v) || 0;
export const num = (v) => n(v).toLocaleString('ar-EG');
export const money = (v) => n(v).toLocaleString('ar-EG', { maximumFractionDigits: 2 });
export const fmtCt = (p, ppc) =>
  `${num(Math.floor(p / ppc))} كرتونة${p % ppc ? ` + ${num(p % ppc)} قطعة` : ''}`;
export const when = (t) => new Date(t).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
