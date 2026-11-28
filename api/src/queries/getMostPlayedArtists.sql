WITH per_song AS (
    SELECT s.id, s.name, s."image", s.album, s.artist, COUNT(*) AS plays
    FROM listens l
    JOIN songs s ON l.song_id = s.id
    WHERE s.artist NOT IN ('Unknown', 'undefined')
    GROUP BY s.id
),
groups AS (
    SELECT artist, SUM(plays)::INT AS listens
    FROM per_song
    GROUP BY artist
    ORDER BY listens DESC
    LIMIT 5
),
top_songs AS (
    SELECT DISTINCT ON (p.artist) p.*
    FROM per_song p
    JOIN groups g ON g.artist = p.artist
    ORDER BY p.artist, p.plays DESC
)
SELECT
    ar.name AS artist,
    ar.id AS artist_id,
    g.listens,
    t.name AS top_song,
    al.name AS album,
    t."image",
    t.id AS song_id
FROM groups g
JOIN artists ar ON g.artist = ar.id
LEFT JOIN top_songs t ON g.artist = t.artist
LEFT JOIN albums al ON t.album = al.id
ORDER BY g.listens DESC;
