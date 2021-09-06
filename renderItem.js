import extractTags from './extractTags.js';
import humanizeBytes from './humanizeBytes.js';
import humanizeMilliseconds from './humanizeMilliseconds.js';
import removeItem from './removeItem.js';
import upsertEntry from './upsertEntry.js';
import parseLinks from './parseLinks.js';

export default function renderItem(
  /** @type {{ id: number; title: string; order?: number; done?: boolean; tags?: string[]; blob?: Blob | File; duration?: number; detail?: string; }} */ item,
  onDragStart,
  onDragEnd,
  renderItems
) {
  const itemDiv = document.createElement('div');
  itemDiv.className = 'itemDiv';
  itemDiv.draggable = true;
  itemDiv.dataset.id = item.id;
  itemDiv.dataset.order = item.order ?? item.id;

  itemDiv.addEventListener('contextmenu', async event => {
    event.preventDefault();

    const detail = prompt('Detail:', item.detail);
    if (!detail) {
      return;
    }

    await upsertEntry('items', { id: item.id, detail });
    await renderItems();
  });

  itemDiv.addEventListener('dragstart', event => {
    // Copy the ID in as text so that dragging it to an input shows its ID
    event.dataTransfer.setData('text/plain', item.id);

    // Copy the ID in an application-specific way to not get fakes in drop
    event.dataTransfer.setData('indexed-db', JSON.stringify({ id: item.id, order: item.order ?? item.id }));

    // Mark the list as drag-and-drop occuring to show in-between drop zones
    onDragStart();
  });

  itemDiv.addEventListener('dragend', onDragEnd);

  itemDiv.addEventListener('dragover', event => {
    event.preventDefault();

    const { id } = JSON.parse(event.dataTransfer.getData('indexed-db'));
    event.currentTarget.classList.toggle('hover', id !== item.id);
  });

  itemDiv.addEventListener('dragexit', event => {
    event.currentTarget.classList.toggle('hover', false);
  });

  itemDiv.addEventListener('drop', async event => {
    event.preventDefault();

    const order = Number(event.currentTarget.dataset.order);
    const { id, order: otherOrder } = JSON.parse(event.dataTransfer.getData('indexed-db'));
    if (id === item.id) {
      return;
    }

    await upsertEntry('items', { id: item.id, order: otherOrder });
    await upsertEntry('items', { id, order });
    await renderItems();
  });

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = item.done;
  input.addEventListener('change', async () => {
    await upsertEntry('items', { id: item.id, done: input.checked });
    await renderItems();
  });

  itemDiv.append(input);

  if (item.tags) {
    for (const tag of item.tags) {
      const span = document.createElement('span');
      span.className = 'tagSpan';
      span.textContent = tag;
      itemDiv.append(span);
    }
  }

  const span = document.createElement('span');
  span.className = 'titleSpan';
  span.append(...parseLinks(item.title));

  span.addEventListener('click', async () => {
    const str = prompt('Title:', item.title);
    if (!str) {
      return;
    }

    const { title, tags } = extractTags(str, item.tags ?? []);

    // Preserve title if just modifying tags (`+tag`)
    if (title) {
      await upsertEntry('items', { id: item.id, title });
    }

    await upsertEntry('items', { id: item.id, tags });
    await renderItems();
  });

  itemDiv.append(span);

  if (item.blob) {
    switch (item.blob.type) {
      case 'audio/webm': {
        const button = document.createElement('button');
        button.textContent = '🔈';
        button.addEventListener('click', async event => {
          // Prevent the rename operation
          event.preventDefault();

          const audio = document.createElement('audio');
          audio.src = URL.createObjectURL(item.blob);
          await audio.play();
          audio.addEventListener('ended', () => {
            URL.revokeObjectURL(audio.src);
            audio.remove();
          });
        });

        button.append(' ', humanizeMilliseconds(item.duration));
        itemDiv.append(button);
        break;
      }
      case 'video/webm': {
        const button = document.createElement('button');
        button.textContent = '📺';
        button.addEventListener('click', async event => {
          // Prevent the rename operation
          event.preventDefault();

          const video = document.createElement('video');
          video.src = URL.createObjectURL(item.blob);
          video.controls = true;
          document.body.append(video);
          await video.requestFullscreen();
          await video.play();
          video.addEventListener('ended', async () => {
            await document.exitFullscreen();
            URL.revokeObjectURL(video.src);
            video.remove();
          });
        });

        button.append(' ', humanizeMilliseconds(item.duration));
        itemDiv.append(button);
        break;
      }
      case 'image/jpg':
      case 'image/png': {
        const button = document.createElement('button');
        button.textContent = '🖼 ' + item.blob.name;
        button.addEventListener('click', async event => {
          // Prevent the rename operation
          event.preventDefault();

          const url = URL.createObjectURL(item.blob);
          const img = document.createElement('img');
          img.src = url;
          img.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement === null) {
              URL.revokeObjectURL(url);
              img.remove();
            }
          });

          document.body.append(img);
          await img.requestFullscreen();
        });

        button.append(' ', humanizeBytes(item.blob.size));

        const url = URL.createObjectURL(item.blob);
        const img = document.createElement('img');
        img.src = url;
        img.addEventListener('load', () => {
          URL.revokeObjectURL(url);

          const span = document.createElement('span');
          span.textContent = img.naturalWidth + '×' + img.naturalHeight + ' px';
          span.style.color = 'gray';

          button.append(' ', span);
        });

        itemDiv.append(button);
        break;
      }
      default: {
        const button = document.createElement('button');
        button.textContent = '📋 ' + item.blob.name;
        button.addEventListener('click', async event => {
          // Prevent the rename operation
          event.preventDefault();

          const url = URL.createObjectURL(item.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = item.blob.name;
          a.click();
        });

        button.append(' ', humanizeBytes(item.blob.size));
        itemDiv.append(button);
      }
    }
  }

  const button = document.createElement('button');
  button.className = 'deleteButton';
  button.textContent = '❌';
  button.addEventListener('click', async () => {
    if (!confirm(`Delete ${item.title}?`)) {
      return;
    }

    await removeItem(item.id);
    await renderItems();
  });

  itemDiv.append(button);
  return itemDiv;
}
