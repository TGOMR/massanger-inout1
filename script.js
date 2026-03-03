let currentUser = localStorage.getItem('activeUser') || null;
let activeChatId = null;
let isLoginMode = false;
// ... (в начало файла)
let profile = JSON.parse(localStorage.getItem(`profile_${currentUser}`)) || {
    name: currentUser,
    avatar: ""
};

// Функции профиля
function updateProfileUI() {
    document.getElementById('my-name-display').textContent = profile.name;
    const avatarEls = [document.getElementById('my-avatar-preview')];
    avatarEls.forEach(el => {
        if(profile.avatar) el.style.backgroundImage = `url('${profile.avatar}')`;
    });
}

// Открытие модалки
document.getElementById('open-profile').onclick = () => {
    document.getElementById('profile-modal').style.display = 'flex';
    document.getElementById('edit-display-name').value = profile.name;
    document.getElementById('edit-avatar-url').value = profile.avatar;
};

// Закрытие
document.getElementById('close-profile-btn').onclick = () => {
    document.getElementById('profile-modal').style.display = 'none';
};

// Сохранение
document.getElementById('save-profile-btn').onclick = () => {
    profile.name = document.getElementById('edit-display-name').value.trim() || currentUser;
    profile.avatar = document.getElementById('edit-avatar-url').value.trim();
    
    localStorage.setItem(`profile_${currentUser}`, JSON.stringify(profile));
    updateProfileUI();
    document.getElementById('profile-modal').style.display = 'none';
};

// В конец блока инициализации (if (currentUser))
if (currentUser) {
    // ... существующий код ...
    updateProfileUI();
}

// В функцию sendMessage добавить имя отправителя из профиля
function loadMessages() {
    const box = document.getElementById('messages-box');
    const key = `msgs_${currentUser}_${activeChatId}`;
    const history = JSON.parse(localStorage.getItem(key)) || [];
    box.innerHTML = '';
    history.forEach(m => {
        const div = document.createElement('div');
        div.className = `msg ${m.sender === currentUser ? 'outbound' : 'inbound'}`;
        // Добавим имя над сообщением для красоты
        const nameLabel = m.sender === currentUser ? profile.name : contacts.find(c => c.id === activeChatId)?.name;
        div.innerHTML = `<div style="font-size: 10px; opacity: 0.7; margin-bottom: 4px;">${nameLabel}</div>${m.text}`;
        box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
}


const contacts = [
    { id: 'durov', name: "Павел Дуров" },
    { id: 'support', name: "Discord Support" },
    { id: 'bot', name: "Mee6 Bot" },
    { id: 'petya', name: "Петя (Школа)" }
];

// Авторизация
const switchBtn = document.getElementById('switch-auth');
if(switchBtn) switchBtn.onclick = () => {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').textContent = isLoginMode ? "С возвращением!" : "Создать аккаунт";
    document.getElementById('auth-btn').textContent = isLoginMode ? "Вход" : "Зарегистрироваться";
};

document.getElementById('auth-btn').onclick = () => {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    if (isLoginMode) {
        if (localStorage.getItem(`u_${u}`) === p) {
            localStorage.setItem('activeUser', u);
            location.reload();
        } else alert("Ошибка!");
    } else {
        localStorage.setItem(`u_${u}`, p);
        alert("Готово! Войдите.");
        switchBtn.click();
    }
};

// ПОИСК И РЕНДЕР
function renderChats(filter = "") {
    const container = document.getElementById('chats-container');
    if (!container) return;
    container.innerHTML = '';

    const filtered = contacts.filter(c => 
        c.name.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(c => {
        const div = document.createElement('div');
        div.className = `chat-item ${activeChatId === c.id ? 'active' : ''}`;
        div.innerHTML = `<strong>${c.name}</strong>`;
        div.onclick = () => {
            activeChatId = c.id;
            document.getElementById('current-chat-name').textContent = c.name;
            document.getElementById('input-zone').style.display = 'block';
            renderChats(filter); // Обновляем активный класс
            loadMessages();
        };
        container.appendChild(div);
    });
}

// Слушатель поиска
document.getElementById('search-input').oninput = (e) => {
    renderChats(e.target.value);
};

// Сообщения
function loadMessages() {
    const box = document.getElementById('messages-box');
    const key = `msgs_${currentUser}_${activeChatId}`;
    const history = JSON.parse(localStorage.getItem(key)) || [];
    box.innerHTML = '';
    history.forEach(m => {
        const div = document.createElement('div');
        div.className = `msg ${m.sender === currentUser ? 'outbound' : 'inbound'}`;
        div.textContent = m.text;
        box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('msg-input');
    if (input.value.trim() && activeChatId) {
        const key = `msgs_${currentUser}_${activeChatId}`;
        const history = JSON.parse(localStorage.getItem(key)) || [];
        history.push({ sender: currentUser, text: input.value.trim() });
        localStorage.setItem(key, JSON.stringify(history));
        input.value = '';
        loadMessages();
    }
}


// 1. Обновленная загрузка сообщений с отрисовкой галочек
function loadMessages() {
    const box = document.getElementById('messages-box');
    const key = `msgs_${currentUser}_${activeChatId}`;
    const history = JSON.parse(localStorage.getItem(key)) || [];
    box.innerHTML = '';

    history.forEach(m => {
        const div = document.createElement('div');
        div.className = `msg ${m.sender === currentUser ? 'outbound' : 'inbound'}`;
        
        // Логика галочек: если отправитель я — показываем статус
        let ticks = '';
        if (m.sender === currentUser) {
            const tickClass = m.status === 'read' ? 'read' : 'sent';
            const tickIcon = m.status === 'read' ? '✓✓' : '✓';
            ticks = `<span class="ticks ${tickClass}">${tickIcon}</span>`;
        }

        const nameLabel = m.sender === currentUser ? (profile.name || currentUser) : (contacts.find(c => c.id === activeChatId)?.name || "Собеседник");
        
        div.innerHTML = `
            <div class="msg-content">
                <div style="font-size: 10px; opacity: 0.7; margin-bottom: 2px;">${nameLabel}</div>
                <div>${m.text}</div>
                <div class="msg-footer">${ticks}</div>
            </div>
        `;
        box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
}

// 2. Обновленная отправка с имитацией прочтения
function sendMessage() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (text && activeChatId) {
        const key = `msgs_${currentUser}_${activeChatId}`;
        const history = JSON.parse(localStorage.getItem(key)) || [];
        
        // Создаем сообщение со статусом 'sent' (одна галочка)
        const newMsg = { 
            sender: currentUser, 
            text: text, 
            status: 'sent',
            id: Date.now() 
        };
        
        history.push(newMsg);
        localStorage.setItem(key, JSON.stringify(history));
        input.value = '';
        loadMessages();

        // Имитация прочтения через 1.5 секунды
        setTimeout(() => {
            const currentHistory = JSON.parse(localStorage.getItem(key)) || [];
            const msgIndex = currentHistory.findIndex(m => m.id === newMsg.id);
            if (msgIndex !== -1) {
                currentHistory[msgIndex].status = 'read'; // Меняем на две галочки
                localStorage.setItem(key, JSON.stringify(currentHistory));
                // Обновляем экран только если этот чат всё еще открыт
                if (activeChatId === activeChatId) loadMessages(); 
            }
        }, 1500);
    }
}


document.getElementById('send-btn').onclick = sendMessage;
document.getElementById('msg-input').onkeyup = (e) => e.key === 'Enter' && sendMessage();
document.getElementById('logout-btn').onclick = () => { localStorage.removeItem('activeUser'); location.reload(); };

// Старт
if (currentUser) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    renderChats();
}
