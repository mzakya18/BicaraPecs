/* Fungsi: Pintu masuk utama aplikasi Bicara PECS yang mengamankan pembukaan layar kunci
   meskipun modul fitur lain belum tersedia atau sedang diperbarui.
   Batasan: Tidak menyimpan logika detail fitur; hanya mengatur alur utama dan inisialisasi. */

const DEFAULT_FALLBACK_PASS = 'bicarapecsby@zakymza18';
const PASS_HASH_KEY = 'pecs_pass_hash';
const LOCK_TYPE_KEY = 'pecs_lock_type';
const LAST_ACTIVE_KEY = 'pecs_last_active';

async function fallbackHashText(text) {
    if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 0;
    for (let i = 0; i < text.length; i++) {
        h = ((h << 5) - h) + text.charCodeAt(i);
        h |= 0;
    }
    return `fb_${Math.abs(h).toString(16)}`;
}

async function fallbackCheckUnlockPassword() {
    const inputElem = document.getElementById('lock-input-pass');
    const errorMsg = document.getElementById('lock-error-msg');
    const lockModal = document.getElementById('lock-screen-modal');
    const val = inputElem ? inputElem.value.trim() : '';

    if (!val) {
        if (errorMsg) {
            errorMsg.innerText = 'Harap masukkan sandi atau PIN terlebih dahulu.';
            errorMsg.style.display = 'block';
        }
        return;
    }

    const defaultHash = await fallbackHashText(DEFAULT_FALLBACK_PASS);
    const storedHash = localStorage.getItem(PASS_HASH_KEY) || defaultHash;
    const lockType = localStorage.getItem(LOCK_TYPE_KEY) || 'default';
    const inputHash = await fallbackHashText(val);

    if (inputHash === storedHash || (lockType === 'default' && val === DEFAULT_FALLBACK_PASS)) {
        localStorage.setItem(PASS_HASH_KEY, defaultHash);
        localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
        if (errorMsg) errorMsg.style.display = 'none';
        if (inputElem) inputElem.value = '';
        if (lockModal) lockModal.style.display = 'none';
    } else if (errorMsg) {
        errorMsg.innerText = 'Sandi atau PIN belum sesuai. Silakan coba lagi.';
        errorMsg.style.display = 'block';
    }
}

window.checkUnlockPassword = fallbackCheckUnlockPassword;

async function bootstrapModules() {
    try {
        const [
            configMod,
            localStoreMod,
            storageServiceMod,
            errorHandlerMod,
            pinLockMod,
            childLockMod,
            registryMod
        ] = await Promise.all([
            import('./config.js'),
            import('./storage/localStore.js'),
            import('./storage/storageService.js'),
            import('./shared/errorHandler.js'),
            import('./lock/pinLock.js'),
            import('./lock/childLock.js'),
            import('./features/registry.js')
        ]);

        const { STORAGE_KEYS } = configMod;
        const { getRawStorage, setRawStorage, clearAllStorage } = localStoreMod;
        const { migrateLegacyImagesToIdb, clearAllCardImages, restoreValidatedBackupData } = storageServiceMod;
        const { installGlobalErrorHandlers, showFriendlyNotice } = errorHandlerMod;
        const {
            bindActivityLockListeners,
            evaluateAppLock,
            checkUnlockPassword,
            openPinConfigModal,
            closePinConfigModal,
            togglePinInputGroup,
            savePinConfiguration
        } = pinLockMod;
        const { handleLockClick, updateChildLockUI } = childLockMod;
        const {
            initRegisteredFeatures,
            runMonthlyBackupReminderCheck,
            refreshRegisteredFeatureStates,
            registerFeatureWindowActions
        } = registryMod;

        let featureActionsRef = null;

        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function goToPage(pageId) {
            const pages = document.querySelectorAll('.page');
            pages.forEach((page) => page.classList.remove('active'));
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
                setRawStorage(STORAGE_KEYS.ACTIVE_PAGE, pageId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        function openMenu() {
            const overlay = document.getElementById('overlay');
            const sidebar = document.getElementById('sidebar');
            if (overlay) overlay.style.display = 'block';
            if (sidebar) sidebar.classList.add('open');
        }

        function closeMenu() {
            const overlay = document.getElementById('overlay');
            const sidebar = document.getElementById('sidebar');
            if (overlay) overlay.style.display = 'none';
            if (sidebar) sidebar.classList.remove('open');
        }

        function saveSettingsAndStart() {
            const selectedRadio = document.querySelector('input[name="level"]:checked');
            const selectedLevel = selectedRadio ? parseInt(selectedRadio.value, 10) : 1;
            const genderSelect = document.getElementById('select-gender');
            const selectedGender = genderSelect ? genderSelect.value : 'L';
            if (featureActionsRef && typeof featureActionsRef.saveAssessmentSettings === 'function') {
                featureActionsRef.saveAssessmentSettings(selectedLevel, selectedGender);
            }
            goToPage('page-main');
        }

        async function resetToDefaultSettings() {
            const confirmReset = confirm('Apakah Anda yakin ingin menghapus semua kustomisasi dan mengembalikan ke pengaturan awal?');
            if (confirmReset) {
                await clearAllCardImages();
                clearAllStorage();
                alert('Aplikasi telah dikembalikan ke pengaturan awal.');
                window.location.reload();
            }
        }

        async function restoreBackupJsonText(jsonText) {
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

        const forceExitEdit = () => {
            if (typeof window.toggleEditMode === 'function') {
                window.toggleEditMode(false);
            }
        };

        window.checkUnlockPassword = checkUnlockPassword;
        window.openPinConfigModal = openPinConfigModal;
        window.closePinConfigModal = closePinConfigModal;
        window.togglePinInputGroup = togglePinInputGroup;
        window.savePinConfiguration = savePinConfiguration;

        featureActionsRef = registerFeatureWindowActions(forceExitEdit, async () => {
            updateChildLockUI(forceExitEdit);
            await refreshRegisteredFeatureStates();
        });

        window.scrollToTop = scrollToTop;
        window.goToPage = goToPage;
        window.openMenu = openMenu;
        window.closeMenu = closeMenu;
        window.saveSettingsAndStart = saveSettingsAndStart;
        window.resetToDefaultSettings = resetToDefaultSettings;
        window.restoreBackupJsonText = restoreBackupJsonText;
        window.handleLockClick = () => handleLockClick(forceExitEdit);

        installGlobalErrorHandlers();
        bindActivityLockListeners();

        window.onscroll = function() {
            const btn = document.getElementById('btn-scroll-top');
            if (btn) {
                btn.style.display = (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200)
                    ? 'block'
                    : 'none';
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').then((reg) => reg.update()).catch(() => {});
        }

        initRegisteredFeatures();
        await evaluateAppLock();
        await migrateLegacyImagesToIdb();
        updateChildLockUI(forceExitEdit);
        await refreshRegisteredFeatureStates();
        runMonthlyBackupReminderCheck();

        const lastActivePage = getRawStorage(STORAGE_KEYS.ACTIVE_PAGE) || 'page-welcome';
        goToPage(lastActivePage);
    } catch (err) {
        console.error('Sebagian modul belum termuat:', err);
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootstrapModules);
} else {
    bootstrapModules();
}
