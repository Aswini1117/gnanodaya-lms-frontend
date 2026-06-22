let allStudents = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('INSTRUCTOR');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Instructor';
    document.getElementById('nav-avatar').textContent = (u.name || 'I').charAt(0);
  }
  renderSidebar('INSTRUCTOR');
  await loadStudents();
});

async function loadStudents() {
  const tb = document.getElementById('students-table');
  tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Loading...</td></tr>';

  try {
    const u = getUser();
    const instructorId = u?.id;

    if (!instructorId) {
      tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Session expired. Please login again.</td></tr>';
      return;
    }

    // Step 1 — Get all batches for this instructor
    const batchRes = await api.get(`/batches/instructor/${instructorId}`);
    const batches  = batchRes?.data || batchRes || [];

    if (!batches.length) {
      tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">No batches assigned to you yet.</td></tr>';
      document.getElementById('student-count').textContent = 0;
      return;
    }

    // Step 2 — Get students from all batches
    allStudents = [];

    for (const batch of batches) {
      try {
        const enrollRes = await api.get(`/batches/${batch.id}/students`);
        const enrollments = enrollRes?.data || enrollRes || [];

        enrollments.forEach(enrollment => {
          const student = enrollment.student || enrollment;

          // Avoid duplicate students
          const alreadyAdded = allStudents.find(s => s.id === student.id);
          if (!alreadyAdded) {
            allStudents.push({
              id:         student.id,
              name:       student.fullName || student.name || '—',
              email:      student.email || '—',
              phone:      student.phone || '—',
              status:     student.status || 'ACTIVE',
              courseName: batch.course?.title || batch.courseName || '—',
              batchName:  batch.batchName || '—',
              batchId:    batch.id,
              progress:   enrollment.progressPercent || 0,
              lastActive: student.updatedAt || student.createdAt || null
            });
          }
        });
      } catch (e) {
        console.warn(`Failed to load students for batch ${batch.id}`, e);
      }
    }

    // Step 3 — Render
    document.getElementById('student-count').textContent = allStudents.length;
    populateCourseFilter();
    renderTable(allStudents);

  } catch (e) {
    console.error('Failed to load students:', e);
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load students. Please try again.</td></tr>';
  }
}

function populateCourseFilter() {
  const courses = [...new Set(allStudents.map(s => s.courseName).filter(Boolean))];
  const sel = document.getElementById('course-filter');
  sel.innerHTML = '<option value="">All Courses</option>' +
    courses.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderTable(data) {
  const tb = document.getElementById('students-table');

  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">No students found.</td></tr>';
    return;
  }

  tb.innerHTML = data.map(s => `
    <tr>
      <td>
        <div class="user-row">
          ${avatarEl(s.name, 'var(--primary)')}
          <div>
            <div style="font-weight:600">${s.name}</div>
            <div style="font-size:11px;color:var(--text-muted)">${s.email}</div>
            <div style="font-size:11px;color:var(--text-muted)">${s.phone}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-weight:500">${s.courseName}</div>
        <div style="font-size:11px;color:var(--text-muted)">${s.batchName}</div>
      </td>
      <td>
        <div class="progress-bar" style="width:100px">
          <div class="progress-fill" style="width:${s.progress ?? 0}%"></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${s.progress ?? 0}%</div>
      </td>
      <td style="font-size:13px;color:var(--text-muted)">${timeAgo(s.lastActive)}</td>
      <td>${statusBadge(s.status)}</td>
    </tr>
  `).join('');
}

function filterStudents() {
  const q      = document.getElementById('search-input').value.toLowerCase();
  const course = document.getElementById('course-filter').value;

  const filtered = allStudents.filter(s => {
    const matchQ = !q ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q);
    const matchC = !course || s.courseName === course;
    return matchQ && matchC;
  });

  document.getElementById('student-count').textContent = filtered.length;
  renderTable(filtered);
}