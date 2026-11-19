/* Fungsi: Satu-satunya tempat mendaftarkan fitur dan menghubungkan aksi fitur ke jendela aplikasi.
   Batasan: Tidak memuat logika detail fitur; hanya mendaftarkan modul dan aksi yang tersedia. */

import {
    changeTheme,
    initTheme
} from './theme/index.js';
import {
    saveToHistory,
    renderHistory
} from './history/index.js';
import {
    addToSentence,
    updateSentenceStrip,
    removeFromSentence,
    clearSentence,
    speakSentence,
    setSentenceWordAddedHandler
} from './sentence/index.js';
import {
    saveAssessmentSettings,
    refreshCardsStorageState,
    toggleEditMode,
    toggleImageOnlyModeFromMenu,
    toggleCategoryCollapse,
    deleteCard,
    openAddCardModal,
    openChangeImageModal,
    closeAddCardModal,
    quickCategorySearch,
    searchArasaac,
    submitNewCustomCard,
    editCardText,
    resetCardCustomization,
    setCardSelectHandler
} from './cards/index.js';
import {
    setAfterRestoreHandler,
    checkAndNotifyMonthlyBackup,
    exportBackupJsonFile,
    restoreBackupFromText,
    triggerBackupFilePicker
} from './backup/index.js';

export const REGISTERED_FEATURES = [
    { name: 'theme', label: 'Tema Tampilan' },
    { name: 'history', label: 'Riwayat Kata' },
    { name: 'sentence', label: 'Penyusunan Kalimat' },
    { name: 'cards', label: 'Papan Kartu PECS' },
    { name: 'backup', label: 'Cadangan JSON & Pengingat Bulanan' }
];

export function initRegisteredFeatures() {
    initTheme();
}

export function runMonthlyBackupReminderCheck() {
    checkAndNotifyMonthlyBackup();
}

export async function refreshRegisteredFeatureStates() {
    await refreshCardsStorageState();
    updateSentenceStrip();
}

export function registerFeatureWindowActions(onForceExitEditMode, onAfterDataRestored) {
    setCardSelectHandler((word, emoji, customImgUrl) => {
        addToSentence(word, emoji, customImgUrl);
    });

    setSentenceWordAddedHandler((word) => {
        saveToHistory(word);
    });

    setAfterRestoreHandler(async () => {
        initTheme();
        if (typeof onAfterDataRestored === 'function') {
            await onAfterDataRestored();
        }
        if (typeof window.renderHistory === 'function') {
            window.renderHistory();
        }
    });

    window.changeTheme = changeTheme;
    window.renderHistory = renderHistory;

    window.removeFromSentence = removeFromSentence;
    window.clearSentence = clearSentence;
    window.speakSentence = speakSentence;

    window.toggleEditMode = () => toggleEditMode();
    window.toggleImageOnlyModeFromMenu = toggleImageOnlyModeFromMenu;
    window.toggleCategoryCollapse = toggleCategoryCollapse;
    window.deleteCard = deleteCard;
    window.openAddCardModal = openAddCardModal;
    window.openChangeImageModal = openChangeImageModal;
    window.closeAddCardModal = closeAddCardModal;
    window.quickCategorySearch = quickCategorySearch;
    window.searchArasaac = searchArasaac;
    window.submitNewCustomCard = submitNewCustomCard;
    window.editCardText = editCardText;
    window.resetCardCustomization = resetCardCustomization;

    window.exportBackupJsonFile = exportBackupJsonFile;
    window.restoreBackupFromText = restoreBackupFromText;
    window.triggerBackupFilePicker = triggerBackupFilePicker;

    return {
        saveAssessmentSettings,
        forceExitEditMode: onForceExitEditMode
    };
}
