import listStore from './listStore.js';
import upsertEntry from './upsertEntry.js';

export default async function renderMonthlies() {
  const monthlies = await listStore('monthlies');

  const monthliesDiv = document.querySelector('#monthliesDiv');
  monthliesDiv.innerHTML = '';

  const key = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const titleDiv = document.createElement('div');
  titleDiv.textContent = key;
  monthliesDiv.append(titleDiv);

  for (const monthly of monthlies) {
    if (monthly[key]) {
      continue;
    }

    const button = document.createElement('button');
    button.textContent = monthly.icon;
    button.title = monthly.title;
    button.addEventListener('click', async () => {
      await upsertEntry('monthlies', { id: monthly.id, [key]: true });
      await renderMonthlies();
    });

    monthliesDiv.append(button);
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

    await upsertEntry('monthlies', { icon, title });
    await renderMonthlies();
  });

  monthliesDiv.append(button);
}
