WITH top AS (
    SELECT l.song_id, COUNT(*)::INT AS listens
    FROM listens l
    JOIN songs s ON l.song_id = s.id
    WHERE l."start" >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')
      AND l."start" < DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week') + INTERVAL '1 week'
      AND NOT l.skipped
    GROUP BY l.song_id
    ORDER BY listens DESC
    LIMIT 5
)
SELECT
    s.name AS song,
    ar.name AS artist,
    al.name AS album,
    s."image",
    s.id AS song_id,
    s.artist AS artist_id,
    s.album AS album_id,
    t.listens
FROM top t
JOIN songs s ON t.song_id = s.id
JOIN artists ar ON s.artist = ar.id
JOIN albums al ON s.album = al.id
ORDER BY t.listens DESC;
