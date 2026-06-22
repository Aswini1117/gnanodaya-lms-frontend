let allCourses = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('INSTRUCTOR');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Instructor';
    document.getElementById('nav-avatar').textContent = (u.name || 'I').charAt(0);
  }
  await loadCourses();
});

async function loadCourses() {
  const tb = document.getElementById('courses-table');
  try {
    const d = await api.get('/instructor/courses/mine');
    allCourses = d || [];
    document.getElementById('course-count').textContent = allCourses.length;
    renderTable(allCourses);
  } catch {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

function renderTable(data) {
  const tb = document.getElementById('courses-table');
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No courses found</td></tr>';
    return;
  }
  tb.innerHTML = data.map(c => `
    <tr>
      <td>
        <div style="font-weight:600">${c.title || '—'}</div>
        <div style="font-size:11px;color:var(--text-muted)">${c.description?.slice(0,50) || ''}...</div>
      </td>
      <td>${c.totalStudents ?? 0}</td>
      <td>${c.totalModules ?? 0}</td>
      <td>${c.avgRating ? '⭐ ' + c.avgRating.toFixed(1) : '—'}</td>
      <td>${statusBadge(c.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <a href="/instructor/course-builder.html?id=${c.id}" class="btn btn-sm">✏️ Edit</a>
          <button class="btn btn-sm ${c.status === 'PUBLISHED' ? 'btn-danger' : 'btn-success'}"
            onclick="togglePublish(${c.id}, '${c.status}')">
            ${c.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterCourses() {
  const q      = document.getElementById('search-input').value.toLowerCase();
  const status = document.getElementById('status-filter').value;
  const filtered = allCourses.filter(c => {
    const matchQ = !q || c.title?.toLowerCase().includes(q);
    const matchS = !status || c.status === status;
    return matchQ && matchS;
  });
  renderTable(filtered);
}

async function togglePublish(id, currentStatus) {
  const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
  try {
    await api.patch(`/instructor/courses/${id}/status`, { status: newStatus });
    showToast(`Course ${newStatus === 'PUBLISHED' ? 'published' : 'unpublished'}!`, 'success');
    loadCourses();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}