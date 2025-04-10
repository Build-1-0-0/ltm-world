addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);

    // Fetch all projects from D1
    if (url.pathname === '/api/projects') {
        try {
            const { results } = await env.DB.prepare("SELECT * FROM projects").all();
            return new Response(JSON.stringify(results), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            });
        } catch (e) {
            return new Response(`Error: ${e.message}`, { status: 500 });
        }
    }

    // Handle contact form submissions
    if (request.method === 'POST' && url.pathname === '/contact') {
        const { name, email, message } = await request.json();
        try {
            // Assuming a contacts table exists; adjust if needed
            await env.DB.prepare("INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)")
                .bind(name, email, message)
                .run();
            return new Response(`Thank you, ${name}! We’ll get back to you soon.`, {
                status: 200
            });
        } catch (e) {
            return new Response(`Error: ${e.message}`, { status: 500 });
        }
    }

    return new Response('Welcome to LTM-World', { status: 200 });
               }
