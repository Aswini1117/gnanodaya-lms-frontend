let allInstructors = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'A').charAt(0);
  }
  await loadInstructors();
});

// ── LOAD ───────────────────────────────────────────────
async function loadInstructors() {
  const u           = getUser();
  const instituteId = u?.instituteId || 1;
  const tb          = document.getElementById('instructors-table');
  try {
    const res      = await api.get(`/admin/instructors/${instituteId}`);
    allInstructors = res?.data || res || [];
    document.getElementById('instructor-count').textContent = allInstructors.length;
    renderTable(allInstructors);
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load: ${e.message}</td></tr>`;
  }
}

// ── RENDER ─────────────────────────────────────────────
function renderTable(data) {
  const tb = document.getElementById('instructors-table');
  if (!data.length) {
    tb.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">No instructors found. Add one using the button above.</td></tr>`;
    return;
  }
  tb.innerHTML = data.map(i => `
    <tr>
      <td>
        <div class="user-row">
          ${avatarEl(i.fullName, 'var(--primary)')}
          <div>
            <div style="font-weight:600">${i.fullName || '—'}</div>
            ${i.specialization ? `<div style="font-size:12px;color:var(--text-muted)">${i.specialization}</div>` : ''}
          </div>
        </div>
      </td>
      <td>${i.phone || '—'}</td>
      <td>${i.email || '—'}</td>
      <td>${statusBadge(i.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          ${i.status === 'ACTIVE'
            ? `<button class="btn btn-sm btn-danger" onclick="deactivateInstructor(${i.id})">🚫 Deactivate</button>`
            : `<button class="btn btn-sm btn-success" onclick="activateInstructor(${i.id})">✅ Activate</button>`
          }
        </div>
      </td>
    </tr>
  `).join('');
}

// ── FILTER ─────────────────────────────────────────────
function filterInstructors() {
  const q      = document.getElementById('search-input').value.toLowerCase();
  const status = document.getElementById('status-filter').value;
  const filtered = allInstructors.filter(i => {
    const matchQ = !q || i.fullName?.toLowerCase().includes(q) || i.phone?.includes(q);
    const matchS = !status || i.status === status;
    return matchQ && matchS;
  });
  renderTable(filtered);
}

// ── OPEN MODAL ─────────────────────────────────────────
function openAddModal() {
  document.getElementById('instructor-name').value           = '';
  document.getElementById('instructor-phone').value          = '';
  document.getElementById('instructor-email').value          = '';
  document.getElementById('instructor-password').value       = '';
  document.getElementById('instructor-specialization').value = '';
  document.getElementById('instructor-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('instructor-modal').classList.remove('show');
}

// ── SAVE (CREATE) ──────────────────────────────────────
async function saveInstructor() {
  const fullName       = document.getElementById('instructor-name').value.trim();
  const phone          = document.getElementById('instructor-phone').value.trim();
  const email          = document.getElementById('instructor-email').value.trim();
  const password       = document.getElementById('instructor-password').value;
  const specialization = document.getElementById('instructor-specialization').value.trim();

  if (!fullName)              { showToast('Full name is required', 'warning'); return; }
  if (phone.length !== 10)   { showToast('Enter a valid 10-digit phone number', 'warning'); return; }
  if (!password || password.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }

  const u           = getUser();
  const instituteId = u?.instituteId || 1;

  setSaveLoading(true);
  try {
    await api.post('/admin/instructors', {
      fullName,
      phone,
      email:          email || null,
      password,
      specialization: specialization || null,
      role:           'INSTRUCTOR',
      instituteId
    });
    showToast(`Instructor "${fullName}" created. Share phone: ${phone} and their password with them.`, 'success');
    closeModal();
    await loadInstructors();
  } catch (e) {
    showToast(e.message || 'Failed to create instructor', 'error');
  } finally {
    setSaveLoading(false);
  }
}

// ── ACTIVATE / DEACTIVATE ──────────────────────────────
async function deactivateInstructor(id) {
  if (!confirm('Deactivate this instructor? They will not be able to log in.')) return;
  try {
    await api.put(`/admin/users/${id}/status?status=INACTIVE`);
    showToast('Instructor deactivated', 'success');
    await loadInstructors();
  } catch (e) {
    showToast(e.message || 'Failed', 'error');
  }
}

async function activateInstructor(id) {
  if (!confirm('Reactivate this instructor?')) return;
  try {
    await api.put(`/admin/users/${id}/status?status=ACTIVE`);
    showToast('Instructor activated', 'success');
    await loadInstructors();
  } catch (e) {
    showToast(e.message || 'Failed', 'error');
  }
}

// ── LOADING ────────────────────────────────────────────
function setSaveLoading(loading) {
  const btn     = document.getElementById('save-btn');
  const txt     = document.getElementById('save-text');
  const spinner = document.getElementById('save-spinner');
  btn.disabled          = loading;
  txt.textContent       = loading ? 'Creating...' : 'Create Instructor';
  spinner.style.display = loading ? 'inline' : 'none';
}