/* Fungsi: Memvalidasi dan menormalkan data cadangan JSON (termasuk format versi 1).
   Batasan: Hanya melakukan validasi dan normalisasi objek; tidak menulis ke penyimpanan. */

import { STORAGE_KEYS } from '../config.js';
import { CURRENT_SCHEMA_VERSION } from './localStore.js';

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateAndNormalizeBackup(rawData) {
    if (!isPlainObject(rawData)) {
        return {
            valid: false,
            reason: 'Format berkas cadangan tidak dikenali. Pastikan berkas berasal dari cadangan Bicara PECS.'
        };
    }

    const sourcePayload = isPlainObject(rawData.data) ? rawData.data : rawData;

    const hasKnownKey = Object.values(STORAGE_KEYS).some((keyName) =>
        Object.prototype.hasOwnProperty.call(sourcePayload, keyName)
    ) || Object.prototype.hasOwnProperty.call(sourcePayload, 'userCards') || Object.prototype.hasOwnProperty.call(sourcePayload, 'customImages');

    if (!hasKnownKey) {
        return {
            valid: false,
            reason: 'Berkas cadangan tidak memuat data kartu, pengaturan, atau riwayat Bicara PECS yang valid.'
        };
    }

    const normalized = {};

    const rawSettings = sourcePayload[STORAGE_KEYS.SETTINGS] ?? sourcePayload.settings;
    if (rawSettings !== undefined) {
        if (!isPlainObject(rawSettings)) {
            return {
                valid: false,
                reason: 'Data pengaturan pada berkas cadangan tidak sesuai format.'
            };
        }
        const level = Number(rawSettings.level);
        const safeLevel = [1, 2, 3].includes(level) ? level : 1;
        const safeGender = rawSettings.gender === 'P' ? 'P' : 'L';
        normalized[STORAGE_KEYS.SETTINGS] = { level: safeLevel, gender: safeGender };
    }

    const rawUserCards = sourcePayload[STORAGE_KEYS.USER_CARDS] ?? sourcePayload.userCards;
    if (rawUserCards !== undefined) {
        if (!Array.isArray(rawUserCards)) {
            return {
                valid: false,
                reason: 'Daftar kartu buatan pengguna pada berkas cadangan rusak atau tidak valid.'
            };
        }
        const cleanedCards = [];
        for (const card of rawUserCards) {
            if (!isPlainObject(card) || typeof card.id !== 'string' || typeof card.word !== 'string') {
                return {
                    valid: false,
                    reason: 'Terdapat kartu buatan pengguna yang tidak lengkap pada berkas cadangan.'
                };
            }
            cleanedCards.push({
                id: card.id,
                catKey: typeof card.catKey === 'string' ? card.catKey : 'benda_harian',
                word: card.word,
                ...(typeof card.imageUrl === 'string' && card.imageUrl ? { imageUrl: card.imageUrl } : {})
            });
        }
        normalized[STORAGE_KEYS.USER_CARDS] = cleanedCards;
    }

    const rawCustomImages = sourcePayload[STORAGE_KEYS.CUSTOM_IMAGES] ?? sourcePayload.customImages;
    if (rawCustomImages !== undefined) {
        if (!isPlainObject(rawCustomImages)) {
            return {
                valid: false,
                reason: 'Data gambar kartu pada berkas cadangan tidak sesuai format.'
            };
        }
        const cleanedImages = {};
        Object.keys(rawCustomImages).forEach((cardId) => {
            const imgVal = rawCustomImages[cardId];
            if (typeof imgVal === 'string' && imgVal.trim() !== '') {
                cleanedImages[cardId] = imgVal;
            }
        });
        normalized[STORAGE_KEYS.CUSTOM_IMAGES] = cleanedImages;
    }

    const rawCustomLabels = sourcePayload[STORAGE_KEYS.CUSTOM_LABELS] ?? sourcePayload.customLabels;
    if (rawCustomLabels !== undefined) {
        if (!isPlainObject(rawCustomLabels)) {
            return {
                valid: false,
                reason: 'Data label tulisan kartu pada berkas cadangan tidak sesuai format.'
            };
        }
        const cleanedLabels = {};
        Object.keys(rawCustomLabels).forEach((cardId) => {
            if (typeof rawCustomLabels[cardId] === 'string') {
                cleanedLabels[cardId] = rawCustomLabels[cardId];
            }
        });
        normalized[STORAGE_KEYS.CUSTOM_LABELS] = cleanedLabels;
    }

    const rawDeletedCards = sourcePayload[STORAGE_KEYS.DELETED_CARDS] ?? sourcePayload.deletedCards;
    if (rawDeletedCards !== undefined) {
        if (!Array.isArray(rawDeletedCards)) {
            return {
                valid: false,
                reason: 'Data daftar kartu terhapus pada berkas cadangan tidak valid.'
            };
        }
        normalized[STORAGE_KEYS.DELETED_CARDS] = rawDeletedCards.filter((id) => typeof id === 'string');
    }

    const rawCollapsedCats = sourcePayload[STORAGE_KEYS.COLLAPSED_CATS] ?? sourcePayload.collapsedCategories;
    if (rawCollapsedCats !== undefined) {
        if (!isPlainObject(rawCollapsedCats)) {
            return {
                valid: false,
                reason: 'Data status kategori pada berkas cadangan tidak valid.'
            };
        }
        normalized[STORAGE_KEYS.COLLAPSED_CATS] = rawCollapsedCats;
    }

    const rawHistory = sourcePayload[STORAGE_KEYS.HISTORY] ?? sourcePayload.history;
    if (rawHistory !== undefined) {
        if (!Array.isArray(rawHistory)) {
            return {
                valid: false,
                reason: 'Data riwayat kata pada berkas cadangan tidak valid.'
            };
        }
        normalized[STORAGE_KEYS.HISTORY] = rawHistory.filter(
            (entry) => isPlainObject(entry) && typeof entry.word === 'string' && typeof entry.timestamp === 'number'
        );
    }

    if (typeof sourcePayload[STORAGE_KEYS.IMG_ONLY] === 'boolean') {
        normalized[STORAGE_KEYS.IMG_ONLY] = sourcePayload[STORAGE_KEYS.IMG_ONLY];
    }

    if (typeof sourcePayload[STORAGE_KEYS.CHILD_LOCK] === 'boolean') {
        normalized[STORAGE_KEYS.CHILD_LOCK] = sourcePayload[STORAGE_KEYS.CHILD_LOCK];
    }

    if (typeof sourcePayload[STORAGE_KEYS.THEME] === 'string') {
        normalized[STORAGE_KEYS.THEME] = sourcePayload[STORAGE_KEYS.THEME] === 'dark' ? 'dark' : 'light';
    }

    const detectedVersion = typeof rawData.version === 'number' ? rawData.version : 1;

    return {
        valid: true,
        sourceVersion: detectedVersion,
        targetVersion: CURRENT_SCHEMA_VERSION,
        normalizedData: normalized
    };
}
