const urlParams    = new URLSearchParams(window.location.search);
const assignmentId = urlParams.get('assignmentId') || urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('INSTRUCTOR');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Instructor';
    document.getElementById('nav-avatar').textContent = (u.name || 'I').charAt(0);
  }
  await loadSubmissions();
});

async function loadSubmissions() {
  const tb = document.getElementById('submissions-table');
  try {
    const url = assignmentId
      ? `/instructor/assignments/${assignmentId}/submissions`
      : '/instructor/submissions';
    const d = await api.get(url);
    document.getElementById('sub-count').textContent = d?.length || 0;
    if (!d?.length) {
      tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">No submissions yet</td></tr>';
      return;
    }
    tb.innerHTML = d.map(s => `
      <tr>
        <td>
          <div class="user-row">
            ${avatarEl(s.studentName, 'var(--primary)')}
            <span style="font-weight:600">${s.studentName || '—'}</span>
          </div>
        </td>
        <td>${formatDate(s.submittedAt)}</td>
        <td>${s.fileUrl ? `<a href="${s.fileUrl}" target="_blank" class="btn btn-sm">📄 View</a>` : '—'}</td>
        <td>
          <input type="number" class="form-input" id="grade-${s.id}"
            value="${s.grade ?? ''}" placeholder="0-100"
            style="width:80px;padding:6px 10px;font-size:12px" min="0" max="100"/>
        </td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="saveGrade(${s.id})">💾 Save</button>
        </td>
      </tr>
    `).join('');
  } catch {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

async function saveGrade(submissionId) {
  const grade = document.getElementById(`grade-${submissionId}`)?.value;
  if (!grade) { showToast('Enter a grade first', 'warning'); return; }
  try {
    await api.patch(`/instructor/submissions/${submissionId}/grade`, { grade: Number(grade) });
    showToast('Grade saved!', 'success');
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}