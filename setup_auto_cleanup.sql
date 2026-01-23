-- 1. Crea la funzione di pulizia
CREATE OR REPLACE FUNCTION delete_old_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms
  WHERE created_at < NOW() - INTERVAL '60 minutes';
END;
$$ LANGUAGE plpgsql;

-- 2. (Opzionale) Abilita estensione pg_cron se disponibile su Supabase
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Pianifica il job (se pg_cron è attivo)
-- SELECT cron.schedule(
--   'delete-old-rooms', -- nome del job
--   '*/10 * * * *',     -- ogni 10 minuti
--   $$SELECT delete_old_rooms()$$
-- );

-- NOTA: Se pg_cron non è disponibile nel tuo piano Supabase,
-- puoi chiamare questa funzione manualmente o usare un servizio esterno (es. Github Actions)
-- per fare una richiesta HTTP alle API di Supabase.
