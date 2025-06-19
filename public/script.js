// script.js
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');

    // Fungsi untuk menandai link navigasi yang aktif
    function setActiveNavLink() {
        const currentPath = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.main-nav a, .bottom-nav a, .create-post-btn');

        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href') ? link.getAttribute('href').split('/').pop() : '';

            link.classList.remove('active');

            if (linkPath === currentPath) {
                link.classList.add('active');
            }
        });
    }

    // Panggil saat halaman dimuat
    setActiveNavLink();

    // Tentukan tampilan sidebar dan bottom nav berdasarkan ukuran layar
    function adjustUIForScreenSize() {
        const bottomNav = document.querySelector('.bottom-nav');
        const isMessagesPage = document.body.classList.contains('messages-page');
        const isProfilePage = document.body.classList.contains('profile-page');
        const isCreatePostPage = document.body.classList.contains('create-post-page');
        const isSettingsPage = document.body.classList.contains('settings-page'); // Tambahkan cek halaman pengaturan

        if (window.innerWidth <= 768) {
            sidebar.style.display = 'none';
            // Sembunyikan bottom nav di halaman pesan, profil, buat postingan, atau pengaturan mobile
            if (isMessagesPage || isProfilePage || isCreatePostPage || isSettingsPage) {
                bottomNav.style.display = 'none';
            } else {
                bottomNav.style.display = 'flex';
            }
        } else {
            sidebar.style.display = 'flex';
            bottomNav.style.display = 'none';
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    }

    adjustUIForScreenSize();
    window.addEventListener('resize', adjustUIForScreenSize);

    // --- Fungsionalitas Firebase ---

    // Variabel global untuk instance Firebase (akan diisi dari firebase-config.js)
    let db, rtdb, firestore, realtimeDb, firebase, auth, storage; // Tambahkan 'auth' dan 'storage'

    // Fungsi untuk inisialisasi Firebase dan memuat data
    function initFirebaseAndLoadData() {
        // Cek apakah semua modul Firebase yang dibutuhkan sudah tersedia di window
        if (typeof window.db === 'undefined' || typeof window.rtdb === 'undefined' ||
            typeof window.auth === 'undefined' || typeof window.storage === 'undefined') {
            console.warn("Firebase belum diinisialisasi sepenuhnya. Menunggu...");
            setTimeout(initFirebaseAndLoadData, 100); // Coba lagi setelah sedikit penundaan
            return;
        }

        db = window.db;
        rtdb = window.rtdb;
        firestore = window.firestore;
        realtimeDb = window.realtimeDb;
        firebase = window.firebase; // Objek global yang berisi modul Firebase
        auth = window.auth; // Ambil instance Auth dari window
        storage = window.storage; // Ambil instance Storage dari window

        console.log("Firebase initialized in script.js.");

        // Panggil fungsi pemuatan data sesuai halaman yang aktif
        const currentPage = window.location.pathname.split('/').pop();
        switch (currentPage) {
            case 'index.html':
            case '':
                loadPosts();
                break;
            case 'notifications.html':
                loadNotifications();
                break;
            case 'messages.html':
                loadMessages();
                setupMessageCategories();
                break;
            case 'profile.html':
                loadUserProfile();
                loadUserPosts("user123"); // Default user ID, ganti dengan currentUser.uid
                break;
            case 'create_post.html':
                handlePostSubmission();
                setupMediaPreview();
                break;
            case 'settings.html':
                setupSettingsPage(); // Setup halaman pengaturan
                break;
            case 'explore.html':
                console.log("Halaman Explore dimuat.");
                // document.getElementById('explore-content').innerHTML = "<p>Ini adalah halaman untuk menjelajahi konten populer. (Akan segera diisi dengan data Firebase)</p>";
                break;
            default:
                console.log("Halaman tidak dikenal: ", currentPage);
        }
    }

    // Panggil inisialisasi Firebase setelah DOMContentLoaded
    initFirebaseAndLoadData();


    // Fungsi untuk memuat dan menampilkan Postingan di index.html
    const loadPosts = () => {
        const feedElement = document.getElementById('feed');
        if (!feedElement) return;

        console.log("Memuat postingan dari Firestore...");
        const postsRef = firestore.collection(db, "posts");
        const q = firestore.query(postsRef, firestore.orderBy("timestamp", "desc"));

        firestore.onSnapshot(q, (snapshot) => {
            feedElement.innerHTML = '';
            if (snapshot.empty) {
                feedElement.innerHTML = '<p style="text-align: center; color: var(--text-color-light);">Belum ada postingan.</p>';
                return;
            }

            snapshot.forEach((doc) => {
                const post = doc.data();
                const postId = doc.id;
                const postTime = post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Sekarang';
                const postImageHtml = post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image" class="post-image">` : '';

                const postCard = `
                    <div class="post-card">
                        <div class="post-header">
                            <img src="${post.userPic || 'https://via.placeholder.com/50'}" alt="Profil User" class="post-user-pic">
                            <div class="post-info">
                                <h4>${post.author || 'Anonim'} <span class="username">@${(post.author || 'anonim').replace(/\s+/g, '_').toLowerCase()}</span></h4>
                                <span class="post-time">${postTime}</span>
                            </div>
                            <i class="fas fa-ellipsis-h post-options"></i>
                        </div>
                        <div class="post-content">
                            <p>${post.text}</p>
                            ${postImageHtml}
                        </div>
                        <div class="post-actions">
                            <span class="action-btn"><i class="far fa-heart"></i> ${post.likes || 0}</span>
                            <span class="action-btn"><i class="far fa-comment"></i> ${post.comments || 0}</span>
                            <span class="action-btn"><i class="far fa-share-square"></i> ${post.shares || 0}</span>
                        </div>
                    </div>
                `;
                feedElement.innerHTML += postCard;
            });
        }, (error) => {
            console.error("Error fetching posts: ", error);
            feedElement.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat postingan. Error: ' + error.message + '</p>';
        });
    };

    // Fungsi untuk memuat dan menampilkan Notifikasi di notifications.html
    const loadNotifications = () => {
        const notificationsList = document.getElementById('notifications-list');
        if (!notificationsList) return;

        console.log("Memuat notifikasi dari Realtime Database...");
        const notificationsRef = realtimeDb.ref(rtdb, 'public_notifications');

        realtimeDb.onValue(notificationsRef, (snapshot) => {
            notificationsList.innerHTML = '';
            if (!snapshot.exists() || snapshot.val() === null) {
                notificationsList.innerHTML = '<p>Belum ada notifikasi.</p>';
                return;
            }

            const notifications = [];
            snapshot.forEach((childSnapshot) => {
                notifications.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });

            notifications.sort((a, b) => b.timestamp - a.timestamp);

            notifications.forEach(notification => {
                const li = document.createElement('li');
                const time = notification.timestamp ? new Date(notification.timestamp).toLocaleString() : 'Tersedia';
                li.style.cssText = "padding: 10px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 10px;";
                li.innerHTML = `
                    <i class="fas ${getNotificationIcon(notification.type)}" style="color: var(--primary-color);"></i>
                    <div>
                        <strong>${notification.type || 'Umum'}:</strong> ${notification.message}
                        <br><small style="color: var(--text-color-light);">${time}</small>
                    </div>
                `;
                notificationsList.appendChild(li);
            });
        }, (errorObject) => {
            console.error('Error reading notifications: ' + errorObject.name, errorObject);
            notificationsList.innerHTML = '<p>Gagal memuat notifikasi.</p>';
        });
    };

    function getNotificationIcon(type) {
        switch (type) {
            case "Postingan Baru": return "fa-sticky-note";
            case "Pengikut Baru": return "fa-user-plus";
            case "Suka Postingan": return "fa-heart";
            case "Komentar Baru": return "fa-comment";
            case "Pesan Baru": return "fa-envelope";
            default: return "fa-info-circle";
        }
    }


    // Fungsi untuk memuat dan menampilkan Pesan di messages.html
    const loadMessages = (category = 'all') => {
        const messagesList = document.getElementById('messages-list');
        if (!messagesList) return;

        messagesList.innerHTML = '<p style="text-align: center; color: var(--text-color-light);">Memuat pesan...</p>';
        console.log(`Memuat pesan kategori: ${category} dari Realtime Database...`);

        const messagesRef = realtimeDb.ref(rtdb, 'public_messages');

        realtimeDb.onValue(messagesRef, (snapshot) => {
            messagesList.innerHTML = '';
            if (!snapshot.exists() || snapshot.val() === null) {
                messagesList.innerHTML = '<p style="text-align: center; color: var(--text-color-light);">Belum ada pesan.</p>';
                return;
            }

            const messageItems = [];
            snapshot.forEach((childSnapshot) => {
                const message = childSnapshot.val();
                messageItems.push({
                    id: childSnapshot.key,
                    ...message
                });
            });

            let filteredMessages = messageItems;
            if (category === 'unread') {
                filteredMessages = messageItems.filter(msg => !msg.isRead);
            } else if (category === 'groups') {
                filteredMessages = messageItems.filter(msg => msg.isGroup);
            } else if (category === 'requests') {
                filteredMessages = messageItems.filter(msg => msg.isRequest);
            }
            filteredMessages.sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));


            if (filteredMessages.length === 0) {
                 messagesList.innerHTML = `<p style="text-align: center; color: var(--text-color-light);">Tidak ada pesan di kategori ini.</p>`;
                 return;
            }


            filteredMessages.forEach(msg => {
                const senderName = msg.lastMessage ? msg.lastMessage.sender : (msg.sender || 'Unknown');
                const lastMsgText = msg.lastMessage ? msg.lastMessage.text : (msg.text || 'Tidak ada pesan.');
                const lastMsgTime = msg.lastMessage && msg.lastMessage.timestamp ? new Date(msg.lastMessage.timestamp).toLocaleString() : '';

                const messageItem = document.createElement('div');
                messageItem.classList.add('message-item');
                messageItem.addEventListener('click', () => {
                    alert(`Membuka percakapan dengan ${senderName}. ID Chat: ${msg.id}`);
                });
                
                messageItem.innerHTML = `
                    <img src="${msg.userPic || 'https://via.placeholder.com/50'}" alt="User Pic">
                    <div class="message-content">
                        <h4>${senderName}</h4>
                        <p>${lastMsgText}</p>
                    </div>
                    <span class="message-time">${lastMsgTime}</span>
                `;
                messagesList.appendChild(messageItem);
            });
        }, (errorObject) => {
            console.error('Error reading messages: ' + errorObject.name, errorObject);
            messagesList.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat pesan.</p>';
        });
    };

    const setupMessageCategories = () => {
        const categoriesContainer = document.querySelector('.message-categories');
        if (!categoriesContainer) return;

        categoriesContainer.addEventListener('click', (e) => {
            const clickedSpan = e.target.closest('span');
            if (clickedSpan && clickedSpan.dataset.category) {
                categoriesContainer.querySelectorAll('span').forEach(span => {
                    span.classList.remove('active');
                });
                clickedSpan.classList.add('active');
                loadMessages(clickedSpan.dataset.category);
            }
        });
    };


    // Fungsi untuk memuat Profil Pengguna di profile.html
    const loadUserProfile = async () => {
        const profileAvatar = document.getElementById('profile-avatar');
        const profileUsername = document.getElementById('profile-username');
        const profileHandle = document.getElementById('profile-handle');
        const profileBio = document.getElementById('profile-bio');
        const statPosts = document.getElementById('stat-posts');
        const statFans = document.getElementById('stat-fans');
        const statHaters = document.getElementById('stat-haters');

        if (!profileUsername) return;

        console.log("Memuat data profil dari Firestore...");
        
        let currentUser = auth.currentUser;
        let userId = currentUser ? currentUser.uid : 'user123'; // Gunakan UID asli atau dummy

        const userDocRef = firestore.doc(db, "users", userId);

        try {
            const docSnapshot = await firestore.getDoc(userDocRef);
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                profileAvatar.src = userData.profilePic || 'https://via.placeholder.com/100';
                profileUsername.textContent = userData.name || 'Nama Pengguna';
                profileHandle.textContent = `@${(userData.username || 'username').replace(/\s+/g, '_').toLowerCase()}`;
                profileBio.textContent = userData.bio || 'Belum ada bio.';
                
                statFans.textContent = userData.followers || 0;
                statHaters.textContent = userData.following || 0;
                
                const postsQuery = firestore.query(firestore.collection(db, "posts"), firestore.where("authorId", "==", userId));
                const postsSnapshot = await firestore.getDocs(postsQuery);
                statPosts.textContent = postsSnapshot.size;

            } else {
                console.warn("Data profil tidak ditemukan. Membuat data dummy...");
                if (!currentUser) { // Hanya buat dummy jika tidak ada user login
                    await firestore.setDoc(userDocRef, {
                        name: "John Doe",
                        username: "johndoe",
                        bio: "Seorang penggemar Funhub! Suka berbagi momen dan berinteraksi.",
                        email: "john.doe@example.com",
                        profilePic: "https://via.placeholder.com/100/FF5733/FFFFFF?text=JD",
                        followers: 10,
                        following: 5
                    });
                    console.log("Data profil dummy berhasil dibuat. Refresh halaman.");
                    loadUserProfile(); // Muat ulang profil setelah membuat dummy
                } else {
                    profileUsername.textContent = "Profil Kosong";
                    profileHandle.textContent = "@no_profile";
                    profileBio.textContent = "Silakan lengkapi profil Anda di Pengaturan.";
                }
            }
        } catch (error) {
            console.error("Error fetching user profile: ", error);
            profileUsername.textContent = "Gagal memuat profil.";
            profileHandle.textContent = "";
            profileBio.textContent = "Terjadi kesalahan saat memuat data profil.";
        }
    };

    const loadUserPosts = (userId) => {
        const userPostsGrid = document.getElementById('user-posts-grid');
        if (!userPostsGrid) return;

        userPostsGrid.innerHTML = '<p style="text-align: center; color: var(--text-color-light);">Memuat postingan Anda...</p>';
        console.log(`Memuat postingan untuk pengguna: ${userId}`);

        const postsRef = firestore.collection(db, "posts");
        const q = firestore.query(
            postsRef,
            firestore.where("authorId", "==", userId),
            firestore.orderBy("timestamp", "desc")
        );

        firestore.onSnapshot(q, (snapshot) => {
            userPostsGrid.innerHTML = '';
            if (snapshot.empty) {
                userPostsGrid.innerHTML = '<p style="text-align: center; color: var(--text-color-light);">Belum ada postingan dari Anda.</p>';
                return;
            }

            snapshot.forEach((doc) => {
                const post = doc.data();
                const postTime = post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Sekarang';
                const postImageHtml = post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image" class="post-image">` : '';

                const postCard = `
                    <div class="post-card">
                        <div class="post-header">
                            <img src="${post.userPic || 'https://via.placeholder.com/50'}" alt="Profil User" class="post-user-pic">
                            <div class="post-info">
                                <h4>${post.author || 'Anonim'} <span class="username">@${(post.author || 'anonim').replace(/\s+/g, '_').toLowerCase()}</span></h4>
                                <span class="post-time">${postTime}</span>
                            </div>
                            <i class="fas fa-ellipsis-h post-options"></i>
                        </div>
                        <div class="post-content">
                            <p>${post.text}</p>
                            ${postImageHtml}
                        </div>
                        <div class="post-actions">
                            <span class="action-btn"><i class="far fa-heart"></i> ${post.likes || 0}</span>
                            <span class="action-btn"><i class="far fa-comment"></i> ${post.comments || 0}</span>
                            <span class="action-btn"><i class="far fa-share-square"></i> ${post.shares || 0}</span>
                        </div>
                    </div>
                `;
                userPostsGrid.innerHTML += postCard;
            });
        }, (error) => {
            console.error("Error fetching user posts: ", error);
            userPostsGrid.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat postingan Anda. Error: ' + error.message + '</p>';
        });
    };


    // Fungsi untuk mengirim Postingan Baru di create_post.html
    const handlePostSubmission = () => {
        const postForm = document.getElementById('post-form');
        if (!postForm) return;

        const uploadStatus = document.getElementById('upload-status');
        const postText = document.getElementById('post-text');
        const postImageInput = document.getElementById('post-image');

        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            uploadStatus.textContent = 'Mengunggah postingan...';
            uploadStatus.style.color = 'var(--text-color-light)';

            const text = postText.value.trim();
            const imageFile = postImageInput.files[0];

            if (!text && !imageFile) {
                uploadStatus.textContent = 'Postingan tidak boleh kosong!';
                uploadStatus.style.color = 'red';
                return;
            }

            let imageUrl = null;
            let fileType = null;

            if (imageFile && typeof firebase.storage !== 'undefined' && storage) {
                try {
                    const storageRef = firebase.storage.ref(storage, `post_media/${imageFile.name}_${Date.now()}`);
                    const uploadTask = firebase.storage.uploadBytesResumable(storageRef, imageFile);

                    await new Promise((resolve, reject) => {
                        uploadTask.on('state_changed',
                            (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                uploadStatus.textContent = `Mengunggah: ${progress.toFixed(0)}%`;
                            },
                            (error) => {
                                reject(error);
                            },
                            () => {
                                firebase.storage.getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                                    imageUrl = downloadURL;
                                    fileType = imageFile.type.startsWith('image') ? 'image' : 'video';
                                    resolve();
                                });
                            }
                        );
                    });
                    console.log("Media berhasil diupload:", imageUrl);
                } catch (error) {
                    console.error("Error uploading media: ", error);
                    uploadStatus.textContent = 'Gagal mengupload media: ' + error.message;
                    uploadStatus.style.color = 'red';
                    return;
                }
            } else if (imageFile) {
                 uploadStatus.textContent = 'Firebase Storage tidak diinisialisasi atau belum tersedia.';
                 uploadStatus.style.color = 'orange';
            }


            try {
                let currentUser = auth.currentUser;
                let currentUserId = currentUser ? currentUser.uid : "user123";
                let currentUserDisplayName = currentUser ? currentUser.displayName || "Anonim" : "John Doe";
                let currentUserProfilePic = currentUser ? currentUser.photoURL || "https://via.placeholder.com/50/FF5733" : "https://via.placeholder.com/50/FF5733";

                await firestore.addDoc(firestore.collection(db, "posts"), {
                    text: text,
                    imageUrl: imageUrl,
                    mediaType: fileType,
                    author: currentUserDisplayName,
                    authorId: currentUserId,
                    userPic: currentUserProfilePic,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log("Postingan berhasil disimpan di Firestore.");

                realtimeDb.push(realtimeDb.ref(rtdb, 'public_notifications'), {
                    type: "Postingan Baru",
                    message: `Pengguna ${currentUserDisplayName} baru saja membuat postingan baru!`,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
                console.log("Notifikasi postingan baru ditambahkan ke Realtime Database.");

                uploadStatus.textContent = 'Postingan berhasil diunggah!';
                uploadStatus.style.color = 'green';
                postForm.reset();
                document.getElementById('media-preview-container').innerHTML = '<span class="placeholder-text">Pratinjau media akan muncul di sini</span>';
                
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);

            } catch (error) {
                console.error("Error adding post to Firestore: ", error);
                uploadStatus.textContent = 'Gagal mengunggah postingan: ' + error.message;
                uploadStatus.style.color = 'red';
            }
        });
    };

    // Fungsi untuk setup pratinjau media di create_post
    const setupMediaPreview = () => {
        const postImageInput = document.getElementById('post-image');
        const uploadMediaBtn = document.getElementById('upload-media-btn');
        const mediaPreviewContainer = document.getElementById('media-preview-container');

        if (uploadMediaBtn) {
            uploadMediaBtn.addEventListener('click', () => {
                postImageInput.click();
            });
        }

        if (postImageInput) {
            postImageInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        mediaPreviewContainer.innerHTML = '';
                        let mediaElement;
                        if (file.type.startsWith('image')) {
                            mediaElement = document.createElement('img');
                            mediaElement.src = e.target.result;
                            mediaElement.alt = "Image Preview";
                        } else if (file.type.startsWith('video')) {
                            mediaElement = document.createElement('video');
                            mediaElement.src = e.target.result;
                            mediaElement.controls = true;
                            mediaElement.autoplay = false;
                        } else {
                            mediaPreviewContainer.innerHTML = '<span class="placeholder-text" style="color:red;">Format file tidak didukung.</span>';
                            return;
                        }
                        
                        const removeButton = document.createElement('button');
                        removeButton.classList.add('remove-media-btn');
                        removeButton.innerHTML = '<i class="fas fa-times"></i>';
                        removeButton.title = 'Hapus Media';
                        removeButton.addEventListener('click', () => {
                            mediaPreviewContainer.innerHTML = '<span class="placeholder-text">Pratinjau media akan muncul di sini</span>';
                            postImageInput.value = '';
                        });

                        mediaPreviewContainer.appendChild(mediaElement);
                        mediaPreviewContainer.appendChild(removeButton);
                    };
                    reader.readAsDataURL(file);
                } else {
                    mediaPreviewContainer.innerHTML = '<span class="placeholder-text">Pratinjau media akan muncul di sini</span>';
                }
            });
        }
    };


    // --- Fungsionalitas Halaman Pengaturan (settings.html) ---
    const setupSettingsPage = () => {
        console.log("Setting up settings page functions.");

        const profilePicInput = document.getElementById('edit-profile-pic');
        const currentProfilePic = document.getElementById('current-profile-pic');
        const profilePicPreviewContainer = document.getElementById('profile-pic-preview-container');

        // Load current user data into edit profile form
        const loadSettingsProfile = async () => {
            let currentUser = auth.currentUser;
            if (!currentUser) {
                console.log("No user logged in for settings profile.");
                // Sembunyikan form atau tampilkan pesan
                document.getElementById('edit-profile-form').innerHTML = '<p style="text-align: center; color: var(--text-color-light);">Silakan login untuk mengedit profil Anda.</p>';
                return;
            }

            const userId = currentUser.uid;
            const userDocRef = firestore.doc(db, "users", userId);
            try {
                const docSnapshot = await firestore.getDoc(userDocRef);
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    document.getElementById('edit-name').value = userData.name || '';
                    document.getElementById('edit-username').value = userData.username || '';
                    document.getElementById('edit-bio').value = userData.bio || '';
                    currentProfilePic.src = userData.profilePic || currentUser.photoURL || 'https://via.placeholder.com/100';
                } else {
                    console.log("User document not found in Firestore for settings.");
                    // Pre-fill with Auth data if Firestore doc doesn't exist
                    document.getElementById('edit-name').value = currentUser.displayName || '';
                    document.getElementById('edit-username').value = currentUser.email ? currentUser.email.split('@')[0] : '';
                    document.getElementById('edit-bio').value = '';
                    currentProfilePic.src = currentUser.photoURL || 'https://via.placeholder.com/100';
                }
            } catch (error) {
                console.error("Error loading settings profile: ", error);
            }
        };

        // Handle profile picture preview
        if (profilePicInput) {
            profilePicInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        currentProfilePic.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Handle Edit Profile Form Submission
        const editProfileForm = document.getElementById('edit-profile-form');
        const profileStatus = document.getElementById('profile-status');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                profileStatus.textContent = 'Menyimpan perubahan...';
                profileStatus.style.color = 'var(--text-color-light)';

                let currentUser = auth.currentUser;
                if (!currentUser) {
                    profileStatus.textContent = 'Anda harus login untuk mengedit profil.';
                    profileStatus.style.color = 'red';
                    return;
                }

                const newName = document.getElementById('edit-name').value;
                const newUsername = document.getElementById('edit-username').value;
                const newBio = document.getElementById('edit-bio').value;
                const newProfilePicFile = document.getElementById('edit-profile-pic').files[0];

                let newProfilePicUrl = currentProfilePic.src; // Default ke URL saat ini

                // Upload new profile picture if selected
                if (newProfilePicFile && typeof firebase.storage !== 'undefined' && storage) {
                    try {
                        const storageRefPath = `profile_pics/${currentUser.uid}/${newProfilePicFile.name}_${Date.now()}`;
                        const profilePicStorageRef = firebase.storage.ref(storage, storageRefPath);
                        await firebase.storage.uploadBytes(profilePicStorageRef, newProfilePicFile);
                        newProfilePicUrl = await firebase.storage.getDownloadURL(profilePicStorageRef);
                        console.log("New profile picture uploaded:", newProfilePicUrl);
                    } catch (error) {
                        console.error("Error uploading new profile picture: ", error);
                        profileStatus.textContent = 'Gagal mengupload foto profil: ' + error.message;
                        profileStatus.style.color = 'red';
                        return;
                    }
                }

                try {
                    // Update user profile in Firestore
                    const userDocRef = firestore.doc(db, "users", currentUser.uid);
                    await firestore.setDoc(userDocRef, {
                        name: newName,
                        username: newUsername,
                        bio: newBio,
                        profilePic: newProfilePicUrl,
                        email: currentUser.email, // Pastikan email disimpan juga
                        // Keep existing followers/following if not updated
                        followers: (await firestore.getDoc(userDocRef)).data()?.followers || 0,
                        following: (await firestore.getDoc(userDocRef)).data()?.following || 0
                    }, { merge: true }); // Gunakan merge agar tidak menimpa field lain

                    // Update Firebase Auth profile (optional but good practice)
                    await firebase.auth.updateProfile(currentUser, {
                        displayName: newName,
                        photoURL: newProfilePicUrl
                    });

                    profileStatus.textContent = 'Profil berhasil diperbarui!';
                    profileStatus.style.color = 'green';
                    // Refresh data profil di halaman profil jika perlu
                    if (window.location.pathname.includes('profile.html')) {
                        loadUserProfile();
                    }
                } catch (error) {
                    console.error("Error updating profile: ", error);
                    profileStatus.textContent = 'Gagal memperbarui profil: ' + error.message;
                    profileStatus.style.color = 'red';
                }
            });
        }

        // Handle Change Password Form Submission
        const changePasswordForm = document.getElementById('change-password-form');
        const passwordStatus = document.getElementById('password-status');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                passwordStatus.textContent = 'Mengubah password...';
                passwordStatus.style.color = 'var(--text-color-light)';

                const currentPassword = document.getElementById('current-password').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;

                let currentUser = auth.currentUser;
                if (!currentUser) {
                    passwordStatus.textContent = 'Anda harus login untuk mengubah password.';
                    passwordStatus.style.color = 'red';
                    return;
                }

                if (newPassword !== confirmPassword) {
                    passwordStatus.textContent = 'Password baru tidak cocok.';
                    passwordStatus.style.color = 'red';
                    return;
                }

                if (newPassword.length < 6) {
                    passwordStatus.textContent = 'Password baru minimal 6 karakter.';
                    passwordStatus.style.color = 'red';
                    return;
                }

                try {
                    // Re-authenticate user (required for security-sensitive operations)
                    const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPassword);
                    await firebase.auth.reauthenticateWithCredential(currentUser, credential);

                    // Update password
                    await firebase.auth.updatePassword(currentUser, newPassword);
                    
                    passwordStatus.textContent = 'Password berhasil diubah!';
                    passwordStatus.style.color = 'green';
                    changePasswordForm.reset();
                } catch (error) {
                    console.error("Error changing password: ", error);
                    if (error.code === 'auth/wrong-password') {
                        passwordStatus.textContent = 'Password lama salah.';
                    } else if (error.code === 'auth/weak-password') {
                         passwordStatus.textContent = 'Password terlalu lemah.';
                    } else {
                        passwordStatus.textContent = 'Gagal mengubah password: ' + error.message;
                    }
                    passwordStatus.style.color = 'red';
                }
            });
        }

        // Handle Dark Mode Toggle
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            const isDarkMode = localStorage.getItem('darkMode') === 'true';
            document.body.classList.toggle('dark-mode', isDarkMode);
            darkModeToggle.checked = isDarkMode;

            darkModeToggle.addEventListener('change', () => {
                if (darkModeToggle.checked) {
                    document.body.classList.add('dark-mode');
                    localStorage.setItem('darkMode', 'true');
                } else {
                    document.body.classList.remove('dark-mode');
                    localStorage.setItem('darkMode', 'false');
                }
            });
        }

        // Login/Logout button logic
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const authStatus = document.getElementById('auth-status');

        if (loginBtn && logoutBtn) {
            // Listen for auth state changes
            firebase.auth.onAuthStateChanged(auth, (user) => {
                if (user) {
                    // User is signed in
                    loginBtn.style.display = 'none';
                    logoutBtn.style.display = 'block';
                    authStatus.textContent = `Anda login sebagai: ${user.email || user.displayName}`;
                    authStatus.style.color = 'green';
                    loadSettingsProfile(); // Muat profil jika sudah login
                } else {
                    // User is signed out
                    loginBtn.style.display = 'block';
                    logoutBtn.style.display = 'none';
                    authStatus.textContent = 'Anda belum login.';
                    authStatus.style.color = 'red';
                    // Sembunyikan form edit profil jika tidak ada user
                    document.getElementById('edit-profile-form').innerHTML = '<p style="text-align: center; color: var(--text-color-light);">Silakan login untuk mengedit profil Anda.</p>';
                    document.getElementById('change-password-form').innerHTML = '<p style="text-align: center; color: var(--text-color-light);">Silakan login untuk mengubah password Anda.</p>';
                }
            });

            loginBtn.addEventListener('click', async () => {
                // Contoh login sederhana (Anda perlu mengarahkan ke halaman login atau menampilkan modal)
                alert("Mengarahkan ke halaman login. (Fungsionalitas login perlu diimplementasikan)");
                // Contoh: window.location.href = 'login.html';
                // Atau tampilkan modal login
                
                // Untuk demo, asumsikan sukses login setelah alert
                // const email = prompt("Enter your email:");
                // const password = prompt("Enter your password:");
                // if (email && password) {
                //     try {
                //         await firebase.auth.signInWithEmailAndPassword(auth, email, password);
                //         console.log("Logged in successfully!");
                //     } catch (error) {
                //         alert("Login failed: " + error.message);
                //         console.error("Login failed:", error);
                //     }
                // }
            });

            logoutBtn.addEventListener('click', async () => {
                try {
                    await firebase.auth.signOut(auth);
                    console.log("Logged out successfully!");
                    alert("Anda telah logout.");
                    window.location.reload(); // Refresh halaman setelah logout
                } catch (error) {
                    console.error("Logout failed:", error);
                    alert("Gagal logout: " + error.message);
                }
            });
        }
    };
});


// script.js
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');

    // Fungsi untuk menandai link navigasi yang aktif
    function setActiveNavLink() {
        const currentPath = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.main-nav a, .bottom-nav a, .create-post-btn');

        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href') ? link.getAttribute('href').split('/').pop() : '';

            link.classList.remove('active');

            if (linkPath === currentPath) {
                link.classList.add('active');
            }
        });
    }

    // Panggil saat halaman dimuat
    setActiveNavLink();

    // Tentukan tampilan sidebar dan bottom nav berdasarkan ukuran layar
    function adjustUIForScreenSize() {
        const bottomNav = document.querySelector('.bottom-nav');
        const isMessagesPage = document.body.classList.contains('messages-page');
        const isProfilePage = document.body.classList.contains('profile-page');
        const isCreatePostPage = document.body.classList.contains('create-post-page');
        const isSettingsPage = document.body.classList.contains('settings-page');
        const isEditProfilePage = document.body.classList.contains('edit-profile-page'); // New
        const isChangePasswordPage = document.body.classList.contains('change-password-page'); // New

        if (window.innerWidth <= 768) {
            sidebar.style.display = 'none';
            // Sembunyikan bottom nav di halaman pesan, profil, buat postingan, pengaturan, edit profil, atau ganti password mobile
            if (isMessagesPage || isProfilePage || isCreatePostPage || isSettingsPage || isEditProfilePage || isChangePasswordPage) {
                bottomNav.style.display = 'none';
            } else {
                bottomNav.style.display = 'flex';
            }
        } else {
            sidebar.style.display = 'flex';
            bottomNav.style.display = 'none';
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    }

    adjustUIForScreenSize();
    window.addEventListener('resize', adjustUIForScreenSize);

    // --- Fungsionalitas Firebase ---

    let db, rtdb, firestore, realtimeDb, firebase, auth, storage;

    function initFirebaseAndLoadData() {
        if (typeof window.db === 'undefined' || typeof window.rtdb === 'undefined' ||
            typeof window.auth === 'undefined' || typeof window.storage === 'undefined') {
            console.warn("Firebase belum diinisialisasi sepenuhnya. Menunggu...");
            setTimeout(initFirebaseAndLoadData, 100);
            return;
        }

        db = window.db;
        rtdb = window.rtdb;
        firestore = window.firestore;
        realtimeDb = window.realtimeDb;
        firebase = window.firebase;
        auth = window.auth;
        storage = window.storage;

        console.log("Firebase initialized in script.js.");

        const currentPage = window.location.pathname.split('/').pop();
        switch (currentPage) {
            case 'index.html':
            case '':
                loadPosts();
                break;
            case 'notifications.html':
                loadNotifications();
                break;
            case 'messages.html':
                loadMessages();
                setupMessageCategories();
                break;
            case 'profile.html':
                loadUserProfile();
                loadUserPosts("user123");
                break;
            case 'create_post.html':
                handlePostSubmission();
                setupMediaPreview();
                break;
            case 'settings.html':
                setupSettingsPage(); // Hanya untuk tombol logout dan mode gelap
                break;
            case 'edit_profile.html': // New page
                setupEditProfilePage();
                break;
            case 'change_password.html': // New page
                setupChangePasswordPage();
                break;
            case 'explore.html':
                console.log("Halaman Explore dimuat.");
                break;
            default:
                console.log("Halaman tidak dikenal: ", currentPage);
        }
    }

    initFirebaseAndLoadData();

    // Fungsi untuk memuat dan menampilkan Postingan di index.html (tetap sama)
    const loadPosts = () => { /* ... existing code ... */ };

    // Fungsi untuk memuat dan menampilkan Notifikasi di notifications.html (tetap sama)
    const loadNotifications = () => { /* ... existing code ... */ };
    function getNotificationIcon(type) { /* ... existing code ... */ }

    // Fungsi untuk memuat dan menampilkan Pesan di messages.html (tetap sama)
    const loadMessages = (category = 'all') => { /* ... existing code ... */ };
    const setupMessageCategories = () => { /* ... existing code ... */ };

    // Fungsi untuk memuat Profil Pengguna di profile.html (tetap sama)
    const loadUserProfile = async () => { /* ... existing code ... */ };
    const loadUserPosts = (userId) => { /* ... existing code ... */ };

    // Fungsi untuk mengirim Postingan Baru di create_post.html (tetap sama)
    const handlePostSubmission = () => { /* ... existing code ... */ };
    const setupMediaPreview = () => { /* ... existing code ... */ };


    // --- Fungsionalitas Halaman Pengaturan (settings.html) ---
    const setupSettingsPage = () => {
        console.log("Setting up settings page functions.");

        // Handle Dark Mode Toggle
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            const isDarkMode = localStorage.getItem('darkMode') === 'true';
            document.body.classList.toggle('dark-mode', isDarkMode);
            darkModeToggle.checked = isDarkMode;

            darkModeToggle.addEventListener('change', () => {
                if (darkModeToggle.checked) {
                    document.body.classList.add('dark-mode');
                    localStorage.setItem('darkMode', 'true');
                } else {
                    document.body.classList.remove('dark-mode');
                    localStorage.setItem('darkMode', 'false');
                }
            });
        }

        // Logout button logic
        const logoutSection = document.getElementById('logout-section');
        const logoutBtn = document.getElementById('logout-btn');
        const authStatus = document.getElementById('auth-status');

        if (logoutBtn) {
            // Listen for auth state changes
            firebase.auth.onAuthStateChanged(auth, (user) => {
                if (user) {
                    // User is signed in
                    logoutSection.style.display = 'block'; // Tampilkan bagian logout
                    authStatus.textContent = `Anda login sebagai: ${user.email || user.displayName}`;
                    authStatus.style.color = 'green';
                } else {
                    // User is signed out
                    logoutSection.style.display = 'none'; // Sembunyikan bagian logout
                    authStatus.textContent = 'Anda belum login.';
                    authStatus.style.color = 'red';
                }
            });

            logoutBtn.addEventListener('click', async () => {
                try {
                    await firebase.auth.signOut(auth);
                    console.log("Logged out successfully!");
                    alert("Anda telah logout.");
                    window.location.reload(); // Refresh halaman setelah logout
                } catch (error) {
                    console.error("Logout failed:", error);
                    alert("Gagal logout: " + error.message);
                }
            });
        }
    };

    // --- Fungsionalitas Halaman Edit Profil (edit_profile.html) ---
    const setupEditProfilePage = () => {
        console.log("Setting up edit profile page functions.");

        const profilePicInput = document.getElementById('edit-profile-pic');
        const currentProfilePic = document.getElementById('current-profile-pic');
        const profilePicPreviewContainer = document.getElementById('profile-pic-preview-container');
        const editProfileForm = document.getElementById('edit-profile-form');
        const profileStatus = document.getElementById('profile-status');

        // Load current user data into edit profile form
        const loadEditProfileData = async () => {
            let currentUser = auth.currentUser;
            if (!currentUser) {
                console.log("No user logged in for edit profile.");
                editProfileForm.innerHTML = '<p style="text-align: center; color: var(--text-color-light);">Silakan login untuk mengedit profil Anda.</p>';
                return;
            }

            const userId = currentUser.uid;
            const userDocRef = firestore.doc(db, "users", userId);
            try {
                const docSnapshot = await firestore.getDoc(userDocRef);
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    document.getElementById('edit-name').value = userData.name || '';
                    document.getElementById('edit-username').value = userData.username || '';
                    document.getElementById('edit-bio').value = userData.bio || '';
                    currentProfilePic.src = userData.profilePic || currentUser.photoURL || 'https://via.placeholder.com/100';
                } else {
                    console.log("User document not found in Firestore for edit profile.");
                    document.getElementById('edit-name').value = currentUser.displayName || '';
                    document.getElementById('edit-username').value = currentUser.email ? currentUser.email.split('@')[0] : '';
                    document.getElementById('edit-bio').value = '';
                    currentProfilePic.src = currentUser.photoURL || 'https://via.placeholder.com/100';
                }
            } catch (error) {
                console.error("Error loading edit profile data: ", error);
            }
        };
        loadEditProfileData(); // Call on page load

        // Handle profile picture preview
        if (profilePicInput) {
            profilePicInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        currentProfilePic.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Handle Edit Profile Form Submission
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                profileStatus.textContent = 'Menyimpan perubahan...';
                profileStatus.style.color = 'var(--text-color-light)';

                let currentUser = auth.currentUser;
                if (!currentUser) {
                    profileStatus.textContent = 'Anda harus login untuk mengedit profil.';
                    profileStatus.style.color = 'red';
                    return;
                }

                const newName = document.getElementById('edit-name').value;
                const newUsername = document.getElementById('edit-username').value;
                const newBio = document.getElementById('edit-bio').value;
                const newProfilePicFile = document.getElementById('edit-profile-pic').files[0];

                let newProfilePicUrl = currentProfilePic.src;

                if (newProfilePicFile && typeof firebase.storage !== 'undefined' && storage) {
                    try {
                        const storageRefPath = `profile_pics/${currentUser.uid}/${newProfilePicFile.name}_${Date.now()}`;
                        const profilePicStorageRef = firebase.storage.ref(storage, storageRefPath);
                        await firebase.storage.uploadBytes(profilePicStorageRef, newProfilePicFile);
                        newProfilePicUrl = await firebase.storage.getDownloadURL(profilePicStorageRef);
                        console.log("New profile picture uploaded:", newProfilePicUrl);
                    } catch (error) {
                        console.error("Error uploading new profile picture: ", error);
                        profileStatus.textContent = 'Gagal mengupload foto profil: ' + error.message;
                        profileStatus.style.color = 'red';
                        return;
                    }
                }

                try {
                    const userDocRef = firestore.doc(db, "users", currentUser.uid);
                    await firestore.setDoc(userDocRef, {
                        name: newName,
                        username: newUsername,
                        bio: newBio,
                        profilePic: newProfilePicUrl,
                        email: currentUser.email,
                        followers: (await firestore.getDoc(userDocRef)).data()?.followers || 0,
                        following: (await firestore.getDoc(userDocRef)).data()?.following || 0
                    }, { merge: true });

                    await firebase.auth.updateProfile(currentUser, {
                        displayName: newName,
                        photoURL: newProfilePicUrl
                    });

                    profileStatus.textContent = 'Profil berhasil diperbarui!';
                    profileStatus.style.color = 'green';
                    // Optional: Redirect back to settings or profile page
                    setTimeout(() => { history.back(); }, 1500); 

                } catch (error) {
                    console.error("Error updating profile: ", error);
                    profileStatus.textContent = 'Gagal memperbarui profil: ' + error.message;
                    profileStatus.style.color = 'red';
                }
            });
        }
    };

    // --- Fungsionalitas Halaman Ganti Password (change_password.html) ---
    const setupChangePasswordPage = () => {
        console.log("Setting up change password page functions.");

        const changePasswordForm = document.getElementById('change-password-form');
        const passwordStatus = document.getElementById('password-status');

        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                passwordStatus.textContent = 'Mengubah password...';
                passwordStatus.style.color = 'var(--text-color-light)';

                const currentPassword = document.getElementById('current-password').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;

                let currentUser = auth.currentUser;
                if (!currentUser) {
                    passwordStatus.textContent = 'Anda harus login untuk mengubah password.';
                    passwordStatus.style.color = 'red';
                    return;
                }

                if (newPassword !== confirmPassword) {
                    passwordStatus.textContent = 'Password baru tidak cocok.';
                    passwordStatus.style.color = 'red';
                    return;
                }

                if (newPassword.length < 6) {
                    passwordStatus.textContent = 'Password baru minimal 6 karakter.';
                    passwordStatus.style.color = 'red';
                    return;
                }

                try {
                    const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPassword);
                    await firebase.auth.reauthenticateWithCredential(currentUser, credential);

                    await firebase.auth.updatePassword(currentUser, newPassword);
                    
                    passwordStatus.textContent = 'Password berhasil diubah!';
                    passwordStatus.style.color = 'green';
                    changePasswordForm.reset();
                    setTimeout(() => { history.back(); }, 1500); 

                } catch (error) {
                    console.error("Error changing password: ", error);
                    if (error.code === 'auth/wrong-password') {
                        passwordStatus.textContent = 'Password lama salah.';
                    } else if (error.code === 'auth/weak-password') {
                         passwordStatus.textContent = 'Password terlalu lemah.';
                    } else {
                        passwordStatus.textContent = 'Gagal mengubah password: ' + error.message;
                    }
                    passwordStatus.style.color = 'red';
                }
            });
        }
    };

});

// script.js
document.addEventListener('DOMContentLoaded', () => {
    // ... (Kode yang sudah ada di bagian atas, termasuk setActiveNavLink dan adjustUIForScreenSize) ...

    // --- Fungsionalitas Firebase (Tetap Sama) ---
    let db, rtdb, firestore, realtimeDb, firebase, auth, storage;

    function initFirebaseAndLoadData() {
        // ... (Kode inisialisasi Firebase yang sudah ada) ...
        // Pastikan Anda memiliki variabel auth dan storage yang diinisialisasi
        db = window.db;
        rtdb = window.rtdb;
        firestore = window.firestore;
        realtimeDb = window.realtimeDb;
        firebase = window.firebase;
        auth = window.auth;
        storage = window.storage;

        console.log("Firebase initialized in script.js.");

        const currentPage = window.location.pathname.split('/').pop();
        switch (currentPage) {
            // ... (Kasus-kasus halaman lainnya tetap sama) ...
            case 'edit_profile.html':
                setupEditProfilePage();
                break;
            // ... (Kasus-kasus halaman lainnya tetap sama) ...
        }
    }

    initFirebaseAndLoadData();

    // ... (Fungsi loadPosts, loadNotifications, loadMessages, loadUserProfile, loadUserPosts, handlePostSubmission, setupMediaPreview tetap sama) ...


    // --- Fungsionalitas Halaman Pengaturan (settings.html) ---
    const setupSettingsPage = () => {
        // ... (Kode untuk mode gelap dan logout tetap sama) ...
    };


    // --- Fungsionalitas Halaman Edit Profil (edit_profile.html) ---
    const setupEditProfilePage = () => {
        console.log("Setting up edit profile page functions.");

        const profilePicInput = document.getElementById('edit-profile-pic');
        const currentProfilePic = document.getElementById('current-profile-pic');
        const uploadProfilePicBtn = document.getElementById('upload-profile-pic-btn'); // Dapatkan tombol baru
        const editProfileForm = document.getElementById('edit-profile-form');
        const profileStatus = document.getElementById('profile-status');

        // Load current user data into edit profile form
        const loadEditProfileData = async () => {
            let currentUser = auth.currentUser;
            if (!currentUser) {
                console.log("No user logged in for edit profile.");
                profileStatus.textContent = 'Silakan login untuk mengedit profil Anda.';
                profileStatus.style.color = 'red';
                editProfileForm.innerHTML = '<p style="text-align: center; color: var(--text-color-light);">Silakan login untuk mengedit profil Anda.</p>';
                return;
            }

            const userId = currentUser.uid;
            const userDocRef = firestore.doc(db, "users", userId);
            try {
                const docSnapshot = await firestore.getDoc(userDocRef);
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    document.getElementById('edit-name').value = userData.name || '';
                    document.getElementById('edit-username').value = userData.username || '';
                    document.getElementById('edit-bio').value = userData.bio || '';
                    currentProfilePic.src = userData.profilePic || currentUser.photoURL || 'https://via.placeholder.com/120';
                } else {
                    console.log("User document not found in Firestore for edit profile. Using Auth data.");
                    document.getElementById('edit-name').value = currentUser.displayName || '';
                    document.getElementById('edit-username').value = currentUser.email ? currentUser.email.split('@')[0] : '';
                    document.getElementById('edit-bio').value = '';
                    currentProfilePic.src = currentUser.photoURL || 'https://via.placeholder.com/120';
                }
            } catch (error) {
                console.error("Error loading edit profile data: ", error);
                profileStatus.textContent = 'Gagal memuat data profil: ' + error.message;
                profileStatus.style.color = 'red';
            }
        };
        loadEditProfileData();

        // **NEW:** Event listener for custom upload button
        if (uploadProfilePicBtn) {
            uploadProfilePicBtn.addEventListener('click', () => {
                profilePicInput.click(); // Trigger the hidden file input
            });
        }

        // Handle profile picture preview (already exists, but verify selectors)
        if (profilePicInput) {
            profilePicInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        currentProfilePic.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Handle Edit Profile Form Submission (already exists, but verify selectors)
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                profileStatus.textContent = 'Menyimpan perubahan...';
                profileStatus.style.color = 'var(--text-color-light)';

                let currentUser = auth.currentUser;
                if (!currentUser) {
                    profileStatus.textContent = 'Anda harus login untuk mengedit profil.';
                    profileStatus.style.color = 'red';
                    return;
                }

                const newName = document.getElementById('edit-name').value;
                const newUsername = document.getElementById('edit-username').value;
                const newBio = document.getElementById('edit-bio').value;
                const newProfilePicFile = document.getElementById('edit-profile-pic').files[0];

                let newProfilePicUrl = currentProfilePic.src;

                if (newProfilePicFile && typeof firebase.storage !== 'undefined' && storage) {
                    try {
                        const storageRefPath = `profile_pics/${currentUser.uid}/${newProfilePicFile.name}_${Date.now()}`;
                        const profilePicStorageRef = firebase.storage.ref(storage, storageRefPath);
                        await firebase.storage.uploadBytes(profilePicStorageRef, newProfilePicFile);
                        newProfilePicUrl = await firebase.storage.getDownloadURL(profilePicStorageRef);
                        console.log("New profile picture uploaded:", newProfilePicUrl);
                    } catch (error) {
                        console.error("Error uploading new profile picture: ", error);
                        profileStatus.textContent = 'Gagal mengupload foto profil: ' + error.message;
                        profileStatus.style.color = 'red';
                        return;
                    }
                }

                try {
                    const userDocRef = firestore.doc(db, "users", currentUser.uid);
                    await firestore.setDoc(userDocRef, {
                        name: newName,
                        username: newUsername,
                        bio: newBio,
                        profilePic: newProfilePicUrl,
                        email: currentUser.email,
                        followers: (await firestore.getDoc(userDocRef)).data()?.followers || 0,
                        following: (await firestore.getDoc(userDocRef)).data()?.following || 0
                    }, { merge: true });

                    await firebase.auth.updateProfile(currentUser, {
                        displayName: newName,
                        photoURL: newProfilePicUrl
                    });

                    profileStatus.textContent = 'Profil berhasil diperbarui!';
                    profileStatus.style.color = 'green';
                    setTimeout(() => { history.back(); }, 1500);

                } catch (error) {
                    console.error("Error updating profile: ", error);
                    profileStatus.textContent = 'Gagal memperbarui profil: ' + error.message;
                    profileStatus.style.color = 'red';
                }
            });
        }
    };

    // --- Fungsionalitas Halaman Ganti Password (change_password.html) ---
    const setupChangePasswordPage = () => {
        // ... (Kode tetap sama) ...
    };

});

// script.js
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');

    // Fungsi untuk menandai link navigasi yang aktif
    function setActiveNavLink() {
        const currentPath = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.main-nav a, .bottom-nav a, .create-post-btn');

        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href') ? link.getAttribute('href').split('/').pop() : '';

            link.classList.remove('active');

            if (linkPath === currentPath) {
                link.classList.add('active');
            }
        });
    }

    // Panggil saat halaman dimuat
    setActiveNavLink();

    // Tentukan tampilan sidebar dan bottom nav berdasarkan ukuran layar
    function adjustUIForScreenSize() {
        const bottomNav = document.querySelector('.bottom-nav');
        const isMessagesPage = document.body.classList.contains('messages-page');
        const isProfilePage = document.body.classList.contains('profile-page');
        const isCreatePostPage = document.body.classList.contains('create-post-page');
        const isSettingsPage = document.body.classList.contains('settings-page');
        const isEditProfilePage = document.body.classList.contains('edit-profile-page');
        const isChangePasswordPage = document.body.classList.contains('change-password-page');
        const isExplorePage = document.body.classList.contains('explore-page'); // NEW

        if (window.innerWidth <= 768) {
            sidebar.style.display = 'none';
            // Sembunyikan bottom nav di halaman pesan, profil, buat postingan, pengaturan, edit profil, ganti password
            // TIDAK sembunyikan di explore (karena explore adalah halaman utama, bottom nav harus terlihat)
            if (isMessagesPage || isProfilePage || isCreatePostPage || isSettingsPage || isEditProfilePage || isChangePasswordPage) {
                bottomNav.style.display = 'none';
            } else {
                bottomNav.style.display = 'flex';
            }
        } else {
            sidebar.style.display = 'flex';
            bottomNav.style.display = 'none';
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    }

    adjustUIForScreenSize();
    window.addEventListener('resize', adjustUIForScreenSize);

    // --- Fungsionalitas Firebase ---
    let db, rtdb, firestore, realtimeDb, firebase, auth, storage;

    function initFirebaseAndLoadData() {
        if (typeof window.db === 'undefined' || typeof window.rtdb === 'undefined' ||
            typeof window.auth === 'undefined' || typeof window.storage === 'undefined') {
            console.warn("Firebase belum diinisialisasi sepenuhnya. Menunggu...");
            setTimeout(initFirebaseAndLoadData, 100);
            return;
        }

        db = window.db;
        rtdb = window.rtdb;
        firestore = window.firestore;
        realtimeDb = window.realtimeDb;
        firebase = window.firebase;
        auth = window.auth;
        storage = window.storage;

        console.log("Firebase initialized in script.js.");

        const currentPage = window.location.pathname.split('/').pop();
        switch (currentPage) {
            case 'index.html':
            case '':
                loadPosts();
                break;
            case 'notifications.html':
                loadNotifications();
                break;
            case 'messages.html':
                loadMessages();
                setupMessageCategories();
                break;
            case 'profile.html':
                loadUserProfile();
                loadUserPosts("user123");
                break;
            case 'create_post.html':
                handlePostSubmission();
                setupMediaPreview();
                break;
            case 'settings.html':
                setupSettingsPage();
                break;
            case 'edit_profile.html':
                setupEditProfilePage();
                break;
            case 'change_password.html':
                setupChangePasswordPage();
                break;
            case 'explore.html': // NEW
                loadExploreContent(); // Call a new function to load explore content
                break;
            default:
                console.log("Halaman tidak dikenal: ", currentPage);
        }
    }

    initFirebaseAndLoadData();

    // ... (Fungsi loadPosts, loadNotifications, loadMessages, loadUserProfile, loadUserPosts, handlePostSubmission, setupMediaPreview tetap sama) ...

    const setupSettingsPage = () => { /* ... existing code ... */ };
    const setupEditProfilePage = () => { /* ... existing code ... */ };
    const setupChangePasswordPage = () => { /* ... existing code ... */ };

    // --- NEW: Fungsionalitas Halaman Explore (explore.html) ---
    const loadExploreContent = () => {
        console.log("Loading explore page content...");
        // Di sini Anda akan menambahkan logika untuk memuat data dari Firebase
        // Misalnya:
        // - Mengambil postingan terpopuler dari Firestore
        // - Mengambil daftar pengguna yang disarankan
        // - Mengambil daftar kategori/tag yang sedang tren

        // Contoh: Ambil 4 postingan terakhir sebagai "trending" (ini hanya placeholder)
        const trendingPostsGrid = document.querySelector('.explore-section .post-card').parentNode;
        if (trendingPostsGrid) {
             // Anda bisa menghapus elemen placeholder jika ingin mengisinya dari Firebase
            trendingPostsGrid.innerHTML = ''; // Clear placeholder content

            // Contoh sederhana: Mengambil postingan dari koleksi 'posts'
            firestore.query(firestore.collection(db, "posts"), firestore.orderBy("timestamp", "desc"), firestore.limit(4))
                .then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        const post = doc.data();
                        const postId = doc.id;
                        const postCard = `
                            <div class="explore-card post-card" onclick="window.location.href='post_detail.html?id=${postId}';">
                                <img src="${post.mediaUrl || 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=No+Image'}" alt="Postingan">
                                <h3>${post.caption.substring(0, 30)}${post.caption.length > 30 ? '...' : ''}</h3>
                                <p>@${post.username}</p>
                            </div>
                        `;
                        trendingPostsGrid.insertAdjacentHTML('beforeend', postCard);
                    });
                })
                .catch((error) => {
                    console.error("Error loading trending posts: ", error);
                    trendingPostsGrid.innerHTML = '<p style="text-align: center; color: var(--text-color-light);">Gagal memuat postingan trending.</p>';
                });
        }

        // Anda bisa menambahkan fungsi serupa untuk "Suggested Users" dan "Categories"
        // Contoh untuk Suggested Users (placeholder data)
        const suggestedUsersGrid = document.querySelector('.explore-section .user-card').parentNode;
        if (suggestedUsersGrid) {
            // Anda bisa menghapus elemen placeholder jika ingin mengisinya dari Firebase
            suggestedUsersGrid.innerHTML = ''; // Clear placeholder content

            // Contoh: Query Firebase untuk pengguna, atau tampilkan beberapa placeholder
             // firestore.query(firestore.collection(db, "users"), firestore.limit(4))
            // .then((querySnapshot) => {
            //     querySnapshot.forEach((doc) => {
            //         const user = doc.data();
            //         const userCard = `
            //             <div class="explore-card user-card" onclick="window.location.href='profile.html?id=${doc.id}';">
            //                 <img src="${user.profilePic || 'https://via.placeholder.com/80/7F00FF/FFFFFF?text=User'}" alt="${user.username}">
            //                 <h3>${user.username}</h3>
            //                 <p class="user-meta">${user.followers || 0} Pengikut</p>
            //             </div>
            //         `;
            //         suggestedUsersGrid.insertAdjacentHTML('beforeend', userCard);
            //     });
            // })
            // .catch((error) => {
            //     console.error("Error loading suggested users: ", error);
            // });

            // Placeholder jika belum ada data pengguna di Firestore
             const placeholderUsers = [
                { name: "John Doe", username: "john_doe", followers: "1.2k", profilePic: "https://via.placeholder.com/80/7F00FF/FFFFFF?text=JD" },
                { name: "Jane Smith", username: "jane_s", followers: "800", profilePic: "https://via.placeholder.com/80/FFD700/FFFFFF?text=JS" },
                { name: "Alex King", username: "alex_k", followers: "5k", profilePic: "https://via.placeholder.com/80/00FFFF/FFFFFF?text=AK" },
                { name: "Emily White", username: "emily_w", followers: "3.1k", profilePic: "https://via.placeholder.com/80/DAA520/FFFFFF?text=EW" }
            ];
            placeholderUsers.forEach(user => {
                const userCard = `
                    <div class="explore-card user-card" onclick="alert('Melihat Profil ${user.username}');">
                        <img src="${user.profilePic}" alt="${user.username}">
                        <h3>${user.username}</h3>
                        <p class="user-meta">${user.followers} Pengikut</p>
                    </div>
                `;
                suggestedUsersGrid.insertAdjacentHTML('beforeend', userCard);
            });
        }

        // Contoh untuk Categories (placeholder data)
        const categoriesGrid = document.querySelector('.explore-section .category-card').parentNode;
        if (categoriesGrid) {
            categoriesGrid.innerHTML = ''; // Clear placeholder content

            const categories = [
                { name: "Humor", icon: "fas fa-laugh-squint" },
                { name: "Seni", icon: "fas fa-paint-brush" },
                { name: "Game", icon: "fas fa-gamepad" },
                { name: "Teknologi", icon: "fas fa-laptop-code" },
                { name: "Makanan", icon: "fas fa-utensils" },
                { name: "Berita", icon: "fas fa-newspaper" }
            ];
            categories.forEach(cat => {
                const categoryCard = `
                    <div class="explore-card category-card" onclick="alert('Melihat Kategori ${cat.name}');">
                        <i class="${cat.icon}"></i>
                        <h3>${cat.name}</h3>
                `;
                categoriesGrid.insertAdjacentHTML('beforeend', categoryCard);
            });
        }
    };
});
