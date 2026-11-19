/* Fungsi: Menyimpan daftar kategori dan kartu PECS bawaan aplikasi.
   Batasan: Hanya berisi data awal tanpa logika penyimpanan atau perubahan. */

export const basePecsDatabase = [
    {
        catKey: 'subjek',
        categoryTitle: '👤 Subjek',
        type: 'subjek',
        minLevel: 2,
        items: [
            { id: 's_saya', word: 'Saya', emoji: { L: '🙋‍♂️', P: '🙋‍♀️' } },
            { id: 's_bunda', word: 'Bunda', emoji: '👩' },
            { id: 's_ayah', word: 'Ayah', emoji: '👨' },
            { id: 's_terapis', word: 'Terapis', emoji: '🧑‍🏫' },
            { id: 's_teman', word: 'Teman', emoji: '🧑‍🤝‍🧑' }
        ]
    },
    {
        catKey: 'katakerja',
        categoryTitle: '🟢 Predikat (Kata Kerja Fungsional)',
        type: 'kata-kerja',
        minLevel: 2,
        items: [
            { id: 'v_mau', word: 'Mau', emoji: '🤲' },
            { id: 'v_minta', word: 'Minta', emoji: '🖐️' },
            { id: 'v_lihat', word: 'Lihat', emoji: '👁️' },
            { id: 'v_makan', word: 'Makan', emoji: '😋' },
            { id: 'v_minum', word: 'Minum', emoji: '🥤' },
            { id: 'v_main', word: 'Main', emoji: '🎲' },
            { id: 'v_duduk', word: 'Duduk', emoji: '🧘' },
            { id: 'v_berdiri', word: 'Berdiri', emoji: '🧍' },
            { id: 'v_bantu', word: 'Tolong', emoji: '🆘' },
            { id: 'v_buka', word: 'Buka', emoji: '📂' },
            { id: 'v_tutup', word: 'Tutup', emoji: '🔒' },
            { id: 'v_stop', word: 'Selesai', emoji: '🛑' },
            { id: 'v_tidur', word: 'Tidur', emoji: '😴' },
            { id: 'v_toilet', word: 'Toilet', emoji: '🚽' },
            { id: 'v_pipis', word: 'Pipis', emoji: '💧' },
            { id: 'v_bab', word: 'BAB', emoji: '💩' }
        ]
    },
    {
        catKey: 'benda_makanan',
        categoryTitle: '🍎 Objek: Makanan & Minuman',
        type: 'benda',
        minLevel: 1,
        items: [
            { id: 'o_air', word: 'Air', emoji: '💧' },
            { id: 'o_susu', word: 'Susu', emoji: '🥛' },
            { id: 'o_nasi', word: 'Nasi', emoji: '🍚' },
            { id: 'o_roti', word: 'Roti', emoji: '🍞' },
            { id: 'o_biskuit', word: 'Biskuit', emoji: '🍪' },
            { id: 'o_buah', word: 'Buah', emoji: '🍎' },
            { id: 'o_permen', word: 'Permen', emoji: '🍬' },
            { id: 'o_eskrim', word: 'Es Krim', emoji: '🍦' }
        ]
    },
    {
        catKey: 'benda_mainan',
        categoryTitle: '🧸 Objek: Mainan & Sensorik',
        type: 'benda',
        minLevel: 1,
        items: [
            { id: 'o_bola', word: 'Bola', emoji: '⚽' },
            { id: 'o_mobil', word: 'Mobil', emoji: '🚗' },
            { id: 'o_gelembung', word: 'Gelembung', emoji: '🫧' },
            { id: 'o_ayunan', word: 'Ayunan', emoji: '🛝' },
            { id: 'o_puzzle', word: 'Puzzle', emoji: '🧩' },
            { id: 'o_balok', word: 'Balok', emoji: '🧱' },
            { id: 'o_trampolin', word: 'Trampolin', emoji: '🤸' },
            { id: 'o_lilin', word: 'Lilin', emoji: '🎨' }
        ]
    },
    {
        catKey: 'benda_harian',
        categoryTitle: '📦 Objek: Benda Harian',
        type: 'benda',
        minLevel: 1,
        items: [
            { id: 'o_sendok', word: 'Sendok', emoji: '🥄' },
            { id: 'o_gelas', word: 'Gelas', emoji: '🥛' },
            { id: 'o_piring', word: 'Piring', emoji: '🍽️' },
            { id: 'o_baju', word: 'Baju', emoji: '👕' },
            { id: 'o_celana', word: 'Celana', emoji: '👖' },
            { id: 'o_sepatu', word: 'Sepatu', emoji: '👟' },
            { id: 'o_handuk', word: 'Handuk', emoji: '🧖' },
            { id: 'o_tisu', word: 'Tisu', emoji: '🧻' },
            { id: 'o_tas', word: 'Tas', emoji: '🎒' },
            { id: 'o_piyama', word: 'Piyama', emoji: '👕' }
        ]
    },
    {
        catKey: 'benda_media',
        categoryTitle: '📱 Objek: Media & Hiburan',
        type: 'benda',
        minLevel: 1,
        items: [
            { id: 'o_tablet', word: 'Tablet', emoji: '📱' },
            { id: 'o_musik', word: 'Musik', emoji: '🎵' },
            { id: 'o_video', word: 'Video', emoji: '📹' },
            { id: 'o_buku', word: 'Buku', emoji: '📖' }
        ]
    },
    {
        catKey: 'tempat',
        categoryTitle: '📍 Keterangan Tempat',
        type: 'tempat',
        minLevel: 3,
        items: [
            { id: 'k_kamar', word: 'Kamar', emoji: '🛏️' },
            { id: 'k_toilet', word: 'Toilet', emoji: '🚽' },
            { id: 'k_meja', word: 'Meja', emoji: '🪑' },
            { id: 'k_luar', word: 'Luar', emoji: '🌳' },
            { id: 'k_dalam', word: 'Dalam', emoji: '🏠' },
            { id: 'k_sekolah', word: 'Sekolah', emoji: '🏫' },
            { id: 'k_rumah', word: 'Rumah', emoji: '🏡' },
            { id: 'k_mobil', word: 'Mobil', emoji: '🚘' }
        ]
    },
    {
        catKey: 'perasaan',
        categoryTitle: '💬 Keterangan Keadaan / Sensorik',
        type: 'perasaan',
        minLevel: 3,
        items: [
            { id: 'ks_lapar', word: 'Lapar', emoji: '🤤' },
            { id: 'ks_haus', word: 'Haus', emoji: '🥤' },
            { id: 'ks_sakit', word: 'Sakit', emoji: '🤒' },
            { id: 'ks_capek', word: 'Capek', emoji: '😮‍💨' },
            { id: 'ks_panas', word: 'Panas', emoji: '🔥' },
            { id: 'ks_dingin', word: 'Dingin', emoji: '🧊' },
            { id: 'ks_bising', word: 'Bising', emoji: '🔊' },
            { id: 'ks_gatal', word: 'Gatal', emoji: '🐜' },
            { id: 'ks_nyaman', word: 'Nyaman', emoji: '😌' },
            { id: 'ks_takut', word: 'Takut', emoji: '😨' }
        ]
    },
    {
        catKey: 'sifat',
        categoryTitle: '🎨 Keterangan Sifat / Atribut',
        type: 'sifat',
        minLevel: 3,
        items: [
            { id: 'sa_besar', word: 'Besar', emoji: '🐘' },
            { id: 'sa_kecil', word: 'Kecil', emoji: '🐭' },
            { id: 'sa_banyak', word: 'Banyak', emoji: '🔢' },
            { id: 'sa_sedikit', word: 'Sedikit', emoji: '🤏' },
            { id: 'sa_merah', word: 'Merah', emoji: '🔴' },
            { id: 'sa_biru', word: 'Biru', emoji: '🔵' },
            { id: 'sa_kuning', word: 'Kuning', emoji: '🟡' },
            { id: 'sa_hijau', word: 'Hijau', emoji: '🟢' }
        ]
    },
    {
        catKey: 'waktu',
        categoryTitle: '⏱️ Keterangan Waktu / Urutan',
        type: 'waktu',
        minLevel: 3,
        items: [
            { id: 'w_sekarang', word: 'Sekarang', emoji: '⏰' },
            { id: 'w_nanti', word: 'Nanti', emoji: '⏳' },
            { id: 'w_lagi', word: 'Lagi', emoji: '🔄' },
            { id: 'w_selesai', word: 'Selesai', emoji: '✅' }
        ]
    }
];
