// Firebase Authentication Service
const auth = firebase.auth();
const db = firebase.firestore();

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

// เช็คสถานะการล็อกอิน
function checkAuth() {
    return new Promise(async (resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                const isApproved = await checkUserApproval();
                if (isApproved) {
                    logActivity(user.uid, 'page_access', window.location.pathname);
                    resolve(true);
                } else {
                    auth.signOut();
                    window.location.href = 'login.html?error=not_approved';
                    resolve(false);
                }
            } else {
                window.location.href = 'login.html';
                resolve(false);
            }
        });
    });
}

// ฟังก์ชันออกจากระบบ
function logout() {
    const userId = auth.currentUser.uid;
    logActivity(userId, 'logout')
        .then(() => {
            return auth.signOut();
        })
        .then(() => {
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error('Logout error:', error);
        });
}

// ฟังก์ชันบันทึก Log
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

// เพิ่มปุ่มออกจากระบบในหน้า index.html
document.addEventListener('DOMContentLoaded', async () => {
    if (await checkAuth()) {
        // เพิ่มปุ่ม logout ในส่วน header
        const header = document.querySelector('.header');
        const logoutBtn = document.createElement('button');
        logoutBtn.innerHTML = 'ออกจากระบบ';
        logoutBtn.className = 'logout-btn';
        logoutBtn.onclick = logout;
        header.appendChild(logoutBtn);
    }
});