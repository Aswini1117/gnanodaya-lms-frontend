let allAnnouncements = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('INSTRUCTOR');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Instructor';
    document.getElementById('nav-avatar').textContent = (u.name || 'I').charAt(0);
  }
  await Promise.all([loadAnnouncements(), loadBatches()]);
});

async function loadAnnouncements() {
  const u           = getUser();
  const instituteId = u?.instituteId || 1;
  try {
    const res       = await api.get(`/announcements/institute/${instituteId}`);
    allAnnouncements = res?.data || res || [];
    document.getElementById('ann-count').textContent = allAnnouncements.length;
    renderAnnouncements(allAnnouncements);
  } catch (e) {
    document.getElementById('announcements-list').innerHTML =
      `<div class="empty-state">Failed to load: ${e.message}</div>`;
  }
}

async function loadBatches() {
  const u = getUser();
  try {
    const res  = await api.get(`/batches/instructor/${u?.id}`);
    const list = res?.data || res || [];
    const sel  = document.getElementById('ann-batch');
    sel.innerHTML = list.length
      ? list.map(b => `<option value="${b.id}">${b.batchName}</option>`).join('')
      : '<option value="">No batches found</option>';
  } catch (e) {
    console.error('Failed to load batches:', e);
  }
}

function toggleBatchField() {
  const target = document.getElementById('ann-target').value;
  document.getElementById('batch-field').style.display = target === 'BATCH' ? 'block' : 'none';
}

async function postAnnouncement() {
  const title   = document.getElementById('ann-title').value.trim();
  const target  = document.getElementById('ann-target').value;
  const content = document.getElementById('ann-content').value.trim();
  const batchId = document.getElementById('ann-batch').value;

  hideAlerts();
  if (!title)   { showAlert('error', 'Title is required.'); return; }
  if (!target)  { showAlert('error', 'Please select an audience.'); return; }
  if (!content) { showAlert('error', 'Message is required.'); return; }

  const u = getUser();
  const body = {
    title,
    content,
    targetType:  target,
    instituteId: u?.instituteId || 1,
    createdById: u?.id
  };
  if (target === 'BATCH' && batchId) body.batchId = parseInt(batchId);

  document.getElementById('post-btn').disabled       = true;
  document.getElementById('post-text').textContent   = 'Posting...';

  try {
    await api.post('/announcements', body);
    showAlert('success', `Announcement "${title}" posted successfully!`);
    document.getElementById('ann-title').value   = '';
    document.getElementById('ann-content').value = '';
    document.getElementById('ann-target').value  = '';
    document.getElementById('batch-field').style.display = 'none';
    await loadAnnouncements();
  } catch (e) {
    showAlert('error', 'Failed to post: ' + e.message);
  } finally {
    document.getElementById('post-btn').disabled     = false;
    document.getElementById('post-text').textContent = '📢 Post Announcement';
  }
}

function renderAnnouncements(list) {
  const container = document.getElementById('announcements-list');
  if (!list.length) {
    container.innerHTML = `<div class="empty-state">No announcements yet.</div>`;
    return;
  }
  container.innerHTML = list.map(ann => `
    <div class="list-item" style="flex-direction:column;align-items:flex-start;gap:6px;padding:14px 0">
      <div style="display:flex;justify-content:space-between;width:100%">
        <span style="font-weight:600;font-size:14px">${ann.title}</span>
        <button class="btn btn-sm btn-danger" onclick="deleteAnnouncement(${ann.id})">🗑</button>
      </div>
      <span style="font-size:13px;color:var(--text-muted)">${ann.content}</span>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="badge badge-info">${ann.targetType || '—'}</span>
        <span style="font-size:12px;color:var(--text-muted)">${formatDate(ann.createdAt)}</span>
      </div>
    </div>
  `).join('');
}

function filterAnnouncements() {
  const q      = document.getElementById('search-input').value.toLowerCase();
  const target = document.getElementById('filter-target').value;
  const filtered = allAnnouncements.filter(a => {
    const matchQ = !q || a.title?.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q);
    const matchT = !target || a.targetType === target;
    return matchQ && matchT;
  });
  renderAnnouncements(filtered);
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  try {
    await api.delete(`/announcements/${id}`);
    showToast('Deleted', 'success');
    await loadAnnouncements();
  } catch (e) {
    showToast(e.message || 'Failed', 'error');
  }
}

function showAlert(type, msg) {
  const el = document.getElementById(`form-alert-${type}`);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  setTimeout(() => hideAlerts(), 4000);
}

function hideAlerts() {
  ['form-alert-error', 'form-alert-success'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function formatDate(val) {
  if (!val) return '—';
  try {
    if (Array.isArray(val)) {
      const [y, m, d] = val;
      return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}