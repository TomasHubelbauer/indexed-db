window.addEventListener('load', async () => {
  document.body.classList.toggle(location.protocol.slice(0, -1));

  if (!window.indexedDB) {
    alert('IndexedDB is not supported.');
    return;
  }

  try {
    /** @type {IDBDatabase} */
    const database = await openDatabase();

    const input = document.querySelector('input');
    input.addEventListener('keypress', async event => {
      if (event.key !== 'Enter' || !input.value) {
        return;
      }

      await prependItem(database, { title: input.value });
      input.value = '';
    });

    // Keep the input focused
    document.addEventListener('visibilitychange', () => input.focus());
    input.focus();

    let mediaRecorder;

    const recordButton = document.querySelector('#recordButton');
    recordButton.addEventListener('click', async () => {
      if (mediaRecorder) {
        mediaRecorder.stop();
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });

      /** @type {Blob[]} */
      const chunks = [];

      mediaRecorder.addEventListener('dataavailable', event => chunks.push(event.data));

      mediaRecorder.addEventListener('stop', async () => {
        // Stop all tracks to release user media and hide browser media indicators
        mediaStream.getTracks().forEach(track => track.stop())

        const blob = new Blob(chunks);

        // Note that `||` is used to coerce empty string as well (over `??`)
        await prependItem(database, { title: input.value || 'Transcribe note', blob });
        input.value = '';
        mediaRecorder = undefined;
      });

      mediaRecorder.start();
    });

    await renderItems(database);
  }
  catch (error) {
    alert(error);
    throw error;
  }

  function renderDropZone(database, /** @type {{ id: number; order: number; title: string; }} */ prev, /** @type {{ id: number; order: number; title: string; }} */ next) {
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

      if (prev) {
        if (next) {
          const prevOrder = prev.order ?? prev.id;
          const nextOrder = next.order ?? next.id;
          const { id } = JSON.parse(event.dataTransfer.getData('indexed-db'));
          const item = await obtainItem(database, 'items', id);
          item.order = (prevOrder + nextOrder) / 2;
          await updateItem(database, 'items', item);
        }
        else {
          const { id } = JSON.parse(event.dataTransfer.getData('indexed-db'));
          const item = await obtainItem(database, 'items', id);
          item.order = (prev.order ?? prev.id) + 1;
          await updateItem(database, 'items', item);
        }
      }
      else {
        if (next) {
          const { id } = JSON.parse(event.dataTransfer.getData('indexed-db'));
          const item = await obtainItem(database, 'items', id);
          item.order = (next.order ?? next.id) - 1;
          await updateItem(database, 'items', item);
        }
        else {
          throw new Error('Must have either prev or next!');
        }
      }

      await renderItems(database);
    });

    return div;
  }

  async function renderItems(/** @type {IDBDatabase} */ database) {
    const items = await getSortedItems(database);
    const itemsDiv = document.querySelector('#itemsDiv');
    itemsDiv.innerHTML = '';

    let _item;
    for (const item of items) {
      itemsDiv.append(renderDropZone(database, _item, item));

      const itemDiv = document.createElement('div');
      itemDiv.className = 'itemDiv';
      itemDiv.draggable = true;
      itemDiv.dataset.id = item.id;
      itemDiv.dataset.order = item.order ?? item.id;

      itemDiv.addEventListener('dragstart', event => {
        // Copy the ID in as text so that dragging it to an input shows its ID
        event.dataTransfer.setData('text/plain', item.id);

        // Copy the ID in an application-specific way to not get fakes in drop
        event.dataTransfer.setData('indexed-db', JSON.stringify({ id: item.id, order: item.order ?? item.id }));

        // Mark the list as drag-and-drop occuring to show in-between drop zones
        itemsDiv.classList.toggle('dnd', true);
      });

      itemDiv.addEventListener('dragend', () => itemsDiv.classList.toggle('dnd', false));

      // Note that this event must be handled even if only to prevent default
      itemDiv.addEventListener('dragover', event => event.preventDefault());

      itemDiv.addEventListener('drop', async event => {
        event.preventDefault();

        const order = Number(event.currentTarget.dataset.order);
        const { id, order: otherOrder } = JSON.parse(event.dataTransfer.getData('indexed-db'));

        const otherItem = await obtainItem(database, 'items', id);
        if (otherItem.id === id) {
          return;
        }

        item.order = otherOrder;
        otherItem.order = order;
        await updateItem(database, 'items', item);
        await updateItem(database, 'items', otherItem);
        await renderItems(database);
      });

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

      const regex = /https?:\/\/([\w-]+.)[\w-]+.[\w-]+(\/[\w-]+)+([\?\#][\w-]+)?/g;
      let match;
      let index = 0;
      while (match = regex.exec(item.title)) {
        span.append(item.title.slice(index, match.index));

        const a = document.createElement('a');
        a.textContent = match[0].replace(/https?:\/\/(www.)?/, ''); // Strip https?:// and www.
        a.href = match[0];
        a.target = '_blank';
        span.append(a);

        // Stop the click action from triggering the rename operation
        a.addEventListener('click', event => event.stopPropagation());

        index = match.index + match[0].length;
      }

      if (index < item.title.length) {
        span.append(item.title.slice(index));
      }

      span.addEventListener('click', async () => {
        const str = prompt('Title:', item.title);
        if (!str) {
          return;
        }

        const { title, tags } = extractTags(str, item.tags ?? []);
        item.title = title;
        item.tags = tags;
        await updateItem(database, 'items', item);
        await renderItems(database);
      });

      itemDiv.append(span);

      if (item.blob) {
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

        itemDiv.append(button);
      }

      const button = document.createElement('button');
      button.textContent = '❌';
      button.addEventListener('click', async () => {
        if (!confirm(`Delete ${item.title}?`)) {
          return;
        }

        await removeItem(database, 'items', item.id);
        await renderItems(database);
      });

      itemDiv.append(button);
      itemsDiv.append(itemDiv);
      _item = item;
    }

    itemsDiv.append(renderDropZone(database, _item));
  }

  function extractTags(/** @type {string} */ title, /** @type {string[]} */ tags = []) {
    title = title.trim();
    const regex = /((?<tag>[-+][\w-]+)( |$))+$/;
    const match = regex.exec(title);
    if (match) {
      const modifiers = title.slice(match.index).split(/ /g);
      title = title.slice(0, -match[0].length).trim();
      for (const modifier of modifiers) {
        const tag = modifier.slice('±'.length);
        switch (modifier[0]) {
          case '+': {
            tags.push(tag);
            break;
          }
          case '-': {
            tags = tags.filter(t => t !== tag);
            break;
          }
          default: {
            throw new Error('Tag modifier must start with + or -.');
          }
        }
      }
    }

    return { title, tags };
  }

  async function prependItem(/** @type {IDBDatabase} */ database, /** @type {{ title: string; blob?: Blob; tags?: string[]; }} */ item) {
    const { title, tags } = extractTags(item.title);
    item.title = title;
    item.tags = tags;

    const id = await recordItem(database, 'items', item);
    const items = await getSortedItems(database);

    // Place item at the top
    if (items.length > 0) {
      const item = await obtainItem(database, 'items', id);
      item.order = (items[0].order ?? items[0].id) - 1;
      await updateItem(database, 'items', item);
    }

    await renderItems(database);
  }
});

async function getSortedItems(/** @type {IDBDatabase} */ database) {
  const items = await listItems(database, 'items');
  return items.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('indexed-db');
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject('An open error occured.'));
    request.addEventListener('blocked', () => reject('A blocked error occured.'));

    request.addEventListener('upgradeneeded', () => {
      request.result.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
    });
  });
}

function listItems(/** @type {IDBDatabase} */ database, /** @type {string} */ store) {
  return new Promise((resolve, reject) => {
    const request = database.transaction([store]).objectStore(store).getAll();
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject('A getAll error occured.'));
  });
}

function recordItem(/** @type {IDBDatabase} */ database, /** @type {string} */ store, /** @type {object} */ item) {
  return new Promise((resolve, reject) => {
    const request = database.transaction([store], 'readwrite').objectStore(store).add(item, item.id);
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject('A transaction error occured.'));
  });
}

function removeItem(/** @type {IDBDatabase} */ database, /** @type {string} */ store, /** @type {string | number} */ key) {
  return new Promise((resolve, reject) => {
    const request = database.transaction([store], 'readwrite').objectStore(store).delete(key);
    request.addEventListener('success', resolve);
    request.addEventListener('error', () => reject('A transaction error occured.'));
  });
}

function obtainItem(/** @type {IDBDatabase} */ database, /** @type {string} */ store, /** @type {string | number} */ key) {
  return new Promise((resolve, reject) => {
    const request = database.transaction([store], 'readwrite').objectStore(store).get(key);
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject('A transaction error occured.'));
  });
}

function updateItem(/** @type {IDBDatabase} */ database, /** @type {string} */ store, /** @type {object} */ item) {
  return new Promise((resolve, reject) => {
    const request = database.transaction([store], 'readwrite').objectStore(store).put(item);
    request.addEventListener('success', resolve);
    request.addEventListener('error', () => reject('A transaction error occured.'));
  });
}
