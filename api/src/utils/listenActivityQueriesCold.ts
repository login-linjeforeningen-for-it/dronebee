import run from '#db'
import { loadSQL } from '#utils/loadSQL.ts'

const queries = {
    stats: 'getStatistics',
    mostPlayedAlbums: 'getMostPlayedAlbums',
    mostPlayedArtists: 'getMostPlayedArtists',
    mostPlayedSongs: 'getMostPlayedSongs',
    mostPlayedEpisodes: 'getMostPlayedEpisodes',
    mostPlayedSongsPerDay: 'getSongsPlayedPerDay',
    topFiveToday: 'getTopFiveSongsToday',
    topFiveYesterday: 'getTopFiveSongsYesterday',
    topFiveThisWeek: 'getTopFiveSongsThisWeek',
    topFiveLastWeek: 'getTopFiveSongsLastWeek',
    topFiveThisMonth: 'getTopFiveSongsThisMonth',
    topFiveEpisodesThisMonth: 'getTopFiveEpisodesThisMonth',
    topFiveLastMonth: 'getTopFiveSongsLastMonth',
    topFiveEpisodesLastMonth: 'getTopFiveEpisodesLastMonth',
    topFiveThisYear: 'getTopFiveSongsThisYear',
    topFiveLastYear: 'getTopFiveSongsLastYear',
    mostActiveUsers: 'getMostActiveListenUsers',
    mostSkippingUsers: 'getMostSkippingUsers',
    mostLikedAlbums: 'getMostLikedAlbums',
    mostLikedArtists: 'getMostLikedArtists',
    mostLikedSongs: 'getMostLikedSongs',
    mostLikedEpisodes: 'getMostLikedEpisodes',
    mostSkippedAlbums: 'getMostSkippedAlbums',
    mostSkippedArtists: 'getMostSkippedArtists',
    mostSkippedSongs: 'getMostSkippedSongs',
    mostSkippedEpisodes: 'getMostSkippedEpisodes',
    mostInspiredEpisodes: 'getMostInspiredEpisodes',
    mostInspiredSongs: 'getMostInspiredSongs'
}

export default async function preloadListenActivityQueriesCold() {
    const result: Record<string, unknown> = {}

    for (const [key, file] of Object.entries(queries)) {
        const { rows } = await run(await loadSQL(`${file}.sql`))
        result[key] = key === 'stats' ? rows[0] : rows
    }

    return result
}
