// Memastikan Firebase config sudah dimuat sebelum ini
// Contoh penggunaan firebaseConfig (asumsi sudah didefinisikan di firebase-config.js)
console.log("Firebase Config Loaded (simulated):", typeof firebaseConfig !== 'undefined' ? firebaseConfig : "firebaseConfig not found");

document.addEventListener('DOMContentLoaded', () => {
    const loginBox = document.getElementById('loginBox');
    const registerBox = document.getElementById('registerBox');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const messageBox = document.getElementById('messageBox');
    const registerDummyEmailSpan = document.getElementById('registerDummyEmail');
    const loginDummyEmailSpan = document.getElementById('loginDummyEmail');

    // Tombol Service Center dan Donasi (Sekarang menjadi link langsung)
    const serviceCenterButton = document.getElementById('serviceCenterButton');
    const donateButton = document.getElementById('donateButton');

    let currentDummyEmail = ''; // Untuk menyimpan email dummy yang sedang digunakan/didaftarkan

    // Fungsi untuk menghasilkan email dummy
    function generateDummyEmail() {
        const timestamp = new Date().getTime();
        return `user_${timestamp}@dummy.com`;
    }

    // Fungsi untuk menampilkan pesan
    function showMessage(message, type) {
        messageBox.textContent = message;
        messageBox.className = 'message-box ' + type;
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 4000); // Pesan akan hilang setelah 4 detik
    }

    // Fungsi untuk menyimpan pengguna (dummy, di dunia nyata ini akan ke database)
    function saveUser(email, password) {
        let users = JSON.parse(localStorage.getItem('dummyUsers')) || [];
        // Cek apakah email sudah terdaftar
        if (users.some(user => user.email === email)) {
            return false; // Email sudah terdaftar
        }
        users.push({ email, password });
        localStorage.setItem('dummyUsers', JSON.stringify(users));
        localStorage.setItem('lastRegisteredDummyEmail', email); // Simpan email terakhir yang didaftarkan
        return true;
    }

    // Fungsi untuk mencari pengguna (dummy)
    function findUser(email, password) {
        let users = JSON.parse(localStorage.getItem('dummyUsers')) || [];
        return users.find(user => user.email === email && user.password === password);
    }

    // Fungsi untuk memperbarui tampilan email dummy di form
    function updateDummyEmailDisplay() {
        // Ambil email terakhir yang didaftarkan untuk login
        const lastEmail = localStorage.getItem('lastRegisteredDummyEmail');
        if (lastEmail) {
            loginDummyEmailSpan.textContent = lastEmail;
        } else {
            loginDummyEmailSpan.textContent = 'Belum ada email terdaftar';
        }

        // Generate email baru untuk pendaftaran
        currentDummyEmail = generateDummyEmail();
        registerDummyEmailSpan.textContent = currentDummyEmail;
    }

    // Inisialisasi tampilan email dummy saat halaman dimuat
    updateDummyEmailDisplay();

    // Beralih ke form daftar
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginBox.classList.add('hidden');
        registerBox.classList.remove('hidden');
        messageBox.style.display = 'none'; // Sembunyikan pesan saat beralih
        updateDummyEmailDisplay(); // Perbarui email dummy untuk daftar
    });

    // Beralih ke form login
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
        messageBox.style.display = 'none'; // Sembunyikan pesan saat beralih
        updateDummyEmailDisplay(); // Perbarui email dummy untuk login
    });

    // Handle pendaftaran
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password.length < 6) {
            showMessage('Kata sandi minimal 6 karakter!', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Kata sandi tidak cocok!', 'error');
            return;
        }

        // Gunakan email dummy yang sudah digenerate
        if (saveUser(currentDummyEmail, password)) {
            showMessage('Pendaftaran berhasil! Silakan login.', 'success');
            registerForm.reset(); // Bersihkan form
            // Otomatis beralih ke login setelah daftar berhasil
            registerBox.classList.add('hidden');
            loginBox.classList.remove('hidden');
            updateDummyEmailDisplay(); // Perbarui tampilan email dummy di login
        } else {
            showMessage('Email dummy ini sudah terdaftar!', 'error');
            // Ini mungkin terjadi jika timestamp terlalu cepat dan menghasilkan email yang sama
            // Dalam skenario nyata, Firebase akan menangani ini.
        }
    });

    // Handle login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('loginPassword').value;
        const emailToLogin = localStorage.getItem('lastRegisteredDummyEmail'); // Ambil email terakhir yang didaftarkan

        if (!emailToLogin) {
            showMessage('Belum ada akun terdaftar. Silakan daftar terlebih dahulu.', 'error');
            return;
        }

        if (findUser(emailToLogin, password)) {
            showMessage('Login berhasil! Mengarahkan ke Beranda...', 'success');
            loginForm.reset(); // Bersihkan form
            // Redirect ke halaman beranda setelah login berhasil
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500); // Beri sedikit jeda untuk melihat pesan
        } else {
            showMessage('Kata sandi salah!', 'error');
        }
    });

    // Event listener untuk tombol Service Center (akan mengarahkan ke halaman)
    serviceCenterButton.addEventListener('click', () => {
        window.location.href = 'service-center.html';
    });

    // Event listener untuk tombol Donasi (akan mengarahkan ke halaman)
    donateButton.addEventListener('click', () => {
        window.location.href = 'donate.html';
    });
});
