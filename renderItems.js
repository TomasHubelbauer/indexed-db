import pageItems from './pageItems.js';
import renderDropZone from './renderDropZone.js';
import renderItem from './renderItem.js';


export default async function renderItems() {
  const filters = localStorage.filters ? JSON.parse(localStorage.filters) : {};
  const done = localStorage.done !== undefined ? JSON.parse(localStorage.done) : false;

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
      localStorage.filters = JSON.stringify(filters);
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
    localStorage.done = JSON.stringify(input.checked);
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
    if (item.detail) {
      const div = document.createElement('div');
      div.className = 'detailDiv';
      div.textContent = item.detail;
      itemsDiv.append(div);
    }

    _item = item;
  }

  if (filteredItems.length > 0) {
    itemsDiv.append(renderDropZone(_item));
  }
}
