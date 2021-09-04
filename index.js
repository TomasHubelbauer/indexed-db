import renderItem from './renderItem.js';
import extractTags from './extractTags.js';
import connectDatabase from './connectDatabase.js';

const filters = {};
let done = false;

window.addEventListener('load', async () => {
  document.body.classList.toggle(location.protocol.slice(0, -1));

  if (!window.indexedDB) {
    alert('IndexedDB is not supported.');
    return;
  }

  try {
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

      await prependItem({ title: input.value });
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
        await prependItem({ title: input.value || 'Transcribe audio memo', blob, duration: window.performance.now() - stamp });
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
        await prependItem({ title: input.value || 'Transcribe video memo', blob, duration: window.performance.now() - stamp });
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
        await prependItem({ title: input.value || 'Transcribe screen memo', blob, duration: window.performance.now() - stamp });
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
        await prependItem({ title: input.value || 'Process ' + attacchmentInput.files[0].name, blob: attacchmentInput.files[0] });
        input.value = '';
      });
    });

    await renderItems();
  }
  catch (error) {
    alert(error);
    throw error;
  }

  function renderDropZone(/** @type {{ id: number; order: number; title: string; }} */ prev, /** @type {{ id: number; order: number; title: string; }} */ next) {
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
          const item = await obtainItem(id);
          item.order = (prevOrder + nextOrder) / 2;
          await updateItem(item);
        }
        else {
          const { id } = JSON.parse(event.dataTransfer.getData('indexed-db'));
          const item = await obtainItem(id);
          item.order = (prev.order ?? prev.id) + 1;
          await updateItem(item);
        }
      }
      else {
        if (next) {
          const { id } = JSON.parse(event.dataTransfer.getData('indexed-db'));
          const item = await obtainItem(id);
          item.order = (next.order ?? next.id) - 1;
          await updateItem(item);
        }
        else {
          throw new Error('Must have either prev or next!');
        }
      }

      await renderItems();
    });

    return div;
  }

  async function renderItems() {
    const items = await getSortedItems();

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
        await renderItems();
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
      await renderItems();
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
      const item = await obtainItem(id);
      item.order = order;
      await updateItem(item);

      const otherItem = await obtainItem(otherId);
      otherItem.order = otherOrder;
      await updateItem(otherItem);

      await renderItems();
    }

    async function toggleDone(/** @type {number} */ id, /** @type {boolean} */ done) {
      const item = await obtainItem(id);
      item.done = done;
      await updateItem(item);
      await renderItems();
    }

    async function rename(/** @type {number} */ id, /** @type {string} */ title) {
      const item = await obtainItem(id);
      item.title = title;
      await updateItem(item);
      await renderItems();
    }

    async function tag(/** @type {number} */ id, /** @type {string[]} */ tags) {
      const item = await obtainItem(id);
      item.tags = tags;
      await updateItem(item);
      await renderItems();
    }

    async function erase(/** @type {number} */ id) {
      await removeItem(id);
      await renderItems();
    }

    let _item;
    for (const item of filteredItems) {
      itemsDiv.append(renderDropZone(_item, item));
      itemsDiv.append(renderItem(item, onDragStart, onDragEnd, swapOrder, toggleDone, rename, tag, erase));
      _item = item;
    }

    if (filteredItems.length > 0) {
      itemsDiv.append(renderDropZone(_item));
    }
  }

  async function prependItem(/** @type {{ title: string; blob?: Blob; tags?: string[]; }} */ item) {
    const { title, tags } = extractTags(item.title);
    item.title = title;
    item.tags = tags;

    const id = await recordItem(item);
    const items = await getSortedItems();

    // Place item at the top
    if (items.length > 0) {
      const item = await obtainItem(id);
      item.order = (items[0].order ?? items[0].id) - 1;
      await updateItem(item);
    }

    await renderItems();
  }
});

/** @returns {Promise<{ id: number; title: string; order?: number; blob?: Blob; tags?: string[]; done?: boolean; }[]>} */
async function getSortedItems() {
  const items = await listItems();
  return items.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
}

function listItems() {
  return new Promise(async (resolve, reject) => {
    const database = await connectDatabase();
    const request = database.transaction(['items']).objectStore('items').getAll();
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject('A getAll error occured.'));
    database.close();
  });
}

function recordItem(/** @type {object} */ item) {
  return new Promise(async (resolve, reject) => {
    const database = await connectDatabase();
    const request = database.transaction(['items'], 'readwrite').objectStore('items').add(item, item.id);
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject('A transaction error occured.'));
    database.close();
  });
}

function removeItem(/** @type {string | number} */ key) {
  return new Promise(async (resolve, reject) => {
    const database = await connectDatabase();
    const request = database.transaction(['items'], 'readwrite').objectStore('items').delete(key);
    request.addEventListener('success', resolve);
    request.addEventListener('error', () => reject('A transaction error occured.'));
    database.close();
  });
}

function obtainItem(/** @type {string | number} */ key) {
  return new Promise(async (resolve, reject) => {
    const database = await connectDatabase();
    const request = database.transaction(['items'], 'readwrite').objectStore('items').get(key);
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject('A transaction error occured.'));
    database.close();
  });
}

function updateItem(/** @type {object} */ item) {
  return new Promise(async (resolve, reject) => {
    const database = await connectDatabase();
    const request = database.transaction(['items'], 'readwrite').objectStore('items').put(item);
    request.addEventListener('success', resolve);
    request.addEventListener('error', () => reject('A transaction error occured.'));
    database.close();
  });
}
