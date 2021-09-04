import listStore from './listStore.js';
import upsertEntry from './upsertEntry.js';

export default async function renderWeeklies() {
  const weeklies = await listStore('weeklies');

  const weekliesDiv = document.querySelector('#weekliesDiv');
  weekliesDiv.innerHTML = '';

  const key = calculateWeekNumber();
  const titleDiv = document.createElement('div');
  titleDiv.textContent = 'Week ' + key;
  weekliesDiv.append(titleDiv);

  for (const weekly of weeklies) {
    if (weekly[key]) {
      continue;
    }

    const button = document.createElement('button');
    button.textContent = weekly.icon;
    button.title = weekly.title;
    button.addEventListener('click', async () => {
      await upsertEntry('weeklies', { id: weekly.id, [key]: true });
      await renderWeeklies();
    });

    weekliesDiv.append(button);
  }

  const button = document.createElement('button');
  button.textContent = '➕';
  button.addEventListener('click', async () => {
    const icon = prompt('Icon:');
    if (!icon) {
      return;
    }

    const title = prompt('Title:');
    if (!title) {
      return;
    }

    await upsertEntry('weeklies', { icon, title });
    await renderWeeklies();
  });

  weekliesDiv.append(button);
}

// https://weeknumber.com/how-to/javascript
function calculateWeekNumber() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1Date = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1Date.getTime()) / 86400000 - 3 + (week1Date.getDay() + 6) % 7) / 7);
}
