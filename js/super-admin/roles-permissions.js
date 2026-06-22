let rolesData = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('SUPER_ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Super Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadRoles();
});

async function loadRoles() {
  const grid = document.getElementById('roles-grid');
  try {
    const d = await api.get('/super-admin/roles');
    rolesData = d || [];
    if (!rolesData.length) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🔐</div><p>No roles configured</p></div>';
      return;
    }
    grid.innerHTML = rolesData.map((role, ri) => `
      <div class="panel">
        <div class="panel-head">
          <span class="panel-title">${role.name || '—'}</span>
          <span class="badge badge-secondary">${role.userCount ?? 0} users</span>
        </div>
        <div class="panel-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">${role.description || ''}</p>
          ${(role.permissions || []).map((perm, pi) => `
            <div style="display:flex;align-items:center;justify-content:space-between;
                        padding:10px 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-size:13px;font-weight:500">${perm.label || perm.key}</div>
                <div style="font-size:11px;color:var(--text-muted)">${perm.description || ''}</div>
              </div>
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
                <input type="checkbox"
                  id="perm-${ri}-${pi}"
                  ${perm.enabled ? 'checked' : ''}
                  style="width:16px;height:16px;accent-color:var(--primary)"/>
              </label>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  } catch {
    grid.innerHTML = '<p style="color:var(--text-muted)">Failed to load roles</p>';
  }
}

async function savePermissions() {
  const updated = rolesData.map((role, ri) => ({
    roleId: role.id,
    permissions: (role.permissions || []).map((perm, pi) => ({
      key:     perm.key,
      enabled: document.getElementById(`perm-${ri}-${pi}`)?.checked || false
    }))
  }));
  try {
    await api.post('/super-admin/roles/permissions', { roles: updated });
    showToast('Permissions saved!', 'success');
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}