const STORAGE_KEY = 'nemuin_data';

const defaultData = [];

const setActiveNav = () => {
    const halaman = window.location.pathname.split('/').pop();
    document.querySelectorAll('nav a').forEach((a) => {
        a.classList.remove('active');
        if (a.getAttribute('href') === halaman) {
            a.classList.add('active');
        }
    });
};
setActiveNav();

const simpanData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const muatData = () => {
    const tersimpan = localStorage.getItem(STORAGE_KEY);
    return tersimpan ? JSON.parse(tersimpan) : defaultData;
};

let semuaBarang = muatData();
let idEdit = null; 
let filterAktif = 'semua';
let queryPencarian = '';

const idBaru = () =>
  semuaBarang.length > 0 ? Math.max(...semuaBarang.map((b) => b.id)) + 1 : 1;

const updateStatistik = () => {
  const elStatHilang = document.getElementById('stat-hilang');
  const elStatDitemukan = document.getElementById('stat-ditemukan');
  const elStatDikembalikan = document.getElementById('stat-dikembalikan');
  const elStatProses = document.getElementById('stat-proses');

  if (!elStatHilang) return; 

  const totalHilang = semuaBarang.filter((b) => b.jenis === 'hilang').length;
  const totalDitemukan = semuaBarang.filter((b) => b.jenis === 'ditemukan').length;
  const dikembalikan = semuaBarang.filter(
    (b) => b.status === 'Selesai' || b.status === 'Ditemukan'
  ).length;
  const dalamProses = semuaBarang.filter(
    (b) => b.status === 'Dalam Proses' || b.status === 'Dicari'
  ).length;

  elStatHilang.textContent = totalHilang;
  elStatDitemukan.textContent = totalDitemukan;
  elStatDikembalikan.textContent = dikembalikan;
  elStatProses.textContent = dalamProses;
};

const renderTabel = () => {
  const tbody = document.getElementById('isi-tabel');
  if (!tbody) return;

  const jenisHalaman = tbody.dataset.jenis || 'hilang';

  let data = semuaBarang.filter((b) => b.jenis === jenisHalaman);

  if (filterAktif !== 'semua') {
    data = data.filter((b) => b.kategori === filterAktif);
  }

  // 5. Pencarian real-time
    if (queryPencarian.trim() !== '') {
        const q = queryPencarian.toLowerCase();
        data = data.filter(
            (b) =>
              b.namaBarang.toLowerCase().includes(q) ||
              b.lokasi.toLowerCase().includes(q) ||
              b.pelapor.toLowerCase().includes(q)
      );
  }

tbody.innerHTML = data
  .map(
    (b, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${b.namaBarang}</td>
      <td>${b.lokasi}</td>
      <td>${b.pelapor}</td>
      <td>${b.kontak}</td>
      <td>
        <img
          src="${b.foto || 'gambar/placeholder.png'}"
          alt="Foto ${b.namaBarang}"
          width="70"
          loading="lazy"
          onerror="this.src='gambar/placeholder.png'; this.onerror=null;"
          style="border-radius:4px; object-fit:cover; height:50px;">
      </td>
      <td><span">${b.status}</span></td>
      <td>
        <button class="btn-edit" data-id="${b.id}">Edit</button>
        <button class="btn-hapus" data-id="${b.id}">Hapus</button>
      </td>
    </tr>`
  )
  .join('');

  const tfoot = tbody.closest('table').querySelector('tfoot td');
  if (tfoot) tfoot.textContent = `Menampilkan ${data.length} dari ${semuaBarang.filter((b) => b.jenis === jenisHalaman).length} barang`;

  updateStatistik();
};

const badgeKelas = (status) => {
    const map = {
        Dicari: 'badge-dicari',
        Ditemukan: 'badge-ketemu',
        Selesai: 'badge-selesai',
        'Dalam Proses': 'badge-proses',
    };
    return map[status] || '';
};

const formatTanggal = (tgl) => {

  
    const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const d = new Date(tgl);
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
};

// ngisi form
const validasiForm = (data) => {
    const errors = [];

    if (!data.pelapor.trim()) errors.push('Nama pelapor wajib diisi.');
    if (!data.kontak.trim()) errors.push('Kontak WA wajib diisi.');
    if (!/^08[0-9]{7,12}$/.test(data.kontak.trim()))
        errors.push('Nomor kontak tidak valid. Harus diawali 08 dan 9–14 digit.');
    if (!data.namaBarang.trim()) errors.push('Nama barang wajib diisi.');
    if (!data.lokasi.trim()) errors.push('Lokasi wajib diisi.');
    if (!data.jenis) errors.push('Jenis laporan (hilang/ditemukan) wajib dipilih.');

    return errors;
};

const tampilkanError = (errors) => {
  let el = document.getElementById('form-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'form-error';
    el.style.cssText =
      'background:#fdecea;border:1px solid #e74c3c;border-radius:6px;padding:12px 16px;margin-bottom:16px;color:#c0392b;font-size:0.9rem;';
    const form = document.querySelector('#upload form');
    if (form) form.prepend(el);
  }
  el.innerHTML = errors.map((e) => `<div>⚠ ${e}</div>`).join('');
  el.style.display = 'block';
};

const sembunyikanError = () => {
    const el = document.getElementById('form-error');
    if (el) el.style.display = 'none';
};

const handleFormSubmit = (e) => {
    e.preventDefault();
    const form = e.target;

    const dataForm = {
        pelapor: form.nama?.value || '',
        kontak: form.kontak?.value || '',
        namaBarang: form.barang?.value || '',
        lokasi: form.lokasi?.value || '',
        jenis: form.jenis?.value || '',
        status: form.status?.value || (form.jenis?.value === 'hilang' ? 'Dicari' : 'Dalam Proses'),
    };

    const errors = validasiForm(dataForm);
    if (errors.length > 0) {
        tampilkanError(errors);
        return;
    }
    sembunyikanError();

    if (idEdit !== null) {
        semuaBarang = semuaBarang.map((b) =>
        b.id === idEdit ? { ...b, ...dataForm } : b
        );
        idEdit = null;
        const btn = document.querySelector('#upload .btn-primary');
        if (btn) btn.textContent = 'Kirim Laporan';
        const info = document.getElementById('edit-info');
        if (info) info.remove();
    } else {
        semuaBarang.push({ id: idBaru(), ...dataForm });}

    simpanData(semuaBarang);
    form.reset();
    renderTabel();

  const tabel = document.getElementById('tabel-barang');
  if (tabel) tabel.scrollIntoView({ behavior: 'smooth' });};

const handleHapus = (id) => {
    const barang = semuaBarang.find((b) => b.id === id);
    if (!barang) return;

    const konfirmasi = confirm(
        `Yakin ingin menghapus laporan "${barang.namaBarang}"?\nTindakan ini tidak bisa dibatalkan.`
    );
    if (!konfirmasi) return;

    semuaBarang = semuaBarang.filter((b) => b.id !== id);
    simpanData(semuaBarang);
    renderTabel();
};

const handlePencarian = (e) => {
    queryPencarian = e.target.value;
    renderTabel();
};

const handleFilter = (e) => {
    filterAktif = e.target.value;
    renderTabel();
};

// edit
const setupEventDelegation = () => {
    const tbody = document.getElementById('isi-tabel');
    if (!tbody) return;

    tbody.addEventListener('click', (e) => {
        const btnEdit = e.target.closest('.btn-edit');
        const btnHapus = e.target.closest('.btn-hapus');

        if (btnEdit) {
        handleEdit(Number(btnEdit.dataset.id));
        } else if (btnHapus) {
        handleHapus(Number(btnHapus.dataset.id));
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#upload form');
    if (form) form.addEventListener('submit', handleFormSubmit);

    const inputCari = document.getElementById('search-input');
    if (inputCari) inputCari.addEventListener('input', handlePencarian);

    const selectFilter = document.getElementById('filter-kategori');
    if (selectFilter) selectFilter.addEventListener('change', handleFilter);

    setupEventDelegation();

    renderTabel();
    updateStatistik(); 

    console.log('NemuIn script.js dimuat. Total data:', semuaBarang.length); });

const buatModal = () => {
  if (document.getElementById('modal-edit')) return;
  const modal = document.createElement('div');
  modal.id = 'modal-edit';
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:white;border-radius:12px;padding:28px 32px;width:90%;max-width:480px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
      <h3 style="color:#1a3a5c;margin-bottom:16px;">✏ Edit Laporan</h3>
      <div id="modal-error" style="display:none;background:#fdecea;border:1px solid #e74c3c;border-radius:6px;padding:10px 14px;margin-bottom:12px;color:#c0392b;font-size:0.88rem;"></div>
      <div class="form-group"><label>Nama Pelapor</label><input type="text" id="m-nama" class="modal-input"></div>
      <div class="form-group"><label>Kontak WA</label><input type="text" id="m-kontak" class="modal-input"></div>
      <div class="form-group"><label>Nama Barang</label><input type="text" id="m-barang" class="modal-input"></div>
      <div class="form-group"><label>Lokasi</label><input type="text" id="m-lokasi" class="modal-input"></div>
      <div class="form-group"><label>Status</label>
        <select id="m-status" class="modal-input">
          <option value="Dicari">Dicari</option>
          <option value="Ditemukan">Ditemukan</option>
          <option value="Dalam Proses">Dalam Proses</option>
          <option value="Selesai">Selesai</option>
        </select>
      </div>
      <div style="display:flex;gap:10px;margin-top:20px;">
        <button id="modal-simpan" class="btn-primary" style="flex:1">Simpan Perubahan</button>
        <button id="modal-batal" class="btn-reset" style="flex:1">Batal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById('modal-batal').addEventListener('click', tutupModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) tutupModal(); });
  document.getElementById('modal-simpan').addEventListener('click', simpanDariModal);
};

const tutupModal = () => {
  const modal = document.getElementById('modal-edit');
  if (modal) { modal.style.display = 'none'; idEdit = null; }
};

const simpanDariModal = () => {
  const nama = document.getElementById('m-nama').value.trim();
  const kontak = document.getElementById('m-kontak').value.trim();
  const namaBarang = document.getElementById('m-barang').value.trim();
  const lokasi = document.getElementById('m-lokasi').value.trim();
  const status = document.getElementById('m-status').value;
  const errEl = document.getElementById('modal-error');

  const errs = [];
  if (!nama) errs.push('Nama wajib diisi.');
  if (!kontak) errs.push('Kontak wajib diisi.');
  if (!/^08[0-9]{7,12}$/.test(kontak)) errs.push('Kontak tidak valid, harus diawali 08.');
  if (!namaBarang) errs.push('Nama barang wajib diisi.');
  if (!lokasi) errs.push('Lokasi wajib diisi.');

  if (errs.length > 0) {
    errEl.innerHTML = errs.map(e => `<div>⚠ ${e}</div>`).join('');
    errEl.style.display = 'block';
    return;
  }

  semuaBarang = semuaBarang.map((b) =>
    b.id === idEdit ? { ...b, pelapor: nama, kontak, namaBarang, lokasi, status } : b
  );
  simpanData(semuaBarang);
  renderTabel();
  tutupModal();
};

const handleEdit = (id) => {
  const barang = semuaBarang.find((b) => b.id === id);
  if (!barang) return;
  idEdit = id;
  buatModal();

  document.getElementById('m-nama').value = barang.pelapor;
  document.getElementById('m-kontak').value = barang.kontak;
  document.getElementById('m-barang').value = barang.namaBarang;
  document.getElementById('m-lokasi').value = barang.lokasi;
  document.getElementById('m-status').value = barang.status;
  document.getElementById('modal-error').style.display = 'none';

  const modal = document.getElementById('modal-edit');
  modal.style.display = 'flex';
};