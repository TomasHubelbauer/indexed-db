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

      await recordItem(database, 'items', { title: input.value });
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
    const itemsDiv = document.querySelector('#itemsDiv');
    itemsDiv.innerHTML = '';

    for (const item of items) {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'itemDiv';

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

async function openDatabase() {
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

async function listItems(/** @type {IDBDatabase} */ database, /** @type {string} */ store) {
  return new Promise((resolve, reject) => {
    const request = database.transaction([store]).objectStore(store).getAll();
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject('A getAll error occured.'));
  });
}

async function recordItem(/** @type {IDBDatabase} */ database, /** @type {string} */ store, /** @type {object} */ item) {
  return new Promise((resolve, reject) => {
    const request = database.transaction([store], 'readwrite').objectStore(store).add(item, item.id);
    request.addEventListener('success', resolve);
    request.addEventListener('error', () => reject('A transaction error occured.'));
  });
}

async function removeItem(/** @type {IDBDatabase} */ database, /** @type {string} */ store, /** @type {string | number} */ key) {
  return new Promise((resolve, reject) => {
    const request = database.transaction([store], 'readwrite').objectStore(store).delete(key);
    request.addEventListener('success', resolve);
    request.addEventListener('error', () => reject('A transaction error occured.'));
  });
}

async function updateItem(/** @type {IDBDatabase} */ database, /** @type {string} */ store, /** @type {object} */ item) {
  return new Promise((resolve, reject) => {
    const request = database.transaction([store], 'readwrite').objectStore(store).put(item);
    request.addEventListener('success', resolve);
    request.addEventListener('error', () => reject('A transaction error occured.'));
  });
}
