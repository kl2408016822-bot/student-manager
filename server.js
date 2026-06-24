const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());              // allow frontend requests
app.use(express.json());     // parse JSON bodies

// Data file path (simple file-based storage)
const DATA_FILE = path.join(__dirname, 'data', 'students.json');

// Helper: read students from file
function readStudents() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];  // if file doesn't exist, return empty array
  }
}

// Helper: write students to file
function writeStudents(students) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2));
}

// Ensure data folder exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Seed some initial data if file is empty
let students = readStudents();
if (students.length === 0) {
  students = [
    { id: '1', name: 'Olivia Chen', studentId: 'S24001', email: 'olivia.chen@edu.com', grade: 92.5 },
    { id: '2', name: 'Marcus Rivera', studentId: 'S24002', email: 'm.rivera@edu.com', grade: 78.3 },
    { id: '3', name: 'Aisha Kapoor', studentId: 'S24003', email: 'aisha.k@edu.com', grade: 88.0 }
  ];
  writeStudents(students);
}

// ---------- API ROUTES ----------

// GET all students
app.get('/api/students', (req, res) => {
  const students = readStudents();
  res.json(students);
});

// GET a single student by ID (optional, but useful)
app.get('/api/students/:id', (req, res) => {
  const students = readStudents();
  const student = students.find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

// POST new student
app.post('/api/students', (req, res) => {
  const { name, studentId, email, grade } = req.body;
  if (!name || !studentId || grade === undefined) {
    return res.status(400).json({ error: 'Name, studentId and grade are required' });
  }

  const students = readStudents();
  // Check duplicate studentId
  if (students.some(s => s.studentId === studentId)) {
    return res.status(409).json({ error: 'Student ID already exists' });
  }

  const newStudent = {
    id: String(Date.now()),   // simple unique ID
    name,
    studentId,
    email: email || '',
    grade: Number(grade)
  };
  students.push(newStudent);
  writeStudents(students);
  res.status(201).json(newStudent);
});

// PUT (update) student by ID
app.put('/api/students/:id', (req, res) => {
  const { name, studentId, email, grade } = req.body;
  const students = readStudents();
  const index = students.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Student not found' });

  // Check duplicate studentId (excluding the current student)
  if (studentId && students.some(s => s.studentId === studentId && s.id !== req.params.id)) {
    return res.status(409).json({ error: 'Student ID already exists' });
  }

  students[index] = {
    ...students[index],
    name: name || students[index].name,
    studentId: studentId || students[index].studentId,
    email: email !== undefined ? email : students[index].email,
    grade: grade !== undefined ? Number(grade) : students[index].grade
  };
  writeStudents(students);
  res.json(students[index]);
});

// DELETE student by ID
app.delete('/api/students/:id', (req, res) => {
  let students = readStudents();
  const newStudents = students.filter(s => s.id !== req.params.id);
  if (students.length === newStudents.length) {
    return res.status(404).json({ error: 'Student not found' });
  }
  writeStudents(newStudents);
  res.status(204).send();
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
