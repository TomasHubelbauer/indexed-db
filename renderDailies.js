import listStore from './listStore.js';
import upsertEntry from './upsertEntry.js';

export default async function renderDailies() {
  const dailies = await listStore('dailies');

  const dailiesDiv = document.querySelector('#dailiesDiv');
  dailiesDiv.innerHTML = '';

  for (const daily of dailies) {
    const key = new Date().toISOString().slice(0, 10);
    if (daily[key]) {
      continue;
    }

    const button = document.createElement('button');
    button.textContent = daily.icon;
    button.title = daily.title;
    button.addEventListener('click', async () => {
      await upsertEntry('dailies', { id: daily.id, [key]: true });
      await renderDailies();
    });

    dailiesDiv.append(button);
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

    await upsertEntry('dailies', { icon, title });
    await renderDailies();
  });

  dailiesDiv.append(button);
}
