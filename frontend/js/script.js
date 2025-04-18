// Simple admin authentication
const adminSecret = '123456789'; // Replace with a secure password
const adminLinks = document.querySelectorAll('#admin-link');
if (adminLinks.length) {
    const password = prompt('Enter admin password:');
    if (password === adminSecret) {
        adminLinks.forEach(link => link.style.display = 'inline');
    }
}

// Contact form submission
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

// Load projects for portfolio.html
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
    } catch (error) {
        console.error('Error loading projects:', error);
        document.querySelectorAll('.project-list').forEach(list => {
            list.innerHTML = '<li>Error loading projects</li>';
        });
    }
}
if (document.querySelector('.project-list')) {
    loadProjects();
}

// Load contacts for admin.html
async function loadContacts() {
    const secret = 'your-api-secret-key'; // Replace with the same key as in worker.js
    try {
        const response = await fetch(`https://ltm-world.africancontent807.workers.dev/api/contacts?secret=${secret}`);
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