/* Fungsi: Membaca dan menulis data aplikasi pada localStorage secara aman dengan dukungan versi data.
   Batasan: Tidak menyimpan gambar besar ke IndexedDB; khusus data ringan berbasis teks/JSON. */

export const SCHEMA_VERSION_KEY = 'pecs_schema_version';
export const CURRENT_SCHEMA_VERSION = 2;

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
    try {
        localStorage.setItem(key, value);
        return { ok: true, error: null };
    } catch (e) {
        return { ok: false, error: e };
    }
}

export function setJsonStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return { ok: true, error: null };
    } catch (e) {
        return { ok: false, error: e };
    }
}

export function removeStorageItem(key) {
    try {
        localStorage.removeItem(key);
        return { ok: true, error: null };
    } catch (e) {
        return { ok: false, error: e };
    }
}

export function clearAllStorage() {
    try {
        localStorage.clear();
        return { ok: true, error: null };
    } catch (e) {
        return { ok: false, error: e };
    }
}

export function getStoredSchemaVersion() {
    const raw = getRawStorage(SCHEMA_VERSION_KEY);
    const parsed = raw ? parseInt(raw, 10) : 1;
    return Number.isNaN(parsed) ? 1 : parsed;
}

export function setStoredSchemaVersion(version) {
    return setRawStorage(SCHEMA_VERSION_KEY, String(version));
}
