addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    if (request.method === 'POST') {
        const { name, email, message } = await request.json();
        // For now, just echo back a success message
        // Later, you could integrate with email services or a DB
        return new Response(`Thank you, ${name}! We’ll get back to you soon.`, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    return new Response('Welcome to LTM-World', { status: 200 });
}
