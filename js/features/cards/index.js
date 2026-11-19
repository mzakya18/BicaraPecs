/* Fungsi: Mengelola papan kartu PECS, mode edit, mode gambar saja, dan pencarian ARASAAC.
   Batasan: Menggunakan penyimpanan localStorage pada Tahap 1 dan tidak mengimpor fitur lain. */

import { STORAGE_KEYS } from '../../config.js';
import { basePecsDatabase } from '../../data/defaultCards.js';
import { idToEnDict } from '../../data/arasaacDict.js';
import { safeGetStorage, setJsonStorage } from '../../storage/localStore.js';
import { escapeHtml, compressImage, urlToBase64 } from '../../shared/helpers.js';

let isEditMode = false;
let isImageOnly = safeGetStorage(STORAGE_KEYS.IMG_ONLY, false);
let selectedArasaacUrl = null;
let editingCardId = null;

let userSettings = safeGetStorage(STORAGE_KEYS.SETTINGS, { level: 1, gender: 'L' });
let customImages = safeGetStorage(STORAGE_KEYS.CUSTOM_IMAGES, {});
let customLabels = safeGetStorage(STORAGE_KEYS.CUSTOM_LABELS, {});
let userCards = safeGetStorage(STORAGE_KEYS.USER_CARDS, []);
let deletedCardIds = safeGetStorage(STORAGE_KEYS.DELETED_CARDS, []);
let collapsedCategories = safeGetStorage(STORAGE_KEYS.COLLAPSED_CATS, {});

let onCardSelectCallback = null;

export function setCardSelectHandler(handler) {
    onCardSelectCallback = typeof handler === 'function' ? handler : null;
}

export function getUserSettings() {
    return userSettings;
}

export function saveAssessmentSettings(level, gender) {
    userSettings = { level, gender };
    setJsonStorage(STORAGE_KEYS.SETTINGS, userSettings);
    renderCategories();
}

export function syncAssessmentForm() {
    if (!userSettings) return;
    const radio = document.querySelector(`input[name="level"][value="${userSettings.level}"]`);
    if (radio) radio.checked = true;

    const genderSelect = document.getElementById('select-gender');
    if (genderSelect && userSettings.gender) {
        genderSelect.value = userSettings.gender;
    }
}

export function toggleEditMode(forceState) {
    if (typeof forceState === 'boolean') {
        isEditMode = forceState;
    } else {
        isEditMode = !isEditMode;
    }

    const btn = document.getElementById('edit-toggle-btn');
    const mainPage = document.getElementById('page-main');

    if (!btn || !mainPage) return;

    if (isEditMode) {
        btn.classList.add('active-mode');
        btn.innerHTML = '✅ Selesai';
        mainPage.classList.add('is-edit-mode');
    } else {
        btn.classList.remove('active-mode');
        btn.innerHTML = '⚙️ Edit';
        mainPage.classList.remove('is-edit-mode');
    }
}

export function toggleImageOnlyModeFromMenu() {
    isImageOnly = !isImageOnly;
    setJsonStorage(STORAGE_KEYS.IMG_ONLY, isImageOnly);
    updateImageOnlyState();
}

export function updateImageOnlyState() {
    const label = document.getElementById('img-only-label');
    if (isImageOnly) {
        document.body.classList.add('image-only-mode');
        if (label) {
            label.innerText = 'Aktif';
            label.style.color = '#10b981';
        }
    } else {
        document.body.classList.remove('image-only-mode');
        if (label) {
            label.innerText = 'Nonaktif';
            label.style.color = 'var(--primary)';
        }
    }
}

export function toggleCategoryCollapse(catKey) {
    collapsedCategories[catKey] = !collapsedCategories[catKey];
    setJsonStorage(STORAGE_KEYS.COLLAPSED_CATS, collapsedCategories);
    renderCategories();
}

export function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    container.innerHTML = '';

    let activeDatabase = JSON.parse(JSON.stringify(basePecsDatabase));

    if (Array.isArray(userCards)) {
        userCards.forEach((uCard) => {
            const targetCat = activeDatabase.find((c) => c.catKey === uCard.catKey);
            if (targetCat) {
                targetCat.items.push({
                    id: uCard.id,
                    word: uCard.word,
                    emoji: '🖼️',
                    isUserCreated: true
                });
                if (uCard.imageUrl) {
                    customImages[uCard.id] = uCard.imageUrl;
                }
            }
        });
    }

    activeDatabase.forEach((cat) => {
        if (cat.minLevel <= userSettings.level) {
            const filteredItems = cat.items.filter((item) => !deletedCardIds.includes(item.id));
            if (filteredItems.length === 0) return;

            const isCollapsed = !!collapsedCategories[cat.catKey];
            const catSection = document.createElement('div');
            catSection.className = `category ${isCollapsed ? 'collapsed' : ''}`;

            const header = document.createElement('div');
            header.className = 'category-header';
            header.innerHTML = `
                <h3>${cat.categoryTitle}</h3>
                <button class="toggle-cat-btn hide-on-lock" onclick="toggleCategoryCollapse('${cat.catKey}')">
                    ${isCollapsed ? '👁️ Tampilkan' : '🙈 Sembunyikan'}
                </button>
            `;
            catSection.appendChild(header);

            const grid = document.createElement('div');
            grid.className = 'grid';

            filteredItems.forEach((item) => {
                let defaultEmoji = item.emoji;
                if (typeof item.emoji === 'object') {
                    defaultEmoji = item.emoji[userSettings.gender] || item.emoji['L'];
                }

                const displayWord = customLabels[item.id] || item.word;
                const safeDisplayWord = escapeHtml(displayWord);

                const card = document.createElement('div');
                card.className = `pecs-card ${cat.type}`;
                card.id = `card_node_${item.id}`;

                const hasCustomImg = !!customImages[item.id];
                const visualContent = hasCustomImg
                    ? `<img src="${customImages[item.id]}" class="card-custom-img" alt="${safeDisplayWord}">`
                    : `<span class="emoji">${defaultEmoji}</span>`;

                card.onclick = () => {
                    if (!isEditMode) {
                        triggerCardFlash(`card_node_${item.id}`);
                        if (onCardSelectCallback) {
                            onCardSelectCallback(displayWord, defaultEmoji, customImages[item.id]);
                        }
                    }
                };

                card.innerHTML = `
                    ${visualContent}
                    <span class="word">${displayWord}</span>
                    <div class="edit-overlay">
                        <button class="btn-card-action" onclick="openChangeImageModal('${item.id}', event)">📷 Gambar</button>
                        <button class="btn-card-action btn-edit-text" onclick="editCardText('${item.id}', '${safeDisplayWord}', event)">✏️ Tulisan</button>
                        ${(hasCustomImg || customLabels[item.id]) ? `<button class="btn-card-action btn-reset-card" onclick="resetCardCustomization('${item.id}', event)">🔄 Reset</button>` : ''}
                        <button class="btn-card-action btn-delete-card" onclick="deleteCard('${item.id}', event)">🗑️ Hapus</button>
                    </div>
                `;
                grid.appendChild(card);
            });

            catSection.appendChild(grid);
            container.appendChild(catSection);
        }
    });
}

export function triggerCardFlash(elementId) {
    const elem = document.getElementById(elementId);
    if (elem) {
        elem.classList.add('card-active-flash');
        setTimeout(() => elem.classList.remove('card-active-flash'), 250);
    }
}

export function deleteCard(itemId, event) {
    if (event) event.stopPropagation();
    const confirmDelete = confirm('Apakah Anda yakin ingin menghapus kartu ini?');
    if (!confirmDelete) return;

    if (Array.isArray(userCards) && userCards.some((uc) => uc.id === itemId)) {
        userCards = userCards.filter((c) => c.id !== itemId);
        setJsonStorage(STORAGE_KEYS.USER_CARDS, userCards);
    } else if (!deletedCardIds.includes(itemId)) {
        deletedCardIds.push(itemId);
        setJsonStorage(STORAGE_KEYS.DELETED_CARDS, deletedCardIds);
    }

    delete customImages[itemId];
    delete customLabels[itemId];
    setJsonStorage(STORAGE_KEYS.CUSTOM_IMAGES, customImages);
    setJsonStorage(STORAGE_KEYS.CUSTOM_LABELS, customLabels);

    renderCategories();
}

export function openAddCardModal() {
    editingCardId = null;
    document.getElementById('modal-card-title').innerText = '➕ Tambah Kartu PECS Baru';
    document.getElementById('modal-cat-group').style.display = 'block';
    document.getElementById('modal-text-group').style.display = 'block';
    document.getElementById('btn-save-card').innerText = 'Simpan Kartu';
    document.getElementById('add-card-modal').classList.add('open');
}

export function openChangeImageModal(itemId, event) {
    if (event) event.stopPropagation();
    editingCardId = itemId;
    document.getElementById('modal-card-title').innerText = '📷 Ganti Gambar Kartu';
    document.getElementById('modal-cat-group').style.display = 'none';
    document.getElementById('modal-text-group').style.display = 'none';
    document.getElementById('btn-save-card').innerText = 'Simpan Gambar Baru';
    document.getElementById('add-card-modal').classList.add('open');
}

export function closeAddCardModal() {
    document.getElementById('add-card-modal').classList.remove('open');
    document.getElementById('new-card-text').value = '';
    document.getElementById('new-card-file').value = '';
    document.getElementById('arasaac-search-input').value = '';
    document.getElementById('arasaac-results').innerHTML = '';
    selectedArasaacUrl = null;
    editingCardId = null;
}

export function quickCategorySearch(keyword) {
    document.getElementById('arasaac-search-input').value = keyword;
    searchArasaac();
}

export async function searchArasaac() {
    const rawQuery = document.getElementById('arasaac-search-input').value.trim().toLowerCase();
    const resultsContainer = document.getElementById('arasaac-results');
    if (!rawQuery) {
        alert('Masukkan kata kunci pencarian!');
        return;
    }

    const query = idToEnDict[rawQuery] || rawQuery;
    resultsContainer.innerHTML = '<p style="grid-column: span 4; font-size:0.85rem; text-align:center; color:var(--text-color);">Mencari piktogram...</p>';

    try {
        let response = await fetch(`https://api.arasaac.org/v1/pictograms/en/search/${encodeURIComponent(query)}`);
        let data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            response = await fetch(`https://api.arasaac.org/v1/pictograms/id/search/${encodeURIComponent(rawQuery)}`);
            data = await response.json();
        }

        if (!Array.isArray(data) || data.length === 0) {
            resultsContainer.innerHTML = '<p style="grid-column: span 4; font-size:0.85rem; text-align:center; color:#ef4444;">Piktogram tidak ditemukan. Coba kata lain.</p>';
            return;
        }

        resultsContainer.innerHTML = '';
        data.slice(0, 8).forEach((item) => {
            const imgUrl = `https://static.arasaac.org/pictograms/${item._id}/${item._id}_300.png`;
            const imgElem = document.createElement('img');
            imgElem.src = imgUrl;
            imgElem.style.width = '100%';
            imgElem.style.aspectRatio = '1/1';
            imgElem.style.objectFit = 'contain';
            imgElem.style.border = '2px solid var(--card-border)';
            imgElem.style.borderRadius = '8px';
            imgElem.style.cursor = 'pointer';
            imgElem.style.background = '#fff';

            imgElem.onclick = () => {
                document.querySelectorAll('#arasaac-results img').forEach((el) => {
                    el.style.borderColor = 'var(--card-border)';
                });
                imgElem.style.borderColor = 'var(--primary)';
                selectedArasaacUrl = imgUrl;
            };

            resultsContainer.appendChild(imgElem);
        });
    } catch (err) {
        console.error('Gagal mengambil gambar ARASAAC:', err);
        resultsContainer.innerHTML = '<p style="grid-column: span 4; font-size:0.85rem; text-align:center; color:#ef4444;">Gagal terhubung ke server ARASAAC.</p>';
    }
}

export async function submitNewCustomCard() {
    const catKey = document.getElementById('new-card-category').value;
    const textVal = document.getElementById('new-card-text').value.trim();
    const fileInput = document.getElementById('new-card-file');

    if (editingCardId) {
        if (selectedArasaacUrl) {
            try {
                const base64Img = await urlToBase64(selectedArasaacUrl);
                customImages[editingCardId] = base64Img;
                setJsonStorage(STORAGE_KEYS.CUSTOM_IMAGES, customImages);
                closeAddCardModal();
                renderCategories();
                return;
            } catch (e) {
                console.error('Gagal mengonversi gambar:', e);
            }
        } else if (fileInput.files && fileInput.files.length > 0) {
            compressImage(fileInput.files[0], (compressedBase64) => {
                customImages[editingCardId] = compressedBase64;
                setJsonStorage(STORAGE_KEYS.CUSTOM_IMAGES, customImages);
                closeAddCardModal();
                renderCategories();
            });
            return;
        } else {
            alert('Pilih piktogram ARASAAC atau upload gambar terlebih dahulu!');
            return;
        }
    }

    if (!textVal) {
        alert('Tulisan/Label kartu tidak boleh kosong!');
        return;
    }

    if (selectedArasaacUrl) {
        try {
            const base64Img = await urlToBase64(selectedArasaacUrl);
            saveCardToStorage(catKey, textVal, base64Img);
            return;
        } catch (e) {
            console.error('Gagal mengonversi gambar ARASAAC:', e);
        }
    }

    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Pilih piktogram ARASAAC atau upload file foto terlebih dahulu!');
        return;
    }

    compressImage(fileInput.files[0], (compressedBase64) => {
        saveCardToStorage(catKey, textVal, compressedBase64);
    });
}

function saveCardToStorage(catKey, textVal, imageUrl) {
    const newCardId = 'custom_card_' + Date.now();
    const newCardObj = {
        id: newCardId,
        catKey,
        word: textVal,
        imageUrl
    };

    userCards.push(newCardObj);
    try {
        setJsonStorage(STORAGE_KEYS.USER_CARDS, userCards);
    } catch (err) {
        alert('Memori penyimpanan penuh. Coba hapus beberapa kartu lama.');
        return;
    }

    closeAddCardModal();
    renderCategories();
    alert('Kartu PECS baru berhasil ditambahkan!');
}

export function editCardText(itemId, currentText, event) {
    if (event) event.stopPropagation();
    const newText = prompt('Masukkan tulisan/nama baru untuk kartu ini:', currentText);
    if (newText !== null && newText.trim() !== '') {
        customLabels[itemId] = newText.trim();
        setJsonStorage(STORAGE_KEYS.CUSTOM_LABELS, customLabels);
        renderCategories();
    }
}

export function resetCardCustomization(itemId, event) {
    if (event) event.stopPropagation();
    delete customImages[itemId];
    delete customLabels[itemId];
    setJsonStorage(STORAGE_KEYS.CUSTOM_IMAGES, customImages);
    setJsonStorage(STORAGE_KEYS.CUSTOM_LABELS, customLabels);
    renderCategories();
}
