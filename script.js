// ตัวแปรสำหรับเก็บวันที่ปัจจุบัน
let currentDate = new Date();
let activeFilters = ['red', 'green', 'blue', 'yellow'];

// ข้อมูลทีมต่างๆ (ใส่ไว้ด้านบนของไฟล์ script.js)
const teamData = {
    red: {
        name: 'Shift A (Red Team)',
        leader: 'อธิราช',
        members: [
            'กฤตเมธ',
            'ศรัณยู',
            'ขจรพล',
            'ชานุพัทร',
            'ศรัณย์'
        ]
    },
    green: {
        name: 'Shift B (Green Team)',
        leader: 'ปพน',
        members: [
            'ณัฏฐดนัย',
            'ธนพงศ์',
            'ธนากร'
        ]
    },
    blue: {
        name: 'Shift C (Blue Team)',
        leader: 'กฤษฏ์',
        members: [
            'วิศรุต',
            'พรภวิษย์',
            'มนต์เสกค์'
        ]
    },
    yellow: {
        name: 'Shift D (Yellow Team)',
        leader: 'พิสุทธิ์',
        members: [
            'วิษาโรจน์',
            'เจตนา',
            'วุฒิชัย'
        ]
    }
};

// ข้อมูลเดือนภาษาไทย
const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// รูปแบบกะการทำงาน (4 วัน)
const shiftPattern = [
    [
        { color: 'red', name: 'อธิราช', time: '00:00-08:00' },
        { color: 'green', name: 'ปพน', time: '08:00-16:00' },
        { color: 'yellow', name: 'พิสุทธิ์', time: '16:00-00:00' }
    ],
    [
        { color: 'yellow', name: 'พิสุทธิ์', time: '00:00-08:00' },
        { color: 'blue', name: 'กฤษฏ์', time: '08:00-16:00' },
        { color: 'green', name: 'ปพน', time: '16:00-00:00' }
    ],
    [
        { color: 'green', name: 'ปพน', time: '00:00-08:00' },
        { color: 'red', name: 'อธิราช', time: '08:00-16:00' },
        { color: 'blue', name: 'กฤษฏ์', time: '16:00-00:00' }
    ],
    [
        { color: 'blue', name: 'กฤษฏ์', time: '00:00-08:00' },
        { color: 'yellow', name: 'พิสุทธิ์', time: '08:00-16:00' },
        { color: 'red', name: 'อธิราช', time: '16:00-00:00' }
    ]
];

// ฟังก์ชันอัพเดทฟิลเตอร์
function updateFilters() {
    const checkboxes = document.querySelectorAll('.shift-checkbox');
    activeFilters = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    renderCalendar();
}

// ฟังก์ชันเลือก/ยกเลิกทั้งหมด
function selectAllShifts(selected) {
    const checkboxes = document.querySelectorAll('.shift-checkbox');
    checkboxes.forEach(cb => cb.checked = selected);
    updateFilters();
}

// สร้าง dropdown สำหรับเลือกเดือนและปี
function initializeSelectors() {
    const selectors = {
        month: document.getElementById('monthSelect'),
        year: document.getElementById('yearSelect'),
        startMonth: document.getElementById('startMonthSelect'),
        startYear: document.getElementById('startYearSelect'),
        endMonth: document.getElementById('endMonthSelect'),
        endYear: document.getElementById('endYearSelect')
    };

    // เพิ่มตัวเลือกเดือน
    const monthSelectors = document.querySelectorAll('.month-select, #monthSelect');
    monthSelectors.forEach(selector => {
        thaiMonths.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            selector.appendChild(option);
        });
    });

    // เพิ่มตัวเลือกปี
    const yearSelectors = document.querySelectorAll('.year-select, #yearSelect');
    const currentYear = new Date().getFullYear();
    yearSelectors.forEach(selector => {
        for (let year = currentYear; year <= currentYear + 50; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year + 543}`;
            selector.appendChild(option);
        }
    });

    // ตั้งค่าเริ่มต้น
    const currentMonth = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    Object.values(selectors).forEach(selector => {
        if (selector.classList.contains('month-select') || selector.id === 'monthSelect') {
            selector.value = currentMonth;
        } else if (selector.classList.contains('year-select') || selector.id === 'yearSelect') {
            selector.value = year;
        }
    });

    // เพิ่ม event listeners
    selectors.month.addEventListener('change', (e) => {
        currentDate.setMonth(e.target.value);
        renderCalendar();
    });

    selectors.year.addEventListener('change', (e) => {
        currentDate.setFullYear(e.target.value);
        renderCalendar();
    });
}

// คำนวณรูปแบบกะสำหรับวันที่กำหนด
function getShiftsForDay(date) {
    // กำหนดวันที่เริ่มต้นของรอบเวร (12 มกราคม 2024)
    const startDate = new Date(2024, 0, 12);
    const daysSinceStart = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
    const patternIndex = (daysSinceStart % 4 + 4) % 4;
    return shiftPattern[patternIndex].filter(shift => activeFilters.includes(shift.color));
}

// สร้างปฏิทิน
function createCalendarMonth(year, month) {
    const calendarDiv = document.createElement('div');
    calendarDiv.className = 'calendar';

    // สร้างส่วนหัวเดือน
    const monthHeader = document.createElement('div');
    monthHeader.className = 'month-header';
    monthHeader.textContent = `${thaiMonths[month]} ${year + 543}`;
    calendarDiv.appendChild(monthHeader);

    // สร้างส่วนหัวปฏิทิน
    const headerDiv = document.createElement('div');
    headerDiv.className = 'calendar-header';
    ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = day;
        headerDiv.appendChild(dayDiv);
    });
    calendarDiv.appendChild(headerDiv);

    // สร้างตารางวัน
    const gridDiv = document.createElement('div');
    gridDiv.className = 'calendar-grid';

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // สร้างช่องว่างก่อนวันที่ 1
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty-day';
        gridDiv.appendChild(emptyDay);
    }

    // สร้างวันที่ในเดือน
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        const dateDiv = document.createElement('div');
        dateDiv.className = 'date';
        dateDiv.textContent = day;
        dayElement.appendChild(dateDiv);

        const shifts = getShiftsForDay(date);
        shifts.forEach(shift => {
            const shiftDiv = document.createElement('div');
            shiftDiv.className = `shift shift-${shift.color}`;
            shiftDiv.textContent = `${shift.time} ${shift.name}`;
            shiftDiv.style.cursor = 'pointer';
            shiftDiv.onclick = (e) => {
                e.stopPropagation();
                showShiftDetails(shift, shift.time);
            };
            dayElement.appendChild(shiftDiv);
        });

        gridDiv.appendChild(dayElement);
    }

    calendarDiv.appendChild(gridDiv);
    return calendarDiv;
}

function toggleTeamMembers(teamColor) {
    const membersDiv = document.getElementById(`${teamColor}-members`);
    const teamCard = membersDiv.closest('.team-card');
    
    // Toggle expanded class on team card
    teamCard.classList.toggle('expanded');
    
    // Toggle show class on members div
    membersDiv.classList.toggle('show');
    
    // Update other team cards if needed
    const allTeamCards = document.querySelectorAll('.team-card');
    allTeamCards.forEach(card => {
        if (card !== teamCard) {
            card.classList.remove('expanded');
            card.querySelector('.team-members').classList.remove('show');
        }
    });
}

// Add this to your existing document.addEventListener('DOMContentLoaded', ...)
document.addEventListener('DOMContentLoaded', () => {
    // Initially hide all team members
    const allTeamMembers = document.querySelectorAll('.team-members');
    allTeamMembers.forEach(members => {
        members.classList.remove('show');
    });
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            const modal = document.getElementById('teamModal');
            modal.style.display = 'none';
        });
    }

    window.onclick = function(event) {
        const modal = document.getElementById('teamModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}); 

// แสดงปฏิทิน
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    container.innerHTML = '';
    container.appendChild(createCalendarMonth(currentDate.getFullYear(), currentDate.getMonth()));
}

function showShiftDetails(shift, time) {
    const modal = document.getElementById('teamModal');
    const teamInfo = teamData[shift.color];
    
    modal.querySelector('.modal-title').textContent = teamInfo.name;
    modal.querySelector('.team-time').innerHTML = `<strong>เวลาทำงาน:</strong> ${time}`;
    
    const detailsHTML = `
        <h4>รายละเอียดทีม</h4>
        <ul>
            <li><strong>หัวหน้าทีม:</strong> ${teamInfo.leader}</li>
            <li><strong>สมาชิกทีม:</strong></li>
            ${teamInfo.members.map(member => `<li>- ${member}</li>`).join('')}
        </ul>
    `;
    
    modal.querySelector('.team-details').innerHTML = detailsHTML;
    modal.style.display = 'block';
}

window.onclick = function(event) {
    const modal = document.getElementById('teamModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// ฟังก์ชันเปลี่ยนเดือน
function changeMonth(offset) {
    currentDate.setMonth(currentDate.getMonth() + offset);
    document.getElementById('monthSelect').value = currentDate.getMonth();
    document.getElementById('yearSelect').value = currentDate.getFullYear();
    renderCalendar();
}

// ฟังก์ชัน Export PDF
async function exportToPDF() {
    const startMonth = parseInt(document.getElementById('startMonthSelect').value);
    const startYear = parseInt(document.getElementById('startYearSelect').value);
    const endMonth = parseInt(document.getElementById('endMonthSelect').value);
    const endYear = parseInt(document.getElementById('endYearSelect').value);

    // ตรวจสอบช่วงเวลาที่เลือก
    if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
        alert('กรุณาเลือกช่วงเวลาให้ถูกต้อง');
        return;
    }

    const pdfContainer = document.createElement('div');
    pdfContainer.className = 'pdf-container';

    const teamDetailsSection = document.createElement('div');
    teamDetailsSection.innerHTML = `
        <div class="export-header">
            <h2>ตารางเวรการปฏิบัติงาน</h2>
            <p>ประจำเดือน ${thaiMonths[startMonth]} - ${thaiMonths[endMonth]} ${startYear + 543}</p>
        </div>
        
        ${Object.entries(teamData).map(([color, team]) => `
            <div class="team-section ${color}">
                <h3>${team.name}</h3>
                <p><strong>หัวหน้าทีม:</strong> ${team.leader}</p>
                <p><strong>สมาชิกทีม:</strong></p>
                <ul>
                    ${team.members.map(member => `<li>${member}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
    `;
    
    pdfContainer.appendChild(teamDetailsSection);

    let currentYear = startYear;
    let currentMonth = startMonth;

    // สร้างปฏิทินทุกเดือนในช่วงที่เลือก
    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        pdfContainer.appendChild(createCalendarMonth(currentYear, currentMonth));
        
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    }

    // กำหนดค่าการส่งออก PDF
    const opt = {
        margin: 10,
        filename: `ตารางเวร_${thaiMonths[startMonth]}_${startYear + 543}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(pdfContainer).save();
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการสร้าง PDF:', error);
        alert('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง');
    }
}

// เริ่มต้นใช้งาน
document.addEventListener('DOMContentLoaded', () => {
    initializeSelectors();
    renderCalendar();
});