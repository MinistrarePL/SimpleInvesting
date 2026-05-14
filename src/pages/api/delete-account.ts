import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

/**
 * Deletes the authenticated user's auth account (uses service role — never expose key to client).
 * Client sends: Authorization: Bearer <access_token>
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    const token =
      authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing bearer token' }), { status: 401 });
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
    const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: delErr } = await admin.auth.admin.deleteUser(userData.user.id);
    if (delErr) {
      console.error('[delete-account]', delErr.message);
      return new Response(JSON.stringify({ error: delErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
