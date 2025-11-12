document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsDiv = document.getElementById('results');
    let dataKalimat = [];

    // Ambil data dari database.json
    fetch('database.json')
        .then(response => response.json())
        .then(data => {
            dataKalimat = data;
        })
        .catch(error => console.error('Error memuat data:', error));

    // 2. Fungsi untuk menampilkan hasil
    function displayResults(results) {
        resultsDiv.innerHTML = ''; // Kosongkan hasil sebelumnya
        if (results.length > 0) {
            results.forEach(item => {
                const div = document.createElement('div');
                div.className = 'result-item';

                // Elemen untuk teks kalimat
                const p = document.createElement('p');
                p.textContent = item.kalimat;

                // Tombol Salin
                const button = document.createElement('button');
                button.textContent = 'Salin';
                button.onclick = () => {
                    navigator.clipboard.writeText(item.kalimat).then(() => {
                        button.textContent = 'Disalin!';
                        setTimeout(() => {
                            button.textContent = 'Salin';
                        }, 2000); // Kembali ke 'Salin' setelah 2 detik
                    });
                };

                div.appendChild(p);
                div.appendChild(button);
                resultsDiv.appendChild(div);
            });
        } else {
            resultsDiv.innerHTML = '<div>Kalimat tidak ditemukan.</div>';
        }
    }

    // 3. Event listener untuk input pencarian
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        if (searchTerm.length < 2) { // Hanya cari jika lebih dari 1 huruf
            resultsDiv.innerHTML = '';
            return;
        }

        // Konfigurasi Fuse.js untuk fuzzy search
        const options = {
            keys: ['keyword', 'kalimat'],
            includeScore: true,
            threshold: 0.4 // Atur tingkat toleransi (0.0 = persis, 1.0 = sangat longgar)
        };

        const fuse = new Fuse(dataKalimat, options);
        const searchResult = fuse.search(searchTerm);
        
        // Ubah format hasil dari Fuse ke format data asli
        const finalResults = searchResult.map(result => result.item);

        displayResults(finalResults);
    });
});