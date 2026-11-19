/* Fungsi: Menyediakan layanan penyimpanan tunggal dan migrasi gambar kartu ke IndexedDB.
   Batasan: Tidak mengatur elemen HTML atau interaksi tombol secara langsung. */

import { STORAGE_KEYS } from '../config.js';
import {
    CURRENT_SCHEMA_VERSION,
    safeGetStorage,
    setJsonStorage,
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

export function loadUserSettings() {
    return safeGetStorage(STORAGE_KEYS.SETTINGS, { level: 1, gender: 'L' });
}

export function saveUserSettings(settings) {
    return setJsonStorage(STORAGE_KEYS.SETTINGS, settings);
}

export function loadImageOnlySetting() {
    return safeGetStorage(STORAGE_KEYS.IMG_ONLY, false);
}

export function saveImageOnlySetting(value) {
    return setJsonStorage(STORAGE_KEYS.IMG_ONLY, Boolean(value));
}

export function loadCollapsedCategories() {
    return safeGetStorage(STORAGE_KEYS.COLLAPSED_CATS, {});
}

export function saveCollapsedCategories(collapsedMap) {
    return setJsonStorage(STORAGE_KEYS.COLLAPSED_CATS, collapsedMap);
}

export function loadCustomLabels() {
    return safeGetStorage(STORAGE_KEYS.CUSTOM_LABELS, {});
}

export function saveCustomLabels(labelsMap) {
    return setJsonStorage(STORAGE_KEYS.CUSTOM_LABELS, labelsMap);
}

export function loadDeletedCardIds() {
    return safeGetStorage(STORAGE_KEYS.DELETED_CARDS, []);
}

export function saveDeletedCardIds(deletedIds) {
    return setJsonStorage(STORAGE_KEYS.DELETED_CARDS, deletedIds);
}

export function loadUserCards() {
    const cards = safeGetStorage(STORAGE_KEYS.USER_CARDS, []);
    return Array.isArray(cards) ? cards : [];
}

export function saveUserCards(cards) {
    return setJsonStorage(STORAGE_KEYS.USER_CARDS, cards);
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
        // Jika IndexedDB gagal diakses, tetap gunakan data cadangan yang ada di localStorage.
    }

    return mergedImages;
}

export async function saveCardImage(cardId, imageDataUrl) {
    try {
        await saveCardImageToIdb(cardId, imageDataUrl);
        return { ok: true, storage: 'indexeddb' };
    } catch (err) {
        const currentCustom = safeGetStorage(STORAGE_KEYS.CUSTOM_IMAGES, {});
        currentCustom[cardId] = imageDataUrl;
        const localResult = setJsonStorage(STORAGE_KEYS.CUSTOM_IMAGES, currentCustom);
        return { ok: localResult.ok, storage: 'localstorage', error: localResult.error || err };
    }
}

export async function removeCardImage(cardId) {
    try {
        await deleteCardImageFromIdb(cardId);
    } catch (err) {
        // Abaikan jika tidak ada di IndexedDB.
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
