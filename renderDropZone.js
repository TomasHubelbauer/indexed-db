import upsertEntry from './upsertEntry.js';

export default function renderDropZone(/** @type {{ id: number; order: number; title: string; }} */ prev, /** @type {{ id: number; order: number; title: string; }} */ next, renderItems) {
  const div = document.createElement('div');
  div.className = 'dropDiv';
  div.title = prev?.title ? next?.title ? `Place between '${prev.title}' and '${next.title}'` : `Place after '${prev.title}'` : `Place before '${next.title}'`;

  div.addEventListener('dragover', event => {
    event.preventDefault();
    event.currentTarget.classList.toggle('hover', true);
  });

  div.addEventListener('dragexit', event => {
    event.currentTarget.classList.toggle('hover', false);
  });

  div.addEventListener('drop', async event => {
    event.preventDefault();
    event.currentTarget.classList.toggle('hover', false);

    const { id } = JSON.parse(event.dataTransfer.getData('indexed-db'));
    if (prev) {
      if (next) {
        const prevOrder = prev.order ?? prev.id;
        const nextOrder = next.order ?? next.id;
        await upsertEntry('items', { id, order: (prevOrder + nextOrder) / 2 });
      }
      else {
        await upsertEntry('items', { id, order: (prev.order ?? prev.id) + 1 });
      }
    }
    else {
      if (next) {
        await upsertEntry('items', { id, order: (next.order ?? next.id) - 1 });
      }
      else {
        throw new Error('Must have either prev or next!');
      }
    }

    await renderItems();
  });

  return div;
}
