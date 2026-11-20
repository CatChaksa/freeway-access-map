import { type Place, type AppState } from './types';
import L from 'leaflet';

// ===== ПЕРЕМИКАЧ ТЕМИ =====
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement | null;

function getInitialTheme(): string {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: string): void {
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

// ===== МОБІЛЬНЕ МЕНЮ =====
const burgerMenu = document.getElementById('burger-menu');
const mainNav = document.querySelector('header nav');

if (burgerMenu && mainNav) {
    burgerMenu.addEventListener('click', () => {
        burgerMenu.classList.toggle('active');
        mainNav.classList.toggle('active');
    });
}

// ===== ЗАВАНТАЖЕННЯ МІСЦЬ =====
const placesList = document.getElementById('places-list');

const state: AppState = {
    places: [],
    search: '',
    accessibility: 'all'
};

const STATUS_CLASS: Record<string, string> = {
    full: 'status-green',
    partial: 'status-yellow',
    none: 'status-red'
};

// ===== СТВОРЕННЯ КАРТКИ =====
function createPlaceCard(place: Place): HTMLElement {
    const article = document.createElement('article');
    article.className = `place-card ${STATUS_CLASS[place.accessibility] || ''}`;
    article.dataset.id = place.id.toString();
    article.tabIndex = 0;
    article.setAttribute('role', 'button');
    article.setAttribute('aria-label', `Відкрити деталі: ${place.name}`);

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
function showLoading(): void {
    if (!placesList) return;
    placesList.innerHTML = '';
    const loader = document.createElement('p');
    loader.className = 'places-state places-state--loading';
    loader.textContent = '⏳ Завантаження місць...';
    placesList.appendChild(loader);
}

function showError(message: string, onRetry: () => void): void {
    if (!placesList) return;
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

function showEmpty(message: string = '📭 Місць поки немає'): void {
    if (!placesList) return;
    placesList.innerHTML = '';
    const empty = document.createElement('p');
    empty.className = 'places-state places-state--empty';
    empty.textContent = message;
    placesList.appendChild(empty);
}

// ===== ФІЛЬТРАЦІЯ =====
function getFilteredPlaces(): Place[] {
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
function renderPlaces(): void {
    if (!placesList) return;
    
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
async function loadPlaces(): Promise<void> {
    showLoading();

    try {
        const response = await fetch('data/places.json');

        if (!response.ok) {
            throw new Error(`Помилка завантаження: ${response.status}`);
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            showEmpty();
            return;
        }

        state.places = data as Place[];
        renderPlaces();

    } catch (error) {
        console.error('Помилка:', error);
        showError('Не вдалося завантажити місця. Перевірте з\'єднання.', loadPlaces);
    }
}

// ===== ОБРОБНИКИ ФІЛЬТРІВ =====
const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
const accessibilityRadios = document.querySelectorAll('input[name="accessibility-filter"]');

searchInput?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    state.search = target.value;
    renderPlaces();
});

accessibilityRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        state.accessibility = target.value;
        renderPlaces();
    });
});

if (placesList) {
    loadPlaces();
}

// ===== МОДАЛЬНЕ ВІКНО =====
const modal = document.getElementById('place-modal') as HTMLDialogElement | null;
const modalImage = document.getElementById('modal-image') as HTMLImageElement | null;
const modalTitle = document.getElementById('modal-title');
const modalAddress = document.getElementById('modal-address');
const modalAccess = document.getElementById('modal-access');
const modalHours = document.getElementById('modal-hours');
const modalDescription = document.getElementById('modal-description');
const modalFeatures = document.getElementById('modal-features');
const modalClose = modal?.querySelector('.modal__close');

let lastFocusedElement: HTMLElement | null = null;

function fillModal(place: Place): void {
    if (modalImage) {
        modalImage.src = place.image;
        modalImage.alt = `Фото: ${place.name}`;
    }
    if (modalTitle) modalTitle.textContent = place.name;
    if (modalAddress) modalAddress.textContent = place.address;
    if (modalAccess) modalAccess.textContent = place.accessibilityLabel;
    if (modalHours) modalHours.textContent = place.hours;
    if (modalDescription) modalDescription.textContent = place.description;

    if (modalFeatures) {
        modalFeatures.innerHTML = '';
        const features = [
            { label: 'Пандус', value: place.hasRamp },
            { label: 'Ліфт', value: place.hasElevator },
            { label: 'Доступний туалет', value: place.hasAccessibleToilet }
        ];

        features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = `${feature.value ? '✅' : '❌'} ${feature.label}`;
            modalFeatures.appendChild(li);
        });
    }
}

function openModal(place: Place, triggerElement: HTMLElement): void {
    fillModal(place);
    lastFocusedElement = triggerElement;
    modal?.showModal();
    (modalClose as HTMLElement)?.focus();
}

function closeModal(): void {
    modal?.close();
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}

modalClose?.addEventListener('click', closeModal);

modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

modal?.addEventListener('close', () => {
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
});

// ===== ДЕЛЕГУВАННЯ ПОДІЙ =====
placesList?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const card = target.closest('.place-card') as HTMLElement | null;
    if (!card) return;

    const placeId = Number(card.dataset.id);
    const place = state.places.find(p => p.id === placeId);

    if (!place) return;

    if (target.closest('a')) return;

    openModal(place, card);
});

placesList?.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    const card = target.closest('.place-card') as HTMLElement | null;
    if (!card) return;

    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
    }
});

// ===== ІНІЦІАЛІЗАЦІЯ КАРТИ =====
const mapContainer = document.getElementById('map');

if (mapContainer) {
    const map = L.map('map').setView([48.3794, 31.1656], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}