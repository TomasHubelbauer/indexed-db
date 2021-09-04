import connectDatabase from './connectDatabase.js';

export default function listStore(/** @type {string} */ name) {
  return new Promise(async (resolve, reject) => {
    const database = await connectDatabase();
    const request = database.transaction([name]).objectStore(name).getAll();
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject('A getAll error occured.'));
    database.close();
  });
}
