import connectDatabase from './connectDatabase.js';

export default async function upsertEntry(/** @type {string} */ store, /** @type {object} */ entry) {
  if (entry.id) {
    const originalEntry = await getEntry(store, entry.id);
    for (const key in entry) {
      const value = entry[key];
      originalEntry[key] = value;
    }

    return await putEntry(store, originalEntry);
  }

  return new Promise(async (resolve, reject) => {
    const database = await connectDatabase();
    const request = database.transaction([store], 'readwrite').objectStore(store).add(entry, entry.id);
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject('A transaction error occured.'));
    database.close();
  });
}

function getEntry(/** @type {string} */ store, /** @type {number} */ id) {
  return new Promise(async (resolve, reject) => {
    const database = await connectDatabase();
    const request = database.transaction([store], 'readwrite').objectStore(store).get(id);
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject('A transaction error occured.'));
    database.close();
  });
}

function putEntry(/** @type {string} */ store, /** @type {object} */ entry) {
  return new Promise(async (resolve, reject) => {
    const database = await connectDatabase();
    const request = database.transaction([store], 'readwrite').objectStore(store).put(entry);
    request.addEventListener('success', resolve);
    request.addEventListener('error', () => reject('A transaction error occured.'));
    database.close();
  });
}
