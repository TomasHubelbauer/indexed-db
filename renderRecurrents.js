import listStore from './listStore.js';
import upsertEntry from './upsertEntry.js';

export default async function renderRecurrents(
  /** @type {string} */ selector,
  /** @type {string} */ store,
  /** @type {() => string} */ keyer,
  /** @type {(string) => void} */ formatter
) {
  const div = document.querySelector(selector);
  div.innerHTML = '';

  const key = keyer();
  const titleDiv = document.createElement('div');
  titleDiv.textContent = formatter?.(key) ?? key;
  div.append(titleDiv);

  const recurrents = await listStore(store);
  for (const recurrent of recurrents) {
    if (recurrent[key]) {
      continue;
    }

    const button = document.createElement('button');
    button.textContent = recurrent.icon;
    button.title = recurrent.title;
    button.addEventListener('click', async () => {
      await upsertEntry(store, { id: recurrent.id, [key]: true });
      await renderRecurrents(selector, store, keyer);
    });

    div.append(button);
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

    await upsertEntry(store, { icon, title });
    await renderRecurrents(selector, store, keyer);
  });

  div.append(button);
}
