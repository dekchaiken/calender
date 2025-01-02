// Firebase initialization
firebase.initializeApp({
  apiKey: "AIzaSyAcb9q1eX1QM9Gl_W6U9WZNbeg6M-uyhpk",
  authDomain: "cyfencedevbyken.firebaseapp.com",
  projectId: "cyfencedevbyken",
  storageBucket: "cyfencedevbyken.appspot.com",
  messagingSenderId: "632813871756",
  appId: "1:632813871756:web:57d674643f258ddd2e11a9",
});

// Function to show page transition animation
function showPageTransition() {
  const transition = document.getElementById("pageTransition");
  transition.style.transform = "scaleX(1)";
  setTimeout(() => {
    transition.style.transform = "scaleX(0)";
  }, 500);
}

// Add click event listener to menu cards for page transition
document.querySelectorAll(".menu-card").forEach((card) => {
  card.addEventListener("click", (e) => {
    e.preventDefault();
    const href = card.getAttribute("onclick").match(/'([^']+)'/)[1];
    showPageTransition();
    setTimeout(() => {
      window.location.href = href;
    }, 300);
  });
});

// Function to create skeleton loading effect
function createSkeletons() {
  const container = document.getElementById("postSkeletons");
  container.innerHTML = Array(3)
    .fill("")
    .map(
      () => `
        <div class="post-skeleton">
            <div class="skeleton post-skeleton-title"></div>
            <div class="skeleton post-skeleton-meta"></div>
            <div class="skeleton post-skeleton-content"></div>
        </div>
    `
    )
    .join("");
}

// Function to display system announcements
async function displaySystemAnnouncements() {
  const container = document.getElementById("systemAnnouncements");
  try {
    const snapshot = await firebase
      .firestore()
      .collection("systemAnnouncements")
      .orderBy("date", "desc")
      .limit(5)
      .get();

    container.innerHTML = "";

    snapshot.forEach((doc) => {
      const announcement = doc.data();
      container.innerHTML += `
                <div class="system-announcement">
                    <div class="system-announcement-header">
                        <span class="system-announcement-badge">${
                          announcement.type
                        }</span>
                        <strong>${announcement.title}</strong>
                    </div>
                    <p>${announcement.content}</p>
                    <small>ประกาศเมื่อ: ${new Date(
                      announcement.date
                    ).toLocaleDateString("th-TH")}</small>
                </div>
            `;
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    container.innerHTML = "<p>ไม่สามารถโหลดประกาศได้</p>";
  }
}

// Function to load and display posts
async function loadPosts() {
  const postsContainer = document.getElementById("posts-container");
  const currentUser = firebase.auth().currentUser;

  createSkeletons();

  try {
    // Display system announcements first
    displaySystemAnnouncements();

    const querySnapshot = await firebase
      .firestore()
      .collection("posts")
      .orderBy("createdAt", "desc")
      .limit(6)
      .get();

    // Clear skeletons
    document.getElementById("postSkeletons").innerHTML = "";

    querySnapshot.forEach((doc) => {
      const post = doc.data();
      const postDate = post.createdAt
        ? new Date(post.createdAt.seconds * 1000)
        : new Date();
      const isAuthor = currentUser && post.authorId === currentUser.uid;

      // Create HTML for image if available
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
        : "";

      const postElement = document.createElement("div");
      postElement.className = "post-card";
      postElement.innerHTML = `
                <div class="post-header">
                    <h3 class="post-title">${post.title}</h3>
                    <div class="post-actions">
                        ${
                          isAuthor
                            ? `
                            <button onclick="deletePost('${doc.id}')" class="delete-post-btn">
                                ลบ
                            </button>
                        `
                            : ""
                        }
                    </div>
                </div>
                <div class="post-meta">
                    โพสต์โดย: ${post.authorName} | 
                    วันที่: ${postDate.toLocaleDateString("th-TH")}
                </div>
                <div class="post-content">
                    <p class="post-text">${post.content}</p>
                    ${imageHtml}
                </div>
            `;

      postsContainer.appendChild(postElement);
    });
  } catch (error) {
    console.error("Error loading posts:", error);
    postsContainer.innerHTML = "<p>เกิดข้อผิดพลาดในการโหลดประกาศ</p>";
  }
}

// Function to open image modal
function openImageModal(imageUrl) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  modal.style.display = "block";
  modalImg.src = imageUrl;
}

// Close modal when close button is clicked
document.querySelector(".close").onclick = function () {
  document.getElementById("imageModal").style.display = "none";
};

// Close modal when clicked outside of the modal
window.onclick = function (event) {
  const modal = document.getElementById("imageModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// Function to delete a post
async function deletePost(postId) {
  if (!confirm("คุณแน่ใจหรือไม่ที่จะลบประกาศนี้?")) return;

  try {
    await firebase.firestore().collection("posts").doc(postId).delete();
    alert("ลบประกาศสำเร็จ");
    loadPosts();
  } catch (error) {
    console.error("Error deleting post:", error);
    alert("เกิดข้อผิดพลาดในการลบประกาศ");
  }
}

// Load posts on auth state change
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    displaySystemAnnouncements();
    loadPosts();
  }
});

// Update user information on auth state change
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const userDoc = await firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .get();
      const userData = userDoc.data();
      const displayElement = document.getElementById("userDisplayName");
      const roleElement = document.getElementById("userRole");
      const avatarElement = document.getElementById("userAvatar");

      if (userData?.displayName) {
        displayElement.textContent = userData.displayName;
      } else {
        displayElement.textContent = user.email;
      }

      if (userData?.role) {
        roleElement.textContent = `(${userData.role})`;
      } else {
        roleElement.textContent = "";
      }

      if (userData?.avatar) {
        avatarElement.innerHTML = `<img src="${userData.avatar}" alt="avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
      } else {
        avatarElement.textContent = userData.displayName
          ? userData.displayName.charAt(0).toUpperCase()
          : user.email.charAt(0).toUpperCase();
      }

      if (userData?.role === "admin") {
        const userContainer = document.querySelector(".user-container");
        const logoutBtn = document.querySelector(".logout-btn");

        if (!document.querySelector(".admin-btn")) {
          const adminBtn = document.createElement("button");
          adminBtn.innerHTML = "หน้า Admin";
          adminBtn.className = "admin-btn";
          adminBtn.onclick = () => (window.location.href = "admin.html");
          userContainer.insertBefore(adminBtn, logoutBtn);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }
});

// Get modal elements for logout confirmation
const logoutModal = document.getElementById("logoutModal");
const logoutMessage = document.getElementById("logoutMessage");
const logoutSpinner = document.getElementById("logoutSpinner");

// Function to show logout modal
function showLogoutModal() {
  logoutModal.classList.add("active");
  logoutMessage.style.display = "block";
}

// Function to close logout modal
function closeLogoutModal() {
  logoutModal.classList.remove("active");
}

// Function to handle logout process
function logout(button) {
  const logoutMessage = document.getElementById("logoutMessage");
  const logoutSpinner = document.getElementById("logoutSpinner");
  logoutMessage.textContent = "กำลังออกจากระบบ...";
  logoutMessage.style.display = "block";
  logoutSpinner.style.display = "block";
  button.disabled = true;
  button.style.pointerEvents = "none";

  firebase
    .auth()
    .signOut()
    .then(() => {
      logoutModal.classList.remove("active");
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
      logoutMessage.textContent = "เกิดข้อผิดพลาดในการออกจากระบบ";
      logoutMessage.style.display = "block";
      logoutSpinner.style.display = "none";
      button.disabled = false;
      button.style.pointerEvents = "auto";
    });
}
