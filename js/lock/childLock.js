/* Fungsi: Mengatur fitur kunci anak tiga ketukan untuk menyembunyikan kontrol edit dan menu.
   Batasan: Tidak mengatur sandi atau PIN kunci utama aplikasi. */

import { STORAGE_KEYS } from '../config.js';
import { safeGetStorage, setJsonStorage } from '../storage/localStore.js';

let isChildLock = safeGetStorage(STORAGE_KEYS.CHILD_LOCK, false);
let lockClickCount = 0;
let lockResetTimer = null;

export function getChildLockState() {
    return isChildLock;
}

export function setChildLockState(nextState) {
    isChildLock = Boolean(nextState);
    setJsonStorage(STORAGE_KEYS.CHILD_LOCK, isChildLock);
    updateChildLockUI();
}

export function handleLockClick(onForceExitEditMode) {
    lockClickCount++;
    const lockBtn = document.getElementById('lock-btn');

    if (lockClickCount < 3) {
        if (lockBtn) {
            lockBtn.innerText = `🔒 Tekan ${3 - lockClickCount}x lagi`;
        }
        clearTimeout(lockResetTimer);
        lockResetTimer = setTimeout(() => {
            lockClickCount = 0;
            updateChildLockUI();
        }, 2000);
        return;
    }

    lockClickCount = 0;
    clearTimeout(lockResetTimer);
    isChildLock = !isChildLock;
    setJsonStorage(STORAGE_KEYS.CHILD_LOCK, isChildLock);
    updateChildLockUI(onForceExitEditMode);
}

export function updateChildLockUI(onForceExitEditMode) {
    const lockBtn = document.getElementById('lock-btn');
    if (isChildLock) {
        document.body.classList.add('child-locked');
        if (typeof onForceExitEditMode === 'function') {
            onForceExitEditMode();
        }
        if (lockBtn) {
            lockBtn.innerHTML = '🔓 Buka (3x)';
            lockBtn.classList.add('unlocked-style');
        }
    } else {
        document.body.classList.remove('child-locked');
        if (lockBtn) {
            lockBtn.innerHTML = '🔒 Kunci (3x)';
            lockBtn.classList.remove('unlocked-style');
        }
    }
}
