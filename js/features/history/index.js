/* Fungsi: Menyimpan, menyaring, dan menampilkan riwayat kata dalam 24 jam terakhir.
   Batasan: Hanya mengelola data dan tampilan daftar riwayat kata. */

import { APP_CONFIG, STORAGE_KEYS } from '../../config.js';
import { safeGetStorage, setJsonStorage } from '../../storage/localStore.js';
import { escapeHtml } from '../../shared/helpers.js';

let wordHistory = safeGetStorage(STORAGE_KEYS.HISTORY, []);

export function saveToHistory(word) {
    const now = new Date().getTime();
    wordHistory.unshift({ word, timestamp: now });
    wordHistory = wordHistory.filter((item) => (now - item.timestamp) < APP_CONFIG.HISTORY_MAX_AGE_MS);
    setJsonStorage(STORAGE_KEYS.HISTORY, wordHistory);
}

export function renderHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    const now = new Date().getTime();
    wordHistory = wordHistory.filter((item) => (now - item.timestamp) < APP_CONFIG.HISTORY_MAX_AGE_MS);

    if (wordHistory.length === 0) {
        historyList.innerHTML = '<p style="text-align:center; color:#94a3b8;">Belum ada riwayat kata hari ini.</p>';
        return;
    }

    historyList.innerHTML = wordHistory.map((item) => {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return `
            <div class="history-item">
                <span class="word">${escapeHtml(item.word)}</span>
                <span class="time">${timeStr}</span>
            </div>
        `;
    }).join('');
}
