/* Fungsi: Mengatur perubahan dan pemuatan tema terang/gelap aplikasi.
   Batasan: Hanya mengelola atribut tema dan nilai penyimpanan tema. */

import { STORAGE_KEYS } from '../../config.js';
import { getRawStorage, setRawStorage } from '../../storage/localStore.js';

export function changeTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    setRawStorage(STORAGE_KEYS.THEME, theme);
}

export function initTheme() {
    const savedTheme = getRawStorage(STORAGE_KEYS.THEME);
    if (savedTheme) {
        const selectTheme = document.getElementById('theme-select');
        if (selectTheme) {
            selectTheme.value = savedTheme;
        }
        changeTheme(savedTheme);
    }
}
