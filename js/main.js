/* Fungsi: Pintu masuk utama aplikasi Bicara PECS yang memuat fitur melalui registry.js.
   Batasan: Tidak menyimpan logika detail fitur; hanya mengatur alur utama dan inisialisasi. */

import { STORAGE_KEYS } from './config.js';
import { getRawStorage, setRawStorage, clearAllStorage } from './storage/localStore.js';
import {
    migrateLegacyImagesToIdb,
    clearAllCardImages,
    restoreValidatedBackupData
} from './storage/storageService.js';
import {
    installGlobalErrorHandlers,
    showFriendlyNotice
} from './shared/errorHandler.js';
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
    initRegisteredFeatures,
    refreshRegisteredFeatureStates,
    registerFeatureWindowActions
} from './features/registry.js';

let featureActionsRef = null;

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

    if (featureActionsRef && typeof featureActionsRef.saveAssessmentSettings === 'function') {
        featureActionsRef.saveAssessmentSettings(selectedLevel, selectedGender);
    }
    goToPage('page-main');
}

export async function resetToDefaultSettings() {
    const confirmReset = confirm('Apakah Anda yakin ingin menghapus semua kustomisasi dan mengembalikan ke pengaturan awal?');
    if (confirmReset) {
        await clearAllCardImages();
        clearAllStorage();
        alert('Aplikasi telah dikembalikan ke pengaturan awal.');
        window.location.reload();
    }
}

export async function restoreBackupJsonText(jsonText) {
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

    initRegisteredFeatures();
    updateChildLockUI(() => {
        if (featureActionsRef && typeof featureActionsRef.forceExitEditMode === 'function') {
            featureActionsRef.forceExitEditMode(false);
        }
    });
    await refreshRegisteredFeatureStates();
    if (typeof window.renderHistory === 'function') {
        window.renderHistory();
    }
    alert(result.message);
    return { ok: true };
}

function wireCoreConnections() {
    const forceExitEdit = () => {
        if (typeof window.toggleEditMode === 'function') {
            window.toggleEditMode(false);
        }
    };

    featureActionsRef = registerFeatureWindowActions(forceExitEdit);

    window.scrollToTop = scrollToTop;
    window.goToPage = goToPage;
    window.openMenu = openMenu;
    window.closeMenu = closeMenu;
    window.saveSettingsAndStart = saveSettingsAndStart;
    window.resetToDefaultSettings = resetToDefaultSettings;
    window.restoreBackupJsonText = restoreBackupJsonText;

    window.checkUnlockPassword = checkUnlockPassword;
    window.openPinConfigModal = openPinConfigModal;
    window.closePinConfigModal = closePinConfigModal;
    window.togglePinInputGroup = togglePinInputGroup;
    window.savePinConfiguration = savePinConfiguration;

    window.handleLockClick = () => handleLockClick(forceExitEdit);
}

async function initializeApp() {
    initRegisteredFeatures();
    await evaluateAppLock();
    await migrateLegacyImagesToIdb();

    const forceExitEdit = () => {
        if (typeof window.toggleEditMode === 'function') {
            window.toggleEditMode(false);
        }
    };

    updateChildLockUI(forceExitEdit);
    await refreshRegisteredFeatureStates();

    const lastActivePage = getRawStorage(STORAGE_KEYS.ACTIVE_PAGE) || 'page-welcome';
    goToPage(lastActivePage);
}

installGlobalErrorHandlers();
registerServiceWorker();
bindActivityLockListeners();
bindScrollTopButton();
wireCoreConnections();

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
