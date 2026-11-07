/**
 * MAIN JAVASCRIPT - PUBLIC LANDING PAGE KELAS 9E
 * Modern, Interaktif, Aesthetic, dan Responsive
 */

let appData = null;
let currentDayFilter = 'Senin';
let currentCategoryFilter = 'all';
let currentMemberSearch = '';
let currentAbsenFilter = 'all';
let currentScheduleMode = 'pelajaran'; // 'pelajaran' | 'piket'
let currentLightboxIndex = 0;

// Initialize on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initClock();
  initNavbarScroll();
  initMobileMenu();
  initBackToTop();
  loadData();
});

// =================== DATA FETCHING ===================
async function loadData() {
  try {
    const res = await fetch('/api/data');
    const result = await res.json();
    if (!res.ok || !result.success || !result.data) {
      throw new Error(result.message || `HTTP ${res.status}`);
    }
    appData = result.data;
    renderAll();
  } catch (err) {
    console.error('Gagal memuat data website dari Supabase:', err);
  }
}

function getFallbackData() {
  return {
    siteInfo: {
      className: "9E - PROJECT",
      schoolName: "SMP Perguruan Rakyat 1",
      motto: "Bersatu Dalam Langkah, Berprestasi Menggapai Impian",
      shortDescription: "Komunitas pembelajar aktif, kreatif, solid, dan berakhlak mulia di Kelas 9E. Wadah kebersamaan untuk tumbuh mengasah potensi, berkolaborasi, dan menorehkan kenangan tak terlupakan di masa putih-biru.",
      exploreButtonText: "Explore Our Class",
      galleryButtonText: "View Gallery",
      heroImage: "uploads/hero-class.svg",
      logoSubtitle: "Nine Project",
      homeroomTeacher: {
        name: "Dra. Hj. Nur Endah Sulistyo, M.Pd.",
        title: "Wali Kelas 9E",
        subject: "Guru Bahasa Indonesia & Pembina OSIS",
        nip: "19780512 200312 2 004",
        quote: "Kesuksesan bukan tentang siapa yang paling pintar, melainkan siapa yang paling gigih berusaha dan menjaga persaudaraan."
      },
      vision: [
        "Mewujudkan kelas yang religius, berkarakter unggul, cerdas berteknologi, dan berintegritas tinggi.",
        "Membangun solidaritas, kekeluargaan, dan kepedulian sosial yang erat tanpa membedakan satu sama lain.",
        "Mengukir prestasi membanggakan di bidang akademik maupun non-akademik dengan semangat juang sportif."
      ],
      mission: [
        "Membiasakan budaya disiplin waktu, tertib belajar, dan memelihara keasrian lingkungan kelas.",
        "Mengembangkan program belajar bersama (peer-tutoring) yang inklusif untuk saling mendukung.",
        "Berpartisipasi aktif dan kompak dalam setiap kompetisi, kegiatan sekolah, dan bakti sosial.",
        "Menjunjung tinggi sopan santun kepada guru, orang tua, dan rasa saling menghargai sesama teman."
      ],
      contact: {
        email: "official.kelas9f@gmail.com",
        instagram: "@ninef_official",
        address: "Gedung B Lt. 2, Ruang IX-F, SMP Perguruan Rakyat 1"
      },
      footerText: "© 2026 Kelas 9E (The Nine Project). All rights reserved.",
      countdown: {
        title: "Penilaian Akhir Semester (PAS) & Graduation",
        targetDate: "2026-12-15T08:00:00"
      }
    },
    quotes: [
      { quote: "Kebersamaan adalah permulaan. Menjaga kebersamaan adalah kemajuan. Bekerja bersama adalah keberhasilan.", author: "Henry Ford" },
      { quote: "Masa sekolah bukan sekadar tentang angka di rapor, melainkan tentang cerita, tawa, dan persaudaraan yang kita ukir bersama.", author: "Keluarga 9E" }
    ],
    members: [
      { id: 1, noAbsen: 1, name: "Ahmad Farhan Maulana", role: "Koordinator Seksi Rohani", gender: "Laki-laki", birthDate: "2011-04-12" },
      { id: 2, noAbsen: 2, name: "Alya Zahira Putri", role: "Anggota Seksi Mading", gender: "Perempuan", birthDate: "2011-07-25" },
      { id: 3, noAbsen: 3, name: "Amanda Putri Maharani", role: "Sekretaris 1", gender: "Perempuan", birthDate: "2011-03-14" },
      { id: 4, noAbsen: 4, name: "Andika Satria Nugraha", role: "Anggota", gender: "Laki-laki", birthDate: "2011-09-08" },
      { id: 5, noAbsen: 5, name: "Anindita Citra Wardani", role: "Anggota", gender: "Perempuan", birthDate: "2011-11-19" },
      { id: 6, noAbsen: 6, name: "Arya Wijaya", role: "Anggota Seksi Keamanan", gender: "Laki-laki", birthDate: "2011-01-30" },
      { id: 7, noAbsen: 7, name: "Bagas Satria Yudha", role: "Koordinator Seksi Keamanan", gender: "Laki-laki", birthDate: "2011-05-18" },
      { id: 8, noAbsen: 8, name: "Dimas Aditya Putra", role: "Wakil Ketua Kelas", gender: "Laki-laki", birthDate: "2011-02-22" },
      { id: 9, noAbsen: 9, name: "Dinda Larasati", role: "Anggota", gender: "Perempuan", birthDate: "2011-08-11" },
      { id: 10, noAbsen: 10, name: "Fajar Ramadhan", role: "Koordinator Seksi Kebersihan", gender: "Laki-laki", birthDate: "2011-08-29" },
      { id: 11, noAbsen: 11, name: "Faris Al-Banjari", role: "Anggota Seksi Rohani", gender: "Laki-laki", birthDate: "2011-10-04" },
      { id: 12, noAbsen: 12, name: "Gita Permata Sari", role: "Anggota", gender: "Perempuan", birthDate: "2011-06-15" },
      { id: 13, noAbsen: 13, name: "Ilham Fauzi", role: "Anggota Seksi Keamanan", gender: "Laki-laki", birthDate: "2011-12-03" },
      { id: 14, noAbsen: 14, name: "Intan Nur Aini", role: "Anggota", gender: "Perempuan", birthDate: "2011-04-01" },
      { id: 15, noAbsen: 15, name: "Keisha Annisa Larasati", role: "Bendahara 2", gender: "Perempuan", birthDate: "2011-09-17" },
      { id: 16, noAbsen: 16, name: "Kevin Alvaro", role: "Anggota Seksi Olahraga", gender: "Laki-laki", birthDate: "2011-03-28" },
      { id: 17, noAbsen: 17, name: "Maya Salsabila", role: "Anggota", gender: "Perempuan", birthDate: "2011-07-09" },
      { id: 18, noAbsen: 18, name: "Muhammad Rayhan Pratama", role: "Ketua Kelas", gender: "Laki-laki", birthDate: "2011-01-10" },
      { id: 19, noAbsen: 19, name: "Muhammad Rizky Hidayat", role: "Anggota", gender: "Laki-laki", birthDate: "2011-05-02" },
      { id: 20, noAbsen: 20, name: "Nabila Kirana Dewi", role: "Bendahara 1", gender: "Perempuan", birthDate: "2011-10-21" },
      { id: 21, noAbsen: 21, name: "Nadira Aurelia", role: "Anggota", gender: "Perempuan", birthDate: "2011-02-05" },
      { id: 22, noAbsen: 22, name: "Rafi Ahmad Pratama", role: "Anggota", gender: "Laki-laki", birthDate: "2011-11-30" },
      { id: 23, noAbsen: 23, name: "Rendy Pratama Kusuma", role: "Koordinator Seksi Olahraga", gender: "Laki-laki", birthDate: "2011-06-07" },
      { id: 24, noAbsen: 24, name: "Rizky Pratama", role: "Anggota Seksi Kebersihan", gender: "Laki-laki", birthDate: "2011-08-16" },
      { id: 25, noAbsen: 25, name: "Salma Nurul Izzah", role: "Anggota Seksi Rohani", gender: "Perempuan", birthDate: "2011-12-24" },
      { id: 26, noAbsen: 26, name: "Siti Nurhaliza", role: "Anggota", gender: "Perempuan", birthDate: "2011-09-12" },
      { id: 27, noAbsen: 27, name: "Syifa Aulia Zahra", role: "Sekretaris 2", gender: "Perempuan", birthDate: "2011-04-18" },
      { id: 28, noAbsen: 28, name: "Tiara Anindya", role: "Anggota Seksi Kebersihan", gender: "Perempuan", birthDate: "2011-03-03" },
      { id: 29, "noAbsen": 29, "name": "Wahyu Hidayatullah", "role": "Anggota", "gender": "Laki-laki", "birthDate": "2011-11-14" },
      { id: 30, noAbsen: 30, name: "Yudha Pratama Putra", role: "Anggota", gender: "Laki-laki", birthDate: "2011-01-19" },
      { id: 31, noAbsen: 31, name: "Zahra Amelia", role: "Anggota", gender: "Perempuan", birthDate: "2011-10-08" },
      { id: 32, noAbsen: 32, name: "Zidan Al-Ghifari", role: "Koordinator Seksi IT & Mading", gender: "Laki-laki", birthDate: "2011-05-27" }
    ],
    organization: {
      waliKelas: { role: "Wali Kelas", name: "Dra. Hj. Nur Endah Sulistyo, M.Pd.", badge: "Pembimbing & Pengarah" },
      ketuaKelas: { role: "Ketua Kelas", name: "Muhammad Rayhan Pratama", absen: 18 },
      wakilKetua: { role: "Wakil Ketua", name: "Dimas Aditya Putra", absen: 8 },
      sekretaris: [
        { role: "Sekretaris 1", name: "Amanda Putri Maharani", absen: 3 },
        { role: "Sekretaris 2", name: "Syifa Aulia Zahra", absen: 27 }
      ],
      bendahara: [
        { role: "Bendahara 1", name: "Nabila Kirana Dewi", absen: 20 },
        { role: "Bendahara 2", name: "Keisha Annisa Larasati", absen: 15 }
      ],
      sections: [
        { id: "kebersihan", name: "Seksi Kebersihan", coordinator: "Fajar Ramadhan", members: ["Rizky Pratama", "Tiara Anindya"] },
        { id: "keamanan", name: "Seksi Keamanan & Disiplin", coordinator: "Bagas Satria Yudha", members: ["Arya Wijaya", "Ilham Fauzi"] },
        { id: "rohani", name: "Seksi Rohani & Agama", coordinator: "Ahmad Farhan Maulana", members: ["Salma Nurul Izzah", "Faris Al-Banjari"] },
        { id: "olahraga", name: "Seksi Olahraga", coordinator: "Rendy Pratama Kusuma", members: ["Kevin Alvaro"] },
        { id: "mading", name: "Seksi IT & Mading", coordinator: "Zidan Al-Ghifari", members: ["Alya Zahira Putri"] }
      ]
    },
    gallery: [
      { id: 1, title: "Momen Kebersamaan MPLS & Awal Masuk Kelas 9E", category: "Kebersamaan", date: "18 Juli 2025", description: "Foto bersama seluruh keluarga besar 9E saat hari pertama memasuki tahun ajaran baru.", image: "uploads/hero-class.svg" },
      { id: 2, title: "Kemenangan Bersama Class Meeting Futsal", category: "Prestasi", date: "14 Desember 2025", description: "Suasana kehangatan dan selebrasi seluruh siswa merayakan juara 1 turnamen antar kelas.", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80" },
      { id: 3, title: "Peringatan Hari Guru Bersama Ibu Wali Kelas", category: "Kebersamaan", date: "25 November 2025", description: "Potret penuh kasih sayang bersama Dra. Hj. Nur Endah Sulistyo saat pemberian tumpeng.", image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80" },
      { id: 4, title: "Study Tour Budaya & Sejarah Edukatif", category: "Study Tour", date: "10 Januari 2026", description: "Kunjungan edukasi bersama seluruh teman sekelas ke Museum Nasional.", image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=80" },
      { id: 5, title: "Buka Puasa Bersama & Santunan Ramadhan", category: "Sosial", date: "22 Maret 2026", description: "Momen hangat kebersamaan buka puasa bersama di kelas 9E.", image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1000&q=80" },
      { id: 6, title: "Gladi Bersih Pentas Seni & Kreativitas Angkatan", category: "Kebersamaan", date: "15 April 2026", description: "Latihan paduan suara dan yel-yel kebanggaan Nine Project.", image: "https://images.unsplash.com/photo-1526976668912-1a811878dd37?auto=format&fit=crop&w=1000&q=80" }
    ],
    announcements: [
      { id: 1, title: "Jadwal Penilaian Akhir Semester (PAS) Genap 2026", category: "Ujian", date: "2026-11-12", content: "Pelaksanaan PAS Genap akan dimulai tanggal 18 Mei 2026. Seluruh siswa 9E dimohon melunasi administrasi kartu ujian.", isPinned: true },
      { id: 2, title: "Batas Akhir Pengumpulan Portofolio Proyek P5", category: "Tugas", date: "2026-11-08", content: "Laporan tertulis dan video dokumentasi proyek dikumpulkan paling lambat hari Jumat pukul 14.00 WIB.", isPinned: true },
      { id: 3, title: "Bakti Sosial & Silaturahmi Akbar Kelas 9E", category: "Agenda", date: "2026-11-15", content: "Bakti sosial bertempat di Panti Asuhan Kasih Bangsa. Titik kumpul pukul 07.30 WIB di gazebo sekolah.", isPinned: false },
      { id: 4, title: "Pendalaman Materi Ujian Sekolah (Matematika & IPA)", category: "Info", date: "2026-11-10", content: "Bimbingan belajar tambahan diadakan setiap hari Selasa dan Kamis sepulang sekolah.", isPinned: false }
    ],
    schedules: {
      timetable: {
        Senin: [
          { time: "07.00 - 07.45", subject: "Upacara Bendera", teacher: "Pembina Upacara" },
          { time: "07.45 - 09.05", subject: "Matematika", teacher: "Bambang Sutrisno, S.Pd." },
          { time: "09.30 - 11.30", subject: "Bahasa Indonesia", teacher: "Dra. Hj. Nur Endah Sulistyo, M.Pd." },
          { time: "12.30 - 14.30", subject: "Pendidikan Agama & Budi Pekerti", teacher: "Ustadz H. Mansyur, M.Ag." }
        ],
        Selasa: [
          { time: "07.00 - 07.30", subject: "Literasi & Tadarus Pagi", teacher: "Wali Kelas" },
          { time: "07.30 - 09.30", subject: "Ilmu Pengetahuan Alam (IPA)", teacher: "Ir. Hendra Gunawan, M.Si." },
          { time: "10.00 - 11.45", subject: "Bahasa Inggris", teacher: "Miss Dewi Sartika, M.Hum." },
          { time: "12.45 - 14.15", subject: "Informatika / Komputer", teacher: "Ahmad Fauzi, S.Kom." }
        ],
        Rabu: [
          { time: "07.00 - 08.30", subject: "Pendidikan Jasmani & Olahraga", teacher: "Coach Budi Santoso, S.Pd." },
          { time: "08.30 - 09.45", subject: "Ilmu Pengetahuan Sosial (IPS)", teacher: "Drs. Eko Prasetyo" },
          { time: "10.15 - 12.00", subject: "Seni Budaya & Keterampilan", teacher: "Rina Marlina, S.Sn." }
        ],
        Kamis: [
          { time: "07.00 - 07.30", subject: "Senam Pagi (SKJ)", teacher: "Guru Olahraga" },
          { time: "07.30 - 09.30", subject: "IPA Biologi", teacher: "Dra. Sri Mulyani, M.Pd." },
          { time: "10.00 - 11.45", subject: "Bahasa Daerah", teacher: "Ki Purwanto, S.Pd." }
        ],
        Jumat: [
          { time: "07.00 - 08.00", subject: "Jumat Bersih & Berbagi", teacher: "Pengurus 9E" },
          { time: "08.00 - 09.30", subject: "Bimbingan & Konseling (BK)", teacher: "Drs. Anang Hermansyah, M.Psi." },
          { time: "10.00 - 11.20", subject: "Proyek Profil Pelajar Pancasila (P5)", teacher: "Tim Fasilitator P5" }
        ]
      },
      dutyRoster: {
        Senin: ["Muhammad Rayhan Pratama", "Amanda Putri Maharani", "Fajar Ramadhan", "Arya Wijaya", "Anindita Citra Wardani", "Wahyu Hidayatullah"],
        Selasa: ["Dimas Aditya Putra", "Nabila Kirana Dewi", "Rizky Pratama", "Ilham Fauzi", "Dinda Larasati", "Yudha Pratama Putra"],
        Rabu: ["Ahmad Farhan Maulana", "Syifa Aulia Zahra", "Bagas Satria Yudha", "Salma Nurul Izzah", "Gita Permata Sari", "Rafi Ahmad Pratama"],
        Kamis: ["Zidan Al-Ghifari", "Keisha Annisa Larasati", "Kevin Alvaro", "Alya Zahira Putri", "Intan Nur Aini", "Andika Satria Nugraha"],
        Jumat: ["Rendy Pratama Kusuma", "Tiara Anindya", "Faris Al-Banjari", "Maya Salsabila", "Siti Nurhaliza", "Zahra Amelia"]
      }
    },
    memories: [
      { id: 1, name: "Muhammad Rayhan (Ketua Kelas)", message: "Terima kasih untuk seluruh teman-teman 9E atas satu tahun yang penuh warna!", date: "2026-10-20", badge: "Pengurus Kelas" },
      { id: 2, name: "Dra. Hj. Nur Endah Sulistyo", message: "Anak-anakku 9E yang hebat, tetaplah rendah hati, rajin beribadah, dan jangan pernah berhenti bermimpi tinggi.", date: "2026-10-25", badge: "Wali Kelas" },
      { id: 3, name: "Amanda Putri (Sekretaris)", message: "Kenangan di ruang 9E ini bakal selalu tersimpan di hati. Semangat berjuang kawan!", date: "2026-11-01", badge: "Siswa 9E" }
    ]
  };
}

function renderAll() {
  if (!appData) return;
  renderSiteInfo();
  renderCountdown();
  renderQuote();
  renderAbout();
  renderMembers();
  renderOrganization();
  renderGallery();
  renderAnnouncements();
  renderSchedules();
  renderMemories();
  renderContact();
}

// =================== FIXED LIGHT THEME ===================
function initTheme() {
  document.documentElement.setAttribute('data-theme', 'light');
}

// =================== REAL-TIME CLOCK (WIB) ===================
function initClock() {
  const timeEl = document.getElementById('liveClockTime');
  const dateEl = document.getElementById('liveClockDate');
  if (!timeEl || !dateEl) return;

  function update() {
    const now = new Date();
    // WIB format
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    timeEl.textContent = timeStr;
    dateEl.textContent = dateStr;
  }
  update();
  setInterval(update, 1000);
}

// =================== EVENT COUNTDOWN TIMER ===================
function renderCountdown() {
  const cd = appData?.siteInfo?.countdown;
  if (!cd || !cd.targetDate) return;

  const titleEl = document.getElementById('countdownTitle');
  if (titleEl) titleEl.textContent = cd.title;

  const daysEl = document.getElementById('cdDays');
  const hoursEl = document.getElementById('cdHours');
  const minsEl = document.getElementById('cdMins');
  const secsEl = document.getElementById('cdSecs');

  function updateTimer() {
    const target = new Date(cd.targetDate).getTime();
    const now = new Date().getTime();
    const diff = target - now;

    if (diff <= 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minsEl) minsEl.textContent = '00';
      if (secsEl) secsEl.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// =================== SITE INFO & HERO ===================
function renderSiteInfo() {
  const info = appData.siteInfo;
  if (!info) return;

  // Nav brand
  const brandName = document.getElementById('navBrandName');
  const brandSub = document.getElementById('navBrandSub');
  if (brandName) brandName.textContent = info.className || '9E-Project';
  if (brandSub) brandSub.textContent = 'Nine Project'

  // Hero section
  const heroBadge = document.getElementById('heroSchoolBadge');
  if (heroBadge) heroBadge.textContent = info.schoolName;

  const heroTitle = document.getElementById('heroClassTitle');
  if (heroTitle) heroTitle.innerHTML = `<span class="hero-title-highlight">${info.className}</span>`;

  const heroMotto = document.getElementById('heroMotto');
  if (heroMotto) heroMotto.innerHTML = `<i class="fas fa-quote-left text-sky-400"></i> "${info.motto}"`;

  const heroDesc = document.getElementById('heroDesc');
  if (heroDesc) heroDesc.textContent = info.shortDescription;

  const btnExplore = document.getElementById('btnExploreClass');
  if (btnExplore && info.exploreButtonText) btnExplore.textContent = info.exploreButtonText;

  const btnGallery = document.getElementById('btnViewGallery');
  if (btnGallery && info.galleryButtonText) btnGallery.textContent = info.galleryButtonText;

  const heroImg = document.getElementById('heroMainImage');
  if (heroImg) {
    heroImg.src = info.heroImage || '/uploads/hero-class.svg';
    heroImg.onerror = () => { heroImg.src = '/uploads/hero-class.svg'; };
  }

  // Floating badges in hero
  const floatWali = document.getElementById('heroFloatWali');
  if (floatWali && info.homeroomTeacher) {
    floatWali.textContent = info.homeroomTeacher.name;
  }
  const floatCount = document.getElementById('heroFloatCount');
  if (floatCount && appData.members) {
    floatCount.textContent = `${appData.members.length} Siswa Terdaftar`;
  }
}

// =================== QUOTE OF THE DAY ===================
function renderQuote() {
  const quotes = appData.quotes;
  if (!quotes || !quotes.length) return;
  // Pick today's quote based on day of year
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const q = quotes[dayOfYear % quotes.length];

  const textEl = document.getElementById('dailyQuoteText');
  const authorEl = document.getElementById('dailyQuoteAuthor');
  if (textEl) textEl.textContent = `"${q.quote}"`;
  if (authorEl) authorEl.innerHTML = `<i class="fas fa-pen-nib"></i> ${q.author}`;
}

// =================== ABOUT CLASS ===================
function renderAbout() {
  const info = appData.siteInfo;
  if (!info) return;

  // Short desc
  const descEl = document.getElementById('aboutShortDesc');
  if (descEl) descEl.textContent = info.shortDescription;

  // Vision
  const visionList = document.getElementById('aboutVisionList');
  if (visionList && info.vision) {
    visionList.innerHTML = info.vision.map(v => `
      <li class="card-list-item">
        <i class="fas fa-check-circle"></i>
        <span>${v}</span>
      </li>
    `).join('');
  }

  // Mission
  const missionList = document.getElementById('aboutMissionList');
  if (missionList && info.mission) {
    missionList.innerHTML = info.mission.map(m => `
      <li class="card-list-item">
        <i class="fas fa-arrow-alt-circle-right"></i>
        <span>${m}</span>
      </li>
    `).join('');
  }

  // Homeroom Teacher
  const t = info.homeroomTeacher;
  if (t) {
    const nameEl = document.getElementById('teacherName');
    const titleEl = document.getElementById('teacherTitle');
    const nipEl = document.getElementById('teacherNip');
    const quoteEl = document.getElementById('teacherQuote');
    if (nameEl) nameEl.textContent = t.name;
    if (titleEl) titleEl.textContent = `${t.title} • ${t.subject}`;
    if (nipEl) nipEl.textContent = t.nip ? `NIP. ${t.nip}` : '';
    if (quoteEl) quoteEl.textContent = `"${t.quote}"`;
  }
}

// =================== MEMBERS (DATA SISWA) ===================
function renderMembers() {
  const grid = document.getElementById('membersGrid');
  const countBadge = document.getElementById('membersCountBadge');
  if (!grid) return;

  let list = appData.members || [];

  // Filter by search
  if (currentMemberSearch.trim() !== '') {
    const q = currentMemberSearch.toLowerCase();
    list = list.filter(m => 
      m.name.toLowerCase().includes(q) || 
      String(m.noAbsen).includes(q) || 
      (m.role && m.role.toLowerCase().includes(q))
    );
  }

  // Filter by nomor absen
  if (currentAbsenFilter === '1-10') {
    list = list.filter(m => m.noAbsen >= 1 && m.noAbsen <= 10);
  } else if (currentAbsenFilter === '11-20') {
    list = list.filter(m => m.noAbsen >= 11 && m.noAbsen <= 20);
  } else if (currentAbsenFilter === '21-32') {
    list = list.filter(m => m.noAbsen >= 21 && m.noAbsen <= 32);
  } else if (currentAbsenFilter === 'pengurus') {
    list = list.filter(m => m.role && m.role.toLowerCase() !== 'anggota');
  }

  if (countBadge) {
    countBadge.textContent = `${list.length} Siswa Ditampilkan`;
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-user-slash"></i>
        <h3>Tidak ada siswa yang cocok</h3>
        <p>Coba gunakan kata kunci pencarian atau filter yang berbeda.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(m => {
    // Generate initials for avatar (strictly NO individual photo)
    const initials = m.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    const isOfficer = m.role && m.role.toLowerCase() !== 'anggota';

    return `
      <div class="member-card">
        <div class="member-avatar">
          ${initials}
        </div>
        <div class="member-info">
          <div class="member-header-row">
            <span class="member-absen-chip">Absen #${String(m.noAbsen).padStart(2, '0')}</span>
            <span style="font-size: 0.72rem; color: var(--text-dim);">${m.gender || ''}</span>
          </div>
          <div class="member-name" title="${m.name}">${m.name}</div>
          <div class="member-role-badge ${isOfficer ? 'is-leader' : ''}">
            ${isOfficer ? '<i class="fas fa-star text-amber-400"></i> ' : ''}${m.role || 'Anggota'}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Search and filter listeners
const memberSearchInput = document.getElementById('memberSearchInput');
if (memberSearchInput) {
  memberSearchInput.addEventListener('input', (e) => {
    currentMemberSearch = e.target.value;
    renderMembers();
  });
}

const memberAbsenFilter = document.getElementById('memberAbsenFilter');
if (memberAbsenFilter) {
  memberAbsenFilter.addEventListener('change', (e) => {
    currentAbsenFilter = e.target.value;
    renderMembers();
  });
}

// =================== ORGANIZATION (STRUKTUR ORGANISASI) ===================
function renderOrganization() {
  const org = appData.organization;
  if (!org) return;

  // Level 1: Wali Kelas
  const waliBox = document.getElementById('orgWaliKelas');
  if (waliBox && org.waliKelas) {
    waliBox.innerHTML = `
      <div class="org-card lead-card">
        <span class="org-card-badge">Wali Kelas</span>
        <div class="org-avatar-icon"><i class="fas fa-chalkboard-teacher"></i></div>
        <h3 class="org-person-name">${org.waliKelas.name}</h3>
        <p class="org-person-sub">${org.waliKelas.badge || 'Pembimbing & Pengarah 9E'}</p>
      </div>
    `;
  }

  // Level 2: Ketua & Wakil
  const ketuaBox = document.getElementById('orgKetuaWakil');
  if (ketuaBox) {
    ketuaBox.innerHTML = `
      <div class="org-card">
        <span class="org-card-badge">Ketua Kelas</span>
        <div class="org-avatar-icon"><i class="fas fa-user-tie"></i></div>
        <h4 class="org-person-name">${org.ketuaKelas?.name || '-'}</h4>
        <p class="org-person-sub">Absen #${String(org.ketuaKelas?.absen || 0).padStart(2, '0')}</p>
      </div>
      <div class="org-card">
        <span class="org-card-badge">Wakil Ketua</span>
        <div class="org-avatar-icon"><i class="fas fa-user-check"></i></div>
        <h4 class="org-person-name">${org.wakilKetua?.name || '-'}</h4>
        <p class="org-person-sub">Absen #${String(org.wakilKetua?.absen || 0).padStart(2, '0')}</p>
      </div>
    `;
  }

  // Level 3: Sekretaris & Bendahara
  const sekbenBox = document.getElementById('orgSekretarisBendahara');
  if (sekbenBox) {
    const s1 = org.sekretaris?.[0] || {};
    const s2 = org.sekretaris?.[1] || {};
    const b1 = org.bendahara?.[0] || {};
    const b2 = org.bendahara?.[1] || {};

    sekbenBox.innerHTML = `
      <div class="org-card">
        <span class="org-card-badge">Sekretaris 1</span>
        <div class="org-avatar-icon"><i class="fas fa-file-signature"></i></div>
        <h4 class="org-person-name">${s1.name || '-'}</h4>
        <p class="org-person-sub">Absen #${String(s1.absen || 0).padStart(2, '0')}</p>
      </div>
      <div class="org-card">
        <span class="org-card-badge">Sekretaris 2</span>
        <div class="org-avatar-icon"><i class="fas fa-file-alt"></i></div>
        <h4 class="org-person-name">${s2.name || '-'}</h4>
        <p class="org-person-sub">Absen #${String(s2.absen || 0).padStart(2, '0')}</p>
      </div>
      <div class="org-card">
        <span class="org-card-badge">Bendahara 1</span>
        <div class="org-avatar-icon"><i class="fas fa-wallet"></i></div>
        <h4 class="org-person-name">${b1.name || '-'}</h4>
        <p class="org-person-sub">Absen #${String(b1.absen || 0).padStart(2, '0')}</p>
      </div>
      <div class="org-card">
        <span class="org-card-badge">Bendahara 2</span>
        <div class="org-avatar-icon"><i class="fas fa-coins"></i></div>
        <h4 class="org-person-name">${b2.name || '-'}</h4>
        <p class="org-person-sub">Absen #${String(b2.absen || 0).padStart(2, '0')}</p>
      </div>
    `;
  }

  // Level 4: Seksi-seksi
  const sectionsBox = document.getElementById('orgSectionsGrid');
  if (sectionsBox && org.sections) {
    sectionsBox.innerHTML = org.sections.map(sec => {
      let icon = 'fa-tasks';
      if (sec.id === 'kebersihan') icon = 'fa-broom';
      else if (sec.id === 'keamanan') icon = 'fa-shield-alt';
      else if (sec.id === 'rohani') icon = 'fa-pray';
      else if (sec.id === 'olahraga') icon = 'fa-volleyball-ball';
      else if (sec.id === 'mading') icon = 'fa-palette';

      return `
        <div class="section-box">
          <div class="section-box-header">
            <div class="section-box-icon"><i class="fas ${icon}"></i></div>
            <div class="section-box-title">${sec.name}</div>
          </div>
          <div class="section-coord-label">Koordinator:</div>
          <div class="section-coord-name">${sec.coordinator}</div>
          <div class="section-members-list">
            <strong>Anggota:</strong> ${sec.members && sec.members.length ? sec.members.join(', ') : '-'}
          </div>
        </div>
      `;
    }).join('');
  }
}

// =================== GALLERY (KEBERSAMAAN ONLY & LIGHTBOX) ===================
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const photos = appData.gallery || [];
  if (photos.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-images"></i>
        <h3>Belum Ada Foto Kebersamaan</h3>
        <p>Foto kebersamaan kelas akan diunggah oleh pengurus kelas.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = photos.map((item, idx) => `
    <div class="gallery-card" onclick="openLightbox(${idx})">
      <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.src='/uploads/hero-class.svg'">
      <div class="gallery-overlay">
        <span class="gallery-tag">${item.category || 'Kebersamaan'}</span>
        <h4 class="gallery-title">${item.title}</h4>
        <div class="gallery-date"><i class="fas fa-calendar-alt"></i> ${item.date}</div>
      </div>
    </div>
  `).join('');
}

function openLightbox(index) {
  const photos = appData?.gallery;
  if (!photos || !photos[index]) return;

  currentLightboxIndex = index;
  const item = photos[index];

  const modal = document.getElementById('lightboxModal');
  const img = document.getElementById('lightboxImg');
  const title = document.getElementById('lightboxTitle');
  const desc = document.getElementById('lightboxDesc');
  const date = document.getElementById('lightboxDate');

  if (img) img.src = item.image;
  if (title) title.textContent = item.title;
  if (desc) desc.textContent = item.description || 'Momen kebersamaan berharga keluarga besar kelas 9E.';
  if (date) date.textContent = `${item.category} • ${item.date}`;

  if (modal) modal.classList.add('open');
}

function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  if (modal) modal.classList.remove('open');
}

// Lightbox keyboard navigation
document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('lightboxModal');
  if (modal && modal.classList.contains('open')) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
    if (e.key === 'ArrowLeft') prevLightbox();
  }
});

function nextLightbox() {
  const photos = appData?.gallery || [];
  if (!photos.length) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % photos.length;
  openLightbox(currentLightboxIndex);
}

function prevLightbox() {
  const photos = appData?.gallery || [];
  if (!photos.length) return;
  currentLightboxIndex = (currentLightboxIndex - 1 + photos.length) % photos.length;
  openLightbox(currentLightboxIndex);
}

// =================== ANNOUNCEMENTS ===================
function renderAnnouncements() {
  const grid = document.getElementById('announcementsGrid');
  if (!grid) return;

  let items = appData.announcements || [];

  if (currentCategoryFilter !== 'all') {
    items = items.filter(a => a.category && a.category.toLowerCase() === currentCategoryFilter.toLowerCase());
  }

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-bullhorn"></i>
        <h3>Tidak Ada Pengumuman</h3>
        <p>Belum ada pengumuman untuk kategori yang dipilih saat ini.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(item => {
    const cat = (item.category || 'Info').toLowerCase();
    return `
      <div class="announcement-card ${item.isPinned ? 'is-pinned' : ''}">
        <div class="announcement-top-meta">
          <span class="category-badge ${cat}">${item.category || 'Info'}</span>
          <div class="announcement-date">
            <i class="far fa-calendar-check"></i> ${item.date}
          </div>
        </div>
        <h3 class="announcement-title">
          ${item.isPinned ? '<i class="fas fa-thumbtack text-sky-400 mr-2"></i>' : ''}${item.title}
        </h3>
        <p class="announcement-content">${item.content}</p>
      </div>
    `;
  }).join('');
}

function filterAnnouncement(category, el) {
  currentCategoryFilter = category;
  document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
  if (el) el.classList.add('active');
  renderAnnouncements();
}

// =================== SCHEDULES (TIMETABLE & PIKET) ===================
function renderSchedules() {
  const timetableContainer = document.getElementById('timetableContainer');
  const piketContainer = document.getElementById('piketContainer');
  const daysNav = document.getElementById('scheduleDaysNav');

  if (currentScheduleMode === 'pelajaran') {
    if (timetableContainer) timetableContainer.style.display = 'block';
    if (piketContainer) piketContainer.style.display = 'none';
    if (daysNav) daysNav.style.display = 'flex';
    renderTimetableDay(currentDayFilter);
  } else {
    if (timetableContainer) timetableContainer.style.display = 'none';
    if (piketContainer) piketContainer.style.display = 'block';
    if (daysNav) daysNav.style.display = 'none';
    renderPiketGrid();
  }
}

function setScheduleMode(mode, btn) {
  currentScheduleMode = mode;
  document.querySelectorAll('.mode-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderSchedules();
}

function setDayFilter(day, btn) {
  currentDayFilter = day;
  document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTimetableDay(day);
}

function renderTimetableDay(day) {
  const tbody = document.getElementById('timetableBody');
  if (!tbody) return;

  const list = appData?.schedules?.timetable?.[day] || [];
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 30px;">Tidak ada jadwal pelajaran untuk hari ${day}.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(item => `
    <tr>
      <td>
        <span class="time-badge"><i class="far fa-clock"></i> ${item.time}</span>
      </td>
      <td>
        <strong>${item.subject}</strong>
      </td>
      <td>
        <span style="color: var(--text-muted);"><i class="fas fa-chalkboard-teacher text-sky-400 mr-2"></i> ${item.teacher}</span>
      </td>
    </tr>
  `).join('');
}

function renderPiketGrid() {
  const grid = document.getElementById('piketGrid');
  if (!grid) return;

  const roster = appData?.schedules?.dutyRoster || {};
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  // Identify today
  const todayIndex = new Date().getDay(); // 1 = Senin, 2 = Selasa, ...
  const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayName = dayNames[todayIndex] || '';

  grid.innerHTML = days.map(day => {
    const students = roster[day] || [];
    const isToday = day === todayName;

    return `
      <div class="piket-day-card ${isToday ? 'today' : ''}">
        <div class="piket-day-title">
          <span>Hari ${day}</span>
          ${isToday ? '<span class="badge-tag" style="margin:0; padding:2px 8px; font-size:0.7rem;">HARI INI</span>' : ''}
        </div>
        <ul class="piket-list">
          ${students.map(s => `
            <li class="piket-list-item">
              <i class="fas fa-check text-sky-400"></i>
              <span>${s}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }).join('');
}

// =================== DIGITAL YEARBOOK / MEMORIES ===================
function renderMemories() {
  const listEl = document.getElementById('memoriesList');
  if (!listEl) return;

  const memories = appData.memories || [];
  if (memories.length === 0) {
    listEl.innerHTML = `<div style="color:var(--text-dim); text-align:center; padding:20px;">Belum ada catatan kenangan. Jadilah yang pertama menulis!</div>`;
    return;
  }

  listEl.innerHTML = memories.map(m => `
    <div class="memory-note">
      <div class="memory-author-row">
        <span class="memory-author-name">${m.name}</span>
        <span class="memory-badge">${m.badge || 'Teman 9E'}</span>
      </div>
      <p class="memory-text">"${m.message}"</p>
      <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 6px; text-align: right;">${m.date || ''}</div>
    </div>
  `).join('');
}

function openMemoryModal() {
  const modal = document.getElementById('memoryModal');
  if (modal) modal.classList.add('open');
}

function closeMemoryModal() {
  const modal = document.getElementById('memoryModal');
  if (modal) modal.classList.remove('open');
}

async function submitMemory(e) {
  e.preventDefault();
  const name = document.getElementById('memoryAuthorInput').value;
  const badge = document.getElementById('memoryBadgeInput').value;
  const message = document.getElementById('memoryMessageInput').value;

  if (!name.trim() || !message.trim()) {
    showToast('Nama dan pesan wajib diisi!', 'error');
    return;
  }

  try {
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, badge, message })
    });
    const result = await res.json();
    if (result.success) {
      showToast('Pesan kenangan berhasil dikirim!', 'success');
      closeMemoryModal();
      document.getElementById('memoryForm').reset();
      loadData();
    } else {
      showToast(result.message || 'Gagal mengirim pesan', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan jaringan', 'error');
  }
}

async function refreshMemories() {
  try {
    const res = await fetch('/api/memories');
    if (!res.ok) return;
    const result = await res.json();
    if (result.success && appData && JSON.stringify(appData.memories || []) !== JSON.stringify(result.memories)) {
      appData.memories = result.memories;
      renderMemories();
    }
  } catch (err) {
    console.warn('Gagal memperbarui daftar kenangan.', err);
  }
}

setInterval(refreshMemories, 10000);

// =================== CONTACT & FOOTER ===================
function renderContact() {
  const c = appData?.siteInfo?.contact;
  if (!c) return;

  const email = document.getElementById('contactEmail');
  const address = document.getElementById('contactAddress');
  const ig = document.getElementById('contactIg');

  if (email) email.textContent = c.email;
  if (address) address.textContent = c.address;
  if (ig) ig.textContent = c.instagram;

  const footerText = document.getElementById('footerCopyright');
  if (footerText && appData.siteInfo.footerText) {
    footerText.textContent = appData.siteInfo.footerText;
  }
}

// =================== NAVBAR & MOBILE MENU ===================
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  });
}

function initMobileMenu() {
  const btn = document.getElementById('hamburgerBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  const overlay = document.getElementById('mobileNavOverlay');
  const closeBtn = document.getElementById('mobileNavClose');

  function openMenu() {
    drawer?.classList.add('open');
    overlay?.classList.add('open');
  }

  function closeMenu() {
    drawer?.classList.remove('open');
    overlay?.classList.remove('open');
  }

  btn?.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);

  document.querySelectorAll('.mobile-nav-links a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });
}

// =================== BACK TO TOP ===================
function initBackToTop() {
  const btn = document.getElementById('backToTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// =================== TOAST NOTIFICATION ===================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle text-emerald-400' : type === 'error' ? 'fa-exclamation-triangle text-rose-400' : 'fa-info-circle text-sky-400'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
