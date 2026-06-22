document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent    = u.name || 'Student';
    document.getElementById('nav-avatar').textContent  = (u.name || 'S').charAt(0);
    document.getElementById('profile-name').value      = u.name  || '';
    document.getElementById('profile-email').value     = u.email || '';
    document.getElementById('profile-phone').value     = u.phone || '';
  }
  await loadProfile();
});

async function loadProfile() {
  try {
    const d = await api.get('/student/profile');
    document.getElementById('profile-name').value  = d.name  || '';
    document.getElementById('profile-email').value = d.email || '';
    document.getElementById('profile-phone').value = d.phone || '';
  } catch {}
}

async function saveProfile() {
  const name  = document.getElementById('profile-name').value.trim();
  const email = document.getElementById('profile-email').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  if (!name)  { showToast('Name is required', 'warning'); return; }
  if (!email) { showToast('Email is required', 'warning'); return; }
  try {
    await api.put('/student/profile', { name, email, phone });
    const u = getUser();
    localStorage.setItem('lms_user', JSON.stringify({ ...u, name, email, phone }));
    showToast('Profile updated!', 'success');
    document.getElementById('nav-name').textContent   = name;
    document.getElementById('nav-avatar').textContent = name.charAt(0);
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

async function changePassword() {
  const currentPwd = document.getElementById('current-pwd').value;
  const newPwd     = document.getElementById('new-pwd').value;
  const confirmPwd = document.getElementById('confirm-pwd').value;
  if (!currentPwd) { showToast('Enter current password', 'warning'); return; }
  if (newPwd.length < 6) { showToast('New password must be at least 6 characters', 'warning'); return; }
  if (newPwd !== confirmPwd) { showToast('Passwords do not match', 'warning'); return; }
  try {
    await api.post('/student/profile/change-password', {
      currentPassword: currentPwd,
      newPassword:     newPwd
    });
    showToast('Password changed!', 'success');
    document.getElementById('current-pwd').value = '';
    document.getElementById('new-pwd').value     = '';
    document.getElementById('confirm-pwd').value = '';
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}