/* Fungsi: Mengelola ekspor cadangan JSON, pemulihan cadangan, dan pengingat cadangan bulanan.
   Batasan: Tidak mengimpor modul fitur lain secara langsung dan tidak mengatur layar kunci. */

import { STORAGE_KEYS } from '../../config.js';
import {
    CURRENT_SCHEMA_VERSION,
    safeGetStorage,
    getRawStorage,
    setRawStorage
} from '../../storage/localStore.js';
import {
    loadUserSettings,
    loadImageOnlySetting,
    loadCollapsedCategories,
    loadCustomLabels,
    loadDeletedCardIds,
    loadUserCards,
    loadAllCardImages,
    restoreValidatedBackupData
} from '../../storage/storageService.js';
import { showFriendlyNotice, formatFriendlyStorageError } from '../../shared/errorHandler.js';

const LAST_BACKUP_AT_KEY = 'pecs_last_backup_at';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

let onAfterRestoreCallback = null;

export function setAfterRestoreHandler(handler) {
    onAfterRestoreCallback = typeof handler === 'function' ? handler : null;
}

export function getLastBackupTimestamp() {
    const raw = getRawStorage(LAST_BACKUP_AT_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isNaN(parsed) ? 0 : parsed;
}

export function isMonthlyBackupDue(nowMs = Date.now()) {
    const lastBackup = getLastBackupTimestamp();
    if (!lastBackup) {
        return true;
    }
    return (nowMs - lastBackup) >= THIRTY_DAYS_MS;
}

export function getMonthlyBackupStatusText(nowMs = Date.now()) {
    const lastBackup = getLastBackupTimestamp();
    if (!lastBackup) {
        return 'Belum pernah dicadangkan (disarankan rutin tiap bulan)';
    }
    const formattedDate = new Date(lastBackup).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    const dueLabel = isMonthlyBackupDue(nowMs) ? 'Perlu cadangan baru' : 'Aman';
    return `Terakhir: ${formattedDate} (${dueLabel})`;
}

export function checkAndNotifyMonthlyBackup() {
    const statusElem = document.getElementById('backup-reminder-status');
    if (statusElem) {
        statusElem.textContent = getMonthlyBackupStatusText();
    }

    if (isMonthlyBackupDue()) {
        showFriendlyNotice(
            'Sudah waktunya membuat cadangan data Bicara PECS bulanan Anda agar kartu dan pengaturan anak tetap aman.',
            'Pengingat Cadangan Bulanan'
        );
    }
}

export async function buildBackupPayload() {
    const imagesMap = await loadAllCardImages();
    const userCards = loadUserCards().map((card) => {
        if (!card) return card;
        const copy = { ...card };
        if (imagesMap[card.id]) {
            copy.imageUrl = imagesMap[card.id];
        }
        return copy;
    });

    return {
        app: 'Bicara PECS',
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        data: {
            [STORAGE_KEYS.SETTINGS]: loadUserSettings(),
            [STORAGE_KEYS.IMG_ONLY]: loadImageOnlySetting(),
            [STORAGE_KEYS.COLLAPSED_CATS]: loadCollapsedCategories(),
            [STORAGE_KEYS.CUSTOM_LABELS]: loadCustomLabels(),
            [STORAGE_KEYS.DELETED_CARDS]: loadDeletedCardIds(),
            [STORAGE_KEYS.USER_CARDS]: userCards,
            [STORAGE_KEYS.CUSTOM_IMAGES]: imagesMap,
            [STORAGE_KEYS.HISTORY]: safeGetStorage(STORAGE_KEYS.HISTORY, []),
            [STORAGE_KEYS.CHILD_LOCK]: safeGetStorage(STORAGE_KEYS.CHILD_LOCK, false),
            [STORAGE_KEYS.THEME]: getRawStorage(STORAGE_KEYS.THEME) || 'light'
        }
    };
}

export async function exportBackupJsonFile() {
    try {
        const payload = await buildBackupPayload();
        const jsonString = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const dateTag = new Date().toISOString().slice(0, 10);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bicara-pecs-cadangan-${dateTag}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        setRawStorage(LAST_BACKUP_AT_KEY, String(Date.now()));
        const statusElem = document.getElementById('backup-reminder-status');
        if (statusElem) {
            statusElem.textContent = getMonthlyBackupStatusText();
        }
        alert('Berkas cadangan JSON berhasil diunduh.');
    } catch (err) {
        showFriendlyNotice(
            formatFriendlyStorageError(err, 'membuat berkas cadangan JSON'),
            'Ekspor Cadangan Gagal'
        );
    }
}

export async function restoreBackupFromText(jsonText) {
    let parsedObj = null;
    try {
        parsedObj = JSON.parse(jsonText);
    } catch (e) {
        showFriendlyNotice(
            'Berkas cadangan tidak dapat dibaca karena format JSON rusak. Data Anda yang lama tetap aman.',
            'Pemulihan Cadangan Gagal'
        );
        return { ok: false };
    }

    const result = await restoreValidatedBackupData(parsedObj);
    if (!result.ok) {
        showFriendlyNotice(result.message, 'Pemulihan Cadangan Gagal');
        return { ok: false };
    }

    if (onAfterRestoreCallback) {
        await onAfterRestoreCallback();
    }

    const statusElem = document.getElementById('backup-reminder-status');
    if (statusElem) {
        statusElem.textContent = getMonthlyBackupStatusText();
    }

    alert(result.message);
    return { ok: true };
}

export function triggerBackupFilePicker() {
    let picker = document.getElementById('backup-json-file-input');
    if (!picker) {
        picker = document.createElement('input');
        picker.type = 'file';
        picker.id = 'backup-json-file-input';
        picker.accept = 'application/json,.json';
        picker.style.display = 'none';
        picker.addEventListener('change', async (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            try {
                const textContent = await file.text();
                await restoreBackupFromText(textContent);
            } catch (err) {
                showFriendlyNotice(
                    formatFriendlyStorageError(err, 'membaca berkas cadangan'),
                    'Pemulihan Cadangan Gagal'
                );
            } finally {
                picker.value = '';
            }
        });
        document.body.appendChild(picker);
    }
    picker.click();
}
