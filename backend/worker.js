export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const corsHeaders = {
            'Access-Control-Allow-Origin': 'https://ltm-world.pages.dev',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type'
        };

        // Fetch projects for portfolio page
        if (url.pathname === '/api/projects') {
            try {
                const { results } = await env.DB.prepare("SELECT * FROM projects").all();
                return new Response(JSON.stringify(results), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 200
                });
            } catch (e) {
                return new Response(`Error: ${e.message}`, { headers: corsHeaders, status: 500 });
            }
        }

        // Handle contact form submissions
        if (request.method === 'POST' && url.pathname === '/contact') {
            const { name, email, message } = await request.json();
            try {
                await env.DB.prepare("INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)")
                    .bind(name, email, message)
                    .run();
                return new Response(`Thank you, ${name}! We’ll get back to you soon.`, {
                    headers: corsHeaders,
                    status: 200
                });
            } catch (e) {
                return new Response(`Error: ${e.message}`, { headers: corsHeaders, status: 500 });
            }
        }

        // Fetch contacts for admin page (with optional secret key)
        if (url.pathname === '/api/contacts') {
            const secret = url.searchParams.get('secret');
            const validSecret = 'your-secret-key-here'; // Replace with a strong secret
            if (secret !== validSecret) {
                return new Response('Unauthorized', { headers: corsHeaders, status: 403 });
            }
            try {
                const { results } = await env.DB.prepare("SELECT * FROM contacts").all();
                return new Response(JSON.stringify(results), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 200
                });
            } catch (e) {
                return new Response(`Error: ${e.message}`, { headers: corsHeaders, status: 500 });
            }
        }

        // Default response for root or unmatched routes
        return new Response('Welcome to LTM-World', { headers: corsHeaders, status: 200 });
    }
};
