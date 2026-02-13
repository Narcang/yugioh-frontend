import { createClient } from '@supabase/supabase-js';

const supabaseUrlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseUrl = supabaseUrlEnv;
let supabaseAnonKey = supabaseAnonKeyEnv;

if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    // Debug logging
    console.error('Build Environment Debug:');
    try {
        // Filter keys to avoid leaking unrelated secrets, but show what we have
        const keys = Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_'));
        console.error('Available NEXT_PUBLIC_ Keys:', keys);
    } catch (e) {
        console.error('Could not list env keys');
    }

    // Fallback to allow build to proceed
    // If we throw here, build fails. If we don't, it might fail at runtime if vars are truly missing.
    // But Vercel sometimes injects vars slightly differently or this is a static generation phase.
    if (process.env.NODE_ENV === 'production') {
        console.warn('Using dummy Supabase credentials for build/production fallback.');
        if (!supabaseUrl) supabaseUrl = 'https://placeholder.supabase.co';
        if (!supabaseAnonKey) supabaseAnonKey = 'placeholder';
    } else {
        throw new Error(`Mancano le variabili d'ambiente di Supabase: ${missing.join(', ')}`);
    }
}

// We use (!) because we ensure they are strings above (or we threw an error)
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
