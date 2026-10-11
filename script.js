// ===== ПЕРЕМИКАЧ ТЕМИ =====
const themeToggle = document.getElementById('theme-toggle');

function getInitialTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
});

// ===== ЗАВАНТАЖЕННЯ МІСЦЬ =====
const placesList = document.getElementById('places-list');

// Стан застосунку
const state = {
    places: [],
    search: '',
    accessibility: 'all'
};

const STATUS_CLASS = {
    full: 'status-green',
    partial: 'status-yellow',
    none: 'status-red'
};

// ===== СТВОРЕННЯ КАРТКИ =====
function createPlaceCard(place) {
    const article = document.createElement('article');
    article.className = `place-card ${STATUS_CLASS[place.accessibility] || ''}`;
    article.dataset.id = place.id;

    const img = document.createElement('img');
    img.src = place.image;
    img.alt = `Фото: ${place.name}`;
    img.width = 300;
    img.height = 200;
    article.appendChild(img);

    const h3 = document.createElement('h3');
    h3.textContent = place.name;
    article.appendChild(h3);

    const pAddress = document.createElement('p');
    const strongAddress = document.createElement('strong');
    strongAddress.textContent = 'Адреса:';
    pAddress.appendChild(strongAddress);
    pAddress.appendChild(document.createTextNode(' ' + place.address));
    article.appendChild(pAddress);

    const pAccess = document.createElement('p');
    const strongAccess = document.createElement('strong');
    strongAccess.textContent = 'Рівень доступності:';
    pAccess.appendChild(strongAccess);
    pAccess.appendChild(document.createTextNode(' ' + place.accessibilityLabel));
    article.appendChild(pAccess);

    const pHours = document.createElement('p');
    const strongHours = document.createElement('strong');
    strongHours.textContent = 'Години роботи:';
    pHours.appendChild(strongHours);
    pHours.appendChild(document.createTextNode(' ' + place.hours));
    article.appendChild(pHours);

    const link = document.createElement('a');
    link.href = `place-detail.html?id=${place.id}`;
    link.textContent = 'Детальніше →';
    article.appendChild(link);

    return article;
}

// ===== СТАНИ ІНТЕРФЕЙСУ =====
function showLoading() {
    placesList.innerHTML = '';
    const loader = document.createElement('p');
    loader.className = 'places-state places-state--loading';
    loader.textContent = '⏳ Завантаження місць...';
    placesList.appendChild(loader);
}

function showError(message, onRetry) {
    placesList.innerHTML = '';
    const error = document.createElement('div');
    error.className = 'places-state places-state--error';

    const text = document.createElement('p');
    text.textContent = '❌ ' + message;
    error.appendChild(text);

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'places-retry';
    retryBtn.textContent = 'Спробувати ще раз';
    retryBtn.addEventListener('click', onRetry);
    error.appendChild(retryBtn);

    placesList.appendChild(error);
}

function showEmpty(message = '📭 Місць поки немає') {
    placesList.innerHTML = '';
    const empty = document.createElement('p');
    empty.className = 'places-state places-state--empty';
    empty.textContent = message;
    placesList.appendChild(empty);
}

// ===== ФІЛЬТРАЦІЯ =====
function getFilteredPlaces() {
    return state.places.filter(place => {
        if (state.accessibility !== 'all' && place.accessibility !== state.accessibility) {
            return false;
        }

        if (state.search) {
            const query = state.search.toLowerCase().trim();
            const name = place.name.toLowerCase();
            const address = place.address.toLowerCase();

            if (!name.includes(query) && !address.includes(query)) {
                return false;
            }
        }

        return true;
    });
}

// ===== ВІДОБРАЖЕННЯ =====
function renderPlaces() {
    const filtered = getFilteredPlaces();

    placesList.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = 'Усі місця';
    placesList.appendChild(heading);

    if (filtered.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'places-state places-state--empty';
        empty.textContent = '🔍 Нічого не знайдено за вашим запитом';
        placesList.appendChild(empty);
        return;
    }

    filtered.forEach(place => {
        placesList.appendChild(createPlaceCard(place));
    });
}

// ===== ЗАВАНТАЖЕННЯ =====
async function loadPlaces() {
    showLoading();

    try {
        const response = await fetch('data/places.json');

        if (!response.ok) {
            throw new Error(`Помилка завантаження: ${response.status}`);
        }

        const places = await response.json();

        if (!places || places.length === 0) {
            showEmpty();
            return;
        }

        state.places = places;
        renderPlaces();

    } catch (error) {
        console.error('Помилка:', error);
        showError('Не вдалося завантажити місця. Перевірте з\'єднання.', loadPlaces);
    }
}

// ===== ОБРОБНИКИ ФІЛЬТРІВ =====
const searchInput = document.getElementById('search-input');
const accessibilityRadios = document.querySelectorAll('input[name="accessibility-filter"]');

searchInput?.addEventListener('input', (e) => {
    state.search = e.target.value;
    renderPlaces();
});

accessibilityRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        state.accessibility = e.target.value;
        renderPlaces();
    });
});

if (placesList) {
    loadPlaces();
}