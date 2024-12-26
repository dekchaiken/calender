// เพิ่มฟังก์ชันจัดการ Modal
function showAddUserModal() {
    document.getElementById('userModal').style.display = 'flex';
    document.getElementById('modalTitle').textContent = 'เพิ่มผู้ใช้งานใหม่';
    document.getElementById('userForm').reset();
}

function closeModal() {
    document.getElementById('userModal').style.display = 'none';
}

async function handleUserSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const displayName = document.getElementById('displayName').value;
    const role = document.getElementById('role').value;
    const status = document.getElementById('status').value;

    try {
        // ตรวจสอบว่ามีอีเมลนี้ในระบบหรือไม่
        const userSnapshot = await db.collection('users')
            .where('email', '==', email)
            .get();

        if (!userSnapshot.empty) {
            throw new Error('อีเมลนี้มีในระบบแล้ว');
        }

        // สร้างข้อมูลใหม่ด้วย ID ที่ไม่ซ้ำกัน
        await db.collection('users').add({
            email,
            displayName,
            role,
            status,
            isApproved: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        closeModal();
        await loadUsers();
        alert('เพิ่มผู้ใช้งานสำเร็จ');
    } catch (error) {
        console.error('Error adding user:', error);
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
}

// อัปเดตฟังก์ชัน loadUsers
async function loadUsers() {
    try {
        const usersSnapshot = await db.collection('users').get();
        const userTableBody = document.getElementById('userTableBody');
        userTableBody.innerHTML = '';

        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const row = document.createElement('tr');
            
            let statusDisplay = '';
            let actionButtons = '';
            
            // กำหนดการแสดงสถานะ
            if (userData.isApproved === false) {
                statusDisplay = '<span class="status-badge status-pending">รอการอนุมัติ</span>';
                actionButtons = `
                    <button onclick="approveUser('${doc.id}')" class="action-btn edit-btn">อนุมัติ</button>
                    <button onclick="deleteUser('${doc.id}')" class="action-btn delete-btn">ลบ</button>
                `;
            } else {
                statusDisplay = '<span class="status-badge status-active">อนุมัติแล้ว</span>';
                actionButtons = `
                    <button onclick="editUser('${doc.id}')" class="action-btn edit-btn">แก้ไข</button>
                    <button onclick="deleteUser('${doc.id}')" class="action-btn delete-btn">ลบ</button>
                `;
            }

            row.innerHTML = `
                <td>${userData.email || ''}</td>
                <td>${userData.displayName || ''}</td>
                <td>${userData.role || 'user'}</td>
                <td>${statusDisplay}</td>
                <td>${actionButtons}</td>
            `;
            userTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        alert('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
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

// Update loadUsers function
async function loadUsers() {
    try {
        const usersSnapshot = await db.collection('users').get();
        const userTableBody = document.getElementById('userTableBody');
        userTableBody.innerHTML = '';

        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            console.log('User data:', doc.id, userData); // เพิ่ม log เพื่อดูข้อมูล
            
            const row = document.createElement('tr');
            const isApproved = userData.isApproved === true;
            
            row.innerHTML = `
                <td>${userData.email || ''}</td>
                <td>${userData.displayName || ''}</td>
                <td>${userData.role || 'user'}</td>
                <td>${isApproved ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}</td>
                <td>
                    ${!isApproved ? 
                        `<button onclick="approveUser('${doc.id}')" class="action-btn edit-btn">อนุมัติ</button>` : 
                        `<button onclick="editUser('${doc.id}')" class="action-btn edit-btn">แก้ไข</button>`
                    }
                    <button onclick="deleteUser('${doc.id}')" class="action-btn delete-btn">ลบ</button>
                </td>
            `;
            userTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error in loadUsers:', error);
        alert('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    }
}

async function editUser(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        document.getElementById('email').value = userData.email;
        document.getElementById('displayName').value = userData.displayName || '';
        document.getElementById('role').value = userData.role || 'user';
        document.getElementById('status').value = userData.status || 'active';
        
        document.getElementById('modalTitle').textContent = 'แก้ไขผู้ใช้งาน';
        document.getElementById('userForm').onsubmit = (e) => handleEditSubmit(e, userId);
        document.getElementById('userModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    }
}

// เพิ่มฟังก์ชันอนุมัติผู้ใช้
async function approveUser(userId) {
    try {
        const userRef = db.collection('users').doc(userId);
        
        await userRef.update({
            isApproved: true,
            status: 'active',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await loadUsers();
        alert('อนุมัติผู้ใช้งานสำเร็จ');
    } catch (error) {
        console.error('Error in approveUser:', error);
        alert(`เกิดข้อผิดพลาดในการอนุมัติผู้ใช้งาน: ${error.message}`);
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
        await db.collection('users').doc(userId).update(updates);
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
            await db.collection('users').doc(userId).delete();
            await loadUsers();
            alert('ลบผู้ใช้งานสำเร็จ');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('เกิดข้อผิดพลาดในการลบผู้ใช้งาน');
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

                resolve(true);
            } catch (error) {
                console.error('Error checking admin access:', error);
                resolve(false);
            }
            unsubscribe();
        });
    });
}

// แก้ไข event listener
document.addEventListener('DOMContentLoaded', async () => {
    const hasAccess = await checkAdminAccess();
    if (hasAccess) {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        await loadUsers();
    }
});

async function handleUserSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const displayName = document.getElementById('displayName').value;
    const role = document.getElementById('role').value;
    const status = document.getElementById('status').value;

    try {
        // สร้าง user ใน Firestore ก่อน
        const userRef = db.collection('users').doc();
        await userRef.set({
            email,
            displayName,
            role,
            status,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        closeModal();
        await loadUsers();
        alert('เพิ่มผู้ใช้งานสำเร็จ');
    } catch (error) {
        console.error('Error adding user:', error);
        
        if (error.code === 'permission-denied') {
            alert('ไม่มีสิทธิ์ในการเพิ่มผู้ใช้ กรุณาล็อกอินใหม่');
            await auth.signOut();
            window.location.href = 'login.html';
            return;
        }
        
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
}

// ปรับปรุงฟังก์ชัน deleteUser
async function deleteUser(userId) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานนี้?')) {
        try {
            await db.collection('users').doc(userId).delete();
            await loadUsers();
            alert('ลบผู้ใช้งานสำเร็จ');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        }
    }
}