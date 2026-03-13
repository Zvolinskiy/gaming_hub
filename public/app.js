let currentUser = localStorage.getItem('username');
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    if (currentUser) {
        syncDashboard();
    } else {
        updateUI(false);
    }

    showSection('home-sec');
    renderShop('weapons');
    loadNews();
    loadReviews();
});

async function syncDashboard() {
    if (!currentUser) return;
    try {
        const res = await fetch(`/api/dashboard?username=${encodeURIComponent(currentUser)}`);
        if (!res.ok) throw new Error('Ошибка сервера');
        const data = await res.json();
        
        const bVal = document.getElementById('balance-val');
        const pBVal = document.getElementById('p-balance');
        if (bVal) bVal.innerText = data.wallet.toLocaleString();
        if (pBVal) pBVal.innerText = data.wallet.toLocaleString();

        const pUser = document.getElementById('p-username');
        const pLevel = document.getElementById('p-level');
        const pProg = document.getElementById('p-progress');
        
        if (pUser) pUser.innerText = data.profile.username;
        if (pLevel) pLevel.innerText = data.profile.rank;
        if (pProg) pProg.style.width = `${data.profile.xp % 100}%`;
        
        updateUI(true);
    } catch (err) {
        console.error("Ошибка синхронизации:", err);
    }
}

function showSection(id) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('onclick')?.includes(id)) {
            l.classList.add('active');
        }
    });
}

function renderShop(category = 'weapons') {
    const container = document.getElementById('shop-items-container');
    if (!container) return;

    const database = {
        weapons: [],
        knives: [],
        stickers: [],
        clothing: [],
        steam: [{ name: 'Steam Fill', price: 0 }]
    };

    const wNames = ['AK-47', 'M4A4', 'AWP', 'Desert Eagle', 'Glock-18', 'USP-S'];
    const wSkins = ['Asiimov', 'Dragon Lore', 'Printstream', 'Neo-Noir', 'Hyper Beast', 'Redline'];
    for (let i = 1; i <= 40; i++) {
        const name = wNames[i % wNames.length];
        const skin = wSkins[i % wSkins.length];
        database.weapons.push({
            name: `${name} | ${skin} #${i}`,
            price: 5000 + (i * 1200),
            img: `https://placehold.co/300x200/16161d/ff4655?text=${name}+${i}`
        });
    }

    const kTypes = ['Karambit', 'Butterfly', 'M9 Bayonet', 'Talon'];
    const kSkins = ['Doppler', 'Fade', 'Tiger Tooth', 'Marble Fade'];
    for (let i = 1; i <= 30; i++) {
        const type = kTypes[i % kTypes.length];
        const skin = kSkins[i % kSkins.length];
        database.knives.push({
            name: `★ ${type} | ${skin}`,
            price: 150000 + (i * 10000),
            img: `https://placehold.co/300x200/16161d/ff4655?text=${type}`
        });
    }

    for (let i = 1; i <= 30; i++) {
        database.stickers.push({
            name: `Sticker | Major Team ${i} (Holo)`,
            price: 1500 + (i * 200),
            img: `https://placehold.co/300x200/16161d/ff4655?text=STICKER+${i}`
        });
    }

    for (let i = 1; i <= 10; i++) {
        database.clothing.push({
            name: `Hub Jersey Edition v${i}`,
            price: 12000,
            img: `https://placehold.co/300x200/16161d/ff4655?text=JERSEY+${i}`
        });
    }

    let html = `
        <div class="shop-navigation-top">
            <button class="cat-btn ${category === 'weapons' ? 'active' : ''}" onclick="renderShop('weapons')">Пушки</button>
            <button class="cat-btn ${category === 'knives' ? 'active' : ''}" onclick="renderShop('knives')">Ножи</button>
            <button class="cat-btn ${category === 'stickers' ? 'active' : ''}" onclick="renderShop('stickers')">Стикеры</button>
            <button class="cat-btn ${category === 'clothing' ? 'active' : ''}" onclick="renderShop('clothing')">Одежда</button>
            <button class="cat-btn ${category === 'steam' ? 'active' : ''}" onclick="renderShop('steam')">Steam</button>
        </div>
        <div class="shop-scroll-area">
            <div class="items-grid">
    `;

    if (category === 'steam') {
        html += `
            <div class="glass-morphism steam-card" style="grid-column: 1/-1">
                <h3>Пополнение Steam</h3>
                <input type="text" id="steam-id" placeholder="Steam Login" class="mb-15">
                <input type="number" id="steam-amount" placeholder="Сумма ₸" class="mb-15">
                <button class="btn-primary full-width" onclick="fakeSteamTopUp()">Пополнить</button>
            </div>`;
    } else {
        html += (database[category] || []).map(item => `
            <div class="item-card glass-morphism">
                <img src="${item.img}" alt="item">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p class="accent-text">${item.price.toLocaleString()} ₸</p>
                    <button class="btn-primary full-width" onclick="addToCart('${item.name}', ${item.price})">В корзину</button>
                </div>
            </div>
        `).join('');
    }

    container.innerHTML = html + `</div></div>`;
}

function addToCart(name, price) {
    cart.push({ name, price });
    
    const cartCount = document.getElementById('cart-count');
    if (cartCount) cartCount.innerText = cart.length;
    
    saveCart();
    alert(`${name} добавлен в корзину!`);
}
function openCart() {
    const list = document.getElementById('cart-items-list');
    const total = document.getElementById('cart-total-price');
    if (!list || !total) return;

    if (cart.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding:20px;">Корзина пуста</p>';
        total.innerText = '0 ₸';
    } else {
        list.innerHTML = cart.map(item => `
            <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; margin-bottom:8px;">
                <span>${item.name}</span>
                <span class="accent-text">${item.price} ₸</span>
            </div>
        `).join('');
        total.innerText = cart.reduce((s, i) => s + i.price, 0).toLocaleString() + " ₸";
    }
    openModal('cartModal');
}

async function checkout() {
    if (!currentUser) return openModal('loginModal');
    if (cart.length === 0) return;

    const btn = event ? event.target : null; 
    if (btn) {
        btn.innerText = "Обработка...";
        btn.disabled = true;
    }

    try {
        for (const item of cart) {
            const res = await fetch('/api/shop/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: currentUser, 
                    itemName: item.name, 
                    price: item.price 
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Сервер ответил ошибкой:", errorText);
                throw new Error(`Сервер вернул код ${res.status}. Проверь роут на бэкенде.`);
            }

            const data = await res.json();
            if (!data.success) throw new Error(data.error);
        }
        
        alert("Покупки успешно оплачены!");
        
        cart = [];
        localStorage.removeItem('cart');
        
        const cartCount = document.getElementById('cart-count');
        if (cartCount) cartCount.innerText = "0";
        
        closeModal('cartModal');
        syncDashboard();

    } catch (err) {
        console.error("Детали ошибки:", err);
        alert("Ошибка: " + err.message);
    } finally {
        if (btn) {
            btn.innerText = "Оплатить заказ";
            btn.disabled = false;
        }
    }
}

async function loadNews() {
    try {
        const res = await fetch('/api/news');
        const news = await res.json();
        const container = document.getElementById('news-container');
        
        if (container) {
            if (news.length === 0) {
                container.innerHTML = '<p class="text-dim">Новостей пока нет...</p>';
                return;
            }
            container.innerHTML = news.map(n => `
                <div class="news-item glass-morphism">
                    <small class="accent-text">${new Date(n.createdAt).toLocaleDateString()}</small>
                    <h3>${n.title}</h3>
                    <p>${n.content}</p>
                    <div class="news-footer">Автор: ${n.author || 'Admin'}</div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error("Ошибка загрузки ленты:", err);
    }
}

async function loadReviews() {
    const res = await fetch('/api/reviews');
    const reviews = await res.json();
    const list = document.getElementById('reviews-container');
    
    if (list) {
        list.innerHTML = reviews.map(r => `
            <div class="review-item">
                <div class="rev-stars">${"⭐".repeat(r.stars)}</div>
                <p>${r.content}</p>
                <small>${r.author || 'Аноним'} | ${new Date(r.createdAt).toLocaleDateString()}</small>
            </div>
        `).join('');
    }
}

async function loadTopPlayers() {
    const container = document.getElementById('top-players-container');
    if (!container) return;

    try {
        const res = await fetch('/api/top-players');
        const players = await res.json();

        container.innerHTML = players.map((p, i) => `
            <div class="item-card glass-morphism">
                <div class="accent-text" style="font-size: 1.2rem; font-weight: 900; margin-bottom: 10px;">#${i + 1}</div>
                <img src="https://i.pravatar.cc/100?u=${p.username}" style="width: 60px; border-radius: 50%; margin-bottom: 10px; border: 2px solid var(--accent);">
                <h3 style="font-size: 1rem; margin-bottom: 5px;">${p.username}</h3>
                <div class="accent-text" style="font-size: 0.8rem; font-weight: 800;">${p.rank || 'Silver I'}</div>
                <div class="xp-container" style="height: 6px; margin: 15px 0;">
                    <div class="xp-bar-fill" style="width: ${p.xp % 100}%"></div>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-dim);">Всего XP: ${p.xp.toLocaleString()}</div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Ошибка загрузки топа:", err);
        container.innerHTML = '<p class="text-dim">Не удалось загрузить список игроков...</p>';
    }
}

async function submitReview(event) {
    event.preventDefault();
    
    const formData = {
        author: localStorage.getItem('username') || 'Гость',
        content: document.getElementById('reviewContent').value,
        stars: document.getElementById('reviewStars').value,
        type: 'review'
    };

    const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });

    if (res.ok) {
        document.getElementById('reviewContent').value = '';
        closeModal('reviewModal');
        await loadReviews(); 
    }
}

document.addEventListener('DOMContentLoaded', loadReviews);

function updateUI(isAuth) {
    const authOnly = document.querySelectorAll('.auth-only');
    const loginBtn = document.getElementById('login-btn');

    if (isAuth) {
        authOnly.forEach(el => el.style.display = 'flex');
        
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выйти';
            loginBtn.className = 'btn-logout';
            loginBtn.onclick = logout;
        }
    } else {
        authOnly.forEach(el => el.style.display = 'none');
        
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-user"></i> Войти';
            loginBtn.className = 'btn-primary';
            loginBtn.onclick = () => openModal('loginModal');
        }
    }
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

async function processTopUp() {
    const amount = document.getElementById('topup-amount').value;
    if (!amount) return;
    
    await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, amount })
    });

    closeModal('topupModal');
    syncDashboard();
    alert("Запрос на пополнение отправлен!");
}

function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
}

function toggleAuth(isLogin) {
    const title = document.getElementById('auth-title');
    const btn = document.querySelector('#loginForm button');
    const switchLink = document.querySelector('.switch-auth');

    if (isLogin) {
        title.innerText = 'Авторизация';
        btn.innerText = 'Войти в Хаб';
        switchLink.innerHTML = 'Нет аккаунта? <a href="#" onclick="toggleAuth(false)">Регистрация</a>';
    } else {
        title.innerText = 'Регистрация';
        btn.innerText = 'Создать аккаунт';
        switchLink.innerHTML = 'Уже есть аккаунт? <a href="#" onclick="toggleAuth(true)">Войти</a>';
    }
}

function logout() {
    localStorage.removeItem('username');
    currentUser = null;
    updateUI(false);
    location.reload();
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function updateAvatar() {
    const url = document.getElementById('avatar-url-input').value;
    if (url && url.startsWith('http')) {
        document.getElementById('p-avatar').src = url;
        localStorage.setItem(`avatar_${currentUser}`, url);
        closeModal('settingsModal');
    }
}

async function syncDashboard() {
    if (!currentUser) return;
    try {
        const res = await fetch(`/api/dashboard?username=${encodeURIComponent(currentUser)}`);
        if (!res.ok) throw new Error('Ошибка связи с сервером');
        const data = await res.json();
        
        const elementsToUpdate = {
            'balance-val': data.wallet,
            'p-balance': data.wallet,
            'p-username': data.profile.username,
            'p-level': data.profile.rank,
            'p-rank-display': data.profile.rank
        };

        for (const [id, value] of Object.entries(elementsToUpdate)) {
            const el = document.getElementById(id);
            if (el) {
                el.innerText = (typeof value === 'number') ? value.toLocaleString() : value;
            }
        }

        const pProg = document.getElementById('p-progress');
        if (pProg) {
            pProg.style.width = `${data.profile.xp % 100}%`;
        }

        const pId = document.getElementById('p-id');
        if (pId) {
            let userId = localStorage.getItem(`id_${currentUser}`);
            if (!userId) {
                userId = Math.floor(Math.random() * 9000) + 1000;
                localStorage.setItem(`id_${currentUser}`, userId);
            }
            pId.innerText = userId;
        }

        const invContainer = document.getElementById('p-inventory');
        if (invContainer) {
            if (data.inventory && data.inventory.length > 0) {
                invContainer.innerHTML = data.inventory.map(item => `
                    <div class="inventory-item glass-morphism">
                        <i class="fas fa-shopping-cart" style="color: var(--accent); margin-bottom: 8px;"></i>
                        <div style="font-weight: bold; font-size: 0.9rem;">${item.itemName}</div>
                        <div style="font-size: 0.75rem; color: var(--text-dim);">${new Date(item.date).toLocaleDateString()}</div>
                    </div>
                `).join('');
            } else {
                invContainer.innerHTML = '<p class="text-dim">История покупок пуста</p>';
            }
        }

        const savedAvatar = localStorage.getItem(`avatar_${currentUser}`);
        if (savedAvatar) {
            const avatarImg = document.getElementById('p-avatar');
            if (avatarImg) avatarImg.src = savedAvatar;
        }

        updateUI(true);
    } catch (err) {
        console.error("Ошибка синхронизации данных:", err);
    }
}

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('log-user').value;
    const password = e.target.querySelector('input[type="password"]').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('username', data.username);
            currentUser = data.username;
            closeModal('loginModal');
            location.reload();
        } else {
            alert(data.error || 'Ошибка входа');
        }
    } catch (err) {
        console.error(err);
        alert('Сервер недоступен');
    }
});

document.getElementById('newsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const titleInput = document.getElementById('news-title');
    const contentInput = document.getElementById('news-content');
    const btn = e.target.querySelector('button');

    const newsData = {
        type: 'news',
        title: titleInput.value,
        content: contentInput.value,
        author: currentUser || 'Аноним'
    };

    console.log("Отправка новости:", newsData);

    try {
        btn.disabled = true;
        const res = await fetch('/api/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newsData)
        });

        if (res.ok) {
            titleInput.value = '';
            contentInput.value = '';
            closeModal('addNewsModal');
            await loadNews();
        } else {
            const err = await res.json();
            alert("Ошибка: " + err.error);
        }
    } catch (err) {
        console.error("Ошибка при создании новости:", err);
    } finally {
        btn.disabled = false;
    }
});

document.getElementById('reviewForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const stars = document.getElementById('rev-stars').value;
    const content = document.getElementById('rev-content').value;

    await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, stars, content })
    });

    closeModal('reviewModal');
    loadReviews();
});

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    currentUser = localStorage.getItem('username');
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const cartCount = document.getElementById('cart-count');
    if (cartCount) cartCount.innerText = cart.length;

    if (currentUser) {
        syncDashboard();
    } else {
        updateUI(false);
    }

    showSection('home-sec');
    renderShop('weapons');
    loadNews();
    loadReviews();
});