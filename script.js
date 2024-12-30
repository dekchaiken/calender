// script.js

// ตัวแปรสำหรับเก็บวันที่ปัจจุบัน
let currentDate = new Date();
let activeFilters = ["red", "green", "blue", "yellow"];
let teamData = {}; // เปลี่ยนเป็นตัวแปรสำหรับเก็บข้อมูลทีมจาก Firestore
let shiftPattern = []; // เปลี่ยนเป็นตัวแปรสำหรับเก็บรูปแบบกะจาก Firestore

// ข้อมูลเดือนภาษาไทย (เก็บไว้เหมือนเดิม)
const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

// ฟังก์ชันอัพเดทฟิลเตอร์ (เก็บไว้เหมือนเดิม)
function updateFilters() {
  const checkboxes = document.querySelectorAll(".shift-checkbox");
  activeFilters = Array.from(checkboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
  renderCalendar();
}

// ฟังก์ชันเลือก/ยกเลิกทั้งหมด (เก็บไว้เหมือนเดิม)
function selectAllShifts(selected) {
  const checkboxes = document.querySelectorAll(".shift-checkbox");
  checkboxes.forEach((cb) => (cb.checked = selected));
  updateFilters();
}

// สร้าง dropdown สำหรับเลือกเดือนและปี (เก็บไว้เหมือนเดิม)
function initializeSelectors() {
  const selectors = {
    month: document.getElementById("monthSelect"),
    year: document.getElementById("yearSelect"),
    startMonth: document.getElementById("startMonthSelect"),
    startYear: document.getElementById("startYearSelect"),
    endMonth: document.getElementById("endMonthSelect"),
    endYear: document.getElementById("endYearSelect"),
  };

  // เพิ่มตัวเลือกเดือน
  const monthSelectors = document.querySelectorAll(
    ".month-select, #monthSelect"
  );
  monthSelectors.forEach((selector) => {
    thaiMonths.forEach((month, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = month;
      selector.appendChild(option);
    });
  });

  // เพิ่มตัวเลือกปี
  const yearSelectors = document.querySelectorAll(".year-select, #yearSelect");
  const currentYear = new Date().getFullYear();
  yearSelectors.forEach((selector) => {
    for (let year = currentYear; year <= currentYear + 50; year++) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = `${year + 543}`;
      selector.appendChild(option);
    }
  });

  // ตั้งค่าเริ่มต้น
  const currentMonth = currentDate.getMonth();
  const year = currentDate.getFullYear();

  Object.values(selectors).forEach((selector) => {
    if (
      selector.classList.contains("month-select") ||
      selector.id === "monthSelect"
    ) {
      selector.value = currentMonth;
    } else if (
      selector.classList.contains("year-select") ||
      selector.id === "yearSelect"
    ) {
      selector.value = year;
    }
  });

  // เพิ่ม event listeners
  selectors.month.addEventListener("change", (e) => {
    currentDate.setMonth(e.target.value);
    renderCalendar();
  });

  selectors.year.addEventListener("change", (e) => {
    currentDate.setFullYear(e.target.value);
    renderCalendar();
  });
}

// ดึงข้อมูลทีมจาก Firestore
async function loadTeamData() {
  const teams = ["red", "green", "blue", "yellow"];
  const teamData = {};

  for (const team of teams) {
    try {
      const snapshot = await firebase
        .firestore()
        .collection("teams")
        .doc(team)
        .collection("members")
        .get();

      const members = [];
      let leader = "";

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const userRef = firebase
          .firestore()
          .collection("users")
          .doc(data.userId);

        const userPromise = userRef.get().then((userDoc) => {
          const userData = userDoc.data();
          if (data.role === "leader") {
            leader = userData.displayName;
          } else {
            members.push(userData.displayName);
          }
        });
        members.push(userPromise);
      }
      await Promise.all(members);

      teamData[team] = {
        name: `Shift ${team.toUpperCase()} (${
          team.charAt(0).toUpperCase() + team.slice(1)
        } Team)`,
        leader: leader,
        members: members.filter((m) => typeof m === "string"), // Filter out promises
      };
    } catch (error) {
      console.error(`Error loading ${team} team data:`, error);
    }
  }
  return teamData;
}

// สร้างรูปแบบกะ
async function generateShiftPattern() {
  const teams = ["red", "green", "blue", "yellow"];
  const shiftPattern = [];
  const teamLeaders = {};

  // Get team leaders
  for (const team of teams) {
    try {
      const leaderSnapshot = await firebase
        .firestore()
        .collection("teams")
        .doc(team)
        .collection("members")
        .where("role", "==", "leader")
        .limit(1)
        .get();

      if (!leaderSnapshot.empty) {
        const leaderData = leaderSnapshot.docs[0].data();
        const userDoc = await firebase
          .firestore()
          .collection("users")
          .doc(leaderData.userId)
          .get();

        teamLeaders[team] = userDoc.data().displayName;
      }
    } catch (error) {
      console.error(`Error loading ${team} leader:`, error);
    }
  }

  // Define shift patterns
  const shifts = [
    [
      { time: "00:00-08:00", teams: ["red", "yellow", "green", "blue"] },
      { time: "08:00-16:00", teams: ["green", "blue", "red", "yellow"] },
      { time: "16:00-00:00", teams: ["yellow", "green", "blue", "red"] },
    ],
    [
      { time: "00:00-08:00", teams: ["yellow", "green", "blue", "red"] },
      { time: "08:00-16:00", teams: ["blue", "red", "yellow", "green"] },
      { time: "16:00-00:00", teams: ["green", "blue", "red", "yellow"] },
    ],
    [
      { time: "00:00-08:00", teams: ["green", "blue", "red", "yellow"] },
      { time: "08:00-16:00", teams: ["red", "yellow", "green", "blue"] },
      { time: "16:00-00:00", teams: ["blue", "red", "yellow", "green"] },
    ],
    [
      { time: "00:00-08:00", teams: ["blue", "red", "yellow", "green"] },
      { time: "08:00-16:00", teams: ["yellow", "green", "blue", "red"] },
      { time: "16:00-00:00", teams: ["red", "yellow", "green", "blue"] },
    ],
  ];

  // Generate pattern with actual leader names
  shifts.forEach((day) => {
    const dayPattern = day.map((shift) => ({
      color: shift.teams[0],
      name: teamLeaders[shift.teams[0]] || "undefined",
      time: shift.time,
    }));
    shiftPattern.push(dayPattern);
  });

  return shiftPattern;
}

// คำนวณรูปแบบกะสำหรับวันที่กำหนด (ใช้ข้อมูลจาก Firestore)
function getShiftsForDay(date) {
  if (!shiftPattern || shiftPattern.length === 0) {
    return []; // ถ้า shiftPattern ยังไม่พร้อม ให้คืนค่า array ว่าง
  }
  const startDate = new Date(2024, 0, 12);
  const daysSinceStart = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
  const patternIndex = ((daysSinceStart % 4) + 4) % 4;
  return shiftPattern[patternIndex].filter((shift) =>
    activeFilters.includes(shift.color)
  );
}

// สร้างปฏิทิน (ใช้ข้อมูลจาก Firestore)
function createCalendarMonth(year, month) {
    if (!shiftPattern || shiftPattern.length === 0) {
      const calendarDiv = document.createElement('div');
      calendarDiv.className = 'calendar';
      const monthHeader = document.createElement('div');
       monthHeader.className = 'month-header';
        monthHeader.textContent = `${thaiMonths[month]} ${year + 543}`;
      calendarDiv.appendChild(monthHeader);

        const noDataMessage = document.createElement('div');
       noDataMessage.textContent = 'กำลังโหลดข้อมูล...';
         calendarDiv.appendChild(noDataMessage);
        return calendarDiv; // ถ้า shiftPattern ยังไม่พร้อม ให้คืนค่า element ว่าง
  }

  const calendarDiv = document.createElement('div');
  calendarDiv.className = 'calendar';
  const monthHeader = document.createElement('div');
      monthHeader.className = 'month-header';
      monthHeader.textContent = `${thaiMonths[month]} ${year + 543}`;
      calendarDiv.appendChild(monthHeader);

  const headerDiv = document.createElement('div');
  headerDiv.className = 'calendar-header';
  ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].forEach(day => {
      const dayDiv = document.createElement('div');
      dayDiv.textContent = day;
      headerDiv.appendChild(dayDiv);
  });
  calendarDiv.appendChild(headerDiv);

  const gridDiv = document.createElement('div');
  gridDiv.className = 'calendar-grid';

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  for (let i = 0; i < startingDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty-day';
      gridDiv.appendChild(emptyDay);
  }

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

function updateCalendarUI(teamData) {
    // Update team cards
    Object.keys(teamData).forEach(team => {
        const membersDiv = document.getElementById(`${team}-members`);
        const leaderDiv = document.getElementById(`${team}-team-leader`);
        
        if (membersDiv && leaderDiv) {
            leaderDiv.innerHTML = `<p>Leader: ${teamData[team].leader}</p>`;
            membersDiv.innerHTML = teamData[team].members
                .map((member, index) => `<p>${index + 1}. ${member}</p>`)
                .join('');
        }
    });
    
    // Update calendar view
    renderCalendar();
}

function toggleTeamMembers(teamColor) {
  const membersDiv = document.getElementById(`${teamColor}-members`);
  const teamCard = membersDiv.closest(".team-card");

  // Toggle expanded class on team card
  teamCard.classList.toggle("expanded");

  // Toggle show class on members div
  membersDiv.classList.toggle("show");

  // Update other team cards if needed
  const allTeamCards = document.querySelectorAll(".team-card");
  allTeamCards.forEach((card) => {
    if (card !== teamCard) {
      card.classList.remove("expanded");
      card.querySelector(".team-members").classList.remove("show");
    }
  });
}

// Add this to your existing document.addEventListener('DOMContentLoaded', ...)
document.addEventListener("DOMContentLoaded", () => {
  // Initially hide all team members
  const allTeamMembers = document.querySelectorAll(".team-members");
  allTeamMembers.forEach((members) => {
    members.classList.remove("show");
  });
  const closeModal = document.querySelector(".close-modal");
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      const modal = document.getElementById("teamModal");
      modal.style.display = "none";
    });
  }

  window.onclick = function (event) {
    const modal = document.getElementById("teamModal");
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
});

async function getUserShift(userId) {
  const today = new Date();
  const shifts = getShiftsForDay(today);
  return shifts.find((shift) => shift.color === userTeam);
}

async function checkShiftExchanges() {
  if (!firebase.auth().currentUser) return;
  showLoadingOverlay("กำลังตรวจสอบคำขอแลกเวร...");
  try {
    const userId = firebase.auth().currentUser.uid;
    const exchanges = await firebase
      .firestore()
      .collection("shift_exchanges")
      .where("exchangeWith", "==", userId)
      .where("status", "==", "pending")
      .get();
    if (!exchanges.empty) {
      // แสดง notification หรือแจ้งเตือนในหน้า dashboard
      const notification = document.createElement("div");
      notification.className = "notification notification-pending";
      notification.innerHTML = `
            คุณมี ${exchanges.size} คำขอแลกเวรที่รอการตอบรับ 
             <a href="exchange.html">คลิกเพื่อดูรายละเอียด</a>
          `;

      const header = document.querySelector(".header");
      header.parentNode.insertBefore(notification, header.nextSibling);
    }
  } catch (error) {
    console.error("Error checking shift exchanges:", error);
  } finally {
    closeLoadingOverlay();
  }
}

// แสดงปฏิทิน (ใช้ข้อมูลจาก Firestore)
function renderCalendar() {
  const container = document.getElementById("calendar-container");
  container.innerHTML = "";
  container.appendChild(
    createCalendarMonth(currentDate.getFullYear(), currentDate.getMonth())
  );
}

function showShiftDetails(shift, time) {
  const modal = document.getElementById("teamModal");
  const teamInfo = teamData[shift.color];

  modal.querySelector(".modal-title").textContent = teamInfo.name;
  modal.querySelector(
    ".team-time"
  ).innerHTML = `<strong>เวลาทำงาน:</strong> ${time}`;

  const detailsHTML = `
        <h4>รายละเอียดทีม</h4>
        <ul>
            <li><strong>หัวหน้าทีม:</strong> ${teamInfo.leader}</li>
            <li><strong>สมาชิกทีม:</strong></li>
            ${teamInfo.members.map((member) => `<li>- ${member}</li>`).join("")}
        </ul>
    `;

  modal.querySelector(".team-details").innerHTML = detailsHTML;
  modal.style.display = "block";
}

window.onclick = function (event) {
  const modal = document.getElementById("teamModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// ฟังก์ชันเปลี่ยนเดือน (เก็บไว้เหมือนเดิม)
function changeMonth(offset) {
    showLoadingOverlay("กำลังโหลดปฏิทิน...");
    currentDate.setMonth(currentDate.getMonth() + offset);
    document.getElementById("monthSelect").value = currentDate.getMonth();
    document.getElementById("yearSelect").value = currentDate.getFullYear();
    renderCalendar();
     closeLoadingOverlay();
  }

// ฟังก์ชัน Export PDF (ปรับใช้ข้อมูลจาก Firestore)
async function exportToPDF() {
    showLoadingOverlay("กำลัง Export PDF...");
  const startMonth = parseInt(
    document.getElementById("startMonthSelect").value
  );
  const startYear = parseInt(document.getElementById("startYearSelect").value);
  const endMonth = parseInt(document.getElementById("endMonthSelect").value);
  const endYear = parseInt(document.getElementById("endYearSelect").value);

  // ตรวจสอบช่วงเวลาที่เลือก
  if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
     closeLoadingOverlay();
    showAlertModal("กรุณาเลือกช่วงเวลาให้ถูกต้อง");
    return;
  }

  const pdfContainer = document.createElement("div");
  pdfContainer.className = "pdf-container";

  const teamDetailsSection = document.createElement("div");
  teamDetailsSection.innerHTML = `
        <div class="export-header">
          <h2>ตารางเวรการปฏิบัติงาน</h2>
           <p>ประจำเดือน ${thaiMonths[startMonth]} - ${thaiMonths[endMonth]} ${
    startYear + 543
  }</p>
        </div>
         ${Object.entries(teamData)
           .map(
             ([color, team]) => `
           <div class="team-section ${color}">
               <h3>${team.name}</h3>
                <p><strong>หัวหน้าทีม:</strong> ${team.leader}</p>
               <p><strong>สมาชิกทีม:</strong></p>
                 <ul>
                  ${team.members.map((member) => `<li>${member}</li>`).join("")}
                 </ul>
            </div>
           `
           )
           .join("")}
    `;
  pdfContainer.appendChild(teamDetailsSection);

  let currentYear = startYear;
  let currentMonth = startMonth;

  // สร้างปฏิทินทุกเดือนในช่วงที่เลือก
  while (
    currentYear < endYear ||
    (currentYear === endYear && currentMonth <= endMonth)
  ) {
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
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  try {
    await html2pdf().set(opt).from(pdfContainer).save();
    closeLoadingOverlay();
     showAlertModal("Export PDF สำเร็จ");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้าง PDF:", error);
    closeLoadingOverlay();
     showAlertModal("เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง");
  }
}
// ฟังก์ชัน Print
function printCalendar() {
  const printWindow = window.open("", "_blank");
  const startMonth = parseInt(
    document.getElementById("startMonthSelect").value
  );
  const startYear = parseInt(document.getElementById("startYearSelect").value);
  const endMonth = parseInt(document.getElementById("endMonthSelect").value);
  const endYear = parseInt(document.getElementById("endYearSelect").value);
  if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
    alert("กรุณาเลือกช่วงเวลาให้ถูกต้อง");
    return;
  }
  let currentYear = startYear;
  let currentMonth = startMonth;

  let printContent = `
         <html>
            <head>
               <title>ตารางเวรการปฏิบัติงาน</title>
                 <style>
                    body { font-family: 'Noto Sans Thai', sans-serif; margin: 20px; }
                    .export-header { text-align: center; margin-bottom: 20px; padding: 20px;  background: #f8f9fa; border-radius: 8px; }
                             .team-section { margin: 20px 0; padding: 15px; border-radius: 8px; }
                     .calendar { width: 100%; border-collapse: collapse;  }
                        .calendar-header { display: grid;  grid-template-columns: repeat(7, 1fr);   padding: 0.75rem 0;   text-align: center;   background: #f8f9fa;     border-top-left-radius: 12px;    border-top-right-radius: 12px;   border-bottom: 1px solid #ddd;}
                          .month-header { text-align: center; font-size: 1.5em; margin-bottom: 10px;  padding: 1.5rem; background: white;    border-top-left-radius: 12px; border-top-right-radius: 12px;}
                          .calendar-grid {display: grid;  grid-template-columns: repeat(7, 1fr);  text-align: center; }
                        .calendar-day {padding: 10px; border-bottom: 1px solid #eee; border-right: 1px solid #eee; position: relative;}
                         .calendar-day:nth-child(7n) {  border-right: none; }
                        .calendar-day:last-child { border-bottom: none; }
                        .calendar-day.empty-day { background: #fafafa;  border-bottom: 1px solid #ddd; border-right: 1px solid #ddd; }
                        .shift { font-size: 0.9em; padding: 0.5rem;  border-radius: 4px; margin: 2px; display: block; }
                          .shift-red { background-color: rgba(255, 99, 99, 0.2); color: #404040;}
                           .shift-green { background-color: rgba(75, 192, 75, 0.2);  color: #404040; }
                         .shift-blue { background-color: rgba(99, 148, 255, 0.2); color: #404040; }
                          .shift-yellow {background-color: rgba(255, 206, 86, 0.2);  color: #404040; }
                      </style>
                  </head>
                <body>
                   <div class="pdf-container">
                        <div class="export-header">
                              <h2>ตารางเวรการปฏิบัติงาน</h2>
                              <p>ประจำเดือน ${thaiMonths[startMonth]} - ${
    thaiMonths[endMonth]
  } ${startYear + 543}</p>
                         </div>
                      ${Object.entries(teamData)
                        .map(
                          ([color, team]) => `
                         <div class="team-section ${color}">
                            <h3>${team.name}</h3>
                            <p><strong>หัวหน้าทีม:</strong> ${team.leader}</p>
                            <p><strong>สมาชิกทีม:</strong></p>
                            <ul>
                                ${team.members
                                  .map((member) => `<li>${member}</li>`)
                                  .join("")}
                             </ul>
                         </div>
                      `
                        )
                        .join("")}
                     `;

  while (
    currentYear < endYear ||
    (currentYear === endYear && currentMonth <= endMonth)
  ) {
    printContent += createCalendarMonth(currentYear, currentMonth).outerHTML;
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }

  printContent += `
             </div>
           </body>
          </html>
         `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

  function showLoadingOverlay(message) {
    document.getElementById('loadingOverlay').style.display = 'flex';
    document.getElementById('loadingMessage').textContent = message;
}
  function closeLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}
  // เพิ่มฟังก์ชันสำหรับแสดงข้อความแจ้งเตือน
  function showAlertModal(message) {
      document.getElementById('alertMessage').textContent = message;
      document.getElementById('alertModal').style.display = 'flex';
  }

  function closeAlertModal() {
      document.getElementById('alertModal').style.display = 'none';
  }


// เริ่มต้นใช้งาน (ปรับให้ดึงข้อมูลจาก Firestore)
document.addEventListener('DOMContentLoaded', async () => {
    initializeSelectors();
    showLoadingOverlay('กำลังโหลดข้อมูล...');
    try {
      const data = await initializeCalendarData();
        teamData = data.teamData
       shiftPattern = data.shiftPattern
       if (teamData && shiftPattern) {
        updateCalendarUI(teamData,shiftPattern);
        }
     } catch (error) {
        console.error('Error initializing calendar data:', error);
    } finally {
         closeLoadingOverlay();
       }
    checkShiftExchanges();
});
  
async function initializeCalendarData() {
            try {
                // Load team data and shift pattern
                const teamData = await loadTeamData();
                const shiftPattern = await generateShiftPattern();
    
                // Update UI with new data
                
                 return { teamData, shiftPattern };
    
            } catch (error) {
                console.error('Error initializing calendar data:', error);
                 showAlertModal('เกิดข้อผิดพลาดในการโหลดข้อมูล');
                 return null
            }
        }