// Admin page specific functions
async function checkAdminAccess() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        if (!userData || userData.role !== 'admin') {
            alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
            window.location.href = 'dashboard.html';
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error checking admin access:', error);
        return false;
    }
}

async function loadUsers() {
    try {
        const usersSnapshot = await db.collection('users').get();
        const userTableBody = document.getElementById('userTableBody');
        userTableBody.innerHTML = '';

        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${userData.email}</td>
                <td>${userData.displayName || '-'}</td>
                <td>
                    <span class="status-badge ${userData.isApproved ? 'status-approved' : 'status-pending'}">
                        ${userData.isApproved ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}
                    </span>
                </td>
                <td>${userData.role || 'user'}</td>
                <td class="action-buttons">
                    <button onclick="toggleApproval('${doc.id}', ${!userData.isApproved})" 
                            class="btn ${userData.isApproved ? 'btn-danger' : 'btn-primary'}">
                        ${userData.isApproved ? 'ยกเลิกการอนุมัติ' : 'อนุมัติ'}
                    </button>
                    <button onclick="toggleRole('${doc.id}', '${userData.role}')" 
                            class="btn btn-secondary">
                        ${userData.role === 'admin' ? 'ลดสิทธิ์' : 'เพิ่มสิทธิ์ Admin'}
                    </button>
                </td>
            `;
            userTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    }
}

async function toggleApproval(userId, newStatus) {
    try {
        await db.collection('users').doc(userId).update({
            isApproved: newStatus,
            updatedAt: new Date()
        });
        await loadUsers();
    } catch (error) {
        console.error('Error toggling approval:', error);
        alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
}

async function toggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
        await db.collection('users').doc(userId).update({
            role: newRole,
            updatedAt: new Date()
        });
        await loadUsers();
    } catch (error) {
        console.error('Error toggling role:', error);
        alert('เกิดข้อผิดพลาดในการอัปเดตบทบาท');
    }
}

async function initializeAdmin() {
    const hasAccess = await checkAdminAccess();
    if (hasAccess) {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        await loadUsers();
    }
}

// Initialize admin page
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await initializeAdmin();
    } else {
        window.location.href = 'login.html';
    }
});

function logout() {
    auth.signOut()
        .then(() => window.location.href = 'login.html')
        .catch(error => console.error('Logout error:', error));
}