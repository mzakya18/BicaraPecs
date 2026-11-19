/* Fungsi: Mengelola layar kunci aplikasi, verifikasi sandi/PIN ber-hash, dan pengaturan PIN.
   Batasan: Tidak mengatur papan kartu PECS, riwayat kata, atau tema halaman. */

import { APP_CONFIG, STORAGE_KEYS } from '../config.js';
import { getRawStorage, setRawStorage } from '../storage/localStore.js';

export async function hashText(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function updateLastActiveTimestamp() {
    setRawStorage(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
}

export function bindActivityLockListeners() {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            updateLastActiveTimestamp();
        }
    });
    window.addEventListener('beforeunload', updateLastActiveTimestamp);
}

export async function evaluateAppLock() {
    let lockType = getRawStorage(STORAGE_KEYS.LOCK_TYPE) || 'default';
    let storedHash = getRawStorage(STORAGE_KEYS.PASS_HASH);
    const lockModal = document.getElementById('lock-screen-modal');
    const lockTitle = document.getElementById('lock-title');
    const lockDesc = document.getElementById('lock-desc');

    if (!storedHash) {
        storedHash = await hashText(APP_CONFIG.DEFAULT_PASS_PLAIN);
        setRawStorage(STORAGE_KEYS.PASS_HASH, storedHash);
        setRawStorage(STORAGE_KEYS.LOCK_TYPE, 'default');
        lockType = 'default';
    }

    if (lockType === 'none') {
        if (lockModal) lockModal.style.display = 'none';
        return;
    }

    if (lockType === 'default') {
        if (lockTitle) lockTitle.innerText = 'Aplikasi Terkunci';
        if (lockDesc) lockDesc.innerText = 'Masukkan sandi default awal untuk membuka aplikasi.';
        if (lockModal) lockModal.style.display = 'flex';
        return;
    }

    if (lockType === 'pin') {
        const timeoutMinutes = parseInt(getRawStorage(STORAGE_KEYS.LAST_ACTIVE) ? (localStorage.getItem('pecs_timeout_min') || '0') : '0', 10);
        const lastActive = parseInt(getRawStorage(STORAGE_KEYS.LAST_ACTIVE) || '0', 10);
        const now = Date.now();

        let shouldLock = false;
        if (timeoutMinutes === 0) {
            shouldLock = true;
        } else if (lastActive > 0) {
            const elapsedMinutes = (now - lastActive) / (1000 * 60);
            if (elapsedMinutes >= timeoutMinutes) {
                shouldLock = true;
            }
        }

        if (shouldLock) {
            if (lockTitle) lockTitle.innerText = 'Kunci PIN Aktif';
            if (lockDesc) lockDesc.innerText = 'Masukkan PIN Anda untuk melanjutkan.';
            if (lockModal) lockModal.style.display = 'flex';
        } else if (lockModal) {
            lockModal.style.display = 'none';
        }
    }
}

export async function checkUnlockPassword() {
    const inputElem = document.getElementById('lock-input-pass');
    const inputVal = inputElem ? inputElem.value.trim() : '';
    const errorMsg = document.getElementById('lock-error-msg');
    const storedHash = getRawStorage(STORAGE_KEYS.PASS_HASH);

    if (!inputVal) {
        if (errorMsg) {
            errorMsg.innerText = 'Harap masukkan sandi atau PIN!';
            errorMsg.style.display = 'block';
        }
        return;
    }

    const inputHash = await hashText(inputVal);

    if (inputHash === storedHash) {
        if (errorMsg) errorMsg.style.display = 'none';
        if (inputElem) inputElem.value = '';
        const lockModal = document.getElementById('lock-screen-modal');
        if (lockModal) lockModal.style.display = 'none';
        updateLastActiveTimestamp();

        const lockType = getRawStorage(STORAGE_KEYS.LOCK_TYPE) || 'default';
        if (lockType === 'default') {
            openPinConfigModal(true);
        }
    } else if (errorMsg) {
        errorMsg.innerText = 'Sandi atau PIN salah, silakan coba lagi.';
        errorMsg.style.display = 'block';
    }
}

export function openPinConfigModal(isFirstSetup = false) {
    const modal = document.getElementById('pin-config-modal');
    const cancelBtn = document.getElementById('btn-cancel-pin-config');
    const currentLockType = getRawStorage(STORAGE_KEYS.LOCK_TYPE) || 'default';
    const currentTimeout = localStorage.getItem('pecs_timeout_min') || '0';

    if (cancelBtn) {
        cancelBtn.style.display = isFirstSetup ? 'none' : 'block';
    }

    const pinRadio = document.querySelector('input[name="lock-mode-choice"][value="pin"]');
    const noneRadio = document.querySelector('input[name="lock-mode-choice"][value="none"]');

    if (currentLockType === 'none') {
        if (noneRadio) noneRadio.checked = true;
        togglePinInputGroup(false);
    } else {
        if (pinRadio) pinRadio.checked = true;
        togglePinInputGroup(true);
    }

    const timeoutSelect = document.getElementById('timeout-select');
    const newPinInput = document.getElementById('new-pin-input');
    const confirmPinInput = document.getElementById('confirm-pin-input');

    if (timeoutSelect) timeoutSelect.value = currentTimeout;
    if (newPinInput) newPinInput.value = '';
    if (confirmPinInput) confirmPinInput.value = '';

    if (modal) modal.classList.add('open');
}

export function closePinConfigModal() {
    const lockType = getRawStorage(STORAGE_KEYS.LOCK_TYPE) || 'default';
    if (lockType === 'default') {
        alert('Anda wajib memilih pengaturan PIN atau Tanpa Kunci untuk melanjutkan.');
        return;
    }
    const modal = document.getElementById('pin-config-modal');
    if (modal) modal.classList.remove('open');
}

export function togglePinInputGroup(showPinGroup) {
    const pinGroup = document.getElementById('pin-input-group');
    const timeoutGroup = document.getElementById('timeout-input-group');
    const displayValue = showPinGroup ? 'block' : 'none';
    if (pinGroup) pinGroup.style.display = displayValue;
    if (timeoutGroup) timeoutGroup.style.display = displayValue;
}

export async function savePinConfiguration() {
    const selectedMode = document.querySelector('input[name="lock-mode-choice"]:checked');
    if (!selectedMode) {
        alert('Pilih salah satu metode keamanan!');
        return;
    }

    const modeValue = selectedMode.value;
    const modal = document.getElementById('pin-config-modal');

    if (modeValue === 'none') {
        setRawStorage(STORAGE_KEYS.LOCK_TYPE, 'none');
        if (modal) modal.classList.remove('open');
        alert('Aplikasi sekarang diatur TANPA PIN.');
        return;
    }

    if (modeValue === 'pin') {
        const pinVal = document.getElementById('new-pin-input').value.trim();
        const confirmVal = document.getElementById('confirm-pin-input').value.trim();
        const timeoutVal = document.getElementById('timeout-select').value;

        if (!pinVal || pinVal.length < 4) {
            alert('PIN baru minimal harus 4 - 6 angka!');
            return;
        }

        if (pinVal !== confirmVal) {
            alert('Konfirmasi PIN tidak cocok! Silakan cek kembali.');
            return;
        }

        const newHash = await hashText(pinVal);
        setRawStorage(STORAGE_KEYS.PASS_HASH, newHash);
        setRawStorage(STORAGE_KEYS.LOCK_TYPE, 'pin');
        localStorage.setItem('pecs_timeout_min', timeoutVal);

        updateLastActiveTimestamp();
        if (modal) modal.classList.remove('open');
        alert('PIN baru berhasil disimpan dan diaktifkan!');
    }
}
