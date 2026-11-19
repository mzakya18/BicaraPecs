/* Fungsi: Menangkap kesalahan tak terduga dan menampilkan pesan ramah berbahasa Indonesia baku.
   Batasan: Tidak memodifikasi data penyimpanan atau alur fitur secara langsung. */

export function formatFriendlyStorageError(error, contextLabel = 'menyimpan data') {
    const isQuotaExceeded =
        error &&
        (error.name === 'QuotaExceededError' ||
            error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
            error.code === 22 ||
            error.code === 1014);

    if (isQuotaExceeded) {
        return `Ruang penyimpanan perangkat penuh saat ${contextLabel}. Silakan hapus beberapa kartu atau riwayat yang tidak diperlukan terlebih dahulu.`;
    }

    return `Terjadi kendala saat ${contextLabel}. Data Anda yang sudah tersimpan tetap aman; silakan coba lagi.`;
}

export function showFriendlyNotice(message, title = 'Informasi') {
    const existingNotice = document.getElementById('friendly-error-banner');
    if (existingNotice) {
        existingNotice.remove();
    }

    const banner = document.createElement('div');
    banner.id = 'friendly-error-banner';
    banner.setAttribute('role', 'alert');
    banner.style.position = 'fixed';
    banner.style.bottom = '76px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%)';
    banner.style.width = 'calc(100% - 30px)';
    banner.style.maxWidth = '520px';
    banner.style.backgroundColor = 'var(--card-bg, #ffffff)';
    banner.style.color = 'var(--text-color, #1e293b)';
    banner.style.border = '2px solid #ef4444';
    banner.style.borderRadius = '12px';
    banner.style.padding = '14px 16px';
    banner.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.25)';
    banner.style.zIndex = '100000';
    banner.style.boxSizing = 'border-box';

    const heading = document.createElement('div');
    heading.style.fontWeight = 'bold';
    heading.style.marginBottom = '6px';
    heading.style.color = '#dc2626';
    heading.textContent = title;

    const bodyText = document.createElement('div');
    bodyText.style.fontSize = '0.92rem';
    bodyText.style.lineHeight = '1.45';
    bodyText.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'Tutup';
    closeBtn.style.marginTop = '10px';
    closeBtn.style.padding = '8px 14px';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '8px';
    closeBtn.style.backgroundColor = '#3b82f6';
    closeBtn.style.color = '#ffffff';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', () => {
        banner.remove();
    });

    banner.appendChild(heading);
    banner.appendChild(bodyText);
    banner.appendChild(closeBtn);

    if (document.body) {
        document.body.appendChild(banner);
    }
}

export function installGlobalErrorHandlers() {
    window.addEventListener('error', (event) => {
        console.error('Kesalahan aplikasi terdeteksi:', event.error || event.message);
        const hasVisibleContent = document.body && document.body.innerText.trim().length > 0;
        if (!hasVisibleContent) {
            showFriendlyNotice(
                'Terjadi gangguan tampilan pada aplikasi. Silakan muat ulang halaman; data Anda tetap aman.',
                'Gangguan Tampilan'
            );
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Proses latar belakang mengalami kendala:', event.reason);
        showFriendlyNotice(
            formatFriendlyStorageError(event.reason, 'memproses data aplikasi'),
            'Pemberitahuan Sistem'
        );
    });
}
