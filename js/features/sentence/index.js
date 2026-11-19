/* Fungsi: Mengelola penyusunan kartu pada jalur kalimat, penghapusan, dan pembacaan suara.
   Batasan: Tidak mengelola riwayat kata atau daftar kategori kartu secara langsung. */

import { escapeHtml } from '../../shared/helpers.js';
import { speakText } from '../../shared/speech.js';

let currentSentence = [];
let lastClickTime = 0;
let onWordAddedCallback = null;

export function setSentenceWordAddedHandler(handler) {
    onWordAddedCallback = typeof handler === 'function' ? handler : null;
}

export function addToSentence(word, emoji, customImgUrl) {
    const currentTime = new Date().getTime();
    if (currentTime - lastClickTime < 400) return;
    lastClickTime = currentTime;

    currentSentence.push({ word, emoji, customImgUrl });
    if (onWordAddedCallback) {
        onWordAddedCallback(word);
    }
    updateSentenceStrip();
    speakText(word);
}

export function updateSentenceStrip() {
    const strip = document.getElementById('sentence-strip');
    if (!strip) return;

    if (currentSentence.length === 0) {
        strip.innerHTML = '<span style="color: #94a3b8; width: 100%; text-align: center; font-size: 0.95rem;" id="placeholder-text">Ketuk gambar di bawah untuk menyusun kalimat...</span>';
        return;
    }

    strip.innerHTML = '';
    currentSentence.forEach((item, index) => {
        const elem = document.createElement('div');
        elem.className = 'sentence-item';
        elem.onclick = () => removeFromSentence(index);

        const visualContent = item.customImgUrl
            ? `<img src="${item.customImgUrl}" class="card-custom-img" alt="${escapeHtml(item.word)}">`
            : `<span class="emoji">${item.emoji}</span>`;

        elem.innerHTML = `
            <span class="item-remove-btn" title="Hapus kata ini">×</span>
            ${visualContent}
            <span class="word">${item.word}</span>
        `;
        strip.appendChild(elem);
    });
}

export function removeFromSentence(index) {
    currentSentence.splice(index, 1);
    updateSentenceStrip();
}

export function clearSentence() {
    currentSentence = [];
    updateSentenceStrip();
}

export function speakSentence() {
    if (currentSentence.length === 0) return;
    const teksBicara = currentSentence.map((item) => item.word).join(' ');
    speakText(teksBicara);
}
