let allCourses = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Student';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadCourses();
});

async function loadCourses() {
  const grid = document.getElementById('courses-grid');
  try {
    const d = await api.get('/student/courses/available');
    allCourses = d || [];
    populateCategories();
    renderCourses(allCourses);
  } catch {
    grid.innerHTML = '<p style="color:var(--text-muted)">Failed to load courses</p>';
  }
}

function populateCategories() {
  const cats = [...new Set(allCourses.map(c => c.category).filter(Boolean))];
  const sel  = document.getElementById('category-filter');
  sel.innerHTML = '<option value="">All Categories</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderCourses(data) {
  const grid = document.getElementById('courses-grid');
  if (!data.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>No courses found.</p></div>';
    return;
  }
  grid.innerHTML = data.map(c => `
    <div class="panel">
      <div class="panel-body">
        <div style="font-size:32px;margin-bottom:12px">${c.icon || '📖'}</div>
        <div style="font-weight:700;font-size:15px;margin-bottom:4px">${c.title || '—'}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${c.instructorName || ''}</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;line-height:1.5">
          ${c.description?.slice(0, 80) || ''}...
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <span class="badge badge-primary">${c.category || 'General'}</span>
          <span style="font-size:13px;font-weight:600">${c.totalModules ?? 0} modules</span>
        </div>
        ${c.enrolled
          ? `<button class="btn btn-full" disabled style="background:var(--success);color:#fff">✅ Enrolled</button>`
          : `<button class="btn btn-primary btn-full" onclick="enrollCourse(${c.id}, this)">Enroll Now</button>`
        }
      </div>
    </div>
  `).join('');
}

function filterCourses() {
  const q        = document.getElementById('search-input').value.toLowerCase();
  const category = document.getElementById('category-filter').value;
  const filtered = allCourses.filter(c => {
    const matchQ = !q || c.title?.toLowerCase().includes(q);
    const matchC = !category || c.category === category;
    return matchQ && matchC;
  });
  renderCourses(filtered);
}

async function enrollCourse(id, btn) {
  btn.disabled     = true;
  btn.textContent  = 'Enrolling...';
  try {
    await api.post(`/student/courses/${id}/enroll`, {});
    showToast('Enrolled successfully!', 'success');
    btn.textContent            = '✅ Enrolled';
    btn.style.background       = 'var(--success)';
    btn.style.color            = '#fff';
    btn.style.borderColor      = 'var(--success)';
  } catch (e) {
    showToast(e.message || 'Enrollment failed', 'error');
    btn.disabled    = false;
    btn.textContent = 'Enroll Now';
  }
}