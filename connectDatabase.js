/** @returns {Promise<IDBDatabase>} */
export default function connectDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('indexed-db');
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject('An open error occured.'));
    request.addEventListener('blocked', () => reject('A blocked error occured.'));
    request.addEventListener('upgradeneeded', () => {
      request.result.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
    });
  });
}
