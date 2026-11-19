/* Fungsi: Membacakan teks menggunakan fitur suara bawaan peramban.
   Batasan: Memerlukan dukungan SpeechSynthesis pada perangkat pengguna. */

export function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    }
}
