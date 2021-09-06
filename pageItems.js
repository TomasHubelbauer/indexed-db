import listStore from './listStore.js';

/** @returns {Promise<{ id: number; title: string; order?: number; blob?: Blob; tags?: string[]; done?: boolean; detail?: string; }[]>} */
export default async function pageItems() {
  const items = await listStore('items');
  return items.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
}
