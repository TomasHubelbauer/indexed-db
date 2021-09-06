import renderRecurrents from './renderRecurrents.js';

export default async function renderMonthlies() {
  await renderRecurrents('#monthliesDiv', 'monthlies', () => new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
}
