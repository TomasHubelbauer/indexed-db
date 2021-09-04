import renderItem from './renderItem.js';
import connectDatabase from './connectDatabase.js';
import renderDropZone from './renderDropZone.js';
import pageItems from './pageItems.js';
import createItem from './createItem.js';

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

      await createItem({ title: input.value });
      await renderItems();
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
        await createItem({ title: input.value || 'Transcribe audio memo', blob, duration: window.performance.now() - stamp });
        await renderItems();
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
        await createItem({ title: input.value || 'Transcribe video memo', blob, duration: window.performance.now() - stamp });
        await renderItems();
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
        await createItem({ title: input.value || 'Transcribe screen memo', blob, duration: window.performance.now() - stamp });
        await renderItems();
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
        await createItem({ title: input.value || 'Process ' + attacchmentInput.files[0].name, blob: attacchmentInput.files[0] });
        await renderItems();
        input.value = '';
      });
    });

    await renderItems();
  }
  catch (error) {
    alert(error);
    throw error;
  }

  async function renderItems() {
    const items = await pageItems();

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

    let _item;
    for (const item of filteredItems) {
      itemsDiv.append(renderDropZone(_item, item));
      itemsDiv.append(renderItem(item, onDragStart, onDragEnd, renderItems));
      _item = item;
    }

    if (filteredItems.length > 0) {
      itemsDiv.append(renderDropZone(_item));
    }
  }
});
