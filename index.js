import renderItem from './renderItem.js';

const filters = {};
let done = false;

window.addEventListener('load', async () => {
  document.body.classList.toggle(location.protocol.slice(0, -1));

  if (!window.indexedDB) {
    alert('IndexedDB is not supported.');
    return;
  }

  try {
    /** @type {IDBDatabase} */
    const database = await openDatabase();

    const input = document.querySelector('#editorInput');

    // Use `keyup` as `keypress` does not get fired for the Escape key
    input.addEventListener('keyup', async event => {
      if (event.key === 'Escape') {
        input.value = '';
        return;
      }

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
    let stamp;

    const recordAudioButton = document.querySelector('#recordAudioButton');
    recordAudioButton.addEventListener('click', async () => {
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

        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });

        // Note that `||` is used to coerce empty string as well (over `??`)
        await prependItem(database, { title: input.value || 'Transcribe audio memo', blob, duration: window.performance.now() - stamp });
        input.value = '';
        mediaRecorder = undefined;
        recordAudioButton.classList.toggle('on-air', false);
        recordVideoButton.classList.toggle('hidden', false);
        recordScreenButton.classList.toggle('hidden', false);
      });

      stamp = window.performance.now();
      mediaRecorder.start();
      recordAudioButton.classList.toggle('on-air', true);
      recordVideoButton.classList.toggle('hidden', true);
      recordScreenButton.classList.toggle('hidden', true);
    });

    const recordVideoButton = document.querySelector('#recordVideoButton');
    recordVideoButton.addEventListener('click', async () => {
      if (mediaRecorder) {
        mediaRecorder.stop();
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });

      const video = document.createElement('video');
      video.srcObject = mediaStream;
      video.muted = true;
      video.controls = true;
      await video.play();
      document.querySelector('#memoDiv').append(video);

      /** @type {Blob[]} */
      const chunks = [];

      mediaRecorder.addEventListener('dataavailable', event => chunks.push(event.data));

      mediaRecorder.addEventListener('stop', async () => {
        // Stop all tracks to release user media and hide browser media indicators
        mediaStream.getTracks().forEach(track => track.stop())

        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });

        // Note that `||` is used to coerce empty string as well (over `??`)
        await prependItem(database, { title: input.value || 'Transcribe video memo', blob, duration: window.performance.now() - stamp });
        input.value = '';
        mediaRecorder = undefined;
        video.remove();
        recordVideoButton.classList.toggle('on-air', false);
        recordAudioButton.classList.toggle('hidden', false);
        recordScreenButton.classList.toggle('hidden', false);
      });

      stamp = window.performance.now();
      mediaRecorder.start();
      recordVideoButton.classList.toggle('on-air', true);
      recordAudioButton.classList.toggle('hidden', true);
      recordScreenButton.classList.toggle('hidden', true);
    });

    const recordScreenButton = document.querySelector('#recordScreenButton');
    recordScreenButton.addEventListener('click', async () => {
      if (mediaRecorder) {
        mediaRecorder.stop();
        return;
      }

      const mediaStream = await navigator.mediaDevices.getDisplayMedia();
      mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });

      // Record audio separately: https://bugzilla.mozilla.org/show_bug.cgi?id=1541425
      const mediaStream2 = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.addTrack(mediaStream2.getAudioTracks()[0]);

      /** @type {Blob[]} */
      const chunks = [];

      mediaRecorder.addEventListener('dataavailable', event => chunks.push(event.data));

      mediaRecorder.addEventListener('stop', async () => {
        // Stop all tracks to release user media and hide browser media indicators
        mediaStream.getTracks().forEach(track => track.stop())

        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });

        // Note that `||` is used to coerce empty string as well (over `??`)
        await prependItem(database, { title: input.value || 'Transcribe screen memo', blob, duration: window.performance.now() - stamp });
        input.value = '';
        mediaRecorder = undefined;
        recordScreenButton.classList.toggle('on-air', false);
        recordAudioButton.classList.toggle('hidden', false);
        recordVideoButton.classList.toggle('hidden', false);
      });

      stamp = window.performance.now();
      mediaRecorder.start();
      recordScreenButton.classList.toggle('on-air', true);
      recordAudioButton.classList.toggle('hidden', true);
      recordVideoButton.classList.toggle('hidden', true);
    });

    const attachFileButton = document.querySelector('#attachFileButton');
    attachFileButton.addEventListener('click', () => {
      const attacchmentInput = document.createElement('input');
      attacchmentInput.type = 'file';
      attacchmentInput.click();
      attacchmentInput.addEventListener('change', async () => {
        if (attacchmentInput.files.length > 1) {
          alert('Only one file can be added at a time!');
          return;
        }

        if (attacchmentInput.files.length === 0) {
          return;
        }

        // Note that `||` is used to coerce empty string as well (over `??`)
        await prependItem(database, { title: input.value || 'Process ' + attacchmentInput.files[0].name, blob: attacchmentInput.files[0] });
        input.value = '';
      });
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

    const tagsDiv = document.querySelector('#tagsDiv');
    tagsDiv.innerHTML = '';
    const tags = items.reduce((tags, item) => { item.tags?.forEach(tag => tags.add(tag)); return tags; }, new Set());
    for (const tag of tags) {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = tag + 'Input';
      input.checked = filters[tag] ?? true;

      input.addEventListener('change', async () => {
        filters[tag] = input.checked;
        await renderItems(database);
      });

      const label = document.createElement('label');
      label.htmlFor = tag + 'Input';
      label.textContent = tag;

      tagsDiv.append(input, label, ' ');
    }

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = 'doneInput';
    input.checked = done;

    input.addEventListener('change', async () => {
      done = input.checked;
      await renderItems(database);
    });

    const label = document.createElement('label');
    label.htmlFor = 'doneInput';
    label.textContent = 'Include done';

    tagsDiv.append(' | ', input, label, ' ');


    const itemsDiv = document.querySelector('#itemsDiv');
    itemsDiv.innerHTML = '';

    const filter = Object.keys(filters).length > 0;
    const filteredItems = items.filter(item => (item.done !== true || done) && (!filter || item.tags?.some(tag => filters[tag] ?? true)));

    function onDragStart() {
      // Mark the list as drag-and-drop occuring to show in-between drop zones
      itemsDiv.classList.toggle('dnd', true);
    }

    function onDragEnd() {
      itemsDiv.classList.toggle('dnd', false);
    }

    async function swapOrder(/** @type {number} */ id, /** @type {number} */ order, /** @type {number} */ otherId, /** @type {number} */ otherOrder) {
      const item = await obtainItem(database, 'items', id);
      item.order = order;
      await updateItem(database, 'items', item);

      const otherItem = await obtainItem(database, 'items', otherId);
      otherItem.order = otherOrder;
      await updateItem(database, 'items', otherItem);

      await renderItems(database);
    }

    async function toggleDone(/** @type {number} */ id, /** @type {boolean} */ done) {
      const item = await obtainItem(database, 'items', id);
      item.done = done;
      await updateItem(database, 'items', item);
      await renderItems(database);
    }

    async function rename(/** @type {number} */ id, /** @type {string} */ title) {
      const item = await obtainItem(database, 'items', id);
      item.title = title;
      await updateItem(database, 'items', item);
      await renderItems(database);
    }

    async function tag(/** @type {number} */ id, /** @type {string[]} */ tags) {
      const item = await obtainItem(database, 'items', id);
      item.tags = tags;
      await updateItem(database, 'items', item);
      await renderItems(database);
    }

    async function erase(/** @type {number} */ id) {
      await removeItem(database, 'items', id);
      await renderItems(database);
    }

    let _item;
    for (const item of filteredItems) {
      itemsDiv.append(renderDropZone(database, _item, item));
      itemsDiv.append(renderItem(item, onDragStart, onDragEnd, swapOrder, toggleDone, extractTags, rename, tag, erase));
      _item = item;
    }

    if (filteredItems.length > 0) {
      itemsDiv.append(renderDropZone(database, _item));
    }
  }

  function extractTags(/** @type {string} */ title, /** @type {string[]} */ tags = []) {
    title = title.trim();
    const regex = /(^| )((?<tag>[-+][\w\p{Emoji}-]+)( |$))+$/u;
    const match = regex.exec(title);
    if (match) {
      const modifiers = title.slice(match.index).trim().split(/ /g);
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

      tags.sort();
    }

    return { title, tags };
  }

  function humanizeBytes(/** @type {number} */ bytes) {
    let order = 0;
    while (bytes > 1000) {
      order++;
      bytes /= 1000;
    }

    const span = document.createElement('span');
    span.textContent = bytes.toFixed(2) + ' ' + ['B', 'kB', 'MB', 'GB'][order];
    span.style.color = 'gray';
    return span;
  }

  function humanizeMilliseconds(/** @type {number} */ milliseconds) {
    milliseconds /= 1000;
    const seconds = ~~(milliseconds % 60);
    milliseconds /= 60;
    const minutes = ~~(milliseconds % 60);
    milliseconds /= 60;
    const hours = ~~(milliseconds % 24);

    const span = document.createElement('span');

    if (hours) {
      span.textContent += hours.toString().padStart(2, '0') + ':';
    }

    span.textContent += minutes.toString().padStart(2, '0') + ':';
    span.textContent += seconds.toString().padStart(2, '0');
    span.style.color = 'gray';
    return span;
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

/** @returns {Promise<{ id: number; title: string; order?: number; blob?: Blob; tags?: string[]; done?: boolean; }[]>} */
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
