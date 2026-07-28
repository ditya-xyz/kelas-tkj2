// ==========================================
// 1. EFEK SUARA / DERING NOTIFIKASI
// ==========================================
function playNotificationChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); 
    
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    // Diabaikan jika browser membatasi audio context sebelum interaksi
  }
}

// ==========================================
// 2. SISTEM LOGIN & OTORISASI
// ==========================================
let currentUserNis = "";

function cekStatusLogin() {
  if (sessionStorage.getItem('isLoggedIn') === 'true') {
    currentUserNis = sessionStorage.getItem('currentUserNis') || "";
    document.getElementById('loginScreen').style.display = 'none';
    bukaDashboard();
  }
}

function prosesLogin() {
  const inputVal = document.getElementById('nisInput').value.trim();
  if(inputVal === "") return alert("Kolom tidak boleh kosong!");

  if(inputVal === "admin123") {
    sessionStorage.setItem('role', 'admin'); 
    sessionStorage.setItem('currentUserNis', 'admin');
  } else if (!isNaN(inputVal) && inputVal.length >= 2) {
    sessionStorage.setItem('role', 'student'); 
    sessionStorage.setItem('currentUserNis', inputVal);
  } else {
    return alert("Format salah. Masukkan NIS berupa angka atau 'admin123'.");
  }

  playNotificationChime();
  sessionStorage.setItem('isLoggedIn', 'true');
  currentUserNis = sessionStorage.getItem('currentUserNis');
  document.getElementById('loginScreen').style.display = 'none';
  bukaDashboard();
}

function handleEnter(e) { if (e.key === "Enter") prosesLogin(); }

function bukaDashboard() {
  document.getElementById('loadingScreen').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('dashboardApp').style.display = 'block';
    
    const role = sessionStorage.getItem('role');
    const roleDisplay = document.getElementById('roleDisplay');
    
    if(role === 'admin') {
      roleDisplay.innerText = "Level: ADMINISTRATOR TKJ";
    } else {
      roleDisplay.innerText = "Level: SISWA (NIS: " + currentUserNis + ")";
      // Sembunyikan tombol khusus admin jika user adalah siswa
      const styleHide = document.createElement('style');
      styleHide.innerHTML = `.admin-only { display: none !important; }`;
      document.head.appendChild(styleHide);
    }
    
    renderData();
  }, 600); 
}

function prosesLogout() {
  sessionStorage.clear();
  location.reload();
}

// ==========================================
// 3. PEMUTAR MUSIK & KONVERTER MP3 TO URL
// ==========================================
let playlist = JSON.parse(localStorage.getItem('tkjPlaylistV5')) || [
  { name: "Lofi Network Beats", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }
];
let currentTrack = 0;
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const trackName = document.getElementById('trackName');

function loadTrack(index) {
  if(playlist.length === 0) return;
  audioPlayer.src = playlist[index].url;
  trackName.innerText = playlist[index].name;
}

function togglePlay() {
  if(playlist.length === 0) return alert("Playlist kosong! Tambahkan lagu via Konverter MP3.");
  if (audioPlayer.paused) {
    if(!audioPlayer.src) loadTrack(currentTrack);
    audioPlayer.play().catch(() => alert("Gagal memutar audio. Pastikan file valid."));
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  } else {
    audioPlayer.pause();
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
}

function nextTrack() {
  if(playlist.length === 0) return;
  currentTrack = (currentTrack + 1) % playlist.length;
  loadTrack(currentTrack);
  audioPlayer.play();
  playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
}

function prevTrack() {
  if(playlist.length === 0) return;
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
  loadTrack(currentTrack);
  audioPlayer.play();
  playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
}

function prosesKonversiMp3() {
  const judul = document.getElementById('konvJudul').value.trim();
  const fileInput = document.getElementById('konvFile');
  if(!judul || !fileInput.files[0]) return alert("Judul dan file MP3 wajib diisi!");

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Url = e.target.result;
    playlist.push({ name: judul, url: base64Url });
    localStorage.setItem('tkjPlaylistV5', JSON.stringify(playlist));
    playNotificationChime();
    alert("Berhasil mengkonversi MP3 ke URL dan menambahkannya ke playlist!");
    closeModal('modalKonverter');
    document.getElementById('konvJudul').value = "";
    document.getElementById('konvFile').value = "";
    if(audioPlayer.paused && playlist.length === 1) {
      loadTrack(0);
    }
  };
  reader.readAsDataURL(fileInput.files[0]);
}

// ==========================================
// 4. DATABASE & RENDER DATA
// ==========================================
let dbTKJ = JSON.parse(localStorage.getItem('tkjDatabaseV5')) || {
  broadcast: "Selamat datang di Portal Profesional TKJ! Jaga kekompakan dan tetap semangat belajar.",
  visi: "Menjadi kelas unggulan yang kompeten di bidang Teknik Komputer dan Jaringan serta berakhlak mulia.",
  keyakinan: "1. Saling menghargai sesama warga kelas.\n2. Disiplin dalam praktikum & pengumpulan tugas.\n3. Menjaga kebersihan lab dan ruang kelas.",
  tugas: [{ judul: "Konfigurasi Mikrotik VLAN", deadline: "Besok" }],
  jadwalPelajaran: "Senin: Komjar & Basis Data\nSelasa: Administrasi Server\nRabu: Pemrograman Web\nKamis: Jaringan Nirkabel",
  jadwalPiket: "Senin: Budi, Siska\nSelasa: Joko, Rian\nRabu: Siti, Doni",
  penghargaan: [{ nama: "Tim Cyber TKJ", ket: "Juara LKS Jaringan Komputer" }],
  siswa: [],
  galeri: []
};

function simpanDatabase() {
  localStorage.setItem('tkjDatabaseV5', JSON.stringify(dbTKJ));
  renderData();
}

function renderData() {
  const bEl = document.getElementById('broadcastTextDisplay');
  if(bEl) bEl.innerText = dbTKJ.broadcast || "Tidak ada pengumuman.";

  document.getElementById('visiContent').innerText = dbTKJ.visi || "Belum diatur.";
  document.getElementById('keyakinanContent').innerText = dbTKJ.keyakinan || "Belum diatur.";

  const tContainer = document.getElementById('tugasContainer');
  tContainer.innerHTML = dbTKJ.tugas.length === 0 ? '<div style="color:var(--text-muted);">Belum ada misi.</div>' : '';
  dbTKJ.tugas.forEach((t, i) => {
    tContainer.innerHTML += `
      <div class="card">
        <button class="btn btn-danger delete-btn admin-only" onclick="hapusTugas(${i})"><i class="fa-solid fa-trash"></i></button>
        <div class="task-title">${t.judul}</div>
        <div class="task-deadline"><i class="fa-regular fa-clock"></i> ${t.deadline}</div>
      </div>`;
  });

  document.getElementById('jadwalContent').innerText = dbTKJ.jadwalPelajaran || "Belum diatur.";
  document.getElementById('piketContent').innerText = dbTKJ.jadwalPiket || "Belum diatur.";

  const pContainer = document.getElementById('penghargaanContainer');
  pContainer.innerHTML = dbTKJ.penghargaan.length === 0 ? '<div style="color:var(--text-muted);">Belum ada penghargaan.</div>' : '';
  dbTKJ.penghargaan.forEach((p, i) => {
    pContainer.innerHTML += `
      <div class="card" style="text-align:center;">
        <button class="btn btn-danger delete-btn admin-only" onclick="hapusPenghargaan(${i})"><i class="fa-solid fa-trash"></i></button>
        <div style="font-size:2.2rem; color:var(--primary); margin-bottom:8px;"><i class="fa-solid fa-award"></i></div>
        <div class="student-name">${p.nama}</div>
        <div style="font-size:0.85rem; color:var(--text-muted);">${p.ket}</div>
      </div>`;
  });

  const sContainer = document.getElementById('siswaContainer');
  sContainer.innerHTML = dbTKJ.siswa.length === 0 ? '<div style="color:var(--text-muted);">Direktori anggota kosong. Silakan daftarkan nama dan foto Anda melalui tombol di atas.</div>' : '';
  dbTKJ.siswa.forEach((s, i) => {
    const fotoUrl = s.foto ? s.foto : 'https://dummyimage.com/400x400/1c1917/f97316&text=NO+PHOTO';
    let tombolHapusAdmin = (sessionStorage.getItem('role') === 'admin') ? `<button class="btn btn-danger delete-btn" onclick="hapusSiswa(${i})"><i class="fa-solid fa-trash"></i></button>` : '';

    sContainer.innerHTML += `
      <div class="card" style="text-align:center;">
        ${tombolHapusAdmin}
        <img src="${fotoUrl}" class="student-img">
        <div class="student-name">${s.nama}</div>
        <div class="student-nis">NIS: ${s.nis}</div>
      </div>`;
  });

  const gContainer = document.getElementById('galeriContainer');
  gContainer.innerHTML = dbTKJ.galeri.length === 0 ? '<div style="color:var(--text-muted);">Belum ada dokumentasi galeri.</div>' : '';
  dbTKJ.galeri.forEach((g, i) => {
    gContainer.innerHTML += `
      <div class="card">
        <button class="btn btn-danger delete-btn admin-only" onclick="hapusGaleri(${i})"><i class="fa-solid fa-trash"></i></button>
        <img src="${g.foto}" class="gallery-img">
        <div style="font-size:0.85rem; text-align:center; color:var(--text-muted);">${g.ket}</div>
      </div>`;
  });
}

function openModal(id) {
  if(id === 'modalBroadcast') document.getElementById('inputBroadcastText').value = dbTKJ.broadcast || "";
  if(id === 'modalVisi') document.getElementById('inputVisiText').value = dbTKJ.visi || "";
  if(id === 'modalKeyakinan') document.getElementById('inputKeyakinanText').value = dbTKJ.keyakinan || "";
  document.getElementById(id).style.display = 'flex';
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function saveVisi() {
  dbTKJ.visi = document.getElementById('inputVisiText').value;
  simpanDatabase();
  closeModal('modalVisi');
}
function saveKeyakinan() {
  dbTKJ.keyakinan = document.getElementById('inputKeyakinanText').value;
  simpanDatabase();
  closeModal('modalKeyakinan');
}
function saveBroadcast() {
  dbTKJ.broadcast = document.getElementById('inputBroadcastText').value;
  simpanDatabase();
  playNotificationChime();
  closeModal('modalBroadcast');
}
function saveTugas() {
  const judul = document.getElementById('tugasJudul').value;
  const deadline = document.getElementById('tugasDeadline').value;
  if(!judul) return alert("Judul wajib!");
  dbTKJ.tugas.push({ judul, deadline });
  simpanDatabase();
  closeModal('modalTugas');
  document.getElementById('tugasJudul').value = "";
  document.getElementById('tugasDeadline').value = "";
}
function hapusTugas(i) { if(confirm("Hapus misi ini?")) { dbTKJ.tugas.splice(i,1); simpanDatabase(); } }

function saveJadwal() {
  dbTKJ.jadwalPelajaran = document.getElementById('inputJadwalText').value;
  simpanDatabase();
  closeModal('modalJadwal');
}
function savePiket() {
  dbTKJ.jadwalPiket = document.getElementById('inputPiketText').value;
  simpanDatabase();
  closeModal('modalPiket');
}
function savePenghargaan() {
  const nama = document.getElementById('penghargaanNama').value;
  const ket = document.getElementById('penghargaanKet').value;
  if(!nama) return alert("Nama wajib diisi!");
  dbTKJ.penghargaan.push({ nama, ket });
  simpanDatabase();
  closeModal('modalPenghargaan');
  document.getElementById('penghargaanNama').value = "";
  document.getElementById('penghargaanKet').value = "";
}
function hapusPenghargaan(i) { if(confirm("Hapus penghargaan ini?")) { dbTKJ.penghargaan.splice(i,1); simpanDatabase(); } }

// Fungsi Siswa mendaftar / memperbarui foto sendiri secara mandiri
function prosesSimpanMandiriSiswa() {
  const nama = document.getElementById('mandiriNama').value.trim();
  const nis = document.getElementById('mandiriNis').value.trim();
  const fileInput = document.getElementById('mandiriFotoFile');
  
  if(!nama || !nis) return alert("Nama dan NIS wajib diisi!");

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      simpanDataSiswaKeDb(nama, nis, e.target.result);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    // Jika tidak ganti foto, cari foto lama jika ada
    const existing = dbTKJ.siswa.find(s => s.nis === nis);
    const oldFoto = existing ? existing.foto : "";
    simpanDataSiswaKeDb(nama, nis, oldFoto);
  }
}

function simpanDataSiswaKeDb(nama, nis, fotoBase64) {
  const index = dbTKJ.siswa.findIndex(s => s.nis === nis);
  if (index !== -1) {
    dbTKJ.siswa[index].nama = nama;
    if(fotoBase64) dbTKJ.siswa[index].foto = fotoBase64;
  } else {
    dbTKJ.siswa.push({ nama, nis, foto: fotoBase64 });
  }
  simpanDatabase();
  playNotificationChime();
  alert("Profil berhasil disimpan/diperbarui!");
  closeModal('modalDaftarSiswa');
  document.getElementById('mandiriNama').value = "";
  document.getElementById('mandiriNis').value = "";
  document.getElementById('mandiriFotoFile').value = "";
}

function saveSiswaDataAdmin() {
  const nama = document.getElementById('siswaNama').value.trim();
  const nis = document.getElementById('siswaNis').value.trim();
  const fileInput = document.getElementById('siswaFotoFile');
  if(!nama || !nis) return alert("Nama dan NIS wajib diisi!");

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      dbTKJ.siswa.push({ nama, nis, foto: e.target.result });
      simpanDatabase();
      closeModal('modalSiswa');
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    dbTKJ.siswa.push({ nama, nis, foto: "" });
    simpanDatabase();
    closeModal('modalSiswa');
  }
}

function hapusSiswa(i) { if(confirm("Hapus data siswa ini?")) { dbTKJ.siswa.splice(i,1); simpanDatabase(); } }

function saveGaleriPhoto() {
  const ket = document.getElementById('galeriKet').value;
  const fileInput = document.getElementById('galeriFile');
  if(!fileInput.files[0]) return alert("Pilih foto terlebih dahulu!");

  const reader = new FileReader();
  reader.onload = function(e) {
    dbTKJ.galeri.push({ foto: e.target.result, ket });
    simpanDatabase();
    closeModal('modalGaleri');
    document.getElementById('galeriKet').value = "";
    document.getElementById('galeriFile').value = "";
  };
  reader.readAsDataURL(fileInput.files[0]);
}
function hapusGaleri(i) { if(confirm("Hapus foto galeri ini?")) { dbTKJ.galeri.splice(i,1); simpanDatabase(); } }

function toggleAIChat() {
  const chat = document.getElementById('aiChatWindow');
  chat.style.display = (chat.style.display === 'flex') ? 'none' : 'flex';
}

function sendAIMessage() {
  const inputEl = document.getElementById('aiInput');
  const userText = inputEl.value.trim();
  if(!userText) return;

  const chatBox = document.getElementById('aiMessages');
  chatBox.innerHTML += `<div class="msg user-msg">${userText}</div>`;
  inputEl.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;

  setTimeout(() => {
    let balasan = "Routing dan subnetting aman! Ada hal teknis lain yang ingin didiskusikan?";
    if(userText.toLowerCase().includes('tugas') || userText.toLowerCase().includes('misi')) {
      balasan = "Silakan cek bagian Misi & Tugas di atas untuk melihat tenggat waktu penugasan terbaru.";
    }
    chatBox.innerHTML += `<div class="msg ai-msg">${balasan}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 1000);
}

// Inisialisasi awal
cekStatusLogin();
