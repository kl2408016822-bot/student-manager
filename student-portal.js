// frontend/js/student-portal.js
const API_BASE = 'http://localhost:5000/api';

let allStudents = [];     // for dropdown (optional, we could fetch only needed)
const studentSelect = document.getElementById('studentSelect');
const studentIdInput = document.getElementById('studentIdInput');
const lookupBtn = document.getElementById('lookupBtn');
const profileCard = document.getElementById('profileCard');
const studentDetailsDiv = document.getElementById('studentDetails');
const statusMsgDiv = document.getElementById('statusMsg');

function showMessage(msg, isError = false) {
  statusMsgDiv.style.display = 'block';
  statusMsgDiv.textContent = msg;
  statusMsgDiv.style.background = isError ? '#ffe6e5' : '#e0f2fe';
  statusMsgDiv.style.color = isError ? '#b91c1c' : '#0f3b3f';
  setTimeout(() => statusMsgDiv.style.display = 'none', 3000);
}

// Load all students only for the dropdown (admin could have many, but for demo it's fine)
async function loadStudentList() {
  try {
    const res = await fetch(`${API_BASE}/students`);
    if (!res.ok) throw new Error();
    allStudents = await res.json();
    populateDropdown();
  } catch (err) {
    showMessage('Cannot connect to server. Is backend running?', true);
  }
}

function populateDropdown() {
  studentSelect.innerHTML = '<option value="">-- Choose a student --</option>';
  allStudents.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.studentId})`;
    studentSelect.appendChild(opt);
  });
}

// Use the new dedicated endpoint to fetch a student by studentId
async function fetchStudentByStudentId(studentId) {
  try {
    const res = await fetch(`${API_BASE}/students/lookup/${encodeURIComponent(studentId)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error();
    }
    return await res.json();
  } catch {
    return null;
  }
}

function displayStudent(student) {
  const grade = Number(student.grade).toFixed(1);
  const fillWidth = Math.min(100, Math.max(0, Number(student.grade))) + '%';
  studentDetailsDiv.innerHTML = `
    <div class="detail-row"><div class="detail-label">Full Name</div><div class="detail-value"><strong>${escapeHtml(student.name)}</strong></div></div>
    <div class="detail-row"><div class="detail-label">Student ID</div><div class="detail-value">${escapeHtml(student.studentId)}</div></div>
    <div class="detail-row"><div class="detail-label">Email</div><div class="detail-value">${escapeHtml(student.email || '—')}</div></div>
    <div class="detail-row"><div class="detail-label">Grade</div><div class="detail-value"><span class="grade-badge">${grade}%</span><div class="progress-bar-container"><div class="progress-fill" style="width: ${fillWidth};"></div></div></div></div>
    <div class="detail-row"><div class="detail-label">Status</div><div class="detail-value">${getStatusMessage(student.grade)}</div></div>
  `;
  profileCard.style.display = 'block';
}

function getStatusMessage(grade) {
  const g = Number(grade);
  if (g >= 90) return '🎉 Excellent! Outstanding.';
  if (g >= 75) return '👍 Good work! Keep improving.';
  if (g >= 60) return '📚 Satisfactory.';
  return '💪 Needs improvement – reach out for support.';
}

function escapeHtml(str) { /* same as before */ }

async function performLookup() {
  statusMsgDiv.style.display = 'none';
  let student = null;

  const selectedId = studentSelect.value;
  const manualId = studentIdInput.value.trim();

  if (selectedId) {
    student = allStudents.find(s => s.id === selectedId);
    if (!student) showMessage('Student not found in list', true);
  } else if (manualId) {
    student = await fetchStudentByStudentId(manualId);
    if (!student) showMessage('No student found with that ID', true);
  } else {
    showMessage('Please select or enter a Student ID', true);
    return;
  }

  if (student) {
    displayStudent(student);
    if (manualId) studentSelect.value = '';
    else studentIdInput.value = '';
    showMessage(`Welcome, ${student.name}!`);
  }
}

// Event listeners
lookupBtn.addEventListener('click', performLookup);
studentSelect.addEventListener('change', () => {
  if (studentSelect.value) {
    studentIdInput.value = '';
    performLookup();
  }
});
studentIdInput.addEventListener('keypress', e => e.key === 'Enter' && performLookup());

loadStudentList();
