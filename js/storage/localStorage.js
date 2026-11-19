/* Fungsi: Membaca dan menulis data aplikasi pada localStorage.
   Batasan: Pada Tahap 1 hanya membungkus akses localStorage tanpa migrasi IndexedDB. */

export function safeGetStorage(key, defaultValue) {
    try {
        const item = localStorage.getItem(key);
        return item !== null ? JSON.parse(item) : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

export function getRawStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

export function setRawStorage(key, value) {
    localStorage.setItem(key, value);
}

export function setJsonStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorageItem(key) {
    localStorage.removeItem(key);
}

export function clearAllStorage() {
    localStorage.clear();
}
