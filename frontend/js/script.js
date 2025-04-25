// Authentication
const adminLinks = document.querySelectorAll('#admin-link');
const logoutLinks = document.querySelectorAll('#logout-link');
const authSection = document.getElementById('auth-section');
const adminContent = document.getElementById('admin-content');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

if (localStorage.getItem('token')) {
    adminLinks.forEach(link => link.style.display = 'inline');
    logoutLinks.forEach(link => link.style.display = 'inline');
    if (authSection && adminContent) {
        authSection.style.display = 'none';
        adminContent.style.display = 'block';
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const response = await fetch('https://ltm-world.africancontent807.workers.dev/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            localStorage.setItem('token', data.token);
            adminLinks.forEach(link => link.style.display = 'inline');
            logoutLinks.forEach(link => link.style.display = 'inline');
            authSection.style.display = 'none';
            adminContent.style.display = 'block';
            loadProjects();
            loadContacts();
        } catch (error) {
            loginError.textContent = error.message;
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
        window.location.href = 'index.html';
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
        const text = await response.text();
        document.getElementById('form-response').innerText = text;
    } catch (error) {
        document.getElementById('form-response').innerText = 'Error submitting form';
        console.error('Form submission error:', error);
    }
});

// Load projects
async function loadProjects() {
    try {
        const response = await fetch('https://ltm-world.africancontent807.workers.dev/api/projects');
        const projects = await response.json();
        const projectLists = document.querySelectorAll('.project-list');
        projectLists.forEach(list => {
            list.innerHTML = '';
            projects.forEach(project => {
                const li = document.createElement('li');
                const link = project.link ? `<a href="${project.link}" target="_blank">${project.title}</a>` : project.title;
                li.innerHTML = `${link} (${project.type}) - ${project.description}`;
                list.appendChild(li);
            });
        });
        const projectsTable = document.getElementById('projects-list');
        if (projectsTable) {
            projectsTable.innerHTML = '';
            projects.forEach(project => {
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
            if (!response.ok) {
                throw new Error('Failed to add project');
            }
            projectForm.reset();
            loadProjects();
        } catch (error) {
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
            if (!response.ok) {
                throw new Error('Failed to delete project');
            }
            loadProjects();
        } catch (error) {
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
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const contacts = await response.json();
        const tbody = document.getElementById('contacts-list');
        if (tbody) {
            tbody.innerHTML = '';
            contacts.forEach(contact => {
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
        const posts = await response.json();
        const blogPosts = document.getElementById('blog-posts');
        if (blogPosts) {
            blogPosts.innerHTML = '';
            posts.forEach(post => {
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
            if (!response.ok) {
                throw new Error('Failed to add post');
            }
            postForm.reset();
            loadPosts();
        } catch (error) {
            document.getElementById('post-error').textContent = error.message;
        }
    });
}