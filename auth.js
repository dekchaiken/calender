// auth.js
const firebaseConfig = {
    apiKey: "AIzaSyAcb9q1eX1QM9Gl_W6U9WZNbeg6M-uyhpk",
    authDomain: "cyfencedevbyken.firebaseapp.com",
    projectId: "cyfencedevbyken",
    storageBucket: "cyfencedevbyken.firebasestorage.app",
    messagingSenderId: "632813871756",
    appId: "1:632813871756:web:57d674643f258ddd2e11a9",
    measurementId: "G-1EJNKSHNQ3"
  };

// เริ่มต้นใช้งาน Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    if (container) {
        container.style.display = 'none';
    }
    checkAuth();
});

// ฟังก์ชันตรวจสอบสถานะการล็อกอิน
function checkAuth() {
    auth.onAuthStateChanged((user) => {
        const container = document.querySelector('.container');
        if (user) {
            // ถ้าล็อกอินแล้ว
            sessionStorage.setItem('isAuthenticated', 'true');
            if (container) {
                container.style.display = 'block';
            }
            const loginForm = document.querySelector('#login-form');
            if (loginForm) {
                loginForm.remove();
            }
            // เริ่มการทำงานของปฏิทิน
            if (typeof initializeSelectors === 'function') {
                initializeSelectors();
            }
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }
        } else {
            // ถ้ายังไม่ได้ล็อกอิน
            sessionStorage.removeItem('isAuthenticated');
            if (container) {
                container.style.display = 'none';
            }
            showLoginForm();
        }
    });
}

// ฟังก์ชันแสดงฟอร์มล็อกอิน
function showLoginForm() {
    // ลบฟอร์มเก่าถ้ามี
    const oldForm = document.querySelector('#login-form');
    if (oldForm) {
        oldForm.remove();
    }
    
    const loginForm = document.createElement('div');
    loginForm.id = 'login-form';
    loginForm.innerHTML = `
        <div style="max-width: 300px; margin: 100px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="text-align: center; margin-bottom: 20px;">เข้าสู่ระบบ</h2>
            <div style="margin-bottom: 15px;">
                <input type="email" id="email" placeholder="อีเมล" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
                <input type="password" id="password" placeholder="รหัสผ่าน" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <button onclick="login()" style="width: 100%; padding: 10px; background: var(--primary); border: none; border-radius: 4px; color: white; cursor: pointer; margin-bottom: 10px;">เข้าสู่ระบบ</button>
            <button onclick="showRegisterForm()" style="width: 100%; padding: 10px; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer;">สมัครสมาชิก</button>
        </div>
    `;
    document.body.appendChild(loginForm);
}

// ฟังก์ชันสำหรับล็อกอิน
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        // เก็บ log การเข้าสู่ระบบ
        await saveLoginLog(userCredential.user.email);
    } catch (error) {
        alert('เข้าสู่ระบบไม่สำเร็จ: ' + error.message);
    }
}

// ฟังก์ชันสำหรับสมัครสมาชิก
async function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert('รหัสผ่านไม่ตรงกัน');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        // เก็บข้อมูลผู้ใช้เพิ่มเติมใน Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'user'
        });
        alert('สมัครสมาชิกสำเร็จ');
        showLoginForm(); // กลับไปที่หน้าล็อกอิน
    } catch (error) {
        alert('สมัครสมาชิกไม่สำเร็จ: ' + error.message);
    }
}

// ฟังก์ชันเก็บ log การเข้าสู่ระบบ
async function saveLoginLog(userEmail) {
    try {
        await db.collection('logs').add({
            type: 'login',
            userEmail: userEmail,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error('Error saving log:', error);
    }
}

// ฟังก์ชันแสดงฟอร์มล็อกอิน
function showLoginForm() {
    document.querySelector('.container').style.display = 'none';
    
    const loginForm = document.createElement('div');
    loginForm.innerHTML = `
        <div style="max-width: 300px; margin: 100px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="text-align: center; margin-bottom: 20px;">เข้าสู่ระบบ</h2>
            <div style="margin-bottom: 15px;">
                <input type="email" id="email" placeholder="อีเมล" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
                <input type="password" id="password" placeholder="รหัสผ่าน" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <button onclick="login()" style="width: 100%; padding: 10px; background: var(--primary); border: none; border-radius: 4px; color: white; cursor: pointer; margin-bottom: 10px;">เข้าสู่ระบบ</button>
            <button onclick="showRegisterForm()" style="width: 100%; padding: 10px; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer;">สมัครสมาชิก</button>
        </div>
    `;
    document.body.appendChild(loginForm);
}

// ฟังก์ชันแสดงฟอร์มสมัครสมาชิก
function showRegisterForm() {
    const registerForm = document.createElement('div');
    registerForm.innerHTML = `
        <div style="max-width: 300px; margin: 100px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="text-align: center; margin-bottom: 20px;">สมัครสมาชิก</h2>
            <div style="margin-bottom: 15px;">
                <input type="email" id="register-email" placeholder="อีเมล" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
                <input type="password" id="register-password" placeholder="รหัสผ่าน" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
                <input type="password" id="confirm-password" placeholder="ยืนยันรหัสผ่าน" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <button onclick="register()" style="width: 100%; padding: 10px; background: var(--primary); border: none; border-radius: 4px; color: white; cursor: pointer; margin-bottom: 10px;">สมัครสมาชิก</button>
            <button onclick="showLoginForm()" style="width: 100%; padding: 10px; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer;">กลับไปหน้าเข้าสู่ระบบ</button>
        </div>
    `;
    document.querySelector('div').remove(); // ลบฟอร์มล็อกอินเดิม
    document.body.appendChild(registerForm);
}

// ตรวจสอบสถานะการล็อกอิน
function checkAuth() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                sessionStorage.setItem('isAuthenticated', 'true');
                resolve(true);
            } else {
                sessionStorage.removeItem('isAuthenticated');
                showLoginForm();
                resolve(false);
            }
        });
    });
}

// เพิ่ม event listener เมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', async () => {
    if (await checkAuth()) {
        initializeSelectors();
        renderCalendar();
    }
});