import renderRecurrents from './renderRecurrents.js';

export default async function renderYesterdaysDailies() {
  await renderRecurrents('#yesterdaysDailiesDiv', 'dailies', () => {
    const today = new Date();
    const yesterday = new Date(today.setDate(today.getDate() - 1));
    return yesterday.toISOString().slice(0, 10)
  }, key => `Yesterday ${key}`);
}
