const auth = firebase.auth();
const db = firebase.firestore();

function redirectToLogin(error = '') {
    const errorParam = error ? `?error=${encodeURIComponent(error)}` : '';
    window.location.href = `login.html${errorParam}`;
}

async function checkUserApproval() {
    const user = auth.currentUser;
    if (!user) {
        alert('No user found');
        return false;
    }

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        // ถ้าไม่พบข้อมูลผู้ใช้ ให้สร้างใหม่
        if (!userDoc.exists) {
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: "Ken", // หรือชื่อที่ต้องการ
                createdAt: new Date(),
                updatedAt: new Date(),
                isApproved: true,
                role: "admin"
            });
            
            // ดึงข้อมูลใหม่อีกครั้ง
            return true;
        }
        
        const userData = userDoc.data();
        return userData && (userData.isApproved === true || userData.role === 'admin');
    } catch (error) {
        alert('Error: ' + error.message);
        return false;
    }
}

auth.onAuthStateChanged(async (user) => {
    console.log('Auth state changed:', user);

    if (!user) {
        console.log('No user logged in');
        redirectToLogin('กรุณาเข้าสู่ระบบ');
        return;
    }

    try {
        console.log('Checking user approval for:', user.uid);
        const isApproved = await checkUserApproval();
        console.log('User approval status:', isApproved);

        if (!isApproved) {
            console.log('User not approved, logging out');
            await auth.signOut();
            redirectToLogin('บัญชีของคุณยังไม่ได้รับการอนุมัติ');
            return;
        }

        console.log('User approved, showing main content');
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    } catch (error) {
        console.error('Auth check error:', error);
        redirectToLogin('เกิดข้อผิดพลาดในการตรวจสอบสถานะ');
    }
});

// Initial auth check
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        redirectToLogin('กรุณาเข้าสู่ระบบ');
        return;
    }

    try {
        const isApproved = await checkUserApproval();
        if (!isApproved) {
            await auth.signOut();
            redirectToLogin('บัญชีของคุณยังไม่ได้รับการอนุมัติ');
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
        redirectToLogin('เกิดข้อผิดพลาดในการตรวจสอบสถานะ');
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