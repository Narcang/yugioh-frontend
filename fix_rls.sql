-- Esegui questo script nell'SQL Editor di Supabase

-- 1. Abilita la lettura pubblica della tabella profiles
-- Questo serve per permettere a tutti gli utenti di vedere i nomi degli altri (es. nella Lobby)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING ( true );

-- 2. Assicura che gli utenti possano aggiornare il PROPRIO profilo
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING ( auth.uid() = id );

-- 3. Assicura che gli utenti possano inserire il PROPRIO profilo
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

-- 4. Abilita RLS (se non è già attivo)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
