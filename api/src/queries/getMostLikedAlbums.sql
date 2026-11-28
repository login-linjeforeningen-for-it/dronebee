WITH groups AS (
    SELECT
        album,
        artist,
        SUM(listens) AS total_listens,
        SUM(skips) AS total_skips,
        (SUM(listens)::float / NULLIF(SUM(listens + skips), 0)) AS like_ratio
    FROM songs
    GROUP BY album, artist
    HAVING SUM(listens) >= 10
       AND SUM(skips) >= 5
    ORDER BY like_ratio DESC
    LIMIT 5
)
SELECT
    al.name AS album,
    al.id AS album_id,
    ar.name AS artist,
    ar.id AS artist_id,
    t."image",
    t.id AS song_id,
    g.total_listens,
    g.total_skips,
    g.like_ratio
FROM groups g
JOIN albums al ON g.album = al.id
JOIN artists ar ON g.artist = ar.id
CROSS JOIN LATERAL (
    SELECT s."image", s.id
    FROM songs s
    WHERE s.album = g.album AND s.artist = g.artist
    ORDER BY s.listens DESC
    LIMIT 1
) t
ORDER BY g.like_ratio DESC;
