import connectDatabase from './connectDatabase.js';
import extractTags from './extractTags.js';
import pageItems from './pageItems.js';
import patchItem from './patchItem.js';

export default async function createItem(/** @type {{ title: string; blob?: Blob; tags?: string[]; }} */ item) {
  const { title, tags } = extractTags(item.title);
  item.title = title;
  item.tags = tags;

  const id = await recordItem(item);
  const items = await pageItems();

  // Place item at the top
  if (items.length > 0) {
    await patchItem(id, item => item.order = (items[0].order ?? items[0].id) - 1);
  }
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
