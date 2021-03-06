import renderRecurrents from './renderRecurrents.js';
import calculateWeekNumber from './calculateWeekNumber.js';

export default async function renderWeeklies() {
  await renderRecurrents('#weekliesDiv', 'weeklies', () => new Date().getFullYear() + '-' + calculateWeekNumber(), key => `Week ${key}`);
}
