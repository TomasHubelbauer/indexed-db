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

      const id = await recordItem(database, 'items', { title: input.value });
      const items = await listItems(database, 'items');

      // Place item at the top
      if (items.length > 0) {
        items.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
        const item = await obtainItem(database, 'items', id);
        item.order = (items[0].order ?? items[0].id) - 1;
        await updateItem(database, 'items', item);
      }

      input.value = '';
      await renderItems(database);
    })

    await renderItems(database);
  }
  catch (error) {
    alert(error);
    throw error;
  }

  async function renderItems(/** @type {IDBDatabase} */ database) {
    const items = await listItems(database, 'items');
    items.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
    const itemsDiv = document.querySelector('#itemsDiv');
    itemsDiv.innerHTML = '';

    for (const item of items) {
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
      });

      // Note that this event must be handled even if only to prevent default
      itemDiv.addEventListener('dragover', event => event.preventDefault());

      itemDiv.addEventListener('drop', async event => {
        event.preventDefault();

        const order = Number(event.currentTarget.dataset.order);
        const { id, order: otherOrder } = JSON.parse(event.dataTransfer.getData('indexed-db'));

        const otherItem = await obtainItem(database, 'items', id);
        item.order = otherOrder;
        otherItem.order = order;
        await updateItem(database, 'items', item);
        await updateItem(database, 'items', otherItem);
        await renderItems(database);
      });

      const span = document.createElement('span');
      span.className = 'titleSpan';
      span.textContent = item.title;
      span.addEventListener('click', async () => {
        const title = prompt('Title:', item.title);
        if (!title) {
          return;
        }

        item.title = title;
        await updateItem(database, 'items', item);
        await renderItems(database);
      });

      const button = document.createElement('button');
      button.textContent = '❌';
      button.addEventListener('click', async () => {
        if (!confirm(`Delete ${item.title}?`)) {
          return;
        }

        await removeItem(database, 'items', item.id);
        await renderItems(database);
      });

      itemDiv.append(span, button);
      itemsDiv.append(itemDiv);
    }
  }
});

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
