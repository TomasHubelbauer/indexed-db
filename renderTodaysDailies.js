import renderRecurrents from './renderRecurrents.js';

export default async function renderTodaysDailies() {
  await renderRecurrents('#todaysDailiesDiv', 'dailies', () => new Date().toISOString().slice(0, 10), key => `Today ${key}`);
}
