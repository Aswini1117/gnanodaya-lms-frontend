document.addEventListener('DOMContentLoaded', async () => {
  guardPage('SUPER_ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Super Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadSettings();
});

async function loadSettings() {
  try {
    const d = await api.get('/super-admin/settings');
    if (!d) return;
    document.getElementById('platform-name').value = d.platformName  || '';
    document.getElementById('support-email').value = d.supportEmail  || '';
    document.getElementById('timezone').value      = d.timezone       || 'Asia/Kolkata';
    document.getElementById('smtp-host').value     = d.smtpHost       || '';
    document.getElementById('smtp-port').value     = d.smtpPort       || '';
    document.getElementById('smtp-user').value     = d.smtpUser       || '';
    document.getElementById('max-storage').value   = d.maxStorageGb   || '';
    document.getElementById('max-upload').value    = d.maxUploadMb    || '';
    document.getElementById('otp-expiry').value    = d.otpExpiryMins  || '';
    document.getElementById('sms-provider').value  = d.smsProvider    || 'TWILIO';
    document.getElementById('sms-key').value       = d.smsApiKey      || '';
  } catch { showToast('Failed to load settings', 'error'); }
}

async function saveSettings() {
  const data = {
    platformName:  document.getElementById('platform-name').value.trim(),
    supportEmail:  document.getElementById('support-email').value.trim(),
    timezone:      document.getElementById('timezone').value,
    smtpHost:      document.getElementById('smtp-host').value.trim(),
    smtpPort:      document.getElementById('smtp-port').value,
    smtpUser:      document.getElementById('smtp-user').value.trim(),
    smtpPassword:  document.getElementById('smtp-pass').value,
    maxStorageGb:  document.getElementById('max-storage').value,
    maxUploadMb:   document.getElementById('max-upload').value,
    otpExpiryMins: document.getElementById('otp-expiry').value,
    smsProvider:   document.getElementById('sms-provider').value,
    smsApiKey:     document.getElementById('sms-key').value.trim()
  };
  try {
    await api.post('/super-admin/settings', data);
    showToast('Settings saved!', 'success');
  } catch (e) { showToast(e.message || 'Failed to save', 'error'); }
}