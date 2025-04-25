// Decode JWT to extract user role
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Invalid token", e);
        return null;
    }
}

// Initialize app after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const adminLinks = document.querySelectorAll('#admin-link');
    const logoutLinks = document.querySelectorAll('#logout-link');
    const authSection = document.getElementById('auth-section');
    const adminContent = document.getElementById('admin-content');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    const token = localStorage.getItem('token');
    if (token) {
        const payload = parseJwt(token);
        if (payload && payload.role === 'admin') {
            adminLinks.forEach(link => link.style.display = 'inline');
            if (authSection && adminContent) {
                authSection.style.display = 'none';
                adminContent.style.display = 'block';
            }
        } else if (window.location.pathname.includes('/admin.html')) {
            window.location.href = '/blog.html';
        }
        logoutLinks.forEach(link => link.style.display = 'inline');
    }

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                const res = await fetch('https://ltm-world.africancontent807.workers.dev/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Login failed');
                localStorage.setItem('token', data.token);
                const payload = parseJwt(data.token);
                if (payload && payload.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/blog.html';
                }
            } catch (err) {
                loginError.textContent = err.message;
            }
        });
    }

    // Register
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            try {
                const res = await fetch('https://ltm-world.africancontent807.workers.dev/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Registration failed');
                registerError.style.color = 'green';
                registerError.textContent = 'Registration successful! Redirecting...';
                setTimeout(() => window.location.href = '/login.html', 2000);
            } catch (err) {
                registerError.textContent = err.message;
            }
        });
    }

    // Logout
    logoutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = '/index.html';
        });
    });

    // Contact Form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            try {
                const res = await fetch('https://ltm-world.africancontent807.workers.dev/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                });
                const data = await res.json();
                document.getElementById('form-response').textContent = data.message;
            } catch (err) {
                document.getElementById('form-response').textContent = 'Error submitting form';
            }
        });
    }

    // Admin Page Load
    if (window.location.pathname.includes('/admin.html')) {
        loadProjects();
        loadContacts();
    }
});

// Load Projects (Admin)
async function loadProjects() {
    try {
        const res = await fetch('https://ltm-world.africancontent807.workers.dev/api/projects');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch projects');

        const table = document.getElementById('projects-list');
        if (table) {
            table.innerHTML = '';
            data.data.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.id}</td>
                    <td>${p.title}</td>
                    <td>${p.type}</td>
                    <td>${p.description}</td>
                    <td>${p.link ? `<a href="${p.link}" target="_blank">Link</a>` : ''}</td>
                    <td><button onclick="deleteProject(${p.id})">Delete</button></td>
                `;
                table.appendChild(tr);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

// Load Contacts (Admin)
async function loadContacts() {
    try {
        const res = await fetch('https://ltm-world.africancontent807.workers.dev/api/contacts');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch contacts');

        const table = document.getElementById('contacts-list');
        if (table) {
            table.innerHTML = '';
            data.data.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${c.id}</td>
                    <td>${c.name}</td>
                    <td>${c.email}</td>
                    <td>${c.message}</td>
                    <td><button onclick="deleteContact(${c.id})">Delete</button></td>
                `;
                table.appendChild(tr);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

// Delete Project
async function deleteProject(id) {
    try {
        const res = await fetch(`https://ltm-world.africancontent807.workers.dev/api/projects/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Delete failed');
        loadProjects();
    } catch (err) {
        console.error(err);
    }
}

// Delete Contact
async function deleteContact(id) {
    try {
        const res = await fetch(`https://ltm-world.africancontent807.workers.dev/api/contacts/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Delete failed');
        loadContacts();
    } catch (err) {
        console.error(err);
    }
}