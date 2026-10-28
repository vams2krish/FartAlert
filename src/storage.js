const db = new Promise((resolve,reject) => { const req = indexedDB.open('fart-alert',1); req.onupgradeneeded = () => req.result.createObjectStore('sounds',{keyPath:'id'}); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
export async function soundsStore(action, value) {
  const database = await db;
  return new Promise((resolve,reject) => { const tx = database.transaction('sounds',action === 'getAll' ? 'readonly' : 'readwrite'); const req = tx.objectStore('sounds')[action](...(value === undefined ? [] : [value])); tx.oncomplete = () => resolve(req.result); tx.onerror = () => reject(tx.error); });
}
