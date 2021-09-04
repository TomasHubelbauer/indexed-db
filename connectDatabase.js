/** @returns {Promise<IDBDatabase>} */
export default function connectDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('indexed-db', 3);
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject('An open error occured.'));
    request.addEventListener('blocked', () => reject('A blocked error occured.'));
    request.addEventListener('upgradeneeded', event => {
      if (event.oldVersion < 1) {
        request.result.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
      }

      if (event.oldVersion < 2) {
        request.result.createObjectStore('dailies', { keyPath: 'id', autoIncrement: true });
      }

      if (event.oldVersion < 3) {
        request.result.createObjectStore('weeklies', { keyPath: 'id', autoIncrement: true });
      }
    });
  });
}
