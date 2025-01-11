document.addEventListener("DOMContentLoaded", async () => {
  const hasAccess = await checkAdminAccess();
  if (hasAccess) {
    document.getElementById("loadingScreen").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    try {
      await fetchUsersAndStats();
    } catch (error) {
      console.error("Error during initial fetch:", error);
      await showAlert("เกิดข้อผิดพลาดในการโหลดข้อมูลเริ่มต้น", "ข้อผิดพลาด");
    }
  }
});

// ฟังก์ชันดึงข้อมูลผู้ใช้และสถิติ
async function fetchUsersAndStats() {
  try {
    showLoading("กำลังโหลดข้อมูลผู้ใช้...");
    const usersSnapshot = await firebase.firestore().collection("users").get();
    let users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData) {
        users.push({ id: doc.id, ...userData });
      }
    });
    updateUserStats(users);
    updateUserTable(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    await showAlert("ไม่สามารถโหลดข้อมูลผู้ใช้ได้", "ข้อผิดพลาด");
  } finally {
    hideLoading();
  }
}

// ฟังก์ชันอัปเดตสถิติผู้ใช้
function updateUserStats(users) {
  let activeCount = 0;
  let inactiveCount = 0;
  let pendingCount = 0;

  users.forEach(user => {
    if (user.status === 'active') {
      activeCount++;
    } else if (user.status === 'inactive') {
      inactiveCount++;
    } else if (user.status === 'pending') {
      pendingCount++;
    }
  });

  document.getElementById("totalUsers").textContent = users.length;
  document.getElementById("activeUsers").textContent = activeCount;
  document.getElementById("inactiveUsers").textContent = inactiveCount;
  document.getElementById("pendingUsers").textContent = pendingCount;
}

// ฟังก์ชันอัปเดตตารางผู้ใช้
function updateUserTable(users) {
  const userTableBody = document.getElementById("userTableBody");
  userTableBody.innerHTML = "";

  users.forEach(user => {
    const row = document.createElement("tr");
    row.innerHTML = `
              <td>${user.email || ''}</td>
              <td>${user.displayName || ''}</td>
              <td>${user.role || "user"}</td>
              <td><span class="status-badge status-${user.status || 'inactive'}">${user.status || 'inactive'}</span></td>
              <td>
                  ${user.isApproved === true
                    ? '<span class="status-badge status-active">อนุมัติ</span>'
                    : '<span class="status-badge status-pending">รออนุมัติ</span>'
                  }
              </td>
              <td>
                  <button onclick="editUser('${user.id}')" class="action-btn edit-btn">แก้ไข</button>
                  <button onclick="deleteUser('${user.id}')" class="action-btn delete-btn">ลบ</button>
                  ${user.isApproved === true
                      ? `<button onclick="toggleUserApproval('${user.id}', false)" class="action-btn delete-btn" style="margin-left: 0.5rem;">ไม่อนุมัติ</button>`
                      : `<button onclick="toggleUserApproval('${user.id}', true)" class="action-btn edit-btn" style="margin-left: 0.5rem;">อนุมัติ</button>`
                  }
              </td>
          `;
    userTableBody.appendChild(row);
  });
}


// ฟังก์ชันอัปเดตข้อมูลผู้ใช้ (ใช้หลังจากเพิ่ม, แก้ไข, หรือลบ)
async function updateUserData() {
  try {
    await fetchUsersAndStats();
  } catch (error) {
    console.error("Error updating user data:", error);
    await showAlert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้", "ข้อผิดพลาด");
  }
}

async function toggleUserApproval(userId, approve) {
  showLoadingOverlay("กำลังดำเนินการ...");
  try {
    await firebase.firestore().collection("users").doc(userId).update({
      isApproved: approve,
    });
    closeLoadingOverlay();
    await updateUserData();
    await showAlertModal(
      approve ? "อนุมัติผู้ใช้งานสำเร็จ" : "ไม่อนุมัติบัญชีผู้ใช้งาน"
    );
  } catch (error) {
    console.error("Error toggling user approval:", error);
    closeLoadingOverlay();
    await showAlertModal("เกิดข้อผิดพลาดในการดำเนินการ");
  }
}

async function editUser(userId) {
  try {
    const userDoc = await firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    const userData = userDoc.data();

    document.getElementById("email").value = userData.email;
    document.getElementById("displayName").value = userData.displayName || "";
    document.getElementById("role").value = userData.role || "user";
    document.getElementById("status").value = userData.status || "active";

    document.getElementById("modalTitle").textContent = "แก้ไขผู้ใช้งาน";
    document.getElementById("userForm").onsubmit = (e) =>
      handleEditSubmit(e, userId);
    document.getElementById("userModal").style.display = "flex";
  } catch (error) {
    console.error("Error loading user data:", error);
    await showAlert("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้", "ข้อผิดพลาด");
  }
}

async function handleEditSubmit(event, userId) {
  event.preventDefault();

  const updates = {
    displayName: document.getElementById("displayName").value,
    role: document.getElementById("role").value,
    status: document.getElementById("status").value,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await firebase.firestore().collection("users").doc(userId).update(updates);
    closeModal();
    await updateUserData();
    await showAlert("อัปเดตข้อมูลผู้ใช้สำเร็จ", "สำเร็จ");
  } catch (error) {
    console.error("Error updating user:", error);
    await showAlert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้", "ข้อผิดพลาด");
  }
}

async function deleteUser(userId) {
  if (confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานนี้?")) {
    try {
      showLoadingOverlay("กำลังลบผู้ใช้งาน...");
      // 1. ลบผู้ใช้จาก Firestore
      await firebase.firestore().collection("users").doc(userId).delete();
      await updateUserData();
      closeLoadingOverlay();
      await showAlert("ลบผู้ใช้งานสำเร็จ", "สำเร็จ");
    } catch (error) {
      console.error("Error deleting user:", error);
      closeLoadingOverlay();
      await showAlert("เกิดข้อผิดพลาด: " + error.message, "ข้อผิดพลาด");
    }
  }
}
// Add event listener
window.addEventListener('userUpdated', async function (e) {
  await updateUserData();
});