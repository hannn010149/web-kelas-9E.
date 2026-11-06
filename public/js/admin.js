/**
 * ADMIN DASHBOARD JAVASCRIPT - WEBSITE KELAS 9E
 * Full CRUD, Photo Uploads, Live Previews, Permanent Backend Persistence
 */

let adminToken = localStorage.getItem('admin_token_9f') || '';
let adminData = null;
let activeTab = 'overview';

// Track file upload previews
let heroFileToUpload = null;
let logoFileToUpload = null;
let galleryFileToUpload = null;

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initSidebar();
  initThemeToggle();
});

// =================== AUTHENTICATION ===================
async function initAuth() {
  const loginOverlay = document.getElementById('loginOverlay');
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('adminUsername').value.trim();
      const password = document.getElementById('adminPassword').value.trim();

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const result = await res.json();
        if (result.success && result.token) {
          adminToken = result.token;
          localStorage.setItem('admin_token_9f', adminToken);
          loginOverlay.style.display = 'none';
          showAdminToast('Login berhasil! Selamat datang di Admin Dashboard.', 'success');
          loadAdminData();
        } else {
          showAdminToast(result.message || 'Username atau password salah!', 'error');
        }
      } catch (err) {
        showAdminToast('Gagal terhubung ke server autentikasi.', 'error');
      }
    });
  }

  // Check existing token
  if (adminToken) {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: adminToken })
      });
      const result = await res.json();
      if (result.success && result.valid) {
        loginOverlay.style.display = 'none';
        loadAdminData();
      } else {
        logout();
      }
    } catch (err) {
      logout();
    }
  } else {
    loginOverlay.style.display = 'flex';
  }
}

function logout() {
  if (adminToken) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).catch(() => {});
  }
  adminToken = '';
  localStorage.removeItem('admin_token_9f');
  document.getElementById('loginOverlay').style.display = 'flex';
}

function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };
}

// =================== FETCH & LOAD ADMIN DATA ===================
async function loadAdminData() {
  try {
    const res = await fetch('/api/data');
    const result = await res.json();
    if (result.success && result.data) {
      adminData = result.data;
      renderAdminOverview();
      populateSiteInfoForm();
      populatePhotoTab();
      renderAdminMembers();
      populateOrgForm();
      renderAdminAnnouncements();
      populateSchedulesTab();
      renderAdminMemories();
      populateSettingsTab();
    }
  } catch (err) {
    showAdminToast('Gagal memuat data dari server.', 'error');
  }
}

// =================== SIDEBAR & TABS ===================
function initSidebar() {
  const navItems = document.querySelectorAll('.admin-nav-item');
  const panes = document.querySelectorAll('.admin-tab-pane');
  const titleEl = document.getElementById('adminCurrentTabTitle');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabKey = item.getAttribute('data-tab');
      if (!tabKey) return;

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      panes.forEach(p => p.classList.remove('active'));
      const activePane = document.getElementById(`tab-${tabKey}`);
      if (activePane) activePane.classList.add('active');

      activeTab = tabKey;
      if (titleEl) titleEl.textContent = item.textContent.trim();

      // Close mobile sidebar if open
      document.querySelector('.admin-sidebar')?.classList.remove('open');
    });
  });

  // Mobile sidebar toggle
  const toggleBtn = document.getElementById('adminMobileToggle');
  const sidebar = document.querySelector('.admin-sidebar');
  toggleBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });
}

function initThemeToggle() {
  const current = localStorage.getItem('theme_9f') || 'dark';
  document.documentElement.setAttribute('data-theme', current);
}

// =================== 1. OVERVIEW TAB ===================
function renderAdminOverview() {
  if (!adminData) return;
  document.getElementById('ovTotalMembers').textContent = adminData.members?.length || 0;
  document.getElementById('ovTotalGallery').textContent = adminData.gallery?.length || 0;
  document.getElementById('ovTotalAnnouncements').textContent = adminData.announcements?.length || 0;
  document.getElementById('ovTotalMemories').textContent = adminData.memories?.length || 0;

  document.getElementById('ovClassName').textContent = adminData.siteInfo?.className || '-';
  document.getElementById('ovWaliKelas').textContent = adminData.siteInfo?.homeroomTeacher?.name || '-';
  document.getElementById('ovCountdownTitle').textContent = adminData.siteInfo?.countdown?.title || '-';
}

// =================== 2. EDIT TULISAN & SITE INFO ===================
function populateSiteInfoForm() {
  const info = adminData?.siteInfo;
  if (!info) return;

  document.getElementById('editClassName').value = info.className || '';
  document.getElementById('editSchoolName').value = info.schoolName || '';
  document.getElementById('editMotto').value = info.motto || '';
  document.getElementById('editShortDesc').value = info.shortDescription || '';
  document.getElementById('editExploreBtn').value = info.exploreButtonText || '';
  document.getElementById('editGalleryBtn').value = info.galleryButtonText || '';

  // Visi Misi
  document.getElementById('editVision').value = (info.vision || []).join('\n');
  document.getElementById('editMission').value = (info.mission || []).join('\n');

  // Homeroom Teacher
  const t = info.homeroomTeacher || {};
  document.getElementById('editTeacherName').value = t.name || '';
  document.getElementById('editTeacherTitle').value = t.title || '';
  document.getElementById('editTeacherSubject').value = t.subject || '';
  document.getElementById('editTeacherNip').value = t.nip || '';
  document.getElementById('editTeacherQuote').value = t.quote || '';

  // Contact
  const c = info.contact || {};
  document.getElementById('editContactEmail').value = c.email || '';
  document.getElementById('editContactPhone').value = c.phone || '';
  document.getElementById('editContactIg').value = c.instagram || '';
  document.getElementById('editContactTiktok').value = c.tiktok || '';
  document.getElementById('editContactAddress').value = c.address || '';
  document.getElementById('editFooterText').value = info.footerText || '';
}

async function saveSiteInfo(e) {
  e.preventDefault();
  const visionArr = document.getElementById('editVision').value.split('\n').map(s => s.trim()).filter(Boolean);
  const missionArr = document.getElementById('editMission').value.split('\n').map(s => s.trim()).filter(Boolean);

  const updated = {
    className: document.getElementById('editClassName').value.trim(),
    schoolName: document.getElementById('editSchoolName').value.trim(),
    motto: document.getElementById('editMotto').value.trim(),
    shortDescription: document.getElementById('editShortDesc').value.trim(),
    exploreButtonText: document.getElementById('editExploreBtn').value.trim(),
    galleryButtonText: document.getElementById('editGalleryBtn').value.trim(),
    vision: visionArr,
    mission: missionArr,
    homeroomTeacher: {
      ...adminData.siteInfo.homeroomTeacher,
      name: document.getElementById('editTeacherName').value.trim(),
      title: document.getElementById('editTeacherTitle').value.trim(),
      subject: document.getElementById('editTeacherSubject').value.trim(),
      nip: document.getElementById('editTeacherNip').value.trim(),
      quote: document.getElementById('editTeacherQuote').value.trim()
    },
    contact: {
      email: document.getElementById('editContactEmail').value.trim(),
      phone: document.getElementById('editContactPhone').value.trim(),
      instagram: document.getElementById('editContactIg').value.trim(),
      tiktok: document.getElementById('editContactTiktok').value.trim(),
      address: document.getElementById('editContactAddress').value.trim()
    },
    footerText: document.getElementById('editFooterText').value.trim()
  };

  try {
    const res = await fetch('/api/site-info', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updated)
    });
    const result = await res.json();
    if (result.success) {
      showAdminToast('Perubahan tulisan dan info website berhasil disimpan!', 'success');
      loadAdminData();
    } else {
      showAdminToast(result.message || 'Gagal menyimpan info website', 'error');
    }
  } catch (err) {
    showAdminToast('Terjadi kesalahan jaringan.', 'error');
  }
}

// =================== 3. INPUT & GANTI FOTO MANUAL ===================
function populatePhotoTab() {
  const info = adminData?.siteInfo;
  if (!info) return;

  // Hero Preview
  const heroPrev = document.getElementById('adminHeroPreview');
  if (heroPrev) heroPrev.src = info.heroImage || '/uploads/hero-class.svg';

  // Render Gallery Management list
  renderAdminGalleryList();
}

// Hero photo input change
function previewHeroFile(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('adminHeroPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
    heroFileToUpload = file;
  }
}

async function uploadHeroPhoto() {
  if (!heroFileToUpload) {
    showAdminToast('Silakan pilih file foto terlebih dahulu.', 'warning');
    return;
  }

  const formData = new FormData();
  formData.append('photo', heroFileToUpload);

  try {
    showAdminToast('Mengunggah foto hero...', 'info');
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: formData
    });
    const result = await res.json();
    if (result.success && result.url) {
      // Save new hero image URL to siteInfo
      await fetch('/api/site-info', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ heroImage: result.url })
      });
      showAdminToast('Foto Hero Section berhasil diganti dan disimpan!', 'success');
      heroFileToUpload = null;
      loadAdminData();
    } else {
      showAdminToast(result.message || 'Gagal mengunggah foto hero', 'error');
    }
  } catch (err) {
    showAdminToast('Terjadi kesalahan saat mengunggah foto.', 'error');
  }
}

function renderAdminGalleryList() {
  const tbody = document.getElementById('adminGalleryTableBody');
  if (!tbody) return;

  const photos = adminData.gallery || [];
  if (photos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Belum ada foto kebersamaan di galeri.</td></tr>`;
    return;
  }

  tbody.innerHTML = photos.map(item => `
    <tr>
      <td style="width: 70px;">
        <img src="${item.image}" style="width: 50px; height: 40px; object-fit: cover; border-radius: 6px;" onerror="this.src='/uploads/hero-class.svg'">
      </td>
      <td><strong>${item.title}</strong></td>
      <td><span class="badge-tag" style="margin:0; padding:2px 10px; font-size:0.75rem;">${item.category || 'Kebersamaan'}</span></td>
      <td><small style="color: var(--admin-text-muted);">${item.date}</small></td>
      <td>
        <div class="action-btns">
          <button class="btn-icon delete" title="Hapus Foto" onclick="confirmDeleteGallery(${item.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function previewNewGalleryFile(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('newGalleryPreview').src = e.target.result;
      document.getElementById('newGalleryPreviewBox').style.display = 'block';
    };
    reader.readAsDataURL(file);
    galleryFileToUpload = file;
  }
}

async function submitNewGalleryPhoto(e) {
  e.preventDefault();
  const title = document.getElementById('newPhotoTitle').value.trim();
  const category = document.getElementById('newPhotoCategory').value;
  const date = document.getElementById('newPhotoDate').value.trim();
  const description = document.getElementById('newPhotoDesc').value.trim();
  const urlInput = document.getElementById('newPhotoUrl').value.trim();

  let finalImageUrl = urlInput;

  // If a file was uploaded from device, upload it first
  if (galleryFileToUpload) {
    const formData = new FormData();
    formData.append('photo', galleryFileToUpload);
    try {
      showAdminToast('Mengunggah file foto...', 'info');
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: formData
      });
      const uploadResult = await uploadRes.json();
      if (!uploadResult.success || !uploadResult.url) {
        showAdminToast(uploadResult.message || 'Gagal mengunggah file foto.', 'error');
        return;
      }
      finalImageUrl = uploadResult.url;
    } catch (err) {
      showAdminToast('Error mengunggah foto ke server.', 'error');
      return;
    }
  }

  if (!finalImageUrl) {
    showAdminToast('Harap pilih file foto atau masukkan URL foto!', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/gallery', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title,
        category,
        date: date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        description,
        image: finalImageUrl
      })
    });
    const result = await res.json();
    if (result.success) {
      showAdminToast('Foto kebersamaan berhasil ditambahkan ke galeri!', 'success');
      document.getElementById('addGalleryForm').reset();
      document.getElementById('newGalleryPreviewBox').style.display = 'none';
      galleryFileToUpload = null;
      loadAdminData();
    } else {
      showAdminToast(result.message || 'Gagal menambahkan foto', 'error');
    }
  } catch (err) {
    showAdminToast('Terjadi kesalahan jaringan.', 'error');
  }
}

async function confirmDeleteGallery(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus foto kebersamaan ini dari galeri?')) {
    return;
  }

  try {
    const res = await fetch(`/api/gallery/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const result = await res.json();
    if (result.success) {
      showAdminToast('Foto berhasil dihapus dari galeri.', 'success');
      loadAdminData();
    } else {
      showAdminToast(result.message || 'Gagal menghapus foto', 'error');
    }
  } catch (err) {
    showAdminToast('Terjadi kesalahan jaringan.', 'error');
  }
}

// =================== 4. KELOLA DATA SISWA (MEMBERS CRUD) ===================
let memberSearchAdmin = '';

function renderAdminMembers() {
  const tbody = document.getElementById('adminMembersTableBody');
  if (!tbody) return;

  let list = adminData.members || [];
  if (memberSearchAdmin.trim() !== '') {
    const q = memberSearchAdmin.toLowerCase();
    list = list.filter(m => m.name.toLowerCase().includes(q) || String(m.noAbsen).includes(q));
  }

  tbody.innerHTML = list.map(m => `
    <tr>
      <td><strong>#${String(m.noAbsen).padStart(2, '0')}</strong></td>
      <td>
        <strong>${m.name}</strong>
      </td>
      <td>
        <span class="badge-tag" style="margin:0; padding:2px 8px; font-size:0.75rem;">
          ${m.role || 'Anggota'}
        </span>
      </td>
      <td>${m.gender || '-'}</td>
      <td><small style="color:var(--admin-text-muted);">${m.birthDate || '-'}</small></td>
      <td>
        <div class="action-btns">
          <button class="btn-icon edit" title="Edit Siswa" onclick="openEditMemberModal(${m.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon delete" title="Hapus Siswa" onclick="confirmDeleteMember(${m.id}, '${m.name.replace(/'/g, "\\'")}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterAdminMembers(q) {
  memberSearchAdmin = q;
  renderAdminMembers();
}

function openAddMemberModal() {
  document.getElementById('memberModalTitle').textContent = 'Tambah Data Siswa';
  document.getElementById('memberForm').reset();
  document.getElementById('memberEditId').value = '';
  // Suggest next absen number
  const maxAbsen = (adminData.members || []).reduce((max, m) => Math.max(max, m.noAbsen || 0), 0);
  document.getElementById('modalMemberAbsen').value = maxAbsen + 1;
  document.getElementById('memberModal').classList.add('open');
}

function openEditMemberModal(id) {
  const m = (adminData.members || []).find(item => item.id === id);
  if (!m) return;

  document.getElementById('memberModalTitle').textContent = 'Edit Data Siswa';
  document.getElementById('memberEditId').value = m.id;
  document.getElementById('modalMemberName').value = m.name;
  document.getElementById('modalMemberAbsen').value = m.noAbsen;
  document.getElementById('modalMemberRole').value = m.role || 'Anggota';
  document.getElementById('modalMemberGender').value = m.gender || 'Laki-laki';
  document.getElementById('modalMemberBirthDate').value = m.birthDate || '';

  document.getElementById('memberModal').classList.add('open');
}

function closeMemberModal() {
  document.getElementById('memberModal').classList.remove('open');
}

async function saveMemberModal(e) {
  e.preventDefault();
  const id = document.getElementById('memberEditId').value;
  const name = document.getElementById('modalMemberName').value.trim();
  const noAbsen = parseInt(document.getElementById('modalMemberAbsen').value, 10);
  const role = document.getElementById('modalMemberRole').value.trim();
  const gender = document.getElementById('modalMemberGender').value;
  const birthDate = document.getElementById('modalMemberBirthDate').value;

  if (!name || isNaN(noAbsen)) {
    showAdminToast('Nama dan nomor absen wajib diisi!', 'warning');
    return;
  }

  const payload = { name, noAbsen, role, gender, birthDate };

  try {
    const url = id ? `/api/members/${id}` : '/api/members';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showAdminToast(id ? 'Data siswa berhasil diperbarui!' : 'Siswa baru berhasil ditambahkan!', 'success');
      closeMemberModal();
      loadAdminData();
    } else {
      showAdminToast(result.message || 'Gagal menyimpan data siswa', 'error');
    }
  } catch (err) {
    showAdminToast('Terjadi kesalahan jaringan.', 'error');
  }
}

async function confirmDeleteMember(id, name) {
  if (!confirm(`Apakah Anda yakin ingin menghapus data siswa "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/members/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const result = await res.json();
    if (result.success) {
      showAdminToast(`Data siswa ${name} berhasil dihapus.`, 'success');
      loadAdminData();
    } else {
      showAdminToast(result.message || 'Gagal menghapus data siswa', 'error');
    }
  } catch (err) {
    showAdminToast('Terjadi kesalahan jaringan.', 'error');
  }
}

// =================== 5. STRUKTUR ORGANISASI ===================
function populateOrgForm() {
  const org = adminData.organization;
  if (!org) return;

  document.getElementById('orgEditWali').value = org.waliKelas?.name || '';
  document.getElementById('orgEditKetua').value = org.ketuaKelas?.name || '';
  document.getElementById('orgEditKetuaAbsen').value = org.ketuaKelas?.absen || '';
  document.getElementById('orgEditWakil').value = org.wakilKetua?.name || '';
  document.getElementById('orgEditWakilAbsen').value = org.wakilKetua?.absen || '';

  const s1 = org.sekretaris?.[0] || {};
  const s2 = org.sekretaris?.[1] || {};
  document.getElementById('orgEditSek1').value = s1.name || '';
  document.getElementById('orgEditSek1Absen').value = s1.absen || '';
  document.getElementById('orgEditSek2').value = s2.name || '';
  document.getElementById('orgEditSek2Absen').value = s2.absen || '';

  const b1 = org.bendahara?.[0] || {};
  const b2 = org.bendahara?.[1] || {};
  document.getElementById('orgEditBen1').value = b1.name || '';
  document.getElementById('orgEditBen1Absen').value = b1.absen || '';
  document.getElementById('orgEditBen2').value = b2.name || '';
  document.getElementById('orgEditBen2Absen').value = b2.absen || '';

  // Render sections
  renderAdminSectionsList();
}

function renderAdminSectionsList() {
  const container = document.getElementById('adminSectionsEditor');
  if (!container) return;

  const sections = adminData.organization?.sections || [];
  container.innerHTML = sections.map((sec, idx) => `
    <div class="admin-card" style="margin-bottom: 14px; padding: 18px;">
      <div style="font-weight: 700; color: var(--admin-accent); margin-bottom: 8px;">
        <i class="fas fa-layer-group"></i> ${sec.name}
      </div>
      <div class="form-grid-2">
        <div class="admin-form-group">
          <label>Koordinator:</label>
          <input type="text" class="admin-input" id="secCoord_${idx}" value="${sec.coordinator}">
        </div>
        <div class="admin-form-group">
          <label>Anggota (pisahkan dengan koma):</label>
          <input type="text" class="admin-input" id="secMembers_${idx}" value="${(sec.members || []).join(', ')}">
        </div>
      </div>
    </div>
  `).join('');
}

async function saveOrganization(e) {
  e.preventDefault();
  const org = adminData.organization;

  const sections = (org.sections || []).map((sec, idx) => {
    const coordEl = document.getElementById(`secCoord_${idx}`);
    const membersEl = document.getElementById(`secMembers_${idx}`);
    return {
      ...sec,
      coordinator: coordEl ? coordEl.value.trim() : sec.coordinator,
      members: membersEl ? membersEl.value.split(',').map(s => s.trim()).filter(Boolean) : sec.members
    };
  });

  const payload = {
    waliKelas: {
      ...org.waliKelas,
      name: document.getElementById('orgEditWali').value.trim()
    },
    ketuaKelas: {
      role: 'Ketua Kelas',
      name: document.getElementById('orgEditKetua').value.trim(),
      absen: parseInt(document.getElementById('orgEditKetuaAbsen').value, 10) || 0
    },
    wakilKetua: {
      role: 'Wakil Ketua',
      name: document.getElementById('orgEditWakil').value.trim(),
      absen: parseInt(document.getElementById('orgEditWakilAbsen').value, 10) || 0
    },
    sekretaris: [
      {
        role: 'Sekretaris 1',
        name: document.getElementById('orgEditSek1').value.trim(),
        absen: parseInt(document.getElementById('orgEditSek1Absen').value, 10) || 0
      },
      {
        role: 'Sekretaris 2',
        name: document.getElementById('orgEditSek2').value.trim(),
        absen: parseInt(document.getElementById('orgEditSek2Absen').value, 10) || 0
      }
    ],
    bendahara: [
      {
        role: 'Bendahara 1',
        name: document.getElementById('orgEditBen1').value.trim(),
        absen: parseInt(document.getElementById('orgEditBen1Absen').value, 10) || 0
      },
      {
        role: 'Bendahara 2',
        name: document.getElementById('orgEditBen2').value.trim(),
        absen: parseInt(document.getElementById('orgEditBen2Absen').value, 10) || 0
      }
    ],
    sections
  };

  try {
    const res = await fetch('/api/organization', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showAdminToast('Struktur organisasi berhasil diperbarui!', 'success');
      loadAdminData();
    } else {
      showAdminToast(result.message || 'Gagal menyimpan organisasi', 'error');
    }
  } catch (err) {
    showAdminToast('Terjadi kesalahan jaringan.', 'error');
  }
}

// =================== 6. KELOLA PENGUMUMAN (CRUD) ===================
function renderAdminAnnouncements() {
  const tbody = document.getElementById('adminAnnounceTableBody');
  if (!tbody) return;

  const items = adminData.announcements || [];
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Belum ada pengumuman.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(a => `
    <tr>
      <td>${a.isPinned ? '<i class="fas fa-thumbtack text-sky-400" title="Disematkan"></i>' : ''}</td>
      <td><strong>${a.title}</strong></td>
      <td><span class="badge-tag" style="margin:0; padding:2px 8px; font-size:0.75rem;">${a.category}</span></td>
      <td><small style="color:var(--admin-text-muted);">${a.date}</small></td>
      <td>
        <div class="action-btns">
          <button class="btn-icon edit" title="Edit Pengumuman" onclick="openEditAnnouncementModal(${a.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon delete" title="Hapus Pengumuman" onclick="confirmDeleteAnnouncement(${a.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddAnnouncementModal() {
  document.getElementById('announceModalTitle').textContent = 'Tambah Pengumuman Baru';
  document.getElementById('announceForm').reset();
  document.getElementById('announceEditId').value = '';
  document.getElementById('modalAnnounceDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('announceModal').classList.add('open');
}

function openEditAnnouncementModal(id) {
  const a = (adminData.announcements || []).find(item => item.id === id);
  if (!a) return;

  document.getElementById('announceModalTitle').textContent = 'Edit Pengumuman';
  document.getElementById('announceEditId').value = a.id;
  document.getElementById('modalAnnounceTitle').value = a.title;
  document.getElementById('modalAnnounceCategory').value = a.category;
  document.getElementById('modalAnnounceDate').value = a.date;
  document.getElementById('modalAnnouncePinned').checked = Boolean(a.isPinned);
  document.getElementById('modalAnnounceContent').value = a.content;

  document.getElementById('announceModal').classList.add('open');
}

function closeAnnouncementModal() {
  document.getElementById('announceModal').classList.remove('open');
}

async function saveAnnouncementModal(e) {
  e.preventDefault();
  const id = document.getElementById('announceEditId').value;
  const title = document.getElementById('modalAnnounceTitle').value.trim();
  const category = document.getElementById('modalAnnounceCategory').value;
  const date = document.getElementById('modalAnnounceDate').value;
  const isPinned = document.getElementById('modalAnnouncePinned').checked;
  const content = document.getElementById('modalAnnounceContent').value.trim();

  if (!title || !content) {
    showAdminToast('Judul dan isi pengumuman wajib diisi!', 'warning');
    return;
  }

  const payload = { title, category, date, isPinned, content };

  try {
    const url = id ? `/api/announcements/${id}` : '/api/announcements';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showAdminToast(id ? 'Pengumuman berhasil diperbarui!' : 'Pengumuman baru berhasil diterbitkan!', 'success');
      closeAnnouncementModal();
      loadAdminData();
    } else {
      showAdminToast(result.message || 'Gagal menyimpan pengumuman', 'error');
    }
  } catch (err) {
    showAdminToast('Terjadi kesalahan jaringan.', 'error');
  }
}

async function confirmDeleteAnnouncement(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;

  try {
    const res = await fetch(`/api/announcements/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const result = await res.json();
    if (result.success) {
      showAdminToast('Pengumuman berhasil dihapus.', 'success');
      loadAdminData();
    } else {
      showAdminToast(result.message || 'Gagal menghapus pengumuman', 'error');
    }
  } catch (err) {
    showAdminToast('Terjadi kesalahan jaringan.', 'error');
  }
}

// =================== KELOLA KENANGAN ===================
function escapeAdminHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function renderAdminMemories() {
  const container = document.getElementById('adminMemoriesList');
  if (!container) return;

  const memories = adminData?.memories || [];
  if (!memories.length) {
    container.innerHTML = '<p style="color:var(--admin-text-muted);">Belum ada kenangan.</p>';
    return;
  }

  container.innerHTML = `
    <div class="admin-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr><th>Nama / Status</th><th>Pesan</th><th>Tanggal</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          ${memories.map(memory => `
            <tr>
              <td>${escapeAdminHtml(memory.name)}<br><small>${escapeAdminHtml(memory.badge || 'Teman 9E')}</small></td>
              <td>${escapeAdminHtml(memory.message)}</td>
              <td>${escapeAdminHtml(memory.date || '')}</td>
              <td>
                <div class="action-btns">
                  <button type="button" class="btn-icon edit" data-memory-action="edit" data-memory-id="${Number(memory.id)}" title="Edit" aria-label="Edit kenangan">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button type="button" class="btn-icon delete" data-memory-action="delete" data-memory-id="${Number(memory.id)}" title="Hapus" aria-label="Hapus kenangan">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.onclick = event => {
    const button = event.target.closest('[data-memory-action]');
    if (!button) return;
    const id = Number(button.dataset.memoryId);
    if (button.dataset.memoryAction === 'edit') openMemoryEditModal(id);
    if (button.dataset.memoryAction === 'delete') confirmDeleteMemory(id);
  };
}

function openMemoryEditModal(id) {
  const memory = (adminData?.memories || []).find(item => Number(item.id) === id);
  if (!memory) return;

  document.getElementById('memoryEditId').value = memory.id;
  document.getElementById('memoryEditName').value = memory.name || '';
  document.getElementById('memoryEditBadge').value = memory.badge || '';
  document.getElementById('memoryEditMessage').value = memory.message || '';
  document.getElementById('memoryEditDate').value = memory.date || '';
  document.getElementById('memoryEditModal').classList.add('open');
}

function closeMemoryEditModal() {
  document.getElementById('memoryEditModal').classList.remove('open');
}

async function saveMemoryEdit(event) {
  event.preventDefault();
  const id = document.getElementById('memoryEditId').value;
  const payload = {
    name: document.getElementById('memoryEditName').value.trim(),
    badge: document.getElementById('memoryEditBadge').value.trim(),
    message: document.getElementById('memoryEditMessage').value.trim(),
    date: document.getElementById('memoryEditDate').value
  };

  if (!payload.name || !payload.message) {
    showAdminToast('Nama dan pesan wajib diisi!', 'warning');
    return;
  }

  try {
    const res = await fetch(`/api/memories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const responseText = await res.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`HTTP ${res.status}: respons server bukan JSON${responseText ? ` — ${responseText.slice(0, 200)}` : ''}`);
    }

    if (!res.ok || !result.success) {
      throw new Error(`HTTP ${res.status}: ${result.message || res.statusText}`);
    }

    showAdminToast('Kenangan berhasil diperbarui!', 'success');
    closeMemoryEditModal();
    await loadAdminData();
  } catch (err) {
    showAdminToast(`Gagal menyimpan kenangan: ${err.message}`, 'error');
  }
}

async function confirmDeleteMemory(id) {
  if (!confirm('Yakin hapus kenangan ini?')) return;

  try {
    const res = await fetch(`/api/memories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const result = await res.json();
    if (result.success) {
      showAdminToast('Kenangan berhasil dihapus.', 'success');
      loadAdminData();
    } else {
      showAdminToast(result.message || 'Gagal menghapus kenangan.', 'error');
    }
  } catch (err) {
    showAdminToast('Terjadi kesalahan jaringan.', 'error');
  }
}

// =================== 7. KELOLA JADWAL ===================
let adminScheduleDay = 'Senin';

function populateSchedulesTab() {
  renderAdminTimetableForDay(adminScheduleDay);
  populateAdminPiket();
}

function switchAdminScheduleDay(day, btn) {
  adminScheduleDay = day;
  document.querySelectorAll('.admin-day-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAdminTimetableForDay(day);
}

function renderAdminTimetableForDay(day) {
  const container = document.getElementById('adminTimetableEditor');
  if (!container) return;

  const list = adminData.schedules?.timetable?.[day] || [];
  container.innerHTML = list.map((item, idx) => `
    <div style="display: flex; gap: 12px; margin-bottom: 10px; align-items: center;">
      <input type="text" class="admin-input" style="width: 140px;" id="tt_time_${idx}" value="${item.time}" placeholder="Jam">
      <input type="text" class="admin-input" style="flex: 1;" id="tt_sub_${idx}" value="${item.subject}" placeholder="Mata Pelajaran">
      <input type="text" class="admin-input" style="flex: 1;" id="tt_teach_${idx}" value="${item.teacher}" placeholder="Guru Pengampu">
      <button type="button" class="btn-icon delete" title="Hapus Mapel" onclick="deleteTimetableItem('${day}', ${idx})">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function addTimetableRow() {
  if (!adminData.schedules.timetable[adminScheduleDay]) {
    adminData.schedules.timetable[adminScheduleDay] = [];
  }
  adminData.schedules.timetable[adminScheduleDay].push({
    time: '07.00 - 08.20',
    subject: 'Mata Pelajaran Baru',
    teacher: 'Nama Guru'
  });
  renderAdminTimetableForDay(adminScheduleDay);
}

function deleteTimetableItem(day, index) {
  adminData.schedules.timetable[day].splice(index, 1);
  renderAdminTimetableForDay(day);
}

function populateAdminPiket() {
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const roster = adminData.schedules?.dutyRoster || {};

  days.forEach(d => {
    const el = document.getElementById(`piketInput_${d}`);
    if (el) el.value = (roster[d] || []).join(', ');
  });
}

async function saveSchedules(e) {
  e.preventDefault();

  // Read current day timetable items
  const currentList = adminData.schedules.timetable[adminScheduleDay] || [];
  for (let idx = 0; idx < currentList.length; idx++) {
    const timeEl = document.getElementById(`tt_time_${idx}`);
    const subEl = document.getElementById(`tt_sub_${idx}`);
    const teachEl = document.getElementById(`tt_teach_${idx}`);
    if (timeEl && subEl && teachEl) {
      currentList[idx] = {
        time: timeEl.value.trim(),
        subject: subEl.value.trim(),
        teacher: teachEl.value.trim()
      };
    }
  }

  // Read piket
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const newDutyRoster = {};
  days.forEach(d => {
    const el = document.getElementById(`piketInput_${d}`);
    if (el) {
      newDutyRoster[d] = el.value.split(',').map(s => s.trim()).filter(Boolean);
    }
  });

  const payload = {
    timetable: adminData.schedules.timetable,
    dutyRoster: newDutyRoster
  };

  try {
    const res = await fetch('/api/schedules', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showAdminToast('Jadwal pelajaran dan piket berhasil disimpan!', 'success');
      loadAdminData();
    } else {
      showAdminToast(result.message || 'Gagal menyimpan jadwal', 'error');
    }
  } catch (err) {
    showAdminToast('Terjadi kesalahan jaringan.', 'error');
  }
}

// =================== 8. PENGATURAN WEBSITE & COUNTDOWN ===================
function populateSettingsTab() {
  const cd = adminData.siteInfo?.countdown || {};
  document.getElementById('settingsCdTitle').value = cd.title || '';
  document.getElementById('settingsCdDate').value = cd.targetDate ? cd.targetDate.substring(0, 16) : '';
  document.getElementById('settingsCdDesc').value = cd.description || '';

  const theme = adminData.siteInfo?.theme || {};
  document.getElementById('settingsThemeMode').value = theme.mode || 'dark';
  document.getElementById('settingsThemeColor').value = theme.primaryColor || '#1e3a8a';
}

async function saveSettings(e) {
  e.preventDefault();
  const cdTitle = document.getElementById('settingsCdTitle').value.trim();
  const cdDate = document.getElementById('settingsCdDate').value;
  const cdDesc = document.getElementById('settingsCdDesc').value.trim();

  const themeMode = document.getElementById('settingsThemeMode').value;
  const themeColor = document.getElementById('settingsThemeColor').value;

  const updatedSiteInfo = {
    countdown: {
      title: cdTitle,
      targetDate: cdDate,
      description: cdDesc
    },
    theme: {
      mode: themeMode,
      primaryColor: themeColor,
      accentColor: '#0284c7'
    }
  };

  try {
    const res = await fetch('/api/site-info', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedSiteInfo)
    });
    const result = await res.json();
    if (result.success) {
      showAdminToast('Pengaturan website & countdown berhasil disimpan!', 'success');
      localStorage.setItem('theme_9f', themeMode);
      document.documentElement.setAttribute('data-theme', themeMode);
      loadAdminData();
    } else {
      showAdminToast(result.message || 'Gagal menyimpan pengaturan', 'error');
    }
  } catch (err) {
    showAdminToast('Terjadi kesalahan jaringan.', 'error');
  }
}

// =================== RESET DATA DENGAN KONFIRMASI ===================
async function confirmResetDatabase() {
  const code = prompt('PERINGATAN: Tindakan ini akan mengembalikan seluruh data website (tulisan, siswa, pengumuman, dan jadwal) ke data contoh awal.\n\nKetik "RESET" untuk mengonfirmasi:');
  if (code !== 'RESET') {
    showAdminToast('Reset dibatalkan.', 'info');
    return;
  }

  try {
    showAdminToast('Mereset database ke pengaturan awal...', 'info');
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const result = await res.json();
    if (result.success) {
      showAdminToast('Data website berhasil direset ke pengaturan default!', 'success');
      loadAdminData();
    } else {
      showAdminToast(result.message || 'Gagal mereset data', 'error');
    }
  } catch (err) {
    showAdminToast('Terjadi kesalahan saat mereset data.', 'error');
  }
}

// =================== TOAST NOTIFICATIONS ===================
function showAdminToast(message, type = 'info') {
  const container = document.getElementById('adminToastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `admin-toast`;
  if (type === 'success') toast.style.borderLeftColor = 'var(--admin-success)';
  if (type === 'error') toast.style.borderLeftColor = 'var(--admin-danger)';
  if (type === 'warning') toast.style.borderLeftColor = 'var(--admin-warning)';

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
