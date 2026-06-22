const urlParams = new URLSearchParams(window.location.search);
const courseId  = urlParams.get('id');
let lessons     = [];
let currentIdx  = 0;

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Student';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  if (!courseId) { showToast('No course selected', 'error'); return; }
  await loadCourse();
});

async function loadCourse() {
  try {
    const d = await api.get(`/student/courses/${courseId}`);
    document.getElementById('course-title').textContent = d.title || 'Course Player';
    lessons = d.lessons || [];
    renderLessonList();
    if (lessons.length) loadLesson(0);
    updateProgress(d.progress ?? 0);
  } catch {
    showToast('Failed to load course', 'error');
  }
}

function renderLessonList() {
  const el = document.getElementById('lesson-list');
  el.innerHTML = lessons.map((l, i) => `
    <div class="lesson-item ${i === currentIdx ? 'active' : ''} ${l.completed ? 'done' : ''}"
         id="lesson-item-${i}" onclick="loadLesson(${i})">
      <div class="lesson-num">${l.completed ? '✓' : i + 1}</div>
      <span>${l.title || 'Lesson ' + (i + 1)}</span>
    </div>
  `).join('');
}

function loadLesson(idx) {
  currentIdx = idx;
  const lesson = lessons[idx];
  if (!lesson) return;

  document.getElementById('lesson-title').textContent = lesson.title || '—';
  document.getElementById('lesson-desc').textContent  = lesson.description || '';

  // Load video
  const vc = document.getElementById('video-container');
  if (lesson.videoUrl) {
    if (lesson.videoUrl.includes('youtube') || lesson.videoUrl.includes('youtu.be')) {
      const vid = lesson.videoUrl.split('v=')[1]?.split('&')[0] ||
                  lesson.videoUrl.split('/').pop();
      vc.innerHTML = `<iframe src="https://www.youtube.com/embed/${vid}" allowfullscreen></iframe>`;
    } else {
      vc.innerHTML = `<video src="${lesson.videoUrl}" controls></video>`;
    }
  } else {
    vc.innerHTML = '<span>▶</span>';
  }

  // Update buttons
  document.getElementById('prev-btn').disabled     = idx === 0;
  document.getElementById('next-btn').disabled     = idx === lessons.length - 1;
  document.getElementById('complete-btn').disabled = lesson.completed;

  // Highlight active
  document.querySelectorAll('.lesson-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
}

function prevLesson() { if (currentIdx > 0) loadLesson(currentIdx - 1); }
function nextLesson()  { if (currentIdx < lessons.length - 1) loadLesson(currentIdx + 1); }

async function markComplete() {
  const lesson = lessons[currentIdx];
  if (!lesson) return;
  try {
    await api.post(`/student/lessons/${lesson.id}/complete`, {});
    lessons[currentIdx].completed = true;
    showToast('Lesson marked complete!', 'success');
    document.getElementById('complete-btn').disabled = true;
    renderLessonList();
    const done = lessons.filter(l => l.completed).length;
    updateProgress(Math.round((done / lessons.length) * 100));
    if (currentIdx < lessons.length - 1) {
      setTimeout(() => nextLesson(), 800);
    }
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

function updateProgress(pct) {
  document.getElementById('course-progress').style.width = pct + '%';
  document.getElementById('progress-text').textContent   = pct + '% complete';
}