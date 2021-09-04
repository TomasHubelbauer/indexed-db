import extractTags from './extractTags.js';
import pageItems from './pageItems.js';
import upsertEntry from './upsertEntry.js';

export default async function createItem(/** @type {{ title: string; blob?: Blob; tags?: string[]; }} */ item) {
  const { title, tags } = extractTags(item.title);
  item.title = title;
  item.tags = tags;

  const id = await upsertEntry('items', item);
  const items = await pageItems();

  // Place item at the top
  if (items.length > 0) {
    await upsertEntry('items', { id, order: (items[0].order ?? items[0].id) - 1 });
  }
}
