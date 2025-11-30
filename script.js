// ===== CONFIGURATION =====
const COMPULSORY_SUBJECTS = [
    'C. English', 'C. Nepali', 'C. Math', 'Science & Technology', 'Social Studies'
];

const SUBJECT_CONFIG = {
    'C. English': { th: 75, pr: 25, thCH: 3.75, prCH: 1.25 },
    'C. Nepali': { th: 75, pr: 25, thCH: 3.75, prCH: 1.25 },
    'C. Math': { th: 75, pr: 25, thCH: 3.75, prCH: 1.25 },
    'Science & Technology': { th: 75, pr: 25, thCH: 3.75, prCH: 1.25 },
    'Social Studies': { th: 75, pr: 25, thCH: 3, prCH: 1 },
};

const OPTIONAL_CONFIG = {
    'Math': { th: 75, pr: 25, thCH: 3, prCH: 1 },
    'Economics': { th: 75, pr: 25, thCH: 3, prCH: 1 },
    'Computer Science': { th: 50, pr: 50, thCH: 2, prCH: 2 },
    'Accountancy': { th: 75, pr: 25, thCH: 3, prCH: 1 },
};

const GRADE_POINTS = { 'A+': 4.0, 'A': 3.6, 'B+': 3.2, 'B': 2.8, 'C+': 2.4, 'C': 2.0, 'D': 1.6, 'NG': 0 };

// ===== STATE =====
let currentStudent = {};
let currentMarksheet = null;
let allMarks = {};

// ===== TAB NAVIGATION =====
function goToTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'tab-library') loadLibrary();
    if (tabName === 'tab-public') loadPublicBoard();
}

// ===== STEP 1: STUDENT INFO =====
function handleInfoForm(e) {
    e.preventDefault();
    
    currentStudent = {
        name: document.getElementById('name').value.trim(),
        rollNo: document.getElementById('rollNo').value.trim(),
        class: document.getElementById('class').value,
        section: document.getElementById('section').value,
        term: document.getElementById('term').value,
        dobBS: document.getElementById('dobBS').value.trim(),
        optI: document.getElementById('optI').value,
        optII: document.getElementById('optII').value,
    };
    
    buildMarksForm();
    hideStep('step-info');
    showStep('step-marks');
}

// ===== STEP 2: MARKS ENTRY =====
function buildMarksForm() {
    let html = '';
    const subjects = [...COMPULSORY_SUBJECTS, 
        `${currentStudent.optI} (Opt I)`, 
        `${currentStudent.optII} (Opt II)`];
    
    subjects.forEach(subject => {
        const config = SUBJECT_CONFIG[subject.replace(' (Opt I)', '').replace(' (Opt II)', '')] || 
                       OPTIONAL_CONFIG[subject.replace(' (Opt I)', '').replace(' (Opt II)', '')];
        
        if (!config) return;
        
        html += `
            <div class="subject-group">
                <div class="subject-title">${subject}</div>
                <div class="marks-row">
                    <div class="mark-input">
                        <label>Theory (0-${config.th})</label>
                        <input type="number" class="th-mark" data-subject="${subject}" min="0" max="${config.th}" placeholder="0">
                    </div>
                    <div class="mark-input">
                        <label>Practical (0-${config.pr})</label>
                        <input type="number" class="pr-mark" data-subject="${subject}" min="0" max="${config.pr}" placeholder="0">
                    </div>
                </div>
            </div>
        `;
    });
    
    document.getElementById('marksForm').innerHTML = html;
}

function calculateGPA() {
    allMarks = {};
    let isValid = true;
    
    document.querySelectorAll('.th-mark').forEach(input => {
        const subject = input.dataset.subject;
        const th = input.value ? parseInt(input.value) : null;
        if (th === null) isValid = false;
        if (!allMarks[subject]) allMarks[subject] = {};
        allMarks[subject].th = th;
    });
    
    document.querySelectorAll('.pr-mark').forEach(input => {
        const subject = input.dataset.subject;
        const pr = input.value ? parseInt(input.value) : null;
        if (pr === null) isValid = false;
        if (!allMarks[subject]) allMarks[subject] = {};
        allMarks[subject].pr = pr;
    });
    
    if (!isValid) {
        alert('Please enter all marks!');
        return;
    }
    
    generateMarksheet();
}

// ===== STEP 3: MARKSHEET GENERATION =====
function generateMarksheet() {
    let tableHTML = `<table class="marksheet-table"><thead><tr>
        <th>Subject</th><th>Theory</th><th>Practical</th><th>Grade</th><th>Credit Hours</th><th>GP</th><th>WGP</th>
    </tr></thead><tbody>`;
    
    let totalWGP = 0, totalCH = 0;
    currentMarksheet = { subjects: [] };
    
    for (const subject in allMarks) {
        const marks = allMarks[subject];
        const config = SUBJECT_CONFIG[subject.replace(' (Opt I)', '').replace(' (Opt II)', '')] || 
                       OPTIONAL_CONFIG[subject.replace(' (Opt I)', '').replace(' (Opt II)', '')];
        
        const thGrade = getGrade(marks.th, config.th, false);
        const prGrade = getGrade(marks.pr, config.pr, true);
        const finalGrade = (thGrade === 'NG' || prGrade === 'NG') ? 'NG' : [thGrade, prGrade].sort()[1];
        
        const gp = GRADE_POINTS[finalGrade] || 0;
        const ch = config.thCH + config.prCH;
        const wgp = gp * ch;
        
        totalWGP += wgp;
        totalCH += ch;
        
        currentMarksheet.subjects.push({
            name: subject,
            th: marks.th,
            pr: marks.pr,
            thMax: config.th,
            prMax: config.pr,
            grade: finalGrade,
            gp, ch, wgp
        });
        
        tableHTML += `<tr>
            <td class="subject-name">${subject}</td>
            <td><span class="grade-badge">${marks.th}/${config.th}</span></td>
            <td><span class="grade-badge">${marks.pr}/${config.pr}</span></td>
            <td><span class="grade-badge grade-${finalGrade.toLowerCase()}">${finalGrade}</span></td>
            <td>${ch}</td>
            <td>${gp.toFixed(2)}</td>
            <td>${wgp.toFixed(2)}</td>
        </tr>`;
    }
    
    currentMarksheet.gpa = (totalWGP / totalCH).toFixed(2);
    currentMarksheet.totalWGP = totalWGP;
    currentMarksheet.totalCH = totalCH;
    
    tableHTML += `</tbody></table>`;
    
    let html = `
        <div class="marksheet-header">
            <h2>MARKSHEET</h2>
            <p>The grade secured by <b>${currentStudent.name}</b> with Roll No <b>${currentStudent.rollNo}</b></p>
            <p>from Class <b>${currentStudent.class}</b> of Section <b>${currentStudent.section}</b> is below:</p>
        </div>
        
        <div class="student-info">
            <div class="info-item"><span class="info-label">Name:</span><span class="info-value">${currentStudent.name}</span></div>
            <div class="info-item"><span class="info-label">Roll:</span><span class="info-value">${currentStudent.rollNo}</span></div>
            <div class="info-item"><span class="info-label">Class:</span><span class="info-value">${currentStudent.class}</span></div>
            <div class="info-item"><span class="info-label">DOB (BS):</span><span class="info-value">${currentStudent.dobBS}</span></div>
            <div class="info-item"><span class="info-label">Term:</span><span class="info-value">${currentStudent.term}</span></div>
            <div class="info-item"><span class="info-label">Section:</span><span class="info-value">${currentStudent.section}</span></div>
        </div>
        
        <div class="optional-info">
            <div class="opt-item"><span class="opt-label">Optional I:</span><span class="opt-value">${currentStudent.optI}</span></div>
            <div class="opt-item"><span class="opt-label">Optional II:</span><span class="opt-value">${currentStudent.optII}</span></div>
        </div>
        
        ${tableHTML}
        
        <div class="gpa-summary">
            <div class="gpa-label">OVERALL GPA</div>
            <div class="gpa-value">${currentMarksheet.gpa}</div>
            <div class="gpa-status">${getGPAStatus(currentMarksheet.gpa)}</div>
        </div>
    `;
    
    document.getElementById('marksheetDisplay').innerHTML = html;
    hideStep('step-marks');
    showStep('step-marksheet');
}

function getGrade(marks, maxMarks, isPractical) {
    const percent = (marks / maxMarks) * 100;
    if (isPractical && percent < 40) return 'NG';
    if (percent >= 90) return 'A+';
    if (percent >= 80) return 'A';
    if (percent >= 70) return 'B+';
    if (percent >= 60) return 'B';
    if (percent >= 50) return 'C+';
    if (percent >= 40) return 'C';
    if (percent >= 35 && !isPractical) return 'D';
    return 'NG';
}

function getGPAStatus(gpa) {
    if (gpa >= 3.6) return '🌟 Excellent';
    if (gpa >= 3.0) return '👍 Very Good';
    if (gpa >= 2.5) return '✅ Good';
    if (gpa >= 2.0) return '📚 Average';
    if (gpa > 0) return '⚠️ Below Average';
    return '❌ Failed';
}

// ===== LIBRARY FUNCTIONS =====
function saveMarksheet() {
    const library = JSON.parse(localStorage.getItem('gpa_library')) || [];
    const entry = { id: Date.now(), ...currentStudent, ...currentMarksheet };
    library.push(entry);
    localStorage.setItem('gpa_library', JSON.stringify(library));
    
    // Also add to public board (without roll no)
    const publicLib = JSON.parse(localStorage.getItem('gpa_public')) || [];
    const publicEntry = {
        id: Date.now(),
        name: currentStudent.name,
        class: currentStudent.class,
        section: currentStudent.section,
        term: currentStudent.term,
        gpa: currentMarksheet.gpa,
        status: getGPAStatus(currentMarksheet.gpa)
    };
    publicLib.push(publicEntry);
    localStorage.setItem('gpa_public', JSON.stringify(publicLib));
    
    alert('✅ Saved to library!');
    startNewCalc();
}

function loadLibrary() {
    const library = JSON.parse(localStorage.getItem('gpa_library')) || [];
    let html = '';
    
    if (library.length === 0) {
        html = '<div class="empty-library"><p>No saved marksheets yet!</p></div>';
    } else {
        library.forEach(item => {
            html += `
                <div class="library-card">
                    <div class="card-header">
                        <div class="card-title">${item.name}</div>
                        <div class="card-gpa">${item.gpa}</div>
                    </div>
                    <div class="card-term">${item.term}</div>
                    <div class="card-info">
                        <div class="info-row"><span>Roll:</span><span>${item.rollNo}</span></div>
                        <div class="info-row"><span>Class:</span><span>${item.class}</span></div>
                        <div class="info-row"><span>Section:</span><span>${item.section}</span></div>
                    </div>
                    <button class="card-btn card-btn-delete" onclick="deleteMarksheet(${item.id})">🗑️ Delete</button>
                </div>
            `;
        });
    }
    
    document.getElementById('libraryList').innerHTML = html;
}

function filterLibrary() {
    const search = document.getElementById('searchLibrary').value.toLowerCase();
    const library = JSON.parse(localStorage.getItem('gpa_library')) || [];
    
    const filtered = library.filter(item => 
        item.name.toLowerCase().includes(search) || item.rollNo.includes(search)
    );
    
    let html = '';
    filtered.forEach(item => {
        html += `
            <div class="library-card">
                <div class="card-header">
                    <div class="card-title">${item.name}</div>
                    <div class="card-gpa">${item.gpa}</div>
                </div>
                <div class="card-term">${item.term}</div>
                <div class="card-info">
                    <div class="info-row"><span>Roll:</span><span>${item.rollNo}</span></div>
                    <div class="info-row"><span>Class:</span><span>${item.class}</span></div>
                </div>
                <button class="card-btn card-btn-delete" onclick="deleteMarksheet(${item.id})">🗑️ Delete</button>
            </div>
        `;
    });
    
    document.getElementById('libraryList').innerHTML = html || '<p>No results found</p>';
}

function deleteMarksheet(id) {
    if (!confirm('Delete this marksheet?')) return;
    let library = JSON.parse(localStorage.getItem('gpa_library')) || [];
    library = library.filter(item => item.id !== id);
    localStorage.setItem('gpa_library', JSON.stringify(library));
    loadLibrary();
}

function clearLibrary() {
    if (!confirm('Delete ALL marksheets?')) return;
    localStorage.setItem('gpa_library', JSON.stringify([]));
    loadLibrary();
}

// ===== PUBLIC BOARD =====
function loadPublicBoard() {
    const publicLib = JSON.parse(localStorage.getItem('gpa_public')) || [];
    publicLib.sort((a, b) => b.gpa - a.gpa);
    
    let html = '';
    if (publicLib.length === 0) {
        html = '<div class="empty-library"><p>No marksheets on public board yet!</p></div>';
    } else {
        publicLib.forEach((item, idx) => {
            const medals = ['🥇', '🥈', '🥉'];
            const medal = idx < 3 ? medals[idx] + ' ' : '';
            html += `
                <div class="library-card">
                    <div class="card-header">
                        <div class="card-title">${medal}${item.name}</div>
                        <div class="card-gpa">${item.gpa}</div>
                    </div>
                    <div class="card-term">${item.term}</div>
                    <div class="card-info">
                        <div class="info-row"><span>Class:</span><span>${item.class}</span></div>
                        <div class="info-row"><span>Section:</span><span>${item.section}</span></div>
                        <div class="info-row"><span>Rank:</span><span>#${idx + 1}</span></div>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--primary-color);">${item.status}</div>
                </div>
            `;
        });
    }
    
    document.getElementById('publicList').innerHTML = html;
}

function filterPublic() {
    const search = document.getElementById('searchPublic').value.toLowerCase();
    const classFilter = document.getElementById('filterClass').value;
    const termFilter = document.getElementById('filterTerm').value;
    const publicLib = JSON.parse(localStorage.getItem('gpa_public')) || [];
    
    const filtered = publicLib.filter(item => 
        item.name.toLowerCase().includes(search) &&
        (!classFilter || item.class === classFilter) &&
        (!termFilter || item.term === termFilter)
    );
    
    filtered.sort((a, b) => b.gpa - a.gpa);
    
    let html = '';
    filtered.forEach((item, idx) => {
        const medals = ['🥇', '🥈', '🥉'];
        const medal = idx < 3 ? medals[idx] + ' ' : '';
        html += `
            <div class="library-card">
                <div class="card-header">
                    <div class="card-title">${medal}${item.name}</div>
                    <div class="card-gpa">${item.gpa}</div>
                </div>
                <div class="card-term">${item.term}</div>
                <div class="card-info">
                    <div class="info-row"><span>Class:</span><span>${item.class}</span></div>
                    <div class="info-row"><span>Section:</span><span>${item.section}</span></div>
                </div>
            </div>
        `;
    });
    
    document.getElementById('publicList').innerHTML = html || '<p>No results</p>';
}

// ===== NAVIGATION =====
function goBackToInfo() { hideStep('step-marks'); showStep('step-info'); }
function startNewCalc() { hideStep('step-marksheet'); showStep('step-info'); document.getElementById('infoForm').reset(); }
function printMarksheet() { window.print(); }

function showStep(stepId) { document.getElementById(stepId).style.display = 'block'; }
function hideStep(stepId) { document.getElementById(stepId).style.display = 'none'; }
