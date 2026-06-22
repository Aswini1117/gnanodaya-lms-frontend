const INTEGRATIONS = [
  { key: 'razorpay',   icon: '💳', name: 'Razorpay',        desc: 'Payment gateway for fee collection',      fields: [{id:'razorpay-key',   label:'API Key'},{id:'razorpay-secret', label:'Secret Key'}] },
  { key: 'twilio',     icon: '📱', name: 'Twilio SMS',       desc: 'SMS gateway for OTP and notifications',   fields: [{id:'twilio-sid',     label:'Account SID'},{id:'twilio-token',  label:'Auth Token'},{id:'twilio-from', label:'From Number'}] },
  { key: 'zoom',       icon: '🎥', name: 'Zoom',             desc: 'Live classes and video conferencing',     fields: [{id:'zoom-key',       label:'API Key'},{id:'zoom-secret',    label:'API Secret'}] },
  { key: 'cloudflare', icon: '☁️', name: 'Cloudflare CDN',   desc: 'Video delivery and storage CDN',          fields: [{id:'cf-account',     label:'Account ID'},{id:'cf-token',      label:'API Token'}] },
  { key: 'google',     icon: '🔍', name: 'Google OAuth',     desc: 'Google sign-in for all roles',           fields: [{id:'google-client',  label:'Client ID'},{id:'google-secret',  label:'Client Secret'}] },
];

let integrationData = {};

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('SUPER_ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Super Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadIntegrations();
});

async function loadIntegrations() {
  const grid = document.getElementById('integrations-grid');
  try {
    const d = await api.get('/super-admin/integrations');
    integrationData = d || {};
  } catch {}

  grid.innerHTML = INTEGRATIONS.map(intg => `
    <div class="panel">
      <div class="panel-head">
        <span class="panel-title">${intg.icon} ${intg.name}</span>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">
          <input type="checkbox" id="toggle-${intg.key}"
            ${integrationData[intg.key]?.enabled ? 'checked' : ''}
            style="width:16px;height:16px;accent-color:var(--primary)"
            onchange="toggleIntegration('${intg.key}')"/>
          Enabled
        </label>
      </div>
      <div class="panel-body">
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:14px">${intg.desc}</p>
        <div id="fields-${intg.key}" style="${integrationData[intg.key]?.enabled ? '' : 'opacity:0.4;pointer-events:none'}">
          ${intg.fields.map(f => `
            <div class="form-group">
              <label class="form-label">${f.label}</label>
              <input type="text" class="form-input" id="${f.id}"
                value="${integrationData[intg.key]?.[f.id] || ''}"
                placeholder="Enter ${f.label}"/>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function toggleIntegration(key) {
  const enabled = document.getElementById(`toggle-${key}`).checked;
  const fields  = document.getElementById(`fields-${key}`);
  if (fields) {
    fields.style.opacity        = enabled ? '1' : '0.4';
    fields.style.pointerEvents  = enabled ? 'auto' : 'none';
  }
}

async function saveIntegrations() {
  const data = {};
  INTEGRATIONS.forEach(intg => {
    data[intg.key] = {
      enabled: document.getElementById(`toggle-${intg.key}`)?.checked || false
    };
    intg.fields.forEach(f => {
      data[intg.key][f.id] = document.getElementById(f.id)?.value?.trim() || '';
    });
  });
  try {
    await api.post('/super-admin/integrations', data);
    showToast('Integrations saved!', 'success');
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}