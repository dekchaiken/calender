let adminPasswordResolve = null;

function showPasswordModal() {
    return new Promise((resolve) => {
        adminPasswordResolve = resolve;
        document.getElementById("passwordModal").style.display = "flex";
        document.getElementById("adminPassword").value = "";
        document.getElementById("passwordForm").onsubmit = handlePasswordSubmit;
    });
}

function closePasswordModal() {
    document.getElementById("passwordModal").style.display = "none";
    if (adminPasswordResolve) {
        adminPasswordResolve(null);
        adminPasswordResolve = null;
    }
}

function handlePasswordSubmit(event) {
    event.preventDefault();
    const password = document.getElementById("adminPassword").value;
    document.getElementById("passwordModal").style.display = "none";
    if (adminPasswordResolve) {
        adminPasswordResolve(password);
        adminPasswordResolve = null;
    }
}

// เพิ่มฟังก์ชันจัดการ Modal
function showAddUserModal() {
    document.getElementById("userModal").style.display = "flex";
    document.getElementById("modalTitle").textContent = "เพิ่มผู้ใช้งานใหม่";
    document.getElementById("userForm").onsubmit = handleUserSubmit; // กำหนดให้เรียก handleUserSubmit
    document.getElementById("userForm").reset();
}

function closeModal() {
    document.getElementById("userModal").style.display = "none";
    document.getElementById("userForm").reset();
}

function showLoadingOverlay(message) {
    document.getElementById("loadingOverlay").style.display = "flex";
    document.getElementById("loadingMessage").textContent = message;
}

function closeLoadingOverlay() {
    document.getElementById("loadingOverlay").style.display = "none";
}

// เพิ่มฟังก์ชันสำหรับแสดงข้อความแจ้งเตือน
function showAlertModal(message) {
    document.getElementById("alertMessage").textContent = message;
    document.getElementById("alertModal").style.display = "flex";
}

function closeAlertModal() {
    document.getElementById("alertModal").style.display = "none";
}

function showLoading(message) {
    document.getElementById("loadingScreen").style.display = "flex";
    document.getElementById("loadingMessage").textContent = message;
}

function hideLoading() {
    document.getElementById("loadingScreen").style.display = "none";
}

// แก้ไขฟังก์ชัน showAlert
async function showAlert(message, title = "แจ้งเตือน") {
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

// แก้ไขฟังก์ชัน handleUserSubmit ให้เป็น async
async function handleUserSubmit(event) {
    event.preventDefault();
  
    const email = document.getElementById("email").value;
    const displayName = document.getElementById("displayName").value;
    const role = document.getElementById("role").value;
    const status = document.getElementById("status").value;
  
    try {
      // เก็บข้อมูล admin user ไว้ก่อน
      const adminUser = firebase.auth().currentUser;
      let adminEmail = adminUser.email;
      let adminPassword;
  
      // ขอรหัสผ่านผ่าน modal
      while (true) {
        adminPassword = await showPasswordModal();
  
        if (!adminPassword) {
          await showAlert("กรุณากรอกรหัสผ่านเพื่อดำเนินการต่อ");
          return;
        }
        showLoadingOverlay("กำลังตรวจสอบรหัสผ่าน Admin...");
        try {
          await firebase.auth().signInWithEmailAndPassword(adminEmail, adminPassword);
          closeLoadingOverlay();
          break;
        } catch (error) {
          closeLoadingOverlay();
          if (error.code === "auth/invalid-credential") {
            await showAlert("รหัสผ่าน Admin ไม่ถูกต้อง กรุณาลองอีกครั้ง", "ข้อผิดพลาด");
            continue;
          } else {
            throw error;
          }
        }
      }
  
      showLoadingOverlay("กำลังเพิ่มผู้ใช้งาน...");
      // สร้าง user ใหม่
      const userCredential = await firebase
        .auth()
        .createUserWithEmailAndPassword(email, Math.random().toString(36).slice(-8));
      const userId = userCredential.user.uid;
  
      // ส่งอีเมลรีเซ็ตรหัสผ่าน
      await firebase.auth().sendPasswordResetEmail(email);
  
      // เพิ่มข้อมูลใน Firestore
      await firebase.firestore().collection("users").doc(userId).set({
        email,
        displayName,
        role,
        status,
        isApproved: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
  
        // Sign in admin กลับ
      await firebase.auth().signInWithEmailAndPassword(adminEmail, adminPassword);
  
      closeModal();
      closeLoadingOverlay();
      await showAlert("เพิ่มผู้ใช้งานสำเร็จ และส่งอีเมลตั้งรหัสผ่านแล้ว", "สำเร็จ");
      // เพิ่มการเรียกฟังก์ชัน updateUserData เพื่ออัปเดตข้อมูล
      window.dispatchEvent(new CustomEvent("userUpdated"));
    } catch (error) {
      console.error("Error adding user:", error);
  
      if (error.code === "auth/wrong-password") {
        await showAlert("รหัสผ่าน admin ไม่ถูกต้อง", "ข้อผิดพลาด");
        // พยายามขอรหัสผ่านใหม่
        const retryPassword = await showPasswordModal();
        if (retryPassword) {
          try {
            await firebase
              .auth()
              .signInWithEmailAndPassword(adminEmail, retryPassword);
          } catch (retryError) {
            await showAlert("ไม่สามารถล็อกอินกลับได้ กรุณาล็อกอินใหม่", "ข้อผิดพลาด");
            window.location.href = "login.html";
          }
        }
        return;
      }
  
      if (error.code === "permission-denied") {
        await showAlert("ไม่มีสิทธิ์ในการเพิ่มผู้ใช้ กรุณาล็อกอินใหม่", "ข้อผิดพลาด");
        await firebase.auth().signOut();
        window.location.href = "login.html";
        return;
      }
  
      await showAlert("เกิดข้อผิดพลาด: " + error.message, "ข้อผิดพลาด");
    }
  }

async function toggleUserApproval(userId, approve) {
    showLoadingOverlay("กำลังดำเนินการ...");
    try {
        await firebase.firestore().collection("users").doc(userId).update({
            isApproved: approve,
        });
        closeLoadingOverlay();
        await window.dispatchEvent(new CustomEvent('userUpdated'));
        await showAlertModal(
            approve ? "อนุมัติผู้ใช้งานสำเร็จ" : "ไม่อนุมัติบัญชีผู้ใช้งาน"
        );
    } catch (error) {
        console.error("Error toggling user approval:", error);
        closeLoadingOverlay();
        await showAlertModal("เกิดข้อผิดพลาดในการดำเนินการ");
    }
}

// Add to admin.js

async function approveUser(userId) {
    try {
        const userRef = firebase.firestore().collection("users").doc(userId);

        await userRef.update({
            isApproved: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        await window.dispatchEvent(new CustomEvent('userUpdated'));
        await showAlert("อนุมัติผู้ใช้งานสำเร็จ", "สำเร็จ");
    } catch (error) {
        console.error("Error approving user:", error);
        await showAlert("เกิดข้อผิดพลาดในการอนุมัติผู้ใช้งาน", "ข้อผิดพลาด");
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
            handleEditSubmit(e, userId); // Set to handleEditSubmit
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
        await window.dispatchEvent(new CustomEvent('userUpdated'));
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
            await window.dispatchEvent(new CustomEvent('userUpdated'));
            closeLoadingOverlay();
            await showAlert("ลบผู้ใช้งานสำเร็จ", "สำเร็จ");
        } catch (error) {
            console.error("Error deleting user:", error);
            closeLoadingOverlay();
            await showAlert("เกิดข้อผิดพลาด: " + error.message, "ข้อผิดพลาด");
        }
    }
}

// แก้ไขฟังก์ชัน checkAdminAccess
async function checkAdminAccess() {
    return new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = "login.html";
                resolve(false);
                return;
            }

            try {
                const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
                const userData = userDoc.data();

                if (!userData || userData.role !== "admin") {
                    await showAlert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้", "ข้อผิดพลาด");
                    window.location.href = "dashboard.html";
                    resolve(false);
                    return;
                }

                document.getElementById("loadingScreen").style.display = "none";
                document.getElementById("mainContent").style.display = "block";
                resolve(true);
            } catch (error) {
                console.error("Error checking admin access:", error);
                resolve(false);
            }
            unsubscribe();
        });
    });
}

document.addEventListener("DOMContentLoaded", checkAdminAccess);

// แก้ไข event listener
document.addEventListener("DOMContentLoaded", async () => {
    const hasAccess = await checkAdminAccess();
    if (hasAccess) {
        document.getElementById("loadingScreen").style.display = "none";
        document.getElementById("mainContent").style.display = "block";
        // ลบ await loadUsers(); ออก
    }
});