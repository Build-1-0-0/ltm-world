import { SignJWT, jwtVerify } from 'jose';
import { compare, hash } from 'bcryptjs';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const corsHeaders = {
            'Access-Control-Allow-Origin': 'https://ltm-world.pages.dev',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Register
        if (request.method === 'POST' && url.pathname === '/api/register') {
            try {
                const { email, password, role = 'user' } = await request.json();
                const hashedPassword = await hash(password, 10);
                await env.DB.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)")
                    .bind(email, hashedPassword, role)
                    .run();
                return new Response(JSON.stringify({ message: 'User registered successfully' }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 201
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: `Registration failed: ${e.message}` }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 400
                });
            }
        }

        // Login
        if (request.method === 'POST' && url.pathname === '/api/login') {
            try {
                const { email, password } = await request.json();
                const { results } = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).all();
                const user = results[0];
                if (!user || !(await compare(password, user.password))) {
                    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders },
                        status: 401
                    });
                }
                const jwt = await new SignJWT({ email, role: user.role })
                    .setProtectedHeader({ alg: 'HS256' })
                    .setExpirationTime('1h')
                    .sign(new TextEncoder().encode(env.JWT_SECRET));
                return new Response(JSON.stringify({ token: jwt }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 200
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: `Server error: ${e.message}` }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 500
                });
            }
        }

        // Verify JWT
        async function verifyToken(token) {
            try {
                const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET));
                return payload;
            } catch {
                return null;
            }
        }

        // Projects
        if (url.pathname === '/api/projects') {
            if (request.method === 'GET') {
                try {
                    const { results } = await env.DB.prepare("SELECT * FROM projects").all();
                    return new Response(JSON.stringify({ data: results }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders },
                        status: 200
                    });
                } catch (e) {
                    return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders },
                        status: 500
                    });
                }
            }
            if (request.method === 'POST') {
                const auth = request.headers.get('Authorization');
                if (!auth || !(await verifyToken(auth.replace('Bearer ', '')))) {
                    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders },
                        status: 401
                    });
                }
                try {
                    const { title, type, description, link } = await request.json();
                    await env.DB.prepare("INSERT INTO projects (title, type, description, link) VALUES (?, ?, ?, ?)")
                        .bind(title, type, description, link)
                        .run();
                    return new Response(JSON.stringify({ message: 'Project added' }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders },
                        status: 201
                    });
                } catch (e) {
                    return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders },
                        status: 500
                    });
                }
            }
        }

        // Delete project
        if (request.method === 'DELETE' && url.pathname.startsWith('/api/projects/')) {
            const auth = request.headers.get('Authorization');
            if (!auth || !(await verifyToken(auth.replace('Bearer ', '')))) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 401
                });
            }
            try {
                const id = url.pathname.split('/').pop();
                await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
                return new Response(JSON.stringify({ message: 'Project deleted' }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 200
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 500
                });
            }
        }

        // Posts
        if (url.pathname === '/api/posts') {
            if (request.method === 'GET') {
                try {
                    const { results } = await env.DB.prepare("SELECT * FROM posts").all();
                    return new Response(JSON.stringify({ data: results }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders },
                        status: 200
                    });
                } catch (e) {
                    return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders },
                        status: 500
                    });
                }
            }
            if (request.method === 'POST') {
                const auth = request.headers.get('Authorization');
                if (!auth || !(await verifyToken(auth.replace('Bearer ', '')))) {
                    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders },
                        status: 401
                    });
                }
                try {
                    const { title, content, author } = await request.json();
                    await env.DB.prepare("INSERT INTO posts (title, content, author, created_at) VALUES (?, ?, ?, ?)")
                        .bind(title, content, author, new Date().toISOString())
                        .run();
                    return new Response(JSON.stringify({ message: 'Post added' }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders },
                        status: 201
                    });
                } catch (e) {
                    return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders },
                        status: 500
                    });
                }
            }
        }

        // Contacts
        if (request.method === 'POST' && url.pathname === '/contact') {
            try {
                const { name, email, message } = await request.json();
                await env.DB.prepare("INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)")
                    .bind(name, email, message)
                    .run();
                return new Response(JSON.stringify({ message: `Thank you, ${name}! We’ll get back to you soon.` }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 200
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 500
                });
            }
        }

        if (url.pathname === '/api/contacts') {
            const auth = request.headers.get('Authorization');
            if (!auth || !(await verifyToken(auth.replace('Bearer ', '')))) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 401
                });
            }
            try {
                const { results } = await env.DB.prepare("SELECT * FROM contacts").all();
                return new Response(JSON.stringify({ data: results }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 200
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    status: 500
                });
            }
        }

        return new Response(JSON.stringify({ message: 'Welcome to LTM-World' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 200
        });
    }
};