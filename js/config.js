/* Fungsi: Menyimpan nama kunci penyimpanan lokal dan konstanta aplikasi.
   Batasan: Tidak berisi logika manipulasi data atau tampilan. */

export const STORAGE_KEYS = {
    LAST_ACTIVE: 'pecs_last_active',
    LOCK_TYPE: 'pecs_lock_type',
    PASS_HASH: 'pecs_pass_hash',
    PIN_SALT: 'pecs_pin_salt',
    CHILD_LOCK: 'pecs_child_lock',
    IMG_ONLY: 'pecs_img_only',
    HISTORY: 'pecs_history',
    SETTINGS: 'pecs_settings',
    CUSTOM_IMAGES: 'pecs_custom_images',
    CUSTOM_LABELS: 'pecs_custom_labels',
    USER_CARDS: 'pecs_user_cards',
    DELETED_CARDS: 'pecs_deleted_cards',
    COLLAPSED_CATS: 'pecs_collapsed_cats',
    THEME: 'pecs_theme',
    ACTIVE_PAGE: 'pecs_active_page'
};

export const APP_CONFIG = {
    DEFAULT_PASS_PLAIN: 'bicarapecsby@zakymza18',
    HISTORY_MAX_AGE_MS: 86400000,
    IMAGE_MAX_DIM: 300,
    IMAGE_JPEG_QUALITY: 0.7
};
