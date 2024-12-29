let adminPasswordResolve = null;

function showPasswordModal() {
    return new Promise((resolve) => {
        adminPasswordResolve = resolve;
        document.getElementById('passwordModal').style.display = 'flex';
        document.getElementById('adminPassword').value = '';
        document.getElementById('passwordForm').onsubmit = handlePasswordSubmit;
    });
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    if (adminPasswordResolve) {
        adminPasswordResolve(null);
        adminPasswordResolve = null;
    }
}

function handlePasswordSubmit(event) {
    event.preventDefault();
    const password = document.getElementById('adminPassword').value;
    document.getElementById('passwordModal').style.display = 'none';
    if (adminPasswordResolve) {
        adminPasswordResolve(password);
        adminPasswordResolve = null;
    }
}

// เพิ่มฟังก์ชันจัดการ Modal
function showAddUserModal() {
    document.getElementById('userModal').style.display = 'flex';
    document.getElementById('modalTitle').textContent = 'เพิ่มผู้ใช้งานใหม่';
    document.getElementById('userForm').onsubmit = handleUserSubmit; // กำหนดให้เรียก handleUserSubmit
    document.getElementById('userForm').reset();
}


function closeModal() {
    document.getElementById('userModal').style.display = 'none';
    document.getElementById('userForm').reset();
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


function showLoading(message) {
 document.getElementById('loadingScreen').style.display = 'flex';
 document.getElementById('loadingMessage').textContent = message;
}

function hideLoading() {
    document.getElementById('loadingScreen').style.display = 'none';
}

 async function showAlert(message) {
    document.getElementById('alertMessage').textContent = message;
    document.getElementById('alertModal').style.display = 'flex';

    return new Promise(resolve => {
        document.getElementById('alertModal').onclick = () => {
        document.getElementById('alertModal').style.display = 'none';
        resolve();
    };
  });
 }

 async function handleUserSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const displayName = document.getElementById('displayName').value;
    const role = document.getElementById('role').value;
    const status = document.getElementById('status').value;

    try {
        
        // เก็บข้อมูล admin user ไว้ก่อน
        const adminUser = firebase.auth().currentUser;
        const adminEmail = adminUser.email;
        
        // ขอรหัสผ่านผ่าน modal
        const adminPassword = await showPasswordModal();
        
        if (!adminPassword) {
            alert('กรุณากรอกรหัสผ่านเพื่อดำเนินการต่อ');
            return;
        }

        showLoadingOverlay('กำลังเพิ่มผู้ใช้งาน...');
        // สร้าง user ใหม่
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, Math.random().toString(36).slice(-8));
        const userId = userCredential.user.uid;

         // เพิ่มฟังก์ชันสำหรับบันทึก Log เมื่อเพิ่มผู้ใช้
         await logActivity(userId, 'add_user', { addedUserEmail: email, addedUserName: displayName, role: role, status: status });
        // ส่งอีเมลรีเซ็ตรหัสผ่าน
        await firebase.auth().sendPasswordResetEmail(email);

        // เพิ่มข้อมูลใน Firestore
        await firebase.firestore().collection('users').doc(userId).set({
            email,
            displayName,
            role,
            status,
            isApproved: false, // เพิ่มบรรทัดนี้
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        
        });

        // ล็อกอินกลับเข้าไปด้วยบัญชี admin
        await firebase.auth().signInWithEmailAndPassword(adminEmail, adminPassword);

        closeModal();
        await loadUsers();
        closeLoadingOverlay();
        await showAlertModal('เพิ่มผู้ใช้งานสำเร็จ และส่งอีเมลตั้งรหัสผ่านแล้ว');

    } catch (error) {
        console.error('Error adding user:', error);
        
        if (error.code === 'auth/wrong-password') {
            alert('รหัสผ่าน admin ไม่ถูกต้อง');
            // พยายามขอรหัสผ่านใหม่
            const retryPassword = await showPasswordModal();
            if (retryPassword) {
                try {
                    await firebase.auth().signInWithEmailAndPassword(adminEmail, retryPassword);
                } catch (retryError) {
                    alert('ไม่สามารถล็อกอินกลับได้ กรุณาล็อกอินใหม่');
                    window.location.href = 'login.html';
                }
            }
            return;
        }
        await showAlertModal('เกิดข้อผิดพลาด: ' + error.message);
        
        if (error.code === 'permission-denied') {
            alert('ไม่มีสิทธิ์ในการเพิ่มผู้ใช้ กรุณาล็อกอินใหม่');
            await firebase.auth().signOut();
            window.location.href = 'login.html';
            return;
        }
        
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
   await showAlertModal('เกิดข้อผิดพลาด: ' + error.message);
}



// อัปเดตฟังก์ชัน loadUsers
async function loadUsers() {
    try {
        showLoading('กำลังโหลดข้อมูลผู้ใช้...');
        const usersSnapshot = await firebase.firestore().collection('users').get();
        const userTableBody = document.getElementById('userTableBody');
        userTableBody.innerHTML = '';

        usersSnapshot.forEach(doc => {
            const userData = doc.data();
                 const row = document.createElement('tr');
                 row.innerHTML = `
                      <td>${userData.email}</td>
                      <td>${userData.displayName}</td>
                      <td>${userData.role || 'user'}</td>
                      <td><span class="status-badge status-${userData.status}">${userData.status}</span></td>
                      <td>
                          ${userData.isApproved === true ? 
                              '<span class="status-badge status-active">อนุมัติ</span>' : 
                              '<span class="status-badge status-pending">รออนุมัติ</span>'}
                      </td>
                      <td>
                          <button onclick="editUser('${doc.id}')" class="action-btn edit-btn">แก้ไข</button>
                          <button onclick="deleteUser('${doc.id}')" class="action-btn delete-btn">ลบ</button>
                          ${userData.isApproved === true ? 
                              `<button onclick="toggleUserApproval('${doc.id}', false)" class="action-btn delete-btn" style="margin-left: 0.5rem;">ไม่อนุมัติ</button>` : 
                              `<button onclick="toggleUserApproval('${doc.id}', true)" class="action-btn edit-btn" style="margin-left: 0.5rem;">อนุมัติ</button>`
                           }
                      </td>
                  `;
                  userTableBody.appendChild(row);
         });
         hideLoading();
    } catch (error) {
        console.error('Error loading users:', error);
        hideLoading();
        await showAlert('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    }
}

async function toggleUserApproval(userId, approve) {
    showLoadingOverlay("กำลังดำเนินการ...");
    try {
        await firebase.firestore().collection('users').doc(userId).update({
            isApproved: approve,
        });
        closeLoadingOverlay();
        loadUsers();
        showAlertModal(approve ? 'อนุมัติผู้ใช้งานสำเร็จ' : 'ไม่อนุมัติบัญชีผู้ใช้งาน');

   } catch (error) {
        console.error('Error toggling user approval:', error);
         closeLoadingOverlay();
         showAlertModal('เกิดข้อผิดพลาดในการดำเนินการ');
    }
}

// Add to admin.js

async function approveUser(userId) {
    try {
        const userRef = db.collection('users').doc(userId);
        
        await userRef.update({
            isApproved: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await loadUsers();
        alert('อนุมัติผู้ใช้งานสำเร็จ');
    } catch (error) {
        console.error('Error approving user:', error);
        alert('เกิดข้อผิดพลาดในการอนุมัติผู้ใช้งาน');
    }
}

async function editUser(userId) {
    try {
        const userDoc = await firebase.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();

        document.getElementById('email').value = userData.email;
        document.getElementById('displayName').value = userData.displayName || '';
        document.getElementById('role').value = userData.role || 'user';
        document.getElementById('status').value = userData.status || 'active';

        document.getElementById('modalTitle').textContent = 'แก้ไขผู้ใช้งาน';
        document.getElementById('userForm').onsubmit = (e) => handleEditSubmit(e, userId); // Set to handleEditSubmit
        document.getElementById('userModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    }
}

// เพิ่มฟังก์ชันอนุมัติผู้ใช้
async function approveUser(userId) {
    try {
        await firebase.firestore().collection('users').doc(userId).update({
            isApproved: true,
            status: 'active',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await loadUsers();
        alert('อนุมัติผู้ใช้งานสำเร็จ');
    } catch (error) {
        console.error('Error approving user:', error);
        alert('เกิดข้อผิดพลาดในการอนุมัติผู้ใช้งาน: ' + error.message);
    }
}

async function handleEditSubmit(event, userId) {
    event.preventDefault();

    const updates = {
        displayName: document.getElementById('displayName').value,
        role: document.getElementById('role').value,
        status: document.getElementById('status').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await firebase.firestore().collection('users').doc(userId).update(updates);
        closeModal();
        await loadUsers();
        alert('อัปเดตข้อมูลผู้ใช้สำเร็จ');
    } catch (error) {
        console.error('Error updating user:', error);
        alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้');
    }
}

async function deleteUser(userId) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานนี้?')) {
        try {
            showLoading('กำลังลบผู้ใช้งาน...');
            // 1. ลบผู้ใช้จาก Firestore
            await firebase.firestore().collection('users').doc(userId).delete();
            // 2. ลบผู้ใช้จาก Authentication
            const user = await firebase.auth().getUser(userId)
            await logActivity(firebase.auth().currentUser.uid, 'delete_user', { deletedUser: userData.email || userData.displayName || userId});
            if (user) {
                await firebase.auth().deleteUser(userId);
            }
            await loadUsers();
            hideLoading();
            await showAlert('ลบผู้ใช้งานสำเร็จ');
        } catch (error) {
            console.error('Error deleting user:', error);
            hideLoading();
            await showAlert('เกิดข้อผิดพลาด: ' + error.message);
        }
    }
}

// แก้ไขฟังก์ชัน checkAdminAccess
async function checkAdminAccess() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'login.html';
                resolve(false);
                return;
            }

            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();

                if (!userData || userData.role !== 'admin') {
                    alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
                    window.location.href = 'dashboard.html';
                    resolve(false);
                    return;
                }

                document.getElementById('loadingScreen').style.display = 'none';
                document.getElementById('mainContent').style.display = 'block';
                resolve(true);
            } catch (error) {
                console.error('Error checking admin access:', error);
                resolve(false);
            }
            unsubscribe();
        });
    });
}

document.addEventListener('DOMContentLoaded', checkAdminAccess);

// แก้ไข event listener
document.addEventListener('DOMContentLoaded', async () => {
    const hasAccess = await checkAdminAccess();
    if (hasAccess) {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        // ลบ await loadUsers(); ออก
    }
});

// async function handleUserSubmit(event) {
//     event.preventDefault();
    
//     const email = document.getElementById('email').value;
//     const displayName = document.getElementById('displayName').value;
//     const role = document.getElementById('role').value;
//     const status = document.getElementById('status').value;

//     try {
//         // สร้าง user ใน Firestore ก่อน
//         const userRef = db.collection('users').doc();
//         await userRef.set({
//             email,
//             displayName,
//             role,
//             status,
//             createdAt: firebase.firestore.FieldValue.serverTimestamp(),
//             updatedAt: firebase.firestore.FieldValue.serverTimestamp()
//         }, { merge: true });

//         closeModal();
//         await loadUsers();
//         alert('เพิ่มผู้ใช้งานสำเร็จ');
//     } catch (error) {
//         console.error('Error adding user:', error);
        
//         if (error.code === 'permission-denied') {
//             alert('ไม่มีสิทธิ์ในการเพิ่มผู้ใช้ กรุณาล็อกอินใหม่');
//             await auth.signOut();
//             window.location.href = 'login.html';
//             return;
//         }
        
//         alert('เกิดข้อผิดพลาด: ' + error.message);
//     }
// }
