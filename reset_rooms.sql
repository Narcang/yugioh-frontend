-- Resetta completamente tutte le stanze (Lobbies)
-- Utile per fare pulizia immediata

TRUNCATE TABLE rooms RESTART IDENTITY CASCADE;

-- Se vuoi cancellare solo le stanze ma non resettare gli ID:
-- DELETE FROM rooms;
