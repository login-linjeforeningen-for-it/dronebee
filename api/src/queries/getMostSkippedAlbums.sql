WITH per_song AS (
    SELECT s.id, s.name, s."image", s.album, s.artist,
        COUNT(*) AS plays,
        COUNT(*) FILTER (WHERE l.skipped) AS skips
    FROM listens l
    JOIN songs s ON l.song_id = s.id
    GROUP BY s.id
),
groups AS (
    SELECT album, artist, SUM(skips)::INT AS skips
    FROM per_song
    GROUP BY album, artist
    ORDER BY skips DESC
    LIMIT 5
),
top_songs AS (
    SELECT DISTINCT ON (p.album, p.artist) p.*
    FROM per_song p
    JOIN groups g ON g.album = p.album AND g.artist = p.artist
    ORDER BY p.album, p.artist, p.plays DESC
)
SELECT
    al.name AS album,
    al.id AS album_id,
    ar.name AS artist,
    ar.id AS artist_id,
    g.skips,
    t.name AS top_song,
    t."image" AS top_song_image,
    t.id AS song_id
FROM groups g
JOIN albums al ON g.album = al.id
JOIN artists ar ON g.artist = ar.id
JOIN top_songs t ON g.album = t.album AND g.artist = t.artist
ORDER BY g.skips DESC;
