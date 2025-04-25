// Decode JWT
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
}

// Authentication
const adminLinks = document.querySelectorAll('#admin-link');
const logoutLinks = document.querySelectorAll('#logout-link');
const authSection = document.getElementById('auth-section');
const adminContent = document.getElementById('admin-content');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const registerForm = document.getElementById('register-form');

if (localStorage.getItem('token')) {
    const token = localStorage.getItem('token');
    const payload = parseJwt(token);
    console.log('Initial JWT payload on page load:', payload); // Debug
    if (payload && payload.role === 'admin') {
        console.log('User is admin, showing admin content:', payload.email);
        adminLinks.forEach(link => link.style.display = 'inline');
        if (authSection && adminContent) {
            authSection.style.display = 'none';
            adminContent.style.display = 'block';
        }
    } else {
        console.log('User is not admin, hiding admin content:', payload ? payload.email : 'no payload', 'Role:', payload ? payload.role : 'none');
        if (window.location.pathname === '/admin.html') {
            console.log('Redirecting non-admin from admin.html to blog.html:', payload ? payload.email : 'no payload', 'Role:', payload ? payload.role : 'none');
            window.location.href = '/blog.html';
        }
    }
    logoutLinks.forEach(link => link.style.display = 'inline');
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        console.log('Login attempt (client):', { email, passwordLength: password.length }); // Debug
        try {
            const response = await fetch('https://ltm-world.africancontent807.workers.dev/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            console.log('Login response:', data); // Debug
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            localStorage.setItem('token', data.token);
            const payload = parseJwt(data.token);
            console.log('Post-login JWT payload:', payload); // Debug
            if (payload && payload.role === 'admin') {
                console.log('Redirecting to admin.html for admin user:', email, 'Role:', payload.role);
                adminLinks.forEach(link => link.style.display = 'inline');
                if (authSection && adminContent) {
                    authSection.style.display = 'none';
                    adminContent.style.display = 'block';
                }
                loadProjects();
                loadContacts();
                window.location.href = '/admin.html';
            } else {
                console.log('Redirecting to blog.html for non-admin user:', email, 'Role:', payload ? payload.role : 'no payload');
                window.location.href = '/blog.html';
            }
        } catch (error) {
            console.error('Login error:', error.message); // Debug
            loginError.textContent = error.message;
        }
    });
}

if (registerForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        console.log('Register attempt (client):', {email, passwordLength: password.length });
        try {
            const response = await fetch('https://ltm-world.africancontent807.workers.dev/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            console.log('Register response:', data);
            if (!response.ok) {
                throw new Error(data.error || 'Register failed');
            }
            document.getElementById('register-error').style.color = 'green';
            document.getElementById('register-error').textContent = 'Registration successful! Please login.';
            setTimeout(() => { window.location.href = '/login.html'; }, 2000);
        } catch (error) {
            console.error('Register error:', error.message);
            document.getElementById('register-error').textContent = error.message;
        }
    });
}

logoutLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        adminLinks.forEach(l => l.style.display = 'none');
        logoutLinks.forEach(l => l.style.display = 'none');
        if (authSection && adminContent) {
            authSection.style.display = 'block';
            adminContent.style.display = 'none';
        }
        window.location.href = '/index.html';
    });
});

// Contact form
document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    try {
        const response = await fetch('https://ltm-world.africancontent807.workers.dev/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
        });
        const data = await response.json();
        console.log('Contact response:', data); // Debug
        document.getElementById('form-response').innerText = data.message;
    } catch (error) {
        console.error('Form submission error:', error); // Debug
        document.getElementById('form-response').innerText = 'Error submitting form';
    }
});

// Load projects
async function loadProjects() {
    try {
        const response = await fetch('https://ltm-world.africancontent807.workers.dev/api/projects');
        const data = await response.json();
        console.log('Projects response:', data); // Debug
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load projects');
        }
        const projectLists = document.querySelectorAll('.project-list');
        projectLists.forEach(list => {
            list.innerHTML = '';
            data.data.forEach(project => {
                const li = document.createElement('li');
                const link = project.link ? `<a href="${project.link}" target="_blank">${project.title}</a>` : project.title;
                li.innerHTML = `${link} (${project.type}) - ${project.description}`;
                list.appendChild(li);
            });
        });
        const projectsTable = document.getElementById('projects-list');
        if (projectsTable) {
            projectsTable.innerHTML = '';
            data.data.forEach(project => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${project.id}</td>
                    <td>${project.title}</td>
                    <td>${project.type}</td>
                    <td>${project.description}</td>
                    <td>${project.link ? `<a href="${project.link}" target="_blank">Link</a>` : ''}</td>
                    <td><button onclick="deleteProject(${project.id})">Delete</button></td>
                `;
                projectsTable.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        document.querySelectorAll('.project-list').forEach(list => {
            list.innerHTML = '<li>Error loading projects</li>';
        });
    }
}
if (document.querySelector('.project-list') || document.getElementById('projects-list')) {
    loadProjects();
}

// Add project
const projectForm = document.getElementById('project-form');
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('project-title').value;
        const type = document.getElementById('project-type').value;
        const description = document.getElementById('project-description').value;
        const link = document.getElementById('project-link').value;
        try {
            const response = await fetch('https://ltm-world.africancontent807.workers.dev/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ title, type, description, link })
            });
            const data = await response.json();
            console.log('Add project response:', data); // Debug
            if (!response.ok) {
                throw new Error(data.error || 'Failed to add project');
            }
            projectForm.reset();
            loadProjects();
        } catch (error) {
            console.error('Add project error:', error);
            document.getElementById('project-error').textContent = error.message;
        }
    });
}

// Delete project
async function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        try {
            const response = await fetch(`https://ltm-world.africancontent807.workers.dev/api/projects/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            console.log('Delete project response:', data); // Debug
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete project');
            }
            loadProjects();
        } catch (error) {
            console.error('Delete project error:', error);
            document.getElementById('project-error').textContent = error.message;
        }
    }
}

// Load contacts
async function loadContacts() {
    try {
        const response = await fetch('https://ltm-world.africancontent807.workers.dev/api/contacts', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        console.log('Contacts response:', data); // Debug
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load contacts');
        }
        const tbody = document.getElementById('contacts-list');
        if (tbody) {
            tbody.innerHTML = '';
            data.data.forEach(contact => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${contact.id}</td>
                    <td>${contact.name}</td>
                    <td>${contact.email}</td>
                    <td>${contact.message}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
        if (document.getElementById('contacts-list')) {
            document.getElementById('contacts-list').innerHTML = `<tr><td colspan="4">Error loading messages: ${error.message}</td></tr>`;
        }
    }
}
if (document.getElementById('contacts-list')) {
    loadContacts();
}

// Load blog posts
async function loadPosts() {
    try {
        const response = await fetch('https://ltm-world.africancontent807.workers.dev/api/posts');
        const data = await response.json();
        console.log('Posts response:', data); // Debug
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load posts');
        }
        const blogPosts = document.getElementById('blog-posts');
        if (blogPosts) {
            blogPosts.innerHTML = '';
            data.data.forEach(post => {
                const div = document.createElement('div');
                div.className = 'blog-post';
                div.innerHTML = `
                    <h2>${post.title}</h2>
                    <p><em>By ${post.author} on ${new Date(post.created_at).toLocaleDateString()}</em></p>
                    <p>${post.content}</p>
                `;
                blogPosts.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        if (document.getElementById('blog-posts')) {
            document.getElementById('blog-posts').innerHTML = '<p>Error loading posts</p>';
        }
    }
}
if (document.getElementById('blog-posts')) {
    loadPosts();
}

// Add blog post
const postForm = document.getElementById('post-form');
if (postForm) {
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
        const author = document.getElementById('post-author').value;
        try {
            const response = await fetch('https://ltm-world.africancontent807.workers.dev/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ title, content, author })
            });
            const data = await response.json();
            console.log('Add post response:', data); // Debug
            if (!response.ok) {
                throw new Error(data.error || 'Failed to add post');
            }
            postForm.reset();
            loadPosts();
        } catch (error) {
            console.error('Add post error:', error);
            document.getElementById('post-error').textContent = error.message;
        }
    });
}