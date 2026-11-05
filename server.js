const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const DEFAULT_FILE = path.join(DATA_DIR, 'default-data.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Initialize database if not exists
if (!fs.existsSync(DB_FILE)) {
  if (fs.existsSync(DEFAULT_FILE)) {
    fs.copyFileSync(DEFAULT_FILE, DB_FILE);
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2));
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// Admin authentication store
let adminSessionTokens = new Set();
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USER || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin9f'
};

// Database helper functions
function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database:', err);
    if (fs.existsSync(DEFAULT_FILE)) {
      return JSON.parse(fs.readFileSync(DEFAULT_FILE, 'utf-8'));
    }
    return {};
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

// Multer storage setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const unique = Date.now() + '_' + Math.round(Math.random() * 1e4);
    cb(null, `img_${sanitized}_${unique}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung! Hanya JPG, JPEG, PNG, dan WEBP yang diizinkan.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Auth middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Akses ditolak: Token autentikasi diperlukan.' });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!adminSessionTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Sesi admin tidak valid atau telah kedaluwarsa. Silakan login kembali.' });
  }
  next();
}

// =================== AUTH ROUTES ===================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const token = crypto.randomBytes(32).toString('hex');
    adminSessionTokens.add(token);
    return res.json({
      success: true,
      message: 'Login admin berhasil!',
      token,
      user: { username: ADMIN_CREDENTIALS.username }
    });
  }
  return res.status(401).json({
    success: false,
    message: 'Username atau password admin salah!'
  });
});

app.post('/api/auth/verify', (req, res) => {
  const { token } = req.body;
  if (token && adminSessionTokens.has(token)) {
    return res.json({ success: true, valid: true });
  }
  return res.status(401).json({ success: false, valid: false });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    adminSessionTokens.delete(token);
  }
  return res.json({ success: true, message: 'Logout berhasil.' });
});

// =================== PUBLIC DATA ROUTE ===================
app.get('/api/data', (req, res) => {
  const data = readDb();
  res.json({ success: true, data });
});

// =================== FILE UPLOAD ROUTE ===================
app.post('/api/upload', requireAuth, (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file foto yang dipilih.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Foto berhasil diunggah!',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  });
});

// =================== SITE INFO & GENERAL SETTINGS ===================
app.put('/api/site-info', requireAuth, (req, res) => {
  const db = readDb();
  const updatedInfo = req.body;

  // Merge site info
  db.siteInfo = {
    ...db.siteInfo,
    ...updatedInfo
  };

  if (writeDb(db)) {
    return res.json({ success: true, message: 'Informasi dan pengaturan website berhasil disimpan!', data: db.siteInfo });
  }
  res.status(500).json({ success: false, message: 'Gagal menyimpan perubahan ke database.' });
});

// =================== MEMBERS (DATA SISWA) CRUD ===================
app.post('/api/members', requireAuth, (req, res) => {
  const db = readDb();
  const { name, noAbsen, role, gender, birthDate } = req.body;

  if (!name || !noAbsen) {
    return res.status(400).json({ success: false, message: 'Nama lengkap dan nomor absen wajib diisi!' });
  }

  const newId = db.members.length > 0 ? Math.max(...db.members.map(m => m.id || 0)) + 1 : 1;
  const newMember = {
    id: newId,
    noAbsen: parseInt(noAbsen, 10),
    name: name.trim(),
    role: role ? role.trim() : 'Anggota',
    gender: gender || 'Laki-laki',
    birthDate: birthDate || ''
  };

  db.members.push(newMember);
  db.members.sort((a, b) => a.noAbsen - b.noAbsen);

  if (writeDb(db)) {
    return res.json({ success: true, message: `Siswa ${newMember.name} berhasil ditambahkan!`, member: newMember });
  }
  res.status(500).json({ success: false, message: 'Gagal menambahkan data siswa.' });
});

app.put('/api/members/:id', requireAuth, (req, res) => {
  const db = readDb();
  const id = parseInt(req.params.id, 10);
  const index = db.members.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
  }

  const { name, noAbsen, role, gender, birthDate } = req.body;
  db.members[index] = {
    ...db.members[index],
    name: name !== undefined ? name.trim() : db.members[index].name,
    noAbsen: noAbsen !== undefined ? parseInt(noAbsen, 10) : db.members[index].noAbsen,
    role: role !== undefined ? role.trim() : db.members[index].role,
    gender: gender !== undefined ? gender : db.members[index].gender,
    birthDate: birthDate !== undefined ? birthDate : db.members[index].birthDate
  };

  db.members.sort((a, b) => a.noAbsen - b.noAbsen);

  if (writeDb(db)) {
    return res.json({ success: true, message: 'Data siswa berhasil diperbarui!', member: db.members[index] });
  }
  res.status(500).json({ success: false, message: 'Gagal memperbarui data siswa.' });
});

app.delete('/api/members/:id', requireAuth, (req, res) => {
  const db = readDb();
  const id = parseInt(req.params.id, 10);
  const member = db.members.find(m => m.id === id);

  if (!member) {
    return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
  }

  db.members = db.members.filter(m => m.id !== id);

  if (writeDb(db)) {
    return res.json({ success: true, message: `Data siswa ${member.name} berhasil dihapus!` });
  }
  res.status(500).json({ success: false, message: 'Gagal menghapus data siswa.' });
});

// =================== STRUKTUR ORGANISASI ===================
app.put('/api/organization', requireAuth, (req, res) => {
  const db = readDb();
  const { waliKelas, ketuaKelas, wakilKetua, sekretaris, bendahara, sections } = req.body;

  db.organization = {
    waliKelas: waliKelas || db.organization.waliKelas,
    ketuaKelas: ketuaKelas || db.organization.ketuaKelas,
    wakilKetua: wakilKetua || db.organization.wakilKetua,
    sekretaris: sekretaris || db.organization.sekretaris,
    bendahara: bendahara || db.organization.bendahara,
    sections: sections || db.organization.sections
  };

  if (writeDb(db)) {
    return res.json({ success: true, message: 'Struktur organisasi berhasil diperbarui!', data: db.organization });
  }
  res.status(500).json({ success: false, message: 'Gagal menyimpan perubahan struktur organisasi.' });
});

// =================== GALERI KELAS (KEBERSAMAAN ONLY) ===================
app.post('/api/gallery', requireAuth, (req, res) => {
  const db = readDb();
  const { title, category, date, description, image } = req.body;

  if (!title || !image) {
    return res.status(400).json({ success: false, message: 'Judul dan URL foto kebersamaan wajib diisi!' });
  }

  const newId = db.gallery.length > 0 ? Math.max(...db.gallery.map(g => g.id || 0)) + 1 : 1;
  const newPhoto = {
    id: newId,
    title: title.trim(),
    category: category ? category.trim() : 'Kebersamaan',
    date: date ? date.trim() : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    description: description ? description.trim() : '',
    image: image.trim()
  };

  db.gallery.unshift(newPhoto);

  if (writeDb(db)) {
    return res.json({ success: true, message: 'Foto kebersamaan berhasil ditambahkan ke galeri!', item: newPhoto });
  }
  res.status(500).json({ success: false, message: 'Gagal menyimpan foto ke galeri.' });
});

app.put('/api/gallery/:id', requireAuth, (req, res) => {
  const db = readDb();
  const id = parseInt(req.params.id, 10);
  const index = db.gallery.findIndex(g => g.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Foto tidak ditemukan di galeri.' });
  }

  const { title, category, date, description, image } = req.body;
  db.gallery[index] = {
    ...db.gallery[index],
    title: title !== undefined ? title.trim() : db.gallery[index].title,
    category: category !== undefined ? category.trim() : db.gallery[index].category,
    date: date !== undefined ? date.trim() : db.gallery[index].date,
    description: description !== undefined ? description.trim() : db.gallery[index].description,
    image: image !== undefined ? image.trim() : db.gallery[index].image
  };

  if (writeDb(db)) {
    return res.json({ success: true, message: 'Foto galeri berhasil diperbarui!', item: db.gallery[index] });
  }
  res.status(500).json({ success: false, message: 'Gagal memperbarui foto galeri.' });
});

app.delete('/api/gallery/:id', requireAuth, (req, res) => {
  const db = readDb();
  const id = parseInt(req.params.id, 10);
  const photo = db.gallery.find(g => g.id === id);

  if (!photo) {
    return res.status(404).json({ success: false, message: 'Foto tidak ditemukan di galeri.' });
  }

  // Delete local uploaded file if exists in uploads directory
  if (photo.image && photo.image.startsWith('/uploads/')) {
    const filename = path.basename(photo.image);
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Could not delete file from disk:', e.message);
      }
    }
  }

  db.gallery = db.gallery.filter(g => g.id !== id);

  if (writeDb(db)) {
    return res.json({ success: true, message: 'Foto kebersamaan berhasil dihapus dari galeri!' });
  }
  res.status(500).json({ success: false, message: 'Gagal menghapus foto dari galeri.' });
});

// =================== PENGUMUMAN (ANNOUNCEMENTS) CRUD ===================
app.post('/api/announcements', requireAuth, (req, res) => {
  const db = readDb();
  const { title, category, date, content, isPinned } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Judul dan isi pengumuman wajib diisi!' });
  }

  const newId = db.announcements.length > 0 ? Math.max(...db.announcements.map(a => a.id || 0)) + 1 : 1;
  const newAnnouncement = {
    id: newId,
    title: title.trim(),
    category: category || 'Info',
    date: date || new Date().toISOString().split('T')[0],
    content: content.trim(),
    isPinned: Boolean(isPinned)
  };

  db.announcements.unshift(newAnnouncement);

  if (writeDb(db)) {
    return res.json({ success: true, message: 'Pengumuman baru berhasil diterbitkan!', announcement: newAnnouncement });
  }
  res.status(500).json({ success: false, message: 'Gagal menambahkan pengumuman.' });
});

app.put('/api/announcements/:id', requireAuth, (req, res) => {
  const db = readDb();
  const id = parseInt(req.params.id, 10);
  const index = db.announcements.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan.' });
  }

  const { title, category, date, content, isPinned } = req.body;
  db.announcements[index] = {
    ...db.announcements[index],
    title: title !== undefined ? title.trim() : db.announcements[index].title,
    category: category !== undefined ? category : db.announcements[index].category,
    date: date !== undefined ? date : db.announcements[index].date,
    content: content !== undefined ? content.trim() : db.announcements[index].content,
    isPinned: isPinned !== undefined ? Boolean(isPinned) : db.announcements[index].isPinned
  };

  if (writeDb(db)) {
    return res.json({ success: true, message: 'Pengumuman berhasil diperbarui!', announcement: db.announcements[index] });
  }
  res.status(500).json({ success: false, message: 'Gagal memperbarui pengumuman.' });
});

app.delete('/api/announcements/:id', requireAuth, (req, res) => {
  const db = readDb();
  const id = parseInt(req.params.id, 10);
  const exists = db.announcements.some(a => a.id === id);

  if (!exists) {
    return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan.' });
  }

  db.announcements = db.announcements.filter(a => a.id !== id);

  if (writeDb(db)) {
    return res.json({ success: true, message: 'Pengumuman berhasil dihapus!' });
  }
  res.status(500).json({ success: false, message: 'Gagal menghapus pengumuman.' });
});

// =================== JADWAL (SCHEDULES) ===================
app.put('/api/schedules', requireAuth, (req, res) => {
  const db = readDb();
  const { timetable, dutyRoster } = req.body;

  if (timetable) db.schedules.timetable = timetable;
  if (dutyRoster) db.schedules.dutyRoster = dutyRoster;

  if (writeDb(db)) {
    return res.json({ success: true, message: 'Jadwal pelajaran dan piket berhasil diperbarui!', schedules: db.schedules });
  }
  res.status(500).json({ success: false, message: 'Gagal menyimpan pembaruan jadwal.' });
});

// =================== BUKU KENANGAN (DIGITAL MEMORIES) ===================
app.post('/api/memories', (req, res) => {
  const db = readDb();
  const { name, message, badge } = req.body;

  if (!name || !message) {
    return res.status(400).json({ success: false, message: 'Nama dan pesan kenangan wajib diisi!' });
  }

  const newId = db.memories.length > 0 ? Math.max(...db.memories.map(m => m.id || 0)) + 1 : 1;
  const newMemory = {
    id: newId,
    name: name.trim().substring(0, 50),
    message: message.trim().substring(0, 300),
    badge: badge ? badge.trim().substring(0, 30) : 'Teman 9F',
    date: new Date().toISOString().split('T')[0]
  };

  db.memories.unshift(newMemory);

  if (writeDb(db)) {
    return res.json({ success: true, message: 'Pesan kenangan berhasil ditambahkan!', memory: newMemory });
  }
  res.status(500).json({ success: false, message: 'Gagal menambahkan pesan kenangan.' });
});

app.delete('/api/memories/:id', requireAuth, (req, res) => {
  const db = readDb();
  const id = parseInt(req.params.id, 10);
  db.memories = db.memories.filter(m => m.id !== id);

  if (writeDb(db)) {
    return res.json({ success: true, message: 'Pesan kenangan berhasil dihapus!' });
  }
  res.status(500).json({ success: false, message: 'Gagal menghapus pesan kenangan.' });
});

// =================== RESET TO DEFAULTS ===================
app.post('/api/reset', requireAuth, (req, res) => {
  try {
    if (fs.existsSync(DEFAULT_FILE)) {
      const defaultData = fs.readFileSync(DEFAULT_FILE, 'utf-8');
      fs.writeFileSync(DB_FILE, defaultData, 'utf-8');
      const restored = JSON.parse(defaultData);
      return res.json({
        success: true,
        message: 'Data website berhasil direset kembali ke pengaturan awal contoh!',
        data: restored
      });
    } else {
      return res.status(404).json({ success: false, message: 'File default-data.json tidak ditemukan.' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: `Gagal mereset data: ${err.message}` });
  }
});

// Admin dashboard route direct access
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Website Kelas 9F running on http://localhost:${PORT}`);
  console.log(`📋 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🔑 Default Admin: user="admin", pass="admin9f"`);
  console.log(`===============================================`);
});

