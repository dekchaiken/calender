// auth.js
// เพิ่ม Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore,
    collection,
    addDoc,
    setDoc,
    doc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// กำหนดค่า Firebase (แทนที่ด้วยค่าจริงจาก Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyAcb9q1eX1QM9Gl_W6U9WZNbeg6M-uyhpk",
    authDomain: "cyfencedevbyken.firebaseapp.com",
    projectId: "cyfencedevbyken",
    storageBucket: "cyfencedevbyken.firebasestorage.app",
    messagingSenderId: "632813871756",
    appId: "1:632813871756:web:57d674643f258ddd2e11a9",
    measurementId: "G-1EJNKSHNQ3"
  };

// เริ่มต้น Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ตรวจสอบสถานะการล็อกอิน
onAuthStateChanged(auth, (user) => {
    if (user) {
        // ผู้ใช้ล็อกอินแล้ว
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('register.html')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // ยังไม่ได้ล็อกอิน
        if (window.location.pathname.includes('dashboard.html')|| 
            window.location.pathname.includes('admin-panel.html')) {
            window.location.href = 'login.html';
        }
    }
});

// ฟังก์ชันล็อกอิน
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // บันทึกประวัติการล็อกอิน
        await addDoc(collection(db, 'logs'), {
            userId: userCredential.user.uid,
            email: email,
            action: 'login',
            timestamp: serverTimestamp()
        });
        window.location.href = 'dashboard.html';
    } catch (error) {
        document.getElementById('error-message').textContent = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    }
}

// ฟังก์ชันลงทะเบียน
async function handleRegister(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const displayName = document.getElementById('displayName').value;

    if (password !== confirmPassword) {
        document.getElementById('message').textContent = 'รหัสผ่านไม่ตรงกัน';
        document.getElementById('message').className = 'error-message';
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // สร้างข้อมูลผู้ใช้
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            displayName: displayName,
            email: email,
            role: 'user',
            createdAt: serverTimestamp()
        });
        // บันทึกประวัติการลงทะเบียน
        await addDoc(collection(db, 'logs'), {
            userId: userCredential.user.uid,
            email: email,
            action: 'register',
            timestamp: serverTimestamp()
        });
        window.location.href = 'dashboard.html';
    } catch (error) {
        document.getElementById('message').textContent = 'เกิดข้อผิดพลาดในการลงทะเบียน';
        document.getElementById('message').className = 'error-message';
    }
}

// ฟังก์ชันล็อกเอาท์
async function logout() {
    try {
        const user = auth.currentUser;
        if (user) {
            await addDoc(collection(db, 'logs'), {
                userId: user.uid,
                email: user.email,
                action: 'logout',
                timestamp: serverTimestamp()
            });
        }
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการออกจากระบบ:', error);
    }
}

// ส่งออกฟังก์ชัน
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;