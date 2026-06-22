let modules = [];
const urlParams = new URLSearchParams(window.location.search);
const courseId  = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('INSTRUCTOR');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Instructor';
    document.getElementById('nav-avatar').textContent = (u.name || 'I').charAt(0);
  }
  if (courseId) {
    document.getElementById('page-title').textContent = 'Edit Course';
    await loadCourse();
  }
});

async function loadCourse() {
  try {
    const d = await api.get(`/instructor/courses/${courseId}`);
    document.getElementById('course-id').value       = d.id;
    document.getElementById('course-title').value    = d.title || '';
    document.getElementById('course-desc').value     = d.description || '';
    document.getElementById('course-category').value = d.category || '';
    document.getElementById('course-status').value   = d.status || 'DRAFT';
    modules = d.modules || [];
    renderModules();
  } catch (e) { showToast('Failed to load course', 'error'); }
}

function renderModules() {
  const el = document.getElementById('modules-list');
  if (!modules.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><p>No modules yet.</p></div>';
    return;
  }
  el.innerHTML = modules.map((m, i) => `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-weight:600">Module ${i + 1}: ${m.title || 'Untitled'}</div>
        <button class="btn btn-sm btn-danger" onclick="removeModule(${i})">🗑</button>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${m.description || ''}</div>
    </div>
  `).join('');
}

function addModule() {
  const title = prompt('Module title:');
  if (!title) return;
  modules.push({ title, description: '' });
  renderModules();
}

function removeModule(index) {
  modules.splice(index, 1);
  renderModules();
}

async function saveCourse() {
  const id          = document.getElementById('course-id').value;
  const title       = document.getElementById('course-title').value.trim();
  const description = document.getElementById('course-desc').value.trim();
  const category    = document.getElementById('course-category').value.trim();
  const status      = document.getElementById('course-status').value;
  if (!title) { showToast('Course title is required', 'warning'); return; }
  try {
    if (id) {
      await api.put(`/instructor/courses/${id}`, { title, description, category, status, modules });
      showToast('Course updated!', 'success');
    } else {
      await api.post('/instructor/courses', { title, description, category, status, modules });
      showToast('Course created!', 'success');
      setTimeout(() => window.location.href = '/instructor/my-courses.html', 1000);
    }
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}