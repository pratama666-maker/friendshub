// index.js
import { auth, db } from './firebase-config.js'; // Pastikan db dan auth diekspor
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', async () => {
    const feedContainer = document.getElementById('feed');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userProfilePicHeader = document.getElementById('userProfilePicHeader');

    // Elemen Popup
    const authPopup = document.getElementById('authPopup');
    const loginBtnPopup = document.getElementById('loginBtnPopup');
    const signupBtnPopup = document.getElementById('signupBtnPopup');

    // Event listener untuk tombol di popup
    if (loginBtnPopup) {
        loginBtnPopup.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }
    if (signupBtnPopup) {
        signupBtnPopup.addEventListener('click', () => {
            window.location.href = 'signup.html';
        });
    }

    // --- Cek Status Otentikasi dan Muat Profil Pengguna ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Pengguna sudah login
            authPopup.style.display = 'none'; // Sembunyikan popup
            document.body.style.overflow = ''; // Aktifkan scroll body

            const userRef = doc(db, 'users', user.uid);
            try {
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    usernameDisplay.textContent = `@${userData.username || 'Pengguna'}`;
                    userProfilePicHeader.src = userData.profilePic || 'https://via.placeholder.com/40';
                    userProfilePicHeader.onclick = () => window.location.href = `profile.html?id=${user.uid}`;
                } else {
                    usernameDisplay.textContent = '@TidakDikenal';
                    userProfilePicHeader.src = 'https://via.placeholder.com/40';
                    console.warn("Data pengguna tidak ditemukan di Firestore untuk UID ini.");
                }
            } catch (error) {
                console.error("Error memuat data pengguna:", error);
                usernameDisplay.textContent = '@Error';
                userProfilePicHeader.src = 'https://via.placeholder.com/40';
            }

            // Panggil fungsi untuk memuat postingan hanya jika pengguna sudah login
            loadFeedPosts();

        } else {
            // Pengguna belum login
            console.log("Pengguna belum login. Menampilkan popup otentikasi.");
            authPopup.style.display = 'flex'; // Tampilkan popup
            document.body.style.overflow = 'hidden'; // Nonaktifkan scroll body
            feedContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #777;">Silakan login atau daftar untuk melihat postingan.</p>';
            usernameDisplay.textContent = 'Tamu';
            userProfilePicHeader.src = 'https://via.placeholder.com/40/AAAAAA/FFFFFF?text=G';
            userProfilePicHeader.onclick = () => {}; // Nonaktifkan klik pada gambar profil tamu
        }
    });

    // --- Fungsi untuk Memuat Postingan ke Feed ---
    async function loadFeedPosts() {
        feedContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #777;">Memuat postingan...</p>';

        try {
            const postsQuery = query(
                collection(db, 'posts'),
                orderBy('timestamp', 'desc')
            );
            const postsSnap = await getDocs(postsQuery);

            feedContainer.innerHTML = ''; // Kosongkan pesan loading

            if (postsSnap.empty) {
                feedContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #777;">Belum ada postingan untuk ditampilkan.</p>';
            } else {
                for (const postDoc of postsSnap.docs) {
                    const postData = postDoc.data();
                    const postId = postDoc.id;
                    const userId = postData.userId;

                    let username = 'Pengguna Tidak Dikenal';
                    let profilePic = 'https://via.placeholder.com/50/CCCCCC/FFFFFF?text=U';

                    if (userId) {
                        const userRef = doc(db, 'users', userId);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            const userData = userSnap.data();
                            username = userData.username;
                            profilePic = userData.profilePic || profilePic;
                        }
                    }

                    const postCard = document.createElement('div');
                    postCard.className = 'post-card';
                    postCard.innerHTML = `
                        <div class="post-header">
                            <img src="${profilePic}" alt="Foto Profil Pengguna" class="user-avatar-small" onclick="location.href='view_profile.html?id=${userId}';">
                            <div class="user-info">
                                <h3><a href="view_profile.html?id=${userId}">@${username}</a></h3>
                                <p class="timestamp">${postData.timestamp ? new Date(postData.timestamp.toDate()).toLocaleString() : 'Tidak diketahui'}</p>
                            </div>
                            <div class="post-options">
                                <i class="fas fa-ellipsis-h"></i>
                            </div>
                        </div>
                        <div class="post-body">
                            <img src="${postData.imageUrl || 'https://via.placeholder.com/600x400/EEEEEE/FFFFFF?text=Gambar+Tidak+Tersedia'}" alt="Gambar Postingan" onclick="location.href='view_post.html?id=${postId}';">
                            <h2><a href="view_post.html?id=${postId}">${postData.title || 'Tanpa Judul'}</a></h2>
                            <p>${postData.content || ''}</p>
                        </div>
                        <div class="post-actions">
                            <span><i class="fas fa-heart"></i> ${postData.likesCount || 0}</span>
                            <span><i class="fas fa-comment"></i> ${postData.commentsCount || 0}</span>
                            <span><i class="fas fa-share-alt"></i> Bagikan</span>
                        </div>
                        <div class="post-comments-summary">
                            <p>Lihat semua ${postData.commentsCount || 0} komentar</p>
                        </div>
                    `;
                    feedContainer.appendChild(postCard);
                }
            }
        } catch (error) {
            console.error("Error memuat postingan:", error);
            feedContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: red;">Terjadi kesalahan saat memuat postingan.</p>';
        }
    }
});
