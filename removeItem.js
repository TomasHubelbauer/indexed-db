import connectDatabase from './connectDatabase.js';

export default function removeItem(/** @type {number} */ id) {
  return new Promise(async (resolve, reject) => {
    const database = await connectDatabase();
    const request = database.transaction(['items'], 'readwrite').objectStore('items').delete(id);
    request.addEventListener('success', resolve);
    request.addEventListener('error', () => reject('A transaction error occured.'));
    database.close();
  });
}
