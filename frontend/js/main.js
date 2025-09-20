const API_BASE_URL = 'https://projectrender-k2t3.onrender.com/api';
const BACKEND_URL = 'https://projectrender-k2t3.onrender.com';

let currentUser = null;
let currentTheme = 'light';

// Initialize Google Sign-In
function initGoogleSignIn() {
    if (typeof window.google === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleSignIn;
        document.head.appendChild(script);
    } else {
        initializeGoogleSignIn();
    }
}

function initializeGoogleSignIn() {
    if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
            client_id: '570656256454-ijfo0bi4lo643vmnqf311n8mig267edr.apps.googleusercontent.com',
            callback: handleGoogleSignIn
        });
        
        const googleSignInBtn = document.getElementById('googleSignInBtn');
        if (googleSignInBtn) {
            window.google.accounts.id.renderButton(
                googleSignInBtn,
                { theme: 'outline', size: 'large', width: googleSignInBtn.offsetWidth }
            );
        }
    }
}

async function handleGoogleSignIn(response) {
    try {
        const responsePayload = parseJwt(response.credential);
        
        const googleUser = {
            googleId: responsePayload.sub,
            email: responsePayload.email,
            name: responsePayload.name,
            photo: responsePayload.picture
        };

        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                googleToken: response.credential,
                googleUser: googleUser
            })
        });

        const data = await loginResponse.json();
        
        if (loginResponse.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'home.html';
        } else {
            showAlert(data.error || 'Google login failed', 'error');
        }
    } catch (error) {
        console.error('Google login error:', error);
        showAlert('Google login failed', 'error');
    }
}

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

// Initialize application
function initializeApp() {
    console.log('App initialized');
    checkAuthStatus();
    setupNavigation();
    setupEventListeners();
    initTheme();
    initGoogleSignIn();
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
                if (currentPage !== 'login.html' && currentPage !== 'register.html' && currentPage !== 'index.html') {
                    window.location.href = 'login.html';
                }
            }
        });
    } else {
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
    document.addEventListener('click', handleGlobalClick);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    const profileContainer = document.querySelector('.profile-container');
    if (profileContainer) {
        profileContainer.addEventListener('click', toggleDropdown);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const googleOAuthBtn = document.getElementById('googleOAuthBtn');
    if (googleOAuthBtn) {
        googleOAuthBtn.addEventListener('click', handleGoogleOAuth);
    }
    
    if (window.location.pathname.includes('settings.html')) {
        setupSettingsListeners();
    }
}

function handleGlobalClick(event) {
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
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
    }
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    
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
    
    const profilePicElements = document.querySelectorAll('.profile-pic');
    const usernameElements = document.querySelectorAll('.username');
    const profilePicPreview = document.getElementById('profilePicPreview');

    let profilePicUrl = currentUser.profile_pic || 'images/user.png';
    
    // Handle different types of profile picture URLs
    if (profilePicUrl.startsWith('http')) {
        // It's a Google URL, use as-is
    } else if (profilePicUrl.startsWith('/uploads/')) {
        // It's an uploaded file, prepend backend URL
        profilePicUrl = BACKEND_URL + profilePicUrl;
    }

    profilePicElements.forEach(el => {
        el.src = profilePicUrl;
        el.alt = currentUser.name;
    });

    usernameElements.forEach(el => {
        el.textContent = currentUser.name;
    });

    if (profilePicPreview) {
        profilePicPreview.src = profilePicUrl;
    }
    
    const userNameInput = document.getElementById('userName');
    if (userNameInput) {
        userNameInput.value = currentUser.name;
    }
    
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
        userEmail.textContent = currentUser.email;
    }
}

function toggleDropdown(event) {
    event.stopPropagation();
    const dropdown = document.querySelector('.dropdown');
    dropdown.classList.toggle('show');
}

async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'home.html';
        } else {
            showAlert(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showAlert('An error occurred during login', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'home.html';
        } else {
            showAlert(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showAlert('An error occurred during registration', 'error');
    }
}

function handleGoogleOAuth() {
    window.location.href = `${API_BASE_URL}/auth/google`;
}

function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

function setupSettingsListeners() {
    const updateNameForm = document.getElementById('updateNameForm');
    const profilePicInput = document.getElementById('profilePicInput');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    
    if (updateNameForm) {
        updateNameForm.addEventListener('submit', handleNameUpdate);
    }
    
    if (profilePicInput) {
        profilePicInput.addEventListener('change', handleProfilePicUpload);
    }
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    }
    
    loadUserData();
}

async function loadUserData() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUserUI();
        } else {
            showAlert('Failed to load user data', 'error');
        }
    } catch (error) {
        showAlert('Error loading user data', 'error');
    }
}

async function handleNameUpdate(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/name`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name })
        });
        
        if (response.ok) {
            currentUser.name = name;
            updateUserUI();
            showAlert('Name updated successfully', 'success');
        } else {
            const data = await response.json();
            showAlert(data.error || 'Failed to update name', 'error');
        }
    } catch (error) {
        showAlert('An error occurred while updating your name', 'error');
    }
}

async function handleProfilePicUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profilePic', file);
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile-picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser.profile_pic = data.profile_pic;
            updateUserUI();
            showAlert('Profile picture updated successfully', 'success');
        } else {
            showAlert(data.error || 'Failed to upload profile picture', 'error');
        }
    } catch (error) {
        showAlert('An error occurred while uploading your profile picture', 'error');
    }
}

async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/account`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            localStorage.removeItem('token');
            showAlert('Account deleted successfully', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            const data = await response.json();
            showAlert(data.error || 'Failed to delete account', 'error');
        }
    } catch (error) {
        showAlert('An error occurred while deleting your account', 'error');
    }
}

function showAlert(message, type = 'info') {
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const mainContent = document.querySelector('main') || document.body;
    mainContent.prepend(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});