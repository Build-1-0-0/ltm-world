// Contact form
document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    const response = await fetch('https://ltm-world.africancontent807.workers.dev/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
    });

    const text = await response.text();
    document.getElementById('form-response').innerText = text;
});

// Load projects for portfolio
async function loadProjects() {
    const response = await fetch('https://ltm-world.africancontent807.workers.dev/api/projects');
    const projects = await response.json();
    const projectList = document.createElement('ul');
    projects.forEach(project => {
        const li = document.createElement('li');
        li.textContent = `${project.title} (${project.type}) - ${project.description}`;
        projectList.appendChild(li);
    });
    document.querySelector('main').appendChild(projectList);
}
loadProjects();