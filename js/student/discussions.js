document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Student';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await Promise.all([loadCourses(), loadDiscussions()]);
});

async function loadCourses() {
  try {
    const d = await api.get('/student/courses/enrolled');
    const sel = document.getElementById('question-course');
    sel.innerHTML = '<option value="">Select a course</option>' +
      (d || []).map(c => `<option value="${c.id}">${c.title}</option>`).join('');
  } catch {}
}

async function loadDiscussions() {
  const el = document.getElementById('discussions-list');
  try {
    const d = await api.get('/student/discussions');
    document.getElementById('question-count').textContent = d?.length || 0;
    if (!d?.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>No questions yet. Ask your first question above!</p></div>';
      return;
    }
    el.innerHTML = d.map(q => `
      <div style="padding:16px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <div style="font-weight:600;font-size:14px">${q.question || '—'}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:3px">
              ${q.courseName || ''} · ${timeAgo(q.createdAt)}
            </div>
          </div>
          ${q.answered
            ? '<span class="badge badge-success">Answered</span>'
            : '<span class="badge badge-warning">Pending</span>'
          }
        </div>
        ${q.reply
          ? `<div style="background:var(--primary-light);border-left:3px solid var(--primary);
               padding:10px 14px;border-radius:0 var(--radius-sm) var(--radius-sm) 0;
               font-size:13px;margin-top:8px">
               <strong>Instructor:</strong> ${q.reply}
             </div>`
          : '<div style="font-size:12px;color:var(--text-muted);margin-top:6px">Waiting for instructor reply...</div>'
        }
      </div>
    `).join('');
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>';
  }
}

async function postQuestion() {
  const courseId = document.getElementById('question-course').value;
  const question = document.getElementById('question-text').value.trim();
  if (!courseId)  { showToast('Please select a course', 'warning');  return; }
  if (!question)  { showToast('Please type your question', 'warning'); return; }
  try {
    await api.post('/student/discussions', { courseId, question });
    showToast('Question posted!', 'success');
    document.getElementById('question-text').value = '';
    loadDiscussions();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}