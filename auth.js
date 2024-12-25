const auth = firebase.auth();
const db = firebase.firestore();

function redirectToLogin(error = '') {
    if (error) {
        alert(error);  // เพิ่ม alert เพื่อแสดงข้อความแจ้งเตือน
    }
    window.location.href = 'login.html';  // ลบ error parameter ออกจาก URL
}

async function checkUserApproval() {
    const user = auth.currentUser;
    if (!user) return false;

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName || "",
                createdAt: new Date(),
                updatedAt: new Date(),
                isApproved: false,
                role: "user"
            });
            return false;
        }
        
        const userData = userDoc.data();
        return userData?.isApproved === true;
    } catch (error) {
        console.error('User approval check error:', error);
        return false;
    }
}

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const isApproved = await checkUserApproval();
        
        if (!isApproved) {
            await auth.signOut();
            alert('บัญชีของคุณยังไม่ได้รับการอนุมัติ');
            window.location.href = 'login.html';
            return;
        }

        // Show main content
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
        // Add logout button if not exists
        if (!document.querySelector('.logout-btn')) {
            const header = document.querySelector('.header');
            if (header) {
                const logoutBtn = document.createElement('button');
                logoutBtn.innerHTML = 'ออกจากระบบ';
                logoutBtn.className = 'logout-btn';
                logoutBtn.onclick = logout;
                header.appendChild(logoutBtn);
            }
        }

        // Log successful access
        await logActivity(user.uid, 'page_access', window.location.pathname);
    } catch (error) {
        console.error('Auth check error:', error);
        alert('เกิดข้อผิดพลาดในการตรวจสอบสถานะ');
        window.location.href = 'login.html';
    }
});

// Logout function
async function logout() {
    try {
        const user = auth.currentUser;
        if (user) {
            await logActivity(user.uid, 'logout');
            await auth.signOut();
        }
        redirectToLogin('ออกจากระบบสำเร็จ');
    } catch (error) {
        console.error('Logout error:', error);
        alert('เกิดข้อผิดพลาดในการออกจากระบบ กรุณาลองใหม่อีกครั้ง');
    }
}

// Activity logging
async function logActivity(userId, action, details = null) {
    try {
        await db.collection('logs').add({
            userId: userId,
            action: action,
            details: details,
            timestamp: new Date(),
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

async function displayUserInfo() {
    const user = firebase.auth().currentUser;
    if (user) {
        try {
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            const userInfoElement = document.getElementById('userInfo');
            if (userInfoElement && userData) {
                userInfoElement.textContent = `ผู้ใช้งาน: ${userData.displayName || user.email}`;
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }
}

// Periodic auth check (every 5 minutes)
setInterval(async () => {
    const user = auth.currentUser;
    if (user) {
        const isApproved = await checkUserApproval();
        if (!isApproved) {
            logout();
        }
    }
}, 300000);