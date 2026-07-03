const STORAGE_KEY = 'smes-fee-application-form';
const form = document.querySelector('#applicationForm');
const sessionsList = document.querySelector('#sessionsList');
const sessionTemplate = document.querySelector('#sessionTemplate');
const addSessionButton = document.querySelector('#addSessionButton');
const resetButton = document.querySelector('#resetButton');
const totalPeriods = document.querySelector('#totalPeriods');
const totalAmount = document.querySelector('#totalAmount');
const studentCount = document.querySelector('#studentCount');
const saveState = document.querySelector('#saveState');
const resultPanel = document.querySelector('#resultPanel');
const resultLinks = document.querySelector('#resultLinks');

function addSession(session = {}) {
  const fragment = sessionTemplate.content.cloneNode(true);
  const card = fragment.querySelector('.session-card');

  card.querySelector('[data-field="date"]').value = session.date || '';
  card.querySelector('[data-field="startTime"]').value = session.startTime || '16:00';
  card.querySelector('[data-field="endTime"]').value = session.endTime || '17:30';
  card.querySelector('[data-field="periods"]').value = session.periods || 2;
  card.querySelector('.remove-session').addEventListener('click', () => {
    card.remove();
    updateSummary();
    persistDraft();
  });

  card.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => {
      updateSummary();
      persistDraft();
    });
  });

  sessionsList.appendChild(fragment);
  updateSummary();
}

function readSessions() {
  return [...sessionsList.querySelectorAll('.session-card')].map((card) => ({
    date: card.querySelector('[data-field="date"]').value,
    startTime: card.querySelector('[data-field="startTime"]').value,
    endTime: card.querySelector('[data-field="endTime"]').value,
    periods: Number(card.querySelector('[data-field="periods"]').value || 0)
  })).filter((session) => session.date && session.startTime && session.endTime && session.periods > 0);
}

function readStudents() {
  return form.students.value
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function buildPayload() {
  return {
    action: 'upsertApplication',
    conversationId: form.conversationId.value.trim(),
    driveFolderId: form.driveFolderId.value.trim(),
    teacherName: form.teacherName.value.trim(),
    courseName: form.courseName.value.trim(),
    purpose: form.purpose.value.trim(),
    hourlyRate: Number(form.hourlyRate.value || 336),
    sessions: readSessions(),
    students: readStudents()
  };
}

function updateSummary() {
  const periods = readSessions().reduce((sum, session) => sum + session.periods, 0);
  const rate = Number(form.hourlyRate.value || 0);
  const students = readStudents();

  totalPeriods.textContent = `${periods} 節`;
  totalAmount.textContent = `${periods * rate} 元`;
  studentCount.textContent = `${students.length} 人`;
}

function persistDraft() {
  const draft = {
    webAppUrl: form.webAppUrl.value.trim(),
    payload: buildPayload()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function restoreDraft() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    addSession();
    return;
  }

  try {
    const draft = JSON.parse(raw);
    const payload = draft.payload || {};
    form.webAppUrl.value = draft.webAppUrl || '';
    form.conversationId.value = payload.conversationId || createDefaultConversationId();
    form.driveFolderId.value = payload.driveFolderId || '';
    form.teacherName.value = payload.teacherName || '';
    form.courseName.value = payload.courseName || '';
    form.purpose.value = payload.purpose || '';
    form.hourlyRate.value = payload.hourlyRate || 336;
    form.students.value = Array.isArray(payload.students) ? payload.students.join('\n') : '';

    const sessions = Array.isArray(payload.sessions) && payload.sessions.length ? payload.sessions : [{}];
    sessions.forEach(addSession);
  } catch (error) {
    addSession();
  }

  updateSummary();
}

function createDefaultConversationId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `fee-${date}`;
}

function renderResult(data) {
  const links = [
    ['實施計畫', data.planDocUrl],
    ['課程簽呈', data.approvalDocUrl],
    ['印領清冊', data.payrollSheetUrl]
  ];

  resultLinks.innerHTML = links
    .filter(([, url]) => url)
    .map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`)
    .join('');
  resultPanel.hidden = false;
}

async function submitApplication(event) {
  event.preventDefault();

  const webAppUrl = form.webAppUrl.value.trim();
  const payload = buildPayload();

  if (!payload.sessions.length) {
    saveState.textContent = '請至少新增一筆上課時間';
    return;
  }

  if (!payload.students.length) {
    saveState.textContent = '請至少輸入一位學生';
    return;
  }

  saveState.textContent = '送出中';
  persistDraft();

  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || '送出失敗');
    }

    saveState.textContent = '已更新文件';
    renderResult(result.data);
  } catch (error) {
    saveState.textContent = error.message || '送出失敗';
  }
}

addSessionButton.addEventListener('click', () => {
  addSession();
  persistDraft();
});

resetButton.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  form.reset();
  sessionsList.innerHTML = '';
  resultPanel.hidden = true;
  form.conversationId.value = createDefaultConversationId();
  addSession();
  updateSummary();
  saveState.textContent = '尚未送出';
});

form.addEventListener('input', () => {
  updateSummary();
  persistDraft();
});
form.addEventListener('submit', submitApplication);

form.conversationId.value = createDefaultConversationId();
restoreDraft();
