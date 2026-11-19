/* Fungsi: Menyediakan layanan penyimpanan tunggal, migrasi gambar ke IndexedDB, dan pemulihan cadangan tervalidasi.
   Batasan: Tidak mengatur elemen HTML atau interaksi tombol secara langsung. */

import { STORAGE_KEYS } from '../config.js';
import {
    CURRENT_SCHEMA_VERSION,
    safeGetStorage,
    setJsonStorage,
    setRawStorage,
    removeStorageItem,
    getStoredSchemaVersion,
    setStoredSchemaVersion
} from './localStore.js';
import {
    saveCardImageToIdb,
    getAllCardImagesFromIdb,
    deleteCardImageFromIdb,
    clearAllCardImagesFromIdb
} from './idbStore.js';
import { validateAndNormalizeBackup } from './backupValidator.js';
import { formatFriendlyStorageError } from '../shared/errorHandler.js';

export function loadUserSettings() {
    return safeGetStorage(STORAGE_KEYS.SETTINGS, { level: 1, gender: 'L' });
}

export function saveUserSettings(settings) {
    const result = setJsonStorage(STORAGE_KEYS.SETTINGS, settings);
    return {
        ...result,
        friendlyMessage: result.ok ? '' : formatFriendlyStorageError(result.error, 'menyimpan pengaturan kemampuan')
    };
}

export function loadImageOnlySetting() {
    return safeGetStorage(STORAGE_KEYS.IMG_ONLY, false);
}

export function saveImageOnlySetting(value) {
    const result = setJsonStorage(STORAGE_KEYS.IMG_ONLY, Boolean(value));
    return {
        ...result,
        friendlyMessage: result.ok ? '' : formatFriendlyStorageError(result.error, 'menyimpan mode gambar saja')
    };
}

export function loadCollapsedCategories() {
    return safeGetStorage(STORAGE_KEYS.COLLAPSED_CATS, {});
}

export function saveCollapsedCategories(collapsedMap) {
    const result = setJsonStorage(STORAGE_KEYS.COLLAPSED_CATS, collapsedMap);
    return {
        ...result,
        friendlyMessage: result.ok ? '' : formatFriendlyStorageError(result.error, 'menyimpan status kategori')
    };
}

export function loadCustomLabels() {
    return safeGetStorage(STORAGE_KEYS.CUSTOM_LABELS, {});
}

export function saveCustomLabels(labelsMap) {
    const result = setJsonStorage(STORAGE_KEYS.CUSTOM_LABELS, labelsMap);
    return {
        ...result,
        friendlyMessage: result.ok ? '' : formatFriendlyStorageError(result.error, 'menyimpan tulisan kartu')
    };
}

export function loadDeletedCardIds() {
    return safeGetStorage(STORAGE_KEYS.DELETED_CARDS, []);
}

export function saveDeletedCardIds(deletedIds) {
    const result = setJsonStorage(STORAGE_KEYS.DELETED_CARDS, deletedIds);
    return {
        ...result,
        friendlyMessage: result.ok ? '' : formatFriendlyStorageError(result.error, 'menyimpan daftar kartu terhapus')
    };
}

export function loadUserCards() {
    const cards = safeGetStorage(STORAGE_KEYS.USER_CARDS, []);
    return Array.isArray(cards) ? cards : [];
}

export function saveUserCards(cards) {
    const result = setJsonStorage(STORAGE_KEYS.USER_CARDS, cards);
    return {
        ...result,
        friendlyMessage: result.ok ? '' : formatFriendlyStorageError(result.error, 'menyimpan kartu buatan Anda')
    };
}

export async function migrateLegacyImagesToIdb() {
    const legacyCustomImages = safeGetStorage(STORAGE_KEYS.CUSTOM_IMAGES, {});
    const legacyUserCards = loadUserCards();

    const entriesToMigrate = [];

    if (legacyCustomImages && typeof legacyCustomImages === 'object') {
        Object.keys(legacyCustomImages).forEach((cardId) => {
            const imgData = legacyCustomImages[cardId];
            if (typeof imgData === 'string' && imgData.trim() !== '') {
                entriesToMigrate.push({ id: cardId, imageDataUrl: imgData });
            }
        });
    }

    legacyUserCards.forEach((card) => {
        if (card && card.id && typeof card.imageUrl === 'string' && card.imageUrl.trim() !== '') {
            entriesToMigrate.push({ id: card.id, imageDataUrl: card.imageUrl });
        }
    });

    const backedUpLegacy = {
        customImages: legacyCustomImages,
        userCards: legacyUserCards
    };

    if (entriesToMigrate.length === 0) {
        if (getStoredSchemaVersion() < CURRENT_SCHEMA_VERSION) {
            setStoredSchemaVersion(CURRENT_SCHEMA_VERSION);
        }
        return { migratedCount: 0, partialFailure: false, backup: backedUpLegacy };
    }

    let migratedCount = 0;
    let partialFailure = false;
    const migratedIds = [];

    for (const entry of entriesToMigrate) {
        try {
            await saveCardImageToIdb(entry.id, entry.imageDataUrl);
            migratedCount++;
            migratedIds.push(entry.id);
        } catch (err) {
            partialFailure = true;
        }
    }

    if (!partialFailure) {
        removeStorageItem(STORAGE_KEYS.CUSTOM_IMAGES);

        const strippedUserCards = legacyUserCards.map((card) => {
            if (!card) return card;
            const copy = { ...card };
            delete copy.imageUrl;
            return copy;
        });
        setJsonStorage(STORAGE_KEYS.USER_CARDS, strippedUserCards);
        setStoredSchemaVersion(CURRENT_SCHEMA_VERSION);
    } else if (migratedIds.length > 0 && legacyCustomImages && typeof legacyCustomImages === 'object') {
        const remainingCustomImages = { ...legacyCustomImages };
        migratedIds.forEach((id) => {
            delete remainingCustomImages[id];
        });
        setJsonStorage(STORAGE_KEYS.CUSTOM_IMAGES, remainingCustomImages);
    }

    return { migratedCount, partialFailure, backup: backedUpLegacy };
}

export async function loadAllCardImages() {
    const fallbackCustomImages = safeGetStorage(STORAGE_KEYS.CUSTOM_IMAGES, {});
    const fallbackUserCards = loadUserCards();
    const mergedImages = {};

    if (fallbackCustomImages && typeof fallbackCustomImages === 'object') {
        Object.assign(mergedImages, fallbackCustomImages);
    }
    fallbackUserCards.forEach((card) => {
        if (card && card.id && card.imageUrl) {
            mergedImages[card.id] = card.imageUrl;
        }
    });

    try {
        const idbImages = await getAllCardImagesFromIdb();
        Object.assign(mergedImages, idbImages);
    } catch (err) {
        // Tetap gunakan data gambar yang tersedia apabila IndexedDB tidak dapat diakses.
    }

    return mergedImages;
}

export async function saveCardImage(cardId, imageDataUrl) {
    try {
        await saveCardImageToIdb(cardId, imageDataUrl);
        return { ok: true, storage: 'indexeddb', friendlyMessage: '' };
    } catch (err) {
        const currentCustom = safeGetStorage(STORAGE_KEYS.CUSTOM_IMAGES, {});
        currentCustom[cardId] = imageDataUrl;
        const localResult = setJsonStorage(STORAGE_KEYS.CUSTOM_IMAGES, currentCustom);
        const combinedError = localResult.error || err;
        return {
            ok: localResult.ok,
            storage: 'localstorage',
            error: combinedError,
            friendlyMessage: localResult.ok ? '' : formatFriendlyStorageError(combinedError, 'menyimpan gambar kartu')
        };
    }
}

export async function removeCardImage(cardId) {
    try {
        await deleteCardImageFromIdb(cardId);
    } catch (err) {
        // Abaikan jika gambar belum ada di IndexedDB.
    }

    const currentCustom = safeGetStorage(STORAGE_KEYS.CUSTOM_IMAGES, {});
    if (currentCustom && Object.prototype.hasOwnProperty.call(currentCustom, cardId)) {
        delete currentCustom[cardId];
        setJsonStorage(STORAGE_KEYS.CUSTOM_IMAGES, currentCustom);
    }
}

export async function clearAllCardImages() {
    try {
        await clearAllCardImagesFromIdb();
    } catch (err) {
        // Abaikan jika IndexedDB kosong atau tidak aktif.
    }
    removeStorageItem(STORAGE_KEYS.CUSTOM_IMAGES);
}

export async function restoreValidatedBackupData(rawBackupObj) {
    const check = validateAndNormalizeBackup(rawBackupObj);
    if (!check.valid) {
        return {
            ok: false,
            message: check.reason
        };
    }

    const data = check.normalizedData;

    try {
        if (data[STORAGE_KEYS.SETTINGS]) {
            const res = setJsonStorage(STORAGE_KEYS.SETTINGS, data[STORAGE_KEYS.SETTINGS]);
            if (!res.ok) {
                return { ok: false, message: formatFriendlyStorageError(res.error, 'memulihkan pengaturan') };
            }
        }

        if (data[STORAGE_KEYS.CUSTOM_LABELS]) {
            const res = setJsonStorage(STORAGE_KEYS.CUSTOM_LABELS, data[STORAGE_KEYS.CUSTOM_LABELS]);
            if (!res.ok) {
                return { ok: false, message: formatFriendlyStorageError(res.error, 'memulihkan label kartu') };
            }
        }

        if (data[STORAGE_KEYS.DELETED_CARDS]) {
            const res = setJsonStorage(STORAGE_KEYS.DELETED_CARDS, data[STORAGE_KEYS.DELETED_CARDS]);
            if (!res.ok) {
                return { ok: false, message: formatFriendlyStorageError(res.error, 'memulihkan daftar kartu terhapus') };
            }
        }

        if (data[STORAGE_KEYS.COLLAPSED_CATS]) {
            const res = setJsonStorage(STORAGE_KEYS.COLLAPSED_CATS, data[STORAGE_KEYS.COLLAPSED_CATS]);
            if (!res.ok) {
                return { ok: false, message: formatFriendlyStorageError(res.error, 'memulihkan status kategori') };
            }
        }

        if (data[STORAGE_KEYS.HISTORY]) {
            const res = setJsonStorage(STORAGE_KEYS.HISTORY, data[STORAGE_KEYS.HISTORY]);
            if (!res.ok) {
                return { ok: false, message: formatFriendlyStorageError(res.error, 'memulihkan riwayat kata') };
            }
        }

        if (typeof data[STORAGE_KEYS.IMG_ONLY] === 'boolean') {
            setJsonStorage(STORAGE_KEYS.IMG_ONLY, data[STORAGE_KEYS.IMG_ONLY]);
        }

        if (typeof data[STORAGE_KEYS.CHILD_LOCK] === 'boolean') {
            setJsonStorage(STORAGE_KEYS.CHILD_LOCK, data[STORAGE_KEYS.CHILD_LOCK]);
        }

        if (typeof data[STORAGE_KEYS.THEME] === 'string') {
            setRawStorage(STORAGE_KEYS.THEME, data[STORAGE_KEYS.THEME]);
        }

        const imagesToStore = { ...(data[STORAGE_KEYS.CUSTOM_IMAGES] || {}) };
        const cleanUserCards = [];

        if (Array.isArray(data[STORAGE_KEYS.USER_CARDS])) {
            for (const card of data[STORAGE_KEYS.USER_CARDS]) {
                if (card.imageUrl) {
                    imagesToStore[card.id] = card.imageUrl;
                }
                const cardCopy = { ...card };
                delete cardCopy.imageUrl;
                cleanUserCards.push(cardCopy);
            }

            const cardRes = setJsonStorage(STORAGE_KEYS.USER_CARDS, cleanUserCards);
            if (!cardRes.ok) {
                return { ok: false, message: formatFriendlyStorageError(cardRes.error, 'memulihkan kartu buatan pengguna') };
            }
        }

        const imageIds = Object.keys(imagesToStore);
        for (const cardId of imageIds) {
            await saveCardImage(cardId, imagesToStore[cardId]);
        }

        setStoredSchemaVersion(CURRENT_SCHEMA_VERSION);

        return {
            ok: true,
            message: 'Data cadangan berhasil divalidasi dan dipulihkan dengan aman.'
        };
    } catch (err) {
        return {
            ok: false,
            message: formatFriendlyStorageError(err, 'memulihkan berkas cadangan')
        };
    }
}
