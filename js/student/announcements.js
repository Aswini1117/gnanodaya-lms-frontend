document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Student';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadAnnouncements();
});

async function loadAnnouncements() {
  const el = document.getElementById('announcements-list');
  try {
    const d = await api.get('/student/announcements');
    document.getElementById('ann-count').textContent = d?.length || 0;
    if (!d?.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">📢</div><p>No announcements yet</p></div>';
      return;
    }
    const colors = [
      ['#eff6ff','#1d4ed8'],
      ['#f0fdf4','#15803d'],
      ['#fefce8','#a16207'],
      ['#fdf4ff','#7e22ce']
    ];
    el.innerHTML = d.map((a, i) => {
      const [bg, c] = colors[i % colors.length];
      return `
        <div style="background:${bg};border:1px solid ${c}25;border-radius:var(--radius);
                    padding:16px 18px;margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
            <div style="font-weight:600;font-size:14px;color:${c}">${a.title || '—'}</div>
            <span style="font-size:11px;color:var(--text-muted);flex-shrink:0;margin-left:12px">
              ${timeAgo(a.createdAt)}
            </span>
          </div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.6">${a.message || ''}</div>
          ${a.from ? `<div style="font-size:11px;color:var(--text-muted);margin-top:8px">From: ${a.from}</div>` : ''}
        </div>`;
    }).join('');
  } catch {
    el.innerHTML = '<p style="color:var(--text-muted)">Failed to load</p>';
  }
}