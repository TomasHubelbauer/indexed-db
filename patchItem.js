import connectDatabase from './connectDatabase.js';

export default async function patchItem(/** @type {number} */ id, /** @type {(item: {}) => void} */ fn) {
  const item = await obtainItem(id);
  fn(item);
  await updateItem(item);
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
