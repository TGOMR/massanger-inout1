let currentUser = localStorage.getItem('activeUser') || null;
let activeChatId = null;
let isLoginMode = false;
let mediaRecorder;
let videoChunks = [];

// Данные профиля
let profile = JSON.parse(localStorage.getItem(`profile_${currentUser}`)) || {
    name: currentUser || "Гость",
    avatar: "",
    bio: "Станьте частью сообщества!"
};

const contacts = [
    { id: 'durov', name: "Павел Дуров", avatar: "https://paveldurov.com", bio: "Основатель Telegram" },
    { id: 'support', name: "Discord Support", avatar: "", bio: "Поддержка i4m" },
    { id: 'petya', name: "Петя (Школа)", avatar: "", bio: "Учусь кодить" }
];
// Функция для мобильной навигации
document.addEventListener('DOMContentLoaded', () => {
    const chatsContainer = document.getElementById('chats-container');
    const backBtn = document.getElementById('back-to-list');

    // 1. Когда кликаем на список чатов (делегирование событий)
    chatsContainer.addEventListener('click', (e) => {
        // Проверяем, что кликнули по чату или внутри него
        if (window.innerWidth <= 768) {
            document.body.classList.add('chat-open');
        }
    });

    // 2. Когда кликаем кнопку "Назад"
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.body.classList.remove('chat-open');
        });
    }
});


// --- ИНИЦИАЛИЗАЦИЯ ---
function init() {
    if (currentUser) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        updateProfileUI();
        renderChats();
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
    }
}

function updateProfileUI() {
    if (!currentUser) return;
    document.getElementById('my-name-display').textContent = profile.name;
    const av = document.getElementById('my-avatar-preview');
    if (profile.avatar) {
        av.style.backgroundImage = `url('${profile.avatar}')`;
        av.textContent = '';
    } else {
        av.style.backgroundColor = 'var(--accent)';
        av.textContent = profile.name[0].toUpperCase();
    }
}

// --- АВТОРИЗАЦИЯ (ИСПРАВЛЕНО) ---
document.getElementById('switch-auth').onclick = () => {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').textContent = isLoginMode ? "Вход" : "Создать аккаунт";
    document.getElementById('auth-btn').textContent = isLoginMode ? "Войти" : "Зарегистрироваться";
};

document.getElementById('auth-btn').onclick = () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if (!u || !p) return alert("Заполните поля");

    if (isLoginMode) {
        if (localStorage.getItem(`u_${u}`) === p) {
            localStorage.setItem('activeUser', u);
            location.reload();
        } else alert("Ошибка входа");
    } else {
        localStorage.setItem(`u_${u}`, p);
        alert("Успешно! Теперь войдите");
        document.getElementById('switch-auth').click();
    }
};

document.getElementById('logout-btn-main').onclick = () => {
    localStorage.removeItem('activeUser');
    location.reload();
};

// --- ЧАТЫ ---
function renderChats() {
    const container = document.getElementById('chats-container');
    container.innerHTML = '';
    contacts.forEach(c => {
        const div = document.createElement('div');
        div.className = `chat-item ${activeChatId === c.id ? 'active' : ''}`;
        const avBG = c.avatar ? `background-image:url('${c.avatar}')` : `background-color:var(--accent)`;
        div.innerHTML = `
            <div class="avatar" style="${avBG}">${c.avatar ? '' : c.name[0]}</div>
            <div class="chat-info"><strong>${c.name}</strong><div style="font-size:11px; opacity:0.6">Нажмите...</div></div>
        `;
        div.onclick = () => {
            activeChatId = c.id;
            document.getElementById('current-chat-name').textContent = c.name;
            document.getElementById('input-zone').style.display = 'block';
            renderChats();
            loadMessages();
        };
        container.appendChild(div);
    });
}

// --- СООБЩЕНИЯ (ФОТО + КРУЖКИ + КЛИКИ) ---
function loadMessages() {
    const box = document.getElementById('messages-box');
    const key = `msgs_${currentUser}_${activeChatId}`;
    const history = JSON.parse(localStorage.getItem(key)) || [];
    const contact = contacts.find(c => c.id === activeChatId);
    box.innerHTML = '';

    history.forEach(m => {
        const isMe = m.sender === currentUser;
        const wrap = document.createElement('div');
        wrap.className = `msg-wrapper ${isMe ? 'outbound' : 'inbound'}`;
        
        let body = `<div>${m.text}</div>`;
        if (m.type === 'image') body = `<img src="${m.url}" class="chat-img" onclick="window.open('${m.url}')">`;
        if (m.type === 'video') body = `<div class="circle-message"><video src="${m.url}" controls></video></div>`;

        const avURL = isMe ? profile.avatar : contact.avatar;
        const avStyle = avURL ? `background-image:url('${avURL}')` : `background-color:var(--accent)`;

        wrap.innerHTML = `
            <div class="msg-avatar" style="${avStyle}">${avURL ? '' : (isMe ? profile.name[0] : contact.name[0])}</div>
            <div class="msg">
                <div class="msg-content">${body}</div>
                <div class="msg-footer">${isMe ? (m.status === 'read' ? '✓✓' : '✓') : ''}</div>
            </div>
        `;

        wrap.querySelector('.msg-avatar').onclick = () => {
            if(isMe) document.getElementById('open-profile').click();
            else openViewProfile(contact);
        };
        box.appendChild(wrap);
    });
    box.scrollTop = box.scrollHeight;
}

function sendMessage(type, data) {
    const input = document.getElementById('msg-input');
    if (type === 'text' && !input.value.trim()) return;
    const key = `msgs_${currentUser}_${activeChatId}`;
    const history = JSON.parse(localStorage.getItem(key)) || [];
    const msg = { sender: currentUser, type, text: input.value, url: data, status: 'sent', id: Date.now() };
    history.push(msg);
    localStorage.setItem(key, JSON.stringify(history));
    input.value = '';
    loadMessages();
    setTimeout(() => {
        const h = JSON.parse(localStorage.getItem(key));
        const i = h.findIndex(x => x.id === msg.id);
        if(i !== -1) { h[i].status = 'read'; localStorage.setItem(key, JSON.stringify(h)); loadMessages(); }
    }, 1500);
}

document.getElementById('message-form').onsubmit = (e) => { e.preventDefault(); sendMessage('text'); };

// --- ФОТО ---
const imgInp = document.getElementById('image-input');
document.getElementById('attach-btn').onclick = () => imgInp.click();
imgInp.onchange = () => {
    const r = new FileReader();
    r.onload = (e) => sendMessage('image', e.target.result);
    r.readAsDataURL(imgInp.files[0]);
};

// --- КРУЖКИ ---
const recBtn = document.getElementById('record-circle-btn');
const recModal = document.getElementById('video-record-modal');

recBtn.onclick = async () => {
    recModal.style.display = 'flex';
    const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('video-preview').srcObject = s;
    mediaRecorder = new MediaRecorder(s);
    videoChunks = [];
    mediaRecorder.ondataavailable = (e) => videoChunks.push(e.data);
    mediaRecorder.onstop = () => {
        const b = new Blob(videoChunks, { type: 'video/mp4' });
        const r = new FileReader();
        r.onload = (e) => sendMessage('video', e.target.result);
        r.readAsDataURL(b);
        s.getTracks().forEach(t => t.stop());
    };
};

document.getElementById('start-record').onclick = () => {
    mediaRecorder.start();
    document.getElementById('start-record').style.display='none';
    document.getElementById('stop-record').style.display='block';
};
document.getElementById('stop-record').onclick = () => {
    mediaRecorder.stop();
    recModal.style.display='none';
    document.getElementById('start-record').style.display='block';
    document.getElementById('stop-record').style.display='none';
};

// --- ПРОФИЛЬ ---
function openViewProfile(u) {
    const m = document.getElementById('view-user-modal');
    document.getElementById('view-user-name').textContent = u.name;
    document.getElementById('view-user-bio').textContent = u.bio;
    const av = document.getElementById('view-user-avatar');
    if(u.avatar) av.style.backgroundImage = `url('${u.avatar}')`;
    else av.style.backgroundColor = 'var(--accent)';
    m.style.display = 'flex';
}

document.getElementById('open-profile').onclick = () => {
    document.getElementById('profile-modal').style.display = 'flex';
    document.getElementById('edit-display-name').value = profile.name;
    document.getElementById('edit-bio').value = profile.bio;
};

document.getElementById('save-profile-btn').onclick = () => {
    profile.name = document.getElementById('edit-display-name').value;
    profile.bio = document.getElementById('edit-bio').value;
    profile.avatar = document.getElementById('edit-avatar-url').value;
    localStorage.setItem(`profile_${currentUser}`, JSON.stringify(profile));
    location.reload();
};

init();
