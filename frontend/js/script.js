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
    const contactForm = document.getElementById('contact-form');

    const token = localStorage.getItem('token');
    if (token) {
        const payload = parseJwt(token);
        console.log('Initial JWT payload on page load:', payload); // Debug
        const isAdmin = payload && payload.role === 'admin';
        if (isAdmin) {
            console.log('User is admin, showing admin content:', payload.email); // Debug
            adminLinks.forEach(link => link.style.display = 'inline');
            if (authSection && adminContent) {
                authSection.style.display = 'none';
                adminContent.style.display = 'block';
            }
        } else {
            console.log('User is not admin, hiding admin content:', payload ? payload.email : 'no payload', 'Role:', payload ? payload.role : 'none'); // Debug
            if (window.location.pathname.includes('/admin.html')) {
                console.log('Redirecting non-admin from admin.html to blog.html:', payload ? payload.email : 'no payload', 'Role:', payload ? payload.role : 'none'); // Debug
                window.location.href = '/blog.html';
            }
        }
        logoutLinks.forEach(link => link.style.display = 'inline');

        // Redirect from login page if already logged in
        if (window.location.pathname.endsWith('/login.html')) {
            console.log('Redirecting from login.html:', isAdmin ? '/admin.html' : '/blog.html', 'Role:', payload ? payload.role : 'none'); // Debug
            window.location.href = isAdmin ? '/admin.html' : '/blog.html';
        }
    } else if (window.location.pathname.includes('/admin.html')) {
        console.log('No token, showing auth section on admin.html'); // Debug
        if (authSection && adminContent) {
            authSection.style.display = 'block';
            adminContent.style.display = 'none';
        }
    }

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            console.log('Login attempt (client):', { email, passwordLength: password.length }); // Debug
            try {
                const res = await fetch('https://ltm-world.africancontent807.workers.dev/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                console.log('Login response:', data); // Debug
                if (!res.ok) throw new Error(data.error || 'Login failed');
                localStorage.setItem('token', data.token);
                const payload = parseJwt(data.token);
                console.log('Post-login JWT payload:', payload); // Debug
                if (payload && payload.role === 'admin') {
                    console.log('Redirecting to admin.html for admin user:', email, 'Role:', payload.role); // Debug
                    window.location.href = '/admin.html';
                } else {
                    console.log('Redirecting to blog.html for non-admin user:', email, 'Role:', payload ? payload.role : 'no payload'); // Debug
                    window.location.href = '/blog.html';
                }
            } catch (err) {
                console.error('Login error:', err.message); // Debug
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
            console.log('Register attempt (client):', { email, passwordLength: password.length }); // Debug
            try {
                const res = await fetch('https://ltm-world.africancontent807.workers.dev/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                console.log('Register response:', data); // Debug
                if (!res.ok) throw new Error(data.error || 'Registration failed');
                registerError.style.color = 'green';
                registerError.textContent = 'Registration successful! Redirecting...';
                setTimeout(() => window.location.href = '/login.html', 2000);
            } catch (err) {
                console.error('Register error:', err.message); // Debug
                registerError.textContent = err.message;
            }
        });
    }

    // Logout
    logoutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logging out, removing token'); // Debug
            localStorage.removeItem('token');
            adminLinks.forEach(l => l.style.display = 'none');
            logoutLinks.forEach(l => l.style.display = 'none');
            window.location.href = '/index.html';
        });
    });

    // Contact Form
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            console.log('Contact form submission:', { name, email }); // Debug
            try {
                const res = await fetch('https://ltm-world.africancontent807.workers.dev/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                });
                const data = await res.json();
                console.log('Contact response:', data); // Debug
                document.getElementById('form-response').textContent = data.message;
            } catch (err) {
                console.error('Contact form error:', err); // Debug
                document.getElementById('form-response').textContent = 'Error submitting form';
            }
        });
    }

    // Admin Page Logic
    if (window.location.pathname.includes('/admin.html')) {
        if (token && parseJwt(token)?.role === 'admin') {
            loadProjects();
            loadContacts();
            loadPosts();
        }
    }

    // Blog Page Logic
    if (window.location.pathname.includes('/blog.html')) {
        loadPosts();
    }

    // Load Projects (Admin)
    async function loadProjects() {
        try {
            const res = await fetch('https://ltm-world.africancontent807.workers.dev/api/projects', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            console.log('Projects response:', data); // Debug
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
                        <td>${p.link ? `<a href="${p.link}" target="_blank">View</a>` : ''}</td>
                        <td><button onclick="deleteProject(${p.id})">Delete</button></td>
                    `;
                    table.appendChild(tr);
                });
            }
        } catch (err) {
            console.error('Error loading projects:', err);
        }
    }

    // Load Contacts (Admin)
    async function loadContacts() {
        try {
            const res = await fetch('https://ltm-world.africancontent807.workers.dev/api/contacts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            console.log('Contacts response:', data); // Debug
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
                    `;
                    table.appendChild(tr);
                });
            }
        } catch (err) {
            console.error('Error loading contacts:', err);
        }
    }

    // Load Posts (Blog/Admin)
    async function loadPosts() {
        try {
            const res = await fetch('https://ltm-world.africancontent807.workers.dev/api/posts');
            const data = await res.json();
            console.log('Posts response:', data); // Debug
            if (!res.ok) throw new Error(data.error || 'Failed to fetch posts');
            const blogContainer = document.getElementById('blog-posts') || document.getElementById('posts-list');
            if (blogContainer) {
                blogContainer.innerHTML = data.data.map(post => `
                    <div class="post">
                        <h3>${post.title}</h3>
                        <p>${post.content}</p>
                        <small>By ${post.author} on ${new Date(post.created_at).toLocaleDateString()}</small>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error('Error loading posts:', err);
        }
    }

    // Delete Project
    window.deleteProject = async (id) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        try {
            const res = await fetch(`https://ltm-world.africancontent807.workers.dev/api/projects/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            console.log('Delete project response:', data); // Debug
            if (!res.ok) throw new Error(data.error || 'Failed to delete project');
            loadProjects();
        } catch (err) {
            console.error('Delete project error:', err);
        }
    };

    // Delete Contact
    window.deleteContact = async (id) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        try {
            const res = await fetch(`https://ltm-world.africancontent807.workers.dev/api/contacts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            console.log('Delete contact response:', data); // Debug
            if (!res.ok) throw new Error(data.error || 'Failed to delete contact');
            loadContacts();
        } catch (err) {
            console.error('Delete contact error:', err);
        }
    };

    // Add Project (Admin)
    const projectForm = document.getElementById('project-form');
    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('project-title').value;
            const type = document.getElementById('project-type').value;
            const description = document.getElementById('project-description').value;
            const link = document.getElementById('project-link').value;
            console.log('Adding project:', { title, type }); // Debug
            try {
                const res = await fetch('https://ltm-world.africancontent807.workers.dev/api/projects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, type, description, link })
                });
                const data = await res.json();
                console.log('Add project response:', data); // Debug
                if (!res.ok) throw new Error(data.error || 'Failed to add project');
                projectForm.reset();
                loadProjects();
            } catch (err) {
                console.error('Add project error:', err);
                document.getElementById('project-error').textContent = err.message;
            }
        });
    }

    // Add Post (Admin)
    const postForm = document.getElementById('post-form');
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('post-title').value;
            const content = document.getElementById('post-content').value;
            const author = document.getElementById('post-author').value;
            console.log('Adding post:', { title, author }); // Debug
            try {
                const res = await fetch('https://ltm-world.africancontent807.workers.dev/api/posts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, content, author })
                });
                const data = await res.json();
                console.log('Add post response:', data); // Debug
                if (!res.ok) throw new Error(data.error || 'Failed to add post');
                postForm.reset();
                loadPosts();
            } catch (err) {
                console.error('Add post error:', err);
                document.getElementById('post-error').textContent = err.message;
            }
        });
    }
});