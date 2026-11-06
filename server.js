require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Supabase env is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.');
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const app = express();
const PORT = process.env.PORT || 3000;

// Local JSON files are bootstrap snapshots only; Supabase is authoritative after seeding.
const LOCAL_SNAPSHOT_FILE = path.join(__dirname, 'data', 'database.json');
const DEFAULT_FILE = path.join(__dirname, 'data', 'default-data.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));
app.get('/uploads/:name', (req, res) => {
  const { data } = supabase.storage.from('uploads').getPublicUrl(req.params.name);
  res.redirect(data.publicUrl);
});
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USER ,
  password: process.env.ADMIN_PASSWORD
};
const ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ===== Database (Supabase) =====
async function saveToSupabase(content) {
  try {
    const { error } = await supabase
      .from('site_data')
      .upsert({ id: 1, content });
    if (error) {
      console.error('Gagal simpan ke Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Gagal simpan ke Supabase:', error);
    return false;
  }
}

async function readDb() {
  const { data, error } = await supabasePublic
    .from('site_data')
    .select('content')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;
  if (data?.content) return data.content;

  const { data: rows, error: checkError } = await supabase
    .from('site_data')
    .select('id')
    .limit(1);

  if (checkError) throw checkError;
  if (rows.length > 0) {
    const { data: existing, error: existingError } = await supabase
      .from('site_data')
      .select('content')
      .eq('id', 1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing?.content) return existing.content;
    throw new Error('site_data contains rows but the application record id=1 is missing; refusing to seed over existing data.');
  }

  const seedFile = fs.existsSync(LOCAL_SNAPSHOT_FILE) ? LOCAL_SNAPSHOT_FILE : DEFAULT_FILE;
  const seed = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
  const { data: inserted, error: insertError } = await supabase
    .from('site_data')
    .insert({ id: 1, content: seed })
    .select('content')
    .single();

  if (!insertError) return inserted.content;
  if (insertError.code === '23505') {
    const { data: concurrentInsert, error: readError } = await supabase
      .from('site_data')
      .select('content')
      .eq('id', 1)
      .single();
    if (readError) throw readError;
    return concurrentInsert.content;
  }
  throw insertError;
}

async function writeDb(data) {
  return saveToSupabase(data);
}



// Multer storage setup for image uploads
const storage = {
  _handleFile(req, file, cb) {
    const chunks = [];
    file.stream.on('data', (c) => chunks.push(c));
    file.stream.on('error', cb);
    file.stream.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const ext = path.extname(file.originalname) || '';
        const filename = Date.now() + '-' + crypto.randomBytes(6).toString('hex') + ext;
        const { error } = await supabase.storage
          .from('uploads')
          .upload(filename, buffer, { contentType: file.mimetype, upsert: true });
        if (error) return cb(error);
        cb(null, { filename, path: filename, size: buffer.length });
      } catch (e) {
        cb(e);
      }
    });
  },
  _removeFile(req, file, cb) {
    supabase.storage.from('uploads').remove([file.filename])
      .then(({ error }) => cb(error || null))
      .catch(cb);
  }
};

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
async function requireAuth(req, res, next) {
  if (req.authenticated) return next();
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Akses ditolak: Token autentikasi diperlukan.' });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return res.status(401).json({ success: false, message: 'Sesi admin tidak valid atau telah kedaluwarsa. Silakan login kembali.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { data, error } = await supabase
      .from('admin_sessions')
      .select('token_hash')
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(401).json({ success: false, message: 'Sesi admin tidak valid atau telah kedaluwarsa. Silakan login kembali.' });
    }
    req.authenticated = true;
    next();
  } catch (error) {
    console.error('Gagal memverifikasi sesi admin:', error);
    res.status(500).json({ success: false, message: 'Sesi admin gagal diverifikasi.' });
  }
}

// =================== AUTH ROUTES ===================
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_DURATION_MS).toISOString();
    try {
      const { error } = await supabase
        .from('admin_sessions')
        .insert({ token_hash: tokenHash, expires_at: expiresAt });
      if (error) throw error;
    } catch (error) {
      console.error('Gagal menyimpan sesi admin:', error);
      return res.status(500).json({ success: false, message: 'Sesi admin gagal dibuat.' });
    }
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

app.post('/api/auth/verify', async (req, res) => {
  const { token } = req.body;
  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    try {
      const { data, error } = await supabase
        .from('admin_sessions')
        .select('token_hash')
        .eq('token_hash', tokenHash)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (error) throw error;
      if (data) return res.json({ success: true, valid: true });
    } catch (error) {
      console.error('Gagal memverifikasi token admin:', error);
      return res.status(500).json({ success: false, valid: false, message: 'Sesi admin gagal diverifikasi.' });
    }
  }
  return res.status(401).json({ success: false, valid: false });
});

app.post('/api/auth/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      try {
        const { error } = await supabase
          .from('admin_sessions')
          .delete()
          .eq('token_hash', tokenHash);
        if (error) throw error;
      } catch (error) {
        console.error('Gagal menghapus sesi admin:', error);
        return res.status(500).json({ success: false, message: 'Sesi admin gagal diakhiri.' });
      }
    }
  }
  return res.json({ success: true, message: 'Logout berhasil.' });
});

app.use('/api', async (req, res, next) => {
  const isPublicDataRoute = req.path === '/data' ||
    (req.path === '/memories' && ['GET', 'POST'].includes(req.method));
  const isAuthOrUploadRoute = req.path.startsWith('/auth/') || req.path === '/upload';
  const loadRequestData = async () => {
    try {
      req.db = await readDb();
      next();
    } catch (error) {
      console.error(`Gagal membaca data Supabase untuk ${req.method} ${req.path}:`, error);
      res.status(500).json({ success: false, message: 'Data Supabase gagal dimuat.' });
    }
  };

  if (isAuthOrUploadRoute) return next();
  if (isPublicDataRoute) return loadRequestData();
  return requireAuth(req, res, loadRequestData);
});

// =================== PUBLIC DATA ROUTE ===================
app.get('/api/data', (req, res) => {
  const data = req.db;
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
app.put('/api/site-info', requireAuth, async (req, res) => {
  const db = req.db;
  const updatedInfo = req.body;

  // Merge site info
  db.siteInfo = {
    ...db.siteInfo,
    ...updatedInfo,
    contact: {
      ...db.siteInfo.contact,
      ...updatedInfo.contact
    }
  };

  if (await writeDb(db)) {
    return res.json({ success: true, message: 'Informasi dan pengaturan website berhasil disimpan!', data: db.siteInfo });
  }
  res.status(500).json({ success: false, message: 'Gagal menyimpan perubahan ke database.' });
});

// =================== MEMBERS (DATA SISWA) CRUD ===================
app.post('/api/members', requireAuth, async (req, res) => {
  const db = req.db;
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

  if (await writeDb(db)) {
    return res.json({ success: true, message: `Siswa ${newMember.name} berhasil ditambahkan!`, member: newMember });
  }
  res.status(500).json({ success: false, message: 'Gagal menambahkan data siswa.' });
});

app.put('/api/members/:id', requireAuth, async (req, res) => {
  const db = req.db;
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

  if (await writeDb(db)) {
    return res.json({ success: true, message: 'Data siswa berhasil diperbarui!', member: db.members[index] });
  }
  res.status(500).json({ success: false, message: 'Gagal memperbarui data siswa.' });
});

app.delete('/api/members/:id', requireAuth, async (req, res) => {
  const db = req.db;
  const id = parseInt(req.params.id, 10);
  const member = db.members.find(m => m.id === id);

  if (!member) {
    return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
  }

  db.members = db.members.filter(m => m.id !== id);

  if (await writeDb(db)) {
    return res.json({ success: true, message: `Data siswa ${member.name} berhasil dihapus!` });
  }
  res.status(500).json({ success: false, message: 'Gagal menghapus data siswa.' });
});

// =================== STRUKTUR ORGANISASI ===================
app.put('/api/organization', requireAuth, async (req, res) => {
  const db = req.db;
  const { waliKelas, ketuaKelas, wakilKetua, sekretaris, bendahara, sections } = req.body;

  db.organization = {
    waliKelas: waliKelas || db.organization.waliKelas,
    ketuaKelas: ketuaKelas || db.organization.ketuaKelas,
    wakilKetua: wakilKetua || db.organization.wakilKetua,
    sekretaris: sekretaris || db.organization.sekretaris,
    bendahara: bendahara || db.organization.bendahara,
    sections: sections || db.organization.sections
  };

  if (await writeDb(db)) {
    return res.json({ success: true, message: 'Struktur organisasi berhasil diperbarui!', data: db.organization });
  }
  res.status(500).json({ success: false, message: 'Gagal menyimpan perubahan struktur organisasi.' });
});

// =================== GALERI KELAS (KEBERSAMAAN ONLY) ===================
app.post('/api/gallery', requireAuth, async (req, res) => {
  const db = req.db;
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

  if (await writeDb(db)) {
    return res.json({ success: true, message: 'Foto kebersamaan berhasil ditambahkan ke galeri!', item: newPhoto });
  }
  res.status(500).json({ success: false, message: 'Gagal menyimpan foto ke galeri.' });
});

app.put('/api/gallery/:id', requireAuth, async (req, res) => {
  const db = req.db;
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

  if (await writeDb(db)) {
    return res.json({ success: true, message: 'Foto galeri berhasil diperbarui!', item: db.gallery[index] });
  }
  res.status(500).json({ success: false, message: 'Gagal memperbarui foto galeri.' });
});

app.delete('/api/gallery/:id', requireAuth, async (req, res) => {
  const db = req.db;
  const id = parseInt(req.params.id, 10);
  const photo = db.gallery.find(g => g.id === id);

  if (!photo) {
    return res.status(404).json({ success: false, message: 'Foto tidak ditemukan di galeri.' });
  }

  // Uploaded photo objects live in Supabase Storage, not the ephemeral deployment filesystem.
  if (photo.image && photo.image.startsWith('/uploads/')) {
    const filename = path.basename(photo.image);
    const { error } = await supabase.storage.from('uploads').remove([filename]);
    if (error) {
      console.error(`Gagal menghapus foto ${filename} dari Supabase Storage:`, error);
      return res.status(500).json({ success: false, message: 'Gagal menghapus foto dari Supabase Storage.' });
    }
  }

  db.gallery = db.gallery.filter(g => g.id !== id);

  if (await writeDb(db)) {
    return res.json({ success: true, message: 'Foto kebersamaan berhasil dihapus dari galeri!' });
  }
  res.status(500).json({ success: false, message: 'Gagal menghapus foto dari galeri.' });
});

// =================== PENGUMUMAN (ANNOUNCEMENTS) CRUD ===================
app.post('/api/announcements', requireAuth, async (req, res) => {
  const db = req.db;
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

  if (await writeDb(db)) {
    return res.json({ success: true, message: 'Pengumuman baru berhasil diterbitkan!', announcement: newAnnouncement });
  }
  res.status(500).json({ success: false, message: 'Gagal menambahkan pengumuman.' });
});

app.put('/api/announcements/:id', requireAuth, async (req, res) => {
  const db = req.db;
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

  if (await writeDb(db)) {
    return res.json({ success: true, message: 'Pengumuman berhasil diperbarui!', announcement: db.announcements[index] });
  }
  res.status(500).json({ success: false, message: 'Gagal memperbarui pengumuman.' });
});

app.delete('/api/announcements/:id', requireAuth, async (req, res) => {
  const db = req.db;
  const id = parseInt(req.params.id, 10);
  const exists = db.announcements.some(a => a.id === id);

  if (!exists) {
    return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan.' });
  }

  db.announcements = db.announcements.filter(a => a.id !== id);

  if (await writeDb(db)) {
    return res.json({ success: true, message: 'Pengumuman berhasil dihapus!' });
  }
  res.status(500).json({ success: false, message: 'Gagal menghapus pengumuman.' });
});

// =================== JADWAL (SCHEDULES) ===================
app.put('/api/schedules', requireAuth, async (req, res) => {
  try {
    const db = req.db;
    const { timetable, dutyRoster } = req.body;

    if (timetable) db.schedules.timetable = timetable;
    if (dutyRoster) db.schedules.dutyRoster = dutyRoster;

    const saved = await writeDb(db);
    if (saved) {
      return res.json({ success: true, message: 'Jadwal pelajaran dan piket berhasil diperbarui!', schedules: db.schedules });
    }
    return res.status(500).json({ success: false, message: 'Gagal menyimpan pembaruan jadwal ke Supabase.' });
  } catch (err) {
    console.error('Gagal menyimpan jadwal:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat menyimpan jadwal.' });
  }
});

// =================== BUKU KENANGAN (DIGITAL MEMORIES) ===================
app.get('/api/memories', (req, res) => {
  const db = req.db;
  res.json({ success: true, memories: Array.isArray(db.memories) ? db.memories : [] });
});

app.post('/api/memories', async (req, res) => {
  const db = req.db;
  const { name, message, badge } = req.body;

  if (typeof name !== 'string' || typeof message !== 'string' || !name.trim() || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Nama dan pesan kenangan wajib diisi!' });
  }

  db.memories = Array.isArray(db.memories) ? db.memories : [];
  const newId = db.memories.length > 0 ? Math.max(...db.memories.map(memory => memory.id || 0)) + 1 : 1;
  const newMemory = {
    id: newId,
    name: name.trim().substring(0, 50),
    message: message.trim().substring(0, 300),
    badge: typeof badge === 'string' && badge.trim() ? badge.trim().substring(0, 30) : 'Teman 9E',
    date: new Date().toISOString().split('T')[0]
  };

  db.memories.unshift(newMemory);

  if (await writeDb(db)) {
    return res.json({ success: true, message: 'Pesan kenangan berhasil ditambahkan!', memory: newMemory });
  }
  res.status(500).json({ success: false, message: 'Gagal menambahkan pesan kenangan.' });
});

app.put('/api/memories/:id', requireAuth, async (req, res) => {
  try {
    const db = req.db;
    db.memories = Array.isArray(db.memories) ? db.memories : [];
    const id = req.params.id;
    const index = db.memories.findIndex(memory =>
      memory.id === id || String(memory.id) === id || Number(memory.id) === Number(id)
    );

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Kenangan tidak ditemukan.' });
    }

    const currentMemory = db.memories[index];
    const { name, message, badge, date } = req.body;
    const updatedName = typeof name === 'string' ? name.trim() : currentMemory.name;
    const updatedMessage = typeof message === 'string' ? message.trim() : currentMemory.message;

    if (!updatedName || !updatedMessage) {
      return res.status(400).json({ success: false, message: 'Nama dan pesan kenangan wajib diisi.' });
    }

    db.memories[index] = {
      ...currentMemory,
      name: updatedName.substring(0, 50),
      message: updatedMessage.substring(0, 300),
      badge: typeof badge === 'string' ? badge.trim().substring(0, 30) : currentMemory.badge,
      date: typeof date === 'string' ? date.trim() : currentMemory.date
    };

    const saved = await writeDb(db);
    if (!saved) {
      console.error(`Gagal memperbarui kenangan ${id}: Supabase menolak penyimpanan.`);
      return res.status(500).json({ success: false, message: 'Supabase gagal menyimpan perubahan kenangan.' });
    }

    return res.json({ success: true, message: 'Kenangan berhasil diperbarui!', memory: db.memories[index] });
  } catch (err) {
    console.error(`PUT /api/memories/${req.params.id} gagal:`, err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat memperbarui kenangan.' });
  }
});

app.delete('/api/memories/:id', requireAuth, async (req, res) => {
  try {
    const db = req.db;
    db.memories = Array.isArray(db.memories) ? db.memories : [];
    const id = req.params.id;
    const index = db.memories.findIndex(memory =>
      memory.id === id || String(memory.id) === id || Number(memory.id) === Number(id)
    );

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Kenangan tidak ditemukan.' });
    }

    db.memories.splice(index, 1);
    const saved = await writeDb(db);
    if (!saved) {
      console.error(`Gagal menghapus kenangan ${id}: Supabase menolak penyimpanan.`);
      return res.status(500).json({ success: false, message: 'Supabase gagal menyimpan penghapusan kenangan.' });
    }

    return res.json({ success: true, message: 'Kenangan berhasil dihapus!' });
  } catch (err) {
    console.error(`DELETE /api/memories/${req.params.id} gagal:`, err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat menghapus kenangan.' });
  }
});

// =================== RESET TO DEFAULTS ===================
app.post('/api/reset', requireAuth, (req, res) => {
  return res.status(409).json({
    success: false,
    message: 'Reset data contoh dinonaktifkan agar tidak menimpa data yang tersimpan di Supabase.'
  });
});

// Admin dashboard route direct access
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Website Kelas 9E running on http://localhost:${PORT}`);
    console.log(`📋 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`===============================================`);
  });
}

module.exports = app;
