// API base URL
const API_BASE_URL = 'https://projectrender-k2t3.onrender.com/api';

// Global variables
let currentUser = null;
let currentTheme = 'light';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check authentication status
    checkAuthStatus();
    
    // Set up navigation
    setupNavigation();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize theme
    initTheme();
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (token) {
        // Verify token and get user data
        verifyToken(token).then(isValid => {
            if (isValid) {
                // User is authenticated
                if (currentPage === 'login.html' || currentPage === 'register.html') {
                    window.location.href = 'home.html';
                }
            } else {
                // Token is invalid
                localStorage.removeItem('token');
                if (currentPage !== 'login.html' && currentPage !== 'register.html' && currentPage !== 'index.html') {
                    window.location.href = 'login.html';
                }
            }
        });
    } else {
        // No token found
        if (currentPage !== 'login.html' && currentPage !== 'register.html' && currentPage !== 'index.html') {
            window.location.href = 'login.html';
        }
    }
}

async function verifyToken(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUserUI();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

function setupNavigation() {
    // Update active navigation link
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.style.color = 'var(--primary-color)';
            link.style.fontWeight = 'bold';
        }
    });
}

function setupEventListeners() {
    // Global event listeners
    document.addEventListener('click', handleGlobalClick);
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Profile dropdown
    const profileContainer = document.querySelector('.profile-container');
    if (profileContainer) {
        profileContainer.addEventListener('click', toggleDropdown);
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function handleGlobalClick(event) {
    // Close dropdown when clicking outside
    const dropdown = document.querySelector('.dropdown');
    const profileContainer = document.querySelector('.profile-container');
    
    if (dropdown && dropdown.classList.contains('show') && 
        !dropdown.contains(event.target) && 
        !profileContainer.contains(event.target)) {
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
    
    // Update theme toggle button if exists
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
    }
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    
    // Save theme preference to server if user is logged in
    if (currentUser) {
        saveThemePreference(newTheme);
    }
}

async function saveThemePreference(theme) {
    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/user/theme`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ theme })
        });
    } catch (error) {
        console.error('Failed to save theme preference:', error);
    }
}

function updateUserUI() {
    if (!currentUser) return;
    
    // Update profile picture and name
    const profilePicElements = document.querySelectorAll('.profile-pic');
    const usernameElements = document.querySelectorAll('.username');
    const profilePicPreview = document.getElementById('profilePicPreview');
    
    profilePicElements.forEach(el => {
        el.src = currentUser.profile_pic || 'images/user.png';
        el.alt = currentUser.name;
    });
    
    usernameElements.forEach(el => {
        el.textContent = currentUser.name;
    });
    
    if (profilePicPreview) {
        profilePicPreview.src = currentUser.profile_pic || 'images/user.png';
    }
    
    // Update user name in settings form
    const userNameInput = document.getElementById('userName');
    if (userNameInput) {
        userNameInput.value = currentUser.name;
    }
}

function toggleDropdown(event) {
    event.stopPropagation();
    const dropdown = document.querySelector('.dropdown');
    dropdown.classList.toggle('show');
}

function handleLogout() {
    localStorage.removeItem('token');
    currentUser = null;
    window.location.href = 'login.html';
}

// Utility functions
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Add to page
    const mainContent = document.querySelector('main') || document.body;
    mainContent.prepend(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function redirectToLogin() {
    window.location.href = 'login.html';
}