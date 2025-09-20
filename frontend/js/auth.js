// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();

  if (currentPage === 'login.html') setupLoginPage();
  else if (currentPage === 'register.html') setupRegisterPage();
});

function setupLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const googleLoginBtn = document.getElementById('googleLoginBtn');

  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (googleLoginBtn) googleLoginBtn.addEventListener('click', () => {
    window.location.href = 'https://projectrender-k2t3.onrender.com/api/auth/google';
  });
}

function setupRegisterPage() {
  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    const res = await fetch('https://projectrender-k2t3.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      window.location.href = 'home.html';
    } else {
      showAlert(data.error || 'Login failed', 'error');
    }
  } catch (err) {
    showAlert('Login error', 'error');
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
    const res = await fetch('https://projectrender-k2t3.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      window.location.href = 'home.html';
    } else {
      showAlert(data.error || 'Registration failed', 'error');
    }
  } catch (err) {
    showAlert('Registration error', 'error');
  }
}