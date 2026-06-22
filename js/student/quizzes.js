let currentQuiz   = null;
let timerInterval = null;
let timeLeft      = 0;
let answers       = {};

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Student';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadQuizzes();
});

async function loadQuizzes() {
  const grid = document.getElementById('quizzes-grid');
  try {
    const d = await api.get('/student/quizzes');
    if (!d?.length) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🧪</div><p>No quizzes available</p></div>';
      return;
    }
    grid.innerHTML = d.map(q => `
      <div class="quiz-card">
        <div style="font-weight:700;font-size:15px;margin-bottom:6px">${q.title || '—'}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">${q.courseName || ''}</div>
        <div class="quiz-meta">
          <span>🧩 ${q.totalQuestions ?? 0} Questions</span>
          <span>⏱ ${q.timeLimit ?? '—'} mins</span>
          <span>🔄 ${q.maxAttempts ?? '∞'} attempts</span>
        </div>
        ${q.lastScore != null
          ? `<div style="margin-bottom:12px">${statusBadge('COMPLETED')} Last score: <strong>${q.lastScore}%</strong></div>`
          : ''
        }
        <button class="btn btn-primary btn-full" onclick="startQuiz(${q.id})">
          ${q.lastScore != null ? '🔄 Retake Quiz' : '▶ Start Quiz'}
        </button>
      </div>
    `).join('');
  } catch {
    grid.innerHTML = '<p style="color:var(--text-muted)">Failed to load quizzes</p>';
  }
}

async function startQuiz(id) {
  try {
    const d = await api.get(`/student/quizzes/${id}`);
    currentQuiz = d;
    answers     = {};
    document.getElementById('quiz-title').textContent = d.title || 'Quiz';
    renderQuestions(d.questions || []);
    document.getElementById('quiz-list-view').style.display   = 'none';
    document.getElementById('quiz-result-view').style.display = 'none';
    document.getElementById('quiz-take-view').style.display   = 'block';
    if (d.timeLimit) startTimer(d.timeLimit * 60);
  } catch (e) { showToast(e.message || 'Failed to load quiz', 'error'); }
}

function renderQuestions(questions) {
  const container = document.getElementById('questions-container');
  container.innerHTML = questions.map((q, qi) => `
    <div class="question-block">
      <div style="font-weight:600;font-size:14px;margin-bottom:10px">
        Q${qi + 1}. ${q.question || '—'}
      </div>
      ${(q.options || []).map((opt, oi) => `
        <label class="option-label" id="opt-${qi}-${oi}">
          <input type="radio" name="q-${qi}" value="${oi}"
            onchange="answers[${qi}] = ${oi}"/>
          ${opt}
        </label>
      `).join('')}
    </div>
  `).join('');
}

function startTimer(seconds) {
  timeLeft = seconds;
  clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      showToast('Time is up! Auto-submitting...', 'warning');
      submitQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  document.getElementById('quiz-timer').textContent =
    `⏱ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} remaining`;
}

async function submitQuiz() {
  clearInterval(timerInterval);
  if (!currentQuiz) return;
  const questions = currentQuiz.questions || [];
  const total     = questions.length;
  const answered  = Object.keys(answers).length;
  if (answered < total) {
    if (!confirm(`You have ${total - answered} unanswered questions. Submit anyway?`)) return;
  }
  try {
    const payload = questions.map((q, i) => ({
      questionId: q.id,
      selectedOption: answers[i] ?? null
    }));
    const result = await api.post(`/student/quizzes/${currentQuiz.id}/submit`, { answers: payload });
    showResult(result);
  } catch (e) { showToast(e.message || 'Submission failed', 'error'); }
}

function showResult(result) {
  const score   = result.score   ?? 0;
  const correct = result.correct ?? 0;
  const wrong   = result.wrong   ?? 0;
  const total   = result.total   ?? 0;

  document.getElementById('result-score').textContent   = `${score}%`;
  document.getElementById('result-correct').textContent = correct;
  document.getElementById('result-wrong').textContent   = wrong;
  document.getElementById('result-total').textContent   = total;
  document.getElementById('result-icon').textContent    = score >= 70 ? '🏆' : score >= 40 ? '📝' : '😔';
  document.getElementById('result-msg').textContent     =
    score >= 70 ? 'Great job! You passed.' :
    score >= 40 ? 'Good effort! Keep practising.' :
    'Keep studying and try again.';

  document.getElementById('quiz-take-view').style.display   = 'none';
  document.getElementById('quiz-result-view').style.display = 'block';
}

function exitQuiz() {
  clearInterval(timerInterval);
  currentQuiz = null;
  document.getElementById('quiz-take-view').style.display   = 'none';
  document.getElementById('quiz-result-view').style.display = 'none';
  document.getElementById('quiz-list-view').style.display   = 'block';
  loadQuizzes();
}