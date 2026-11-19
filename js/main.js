/* Fungsi: Pintu masuk utama aplikasi Bicara PECS yang menyatukan seluruh modul dan inisialisasi.
   Batasan: Tidak menyimpan logika fitur detail; hanya menghubungkan modul dan mendaftarkan event. */

import { STORAGE_KEYS } from './config.js';
import { getRawStorage, setRawStorage, clearAllStorage } from './storage/localStore.js';
import {
    bindActivityLockListeners,
    evaluateAppLock,
    checkUnlockPassword,
    openPinConfigModal,
    closePinConfigModal,
    togglePinInputGroup,
    savePinConfiguration
} from './lock/pinLock.js';
import {
    handleLockClick,
    updateChildLockUI
} from './lock/childLock.js';
import {
    changeTheme,
    initTheme
} from './features/theme/index.js';
import {
    saveToHistory,
    renderHistory
} from './features/history/index.js';
import {
    addToSentence,
    updateSentenceStrip,
    removeFromSentence,
    clearSentence,
    speakSentence,
    setSentenceWordAddedHandler
} from './features/sentence/index.js';
import {
    saveAssessmentSettings,
    syncAssessmentForm,
    toggleEditMode,
    toggleImageOnlyModeFromMenu,
    updateImageOnlyState,
    toggleCategoryCollapse,
    renderCategories,
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
} from './features/cards/index.js';

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').then((registration) => {
                registration.update();
            }).catch((err) => console.log('ServiceWorker gagal didaftarkan: ', err));
        });
    }
}

function bindScrollTopButton() {
    window.onscroll = function() {
        const btn = document.getElementById('btn-scroll-top');
        if (btn) {
            if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
                btn.style.display = 'block';
            } else {
                btn.style.display = 'none';
            }
        }
    };
}

export function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function goToPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach((page) => page.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        setRawStorage(STORAGE_KEYS.ACTIVE_PAGE, pageId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

export function openMenu() {
    const overlay = document.getElementById('overlay');
    const sidebar = document.getElementById('sidebar');
    if (overlay) overlay.style.display = 'block';
    if (sidebar) sidebar.classList.add('open');
}

export function closeMenu() {
    const overlay = document.getElementById('overlay');
    const sidebar = document.getElementById('sidebar');
    if (overlay) overlay.style.display = 'none';
    if (sidebar) sidebar.classList.remove('open');
}

export function saveSettingsAndStart() {
    const selectedRadio = document.querySelector('input[name="level"]:checked');
    const selectedLevel = selectedRadio ? parseInt(selectedRadio.value, 10) : 1;
    const genderSelect = document.getElementById('select-gender');
    const selectedGender = genderSelect ? genderSelect.value : 'L';

    saveAssessmentSettings(selectedLevel, selectedGender);
    goToPage('page-main');
}

export function resetToDefaultSettings() {
    const confirmReset = confirm('Apakah Anda yakin ingin menghapus semua kustomisasi dan mengembalikan ke pengaturan awal?');
    if (confirmReset) {
        clearAllStorage();
        alert('Aplikasi telah dikembalikan ke pengaturan awal.');
        window.location.reload();
    }
}

function wireModuleConnections() {
    setCardSelectHandler((word, emoji, customImgUrl) => {
        addToSentence(word, emoji, customImgUrl);
    });

    setSentenceWordAddedHandler((word) => {
        saveToHistory(word);
    });

    window.scrollToTop = scrollToTop;
    window.goToPage = goToPage;
    window.openMenu = openMenu;
    window.closeMenu = closeMenu;
    window.saveSettingsAndStart = saveSettingsAndStart;
    window.resetToDefaultSettings = resetToDefaultSettings;

    window.checkUnlockPassword = checkUnlockPassword;
    window.openPinConfigModal = openPinConfigModal;
    window.closePinConfigModal = closePinConfigModal;
    window.togglePinInputGroup = togglePinInputGroup;
    window.savePinConfiguration = savePinConfiguration;

    window.handleLockClick = () => handleLockClick(() => toggleEditMode(false));

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
}

async function initializeApp() {
    initTheme();
    await evaluateAppLock();

    updateImageOnlyState();
    updateChildLockUI(() => toggleEditMode(false));
    syncAssessmentForm();
    renderCategories();
    updateSentenceStrip();

    const lastActivePage = getRawStorage(STORAGE_KEYS.ACTIVE_PAGE) || 'page-welcome';
    goToPage(lastActivePage);
}

registerServiceWorker();
bindActivityLockListeners();
bindScrollTopButton();
wireModuleConnections();

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
