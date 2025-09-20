// js/main.js

const API_BASE_URL = 'https://projectrender-k2t3.onrender.com/api';

let currentUser  = null;
let currentTheme = 'light';

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  checkAuthStatus();
  setupNavigation();
  setupEventListeners();
  initTheme();
}

function checkAuthStatus() {
  const token = localStorage.getItem('token');
  const currentPage = window.location.pathname.split('/').pop();

  if (token) {
    verifyToken(token).then(isValid => {
      if (isValid) {
        if (currentPage === 'login.html' || currentPage === 'register.html' || currentPage === 'index.html') {
          window.location.href = 'home.html';
        }
      } else {
        localStorage.removeItem('token');
        if (!['login.html', 'register.html', 'index.html'].includes(currentPage)) {
          window.location.href = 'login.html';
        }
      }
    });
  } else {
    if (!['login.html', 'register.html', 'index.html'].includes(currentPage)) {
      window.location.href = 'login.html';
    }
  }
}

async function verifyToken(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      currentUser  = data.user;
      updateUserUI();
      return true;
    }
    return false;
  } catch (err) {
    console.error('Token verification error:', err);
    return false;
  }
}

function setupNavigation() {
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.style.color = 'var(--primary-color)';
      link.style.fontWeight = 'bold';
    }
  });
}

function setupEventListeners() {
  document.addEventListener('click', handleGlobalClick);

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  const profileContainer = document.querySelector('.profile-container');
  if (profileContainer) profileContainer.addEventListener('click', toggleDropdown);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

function handleGlobalClick(event) {
  const dropdown = document.querySelector('.dropdown');
  const profileContainer = document.querySelector('.profile-container');
  if (dropdown && dropdown.classList.contains('show') &&
      !dropdown.contains(event.target) && !profileContainer.contains(event.target)) {
    dropdown.classList.remove('show');
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.textContent = theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
  }
}

function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  if (currentUser ) saveThemePreference(newTheme);
}

async function saveThemePreference(theme) {
  try {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/user/theme`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ theme })
    });
  } catch (err) {
    console.error('Failed to save theme preference:', err);
  }
}

function updateUserUI() {
  if (!currentUser ) return;
  const profilePics = document.querySelectorAll('.profile-pic');
  const usernames = document.querySelectorAll('.username');
  profilePics.forEach(img => {
    img.src = currentUser .profile_pic || 'images/user.png';
    img.alt = currentUser .name;
  });
  usernames.forEach(span => {
    span.textContent = currentUser .name;
  });
  const profilePicPreview = document.getElementById('profilePicPreview');
  if (profilePicPreview) profilePicPreview.src = currentUser .profile_pic || 'images/user.png';

  const userEmail = document.getElementById('userEmail');
  if (userEmail) userEmail.textContent = currentUser .email;
}

function toggleDropdown(event) {
  event.stopPropagation();
  const dropdown = document.querySelector('.dropdown');
  dropdown.classList.toggle('show');
}

function handleLogout() {
  localStorage.removeItem('token');
  currentUser  = null;
  window.location.href = 'login.html';
}

function showAlert(message, type = 'info') {
  const existingAlerts = document.querySelectorAll('.alert');
  existingAlerts.forEach(alert => alert.remove());

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;

  const mainContent = document.querySelector('main') || document.body;
  mainContent.prepend(alertDiv);

  setTimeout(() => alertDiv.remove(), 5000);
}