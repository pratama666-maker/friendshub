// login.js
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginMessage = document.getElementById('loginMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Mencegah refresh halaman
        loginMessage.textContent = ''; // Bersihkan pesan sebelumnya
        loginMessage.className = 'message'; // Reset class pesan

        const email = loginEmail.value;
        const password = loginPassword.value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            loginMessage.textContent = 'Login berhasil! Mengarahkan ke Beranda...';
            loginMessage.classList.add('success');
            setTimeout(() => {
                window.location.href = 'index.html'; // Arahkan ke halaman beranda setelah login
            }, 2000);
        } catch (error) {
            console.error("Error saat login:", error);
            let errorMessage = 'Terjadi kesalahan saat login.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Email atau kata sandi salah. Silakan coba lagi.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Format email tidak valid.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Terlalu banyak percobaan login gagal. Coba lagi nanti.';
            }
            loginMessage.textContent = errorMessage;
            loginMessage.classList.add('error');
        }
    });
});
