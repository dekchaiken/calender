// Firebase Authentication Service
const auth = firebase.auth();
const db = firebase.firestore();

// เช็คสถานะการอนุมัติของผู้ใช้
async function checkUserApproval() {
    const user = auth.currentUser;
    if (!user) return false;

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        return userData && userData.isApproved === true;
    } catch (error) {
        console.error('Error checking user approval:', error);
        return false;
    }
}

// เช็คสถานะการล็อกอินและการอนุมัติ
async function checkAuth() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    const userData = userDoc.data();
                    
                    if (userData && userData.isApproved === true) {
                        // บันทึก log การเข้าถึงหน้า
                        await logActivity(user.uid, 'page_access', {
                            page: window.location.pathname,
                            timestamp: new Date()
                        });
                        resolve(true);
                    } else {
                        await auth.signOut();
                        window.location.href = 'login.html?error=not_approved';
                        resolve(false);
                    }
                } catch (error) {
                    console.error('Error checking user approval:', error);
                    window.location.href = 'login.html?error=error_checking';
                    resolve(false);
                }
            } else {
                window.location.href = 'login.html';
                resolve(false);
            }
        });
    });
}

// เช็คสิทธิ์ admin
async function checkAdminAuth() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        if (!userData || userData.role !== 'admin') {
            window.location.href = 'dashboard.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error checking admin auth:', error);
        window.location.href = 'login.html';
        return false;
    }
}

// ฟังก์ชันออกจากระบบ
async function logout() {
    try {
        const userId = auth.currentUser.uid;
        await logActivity(userId, 'logout', {
            timestamp: new Date(),
            browser: navigator.userAgent
        });
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ฟังก์ชันบันทึก Log
async function logActivity(userId, action, details = null) {
    try {
        await db.collection('logs').add({
            userId: userId,
            action: action,
            details: details,
            timestamp: new Date(),
            userAgent: navigator.userAgent,
            ipAddress: window.clientIP || 'unknown'
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

// เพิ่ม Event Listener เพื่อตรวจสอบการเข้าถึงหน้าเว็บ
document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname !== '/login.html') {
        await checkAuth();
    }
});

// ส่งออกฟังก์ชันเพื่อใช้งานในไฟล์อื่น
window.checkAuth = checkAuth;
window.checkAdminAuth = checkAdminAuth;
window.logout = logout;
window.logActivity = logActivity;