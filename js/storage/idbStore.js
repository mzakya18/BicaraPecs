/* Fungsi: Menyimpan dan mengambil gambar kartu PECS menggunakan IndexedDB peramban.
   Batasan: Hanya mengelola gambar kartu berdasarkan ID kartu, bukan data teks atau pengaturan. */

const DB_NAME = 'BicaraPecsMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'cardImages';

let dbPromise = null;

function openCardImageDb() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
            reject(new Error('IndexedDB tidak didukung pada peramban ini.'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            dbPromise = null;
            reject(request.error || new Error('Gagal membuka IndexedDB.'));
        };
    });

    return dbPromise;
}

export async function saveCardImageToIdb(cardId, imageDataUrl) {
    const db = await openCardImageDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ id: cardId, imageDataUrl });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error || new Error('Gagal menyimpan gambar ke IndexedDB.'));
    });
}

export async function getCardImageFromIdb(cardId) {
    const db = await openCardImageDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(cardId);

        req.onsuccess = () => {
            resolve(req.result ? req.result.imageDataUrl : null);
        };
        req.onerror = () => reject(req.error || new Error('Gagal membaca gambar dari IndexedDB.'));
    });
}

export async function getAllCardImagesFromIdb() {
    const db = await openCardImageDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
            const map = {};
            const rows = Array.isArray(req.result) ? req.result : [];
            rows.forEach((row) => {
                if (row && row.id && row.imageDataUrl) {
                    map[row.id] = row.imageDataUrl;
                }
            });
            resolve(map);
        };
        req.onerror = () => reject(req.error || new Error('Gagal membaca semua gambar dari IndexedDB.'));
    });
}

export async function deleteCardImageFromIdb(cardId) {
    const db = await openCardImageDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(cardId);

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error || new Error('Gagal menghapus gambar dari IndexedDB.'));
    });
}

export async function clearAllCardImagesFromIdb() {
    const db = await openCardImageDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error || new Error('Gagal mengosongkan gambar di IndexedDB.'));
    });
}
