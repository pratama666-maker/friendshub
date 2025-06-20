// Konfigurasi Firebase Anda
// GANTI DENGAN KONFIGURASI PROYEK ANDA SENDIRI DARI FIREBASE CONSOLE
const firebaseConfig = {
    apiKey: "AIzaSyBqZEjFY_RBUpME9r4j0-mASlJWIsJTdpE",
    authDomain: "whatfun-baec7.firebaseapp.com",
    projectId: "whatfun-baec7",
    storageBucket: "whatfun-baec7.firebasestorage.app",
    messagingSenderId: "320401713540",
    appId: "1:320401713540:web:ab7a70aa17e2ae2fc6d5d1",
    measurementId: "G-L1TSBSW1ME"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Dapatkan instance Authentication, Firestore, dan Storage
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const storageRef = storage.ref();

// Referensi elemen DOM
const authStatusDiv = document.getElementById('authStatus');
const userNameDiv = document.getElementById('userName');
const userAvatarDiv = document.getElementById('userAvatar');

// Home Page Elements
const postContentInput = document.getElementById('postContent');
const mediaFileInput = document.getElementById('mediaFile');
const selectedFileNameSpan = document.getElementById('selectedFileName');
const submitPostBtn = document.getElementById('submitPostBtn');
const postsGridDiv = document.getElementById('postsGrid');
const searchPostInput = document.getElementById('searchPostInput');

// Page Navigation Buttons & Content
const homePageBtn = document.getElementById('homePageBtn'); // Sidebar button
const groupPageBtn = document.getElementById('groupPageBtn'); // Sidebar button
const bottomHomeBtn = document.getElementById('bottomHomeBtn'); // Bottom nav button
const bottomGroupBtn = document.getElementById('bottomGroupBtn'); // Bottom nav button

const homePageContent = document.getElementById('homePage');
const groupPageContent = document.getElementById('groupPage');
const createGroupPageContent = document.getElementById('createGroupPage');
const groupDetailPageContent = document.getElementById('groupDetailPage');
const postDetailPageContent = document.getElementById('postDetailPage');

// Group Page Elements
const createGroupBtn = document.getElementById('createGroupBtn');
const groupsGridDiv = document.getElementById('groupsGrid');

// Create Group Form Elements
const groupNameInput = document.getElementById('groupNameInput');
const groupDescriptionInput = document.getElementById('groupDescriptionInput');
const groupCategorySelect = document.getElementById('groupCategorySelect');
const groupBannerFileInput = document.getElementById('groupBannerFileInput');
const selectedBannerFileNameSpan = document.getElementById('selectedBannerFileName');
const groupBannerPreview = document.getElementById('groupBannerPreview');
const submitCreateGroupBtn = document.getElementById('submitCreateGroupBtn');
const cancelCreateGroupBtn = document.getElementById('cancelCreateGroupBtn');

// Group Detail Page Elements
const groupDetailBanner = document.getElementById('groupDetailBanner');
const groupDetailName = document.getElementById('groupDetailName');
const groupDetailDescription = document.getElementById('groupDetailDescription');
const groupDetailCategory = document.getElementById('groupDetailCategory');
const groupDetailAuthor = document.getElementById('groupDetailAuthor');
const groupDetailMembers = document.getElementById('groupDetailMembers');
const backToGroupsBtn = document.getElementById('backToGroupsBtn');
const joinGroupBtn = document.getElementById('joinGroupBtn');
const leaveGroupBtn = document.getElementById('leaveGroupBtn');
const voteDisbandUpBtn = document.getElementById('voteDisbandUpBtn');
const voteDisbandDownBtn = document.getElementById('voteDisbandDownBtn');
const disbandUpVotesCountSpan = document.getElementById('disbandUpVotesCount');
const disbandDownVotesCountSpan = document.getElementById('disbandDownVotesCount');
const disbandVoteTimeRemainingSpan = document.getElementById('disbandVoteTimeRemaining');
const groupPostFormContainer = document.getElementById('groupPostFormContainer');
const currentGroupNameForPost = document.getElementById('currentGroupNameForPost');
const groupPostContentInput = document.getElementById('groupPostContent');
const groupMediaFileInput = document.getElementById('groupMediaFile');
const selectedGroupFileNameSpan = document.getElementById('selectedGroupFileName');
const submitGroupPostBtn = document.getElementById('submitGroupPostBtn');
const groupPostsGrid = document.getElementById('groupPostsGrid');

// Post Detail Page Elements
const backToFeedBtn = document.getElementById('backToFeedBtn');
const singlePostContainer = document.getElementById('singlePostContainer');
const retweetsListDiv = document.getElementById('retweetsList');

// Modal Elements
const retweetModal = document.getElementById('retweetModal');
const closeRetweetModalBtn = document.getElementById('closeRetweetModal');
const retweetQuoteContentInput = document.getElementById('retweetQuoteContent');
const quotedPostPreviewDiv = document.getElementById('quotedPostPreview');
const submitQuoteRetweetBtn = document.getElementById('submitQuoteRetweetBtn');

const shareModal = document.getElementById('shareModal');
const closeShareModalBtn = document.getElementById('closeShareModal');
const shareLinkInput = document.getElementById('shareLinkInput');
const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');


let currentUser = null;
let currentQuotedPostId = null;
let currentUserName = "Anonim";
let currentUserDisplayName = "A";
let currentGroupDetailId = null;
let currentPostDetailId = null;

// --- Generator Nama & Username Acak (Sesi) ---
const adjectives = ['Senang', 'Gelap', 'Cepat', 'Berani', 'Tenang', 'Bijak', 'Kuat', 'Misterius', 'Ramah', 'Lincah'];
const nouns = ['Kucing', 'Burung', 'Pohon', 'Batu', 'Awan', 'Bintang', 'Lampu', 'Angin', 'Bayangan', 'Sungai'];

function generateRandomProfile() {
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 900) + 100;

    const name = `${randomAdj} ${randomNoun}`;
    const username = `${randomAdj.toLowerCase()}${randomNoun.toLowerCase()}${randomNumber}`;
    const avatarInitial = name.charAt(0).toUpperCase();

    return { name, username, avatarInitial };
}

// --- Fungsi Autentikasi Anonim ---
function signInAnonymously() {
    auth.signInAnonymously()
        .then((userCredential) => {
            currentUser = userCredential.user;
            const profile = generateRandomProfile();
            currentUserName = profile.username;
            currentUserDisplayName = profile.name;
            updateAuthStatus(currentUser);
            console.log("Pengguna anonim berhasil masuk:", currentUser.uid, "Profil:", profile);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Error saat masuk anonim:", errorCode, errorMessage);
            authStatusDiv.textContent = `Error autentikasi: ${errorMessage}`;
        });
}

// Observer untuk mendeteksi perubahan status autentikasi
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        if (!currentUserName || !currentUserDisplayName) {
            const profile = generateRandomProfile();
            currentUserName = profile.username;
            currentUserDisplayName = profile.name;
        }
        updateAuthStatus(user);
    } else {
        currentUser = null;
        currentUserName = "Anonim";
        currentUserDisplayName = "A";
        updateAuthStatus(null);
        signInAnonymously();
    }
});

// Fungsi untuk memperbarui status autentikasi & profil di UI
function updateAuthStatus(user) {
    if (user) {
        authStatusDiv.innerHTML = `Anonim | ID: ${user.uid.substring(0, 6)}...`;
        userNameDiv.textContent = currentUserDisplayName;
        userAvatarDiv.textContent = currentUserDisplayName.charAt(0).toUpperCase();

        postContentInput.disabled = false;
        mediaFileInput.disabled = false;
        submitPostBtn.disabled = false;
        submitPostBtn.textContent = "Kicaukan!";

        groupPostContentInput.disabled = false;
        groupMediaFileInput.disabled = false;
        submitGroupPostBtn.disabled = false;
        submitGroupPostBtn.textContent = "Kicaukan di Grup!";

        joinGroupBtn.style.display = 'inline-block';
        leaveGroupBtn.style.display = 'none';
    } else {
        authStatusDiv.innerHTML = `Mencoba masuk anonim...`;
        userNameDiv.textContent = "Memuat...";
        userAvatarDiv.textContent = "?";

        postContentInput.disabled = true;
        mediaFileInput.disabled = true;
        submitPostBtn.disabled = true;
        submitPostBtn.textContent = "Memuat...";

        groupPostContentInput.disabled = true;
        groupMediaFileInput.disabled = true;
        submitGroupPostBtn.disabled = true;
        submitGroupPostBtn.textContent = "Memuat...";

        joinGroupBtn.style.display = 'none';
        leaveGroupBtn.style.display = 'none';
    }
}

// --- Navigasi Halaman ---
function showPage(pageId, data = null) {
    homePageContent.style.display = 'none';
    groupPageContent.style.display = 'none';
    createGroupPageContent.style.display = 'none';
    groupDetailPageContent.style.display = 'none';
    postDetailPageContent.style.display = 'none';

    // Remove active class from all nav buttons
    [homePageBtn, groupPageBtn, bottomHomeBtn, bottomGroupBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    if (pageId === 'home') {
        homePageContent.style.display = 'block';
        if (homePageBtn) homePageBtn.classList.add('active'); // Sidebar button
        if (bottomHomeBtn) bottomHomeBtn.classList.add('active'); // Bottom nav button
        fetchPosts(searchPostInput.value, null); // Fetch global posts
    } else if (pageId === 'group') {
        groupPageContent.style.display = 'block';
        if (groupPageBtn) groupPageBtn.classList.add('active'); // Sidebar button
        if (bottomGroupBtn) bottomGroupBtn.classList.add('active'); // Bottom nav button
        fetchGroups();
    } else if (pageId === 'createGroup') {
        createGroupPageContent.style.display = 'block';
        // Clear form and preview
        groupNameInput.value = '';
        groupDescriptionInput.value = '';
        groupCategorySelect.value = 'Umum';
        groupBannerFileInput.value = '';
        selectedBannerFileNameSpan.textContent = "Tidak ada file dipilih";
        groupBannerPreview.innerHTML = '<span>Pratinjau Banner</span>';
        groupBannerPreview.style.backgroundImage = 'none';
    } else if (pageId === 'groupDetail' && data && data.groupId) {
        groupDetailPageContent.style.display = 'block';
        viewGroupDetail(data.groupId);
    } else if (pageId === 'postDetail' && data && data.postId) {
        postDetailPageContent.style.display = 'block';
        viewPostDetail(data.postId);
    }
    // Update URL hash for navigation
    window.location.hash = pageId === 'home' ? '' : pageId;
    if (data && data.groupId) {
        window.location.hash = `groupDetail/${data.groupId}`;
    }
    if (data && data.postId) {
        window.location.hash = `postDetail/${data.postId}`;
    }
}

// Event Listeners for Navigation Buttons
homePageBtn.addEventListener('click', () => showPage('home'));
groupPageBtn.addEventListener('click', () => showPage('group'));
bottomHomeBtn.addEventListener('click', () => showPage('home'));
bottomGroupBtn.addEventListener('click', () => showPage('group'));

// Handle browser back/forward buttons
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash.startsWith('groupDetail/')) {
        const groupId = hash.split('/')[1];
        showPage('groupDetail', { groupId });
    } else if (hash.startsWith('postDetail/')) {
        const postId = hash.split('/')[1];
        showPage('postDetail', { postId });
    } else if (hash === 'group') {
        showPage('group');
    } else {
        showPage('home');
    }
});

// Initial page load based on hash
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.substring(1);
    if (hash.startsWith('groupDetail/')) {
        const groupId = hash.split('/')[1];
        showPage('groupDetail', { groupId });
    } else if (hash.startsWith('postDetail/')) {
        const postId = hash.split('/')[1];
        showPage('postDetail', { postId });
    } else if (hash === 'group') {
        showPage('group');
    } else {
        showPage('home');
    }
});


// --- Fungsi Form Posting & Media (Home Feed) ---
mediaFileInput.addEventListener('change', (event) => {
    const file = event.target.files.item(0);
    if (file) {
        selectedFileNameSpan.textContent = file.name;
    } else {
        selectedFileNameSpan.textContent = "Tidak ada file dipilih";
    }
});

submitPostBtn.addEventListener('click', () => submitPost(postContentInput, mediaFileInput, selectedFileNameSpan, null));

// --- Fungsi Form Posting & Media (Group Feed) ---
groupMediaFileInput.addEventListener('change', (event) => {
    const file = event.target.files.item(0);
    if (file) {
        selectedGroupFileNameSpan.textContent = file.name;
    } else {
        selectedGroupFileNameSpan.textContent = "Tidak ada file dipilih";
    }
});

submitGroupPostBtn.addEventListener('click', () => submitPost(groupPostContentInput, groupMediaFileInput, selectedGroupFileNameSpan, currentGroupDetailId));


// Generic function to handle post submission
async function submitPost(contentInput, mediaInput, fileNameSpan, groupId = null) {
    const content = contentInput.value.trim();
    const mediaFile = mediaInput.files.length > 0 ? mediaInput.files.item(0) : null;

    if (!content && !mediaFile) {
        alert("Kicauan tidak boleh kosong!");
        return;
    }
    if (!currentUser) {
        alert("Anda belum masuk! Mohon tunggu sebentar.");
        return;
    }

    let mediaUrl = null;

    if (mediaFile) {
        if (mediaFile.size > 5 * 1024 * 1024) { // 5MB limit
            alert("Ukuran file media tidak boleh lebih dari 5MB.");
            return;
        }
        const mediaRef = storageRef.child(`posts/${currentUser.uid}/${Date.now()}-${mediaFile.name}`);
        try {
            const uploadResult = await mediaRef.put(mediaFile);
            mediaUrl = await uploadResult.ref.getDownloadURL();
        } catch (error) {
            console.error("Error mengunggah media:", error);
            alert("Gagal mengunggah media.");
            return;
        }
    }

    try {
        const hashtags = extractHashtags(content);
        await db.collection('posts').add({
            content: content,
            authorUid: currentUser.uid,
            authorName: currentUserDisplayName,
            authorUsername: currentUserName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            mediaUrl: mediaUrl,
            hashtags: hashtags,
            upvotes: 0,
            downvotes: 0,
            retweetOf: null,
            quoteOf: null,
            groupId: groupId // Set groupId if posting in a group
        });
        contentInput.value = '';
        mediaInput.value = '';
        fileNameSpan.textContent = "Tidak ada file dipilih";
        console.log("Postingan berhasil dikirim!");
    } catch (error) {
        console.error("Error saat mengirim postingan:", error);
        alert("Gagal mengirim kicauan: " + error.message);
    }
}


// --- Fetch & Render Postingan (Real-time dengan Pencarian & Group Filter) ---
let unsubscribeFromPosts = null;

function fetchPosts(searchTerm = '', groupId = null, targetGrid = postsGridDiv) {
    if (unsubscribeFromPosts) {
        unsubscribeFromPosts();
    }

    let query = db.collection('posts').orderBy('timestamp', 'desc').limit(50);

    if (groupId) {
        query = query.where('groupId', '==', groupId);
    } else {
        // Only show non-group posts on the main feed
        query = query.where('groupId', '==', null);
    }

    unsubscribeFromPosts = query.onSnapshot(async (snapshot) => {
        targetGrid.innerHTML = '';
        const filteredDocs = searchTerm
            ? snapshot.docs.filter(doc => {
                const data = doc.data();
                const textContent = data.content ? data.content.toLowerCase() : '';
                const hasHashtag = data.hashtags ? data.hashtags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) : false;
                return textContent.includes(searchTerm.toLowerCase()) || hasHashtag;
              })
            : snapshot.docs;

        if (filteredDocs.length === 0) {
            targetGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Tidak ada kicauan ditemukan.</p>';
            return;
        }

        const postElementsPromises = filteredDocs.map(async (doc) => {
            return createPostElement(doc);
        });

        const postElements = await Promise.all(postElementsPromises);
        postElements.forEach(el => targetGrid.appendChild(el));

        attachPostEventListeners(targetGrid);

    }, (error) => {
        console.error("Error saat mendapatkan postingan:", error);
        targetGrid.innerHTML = `<p style="text-align: center; color: var(--accent-red);">Gagal memuat kicauan: ${error.message}</p>`;
    });
}

async function createPostElement(doc, isDetailed = false) {
    const post = doc.data();
    const postId = doc.id;
    const postElement = document.createElement('div');
    postElement.classList.add('post-item');
    if (!isDetailed) {
        postElement.onclick = () => showPage('postDetail', { postId });
    }

    let mainContent = post.content;
    let mediaElement = '';
    let originalPostQuoteHTML = '';
    let retweetIndicatorHTML = '';
    const postAuthorName = post.authorName || `Anonim ${post.authorUid.substring(0, 8)}`;
    const postAuthorUsername = post.authorUsername || `@anonim${post.authorUid.substring(0, 4)}`;

    if (post.mediaUrl) {
        if (post.mediaUrl.toLowerCase().endsWith('.mp4') || post.mediaUrl.toLowerCase().endsWith('.webm')) {
            mediaElement = `<video src="${post.mediaUrl}" controls></video>`;
        } else {
            mediaElement = `<img src="${post.mediaUrl}" alt="Media Post">`;
        }
    }

    if (post.retweetOf) {
        retweetIndicatorHTML = `<div class="retweet-indicator"><i class="fa-solid fa-retweet"></i> ${postAuthorName} me-retweet</div>`;
        try {
            const originalDoc = await db.collection('posts').doc(post.retweetOf).get();
            if (originalDoc.exists) {
                const originalPostData = originalDoc.data();
                const originalAuthorName = originalPostData.authorName || `Anonim ${originalPostData.authorUid.substring(0, 8)}`;
                const originalAuthorUsername = originalPostData.authorUsername || `@anonim${originalPostData.authorUid.substring(0, 4)}`;
                let originalMedia = '';
                if (originalPostData.mediaUrl) {
                     if (originalPostData.mediaUrl.toLowerCase().endsWith('.mp4') || originalPostData.mediaUrl.toLowerCase().endsWith('.webm')) {
                        originalMedia = `<video src="${originalPostData.mediaUrl}" controls></video>`;
                    } else {
                        originalMedia = `<img src="${originalPostData.mediaUrl}" alt="Original Media">`;
                    }
                }
                originalPostQuoteHTML = `
                    <div class="original-post-quote" data-post-id="${post.retweetOf}">
                        <div class="meta" style="text-align: left; margin-bottom: 5px;">
                            <strong>${originalAuthorName}</strong> <span style="color:var(--text-muted);">@${originalAuthorUsername}</span>
                        </div>
                        ${originalMedia}
                        <p>${escapeHTML(originalPostData.content)}</p>
                    </div>
                `;
                mainContent = "";
                mediaElement = "";
            } else {
                originalPostQuoteHTML = `<div class="original-post-quote"><p>Postingan asli tidak ditemukan.</p></div>`;
            }
        } catch (error) {
            console.error("Error fetching retweeted original post:", error);
            originalPostQuoteHTML = `<div class="original-post-quote"><p>Gagal memuat postingan asli.</p></div>`;
        }
    }
    else if (post.quoteOf) {
        try {
            const originalDoc = await db.collection('posts').doc(post.quoteOf).get();
            if (originalDoc.exists) {
                const originalPostData = originalDoc.data();
                const originalAuthorName = originalPostData.authorName || `Anonim ${originalPostData.authorUid.substring(0, 8)}`;
                const originalAuthorUsername = originalPostData.authorUsername || `@anonim${originalPostData.authorUid.substring(0, 4)}`;
                let originalMedia = '';
                if (originalPostData.mediaUrl) {
                     if (originalPostData.mediaUrl.toLowerCase().endsWith('.mp4') || originalPostData.mediaUrl.toLowerCase().endsWith('.webm')) {
                        originalMedia = `<video src="${originalPostData.mediaUrl}" controls></video>`;
                    } else {
                        originalMedia = `<img src="${originalPostData.mediaUrl}" alt="Original Media">`;
                    }
                }
                originalPostQuoteHTML = `
                    <div class="original-post-quote" data-post-id="${post.quoteOf}">
                        <div class="meta" style="text-align: left; margin-bottom: 5px;">
                            <strong>${originalAuthorName}</strong> <span style="color:var(--text-muted);">@${originalAuthorUsername}</span>
                        </div>
                        ${originalMedia}
                        <p>${escapeHTML(originalPostData.content)}</p>
                    </div>
                `;
            } else {
                originalPostQuoteHTML = `<div class="original-post-quote"><p>Postingan asli tidak ditemukan.</p></div>`;
            }
        } catch (error) {
            console.error("Error fetching quoted original post:", error);
            originalPostQuoteHTML = `<div class="original-post-quote"><p>Gagal memuat postingan asli.</p></div>`;
        }
    }

    const timestamp = post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Tidak diketahui';
    const contentWithHashtags = formatHashtags(escapeHTML(mainContent));
    const upvotes = post.upvotes || 0;
    const downvotes = post.downvotes || 0;
    const netVotes = upvotes - downvotes;

    postElement.innerHTML = `
        ${retweetIndicatorHTML}
        <div style="padding-top: ${retweetIndicatorHTML ? '20px' : '0'};">
            ${mediaElement}
            ${mainContent ? `<p>${contentWithHashtags}</p>` : ''}
            ${originalPostQuoteHTML}
        </div>
        <div class="meta">
            <strong>${postAuthorName}</strong> <span style="color:var(--text-muted);">@${postAuthorUsername}</span> pada ${timestamp}
        </div>
        <div class="actions">
            <div class="vote-buttons">
                <button class="vote-btn upvote" data-post-id="${postId}" data-vote-type="up"><i class="fas fa-arrow-up"></i></button>
                <span class="vote-count">${netVotes}</span>
                <button class="vote-btn downvote" data-post-id="${postId}" data-vote-type="down"><i class="fas fa-arrow-down"></i></button>
            </div>
            <div>
                <button class="action-icon retweet-action-btn" data-post-id="${postId}"><i class="fas fa-retweet"></i></button>
                <button class="action-icon share-action-btn" data-post-id="${postId}"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;
    return postElement;
}


// --- Event Listeners for Post Actions ---
function attachPostEventListeners(container = document) {
    container.querySelectorAll('.vote-btn').forEach(button => {
        button.onclick = null;
        button.onclick = handleVote;
    });

    container.querySelectorAll('.retweet-action-btn').forEach(button => {
        button.onclick = null;
        button.onclick = openRetweetModal;
    });

    container.querySelectorAll('.share-action-btn').forEach(button => {
        button.onclick = null;
        button.onclick = openShareModal;
    });

    container.querySelectorAll('.original-post-quote').forEach(quoteDiv => {
        quoteDiv.onclick = null;
        quoteDiv.onclick = viewOriginalPostDetail;
    });
}

async function handleVote(event) {
    if (!currentUser) {
        alert("Anda harus login untuk vote.");
        return;
    }

    const postId = event.currentTarget.dataset.postId;
    const voteType = event.currentTarget.dataset.voteType;

    const postRef = db.collection('posts').doc(postId);

    try {
        await db.runTransaction(async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists) {
                throw "Postingan tidak ditemukan!";
            }

            let upvotes = postDoc.data().upvotes || 0;
            let downvotes = postDoc.data().downvotes || 0;

            // Simple user-based voting (for demo, not production-grade)
            // In a real app, you'd store who voted to prevent multiple votes
            // or use a separate "votes" subcollection.
            // For now, it just increments/decrements.
            if (voteType === 'up') {
                upvotes++;
            } else {
                downvotes++;
            }

            transaction.update(postRef, {
                upvotes: upvotes,
                downvotes: downvotes
            });
        });
    } catch (error) {
        console.error("Error voting:", error);
        alert("Gagal memberikan vote: " + error.message);
    }
}


// --- Modal Functions ---
closeRetweetModalBtn.addEventListener('click', () => {
    retweetModal.style.display = 'none';
    retweetQuoteContentInput.value = '';
    quotedPostPreviewDiv.innerHTML = '';
    currentQuotedPostId = null;
});

window.addEventListener('click', (event) => {
    if (event.target == retweetModal) {
        retweetModal.style.display = 'none';
        retweetQuoteContentInput.value = '';
        quotedPostPreviewDiv.innerHTML = '';
        currentQuotedPostId = null;
    }
    if (event.target == shareModal) {
        shareModal.style.display = 'none';
    }
});

async function openRetweetModal(event) {
    const postId = event.currentTarget.dataset.postId;
    currentQuotedPostId = postId;

    try {
        const originalDoc = await db.collection('posts').doc(postId).get();
        if (originalDoc.exists) {
            const originalPostData = originalDoc.data();
            const originalAuthorName = originalPostData.authorName || `Anonim ${originalPostData.authorUid.substring(0, 8)}`;
            const originalAuthorUsername = originalPostData.authorUsername || `@anonim${originalPostData.authorUid.substring(0, 4)}`;
            let originalMedia = '';
            if (originalPostData.mediaUrl) {
                if (originalPostData.mediaUrl.toLowerCase().endsWith('.mp4') || originalPostData.mediaUrl.toLowerCase().endsWith('.webm')) {
                    originalMedia = `<video src="${originalPostData.mediaUrl}" controls></video>`;
                } else {
                    originalMedia = `<img src="${originalPostData.mediaUrl}" alt="Original Media">`;
                }
            }
            quotedPostPreviewDiv.innerHTML = `
                <div class="meta" style="text-align: left; margin-bottom: 5px;">
                    <strong>${originalAuthorName}</strong> <span style="color:var(--text-muted);">@${originalAuthorUsername}</span>
                </div>
                ${originalMedia}
                <p>${escapeHTML(originalPostData.content)}</p>
            `;
            retweetModal.style.display = 'flex';
        } else {
            alert("Postingan asli tidak ditemukan.");
        }
    } catch (error) {
        console.error("Error loading post for quote:", error);
        alert("Gagal memuat postingan untuk quote.");
    }
}

submitQuoteRetweetBtn.addEventListener('click', async () => {
    if (!currentUser || !currentQuotedPostId) {
        alert("Terjadi kesalahan. Coba lagi.");
        return;
    }

    const quoteContent = retweetQuoteContentInput.value.trim();

    try {
        const hashtags = extractHashtags(quoteContent);
        await db.collection('posts').add({
            content: quoteContent,
            authorUid: currentUser.uid,
            authorName: currentUserDisplayName,
            authorUsername: currentUserName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            mediaUrl: null,
            hashtags: hashtags,
            upvotes: 0,
            downvotes: 0,
            retweetOf: (quoteContent === "") ? currentQuotedPostId : null,
            quoteOf: (quoteContent !== "") ? currentQuotedPostId : null,
            groupId: null // Retweets/quotes are global by default unless done from within a group (not implemented yet for this flow)
        });
        alert("Kicauan Retweet berhasil dikirim!");
        retweetModal.style.display = 'none';
        retweetQuoteContentInput.value = '';
        quotedPostPreviewDiv.innerHTML = '';
        currentQuotedPostId = null;
    } catch (error) {
        console.error("Error saat mengirim retweet:", error);
        alert("Gagal mengirim retweet: " + error.message);
    }
});

closeShareModalBtn.addEventListener('click', () => {
    shareModal.style.display = 'none';
});

function openShareModal(event) {
    const postId = event.currentTarget.dataset.postId;
    const shareLink = `${window.location.origin}${window.location.pathname}?post=${postId}#postDetail/${postId}`;
    shareLinkInput.value = shareLink;
    shareModal.style.display = 'flex';
}

copyShareLinkBtn.addEventListener('click', () => {
    shareLinkInput.select();
    document.execCommand('copy');
    alert("Tautan berhasil disalin!");
});

// --- Search Functionality ---
let searchTimeout = null;
searchPostInput.addEventListener('input', (event) => {
    clearTimeout(searchTimeout);
    const searchTerm = event.target.value;
    searchTimeout = setTimeout(() => {
        const targetGrid = homePageContent.style.display === 'block' ? postsGridDiv : groupPostsGrid;
        const groupId = homePageContent.style.display === 'block' ? null : currentGroupDetailId;
        fetchPosts(searchTerm, groupId, targetGrid);
    }, 500);
});

// --- Group Management Functions ---

// Event listener for "Buat Grup Baru" button
createGroupBtn.addEventListener('click', () => {
    showPage('createGroup');
});

// Event listener for "Batal" button on create group form
cancelCreateGroupBtn.addEventListener('click', () => {
    showPage('group');
});

// Handle group banner file selection
groupBannerFileInput.addEventListener('change', (event) => {
    const file = event.target.files.item(0);
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert("Ukuran file banner tidak boleh lebih dari 5MB. Silakan pilih file lain.");
            groupBannerFileInput.value = ''; // Clear input
            selectedBannerFileNameSpan.textContent = "Tidak ada file dipilih";
            groupBannerPreview.innerHTML = '<span>Ukuran file terlalu besar!</span>';
            groupBannerPreview.style.backgroundImage = 'none';
            return;
        }

        selectedBannerFileNameSpan.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            groupBannerPreview.innerHTML = `<img src="${e.target.result}" alt="Banner Preview">`;
            groupBannerPreview.style.backgroundImage = 'none'; // Remove default background
        };
        reader.readAsDataURL(file);
    } else {
        selectedBannerFileNameSpan.textContent = "Tidak ada file dipilih";
        groupBannerPreview.innerHTML = '<span>Pratinjau Banner</span>';
        groupBannerPreview.style.backgroundImage = 'none';
    }
});


// Event listener for "Buat Grup" button in create group form
submitCreateGroupBtn.addEventListener('click', async () => {
    if (!currentUser) {
        alert("Anda harus masuk untuk membuat grup.");
        return;
    }

    const groupName = groupNameInput.value.trim();
    const groupDescription = groupDescriptionInput.value.trim();
    const groupCategory = groupCategorySelect.value;
    const groupBannerFile = groupBannerFileInput.files.length > 0 ? groupBannerFileInput.files.item(0) : null;

    if (!groupName) {
        alert("Nama grup tidak boleh kosong!");
        return;
    }

    let bannerUrl = null;
    if (groupBannerFile) {
        if (groupBannerFile.size > 5 * 1024 * 1024) { // Re-check size for safety
             alert("Ukuran file banner tidak boleh lebih dari 5MB. Silakan pilih file lain.");
            return;
        }
        const bannerRef = storageRef.child(`group_banners/${currentUser.uid}/${Date.now()}-${groupBannerFile.name}`);
        try {
            const uploadResult = await bannerRef.put(bannerRef);
            bannerUrl = await uploadResult.ref.getDownloadURL();
        } catch (error) {
            console.error("Error mengunggah banner grup:", error);
            alert("Gagal mengunggah banner grup.");
            return;
        }
    }

    try {
        await db.collection('groups').add({
            name: groupName,
            description: groupDescription,
            category: groupCategory,
            bannerUrl: bannerUrl,
            authorUid: currentUser.uid,
            authorName: currentUserDisplayName,
            members: [currentUser.uid], // Creator is the first member
            memberCount: 1,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        alert(`Grup "${groupName}" berhasil dibuat!`);
        showPage('group');
    } catch (error) {
        console.error("Error saat membuat grup:", error);
        alert("Gagal membuat grup: " + error.message);
    }
});

// Function to fetch and display groups
function fetchGroups() {
    db.collection('groups')
        .orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
            groupsGridDiv.innerHTML = '';
            if (snapshot.empty) {
                groupsGridDiv.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Belum ada grup yang dibuat.</p>';
                return;
            }

            snapshot.docs.forEach(doc => {
                const group = doc.data();
                const groupId = doc.id;
                const groupElement = document.createElement('div');
                groupElement.classList.add('group-item');
                groupElement.dataset.groupId = groupId;
                groupElement.onclick = () => showPage('groupDetail', { groupId });

                const bannerStyle = group.bannerUrl ? `background-image: url('${escapeHTML(group.bannerUrl)}');` : '';

                groupElement.innerHTML = `
                    <div class="group-banner-thumb" style="${bannerStyle}">
                        ${!group.bannerUrl ? '<i class="fas fa-users fa-3x"></i>' : ''}
                    </div>
                    <div class="group-content">
                        <h3>${escapeHTML(group.name)}</h3>
                        <p>${escapeHTML(group.description || 'Tidak ada deskripsi.')}</p>
                        <div class="group-meta">
                            Kategori: ${escapeHTML(group.category)} | Dibuat oleh: ${escapeHTML(group.authorName || 'Anonim')} | Anggota: ${group.memberCount || 1}
                        </div>
                    </div>
                `;
                groupsGridDiv.appendChild(groupElement);
            });
        }, (error) => {
            console.error("Error saat mendapatkan grup:", error);
            groupsGridDiv.innerHTML = `<p style="text-align: center; color: var(--accent-red);">Gagal memuat grup: ${error.message}</p>`;
        });
}

// Function to display group details
async function viewGroupDetail(groupId) {
    currentGroupDetailId = groupId; // Store current group ID

    groupDetailBanner.innerHTML = '<span>Memuat Banner...</span>';
    groupDetailBanner.style.backgroundImage = 'none';
    groupDetailName.textContent = 'Memuat Nama Grup...';
    groupDetailDescription.textContent = 'Memuat Deskripsi...';
    groupDetailCategory.textContent = 'Memuat...';
    groupDetailAuthor.textContent = 'Memuat...';
    groupDetailMembers.textContent = 'Memuat...';
    disbandUpVotesCountSpan.textContent = '0';
    disbandDownVotesCountSpan.textContent = '0';
    disbandVoteTimeRemainingSpan.textContent = '';
    voteDisbandUpBtn.disabled = true;
    voteDisbandDownBtn.disabled = true;
    joinGroupBtn.disabled = true;
    leaveGroupBtn.disabled = true;
    groupPostFormContainer.style.display = 'none'; // Hide post form initially

    try {
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (groupDoc.exists) {
            const groupData = groupDoc.data();
            groupDetailName.textContent = groupData.name;
            groupDetailDescription.textContent = groupData.description || 'Tidak ada deskripsi.';
            groupDetailCategory.textContent = groupData.category;
            groupDetailAuthor.textContent = groupData.authorName || `Anonim ${groupData.authorUid.substring(0, 8)}`;

            // Check membership status
            const isMember = groupData.members && groupData.members.includes(currentUser ? currentUser.uid : '');
            groupDetailMembers.textContent = groupData.memberCount || 1;
            joinGroupBtn.style.display = isMember ? 'none' : 'inline-block';
            leaveGroupBtn.style.display = isMember ? 'inline-block' : 'none';
            groupPostFormContainer.style.display = isMember ? 'block' : 'none';
            currentGroupNameForPost.textContent = groupData.name;

            joinGroupBtn.disabled = !currentUser;
            leaveGroupBtn.disabled = !currentUser;

            if (groupData.bannerUrl) {
                groupDetailBanner.style.backgroundImage = `url('${escapeHTML(groupData.bannerUrl)}')`;
                groupDetailBanner.innerHTML = '';
            } else {
                groupDetailBanner.innerHTML = '<i class="fas fa-users fa-4x" style="color:#ccc;"></i>';
            }

            // Fetch and display group-specific posts
            fetchPosts('', groupId, groupPostsGrid);

            // Fetch and display disband votes
            await fetchDisbandVotes(groupId);

            voteDisbandUpBtn.disabled = !currentUser;
            voteDisbandDownBtn.disabled = !currentUser;

        } else {
            alert("Grup tidak ditemukan.");
            showPage('group');
        }
    } catch (error) {
        console.error("Error fetching group details:", error);
        alert("Gagal memuat detail grup.");
        showPage('group');
    }
}

// Join/Leave Group functionality
joinGroupBtn.addEventListener('click', async () => {
    if (!currentUser || !currentGroupDetailId) return;

    try {
        const groupRef = db.collection('groups').doc(currentGroupDetailId);
        await db.runTransaction(async (transaction) => {
            const groupDoc = await transaction.get(groupRef);
            if (!groupDoc.exists) throw "Grup tidak ditemukan.";

            const members = groupDoc.data().members || [];
            if (!members.includes(currentUser.uid)) {
                members.push(currentUser.uid);
                transaction.update(groupRef, {
                    members: members,
                    memberCount: firebase.firestore.FieldValue.increment(1)
                });
                alert('Anda berhasil bergabung dengan grup ini!');
            } else {
                alert('Anda sudah menjadi anggota grup ini.');
            }
        });
        viewGroupDetail(currentGroupDetailId); // Refresh UI
    } catch (error) {
        console.error("Error joining group:", error);
        alert("Gagal bergabung grup: " + error.message);
    }
});

leaveGroupBtn.addEventListener('click', async () => {
    if (!currentUser || !currentGroupDetailId) return;

    try {
        const groupRef = db.collection('groups').doc(currentGroupDetailId);
        await db.runTransaction(async (transaction) => {
            const groupDoc = await transaction.get(groupRef);
            if (!groupDoc.exists) throw "Grup tidak ditemukan.";

            const members = groupDoc.data().members || [];
            const newMembers = members.filter(uid => uid !== currentUser.uid);

            if (newMembers.length < members.length) {
                transaction.update(groupRef, {
                    members: newMembers,
                    memberCount: firebase.firestore.FieldValue.increment(-1)
                });
                alert('Anda telah keluar dari grup ini.');
            } else {
                alert('Anda bukan anggota grup ini.');
            }
        });
        viewGroupDetail(currentGroupDetailId); // Refresh UI
    } catch (error) {
        console.error("Error leaving group:", error);
        alert("Gagal keluar grup: " + error.message);
    }
});


// --- Disband Vote Functionality (24-hour, Up/Down) ---
async function fetchDisbandVotes(groupId) {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
        // Query votes for this group within the last 24 hours
        const voteSnapshot = await db.collection('groupDisbandVotes')
            .where('groupId', '==', groupId)
            .where('timestamp', '>', twentyFourHoursAgo)
            .get();

        let upVotes = 0;
        let downVotes = 0;
        const userVoted = { up: false, down: false }; // To track if current user already voted

        voteSnapshot.forEach(doc => {
            const voteData = doc.data();
            if (voteData.voteType === 'up') {
                upVotes++;
            } else if (voteData.voteType === 'down') {
                downVotes++;
            }
            if (currentUser && voteData.voterUid === currentUser.uid) {
                if (voteData.voteType === 'up') userVoted.up = true;
                if (voteData.voteType === 'down') userVoted.down = true;
            }
        });

        disbandUpVotesCountSpan.textContent = upVotes;
        disbandDownVotesCountSpan.textContent = downVotes;

        // Disable buttons if user already voted
        voteDisbandUpBtn.disabled = !currentUser || userVoted.up;
        voteDisbandDownBtn.disabled = !currentUser || userVoted.down;

        // Calculate time remaining for the oldest vote if needed for threshold
        // For simplicity here, we'll just show a generic message or last vote time.
        // A more robust system would involve tracking oldest vote timestamp.
        disbandVoteTimeRemainingSpan.textContent = ''; // Clear for now

        if (upVotes > downVotes && upVotes > 0) { // Simple threshold: any upvote wins if more than down
             // This needs to be extremely careful in production.
             // Consider using a Cloud Function to handle actual disbandment
             // to prevent race conditions and ensure data integrity.
             // For now, it's client-side triggered.
             if (confirm(`Vote bubar (${upVotes} Up vs ${downVotes} Down) lebih banyak! Apakah Anda yakin ingin membubarkan grup ini?`)) {
                 await db.collection('groups').doc(groupId).delete();
                 // Delete all related groupDisbandVotes too
                 voteSnapshot.forEach(async (doc) => {
                    await db.collection('groupDisbandVotes').doc(doc.id).delete();
                 });
                 alert("Grup berhasil dibubarkan!");
                 showPage('group');
             }
        }

    } catch (error) {
        console.error("Error fetching disband votes:", error);
        disbandVoteTimeRemainingSpan.textContent = "Error memuat vote.";
    }
}

// Event listener for "Vote Bubar Up" button
voteDisbandUpBtn.addEventListener('click', () => submitDisbandVote('up'));

// Event listener for "Vote Bubar Down" button
voteDisbandDownBtn.addEventListener('click', () => submitDisbandVote('down'));


async function submitDisbandVote(voteType) {
    if (!currentUser || !currentGroupDetailId) {
        alert("Anda harus masuk untuk vote.");
        return;
    }

    const groupId = currentGroupDetailId;
    const voterUid = currentUser.uid;

    try {
        await db.runTransaction(async (transaction) => {
            // Check if user already voted in the last 24 hours for this group
            const now = new Date();
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const existingVoteQuery = await transaction.get(
                db.collection('groupDisbandVotes')
                    .where('groupId', '==', groupId)
                    .where('voterUid', '==', voterUid)
                    .where('timestamp', '>', twentyFourHoursAgo)
            );

            if (!existingVoteQuery.empty) {
                // User has already voted within 24 hours
                const existingVote = existingVoteQuery.docs[0].data();
                if (existingVote.voteType === voteType) {
                    alert(`Anda sudah memberikan vote '${voteType}' untuk pembubaran grup ini dalam 24 jam terakhir.`);
                } else {
                    // Allow changing vote
                    transaction.update(existingVoteQuery.docs[0].ref, {
                        voteType: voteType,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    alert(`Vote Anda berhasil diubah menjadi '${voteType}'.`);
                }
                return;
            }

            // Record new vote
            transaction.set(db.collection('groupDisbandVotes').doc(), {
                groupId: groupId,
                voterUid: voterUid,
                voteType: voteType, // 'up' or 'down'
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`Vote '${voteType}' berhasil dicatat!`);
        });
        await fetchDisbandVotes(groupId); // Recalculate and update UI after vote
    } catch (error) {
        console.error("Error submitting disband vote:", error);
        alert("Gagal mencatat vote bubar: " + error.message);
    }
}


// Event listener for "Kembali ke Grup" button on group detail page
backToGroupsBtn.addEventListener('click', () => {
    showPage('group');
});


// --- Post Detail Page ---
backToFeedBtn.addEventListener('click', () => {
    if (currentGroupDetailId) { // If we came from a group, go back to group detail
        showPage('groupDetail', { groupId: currentGroupDetailId });
    } else {
        showPage('home'); // Otherwise, go to home feed
    }
});

async function viewPostDetail(postId) {
    currentPostDetailId = postId;
    singlePostContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Memuat kicauan...</p>';
    retweetsListDiv.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Memuat retweet...</p>';

    try {
        const postDoc = await db.collection('posts').doc(postId).get();
        if (postDoc.exists) {
            const postElement = await createPostElement(postDoc, true); // Pass true for isDetailed
            singlePostContainer.innerHTML = '';
            singlePostContainer.appendChild(postElement);
            attachPostEventListeners(singlePostContainer); // Attach listeners for this specific post

            // Fetch and display retweets for this post
            fetchRetweets(postId);

        } else {
            singlePostContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Kicauan tidak ditemukan.</p>';
            retweetsListDiv.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Tidak ada retweet.</p>';
        }
    } catch (error) {
        console.error("Error fetching post detail:", error);
        singlePostContainer.innerHTML = `<p style="text-align: center; color: var(--accent-red);">Gagal memuat detail kicauan: ${error.message}</p>`;
    }
}

function fetchRetweets(originalPostId) {
    db.collection('posts')
        .where('retweetOf', '==', originalPostId)
        .orderBy('timestamp', 'desc')
        .onSnapshot(async (snapshot) => {
            retweetsListDiv.innerHTML = '';
            if (snapshot.empty) {
                retweetsListDiv.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Tidak ada retweet untuk kicauan ini.</p>';
                return;
            }

            const retweetElementsPromises = snapshot.docs.map(async (doc) => {
                return createPostElement(doc);
            });
            const retweetElements = await Promise.all(retweetElementsPromises);
            retweetElements.forEach(el => retweetsListDiv.appendChild(el));
            attachPostEventListeners(retweetsListDiv); // Attach listeners for retweets
        }, (error) => {
            console.error("Error fetching retweets:", error);
            retweetsListDiv.innerHTML = `<p style="text-align: center; color: var(--accent-red);">Gagal memuat retweet: ${error.message}</p>`;
        });
}


// --- Helper Functions ---
function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function extractHashtags(text) {
    const hashtagRegex = /(#\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches : [];
}

function formatHashtags(text) {
    const hashtagRegex = /(#\w+)/g;
    return text.replace(hashtagRegex, '<a href="#" class="hashtag">$1</a>');
}

function viewOriginalPostDetail(event) {
    const originalId = event.currentTarget.dataset.postId;
    if (originalId) {
        // Prevent default click behavior to avoid double triggering if the whole post item is clickable
        event.stopPropagation();
        showPage('postDetail', { postId: originalId });
    }
}
