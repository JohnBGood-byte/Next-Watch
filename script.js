


const searchButton = document.getElementById("searchBtn");
const randomMovieButton = document.getElementById("randomMovieBtn");
const randomBattleButton = document.getElementById("randomBattleBtn");
async function tmdbFetch(endpoint) {

    const response = await fetch(
        `/api/tmdb?endpoint=${encodeURIComponent(endpoint)}`
    );

    if (!response.ok) {

        throw new Error(
            `TMDB request failed: ${response.status}`
        );

    }

    return await response.json();

}

const status = document.getElementById("status");
const result = document.getElementById("result");

const genreSelect = document.getElementById("genreSelect");
const genreDiscoverBtn = document.getElementById("genreDiscoverBtn");

const hiddenGemBtn = document.getElementById("hiddenGemBtn");

const topMoviesBtn = document.getElementById("topMoviesBtn");
const topGenreSelect = document.getElementById("topGenreSelect");
const topMovieList = document.getElementById("topMovieList");

const streamingDropdownButton =
    document.getElementById("streamingDropdownButton");

const streamingDropdownMenu =
    document.getElementById("streamingDropdownMenu");

const platformCheckboxes =
    document.querySelectorAll(".platform-checkbox");


// CLEAR TOP 10 LIST

function clearTopMovies() {

    topMovieList.innerHTML = "";

}


// GET SELECTED STREAMING PLATFORMS

function getSelectedPlatforms() {

    const selectedPlatforms = [];

    platformCheckboxes.forEach(checkbox => {

        if (checkbox.checked) {

            selectedPlatforms.push(checkbox.value);

        }

    });

    return selectedPlatforms;

}


// NORMALISE PLATFORM NAME

function normalisePlatformName(name) {

    return name

        .toLowerCase()

        .replace(/\s+amazon channel$/i, "")

        .replace(/\s+with\s+ads$/i, "")

        .replace(/\s+standard$/i, "")

        .replace(/\s+premium$/i, "")

        .replace(/\s+basic$/i, "")

        .replace(/\+/g, "plus")

        .replace(/\s+/g, " ")

        .trim();

}


// CHECK IF MOVIE MATCHES SELECTED PLATFORM FILTER

async function movieMatchesStreamingFilter(movieId) {

    const selectedPlatforms = getSelectedPlatforms();


    // No platforms selected = everything is allowed

    if (selectedPlatforms.length === 0) {

        return true;

    }


    try {

        const providers = await getStreamingProviders(movieId);


        if (!providers || providers.length === 0) {

            return false;

        }


        const providerNames = providers.map(provider =>

            normalisePlatformName(provider.provider_name)

        );


        return selectedPlatforms.some(selectedPlatform => {

            const selectedName =
                normalisePlatformName(selectedPlatform);


            return providerNames.some(providerName =>

                providerName.includes(selectedName) ||
                selectedName.includes(providerName)

            );

        });


    } catch (error) {

        console.error(
            "Streaming filter error:",
            error
        );

        return false;

    }

}


// FIND A RANDOM MOVIE THAT MATCHES THE FILTER

async function getFilteredRandomMovie(options = {}) {

    const {
        genre = "",
        hiddenGem = false
    } = options;

    const selectedPlatforms = getSelectedPlatforms();


    // If no platform filter is selected,
    // use the normal random movie logic.

    if (selectedPlatforms.length === 0) {

        return await discoverMovie(
            genre,
            hiddenGem
        );

    }


    // TMDb provider IDs for Australian streaming services.
    // These allow us to filter directly through
    // the Discover endpoint instead of checking
    // every movie individually.

    const providerIds = {

        "Netflix": 8,

        "Prime Video": 119,

        "Disney+": 337,

        "Binge": 385,

        "Stan": 21,

        "Apple TV+": 350,

        "Paramount+": 1346,

        "Foxtel Now": 150,

        "Crunchyroll": 283,

        "MUBI": 11,

        "Shudder": 247,

        "BritBox": 197,

        "9Now": 392,

        "HBO Max": 1899

    };


    const selectedProviderIds =
        selectedPlatforms

            .map(platform =>
                providerIds[platform]
            )

            .filter(id => id);


    // If we don't recognise the selected platform,
    // fall back to the old method.

    if (selectedProviderIds.length === 0) {

        return await discoverMovie(
            genre,
            hiddenGem
        );

    }


  // Try several pages so an empty random page
// doesn't incorrectly mean there are no movies.

try {

    const pages = [];

    for (let i = 0; i < 5; i++) {

        pages.push(
            Math.floor(Math.random() * 20) + 1
        );

    }


    for (const page of pages) {

        let endpoint =
    `/discover/movie?` +
    `include_adult=false` +
    `&watch_region=AU` +
    `&with_watch_providers=${selectedProviderIds.join("|")}` +
    `&page=${page}`;


if (genre) {

    endpoint +=
        `&with_genres=${genre}`;

}


if (hiddenGem) {

    endpoint +=
        `&vote_average.gte=7` +
        `&vote_count.gte=100`;

}


const data =
    await tmdbFetch(endpoint);


        if (
            data.results &&
            data.results.length > 0
        ) {

            return data.results[
                Math.floor(
                    Math.random() *
                    data.results.length
                )
            ];

        }

    }


    return null;


} catch (error) {

    console.error(
        "Filtered random movie error:",
        error
    );


    return null;

}
}


// UPDATE PLATFORM BUTTON

function updatePlatformButton() {

    const selectedPlatforms =
        getSelectedPlatforms();


    if (selectedPlatforms.length === 0) {

        streamingDropdownButton.innerHTML =
            "📺 Platforms ▾";

    } else {

        streamingDropdownButton.innerHTML =
            `📺 ${selectedPlatforms.join(" + ")} ▾`;

    }

}


// PLATFORM DROPDOWN

streamingDropdownButton.addEventListener(
    "click",
    function (event) {

        event.stopPropagation();

        streamingDropdownMenu.classList.toggle("show");

    }
);


// CLOSE DROPDOWN WHEN CLICKING OUTSIDE

document.addEventListener(
    "click",
    function (event) {

        if (

            !streamingDropdownButton.contains(event.target) &&

            !streamingDropdownMenu.contains(event.target)

        ) {

            streamingDropdownMenu.classList.remove("show");

        }

    }
);


// UPDATE BUTTON WHEN CHECKBOXES CHANGE

platformCheckboxes.forEach(checkbox => {

    checkbox.addEventListener(
        "change",
        function () {

            updatePlatformButton();

        }
    );

});


// COMPARE BUTTON

searchButton.addEventListener(
    "click",
    async function () {

        clearTopMovies();


        const movie1 =
            document.getElementById("movie1")
                .value
                .trim();


        const movie2 =
            document.getElementById("movie2")
                .value
                .trim();


        if (!movie1 || !movie2) {

            status.innerHTML =
                "⚠️ Please enter two movie titles.";

            return;

        }


        compareMovies(movie1, movie2);

    }
);


// RANDOM MOVIE

randomMovieButton.addEventListener(
    "click",
    async function () {

        clearTopMovies();


        status.innerHTML =
            "🎲 Finding a random movie...";


        const movie =
            await getFilteredRandomMovie();


        if (!movie) {

            status.innerHTML =
                "😕 Couldn't find a movie on your selected platform(s). Try another platform or clear the filter.";

            return;

        }


        status.innerHTML =
            `🎬 Random pick: ${movie.title}`;


        const movieDetails =
            await searchMovie(movie.title);


        const movieCard =
            await createMovieCard(movieDetails);


        result.innerHTML = `

        <div class="single-movie-container">

            <div class="movie-card winner-card">

                <div class="badge-container">

                    <div class="winner">
                        🎲 Random Pick
                    </div>

                </div>

                ${movieCard}

            </div>

        </div>

        `;

    }
);


// RANDOM WATCH OFF

randomBattleButton.addEventListener(
    "click",
    async function () {

        clearTopMovies();


        status.innerHTML =
            "⚔️ Creating random Watch Off...";


        const movie1 =
            await getFilteredRandomMovie();


        let movie2 = null;


        // Find a second movie

        for (let attempt = 0; attempt < 8; attempt++) {

            const candidate =
                await getFilteredRandomMovie();


            if (
                candidate &&
                movie1 &&
                candidate.id !== movie1.id
            ) {

                movie2 = candidate;

                break;

            }

        }


        if (!movie1 || !movie2) {

            status.innerHTML =
                "😕 Couldn't find two suitable movies. Try clearing or changing the platform filter.";

            return;

        }


        document.getElementById("movie1").value =
            movie1.title;


        document.getElementById("movie2").value =
            movie2.title;


        compareMovies(
            movie1.title,
            movie2.title
        );

    }
);


// DISCOVER BY GENRE

genreDiscoverBtn.addEventListener(
    "click",
    async function () {

        clearTopMovies();

        const genre =
            genreSelect.value;

        if (!genre) {

            status.innerHTML =
                "⚠️ Please choose a genre.";

            return;

        }

        status.innerHTML =
            "🍿 Finding your movie...";

        const movie =
            await getFilteredRandomMovie({
                genre: genre
            });

        if (!movie) {

            status.innerHTML =
                "😕 Couldn't find a suitable movie. Try another genre or clear the platform filter.";

            return;

        }

        const movieDetails =
            await searchMovie(movie.title);

        if (!movieDetails) {

            status.innerHTML =
                "😕 Couldn't load that movie. Please try again.";

            return;

        }

        const movieCard =
            await createMovieCard(movieDetails);

        result.innerHTML = `

            <div class="single-movie-container">

                <div class="movie-card winner-card">

                    <div class="badge-container">

                        <div class="winner">
                            🍿 Pick For You
                        </div>
                    </div>

                    ${movieCard}

                </div>

            </div>

        `;

        status.innerHTML = "";

    }
);


// HIDDEN GEMS

hiddenGemBtn.addEventListener(
    "click",
    async function () {

        clearTopMovies();


        try {

            status.innerHTML =
                "💎 Finding a hidden gem...";


            const movie =
                await getFilteredRandomMovie({
                    hiddenGem: true
                });


            if (!movie) {

                status.innerHTML =
                    "😕 Couldn't find a hidden gem on your selected platform(s). Try another platform or clear the filter.";

                return;

            }


            console.log(
                "Hidden gem found:",
                movie
            );


            const movieDetails =
                await searchMovie(movie.title);


            const movieCard =
                await createMovieCard(movieDetails);


            result.innerHTML = `

            <div class="single-movie-container">

                <div class="movie-card winner-card">

                    <div class="badge-container">

                        <div class="winner">
                            💎 Hidden Gem
                        </div>

                    </div>

                    ${movieCard}

                </div>

            </div>

            `;


            status.innerHTML = "";


        } catch (error) {

            console.error(
                "Hidden Gem Error:",
                error
            );


            status.innerHTML =
                "❌ Hidden Gem failed. Check console.";

        }

    }
);


// TOP 10 MOVIES BY GENRE

topMoviesBtn.addEventListener(
    "click",
    async function () {

        clearTopMovies();


        const genre =
            topGenreSelect.value;


        if (!genre) {

            status.innerHTML =
                "⚠️ Please choose a genre.";

            return;

        }


        status.innerHTML =
            "🏆 Finding the top movies...";


        const movies =
            await getTopMoviesByGenre(genre);


        if (!movies || movies.length === 0) {

            status.innerHTML =
                "😕 Couldn't find enough movies matching your selected platform.";

            return;

        }


        displayTopMovies(movies);


        status.innerHTML = "";

    }
);


// COMPARE MOVIES

async function compareMovies(movie1, movie2) {

    clearTopMovies();


    status.innerHTML =
        "⏳ Searching...";


    const [data1, data2] =
        await Promise.all([

            searchMovie(movie1),

            searchMovie(movie2)

        ]);


    if (!data1 || !data2) {

        status.innerHTML =
            "❌ One or both movies could not be found.";

        return;

    }


    // Check platform filter

    const matches1 =
        await movieMatchesStreamingFilter(
            data1.id
        );


    const matches2 =
        await movieMatchesStreamingFilter(
            data2.id
        );


    const selectedPlatforms =
        getSelectedPlatforms();


    if (
        selectedPlatforms.length > 0 &&
        (!matches1 || !matches2)
    ) {

        let message =
            "⚠️ ";


        if (!matches1 && !matches2) {

            message +=
                "Neither movie is available on your selected platform(s).";

        } else if (!matches1) {

            message +=
                `${data1.title} isn't available on your selected platform(s).`;

        } else {

            message +=
                `${data2.title} isn't available on your selected platform(s).`;

        }


        status.innerHTML = message;

        return;

    }


    let winner1 = "";
    let winner2 = "";

    let card1 = "";
    let card2 = "";


    if (
        data1.vote_average >
        data2.vote_average
    ) {

        winner1 =
            `<div class="winner">🏆 Winner</div>`;

        card1 =
            "winner-card";


    } else if (
        data2.vote_average >
        data1.vote_average
    ) {

        winner2 =
            `<div class="winner">🏆 Winner</div>`;

        card2 =
            "winner-card";


    } else {

        winner1 =
            `<div class="tie">🤝 Tie</div>`;

        winner2 =
            `<div class="tie">🤝 Tie</div>`;

    }


    const movieCard1 =
        await createMovieCard(data1);


    const movieCard2 =
        await createMovieCard(data2);


    result.innerHTML = `

    <div class="movie-container">

        <div class="movie-card ${card1}">

            <div class="badge-container">

                ${winner1}

            </div>

            ${movieCard1}

        </div>


        <div class="movie-card ${card2}">

            <div class="badge-container">

                ${winner2}

            </div>

            ${movieCard2}

        </div>

    </div>

    `;


    status.innerHTML = "";

}


// SEARCH TMDB

async function searchMovie(title) {

   const data =
    await tmdbFetch(
        `/search/movie?query=${encodeURIComponent(title)}`
    );


    if (
        !data.results ||
        data.results.length === 0
    ) {

        return null;

    }


    const movie =
        data.results[0];


   const details =
    await tmdbFetch(
        `/movie/${movie.id}?append_to_response=credits`
    );


return details;

}


// DISCOVER MOVIE

async function discoverMovie(
    genre = "",
    hiddenGem = false
) {

    const randomPage =
        Math.floor(Math.random() * 20) + 1;


   let endpoint =

    `/discover/movie?` +
    `include_adult=false` +
    `&page=${randomPage}`;


   if (genre) {

    endpoint +=
        `&with_genres=${genre}` +
        `&vote_average.gte=6.5` +
        `&vote_count.gte=200`;

}


    if (hiddenGem) {

          endpoint +=
        `&vote_average.gte=7` +
        `&vote_count.gte=100`;

}


  const data =
    await tmdbFetch(endpoint);


    if (
        !data.results ||
        data.results.length === 0
    ) {

        return null;

    }


    return data.results[
        Math.floor(
            Math.random() *
            data.results.length
        )
    ];

}


// GET TOP MOVIES BY GENRE

async function getTopMoviesByGenre(genre) {

    const selectedPlatforms =
        getSelectedPlatforms();


    let collectedMovies = [];


    // We check several pages because platform
    // filtering can remove many of the top movies.

    for (
        let page = 1;
        page <= 5 && collectedMovies.length < 20;
        page++
    ) {

       const endpoint =

    `/discover/movie?` +
    `with_genres=${genre}` +
    `&sort_by=vote_average.desc` +
    `&vote_count.gte=1000` +
    `&include_adult=false` +
    `&page=${page}`; 

       const data =
    await tmdbFetch(endpoint);


        if (
            !data.results ||
            data.results.length === 0
        ) {

            break;

        }


        for (const movie of data.results) {

            if (selectedPlatforms.length === 0) {

                collectedMovies.push(movie);

            } else {

                const matches =
                    await movieMatchesStreamingFilter(
                        movie.id
                    );


                if (matches) {

                    collectedMovies.push(movie);

                }

            }


            if (collectedMovies.length >= 20) {

                break;

            }

        }

    }


    if (collectedMovies.length === 0) {

        return [];

    }


    // Keep the best 20, but randomise the
    // final 10 slightly so the list doesn't
    // become stale.

    collectedMovies.sort(
        (a, b) =>
            b.vote_average -
            a.vote_average
    );


    const topMovies =
        collectedMovies.slice(0, 20);


    topMovies.sort(
        () => Math.random() - 0.5
    );


    return topMovies.slice(0, 10);

}


// DISPLAY TOP MOVIES

function displayTopMovies(movies) {

    topMovieList.innerHTML = `

        <div class="top-list">

            <h2>🏆 Top 10 Movies</h2>


            ${movies.map(
                (movie, index) => `

                <div
                    class="top-movie-item"
                    data-title="${movie.title}"
                >

                    <div class="top-rank">

                        #${index + 1}

                    </div>


                    <div class="top-title">

                        ${movie.title}

                    </div>


                    <div class="top-rating">

                        ⭐ ${movie.vote_average.toFixed(1)}

                    </div>

                </div>

            `).join("")}


        </div>

    `;


    document
        .querySelectorAll(".top-movie-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                async function () {

                    const title =
                        this.dataset.title;


                    status.innerHTML =
                        "🎬 Loading movie...";


                    const movie =
                        await searchMovie(title);


                    if (movie) {

                        const matches =
                            await movieMatchesStreamingFilter(
                                movie.id
                            );


                        if (!matches) {

                            status.innerHTML =
                                "😕 This movie isn't available on your selected platform(s).";

                            return;

                        }


                        const movieCard =
                            await createMovieCard(movie);


                        result.innerHTML = `

                        <div class="single-movie-container">

                            <div class="movie-card winner-card">

                                <div class="badge-container">

                                    <div class="winner">

                                        🏆 Top Pick

                                    </div>

                                </div>

                                ${movieCard}

                            </div>

                        </div>

                        `;


                        status.innerHTML = "";

                    }

                }
            );

        });

}


// GET STREAMING PROVIDERS

async function getStreamingProviders(movieId) {

    try {

        const data =
    await tmdbFetch(
        `/movie/${movieId}/watch/providers`
    );


        const australia =
            data.results?.AU;


        if (!australia) {

            return [];

        }


        // ONLY subscription streaming.
        // Rent and buy are deliberately excluded.

        const providers =
            australia.flatrate || [];


        // Remove duplicates

        const uniqueProviders =
            providers.filter(

                (provider, index, self) =>

                    index ===
                    self.findIndex(

                        p =>
                            p.provider_id ===
                            provider.provider_id

                    )

            );


        return uniqueProviders;


    } catch (error) {

        console.error(
            "Streaming provider error:",
            error
        );


        return [];

    }

}


// CREATE STREAMING HTML

function createStreamingSection(
    providers
) {

    if (
        !providers ||
        providers.length === 0
    ) {

        return `

            <div class="streaming-section">

                <strong>
                    📺 Streaming in Australia
                </strong>

                <p>
                    Not currently available on a
                    subscription streaming service.
                </p>

            </div>

        `;

    }


    const providerMap = {

        "Netflix":
            "Netflix",

        "Netflix Standard":
            "Netflix",

        "BINGE":
            "Binge",

        "Paramount Plus":
            "Paramount+",

        "Paramount Plus Premium":
            "Paramount+",

        "Paramount Plus Basic":
            "Paramount+",

        "Paramount+":
            "Paramount+",

        "Foxtel Now":
            "Foxtel Now",

        "Disney Plus":
            "Disney+",

        "Disney+":
            "Disney+",

        "Amazon Prime Video":
            "Prime Video",

        "Prime Video":
            "Prime Video",

        "Apple TV Plus":
            "Apple TV+",

        "Apple TV+":
            "Apple TV+",

        "HBO Max":
            "HBO Max",

        "Stan":
            "Stan",

        "9Now":
            "9Now",

        "Crunchyroll":
            "Crunchyroll",

        "MUBI":
            "MUBI",

        "Shudder":
            "Shudder",

        "BritBox":
            "BritBox",

        "Sony Pictures Core":
            "Sony Pictures Core"

    };


    const providerNames =
        providers

            .map(provider => {

                let name =
                    provider.provider_name.trim();


                // Remove Amazon Channel

                name =
                    name.replace(
                        /\s+Amazon Channel$/i,
                        ""
                    );


                // Remove plan descriptions

                name =
                    name.replace(
                        /\s+with\s+ads$/i,
                        ""
                    );


                name =
                    name.replace(
                        /\s+Standard$/i,
                        ""
                    );


                name =
                    name.replace(
                        /\s+Premium$/i,
                        ""
                    );


                name =
                    name.replace(
                        /\s+Basic$/i,
                        ""
                    );


                return (
                    providerMap[name] ||
                    name
                );

            })


            .filter(
                (name, index, self) =>
                    self.indexOf(name) === index
            );


    return `

        <div class="streaming-section">

            <strong>
                📺 Streaming in Australia
            </strong>

            <p>
                ${providerNames.join(" • ")}
            </p>

        </div>

    `;

}


// MOVIE CARD

async function createMovieCard(movie) {

    if (!movie) {

        return `

        <div class="error-card">

            <h2>
                ❌ Movie Not Found
            </h2>

            <p>
                Please try another movie.
            </p>

        </div>

        `;

    }


    const rating =
        movie.vote_average;


    const streamingProviders =
        await getStreamingProviders(
            movie.id
        );


    let ratingClass = "low";

    let ratingText =
        "🗑️ Dumpster Fire?";


    if (rating >= 8) {

        ratingClass =
            "excellent";

        ratingText =
            "🔥 Banger!";

    } else if (rating >= 6) {

        ratingClass =
            "good";

        ratingText =
            "👍 Solid Watch";

    }


    const poster =
        movie.poster_path

            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`

            : "";


    const director =
        movie.credits?.crew?.find(
            person =>
                person.job === "Director"
        );


    const actors =
        movie.credits?.cast

            ?.slice(0, 4)

            .map(
                actor =>
                    actor.name
            )

            .join(", ");


    const genres =
        movie.genres

            ?.map(
                genre =>
                    genre.name
            )

            .join(" • ");


    const streamingHTML =
        createStreamingSection(
            streamingProviders
        );


    return `

    <h2 class="movie-title">

        ${movie.title}

    </h2>


    <div class="rating-box">

        <div class="rating ${ratingClass}">

            ⭐ TMDb ${rating.toFixed(1)}/10

        </div>


        <div class="rating-label">

            ${ratingText}

        </div>

    </div>


    <div class="poster-container">

        <img src="${poster}">

    </div>


    <div class="movie-details">

        <p>

            📅 <strong>Year:</strong>

            ${
                movie.release_date?.substring(
                    0,
                    4
                ) || "Unknown"
            }

        </p>


        <p>

            🎭 <strong>Genre:</strong>

            ${genres || "Unknown"}

        </p>


        <p>

            ⏱️ <strong>Runtime:</strong>

            ${
                movie.runtime
                    ? movie.runtime + " mins"
                    : "Unknown"
            }

        </p>


        <p>

            🎬 <strong>Director:</strong>

            ${
                director
                    ? director.name
                    : "Unknown"
            }

        </p>


        <p>

            ⭐ <strong>Cast:</strong>

            ${actors || "Unknown"}

        </p>

    </div>


    ${streamingHTML}


    <div class="plot">

        <strong>Plot:</strong>

        <p>

            ${
                movie.overview ||
                "No plot available."
            }

        </p>

    </div>

    `;

}
