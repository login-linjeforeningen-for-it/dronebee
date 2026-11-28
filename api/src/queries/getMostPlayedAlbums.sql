WITH groups AS (
    SELECT album, artist, SUM(listens) AS total_listens
    FROM songs
    WHERE artist NOT IN ('Unknown', 'undefined')
    GROUP BY album, artist
    ORDER BY total_listens DESC
    LIMIT 5
)
SELECT
    al.name AS album,
    al.id AS album_id,
    ar.name AS artist,
    ar.id AS artist_id,
    g.total_listens,
    t.name AS top_song,
    t."image" AS top_song_image,
    t.id AS song_id
FROM groups g
JOIN albums al ON g.album = al.id
JOIN artists ar ON g.artist = ar.id
CROSS JOIN LATERAL (
    SELECT s.name, s."image", s.id
    FROM songs s
    WHERE s.album = g.album AND s.artist = g.artist
    ORDER BY s.listens DESC
    LIMIT 1
) t
ORDER BY g.total_listens DESC;
