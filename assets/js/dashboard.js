// Firebase initialization (ย้ายไป firebase-config.js แล้ว)

function showPageTransition() {
    const transition = document.getElementById('pageTransition');
    transition.style.transform = 'scaleX(1)';
    setTimeout(() => {
        transition.style.transform = 'scaleX(0)';
    }, 500);
}
document.querySelectorAll('.menu-card').forEach(card => {
    card.addEventListener('click', (e) => {
        e.preventDefault();
        const href = card.getAttribute('onclick').match(/'([^']+)'/)[1];
        showPageTransition();
        setTimeout(() => {
            window.location.href = href;
        }, 300);
    });
});
// Create skeleton loading effect
function createSkeletons() {
    const container = document.getElementById('postSkeletons');
    container.innerHTML = Array(3).fill('').map(() => `
        <div class="post-skeleton">
            <div class="skeleton post-skeleton-title"></div>
            <div class="skeleton post-skeleton-meta"></div>
            <div class="skeleton post-skeleton-content"></div>
        </div>
    `).join('');
}

async function displaySystemAnnouncements() {
const container = document.getElementById('systemAnnouncements');
try {
const snapshot = await firebase.firestore()
    .collection('systemAnnouncements')
    .orderBy('date', 'desc')
    .limit(5)  // แสดง 5 ประกาศล่าสุด
    .get();

container.innerHTML = '';

snapshot.forEach(doc => {
    const announcement = doc.data();
    container.innerHTML += `
        <div class="system-announcement">
            <div class="system-announcement-header">
                <span class="system-announcement-badge">${announcement.type}</span>
                <strong>${announcement.title}</strong>
            </div>
            <p>${announcement.content}</p>
            <small>ประกาศเมื่อ: ${new Date(announcement.date).toLocaleDateString('th-TH')}</small>
        </div>
    `;
});

} catch (error) {
console.error('Error fetching announcements:', error);
container.innerHTML = '<p>ไม่สามารถโหลดประกาศได้</p>';
}
}

// เพิ่มฟังก์ชันสำหรับแสดงโพสต์
async function loadPosts() {
    const postsContainer = document.getElementById('posts-container');
    const currentUser = firebase.auth().currentUser;

    createSkeletons();

    try {
        // Display system announcements first
        displaySystemAnnouncements();
        
        const querySnapshot = await firebase.firestore()
            .collection('posts')
            .orderBy('createdAt', 'desc')
            .limit(6)
            .get();

        // Clear skeletons
        document.getElementById('postSkeletons').innerHTML = '';

        querySnapshot.forEach(doc => {
            const post = doc.data();
            const postDate = post.createdAt ? new Date(post.createdAt.seconds * 1000) : new Date();
            const isAuthor = currentUser && post.authorId === currentUser.uid;

            // สร้าง HTML สำหรับรูปภาพ
            const imageHtml = post.image
                ? `
                <div class="post-image">
                    <img src="${post.image}" 
                         alt="รูปภาพประกอบ" 
                         style="max-width: 300px; margin: 0.5rem; cursor: pointer;"
                         onclick="openImageModal('${post.image}')"
                    >
                </div>
            `
                : '';

            const postElement = document.createElement('div');
            postElement.className = 'post-card';
            postElement.innerHTML = `
            <div class="post-header">
                <h3 class="post-title">${post.title}</h3>
                <div class="post-actions">
                    ${isAuthor ? `
                        <button onclick="deletePost('${doc.id}')" class="delete-post-btn">
                            ลบ
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="post-meta">
                โพสต์โดย: ${post.authorName} | 
                วันที่: ${postDate.toLocaleDateString('th-TH')}
            </div>
            <div class="post-content">
                <p class="post-text">${post.content}</p>
                ${imageHtml}
            </div>
        `;

            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<p>เกิดข้อผิดพลาดในการโหลดประกาศ</p>';
    }
}



// ฟังก์ชันเปิด Modal แสดงรูปภาพ
function openImageModal(imageUrl) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modal.style.display = "block";
    modalImg.src = imageUrl;
}

// ปิด Modal เมื่อคลิกที่เครื่องหมาย X
document.querySelector('.close').onclick = function () {
    document.getElementById('imageModal').style.display = "none";
}

// ปิด Modal เมื่อคลิกนอกรูปภาพ
window.onclick = function (event) {
    const modal = document.getElementById('imageModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// ฟังก์ชันลบโพสต์
async function deletePost(postId) {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบประกาศนี้?')) return;

    try {
        await firebase.firestore().collection('posts').doc(postId).delete();
        alert('ลบประกาศสำเร็จ');
        loadPosts();
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('เกิดข้อผิดพลาดในการลบประกาศ');
    }
}
//โหลดโพสต์เมื่อเปิดหน้า
firebase.auth().onAuthStateChanged(user => {
if (user) {
displaySystemAnnouncements();
loadPosts();  // ฟังก์ชันที่มีอยู่แล้ว
}
});
// อัปเดตข้อมูลผู้ใช้เมื่อโหลดหน้า
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            const displayElement = document.getElementById('userDisplayName');
            const roleElement = document.getElementById('userRole');
            const avatarElement = document.getElementById('userAvatar');

            if (userData?.displayName) {
                displayElement.textContent = userData.displayName;
            } else {
                displayElement.textContent = user.email;
            }

            if (userData?.role) {
                roleElement.textContent = `(${userData.role})`;
            } else {
                roleElement.textContent = '';
            }

            if (userData?.avatar) {
                avatarElement.innerHTML = `<img src="${userData.avatar}" alt="avatar" style="width: 100%; height: 100%; border-radius: 50%;">`
            } else {
                avatarElement.textContent = userData.displayName ? userData.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
            }

            if (userData?.role === 'admin') {
                const userContainer = document.querySelector('.user-container');
                const logoutBtn = document.querySelector('.logout-btn');

                if (!document.querySelector('.admin-btn')) {
                    const adminBtn = document.createElement('button');
                    adminBtn.innerHTML = 'หน้า Admin';
                    adminBtn.className = 'admin-btn';
                    adminBtn.onclick = () => window.location.href = 'admin.html';
                    userContainer.insertBefore(adminBtn, logoutBtn);
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }
});


function logout() {
    firebase.auth().signOut()
        .then(() => window.location.href = 'login.html')
        .catch(error => console.error('Logout error:', error));
}