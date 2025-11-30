// Grade Points Mapping
const gradePoints = {
    'A+': 4.0,
    'A': 3.6,
    'B+': 3.2,
    'B': 2.8,
    'C+': 2.4,
    'C': 2.0,
    'D': 1.6,
    'NG': 0.0
};

// Local Storage Key
const LIBRARY_STORAGE_KEY = 'gpa_calculator_library';

// Credit Hours for Compulsory Subjects
const compulsoryCreditHours = {
    'C. English': { th: 3.75, pr: 1.25 },
    'C. Nepali': { th: 3.75, pr: 1.25 },
    'C. Math': { th: 3.75, pr: 1.25 },
    'Science & Technology': { th: 3.75, pr: 1.25 },
    'Social Studies': { th: 3, pr: 1 }
};

// Optional Subjects Configuration
const optionalConfig = {
    optI: {
        'Math': { th: 3, pr: 1, maxTh: 75, maxPr: 25 },
        'Economics': { th: 3, pr: 1, maxTh: 75, maxPr: 25 }
    },
    optII: {
        'Computer Science': { th: 2, pr: 2, maxTh: 50, maxPr: 50 },
        'Accountancy': { th: 3, pr: 1, maxTh: 75, maxPr: 25 }
    }
};

// Subject Configuration
const subjects = {
    compulsory: [
        { name: 'C. English', maxTh: 75, maxPr: 25 },
        { name: 'C. Nepali', maxTh: 75, maxPr: 25 },
        { name: 'C. Math', maxTh: 75, maxPr: 25 },
        { name: 'Science & Technology', maxTh: 75, maxPr: 25 },
        { name: 'Social Studies', maxTh: 75, maxPr: 25 }
    ]
};

// Global state
let studentData = {
    name: '',
    rollNo: '',
    class: '',
    section: '',
    term: '',
    dobBS: '',
    optI: '',
    optII: '',
    marks: {}
};

let currentMarksheet = null;

// Initialize
document.getElementById('studentInfoForm').addEventListener('submit', handleStudentInfoSubmit);
document.getElementById('librarySearchBox').addEventListener('input', filterLibrary);

function handleStudentInfoSubmit(e) {
    e.preventDefault();
    
    studentData.name = document.getElementById('studentName').value.trim();
    studentData.rollNo = document.getElementById('rollNo').value.trim();
    studentData.class = document.getElementById('class').value;
    studentData.section = document.getElementById('section').value;
    studentData.term = document.getElementById('term').value;
    studentData.dobBS = document.getElementById('dobBS').value.trim();
    studentData.optI = document.getElementById('optI').value;
    studentData.optII = document.getElementById('optII').value;
    
    // Build subject list with optional subjects
    const allSubjects = [...subjects.compulsory];
    
    // Add Optional I
    const optIConfig = optionalConfig.optI[studentData.optI];
    allSubjects.push({
        name: `${studentData.optI} (Opt I)`,
        maxTh: optIConfig.maxTh,
        maxPr: optIConfig.maxPr,
        isOptional: true
    });
    
    // Add Optional II
    const optIIConfig = optionalConfig.optII[studentData.optII];
    allSubjects.push({
        name: `${studentData.optII} (Opt II)`,
        maxTh: optIIConfig.maxTh,
        maxPr: optIIConfig.maxPr,
        isOptional: true
    });
    
    // Render marks entry
    renderMarksEntry(allSubjects);
    
    // Switch to marks entry (stay in calculator tab)
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('marksEntrySection').classList.add('active');
}

function renderMarksEntry(allSubjects) {
    const container = document.getElementById('marksContainer');
    container.innerHTML = '';
    
    allSubjects.forEach(subject => {
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'subject-group';
        
        const theoryMax = subject.maxTh;
        const practicalMax = subject.maxPr;
        
        subjectDiv.innerHTML = `
            <div class="subject-title">${subject.name}</div>
            <div class="marks-row">
                <div class="mark-input">
                    <label for="th_${subject.name}">Theory Marks</label>
                    <input type="number" id="th_${subject.name}" min="0" max="${theoryMax}" placeholder="0" class="theory-input">
                    <span class="max-marks">Out of ${theoryMax}</span>
                </div>
                <div class="mark-input">
                    <label for="pr_${subject.name}">Practical Marks</label>
                    <input type="number" id="pr_${subject.name}" min="0" max="${practicalMax}" placeholder="0" class="practical-input">
                    <span class="max-marks">Out of ${practicalMax}</span>
                </div>
            </div>
        `;
        
        container.appendChild(subjectDiv);
    });
}

function calculateGPA() {
    // Get all inputs
    const theoryInputs = document.querySelectorAll('.theory-input');
    const practicalInputs = document.querySelectorAll('.practical-input');
    
    // Validate all inputs are filled
    let allFilled = true;
    [...theoryInputs, ...practicalInputs].forEach(input => {
        const value = input.value.trim();
        if (value === '' || isNaN(value)) {
            input.style.borderColor = '#ef4444';
            allFilled = false;
        } else {
            input.style.borderColor = '';
        }
    });
    
    if (!allFilled) {
        alert('Please fill all marks fields');
        return;
    }
    
    // Collect marks
    studentData.marks = {};
    
    theoryInputs.forEach(input => {
        const subjectName = input.id.replace('th_', '');
        if (!studentData.marks[subjectName]) {
            studentData.marks[subjectName] = {};
        }
        studentData.marks[subjectName].theory = parseFloat(input.value);
    });
    
    practicalInputs.forEach(input => {
        const subjectName = input.id.replace('pr_', '');
        if (!studentData.marks[subjectName]) {
            studentData.marks[subjectName] = {};
        }
        studentData.marks[subjectName].practical = parseFloat(input.value);
    });
    
    // Calculate and display marksheet
    displayMarksheet();
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('marksheetSection').classList.add('active');
}

function calculateGrade(marks, maxMarks, isPractical = false) {
    if (marks === null || marks === undefined) {
        return 'NG';
    }
    
    const percentage = (marks / maxMarks) * 100;
    
    // Practical has 40% pass mark and no D grade
    if (isPractical) {
        if (percentage < 40) {
            return 'NG';
        }
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C+';
        if (percentage >= 40) return 'C'; // No D in practical
        return 'NG';
    }
    
    // Theory grading
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 35) return 'D';
    return 'NG';
}

function getGradeClass(grade) {
    return `grade-${grade.toLowerCase().replace('+', '-plus')}`;
}

function getCreditHours(subjectName) {
    // Check compulsory subjects
    if (compulsoryCreditHours[subjectName]) {
        return compulsoryCreditHours[subjectName];
    }
    
    // Check optional subjects
    if (subjectName.includes('(Opt I)')) {
        const optI = studentData.optI;
        return {
            th: optionalConfig.optI[optI].th,
            pr: optionalConfig.optI[optI].pr
        };
    }
    
    if (subjectName.includes('(Opt II)')) {
        const optII = studentData.optII;
        return {
            th: optionalConfig.optII[optII].th,
            pr: optionalConfig.optII[optII].pr
        };
    }
    
    return { th: 0, pr: 0 };
}

function displayMarksheet() {
    const container = document.getElementById('marksheetContent');
    
    // Header
    let html = `
        <div class="marksheet-header">
            <h2>MARKSHEET</h2>
            <p>The grade secured by <b>${studentData.name}</b> with Roll No <b>${studentData.rollNo}</b></p>
            <p>from Class <b>${studentData.class}</b> of Section <b>${studentData.section}</b> is below:</p>
        </div>
        
        <div class="student-info">
            <div class="info-item">
                <span class="info-label">Student Name:</span>
                <span class="info-value">${studentData.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Roll No:</span>
                <span class="info-value">${studentData.rollNo}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Class:</span>
                <span class="info-value">${studentData.class}</span>
            </div>
            <div class="info-item">
                <span class="info-label">DOB (BS):</span>
                <span class="info-value">${studentData.dobBS}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Section:</span>
                <span class="info-value">${studentData.section}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Terminal Exam:</span>
                <span class="info-value">${studentData.term}</span>
            </div>
        </div>
        
        <div class="optional-info">
            <div class="opt-item">
                <span class="opt-label">Optional I:</span>
                <span class="opt-value">${studentData.optI}</span>
            </div>
            <div class="opt-item">
                <span class="opt-label">Optional II:</span>
                <span class="opt-value">${studentData.optII}</span>
            </div>
        </div>
        
        <table class="marksheet-table">
            <thead>
                <tr>
                    <th>Subject</th>
                    <th>Theory</th>
                    <th>Practical</th>
                    <th>Grade</th>
                    <th>Credit Hours</th>
                    <th>GP</th>
                    <th>WGP</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    let totalWGP = 0;
    let totalCreditHours = 0;
    const subjectsData = [];
    
    // Process all subjects in order
    const allSubjectNames = Object.keys(studentData.marks);
    
    allSubjectNames.forEach(subjectName => {
        const marks = studentData.marks[subjectName];
        const theoryMarks = marks.theory;
        const practicalMarks = marks.practical;
        
        // Get max marks for this subject
        let maxTh = 75, maxPr = 25;
        
        if (subjectName.includes('(Opt I)')) {
            maxTh = optionalConfig.optI[studentData.optI].maxTh;
            maxPr = optionalConfig.optI[studentData.optI].maxPr;
        } else if (subjectName.includes('(Opt II)')) {
            maxTh = optionalConfig.optII[studentData.optII].maxTh;
            maxPr = optionalConfig.optII[studentData.optII].maxPr;
        }
        
        // Calculate grades
        const theoryGrade = calculateGrade(theoryMarks, maxTh, false);
        const practicalGrade = calculateGrade(practicalMarks, maxPr, true);
        
        // Determine final grade (lower of the two, or NG if either is NG)
        let finalGrade = 'NG';
        if (theoryGrade !== 'NG' && practicalGrade !== 'NG') {
            // Use lower grade
            const gradeOrder = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'NG'];
            const thIdx = gradeOrder.indexOf(theoryGrade);
            const prIdx = gradeOrder.indexOf(practicalGrade);
            finalGrade = gradeOrder[Math.max(thIdx, prIdx)];
        }
        
        // Get credit hours
        const creditHours = getCreditHours(subjectName);
        const totalCH = creditHours.th + creditHours.pr;
        
        // Calculate GP and WGP
        const gp = gradePoints[finalGrade] || 0;
        const wgp = gp * totalCH;
        
        // Store subject data for library
        subjectsData.push({
            name: subjectName,
            theory: theoryMarks,
            practical: practicalMarks,
            maxTh: maxTh,
            maxPr: maxPr,
            theoryGrade: theoryGrade,
            practicalGrade: practicalGrade,
            grade: finalGrade,
            creditHours: totalCH,
            gp: gp,
            wgp: wgp
        });
        
        totalWGP += wgp;
        totalCreditHours += totalCH;
        
        const gradeClass = getGradeClass(finalGrade);
        const theoryGradeClass = getGradeClass(theoryGrade);
        const practicalGradeClass = getGradeClass(practicalGrade);
        
        html += `
            <tr>
                <td class="subject-name">${subjectName}</td>
                <td><span class="grade-badge ${theoryGradeClass}">${theoryMarks}/${maxTh}</span></td>
                <td><span class="grade-badge ${practicalGradeClass}">${practicalMarks}/${maxPr}</span></td>
                <td><span class="grade-badge ${gradeClass}">${finalGrade}</span></td>
                <td>${totalCH}</td>
                <td>${gp.toFixed(2)}</td>
                <td>${wgp.toFixed(2)}</td>
            </tr>
        `;
    });
    
    // Calculate final GPA
    const finalGPA = totalCreditHours > 0 ? (totalWGP / totalCreditHours).toFixed(2) : 0;
    
    // Store current marksheet data
    currentMarksheet = {
        gpa: finalGPA,
        totalWGP: totalWGP,
        totalCreditHours: totalCreditHours,
        subjectsData: subjectsData
    };
    
    // Determine GPA status
    let gpaStatus = getGPAStatus(finalGPA);
    } else {
        gpaStatus = '❌ Failed';
    }
    
    html += `
            </tbody>
        </table>
        
        <div class="gpa-summary">
            <div class="gpa-label">OVERALL GPA</div>
            <div class="gpa-value">
                <span>${finalGPA}</span>
                <span class="gpa-status" style="font-size: 1.2rem;">${gpaStatus}</span>
            </div>
            <div class="gpa-status">Total Weighted Grade Points: ${totalWGP.toFixed(2)} | Total Credit Hours: ${totalCreditHours}</div>
        </div>
    `;
    
    container.innerHTML = html;
}

function switchSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

function goBack() {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('studentInfoSection').classList.add('active');
}

function startOver() {
    // Reset form
    document.getElementById('studentInfoForm').reset();
    studentData = {
        name: '',
        rollNo: '',
        class: '',
        section: '',
        term: '',
        dobBS: '',
        optI: '',
        optII: '',
        marks: {}
    };
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('studentInfoSection').classList.add('active');
}

function printMarksheet() {
    window.print();
}

// Tab Switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // Load library if switching to library
    if (tabName === 'library') {
        displayLibrary();
    }
}

// Save to Library
function saveToLibrary() {
    if (!currentMarksheet) {
        alert('No marksheet to save!');
        return;
    }
    
    // Get existing library
    let library = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY)) || [];
    
    // Create library entry
    const entry = {
        id: Date.now(),
        ...studentData,
        gpa: currentMarksheet.gpa,
        totalWGP: currentMarksheet.totalWGP,
        totalCreditHours: currentMarksheet.totalCreditHours,
        subjectsData: currentMarksheet.subjectsData,
        savedDate: new Date().toLocaleString()
    };
    
    // Add to library
    library.push(entry);
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
    
    alert('✅ Marksheet saved to library successfully!');
    
    // Switch to library tab
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById('libraryTab').classList.add('active');
    document.querySelectorAll('.nav-tab')[1].classList.add('active');
    
    displayLibrary();
}

// Display Library
function displayLibrary() {
    const container = document.getElementById('libraryContainer');
    const library = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY)) || [];
    
    if (library.length === 0) {
        container.innerHTML = `
            <div class="empty-library" style="grid-column: 1 / -1;">
                <div class="empty-library-icon">📚</div>
                <p>No saved marksheets yet!</p>
                <p style="font-size: 0.95rem;">Go to Calculator tab and save your first marksheet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    library.forEach(entry => {
        const gpaStatus = getGPAStatus(entry.gpa);
        const card = document.createElement('div');
        card.className = 'library-card';
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${entry.name}</div>
                <div class="card-gpa">${entry.gpa}</div>
            </div>
            <div class="card-term">${entry.term}</div>
            <div class="card-info">
                <div class="info-row">
                    <span class="info-label">Roll No:</span>
                    <span class="info-data">${entry.rollNo}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Class:</span>
                    <span class="info-data">${entry.class}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Section:</span>
                    <span class="info-data">${entry.section}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">DOB (BS):</span>
                    <span class="info-data">${entry.dobBS}</span>
                </div>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 12px;">
                <strong>Optional I:</strong> ${entry.optI} | <strong>Optional II:</strong> ${entry.optII}
            </div>
            <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 12px;">
                Status: <span style="color: var(--primary-color); font-weight: 600;">${gpaStatus}</span>
            </div>
            <div class="card-actions">
                <button type="button" class="card-btn" onclick="viewMarksheet(${entry.id})">👁️ View</button>
                <button type="button" class="card-btn card-btn-delete" onclick="deleteFromLibrary(${entry.id})">🗑️ Delete</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Filter Library
function filterLibrary() {
    const searchTerm = document.getElementById('librarySearchBox').value.toLowerCase();
    const cards = document.querySelectorAll('.library-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// View Marksheet from Library
function viewMarksheet(id) {
    const library = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY)) || [];
    const entry = library.find(e => e.id === id);
    
    if (!entry) {
        alert('Marksheet not found!');
        return;
    }
    
    // Restore student data and display
    studentData = {
        name: entry.name,
        rollNo: entry.rollNo,
        class: entry.class,
        section: entry.section,
        term: entry.term,
        dobBS: entry.dobBS,
        optI: entry.optI,
        optII: entry.optII,
        marks: {}
    };
    
    currentMarksheet = {
        gpa: entry.gpa,
        totalWGP: entry.totalWGP,
        totalCreditHours: entry.totalCreditHours,
        subjectsData: entry.subjectsData
    };
    
    // Display marksheet
    displaySavedMarksheet(entry);
    
    // Switch to calculator tab
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById('calculatorTab').classList.add('active');
    document.querySelectorAll('.nav-tab')[0].classList.add('active');
    
    // Hide sections, show marksheet
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('marksheetSection').classList.add('active');
}

// Display Saved Marksheet
function displaySavedMarksheet(entry) {
    const container = document.getElementById('marksheetContent');
    
    let html = `
        <div class="marksheet-header">
            <h2>MARKSHEET</h2>
            <p>The grade secured by <b>${entry.name}</b> with Roll No <b>${entry.rollNo}</b></p>
            <p>from Class <b>${entry.class}</b> of Section <b>${entry.section}</b> is below:</p>
        </div>
        
        <div class="student-info">
            <div class="info-item">
                <span class="info-label">Student Name:</span>
                <span class="info-value">${entry.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Roll No:</span>
                <span class="info-value">${entry.rollNo}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Class:</span>
                <span class="info-value">${entry.class}</span>
            </div>
            <div class="info-item">
                <span class="info-label">DOB (BS):</span>
                <span class="info-value">${entry.dobBS}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Section:</span>
                <span class="info-value">${entry.section}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Terminal Exam:</span>
                <span class="info-value">${entry.term}</span>
            </div>
        </div>
        
        <div class="optional-info">
            <div class="opt-item">
                <span class="opt-label">Optional I:</span>
                <span class="opt-value">${entry.optI}</span>
            </div>
            <div class="opt-item">
                <span class="opt-label">Optional II:</span>
                <span class="opt-value">${entry.optII}</span>
            </div>
        </div>
        
        <table class="marksheet-table">
            <thead>
                <tr>
                    <th>Subject</th>
                    <th>Theory</th>
                    <th>Practical</th>
                    <th>Grade</th>
                    <th>Credit Hours</th>
                    <th>GP</th>
                    <th>WGP</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    entry.subjectsData.forEach(subject => {
        const gradeClass = getGradeClass(subject.grade);
        const theoryGradeClass = getGradeClass(subject.theoryGrade);
        const practicalGradeClass = getGradeClass(subject.practicalGrade);
        
        html += `
            <tr>
                <td class="subject-name">${subject.name}</td>
                <td><span class="grade-badge ${theoryGradeClass}">${subject.theory}/${subject.maxTh}</span></td>
                <td><span class="grade-badge ${practicalGradeClass}">${subject.practical}/${subject.maxPr}</span></td>
                <td><span class="grade-badge ${gradeClass}">${subject.grade}</span></td>
                <td>${subject.creditHours}</td>
                <td>${subject.gp.toFixed(2)}</td>
                <td>${subject.wgp.toFixed(2)}</td>
            </tr>
        `;
    });
    
    const gpaStatus = getGPAStatus(entry.gpa);
    
    html += `
            </tbody>
        </table>
        
        <div class="gpa-summary">
            <div class="gpa-label">OVERALL GPA</div>
            <div class="gpa-value">
                <span>${entry.gpa}</span>
                <span class="gpa-status" style="font-size: 1.2rem;">${gpaStatus}</span>
            </div>
            <div class="gpa-status">Total Weighted Grade Points: ${entry.totalWGP.toFixed(2)} | Total Credit Hours: ${entry.totalCreditHours}</div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Delete from Library
function deleteFromLibrary(id) {
    if (confirm('Are you sure you want to delete this marksheet?')) {
        let library = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY)) || [];
        library = library.filter(e => e.id !== id);
        localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
        displayLibrary();
    }
}

// Clear All Library
function clearAllLibrary() {
    if (confirm('Are you sure you want to delete ALL marksheets? This cannot be undone!')) {
        localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify([]));
        displayLibrary();
    }
}

// Helper function to get GPA status
function getGPAStatus(gpa) {
    if (gpa >= 3.6) {
        return '🌟 Excellent';
    } else if (gpa >= 3.0) {
        return '👍 Very Good';
    } else if (gpa >= 2.5) {
        return '✅ Good';
    } else if (gpa >= 2.0) {
        return '📚 Average';
    } else if (gpa > 0) {
        return '⚠️ Below Average';
    } else {
        return '❌ Failed';
    }
}
