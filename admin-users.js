document.addEventListener("DOMContentLoaded", async () => {
  const hasAccess = await checkAdminAccess();
  if (hasAccess) {
    document.getElementById("loadingScreen").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    await loadUsers(); // เรียกใช้ loadUsers ในหน้านี้
  }
});

function showLoading(message = "กำลังดำเนินการ...") {
  document.getElementById("loadingMessage").textContent = message;
  document.getElementById("loadingOverlay").style.display = "flex";
}
function hideLoading() {
  document.getElementById("loadingOverlay").style.display = "none";
}

// ฟังก์ชันจัดการ Alert Modal
function showAlert(message, title = "แจ้งเตือน") {
  return new Promise((resolve) => {
    document.getElementById("alertTitle").textContent = title;
    document.getElementById("alertMessage").textContent = message;
    document.getElementById("alertModal").style.display = "flex";
    document.getElementById("alertModal").onclick = (e) => {
      if (e.target === document.getElementById("alertModal")) {
        closeAlertModal();
        resolve();
      }
    };
  });
}

function closeAlertModal() {
  document.getElementById("alertModal").style.display = "none";
}
