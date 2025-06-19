// signup.js
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const signupEmail = document.getElementById('signupEmail');
    const signupPassword = document.getElementById('signupPassword');
    const signupMessage = document.getElementById('signupMessage');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Mencegah refresh halaman
        signupMessage.textContent = ''; // Bersihkan pesan sebelumnya
        signupMessage.className = 'message'; // Reset class pesan

        const email = signupEmail.value;
        const password = signupPassword.value;

        if (password.length < 6) {
            signupMessage.textContent = 'Kata sandi minimal 6 karakter.';
            signupMessage.classList.add('error');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Simpan data pengguna ke Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                username: email.split('@')[0], // Contoh username awal dari email
                profilePic: 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=U', // Gambar profil default
                bio: '',
                followersCount: 0,
                followingCount: 0,
                postsCount: 0,
                createdAt: new Date()
            });

            signupMessage.textContent = 'Pendaftaran berhasil! Mengarahkan ke Beranda...';
            signupMessage.classList.add('success');
            setTimeout(() => {
                window.location.href = 'index.html'; // Arahkan ke halaman beranda setelah daftar
            }, 2000);
        } catch (error) {
            console.error("Error saat mendaftar:", error);
            let errorMessage = 'Terjadi kesalahan saat mendaftar.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Format email tidak valid.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Kata sandi terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol.';
            }
            signupMessage.textContent = errorMessage;
            signupMessage.classList.add('error');
        }
    });
});
