document.addEventListener('DOMContentLoaded', async () => {
  guardPage('INSTRUCTOR');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Instructor';
    document.getElementById('nav-avatar').textContent = (u.name || 'I').charAt(0);
  }
  await loadDiscussions();
});

async function loadDiscussions() {
  const el = document.getElementById('discussions-list');
  try {
    const d = await api.get('/instructor/discussions');
    document.getElementById('question-count').textContent = d?.filter(x => !x.answered)?.length || 0;
    if (!d?.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>No questions yet</p></div>';
      return;
    }
    el.innerHTML = d.map(q => `
      <div style="padding:16px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">
          ${avatarEl(q.studentName, 'var(--student)')}
          <div style="flex:1">
            <div style="font-weight:600;font-size:13px">${q.studentName || '—'}</div>
            <div style="font-size:12px;color:var(--text-muted)">${q.courseName || ''} · ${timeAgo(q.createdAt)}</div>
            <div style="margin-top:6px;font-size:14px">${q.question || '—'}</div>
          </div>
          ${q.answered ? '<span class="badge badge-success">Answered</span>' : '<span class="badge badge-warning">Pending</span>'}
        </div>
        ${q.reply ? `<div style="background:var(--primary-light);border-left:3px solid var(--primary);padding:10px 14px;border-radius:0 var(--radius-sm) var(--radius-sm) 0;font-size:13px;margin-left:44px">${q.reply}</div>` : ''}
        <div style="margin-left:44px;margin-top:10px;display:flex;gap:8px">
          <textarea class="form-textarea" id="reply-${q.id}" placeholder="Type your reply..." style="min-height:70px;font-size:13px">${q.reply || ''}</textarea>
        </div>
        <div style="margin-left:44px;margin-top:8px">
          <button class="btn btn-sm btn-primary" onclick="submitReply(${q.id})">💬 Reply</button>
        </div>
      </div>
    `).join('');
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>';
  }
}

async function submitReply(questionId) {
  const reply = document.getElementById(`reply-${questionId}`)?.value?.trim();
  if (!reply) { showToast('Type a reply first', 'warning'); return; }
  try {
    await api.post(`/instructor/discussions/${questionId}/reply`, { reply });
    showToast('Reply sent!', 'success');
    loadDiscussions();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}