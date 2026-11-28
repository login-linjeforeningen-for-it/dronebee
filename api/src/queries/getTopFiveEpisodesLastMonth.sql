WITH top AS (
    SELECT l.song_id, COUNT(*)::INT AS listens
    FROM listens l
    JOIN episodes e ON l.song_id = e.id
    WHERE l."start" >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      AND l."start" < DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 month'
      AND NOT l.skipped
    GROUP BY l.song_id
    ORDER BY listens DESC
    LIMIT 5
)
SELECT
    e.name AS song,
    ar.name AS show,
    e."image",
    e.id,
    t.listens
FROM top t
JOIN episodes e ON t.song_id = e.id
JOIN artists ar ON e.show = ar.id
ORDER BY t.listens DESC;
