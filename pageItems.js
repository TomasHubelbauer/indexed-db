import connectDatabase from './connectDatabase.js';

/** @returns {Promise<{ id: number; title: string; order?: number; blob?: Blob; tags?: string[]; done?: boolean; }[]>} */
export default async function pageItems() {
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
