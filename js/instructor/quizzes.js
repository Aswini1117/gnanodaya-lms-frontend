let allQuizzes = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('INSTRUCTOR');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Instructor';
    document.getElementById('nav-avatar').textContent = (u.name || 'I').charAt(0);
  }
  await loadQuizzes();
});

async function loadQuizzes() {
  const tb = document.getElementById('quizzes-table');
  try {
    const d = await api.get('/instructor/quizzes');
    allQuizzes = d || [];
    document.getElementById('quiz-count').textContent = allQuizzes.length;
    renderTable(allQuizzes);
  } catch {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

function renderTable(data) {
  const tb = document.getElementById('quizzes-table');
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No quizzes found</td></tr>';
    return;
  }
  tb.innerHTML = data.map(q => `
    <tr>
      <td style="font-weight:600">${q.title || '—'}</td>
      <td>${q.courseName || '—'}</td>
      <td>${q.totalQuestions ?? 0}</td>
      <td>${q.timeLimit ? q.timeLimit + ' mins' : '—'}</td>
      <td>${q.maxAttempts ?? '—'}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="editQuiz(${q.id})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteQuiz(${q.id})">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Create Quiz';
  document.getElementById('quiz-id').value       = '';
  document.getElementById('quiz-title').value    = '';
  document.getElementById('quiz-course').value   = '';
  document.getElementById('quiz-time').value     = '';
  document.getElementById('quiz-attempts').value = '';
  document.getElementById('quiz-modal').classList.add('show');
}

function editQuiz(id) {
  const q = allQuizzes.find(x => x.id === id);
  if (!q) return;
  document.getElementById('modal-title').textContent = 'Edit Quiz';
  document.getElementById('quiz-id').value       = q.id;
  document.getElementById('quiz-title').value    = q.title || '';
  document.getElementById('quiz-course').value   = q.courseId || '';
  document.getElementById('quiz-time').value     = q.timeLimit || '';
  document.getElementById('quiz-attempts').value = q.maxAttempts || '';
  document.getElementById('quiz-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('quiz-modal').classList.remove('show');
}

async function saveQuiz() {
  const id          = document.getElementById('quiz-id').value;
  const title       = document.getElementById('quiz-title').value.trim();
  const courseId    = document.getElementById('quiz-course').value.trim();
  const timeLimit   = document.getElementById('quiz-time').value;
  const maxAttempts = document.getElementById('quiz-attempts').value;
  if (!title || !courseId) { showToast('Title and course are required', 'warning'); return; }
  try {
    if (id) {
      await api.put(`/instructor/quizzes/${id}`, { title, courseId, timeLimit, maxAttempts });
      showToast('Quiz updated!', 'success');
    } else {
      await api.post('/instructor/quizzes', { title, courseId, timeLimit, maxAttempts });
      showToast('Quiz created!', 'success');
    }
    closeModal();
    loadQuizzes();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

async function deleteQuiz(id) {
  if (!confirm('Delete this quiz?')) return;
  try {
    await api.delete(`/instructor/quizzes/${id}`);
    showToast('Deleted', 'success');
    loadQuizzes();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}