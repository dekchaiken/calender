// auth.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyAcb9q1eX1QM9Gl_W6U9WZNbeg6M-uyhpk",
    authDomain: "cyfencedevbyken.firebaseapp.com",
    projectId: "cyfencedevbyken",
    storageBucket: "cyfencedevbyken.firebasestorage.app",
    messagingSenderId: "632813871756",
    appId: "1:632813871756:web:57d674643f258ddd2e11a9",
    measurementId: "G-1EJNKSHNQ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ฟังก์ชันสมัครสมาชิก
export async function registerUser(email, password, displayName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // บันทึกข้อมูลผู้ใช้เพิ่มเติมใน Firestore
        await addDoc(collection(db, 'users'), {
            uid: user.uid,
            email: email,
            displayName: displayName,
            role: 'user',
            createdAt: serverTimestamp()
        });

        // บันทึก log
        await addDoc(collection(db, 'logs'), {
            action: 'register',
            userId: user.uid,
            email: email,
            timestamp: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// ฟังก์ชันเข้าสู่ระบบ
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ตรวจสอบว่าเป็น admin หรือไม่
        const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
        const userDocs = await getDocs(userQuery);
        const userData = userDocs.docs[0].data();

        // บันทึก log
        await addDoc(collection(db, 'logs'), {
            action: 'login',
            userId: user.uid,
            email: email,
            timestamp: serverTimestamp()
        });

        return { 
            success: true,
            isAdmin: userData.role === 'admin'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// ฟังก์ชันออกจากระบบ
export async function logoutUser() {
    try {
        const user = auth.currentUser;
        if (user) {
            // บันทึก log
            await addDoc(collection(db, 'logs'), {
                action: 'logout',
                userId: user.uid,
                email: user.email,
                timestamp: serverTimestamp()
            });
        }
        
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// ตรวจสอบสถานะการล็อกอิน
export function checkAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}

// เช็คว่าผู้ใช้เป็น admin หรือไม่
export async function checkIsAdmin(uid) {
    try {
        const userQuery = query(collection(db, 'users'), where('uid', '==', uid));
        const userDocs = await getDocs(userQuery);
        if (!userDocs.empty) {
            const userData = userDocs.docs[0].data();
            return userData.role === 'admin';
        }
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}