document.addEventListener('DOMContentLoaded', () => {

  const searchInput = document.getElementById('searchInput');
  const resultsDiv = document.getElementById('results');

  const menuToggle = document.getElementById('menu-toggle');
  const sidebarClose = document.getElementById('sidebar-close');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarList = document.getElementById('sidebar-list');

  let dataKalimat = [];
  let fuse = null;

  function openSidebar() {
    document.body.classList.add('sidebar-open');
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  if (menuToggle && sidebarClose && sidebar && sidebarOverlay) {
    menuToggle.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  function showMessage(text) {
    resultsDiv.innerHTML = '';
    const msg = document.createElement('div');
    msg.className = 'not-found';
    msg.textContent = text;
    msg.setAttribute('role', 'status'); 
    msg.setAttribute('aria-live', 'polite');
    resultsDiv.appendChild(msg);
  }

  function debounce(fn, wait = 200) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function displayResults(results) {
    resultsDiv.innerHTML = '';

    if (!results || results.length === 0) {
      showMessage('Kalimat tidak ditemukan.');
      return;
    }

    const frag = document.createDocumentFragment();

    results.forEach(item => {
      const row = document.createElement('div');
      row.className = 'result-item';

      const p = document.createElement('p');
      p.innerHTML = item.kalimat || '';

      const plainText = p.textContent || ''; 

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = 'Salin';
      btn.setAttribute('aria-label', `Salin kalimat: ${plainText.slice(0, 40)}...`);
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(plainText);
          const previous = btn.textContent;
          btn.textContent = 'Disalin!';
          btn.classList.add('copied');

          setTimeout(() => {
            btn.textContent = previous;
            btn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Gagal menyalin ke clipboard:', err);
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

  function initFuse() {
    if (typeof Fuse === 'undefined') {
      console.warn('Fuse.js tidak ditemukan...');
      return;
    }

    const options = {
      keys: ['jenis', 'kalimat', 'keyword'],
      includeScore: true,
      threshold: 0.2,                       
      ignoreLocation: true
    };

    fuse = new Fuse(dataKalimat, options);
  }

  function doSearch(term) {
    const searchTerm = String(term || '').trim();

    if (searchTerm.length < 2) {
      resultsDiv.innerHTML = '';
      return;
    }

    if (!fuse) {
      showMessage('Data belum siap. Harap tunggu sebentar.');
      return;
    }

    const searchResult = fuse.search(searchTerm);
    const finalResults = searchResult.map(r => r.item);

    displayResults(finalResults);
  }

  const debouncedHandler = debounce((e) => {
    doSearch(e.target.value);
  }, 180);

  if (searchInput) {
    searchInput.disabled = true;
    searchInput.setAttribute('aria-busy', 'true');
  } else {
    console.error('Elemen #searchInput tidak ditemukan di DOM.');
  }

  if (sidebarList) {
    sidebarList.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains('sidebar-link')) {
        const jenis = e.target.getAttribute('data-jenis');
        searchInput.value = jenis;
        doSearch(jenis);
        closeSidebar();
      }
    });
  }

  fetch('database.json')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      dataKalimat = Array.isArray(data) ? data : [];
      initFuse();

      populateSidebar(dataKalimat);

      if (searchInput) {
        searchInput.disabled = false;
        searchInput.removeAttribute('aria-busy');
        }
    })
    .catch(err => {
      console.error('Gagal memuat database.json:', err);
      showMessage('Gagal memuat data. Silakan refresh halaman.');
    });

  if (searchInput) {
    searchInput.addEventListener('input', debouncedHandler);
  }

function populateSidebar(data) {
    if (!sidebarList) return;
    const allJenis = data.map(item => item.jenis);
    const uniqueJenis = [...new Set(allJenis)];
    uniqueJenis.sort(); 
    uniqueJenis.forEach(jenis => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.textContent = jenis;
      button.className = 'sidebar-link';
      button.setAttribute('data-jenis', jenis);
      li.appendChild(button);
      sidebarList.appendChild(li);
    });
  }

});







