document.addEventListener('DOMContentLoaded', () => {

  // ----- Ambil elemen penting dari halaman -----
  const searchInput = document.getElementById('searchInput');
  const resultsDiv = document.getElementById('results');

  // ----- State aplikasi -----
  let dataKalimat = [];   // akan menampung array dari database.json
  let fuse = null;        // instance Fuse.js (dibuat sekali setelah data dimuat)

  // ----- Helper: menampilkan pesan dengan elemen yang bisa dibaca screen reader -----
  function showMessage(text) {
    resultsDiv.innerHTML = ''; // bersihkan dulu
    const msg = document.createElement('div');
    msg.className = 'not-found';
    msg.textContent = text;
    msg.setAttribute('role', 'status');       // agar pembaca layar tahu ada perubahan
    msg.setAttribute('aria-live', 'polite');  // beri tahu pembaca layar perlahan-lahan
    resultsDiv.appendChild(msg);
  }

  // ----- Helper: fungsi debounce (tunda eksekusi sampai pengguna berhenti mengetik) -----
  function debounce(fn, wait = 200) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // ----- Render hasil ke DOM (aman: selalu gunakan textContent untuk teks) -----
  function displayResults(results) {
    resultsDiv.innerHTML = ''; // kosongkan hasil lama

    if (!results || results.length === 0) {
      showMessage('Kalimat tidak ditemukan.');
      return;
    }

    // Gunakan DocumentFragment untuk performa saat menambahkan banyak elemen
    const frag = document.createDocumentFragment();

    results.forEach(item => {
      const row = document.createElement('div');
      row.className = 'result-item';

      // Paragraf untuk menampilkan kalimat
      const p = document.createElement('p');
      p.textContent = item.kalimat || '';

      // Tombol salin, beri atribut untuk aksesibilitas
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = 'Salin';
      // aria-label membantu pembaca layar mengetahui tindakan tombol
      btn.setAttribute('aria-label', `Salin kalimat: ${item.kalimat ? item.kalimat.slice(0, 40) : ''}`);

      // Handler salin dengan async/await dan penanganan error
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(item.kalimat || '');
          const previous = btn.textContent;
          btn.textContent = 'Disalin!';
          btn.classList.add('copied');

          setTimeout(() => {
            btn.textContent = previous;
            btn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Gagal menyalin ke clipboard:', err);
          // Umpan balik sederhana jika clipboard tidak tersedia
          btn.textContent = 'Gagal';
          setTimeout(() => {
            btn.textContent = 'Salin';
          }, 2000);
        }
      });

      row.appendChild(p);
      row.appendChild(btn);
      frag.appendChild(row);
    });

    resultsDiv.appendChild(frag);
  }

  // ----- Inisialisasi Fuse sekali (dipanggil setelah dataKalimat tersedia) -----
  function initFuse() {
    // Pastikan Fuse sudah dimuat (jika tidak, peringatan di console)
    if (typeof Fuse === 'undefined') {
      console.warn('Fuse.js tidak ditemukan. Pastikan script Fuse dimuat di HTML sebelum script ini.');
      return;
    }

    const options = {
      keys: ['jenis','kalimat', 'keyword'], // kolom yang dicari
      includeScore: true,
      threshold: 0.3                // toleransi fuzzy (0.0 = exact, 1.0 = very loose)
      ignoreLocation: true
    };

    fuse = new Fuse(dataKalimat, options);
  }

  // ----- Fungsi pencarian utama (dipanggil setelah debounce) -----
  function doSearch(term) {
    const searchTerm = String(term || '').trim();

    // jika input kurang dari 2 karakter, kosongkan hasil
    if (searchTerm.length < 2) {
      resultsDiv.innerHTML = '';
      return;
    }

    // jika fuse belum siap, tampilkan pesan
    if (!fuse) {
      showMessage('Data belum siap. Harap tunggu sebentar.');
      return;
    }

    // lakukan pencarian dan ambil objek item dari setiap hasil
    const searchResult = fuse.search(searchTerm);
    const finalResults = searchResult.map(r => r.item);

    displayResults(finalResults);
  }

  // ----- Debounced handler untuk event input -----
  const debouncedHandler = debounce((e) => {
    doSearch(e.target.value);
  }, 180);

  // ----- Disable input sampai data selesai dimuat (menghindari kebingungan) -----
  if (searchInput) {
    searchInput.disabled = true;
    searchInput.setAttribute('aria-busy', 'true');
  } else {
    console.error('Elemen #searchInput tidak ditemukan di DOM.');
  }

  // ----- Ambil data dari database.json lalu inisialisasi Fuse -----
  fetch('database.json')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Pastikan format data adalah array
      dataKalimat = Array.isArray(data) ? data : [];
      initFuse();

      // Aktifkan kembali input setelah data siap
      if (searchInput) {
        searchInput.disabled = false;
        searchInput.removeAttribute('aria-busy');
        }
    })
    .catch(err => {
      console.error('Gagal memuat database.json:', err);
      showMessage('Gagal memuat data. Silakan refresh halaman.');
      // biarkan input tetap disabled agar user tidak bingung
    });

  // ----- Pasang event listener input (jika elemen ada) -----
  if (searchInput) {
    searchInput.addEventListener('input', debouncedHandler);
  }

}); // end DOMContentLoaded



