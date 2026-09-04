const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function tmdbFetch(endpoint) {

    const separator = endpoint.includes("?") ? "&" : "?";

    const response = await fetch(
        `https://api.themoviedb.org/3${endpoint}${separator}api_key=${TMDB_API_KEY}`
    );

    if (!response.ok) {

        throw new Error(
            `TMDB request failed: ${response.status}`
        );

    }

    return await response.json();

}

module.exports = {
    tmdbFetch
};