// auth.js
const VALID_CREDENTIALS = {
    'warapon.l': 'Passw0rd####',
    'test': 'test'
    // เพิ่มรายชื่อและรหัสผ่านตามต้องการ
};

// เช็คว่ามีการล็อกอินแล้วหรือยัง
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
        showLoginForm();
        return false;
    }
    return true;
}

// แสดงฟอร์มล็อกอิน
function showLoginForm() {
    // ซ่อนเนื้อหาปฏิทินทั้งหมด
    document.querySelector('.container').style.display = 'none';
    
    // สร้างและแสดงฟอร์มล็อกอิน
    const loginForm = document.createElement('div');
    loginForm.innerHTML = `
        <div style="max-width: 300px; margin: 100px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="text-align: center; margin-bottom: 20px;">เข้าสู่ระบบ</h2>
            <div style="margin-bottom: 15px;">
                <input type="text" id="username" placeholder="ชื่อผู้ใช้" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 15px;">
                <input type="password" id="password" placeholder="รหัสผ่าน" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <button onclick="login()" style="width: 100%; padding: 10px; background: var(--primary); border: none; border-radius: 4px; cursor: pointer;">เข้าสู่ระบบ</button>
        </div>
    `;
    document.body.appendChild(loginForm);
}

// ฟังก์ชันล็อกอิน
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (VALID_CREDENTIALS[username] === password) {
        sessionStorage.setItem('isAuthenticated', 'true');
        location.reload();
    } else {
        alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
}

// เพิ่มการตรวจสอบ authentication เมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    initializeSelectors();
    renderCalendar();
});