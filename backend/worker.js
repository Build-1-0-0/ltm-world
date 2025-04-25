import { SignJWT, jwtVerify } from 'jose';
import { compare, hash } from 'bcryptjs';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://ltm-world.pages.dev',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Helper to verify JWT
    async function verifyToken(token, requiredRole = null) {
      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET));
        console.log('JWT verified:', { email: payload.email, role: payload.role }); // Debug
        if (requiredRole && payload.role !== requiredRole) return null;
        return payload;
      } catch (e) {
        console.error('Token verification error:', e);
        return null;
      }
    }

    // Register
    if (request.method === 'POST' && url.pathname === '/api/register') {
      try {
        const { email, password } = await request.json();
        console.log('Register attempt:', { email }); // Debug
        const { results } = await env.DB.prepare("SELECT email FROM users WHERE email = ?").bind(email).all();
        if (results.length > 0) {
          return new Response(JSON.stringify({ error: 'Email already registered' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 400,
          });
        }
        const hashedPassword = await hash(password, 10);
        await env.DB.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)").bind(email, hashedPassword, 'user').run();
        return new Response(JSON.stringify({ message: 'User registered successfully' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 201,
        });
      } catch (e) {
        console.error('Register error:', e);
        return new Response(JSON.stringify({ error: `Registration failed: ${e.message}` }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400,
        });
      }
    }

    // Login
    if (request.method === 'POST' && url.pathname === '/api/login') {
      try {
        const { email, password } = await request.json();
        console.log('Login attempt:', { email, passwordLength: password?.length }); // Debug
        const { results } = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).all();
        const user = results[0];
        console.log('User found:', !!user, 'User details:', user ? { email: user.email, role: user.role } : null); // Debug
        if (!user) {
          console.log('No user found for:', email); // Debug
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 401,
          });
        }
        const passwordMatch = await compare(password, user.password);
        console.log('Password match:', passwordMatch, 'Stored hash:', user.password); // Debug
        if (!passwordMatch) {
          console.log('Password mismatch for:', email); // Debug
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 401,
          });
        }
        const payload = { email: user.email, role: user.role };
        console.log('Generating JWT with payload:', payload); // Debug
        const jwt = await new SignJWT(payload)
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('1h')
          .sign(new TextEncoder().encode(env.JWT_SECRET));
        console.log('JWT generated:', payload); // Debug
        return new Response(JSON.stringify({ token: jwt }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } catch (e) {
        console.error('Login server error:', e);
        return new Response(JSON.stringify({ error: `Server error: ${e.message}` }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 500,
        });
      }
    }

    // Projects
    if (url.pathname === '/api/projects') {
      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare("SELECT * FROM projects").all();
          return new Response(JSON.stringify({ data: results }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 200,
          });
        } catch (e) {
          console.error('Projects GET error:', e);
          return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 500,
          });
        }
      }

      if (request.method === 'POST') {
        const auth = request.headers.get('Authorization');
        const payload = await verifyToken(auth?.replace('Bearer ', ''), 'admin');
        if (!payload) {
          return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 401,
          });
        }
        try {
          const { title, type, description, link } = await request.json();
          await env.DB.prepare("INSERT INTO projects (title, type, description, link) VALUES (?, ?, ?, ?)")
            .bind(title, type, description, link)
            .run();
          return new Response(JSON.stringify({ message: 'Project added' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 201,
          });
        } catch (e) {
          console.error('Projects POST error:', e);
          return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 500,
          });
        }
      }
    }

    // Delete project
    if (request.method === 'DELETE' && url.pathname.startsWith('/api/projects/')) {
      const auth = request.headers.get('Authorization');
      const payload = await verifyToken(auth?.replace('Bearer ', ''), 'admin');
      if (!payload) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 401,
        });
      }
      try {
        const id = url.pathname.split('/').pop();
        await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ message: 'Project deleted' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } catch (e) {
        console.error('Project DELETE error:', e);
        return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 500,
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
            status: 200,
          });
        } catch (e) {
          console.error('Posts GET error:', e);
          return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 500,
          });
        }
      }

      if (request.method === 'POST') {
        const auth = request.headers.get('Authorization');
        const payload = await verifyToken(auth?.replace('Bearer ', ''), 'admin');
        if (!payload) {
          return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 401,
          });
        }
        try {
          const { title, content, author } = await request.json();
          await env.DB.prepare("INSERT INTO posts (title, content, author, created_at) VALUES (?, ?, ?, ?)")
            .bind(title, content, author, new Date().toISOString())
            .run();
          return new Response(JSON.stringify({ message: 'Post added' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 201,
          });
        } catch (e) {
          console.error('Posts POST error:', e);
          return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 500,
          });
        }
      }
    }

    // Contact
    if (request.method === 'POST' && url.pathname === '/contact') {
      try {
        const { name, email, message } = await request.json();
        console.log('Contact submission:', { name, email }); // Debug
        await env.DB.prepare("INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)")
          .bind(name, email, message)
          .run();
        return new Response(JSON.stringify({ message: `Thank you, ${name}! We’ll get back to you soon.` }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } catch (e) {
        console.error('Contact POST error:', e);
        return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 500,
        });
      }
    }

    // Contacts (Admin)
    if (url.pathname === '/api/contacts') {
      if (request.method === 'GET') {
        const auth = request.headers.get('Authorization');
        const payload = await verifyToken(auth?.replace('Bearer ', ''), 'admin');
        if (!payload) {
          return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 401,
          });
        }
        try {
          const { results } = await env.DB.prepare("SELECT * FROM contacts").all();
          return new Response(JSON.stringify({ data: results }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 200,
          });
        } catch (e) {
          console.error('Contacts GET error:', e);
          return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
            status: 500,
          });
        }
      }
    }

    // Delete contact
    if (request.method === 'DELETE' && url.pathname.startsWith('/api/contacts/')) {
      const auth = request.headers.get('Authorization');
      const payload = await verifyToken(auth?.replace('Bearer ', ''), 'admin');
      if (!payload) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 401,
        });
      }
      try {
        const id = url.pathname.split('/').pop();
        await env.DB.prepare("DELETE FROM contacts WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ message: 'Contact deleted' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 200,
        });
      } catch (e) {
        console.error('Contact DELETE error:', e);
        return new Response(JSON.stringify({ error: `Error: ${e.message}` }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 500,
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 404,
    });
  },
};