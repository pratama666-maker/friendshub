// --- Import Firebase SDKs ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, query, where, orderBy, limit, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


// --- Firebase Configuration (GANTI DENGAN KODE ANDA SENDIRI) ---
const firebaseConfig = {
    apiKey: "AIzaSyCIDtHVWRQiB-tmOWSK4mnexR_J2SAq790",
    authDomain: "funhub-3f848.firebaseapp.com",
    projectId: "funhub-3f848",
    storageBucket: "funhub-3f848.appspot.com",
    messagingSenderId: "922163960068",
    appId: "1:922163960068:web:ab2fd526a8ac67fe095851"
};

// --- Initialize Firebase Services ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// --- Global State Variables ---
// currentUser akan dikelola oleh Firebase Authentication dan data dari Firestore
let currentUser = {
  uid: null, // User ID dari Firebase Auth
  username: '',
  isLoggedIn: false,
  fans: 0,
  hatters: 0,
  myGroups: [], // Hanya menyimpan ID grup yang diikuti/dibuat
  myPosts: [] // Ini mungkin akan diambil dinamis dari Firestore daripada disimpan di sini
};

let allGroups = []; // Akan diisi dan diupdate dari Firestore
let otherUsersData = {}; // Akan diisi dan diupdate dari Firestore saat dibutuhkan

let currentViewingGroup = null; // Nama grup yang sedang dilihat
let currentViewingGroupId = null; // ID grup yang sedang dilihat
let currentViewingPost = null; // Objek { postId, groupId } untuk modal komentar
let currentOtherUserUid = null; // UID pengguna lain yang sedang dilihat profilnya

// --- Event Listeners and Initial Load ---
window.addEventListener('load', () => {
    // Firebase Auth State Listener: Ini adalah bagian terpenting untuk mengelola status login
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in
            currentUser.isLoggedIn = true;
            currentUser.uid = user.uid;

            // Ambil data profil user dari Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                currentUser.username = userData.username;
                currentUser.fans = userData.fans || 0;
                currentUser.hatters = userData.hatters || 0;
                currentUser.myGroups = userData.myGroups || [];
                // myPosts tidak disimpan di currentUser karena terlalu besar, diambil dinamis
            } else {
                // Jika dokumen user belum ada (misal setelah register baru), buatkan
                // Username bisa diambil dari email atau input register
                currentUser.username = user.email.split('@')[0]; // Default username jika belum diset
                await setDoc(userDocRef, {
                    username: currentUser.username,
                    email: user.email,
                    fans: 0,
                    hatters: 0,
                    myGroups: []
                });
            }

            document.getElementById('loggedInUsername').innerText = currentUser.username;
            document.getElementById('sidebarUsername').innerText = currentUser.username;
            document.getElementById('authModal').style.display = 'none';

            // Handle routing setelah login
            handleLocationChange();
        } else {
            // User is signed out
            currentUser.isLoggedIn = false;
            currentUser.uid = null;
            currentUser.username = '';
            currentUser.fans = 0;
            currentUser.hatters = 0;
            currentUser.myGroups = [];
            currentUser.myPosts = []; // Clear local posts

            document.getElementById('authModal').style.display = 'flex';
            // Clear hash if not logged in and on a restricted page
            if (window.location.hash && !['#login', '#register'].includes(window.location.hash)) {
                window.location.hash = '';
            }
            // Reset to login form
            showLogin();
        }
        handleResponsiveLayout(); // Update layout after auth state is known
    });

    // Event listener for Enter key in chat input
    document.getElementById('chatInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Event listener for Enter key in search input
    document.getElementById('searchInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // Handle initial sidebar/bottom nav visibility based on screen size
    window.addEventListener('resize', handleResponsiveLayout);
    handleResponsiveLayout(); // Call once on load

    // Add popstate listener for back/forward button
    window.addEventListener('popstate', handleLocationChange);

    // Initial load of all groups for search and navigation purposes
    // This is a real-time listener for all groups
    onSnapshot(collection(db, 'groups'), (snapshot) => {
        allGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (document.querySelector('#page-beranda').classList.contains('active')) {
            renderMyGroups(); // Re-render if on beranda page
        }
    }, (error) => {
        console.error("Error loading all groups:", error);
    });
});


// --- Authentication Functions (Firebase Auth) ---

// Fungsi ini tidak lagi dibutuhkan karena onAuthStateChanged yang mengelola sesi
// function saveUserSession() {
//     localStorage.setItem('currentUser', JSON.stringify(currentUser));
// }

async function startApp() { // Fungsi ini akan menjadi fungsi login
    const loginEmail = document.getElementById('loginUsername').value; // Asumsi input username sekarang adalah email
    const loginPassword = document.getElementById('loginPassword').value;

    try {
        await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        // onAuthStateChanged listener akan menangani pembaruan UI setelah login berhasil
        // Tidak perlu memanggil saveUserSession() atau showPage() di sini
    } catch (error) {
        alert("Login Gagal: " + error.message);
        console.error("Login Error:", error);
    }
}

async function registerUser() {
    const registerUsername = document.getElementById('registerUsername').value.trim();
    const registerEmail = document.getElementById('registerEmail').value.trim();
    const registerPassword = document.getElementById('registerPassword').value.trim();

    if (!registerUsername || !registerEmail || !registerPassword) {
        alert('Semua field registrasi harus diisi.');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
        const user = userCredential.user;

        // Simpan data profil awal user ke Firestore
        await setDoc(doc(db, 'users', user.uid), {
            username: registerUsername,
            email: registerEmail,
            fans: 0,
            hatters: 0,
            myGroups: []
        });
        alert('Registrasi berhasil! Anda sudah login.');
        // onAuthStateChanged listener akan menangani pembaruan UI
    } catch (error) {
        alert("Registrasi Gagal: " + error.message);
        console.error("Register Error:", error);
    }
}

function logout() {
    signOut(auth).then(() => {
        alert('Anda telah logout.');
        // onAuthStateChanged listener akan menangani pembaruan UI
        window.location.hash = ''; // Clear hash to show login modal
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
}

function showRegister() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
}

function showLogin() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
}


// --- Page Navigation and UI Management ---

function showPage(pageId, replace = false, extraState = {}) {
  // Hide all pages first
  document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
  });

  // Show the target page
  const targetPage = document.getElementById('page-' + pageId);
  if (targetPage) {
      targetPage.classList.add('active');
  }

  // Update URL hash and history state
  const state = { pageId, ...extraState };
  if (replace) {
      history.replaceState(state, '', `#${pageId}`);
  } else {
      history.pushState(state, '', `#${pageId}`);
  }

  // Update active navigation button for mobile (bottom nav)
  document.querySelectorAll('#bottomNavBar div').forEach(btn => {
      const svg = btn.querySelector('svg');
      const span = btn.querySelector('span');
      if (svg) svg.style.fill = '#fff';
      if (span) span.style.color = '#fff';
  });

  const bottomBtn = document.getElementById('btn-' + pageId);
  if (bottomBtn) {
      const svg = bottomBtn.querySelector('svg');
      const span = bottomBtn.querySelector('span');
      if (svg) svg.style.fill = '#00c853';
      if (span) span.style.color = '#00c853';
  }

  // Update active navigation item for PC/iPad (sidebar)
  document.querySelectorAll('#sidebar .nav-item').forEach(item => {
      item.classList.remove('active');
  });
  const sidebarBtn = document.getElementById('sidebar-btn-' + pageId);
  if (sidebarBtn) {
      sidebarBtn.classList.add('active');
  }

  // Manage top bar and search bar visibility
  const showTopAndSearch = ['beranda', 'pesan', 'notifikasi'].includes(pageId) || pageId.includes('hasil-pencarian');
  document.getElementById('topBar').style.display = showTopAndSearch ? 'flex' : 'none';
  document.getElementById('searchBar').style.display = showTopAndSearch ? 'flex' : 'none';

  // Manage action button text and function
  const actionBtn = document.getElementById('actionButton');
  if (pageId === 'beranda') {
    actionBtn.innerText = '+ Buat Grup';
    actionBtn.onclick = () => showPage('tambah-grup');
    actionBtn.style.display = 'inline-block';
  } else if (pageId === 'pesan') {
    actionBtn.innerText = '+ Pesan Baru';
    actionBtn.onclick = () => showPage('tambah-pesan');
    actionBtn.style.display = 'inline-block';
  } else {
    actionBtn.style.display = 'none';
  }

  // Specific page initializations
  if (pageId === 'profil') {
      updateMyProfile();
  } else if (pageId === 'beranda') {
      renderMyGroups();
  } else if (pageId === 'tambah-grup') {
      document.getElementById('newGroupBannerPreview').style.display = 'none';
      document.getElementById('newGroupUploadPrompt').style.display = 'block';
      document.getElementById('newGroupBannerInput').value = '';
  } else if (pageId === 'buat-post') {
      document.getElementById('postTitleInput').value = '';
      document.getElementById('postContentInput').value = '';
      document.getElementById('postImageInput').value = '';
      document.getElementById('postImagePreview').style.display = 'none';
      document.getElementById('postVideoPreview').style.display = 'none';
  } else if (pageId === 'pesan') {
      displayChatMessages(); // Panggil fungsi untuk menampilkan chat
  }


  // Close any open popups/dropdowns when changing pages
  closeCommentModal();
  hidePostSettingsDropdown();

  // Re-evaluate responsive layout on page change
  handleResponsiveLayout();
}

function handleLocationChange() {
    let pageId = window.location.hash.replace('#', '');

    if (!pageId && currentUser.isLoggedIn) {
        pageId = 'beranda'; // Default page if logged in
    } else if (!pageId) {
        return; // Do nothing if not logged in and no hash
    }

    // Handle specific page loading based on hash (e.g., group-detail, profil-user-lain)
    if (pageId.startsWith('group-detail-')) {
        const groupId = decodeURIComponent(pageId.replace('group-detail-', ''));
        showSpecificGroup(groupId, true); // Use replaceState for popstate
    } else if (pageId.startsWith('profil-user-lain-')) {
        const username = decodeURIComponent(pageId.replace('profil-user-lain-', ''));
        showOtherUserProfile(username, true);
    } else {
        showPage(pageId, true); // Use replaceState for popstate events
    }
}

function handleResponsiveLayout() {
  const sidebar = document.getElementById('sidebar');
  const bottomNavBar = document.getElementById('bottomNavBar');
  const mainContent = document.getElementById('mainContent');
  const isLargeScreen = window.innerWidth >= 768; // Define breakpoint

  if (isLargeScreen) {
    sidebar.style.display = 'flex';
    bottomNavBar.style.display = 'none';
    mainContent.style.width = 'calc(100% - 250px)'; // Adjust main content width
    mainContent.style.height = '100vh'; // Ensure main content fills remaining height

    // Adjust page padding for PC view (no bottom nav)
    document.querySelectorAll('.page').forEach(p => p.style.paddingBottom = '20px');
  } else {
    sidebar.style.display = 'none';
    // Only show bottom nav if it's one of the pages that uses it
    const activePageId = document.querySelector('.page.active')?.id.replace('page-', '');
    const showBottomNav = ['beranda', 'pesan', 'group-detail', 'hasil-pencarian', 'profil', 'profil-user-lain'].includes(activePageId); // Added 'profil-user-lain'
    bottomNavBar.style.display = showBottomNav ? 'flex' : 'none';

    mainContent.style.width = '100%';
    mainContent.style.height = 'auto'; // Let it flow naturally

    // Adjust page padding for mobile view (with bottom nav space)
    document.querySelectorAll('.page').forEach(p => p.style.paddingBottom = '80px');
  }
}

// --- Group Management (Firebase Firestore & Storage) ---

async function createNewGroup() {
  if (!currentUser.isLoggedIn) {
      alert('Anda harus login untuk membuat grup.');
      return;
  }

  const groupName = document.getElementById('newGroupName').value.trim();
  const groupDescription = document.getElementById('newGroupDescription').value.trim();
  const bannerFile = document.getElementById('newGroupBannerInput').files[0];
  let bannerUrl = '';

  if (groupName === '') {
    alert('Nama Grup tidak boleh kosong!');
    return;
  }

  try {
      // 1. Upload banner to Firebase Storage
      if (bannerFile) {
          const storageRef = ref(storage, `group_banners/${currentUser.uid}/${Date.now()}_${bannerFile.name}`);
          const uploadTask = await uploadBytes(storageRef, bannerFile);
          bannerUrl = await getDownloadURL(uploadTask.ref);
      }

      // 2. Add group data to Firestore
      const newGroupRef = await addDoc(collection(db, 'groups'), {
          name: groupName,
          description: groupDescription,
          adminUid: currentUser.uid,
          adminUsername: currentUser.username,
          banner: bannerUrl,
          createdAt: new Date().toISOString()
      });

      // 3. Update current user's myGroups array in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
          myGroups: arrayUnion(newGroupRef.id)
      });
      // Update local currentUser.myGroups (UI will be updated via onAuthStateChanged)
      currentUser.myGroups.push(newGroupRef.id);


      alert(`Grup "${groupName}" berhasil dibuat!`);
      document.getElementById('newGroupName').value = '';
      document.getElementById('newGroupDescription').value = '';
      document.getElementById('newGroupBannerInput').value = '';
      showPage('beranda'); // Re-render my groups
  } catch (error) {
      alert('Gagal membuat grup: ' + error.message);
      console.error('Error creating group:', error);
  }
}

async function renderMyGroups() {
  const container = document.getElementById('myGroupsContainer');
  container.innerHTML = '<p style="text-align:center; color:#aaa; margin-top:20px;">Memuat grup...</p>';

  if (!currentUser.isLoggedIn || !currentUser.uid) {
      container.innerHTML = '<p style="text-align:center; color:#aaa; margin-top:20px;">Silakan login untuk melihat grup Anda.</p>';
      return;
  }

  try {
      // Dapatkan data user terbaru untuk daftar grup mereka
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const myGroupIds = userDocSnap.exists() ? userDocSnap.data().myGroups || [] : [];

      container.innerHTML = ''; // Clear container

      if (myGroupIds.length === 0) {
          container.innerHTML = '<p style="text-align:center; color:#aaa; margin-top:20px;">Anda belum bergabung atau membuat grup.</p>';
          return;
      }

      // Ambil detail setiap grup berdasarkan ID
      // Filter allGroups yang sudah di-cache oleh listener global
      const userGroups = allGroups.filter(g => myGroupIds.includes(g.id));

      userGroups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.style.cssText = `
          background:#1c1c1c; margin-top:10px; border-radius:15px; padding:15px;
          cursor:pointer; display:flex; align-items:center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        groupElement.innerHTML = `
          <div style="width:40px; height:40px; background:#a259ff; border-radius:50%; margin-right:15px; display:flex; align-items:center; justify-content:center; font-weight:bold;">${group.name.charAt(0)}</div>
          <span style="font-size:18px;">${group.name}</span>
        `;
        groupElement.onclick = () => showSpecificGroup(group.id); // Panggil dengan ID grup
        container.appendChild(groupElement);
      });
  } catch (error) {
      console.error("Error rendering my groups:", error);
      container.innerHTML = '<p style="text-align:center; color:#f44336; margin-top:20px;">Gagal memuat grup.</p>';
  }
}

let unsubscribeFromGroupPosts = null; // Variable to store the unsubscribe function

async function showSpecificGroup(groupId, isPopState = false) {
  currentViewingGroupId = groupId; // Set ID grup yang sedang dilihat
  const groupPage = document.getElementById('page-group-detail');

  const group = allGroups.find(g => g.id === groupId); // Temukan grup dari cache allGroups
  if (!group) {
      alert('Grup tidak ditemukan.');
      return;
  }

  document.getElementById('groupNameDisplay').innerText = group.name;
  document.getElementById('groupDescriptionDisplay').innerText = group.description;

  const bannerImage = document.getElementById('groupBannerImage');
  const uploadPrompt = document.getElementById('uploadBannerPrompt');
  if (group.banner) {
      bannerImage.src = group.banner;
      bannerImage.style.display = 'block';
      uploadPrompt.style.display = 'none';
  } else {
      bannerImage.style.display = 'none';
      uploadPrompt.style.display = 'flex';
  }
  
  checkAdminStatus(groupId); // Check admin status based on group ID

  document.getElementById('groupSettingName').value = group.name;
  document.getElementById('groupSettingDescription').value = group.description;

  // Display posts for this group (real-time listener)
  displayGroupPosts(groupId);

  // Use showPage to update the view and history
  showPage('group-detail', isPopState, { groupId: groupId });
}

function checkAdminStatus(groupId) {
  const group = allGroups.find(g => g.id === groupId);
  const adminBadge = document.getElementById('groupAdminBadge');
  const adminActions = document.getElementById('groupAdminActions');
  const bannerUploadInput = document.getElementById('bannerUploadInput');

  if (group && currentUser.isLoggedIn && group.adminUid === currentUser.uid) {
      adminBadge.style.display = 'block';
      adminActions.style.display = 'block';
      bannerUploadInput.style.display = 'block';
  } else {
      adminBadge.style.display = 'none';
      adminActions.style.display = 'none';
      bannerUploadInput.style.display = 'none';
  }
}

async function uploadGroupBanner(event) {
    if (!currentUser.isLoggedIn || !currentViewingGroupId) return;

    const file = event.target.files[0];
    if (file) {
        try {
            const group = allGroups.find(g => g.id === currentViewingGroupId);
            if (!group || group.adminUid !== currentUser.uid) {
                alert('Anda tidak memiliki izin untuk mengubah banner grup ini.');
                return;
            }

            const storageRef = ref(storage, `group_banners/${currentUser.uid}/${currentViewingGroupId}_${file.name}`);
            const uploadTask = await uploadBytes(storageRef, file);
            const bannerUrl = await getDownloadURL(uploadTask.ref);

            const groupDocRef = doc(db, 'groups', currentViewingGroupId);
            await updateDoc(groupDocRef, {
                banner: bannerUrl
            });

            // UI akan diperbarui secara otomatis karena allGroups listener
            alert('Banner grup berhasil diperbarui!');
        } catch (error) {
            alert('Gagal mengunggah banner: ' + error.message);
            console.error('Error uploading banner:', error);
        }
    }
}


// --- Post Management (Firebase Firestore & Storage) ---

async function createNewPost() {
  if (!currentUser.isLoggedIn || !currentViewingGroupId) {
      alert('Anda harus login dan memilih grup untuk membuat postingan.');
      return;
  }

  const postTitle = document.getElementById('postTitleInput').value.trim();
  const postContent = document.getElementById('postContentInput').value.trim();
  const postMediaFile = document.getElementById('postImageInput').files[0];
  let postMedia = null;

  if (postTitle === '' || postContent === '') {
    alert('Judul dan isi postingan tidak boleh kosong!');
    return;
  }

  try {
      // 1. Upload media to Firebase Storage (if any)
      if (postMediaFile) {
          const mediaType = postMediaFile.type.startsWith('image') ? 'image' : 'video';
          const storageRef = ref(storage, `post_media/${currentViewingGroupId}/${currentUser.uid}/${Date.now()}_${postMediaFile.name}`);
          const uploadTask = await uploadBytes(storageRef, postMediaFile);
          const mediaUrl = await getDownloadURL(uploadTask.ref);
          postMedia = {
              type: mediaType,
              src: mediaUrl
          };
      }

      // 2. Add post data to Firestore sub-collection
      await addDoc(collection(db, 'groups', currentViewingGroupId, 'posts'), {
          author: currentUser.username,
          authorUid: currentUser.uid,
          title: postTitle,
          content: postContent,
          media: postMedia,
          timestamp: new Date().toISOString(), // Use ISO string for consistent sorting
          likes: 0,
          dislikes: 0,
          commentCount: 0,
          shares: 0
      });

      alert('Postingan berhasil diunggah!');
      document.getElementById('postTitleInput').value = '';
      document.getElementById('postContentInput').value = '';
      document.getElementById('postImageInput').value = '';
      document.getElementById('postImagePreview').style.display = 'none';
      document.getElementById('postVideoPreview').style.display = 'none';
      showSpecificGroup(currentViewingGroupId); // Refresh the group page
  } catch (error) {
      alert('Gagal mengunggah postingan: ' + error.message);
      console.error('Error creating post:', error);
  }
}

function displayGroupPosts(groupId) {
  const container = document.getElementById('groupPostsContainer');
  container.innerHTML = '<p style="text-align:center; color:#aaa; margin-top:20px;">Memuat postingan...</p>';

  // Unsubscribe from previous listener if any
  if (unsubscribeFromGroupPosts) {
      unsubscribeFromGroupPosts();
  }

  const group = allGroups.find(g => g.id === groupId);
  if (!group) {
      container.innerHTML = '<p style="text-align:center; color:#f44336; margin-top:20px;">Grup tidak ditemukan.</p>';
      return;
  }

  const postsCollectionRef = collection(db, 'groups', groupId, 'posts');
  const q = query(postsCollectionRef, orderBy('timestamp', 'desc')); // Order by latest posts

  // Set up real-time listener for posts
  unsubscribeFromGroupPosts = onSnapshot(q, (snapshot) => {
      container.innerHTML = ''; // Clear container before re-rendering
      if (snapshot.empty) {
          container.innerHTML = '<p style="text-align:center; color:#aaa; margin-top:20px;">Belum ada postingan di grup ini.</p>';
          return;
      }

      snapshot.forEach(postDoc => {
          const post = { id: postDoc.id, ...postDoc.data() };
          const postElement = document.createElement('div');
          postElement.className = 'post-card';
          postElement.setAttribute('data-post-id', post.id);
          postElement.setAttribute('data-group-id', groupId);

          let mediaHtml = '';
          if (post.media && post.media.src) {
              if (post.media.type === 'image') {
                  mediaHtml = `<img src="${post.media.src}" style="max-width:100%; border-radius:10px; margin-bottom:15px; display:block; margin-left:auto; margin-right:auto;">`;
              } else if (post.media.type === 'video') {
                  mediaHtml = `<video src="${post.media.src}" controls style="max-width:100%; border-radius:10px; margin-bottom:15px; display:block; margin-left:auto; margin-right:auto;"></video>`;
              }
          }

          const isAuthor = (post.authorUid === currentUser.uid);
          const isAdmin = (group.adminUid === currentUser.uid);

          // Determine if current user has liked/disliked
          const hasLiked = post.likedBy?.includes(currentUser.uid) || false;
          const hasDisliked = post.dislikedBy?.includes(currentUser.uid) || false;

          postElement.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:35px; height:35px; background:#a259ff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold;">${post.author.charAt(0)}</div>
                  <div style="font-weight:bold; font-size:16px;">
                      ${post.author}
                      ${isAdmin ? '<span style="background:#00c853; color:#000; padding:2px 8px; border-radius:10px; font-size:12px; margin-left:5px;">Admin</span>' : ''}
                  </div>
              </div>
              <div style="cursor:pointer; position:relative;" onclick="togglePostSettings(event, '${post.id}', '${groupId}')">
                  <svg style="width:24px; height:24px; fill:#aaa;" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </div>
            </div>
            ${mediaHtml}
            <div class="post-content">
              <strong>${post.title}</strong><br>${post.content}
            </div>
            <div style="font-size:12px; color:#aaa; margin-top:5px;">${post.tags ? post.tags : ''} Diposting: ${new Date(post.timestamp).toLocaleString('id-ID')}</div>
            <div class="post-actions" style="display:flex; justify-content:space-around; margin-top:15px; border-top:1px solid #333; padding-top:10px;">
              <div onclick="toggleLike(this, '${post.id}', '${groupId}')" class="${hasLiked ? 'active-like' : ''}" style="color:${hasLiked ? '#00c853' : '#fff'};">
                  <svg style="width:20px; height:20px; fill:${hasLiked ? '#00c853' : '#fff'};" viewBox="0 0 24 24"><path d="M14 9H9.5l1.62-4.37C11.4 4.29 11 3 9.7 3c-.8 0-1.4.4-1.8.9L3 11v9h11c1.2 0 2.1-.9 2.1-2.1l.9-8.7c.1-.5-.2-1-.7-1zM16 11.5l-1.9-8.7c-.1-.5-.5-.8-1.1-.8H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h7l.5 3c.1.7.9 1 1.6.4l.7-.7c.3-.3.5-.5.8-.5h3.4V11.5z"/></svg>
                  <span>${post.likes || 0}</span>
              </div>
              <div onclick="toggleDislike(this, '${post.id}', '${groupId}')" class="${hasDisliked ? 'active-dislike' : ''}" style="color:${hasDisliked ? '#f44336' : '#fff'};">
                  <svg style="width:20px; height:20px; fill:${hasDisliked ? '#f44336' : '#fff'};" viewBox="0 0 24 24"><path d="M10 15h4.5l-1.62 4.37C12.6 19.71 13 21 14.3 21c.8 0 1.4-.4 1.8-.9L21 13V4h-11c-1.2 0-2.1.9-2.1 2.1l-.9 8.7c-.1.5.2 1 .7 1zM8 12.5l1.9 8.7c.1.5.5.8 1.1.8h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-7l-.5-3c-.1-.7-.9-1-1.6-.4l-.7.7c-.3-.3-.5-.5-.8.5H4V12.5z"/></svg>
                  <span>${post.dislikes || 0}</span>
              </div>
              <div onclick="openCommentModal('${post.id}', '${groupId}')">
                  <svg style="width:20px; height:20px; fill:#fff;" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                  <span>${post.commentCount || 0}</span>
              </div>
              <div onclick="alert('Postingan dibagikan!')">
                  <svg style="width:20px; height:20px; fill:#fff;" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.52.48 1.2.78 1.96.78 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L7.04 11.23c-.52-.48-1.2-.78-1.96-.78-1.66 0-3 1.34-3 3s1.34 3 3 3c.76 0 1.44-.3 1.96-.77l7.05 4.11c-.05.23-.09.46-.09.7 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/></svg>
                  <span>${post.shares || 0}</span>
              </div>
            </div>
          `;
          container.appendChild(postElement);
      });
  }, (error) => {
      console.error("Error getting group posts:", error);
      container.innerHTML = '<p style="text-align:center; color:#f44336; margin-top:20px;">Gagal memuat postingan.</p>';
  });
}

async function toggleLike(element, postId, groupId) {
  if (!currentUser.isLoggedIn) {
      alert('Silakan login untuk memberikan like.');
      return;
  }
  const postRef = doc(db, 'groups', groupId, 'posts', postId);
  const postSnap = await getDoc(postRef);

  if (postSnap.exists()) {
      const post = postSnap.data();
      const userUid = currentUser.uid;

      let likedBy = post.likedBy || [];
      let dislikedBy = post.dislikedBy || [];

      if (likedBy.includes(userUid)) {
          // Already liked, unlike
          await updateDoc(postRef, {
              likes: increment(-1),
              likedBy: arrayRemove(userUid)
          });
          element.classList.remove('active-like');
      } else {
          // Not liked, add like
          await updateDoc(postRef, {
              likes: increment(1),
              likedBy: arrayUnion(userUid)
          });
          element.classList.add('active-like');

          // If previously disliked, remove dislike
          if (dislikedBy.includes(userUid)) {
              await updateDoc(postRef, {
                  dislikes: increment(-1),
                  dislikedBy: arrayRemove(userUid)
              });
              const dislikeButton = element.nextElementSibling;
              dislikeButton.classList.remove('active-dislike');
          }
      }
  }
}

async function toggleDislike(element, postId, groupId) {
  if (!currentUser.isLoggedIn) {
      alert('Silakan login untuk memberikan dislike.');
      return;
  }
  const postRef = doc(db, 'groups', groupId, 'posts', postId);
  const postSnap = await getDoc(postRef);

  if (postSnap.exists()) {
      const post = postSnap.data();
      const userUid = currentUser.uid;

      let likedBy = post.likedBy || [];
      let dislikedBy = post.dislikedBy || [];

      if (dislikedBy.includes(userUid)) {
          // Already disliked, remove dislike
          await updateDoc(postRef, {
              dislikes: increment(-1),
              dislikedBy: arrayRemove(userUid)
          });
          element.classList.remove('active-dislike');
      } else {
          // Not disliked, add dislike
          await updateDoc(postRef, {
              dislikes: increment(1),
              dislikedBy: arrayUnion(userUid)
          });
          element.classList.add('active-dislike');

          // If previously liked, remove like
          if (likedBy.includes(userUid)) {
              await updateDoc(postRef, {
                  likes: increment(-1),
                  likedBy: arrayRemove(userUid)
              });
              const likeButton = element.previousElementSibling;
              likeButton.classList.remove('active-like');
          }
      }
  }
}

let unsubscribeFromComments = null;
async function openCommentModal(postId, groupId) {
  currentViewingPost = { postId: postId, groupId: groupId };

  const postRef = doc(db, 'groups', groupId, 'posts', postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) {
      alert('Postingan tidak ditemukan.');
      return;
  }
  const post = postSnap.data();

  // Display post preview in comment modal
  const commentPostPreview = document.getElementById('commentPostPreview');
  let previewContent = `
      <div style="font-weight:bold; font-size:16px; margin-bottom:5px; color:#fff;">${post.title}</div>
      <div style="font-size:14px; color:#aaa; margin-bottom:10px;">Oleh: ${post.author}</div>
      <div style="font-size:14px; color:#ccc;">${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</div>
  `;
  if (post.media && post.media.src) {
      if (post.media.type === 'image') {
          previewContent += `<img src="${post.media.src}" alt="Post Image" style="max-width:100%; border-radius:5px; margin-top:10px;">`;
      } else if (post.media.type === 'video') {
          previewContent += `<video src="${post.media.src}" controls style="max-width:100%; border-radius:5px; margin-top:10px;"></video>`;
      }
  }
  commentPostPreview.innerHTML = previewContent;

  // Real-time listener for comments
  const commentsList = document.getElementById('commentsList');
  commentsList.innerHTML = '<p style="text-align:center; color:#aaa;">Memuat komentar...</p>';

  if (unsubscribeFromComments) {
      unsubscribeFromComments(); // Unsubscribe from previous
  }

  const commentsCollectionRef = collection(db, 'groups', groupId, 'posts', postId, 'comments');
  unsubscribeFromComments = onSnapshot(query(commentsCollectionRef, orderBy('timestamp', 'asc')), (snapshot) => {
      commentsList.innerHTML = '';
      if (snapshot.empty) {
          commentsList.innerHTML = '<p style="text-align:center; color:#aaa;">Belum ada komentar.</p>';
      } else {
          snapshot.forEach(commentDoc => {
              const comment = commentDoc.data();
              const commentItem = document.createElement('div');
              commentItem.className = 'comment-item';
              commentItem.innerHTML = `<strong>${comment.author}</strong>: ${comment.text}`;
              commentsList.appendChild(commentItem);
          });
      }
      commentsList.scrollTop = commentsList.scrollHeight; // Scroll to bottom
  }, (error) => {
      console.error("Error getting comments:", error);
      commentsList.innerHTML = '<p style="text-align:center; color:#f44336;">Gagal memuat komentar.</p>';
  });

  document.getElementById('commentModal').style.display = 'flex';
  document.getElementById('newCommentInput').focus(); // Focus on input
}

function closeCommentModal() {
  document.getElementById('commentModal').style.display = 'none';
  document.getElementById('newCommentInput').value = '';
  currentViewingPost = null;
  if (unsubscribeFromComments) {
      unsubscribeFromComments(); // Stop listening for comments
  }
}

async function addComment() {
  if (!currentViewingPost || !currentUser.isLoggedIn) {
      alert('Silakan login untuk menambahkan komentar.');
      return;
  }
  const { postId, groupId } = currentViewingPost;

  const newCommentInput = document.getElementById('newCommentInput');
  const commentText = newCommentInput.value.trim();

  if (commentText) {
      try {
          // Add comment to Firestore sub-collection
          await addDoc(collection(db, 'groups', groupId, 'posts', postId, 'comments'), {
              author: currentUser.username,
              authorUid: currentUser.uid,
              text: commentText,
              timestamp: new Date().toISOString()
          });

          // Increment comment count on the main post document
          const postRef = doc(db, 'groups', groupId, 'posts', postId);
          await updateDoc(postRef, {
              commentCount: increment(1)
          });

          newCommentInput.value = '';
          // UI will automatically update due to the onSnapshot listener in openCommentModal
      } catch (error) {
          console.error("Error adding comment:", error);
          alert('Gagal menambahkan komentar: ' + error.message);
      }
  }
}

function togglePostSettings(event, postId, groupId) {
    event.stopPropagation();
    const dropdown = document.getElementById('postSettingsDropdown');
    const postCard = event.currentTarget.closest('.post-card');
    const rect = event.currentTarget.getBoundingClientRect();

    // Set dropdown visibility and data attributes
    if (dropdown.style.display === 'block' && dropdown.getAttribute('data-current-post-id') === postId) {
        dropdown.style.display = 'none';
        return;
    }

    dropdown.setAttribute('data-current-post-id', postId);
    dropdown.setAttribute('data-current-group-id', groupId); // Store group ID
    dropdown.style.display = 'block';

    // Calculate position
    const dropdownWidth = dropdown.offsetWidth;
    const dropdownHeight = dropdown.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.left - dropdownWidth + rect.width;
    let top = rect.bottom + 5;

    if (left < 0) {
        left = rect.left;
    }
    if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 10;
        if (left < 0) left = 0;
    }
    if (top + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - 5;
        if (top < 0) top = 10;
    }

    dropdown.style.left = `${left}px`;
    dropdown.style.top = `${top}px`;
    dropdown.style.right = 'auto';
    dropdown.style.bottom = 'auto';

    document.addEventListener('click', hidePostSettingsDropdown);
}


function hidePostSettingsDropdown(event) {
    const dropdown = document.getElementById('postSettingsDropdown');
    if (event && dropdown.contains(event.target)) return;
    dropdown.style.display = 'none';
    dropdown.removeAttribute('data-current-post-id');
    dropdown.removeAttribute('data-current-group-id');
    document.removeEventListener('click', hidePostSettingsDropdown);
}

function editPost() {
    alert('Fitur edit postingan belum diimplementasikan.');
    hidePostSettingsDropdown();
}

async function deletePost() {
    if (!currentUser.isLoggedIn) {
        alert('Anda harus login untuk menghapus postingan.');
        return;
    }

    const dropdown = document.getElementById('postSettingsDropdown');
    const postIdToDelete = dropdown.getAttribute('data-current-post-id');
    const groupId = dropdown.getAttribute('data-current-group-id');

    if (!postIdToDelete || !groupId) return;

    if (confirm('Anda yakin ingin menghapus postingan ini?')) {
        try {
            const postRef = doc(db, 'groups', groupId, 'posts', postIdToDelete);
            const postSnap = await getDoc(postRef);
            if (!postSnap.exists()) {
                alert('Postingan tidak ditemukan.');
                return;
            }
            const postData = postSnap.data();

            const groupRef = doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);
            const groupData = groupSnap.data();

            // Check if current user is the post author or group admin
            const isPostAuthor = postData.authorUid === currentUser.uid;
            const isGroupAdmin = groupData.adminUid === currentUser.uid;

            if (!isPostAuthor && !isGroupAdmin) {
                alert('Anda tidak memiliki izin untuk menghapus postingan ini.');
                return;
            }

            // Delete media from Storage if exists
            if (postData.media && postData.media.src && postData.media.src.startsWith('https://firebasestorage.googleapis.com/')) {
                const mediaUrl = postData.media.src;
                // Extract path from URL (this can be complex, better to save storage path)
                // For simplicity, let's assume a direct path match, or use a more robust URL parser
                const pathStartIndex = mediaUrl.indexOf('/o/') + 3;
                const pathEndIndex = mediaUrl.indexOf('?');
                const storagePath = decodeURIComponent(mediaUrl.substring(pathStartIndex, pathEndIndex));

                const fileRef = ref(storage, storagePath);
                try {
                    await deleteObject(fileRef);
                    console.log('Media file deleted from storage.');
                } catch (storageError) {
                    console.warn('Could not delete media file from storage:', storageError.message);
                    // Continue deletion of post even if media fails to delete
                }
            }

            // Delete post document from Firestore
            await deleteDoc(postRef);
            alert('Postingan berhasil dihapus.');
            // UI will update automatically via the onSnapshot listener for posts
            // updateMyProfile(); // No longer necessary as myPosts will be fetched live
        } catch (error) {
            alert('Gagal menghapus postingan: ' + error.message);
            console.error('Error deleting post:', error);
        }
    }
    hidePostSettingsDropdown();
}


// --- Chat Management (Firebase Firestore - Simple Demo) ---
let unsubscribeFromChat = null; // Listener untuk chat

function displayChatMessages() {
    const chatContent = document.getElementById('chatContent');
    chatContent.innerHTML = '<p style="text-align:center; color:#aaa;">Memuat pesan...</p>';

    if (unsubscribeFromChat) {
        unsubscribeFromChat(); // Unsubscribe dari listener sebelumnya
    }

    const messagesCollectionRef = collection(db, 'chats');
    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'), limit(50)); // Ambil 50 pesan terakhir

    unsubscribeFromChat = onSnapshot(q, (snapshot) => {
        chatContent.innerHTML = '';
        if (snapshot.empty) {
            chatContent.innerHTML = '<p style="text-align:center; color:#aaa;">Belum ada pesan.</p>';
            return;
        }
        snapshot.forEach(doc => {
            const message = doc.data();
            const messageElement = document.createElement('div');
            const isMyMessage = message.authorUid === currentUser.uid;

            messageElement.style.cssText = `
                align-self: ${isMyMessage ? 'flex-end' : 'flex-start'};
                background: ${isMyMessage ? '#00c853' : '#333'};
                padding:10px 14px;
                border-radius:${isMyMessage ? '20px 20px 5px 20px' : '20px 20px 20px 5px'};
                max-width:70%;
                word-wrap:break-word;
                margin-bottom: 10px;
            `;
            messageElement.innerHTML = `<strong>${message.author}</strong>: ${message.text}`;
            chatContent.appendChild(messageElement);
        });
        chatContent.scrollTop = chatContent.scrollHeight; // Scroll to bottom
    }, (error) => {
        console.error("Error getting chat messages:", error);
        chatContent.innerHTML = '<p style="text-align:center; color:#f44336;">Gagal memuat pesan chat.</p>';
    });
}

async function sendMessage() {
  if (!currentUser.isLoggedIn) {
      alert('Anda harus login untuk mengirim pesan chat.');
      return;
  }

  const chatInput = document.getElementById('chatInput');
  const message = chatInput.value.trim();
  if (message) {
      try {
          await addDoc(collection(db, 'chats'), {
              author: currentUser.username,
              authorUid: currentUser.uid,
              text: message,
              timestamp: new Date().toISOString()
          });
          chatInput.value = '';
          // UI akan diupdate otomatis oleh listener di displayChatMessages
      } catch (error) {
          console.error("Error sending message:", error);
          alert('Gagal mengirim pesan: ' + error.message);
      }
  }
}


// --- Media Preview Functions ---

function previewNewGroupBanner(event) {
  const file = event.target.files[0];
  const preview = document.getElementById('newGroupBannerPreview');
  const prompt = document.getElementById('newGroupUploadPrompt');

  if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
          preview.src = e.target.result;
          preview.style.display = 'block';
          prompt.style.display = 'none';
      };
      reader.readAsDataURL(file);
  } else {
      preview.src = '';
      preview.style.display = 'none';
      prompt.style.display = 'block';
  }
}

function previewPostMedia(event) {
    const file = event.target.files[0];
    const imagePreview = document.getElementById('postImagePreview');
    const videoPreview = document.getElementById('postVideoPreview');

    imagePreview.style.display = 'none';
    videoPreview.style.display = 'none';
    imagePreview.src = '';
    videoPreview.src = '';

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (file.type.startsWith('image')) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            } else if (file.type.startsWith('video')) {
                videoPreview.src = e.target.result;
                videoPreview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
}


// --- Search Functionality (Firebase Firestore) ---

async function performSearch() {
  const queryText = document.getElementById('searchInput').value.toLowerCase().trim();
  const userResultsContainer = document.getElementById('userSearchResults');
  const postResultsContainer = document.getElementById('postSearchResults');
  const searchQueryDisplay = document.getElementById('searchQueryDisplay');

  userResultsContainer.innerHTML = '<p style="text-align:center; color:#aaa;">Mencari pengguna...</p>';
  postResultsContainer.innerHTML = '<p style="text-align:center; color:#aaa;">Mencari postingan...</p>';
  searchQueryDisplay.innerText = queryText;

  if (queryText === '') {
      userResultsContainer.innerHTML = '<p style="text-align:center; color:#aaa;">Masukkan kata kunci pencarian pengguna.</p>';
      postResultsContainer.innerHTML = '<p style="text-align:center; color:#aaa;">Masukkan kata kunci pencarian postingan.</p>';
      showPage('hasil-pencarian');
      return;
  }

  try {
      // Search Users (by username)
      const usersRef = collection(db, 'users');
      // Firestore does not support full-text search directly without a search service like Algolia
      // This will only work for exact matches or prefix matches if 'username' field is structured for it
      // For a simple demo, we'll fetch all and filter client-side (not scalable for many users)
      const userSnapshot = await getDocs(query(usersRef));
      let userFound = false;
      userResultsContainer.innerHTML = '';
      userSnapshot.forEach(doc => {
          const userData = doc.data();
          if (userData.username && userData.username.toLowerCase().includes(queryText)) {
              const userDiv = document.createElement('div');
              userDiv.onclick = () => {
                  if (userData.uid === currentUser.uid) {
                      showPage('profil');
                  } else {
                      showOtherUserProfile(userData.username); // Pass username, function will find UID
                  }
              };
              userDiv.style.cssText = `
                  background:#1f1f1f; padding:15px; border-radius:15px; margin-bottom:10px;
                  display:flex; align-items:center; gap:15px; cursor:pointer;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              `;
              userDiv.innerHTML = `
                  <div style="width:40px; height:40px; background:skyblue; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px;">${userData.username.charAt(0)}</div>
                  <span style="font-size:18px;">${userData.username}</span>
              `;
              userResultsContainer.appendChild(userDiv);
              userFound = true;
          }
      });
      if (!userFound) {
          userResultsContainer.innerHTML = '<p style="color:#aaa;">Tidak ada pengguna ditemukan.</p>';
      }

      // Search Posts (by title, content, author, tags)
      // This requires iterating through all groups' posts, which is not efficient for large datasets
      // A dedicated 'posts' top-level collection would be better for global search
      let allFoundPosts = [];
      for (const group of allGroups) {
          const postsSnapshot = await getDocs(collection(db, 'groups', group.id, 'posts'));
          postsSnapshot.forEach(postDoc => {
              const post = postDoc.data();
              if (
                  (post.title && post.title.toLowerCase().includes(queryText)) ||
                  (post.content && post.content.toLowerCase().includes(queryText)) ||
                  (post.author && post.author.toLowerCase().includes(queryText)) ||
                  (post.tags && post.tags.toLowerCase().includes(queryText))
              ) {
                  allFoundPosts.push({ id: postDoc.id, ...post, groupName: group.name, groupId: group.id });
              }
          });
      }

      postResultsContainer.innerHTML = '';
      if (allFoundPosts.length > 0) {
          allFoundPosts.forEach(post => {
              const postDiv = document.createElement('div');
              postDiv.style.cssText = `
                  background:#1f1f1f; padding:15px; border-radius:15px; margin-bottom:10px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              `;
              let mediaHtml = '';
              if (post.media && post.media.src) {
                  if (post.media.type === 'image') {
                      mediaHtml = `<img src="${post.media.src}" style="max-width:100%; border-radius:8px; margin-bottom:10px;">`;
                  } else if (post.media.type === 'video') {
                      mediaHtml = `<video src="${post.media.src}" controls style="max-width:100%; border-radius:8px; margin-bottom:10px;"></video>`;
                  }
              }
              postDiv.innerHTML = `
                  <div style="font-weight:bold; font-size:18px;">${post.title}</div>
                  <div style="font-size:14px; color:#aaa; margin-bottom:10px;">Oleh: ${post.author} ${post.groupName ? ` (Grup: ${post.groupName})` : ''}</div>
                  ${mediaHtml}
                  <p style="font-size:15px; margin-top:5px;">${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
                  ${post.tags ? `<div style="font-size:12px; color:#00c853; margin-top:5px;">${post.tags}</div>` : ''}
                  <button onclick="showSpecificGroup('${post.groupId}')" style="background:#00c853; color:#000; padding:8px 12px; border-radius:8px; cursor:pointer; border:none; margin-top:10px;">Lihat Postingan</button>
              `;
              postResultsContainer.appendChild(postDiv);
          });
      } else {
          postResultsContainer.innerHTML = '<p style="color:#aaa;">Tidak ada postingan ditemukan.</p>';
      }

      showPage('hasil-pencarian');
  } catch (error) {
      console.error("Error during search:", error);
      userResultsContainer.innerHTML = '<p style="color:#f44336;">Gagal melakukan pencarian pengguna.</p>';
      postResultsContainer.innerHTML = '<p style="color:#f44336;">Gagal melakukan pencarian postingan.</p>';
  }
}

// --- User Profile Management (Firebase Firestore) ---

async function updateMyProfile() {
  if (!currentUser.isLoggedIn || !currentUser.uid) {
      document.getElementById('myPostsContainer').innerHTML = '<p style="color:#aaa; text-align:center;">Silakan login untuk melihat profil Anda.</p>';
      return;
  }

  // Fetch latest user data from Firestore
  const userDocRef = doc(db, 'users', currentUser.uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      document.getElementById('myProfileUsername').innerText = userData.username;
      document.getElementById('myFansCount').innerText = userData.fans || 0;
      document.getElementById('myHattersCount').innerText = userData.hatters || 0;
  } else {
      document.getElementById('myProfileUsername').innerText = currentUser.username; // Fallback
      document.getElementById('myFansCount').innerText = currentUser.fans;
      document.getElementById('myHattersCount').innerText = currentUser.hatters;
  }

  const myPostsContainer = document.getElementById('myPostsContainer');
  myPostsContainer.innerHTML = '<p style="color:#aaa; text-align:center;">Memuat postingan Anda...</p>';

  try {
      // Fetch user's posts from all groups
      const myPostsQuery = query(collectionGroup(db, 'posts'), where('authorUid', '==', currentUser.uid), orderBy('timestamp', 'desc'));
      // Note: collectionGroup requires an index in Firestore.
      // If you don't want to create an index, you'll need to fetch posts group by group.

      const postsSnapshot = await getDocs(myPostsQuery);
      myPostsContainer.innerHTML = '';
      if (postsSnapshot.empty) {
          myPostsContainer.innerHTML = '<p style="color:#aaa; text-align:center;">Anda belum memiliki postingan.</p>';
      } else {
          postsSnapshot.forEach(doc => {
              const post = doc.data();
              const postElement = document.createElement('div');
              postElement.style.cssText = `
                  background:#1f1f1f; border-radius:15px; padding:15px; text-align:left; box-shadow: 0 2px 8px rgba(0,0,0,0.3); margin-bottom:10px;
              `;
              let mediaHtml = '';
              if (post.media && post.media.src) {
                  if (post.media.type === 'image') {
                      mediaHtml = `<img src="${post.media.src}" style="max-width:100%; border-radius:8px; margin-bottom:10px;">`;
                  } else if (post.media.type === 'video') {
                      mediaHtml = `<video src="${post.media.src}" controls style="max-width:100%; border-radius:8px; margin-bottom:10px;"></video>`;
                  }
              }

              // Get parent group name (assuming group ID is available in the post document path)
              const groupPathParts = doc.ref.path.split('/'); // e.g., 'groups/groupId/posts/postId'
              const groupId = groupPathParts[1];
              const group = allGroups.find(g => g.id === groupId);
              const groupName = group ? group.name : 'Grup Tidak Dikenal';

              postElement.innerHTML = `
                  <div style="font-weight:bold; font-size:18px; margin-bottom:8px;">${post.title}</div>
                  ${mediaHtml}
                  <div style="font-size:15px;">${post.content}</div>
                  <div style="font-size:13px; color:#aaa; margin-top:10px;">Diunggah di grup: <strong>${groupName}</strong></div>
                  <div style="font-size:12px; color:#aaa; margin-top:5px;">${new Date(post.timestamp).toLocaleString('id-ID')}</div>
              `;
              myPostsContainer.appendChild(postElement);
          });
      }
  } catch (error) {
      console.error("Error fetching my posts:", error);
      myPostsContainer.innerHTML = '<p style="color:#f44336; text-align:center;">Gagal memuat postingan Anda. Pastikan indeks collection group sudah dibuat di Firestore Console.</p>';
  }
}


let unsubscribeOtherUserPosts = null;
async function showOtherUserProfile(username, isPopState = false) {
  if (!currentUser.isLoggedIn) {
      alert('Anda harus login untuk melihat profil pengguna lain.');
      return;
  }
  // Find UID by username (assuming username is unique or primary identifier for display)
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
      alert('Pengguna tidak ditemukan.');
      return;
  }

  const userDoc = querySnapshot.docs[0];
  currentOtherUserUid = userDoc.id; // Store UID of the other user
  const userData = userDoc.data();

  document.getElementById('otherUserName').innerText = userData.username;
  document.getElementById('otherUserFansCount').innerText = userData.fans || 0;
  document.getElementById('otherUserHattersCount').innerText = userData.hatters || 0;

  // Determine fan/hatter status for current user
  const fanButton = document.getElementById('fanButton');
  const hatterButton = document.getElementById('hatterButton');
  const userFansOf = userData.fansOf || [];
  const userHattersOf = userData.hattersOf || [];

  if (userFansOf.includes(currentUser.uid)) {
      fanButton.style.background = '#00c853';
  } else {
      fanButton.style.background = '#555';
  }
  if (userHattersOf.includes(currentUser.uid)) {
      hatterButton.style.background = '#f44336';
  } else {
      hatterButton.style.background = '#555';
  }


  const otherUserPostsContainer = document.getElementById('otherUserPostsContainer');
  otherUserPostsContainer.innerHTML = '<p style="text-align:center; color:#aaa;">Memuat postingan pengguna ini...</p>';

  if (unsubscribeOtherUserPosts) {
      unsubscribeOtherUserPosts(); // Unsubscribe from previous listener
  }

  // Fetch other user's posts
  // This also requires a collection group index for 'posts'
  const otherUserPostsQuery = query(collectionGroup(db, 'posts'), where('authorUid', '==', currentOtherUserUid), orderBy('timestamp', 'desc'));
  unsubscribeOtherUserPosts = onSnapshot(otherUserPostsQuery, (snapshot) => {
      otherUserPostsContainer.innerHTML = '';
      if (snapshot.empty) {
          otherUserPostsContainer.innerHTML = '<p style="color:#aaa; text-align:center;">Pengguna ini belum memiliki postingan.</p>';
      } else {
          snapshot.forEach(doc => {
              const post = doc.data();
              const postElement = document.createElement('div');
              postElement.style.cssText = `
                  background:#1f1f1f; border-radius:15px; padding:15px; text-align:left; box-shadow: 0 2px 8px rgba(0,0,0,0.3); margin-bottom:10px;
              `;
              let mediaHtml = '';
              if (post.media && post.media.src) {
                  if (post.media.type === 'image') {
                      mediaHtml = `<img src="${post.media.src}" style="max-width:100%; border-radius:8px; margin-bottom:10px;">`;
                  } else if (post.media.type === 'video') {
                      mediaHtml = `<video src="${post.media.src}" controls style="max-width:100%; border-radius:8px; margin-bottom:10px;"></video>`;
                  }
              }
              const groupPathParts = doc.ref.path.split('/');
              const groupId = groupPathParts[1];
              const group = allGroups.find(g => g.id === groupId);
              const groupName = group ? group.name : 'Grup Tidak Dikenal';

              postElement.innerHTML = `
                  <div style="font-weight:bold; font-size:18px; margin-bottom:8px;">${post.title}</div>
                  ${mediaHtml}
                  <div style="font-size:15px;">${post.content}</div>
                  <div style="font-size:13px; color:#aaa; margin-top:10px;">Diunggah di grup: <strong>${groupName}</strong></div>
                  <div style="font-size:12px; color:#aaa; margin-top:5px;">${new Date(post.timestamp).toLocaleString('id-ID')}</div>
              `;
              otherUserPostsContainer.appendChild(postElement);
          });
      }
  }, (error) => {
      console.error("Error fetching other user's posts:", error);
      otherUserPostsContainer.innerHTML = '<p style="color:#f44336; text-align:center;">Gagal memuat postingan pengguna ini.</p>';
  });

  showPage('profil-user-lain', isPopState, { username: userData.username });
}


async function toggleFan() {
  if (!currentUser.isLoggedIn || !currentOtherUserUid || currentUser.uid === currentOtherUserUid) {
      alert('Anda tidak bisa melakukan ini atau Anda perlu login.');
      return;
  }

  const userDocRef = doc(db, 'users', currentOtherUserUid);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) return;

  const userData = userDocSnap.data();
  const fanButton = document.getElementById('fanButton');
  const hatterButton = document.getElementById('hatterButton');
  const currentUserUid = currentUser.uid;

  let fansOf = userData.fansOf || [];
  let hattersOf = userData.hattersOf || [];

  try {
      if (fansOf.includes(currentUserUid)) {
          // Already a fan, unfan
          await updateDoc(userDocRef, {
              fans: increment(-1),
              fansOf: arrayRemove(currentUserUid)
          });
          fanButton.style.background = '#555';
      } else {
          // Not a fan, become a fan
          await updateDoc(userDocRef, {
              fans: increment(1),
              fansOf: arrayUnion(currentUserUid)
          });
          fanButton.style.background = '#00c853';

          // If currently a hatter, remove hatter status
          if (hattersOf.includes(currentUserUid)) {
              await updateDoc(userDocRef, {
                  hatters: increment(-1),
                  hattersOf: arrayRemove(currentUserUid)
              });
              hatterButton.style.background = '#555';
          }
      }
      // UI update for counts should ideally be from Firestore listener for the user doc
      // For now, manually update
      const updatedUserSnap = await getDoc(userDocRef); // Re-fetch to get latest counts
      if(updatedUserSnap.exists()) {
        document.getElementById('otherUserFansCount').innerText = updatedUserSnap.data().fans || 0;
        document.getElementById('otherUserHattersCount').innerText = updatedUserSnap.data().hatters || 0;
      }

  } catch (error) {
      console.error("Error toggling fan status:", error);
      alert('Gagal mengubah status fan: ' + error.message);
  }
}

async function toggleHatter() {
  if (!currentUser.isLoggedIn || !currentOtherUserUid || currentUser.uid === currentOtherUserUid) {
      alert('Anda tidak bisa melakukan ini atau Anda perlu login.');
      return;
  }

  const userDocRef = doc(db, 'users', currentOtherUserUid);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) return;

  const userData = userDocSnap.data();
  const fanButton = document.getElementById('fanButton');
  const hatterButton = document.getElementById('hatterButton');
  const currentUserUid = currentUser.uid;

  let fansOf = userData.fansOf || [];
  let hattersOf = userData.hattersOf || [];

  try {
      if (hattersOf.includes(currentUserUid)) {
          // Already a hatter, unhatter
          await updateDoc(userDocRef, {
              hatters: increment(-1),
              hattersOf: arrayRemove(currentUserUid)
          });
          hatterButton.style.background = '#555';
      } else {
          // Not a hatter, become a hatter
          await updateDoc(userDocRef, {
              hatters: increment(1),
              hattersOf: arrayUnion(currentUserUid)
          });
          hatterButton.style.background = '#f44336';

          // If currently a fan, remove fan status
          if (fansOf.includes(currentUserUid)) {
              await updateDoc(userDocRef, {
                  fans: increment(-1),
                  fansOf: arrayRemove(currentUserUid)
              });
              fanButton.style.background = '#555';
          }
      }
      // UI update for counts should ideally be from Firestore listener for the user doc
      // For now, manually update
      const updatedUserSnap = await getDoc(userDocRef); // Re-fetch to get latest counts
      if(updatedUserSnap.exists()) {
        document.getElementById('otherUserFansCount').innerText = updatedUserSnap.data().fans || 0;
        document.getElementById('otherUserHattersCount').innerText = updatedUserSnap.data().hatters || 0;
      }
  } catch (error) {
      console.error("Error toggling hatter status:", error);
      alert('Gagal mengubah status hatter: ' + error.message);
  }
}
