// SUBJECT CONFIGURATION
const SUBJECTS = {
    compulsory: [
        { name: 'C. English', theory: 75, practical: 25, creditTheory: 3.75, creditPractical: 1.25 },
        { name: 'C. Nepali', theory: 75, practical: 25, creditTheory: 3.75, creditPractical: 1.25 },
        { name: 'C. Math', theory: 75, practical: 25, creditTheory: 3.75, creditPractical: 1.25 },
        { name: 'Science & Technology', theory: 75, practical: 25, creditTheory: 3.75, creditPractical: 1.25 },
        { name: 'Social Studies', theory: 75, practical: 25, creditTheory: 3, creditPractical: 1 }
    ],
    optional1: {
        'Math': { theory: 75, practical: 25, creditTheory: 3, creditPractical: 1 },
        'Economics': { theory: 75, practical: 25, creditTheory: 3, creditPractical: 1 }
    },
    optional2: {
        'Computer Science': { theory: 50, practical: 50, creditTheory: 2, creditPractical: 2 },
        'Accountancy': { theory: 75, practical: 25, creditTheory: 3, creditPractical: 1 }
    }
};

const GRADE_POINTS = {
    'A+': 4.0, 'A': 3.6, 'B+': 3.2, 'B': 2.8,
    'C+': 2.4, 'C': 2.0, 'D': 1.6, 'NG': 0
};

const GRADE_BOUNDARIES = {
    percentage: [
        { grade: 'A+', min: 90 },
        { grade: 'A', min: 80 },
        { grade: 'B+', min: 70 },
        { grade: 'B', min: 60 },
        { grade: 'C+', min: 50 },
        { grade: 'C', min: 40 },
        { grade: 'D', min: 35 },
        { grade: 'NG', min: 0 }
    ],
    practicalPercentage: [
        { grade: 'A+', min: 90 },
        { grade: 'A', min: 80 },
        { grade: 'B+', min: 70 },
        { grade: 'B', min: 60 },
        { grade: 'C+', min: 50 },
        { grade: 'C', min: 40 },
        { grade: 'NG', min: 0 }
    ]
};

// STATE VARIABLES
let currentStudent = null;
let currentMarks = {};
let currentMarksheet = null;

// TAB SWITCHING
function switchTab(tabIndex) {
    document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', idx === tabIndex);
    });
    document.querySelectorAll('.tab-panel').forEach((panel, idx) => {
        panel.classList.toggle('active', idx === tabIndex);
    });

    if (tabIndex === 1) loadLibrary();
    if (tabIndex === 2) loadPublicBoard();
}

// FORM SUBMISSION
function submitForm(event) {
    event.preventDefault();

    const name = document.getElementById('f_name').value.trim();
    const roll = document.getElementById('f_roll').value.trim();
    const cls = document.getElementById('f_class').value;
    const section = document.getElementById('f_section').value;
    const term = document.getElementById('f_term').value;
    const dob = document.getElementById('f_dob').value.trim();
    const opt1 = document.getElementById('f_opt1').value;
    const opt2 = document.getElementById('f_opt2').value;

    if (!name || !roll || !cls || !section || !term || !dob || !opt1 || !opt2) {
        alert('Please fill all fields!');
        return;
    }

    currentStudent = { name, roll, class: cls, section, term, dob, opt1, opt2 };
    currentMarks = {};

    document.getElementById('form-step').style.display = 'none';
    document.getElementById('marks-step').style.display = 'block';
    buildMarksForm();
}

// BUILD MARKS ENTRY FORM
function buildMarksForm() {
    const container = document.getElementById('marks-container');
    container.innerHTML = '';

    const subjects = [
        ...SUBJECTS.compulsory,
        SUBJECTS.optional1[currentStudent.opt1],
        SUBJECTS.optional2[currentStudent.opt2]
    ];

    const subjectNames = [
        ...SUBJECTS.compulsory.map(s => s.name),
        currentStudent.opt1,
        currentStudent.opt2
    ];

    subjectNames.forEach((name, idx) => {
        const subject = subjects[idx];
        const isOptional2 = idx >= 6;
        const div = document.createElement('div');
        div.className = 'mark-item';
        div.innerHTML = `
            <h4>${name}</h4>
            <div class="mark-item-input">
                <input type="number" 
                       id="theory_${idx}" 
                       min="0" 
                       max="${subject.theory}"
                       placeholder="Theory (0-${subject.theory})"
                       onchange="validateMark(${idx}, true)">
                <input type="number" 
                       id="practical_${idx}" 
                       min="0" 
                       max="${subject.practical}"
                       placeholder="Practical (0-${subject.practical})"
                       onchange="validateMark(${idx}, false)">
            </div>
        `;
        container.appendChild(div);
    });
}

function validateMark(idx, isTheory) {
    const subjects = [
        ...SUBJECTS.compulsory,
        SUBJECTS.optional1[currentStudent.opt1],
        SUBJECTS.optional2[currentStudent.opt2]
    ];
    const subject = subjects[idx];
    const input = document.getElementById(`${isTheory ? 'theory' : 'practical'}_${idx}`);
    const max = isTheory ? subject.theory : subject.practical;
    if (input.value > max) input.value = max;
    if (input.value < 0) input.value = 0;
}

function backToForm() {
    document.getElementById('form-step').style.display = 'block';
    document.getElementById('marks-step').style.display = 'none';
}

// CALCULATE GPA
function calculateGPA() {
    const subjects = [
        ...SUBJECTS.compulsory,
        SUBJECTS.optional1[currentStudent.opt1],
        SUBJECTS.optional2[currentStudent.opt2]
    ];

    const subjectNames = [
        ...SUBJECTS.compulsory.map(s => s.name),
        currentStudent.opt1,
        currentStudent.opt2
    ];

    let allSubjects = [];
    let totalWeightedPoints = 0;
    let totalCredits = 0;
    let hasNG = false;

    for (let i = 0; i < subjectNames.length; i++) {
        const theory = parseFloat(document.getElementById(`theory_${i}`).value) || 0;
        const practical = parseFloat(document.getElementById(`practical_${i}`).value) || 0;
        const subject = subjects[i];

        const theoryGrade = getGrade(theory, 'theory', subject.theory);
        const practicalGrade = getGrade(practical, 'practical', subject.practical);
        const finalGrade = theoryGrade === 'NG' || practicalGrade === 'NG' ? 'NG' : 
                          (GRADE_POINTS[theoryGrade] < GRADE_POINTS[practicalGrade] ? theoryGrade : practicalGrade);

        const creditTheory = subject.creditTheory || 0;
        const creditPractical = subject.creditPractical || 0;
        const totalCredit = creditTheory + creditPractical;

        if (finalGrade === 'NG') hasNG = true;

        allSubjects.push({
            name: subjectNames[i],
            theory, theoryGrade, creditTheory,
            practical, practicalGrade, creditPractical,
            finalGrade,
            totalCredit
        });

        totalWeightedPoints += GRADE_POINTS[finalGrade] * totalCredit;
        totalCredits += totalCredit;
    }

    const gpa = totalCredits > 0 ? (totalWeightedPoints / totalCredits).toFixed(2) : 0;

    currentMarksheet = {
        student: currentStudent,
        subjects: allSubjects,
        gpa,
        hasNG
    };

    displayMarksheet();
}

function getGrade(marks, type, maxMarks) {
    const percentage = (marks / maxMarks) * 100;
    const boundaries = type === 'practical' ? GRADE_BOUNDARIES.practicalPercentage : GRADE_BOUNDARIES.percentage;
    for (let b of boundaries) {
        if (percentage >= b.min) return b.grade;
    }
    return 'NG';
}

// DISPLAY MARKSHEET
function displayMarksheet() {
    const html = generateMarksheetHTML();
    document.getElementById('marksheet-html').innerHTML = html;
    document.getElementById('marks-step').style.display = 'none';
    document.getElementById('result-step').style.display = 'block';
}

function generateMarksheetHTML() {
    const s = currentMarksheet;
    const st = s.student;

    let html = `<div class="marksheet">
        <div class="marksheet-header">
            <h2>School GPA Marksheet</h2>
            <p>Academic Record</p>
        </div>
        <div class="student-info">
            <div class="student-info-item"><strong>Name:</strong> ${st.name}</div>
            <div class="student-info-item"><strong>Roll:</strong> ${st.roll}</div>
            <div class="student-info-item"><strong>Class:</strong> ${st.class}</div>
            <div class="student-info-item"><strong>Section:</strong> ${st.section}</div>
            <div class="student-info-item"><strong>Term:</strong> ${st.term}</div>
            <div class="student-info-item"><strong>DOB (BS):</strong> ${st.dob}</div>
        </div>
        <table class="marks-table">
            <thead>
                <tr>
                    <th>Subject</th>
                    <th>Theory</th>
                    <th>Practical</th>
                    <th>Grade</th>
                </tr>
            </thead>
            <tbody>`;

    s.subjects.forEach(sub => {
        html += `<tr>
                    <td class="subject-name">${sub.name}</td>
                    <td>${sub.theory} (${sub.theoryGrade})</td>
                    <td>${sub.practical} (${sub.practicalGrade})</td>
                    <td><strong>${sub.finalGrade}</strong></td>
                </tr>`;
    });

    html += `</tbody></table>`;
    html += `<div class="gpa-result">
        <h3>GPA</h3>
        <div class="gpa-value">${s.gpa}</div>
        <div class="gpa-status">${s.hasNG ? 'Status: Not Qualified' : 'Status: Qualified'}</div>
    </div></div>`;

    return html;
}

function saveMarksheet() {
    if (!currentMarksheet) return;

    let library = JSON.parse(localStorage.getItem('gpa_library') || '[]');
    const record = {
        id: Date.now(),
        ...currentMarksheet,
        savedDate: new Date().toLocaleDateString()
    };
    library.push(record);
    localStorage.setItem('gpa_library', JSON.stringify(library));

    // Also add to public board
    let publicBoard = JSON.parse(localStorage.getItem('gpa_public') || '[]');
    publicBoard.push({
        id: record.id,
        name: currentMarksheet.student.name,
        gpa: currentMarksheet.gpa,
        class: currentMarksheet.student.class,
        term: currentMarksheet.student.term,
        roll: currentMarksheet.student.roll
    });
    localStorage.setItem('gpa_public', JSON.stringify(publicBoard));

    alert('✓ Marksheet saved to library!');
}

function printPage() {
    window.print();
}

function newCalculation() {
    document.getElementById('form-step').style.display = 'block';
    document.getElementById('result-step').style.display = 'none';
    document.getElementById('f_name').value = '';
    document.getElementById('f_roll').value = '';
    document.getElementById('f_class').value = '';
    document.getElementById('f_section').value = '';
    document.getElementById('f_term').value = '';
    document.getElementById('f_dob').value = '';
    document.getElementById('f_opt1').value = '';
    document.getElementById('f_opt2').value = '';
}

// LIBRARY FUNCTIONS
function loadLibrary() {
    const library = JSON.parse(localStorage.getItem('gpa_library') || '[]');
    const container = document.getElementById('lib-container');

    if (library.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">No saved marksheets yet</p>';
        return;
    }

    container.innerHTML = library.map(record => `
        <div class="marksheet-card">
            <div class="card-info">
                <strong>${record.student.name}</strong>
                <small>Roll: ${record.student.roll} | Class: ${record.student.class} | ${record.student.term}</small>
                <small>${record.savedDate}</small>
            </div>
            <div class="gpa-badge">${record.gpa}</div>
            <div class="card-buttons">
                <button class="btn-small" onclick="viewMarksheet(${record.id})">View</button>
                <button class="btn-small btn-delete" onclick="deleteMarksheet(${record.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function filterLibrary() {
    const search = document.getElementById('lib-search').value.toLowerCase();
    const library = JSON.parse(localStorage.getItem('gpa_library') || '[]');
    const filtered = library.filter(r => 
        r.student.name.toLowerCase().includes(search) || 
        r.student.roll.includes(search)
    );

    const container = document.getElementById('lib-container');
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">No results found</p>';
        return;
    }

    container.innerHTML = filtered.map(record => `
        <div class="marksheet-card">
            <div class="card-info">
                <strong>${record.student.name}</strong>
                <small>Roll: ${record.student.roll} | Class: ${record.student.class} | ${record.student.term}</small>
                <small>${record.savedDate}</small>
            </div>
            <div class="gpa-badge">${record.gpa}</div>
            <div class="card-buttons">
                <button class="btn-small" onclick="viewMarksheet(${record.id})">View</button>
                <button class="btn-small btn-delete" onclick="deleteMarksheet(${record.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function viewMarksheet(id) {
    const library = JSON.parse(localStorage.getItem('gpa_library') || '[]');
    const record = library.find(r => r.id === id);
    if (!record) return;

    currentMarksheet = record;
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.tab-panel')[0].classList.add('active');

    document.getElementById('form-step').style.display = 'none';
    document.getElementById('marks-step').style.display = 'none';
    document.getElementById('result-step').style.display = 'block';
    document.getElementById('marksheet-html').innerHTML = generateMarksheetHTML();
}

function deleteMarksheet(id) {
    if (!confirm('Delete this marksheet?')) return;

    let library = JSON.parse(localStorage.getItem('gpa_library') || '[]');
    library = library.filter(r => r.id !== id);
    localStorage.setItem('gpa_library', JSON.stringify(library));

    let publicBoard = JSON.parse(localStorage.getItem('gpa_public') || '[]');
    publicBoard = publicBoard.filter(r => r.id !== id);
    localStorage.setItem('gpa_public', JSON.stringify(publicBoard));

    loadLibrary();
}

function clearAllLib() {
    if (!confirm('Clear ALL saved marksheets? This cannot be undone!')) return;
    localStorage.removeItem('gpa_library');
    localStorage.removeItem('gpa_public');
    loadLibrary();
}

// PUBLIC BOARD FUNCTIONS
function loadPublicBoard() {
    const publicBoard = JSON.parse(localStorage.getItem('gpa_public') || '[]');
    const sorted = publicBoard.sort((a, b) => b.gpa - a.gpa);

    const container = document.getElementById('pub-container');
    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">No marksheets shared yet</p>';
        return;
    }

    container.innerHTML = sorted.map((record, idx) => `
        <div class="public-card">
            <div class="public-card-rank">#${idx + 1}</div>
            <div class="public-card-name">${record.name}</div>
            <div class="public-card-meta">Roll: ${record.roll} | Class: ${record.class} | ${record.term}</div>
            <div class="public-card-gpa">GPA: ${record.gpa}</div>
        </div>
    `).join('');
}

function filterPublic() {
    const search = document.getElementById('pub-search').value.toLowerCase();
    const cls = document.getElementById('pub-class').value;
    const term = document.getElementById('pub-term').value;

    let publicBoard = JSON.parse(localStorage.getItem('gpa_public') || '[]');
    publicBoard = publicBoard.filter(r =>
        r.name.toLowerCase().includes(search) &&
        (!cls || r.class === cls) &&
        (!term || r.term === term)
    );

    const sorted = publicBoard.sort((a, b) => b.gpa - a.gpa);
    const container = document.getElementById('pub-container');

    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">No results found</p>';
        return;
    }

    container.innerHTML = sorted.map((record, idx) => `
        <div class="public-card">
            <div class="public-card-rank">#${idx + 1}</div>
            <div class="public-card-name">${record.name}</div>
            <div class="public-card-meta">Roll: ${record.roll} | Class: ${record.class} | ${record.term}</div>
            <div class="public-card-gpa">GPA: ${record.gpa}</div>
        </div>
    `).join('');
}
