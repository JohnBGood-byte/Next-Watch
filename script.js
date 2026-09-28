// =========================
// NEXT WATCH
// Main application logic
// =========================


// =========================
// DOM ELEMENTS
// =========================

const searchBtn = document.getElementById("searchBtn");
const randomBattleBtn = document.getElementById("randomBattleBtn");
const randomMovieBtn = document.getElementById("randomMovieBtn");

const status = document.getElementById("status");
const result = document.getElementById("result");

const genreSelect = document.getElementById("genreSelect");

const streamingDropdownButton = document.getElementById(
    "streamingDropdownButton"
);

const streamingDropdownMenu = document.getElementById(
    "streamingDropdownMenu"
);

const platformCheckboxes = document.querySelectorAll(
    ".platform-checkbox"
);


// =========================
// TMDB API
// =========================

async function tmdbFetch(endpoint) {

    const response = await fetch(
        `/api/tmdb?endpoint=${encodeURIComponent(endpoint)}`
    );

    if (!response.ok) {
        throw new Error("TMDB request failed.");
    }

    return response.json();
}


// =========================
// STATUS
// =========================

function setStatus(message = "") {

    status.textContent = message;

}


// =========================
// SELECTED PLATFORMS
// =========================

function getSelectedPlatforms() {

    return Array.from(platformCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

}


// =========================
// PLATFORM DROPDOWN
// =========================

streamingDropdownButton.addEventListener("click", function () {

    streamingDropdownMenu.classList.toggle("show");

});


document.addEventListener("click", function (event) {

    if (
        !streamingDropdownMenu.contains(event.target) &&
        !streamingDropdownButton.contains(event.target)
    ) {

        streamingDropdownMenu.classList.remove("show");

    }

});


// Update button when platforms are selected

platformCheckboxes.forEach(checkbox => {

    checkbox.addEventListener("change", function () {

        const selectedPlatforms = getSelectedPlatforms();

        const buttonText =
            streamingDropdownButton.querySelector("span");

        if (selectedPlatforms.length === 0) {

            buttonText.textContent = "Platforms";

        } else if (selectedPlatforms.length === 1) {

            buttonText.textContent = selectedPlatforms[0];

        } else {

            buttonText.textContent =
                `${selectedPlatforms.length} Platforms`;

        }

    });

});


// =========================
// PLATFORM PROVIDER IDs
// AUSTRALIA
// =========================

const platformProviderIds = {

    "Netflix": 8,
    "Prime Video": 119,
    "Disney+": 337,
    "Binge": 385,
    "Stan": 21,
    "Apple TV+": 350,
    "Paramount+": 1346,
    "Foxtel Now": 150,
    "HBO Max": 1899

};


// =========================
// NORMALISE PLATFORM NAMES
// =========================

function normalisePlatformName(name) {

    return name
        .replace(/Amazon Channel/gi, "")
        .replace(/\bwith ads\b/gi, "")
        .replace(/\b(Standard|Premium|Basic)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

}


// =========================
// GET STREAMING PROVIDERS
// =========================

async function getStreamingProviders(movieId) {

    try {

        const data = await tmdbFetch(
            `/movie/${movieId}/watch/providers`
        );

        const australia = data.results?.AU;

        if (!australia) {
            return [];
        }

        const providers = australia.flatrate || [];

        const uniqueProviders = [];

        const seen = new Set();

        providers.forEach(provider => {

            if (!seen.has(provider.provider_id)) {

                seen.add(provider.provider_id);

                uniqueProviders.push({

                    id: provider.provider_id,

                    name: normalisePlatformName(
                        provider.provider_name
                    )

                });

            }

        });

        return uniqueProviders;

    } catch (error) {

        console.error(
            "Streaming provider error:",
            error
        );

        return [];

    }

}


// =========================
// CHECK PLATFORM MATCH
// =========================

async function movieMatchesStreamingFilter(movieId) {

    const selectedPlatforms =
        getSelectedPlatforms();

    if (selectedPlatforms.length === 0) {
        return true;
    }

    const providers =
        await getStreamingProviders(movieId);

    const providerNames =
        providers.map(provider =>
            normalisePlatformName(provider.name)
        );

    return selectedPlatforms.some(platform =>
        providerNames.includes(
            normalisePlatformName(platform)
        )
    );

}


// =========================
// SEARCH MOVIE
// =========================

async function searchMovie(title) {

    const data = await tmdbFetch(
        `/search/movie?query=${encodeURIComponent(title)}`
    );

    if (
        !data.results ||
        data.results.length === 0
    ) {

        return null;

    }

    const movie = data.results[0];

    const details = await tmdbFetch(
        `/movie/${movie.id}?append_to_response=credits`
    );

    return details;

}


// =========================
// FIND RANDOM MOVIE
// =========================

async function getRandomMovie(options = {}) {

    const genre = options.genre || "";

    const selectedPlatforms =
        getSelectedPlatforms();

    // Try several different TMDB pages

    for (
        let attempt = 0;
        attempt < 8;
        attempt++
    ) {

        const randomPage =
            Math.floor(Math.random() * 20) + 1;

        let endpoint =
            `/discover/movie?include_adult=false&language=en-US&page=${randomPage}&sort_by=popularity.desc`;


        // -------------------------
        // GENRE FILTER
        // -------------------------

        if (genre) {

            endpoint +=
                `&with_genres=${genre}`;

        }


        // -------------------------
        // PLATFORM FILTER
        // -------------------------

        if (selectedPlatforms.length > 0) {

            const providerIds =
                selectedPlatforms
                    .map(
                        platform =>
                            platformProviderIds[platform]
                    )
                    .filter(Boolean);

            if (providerIds.length > 0) {

                endpoint +=
                    `&watch_region=AU&with_watch_providers=${providerIds.join("|")}`;

            }

        }


        // -------------------------
        // GET MOVIES FROM TMDB
        // -------------------------

        const data =
            await tmdbFetch(endpoint);

        if (
            !data.results ||
            data.results.length === 0
        ) {

            continue;

        }


        // Randomise movies returned by TMDB

        const movies =
            [...data.results];

        movies.sort(
            () => Math.random() - 0.5
        );


        // -------------------------
        // CHECK EACH MOVIE
        // -------------------------

        for (const movie of movies) {

            const details =
                await tmdbFetch(
                    `/movie/${movie.id}?append_to_response=credits`
                );


            // -------------------------
            // CONFIRM GENRE
            // -------------------------

            if (genre) {

                const movieHasGenre =
                    details.genres?.some(
                        movieGenre =>
                            String(movieGenre.id) ===
                            String(genre)
                    );

                if (!movieHasGenre) {
                    continue;
                }

            }


            // -------------------------
            // CONFIRM PLATFORM
            // -------------------------

            if (
                selectedPlatforms.length > 0
            ) {

                const matchesPlatform =
                    await movieMatchesStreamingFilter(
                        movie.id
                    );

                if (!matchesPlatform) {
                    continue;
                }

            }


            // -------------------------
            // SUITABLE MOVIE FOUND
            // -------------------------

            return details;

        }

    }


    // Nothing suitable found

    return null;

}


// =========================
// CREATE STREAMING SECTION
// =========================

function createStreamingSection(providers) {

    const section =
        document.createElement("div");

    section.className =
        "streaming-section";

    const heading =
        document.createElement("strong");

    heading.textContent =
        "📺 Streaming in Australia";

    section.appendChild(heading);


    const providerList =
        document.createElement("div");

    providerList.className =
        "streaming-providers";


    if (providers.length === 0) {

        const unavailable =
            document.createElement("span");

        unavailable.textContent =
            "Not currently available";

        providerList.appendChild(
            unavailable
        );

    } else {

        providers.forEach(provider => {

            const providerSpan =
                document.createElement("span");

            providerSpan.textContent =
                provider.name;

            providerList.appendChild(
                providerSpan
            );

        });

    }


    section.appendChild(
        providerList
    );

    return section;

}


// =========================
// RATING LABEL
// =========================

function getRatingInfo(rating) {

    if (rating >= 8) {

        return {

            className: "excellent",
            text: "🔥 Banger!"

        };

    }

    if (rating >= 6) {

        return {

            className: "good",
            text: "👍 Solid Watch"

        };

    }

    return {

        className: "low",
        text: "🗑️ Dumpster Fire?"

    };

}


// =========================
// CREATE MOVIE CARD
// =========================

async function createMovieCard(
    movie,
    options = {}
) {

    const card =
        document.createElement("div");

    card.className =
        "movie-card";


    if (options.winner) {

        card.classList.add("winner");

    }


    // -------------------------
    // TITLE
    // -------------------------

    const title =
        document.createElement("h3");

    title.textContent =
        movie.title || "Untitled";

    card.appendChild(title);


    // -------------------------
    // RATING
    // -------------------------

    const rating =
        Number(movie.vote_average || 0);

    const ratingInfo =
        getRatingInfo(rating);

    const ratingBadge =
        document.createElement("div");

    ratingBadge.className =
        `rating-badge ${ratingInfo.className}`;

    ratingBadge.textContent =
        `${rating.toFixed(1)} / 10 · ${ratingInfo.text}`;

    card.appendChild(ratingBadge);


    // -------------------------
    // POSTER
    // -------------------------

    if (movie.poster_path) {

        const poster =
            document.createElement("img");

        poster.className =
            "movie-poster";

        poster.src =
            `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

        poster.alt =
            `${movie.title} poster`;

        card.appendChild(poster);

    }


    // -------------------------
    // YEAR
    // -------------------------

    if (movie.release_date) {

        const year =
            document.createElement("p");

        year.className =
            "movie-year";

        year.textContent =
            movie.release_date.substring(0, 4);

        card.appendChild(year);

    }


    // -------------------------
    // GENRES
    // -------------------------

    if (
        movie.genres &&
        movie.genres.length > 0
    ) {

        const genres =
            document.createElement("p");

        genres.className =
            "movie-genres";

        genres.textContent =
            movie.genres
                .map(genre => genre.name)
                .join(" · ");

        card.appendChild(genres);

    }


    // -------------------------
    // RUNTIME
    // -------------------------

    if (movie.runtime) {

        const runtime =
            document.createElement("p");

        runtime.className =
            "movie-runtime";

        runtime.textContent =
            `${movie.runtime} min`;

        card.appendChild(runtime);

    }


    // -------------------------
    // DIRECTOR
    // -------------------------

    if (movie.credits?.crew) {

        const director =
            movie.credits.crew.find(
                person =>
                    person.job === "Director"
            );

        if (director) {

            const directorElement =
                document.createElement("p");

            directorElement.className =
                "movie-director";

            directorElement.textContent =
                `Director: ${director.name}`;

            card.appendChild(
                directorElement
            );

        }

    }


    // -------------------------
    // CAST
    // -------------------------

    if (
        movie.credits?.cast &&
        movie.credits.cast.length > 0
    ) {

        const cast =
            document.createElement("p");

        cast.className =
            "movie-cast";

        const castNames =
            movie.credits.cast
                .slice(0, 4)
                .map(actor => actor.name)
                .join(", ");

        cast.textContent =
            `Cast: ${castNames}`;

        card.appendChild(cast);

    }


    // -------------------------
    // STREAMING
    // -------------------------

    const providers =
        await getStreamingProviders(
            movie.id
        );

    card.appendChild(
        createStreamingSection(
            providers
        )
    );


    // -------------------------
    // PLOT
    // -------------------------

    if (movie.overview) {

        const plot =
            document.createElement("p");

        plot.className =
            "movie-plot";

        plot.textContent =
            movie.overview;

        card.appendChild(plot);

    }


    return card;

}


// =========================
// DISPLAY SINGLE MOVIE
// =========================

async function displaySingleMovie(
    movie,
    label = ""
) {

    result.innerHTML = "";

    const container =
        document.createElement("div");

    container.className =
        "movie-container";


    if (label) {

        const heading =
            document.createElement("h2");

        heading.textContent =
            label;

        container.appendChild(
            heading
        );

    }


    const card =
        await createMovieCard(movie);

    container.appendChild(card);

    result.appendChild(
        container
    );

}


// =========================
// COMPARE TWO MOVIES
// =========================

async function compareMovies(
    movie1,
    movie2
) {

    setStatus(
        "Comparing movies..."
    );

    result.innerHTML = "";


    try {

        const [
            firstMovie,
            secondMovie
        ] = await Promise.all([

            searchMovie(movie1),

            searchMovie(movie2)

        ]);


        if (
            !firstMovie ||
            !secondMovie
        ) {

            setStatus(
                "I couldn't find one or both movies. Check the titles and try again."
            );

            return;

        }


        // -------------------------
        // PLATFORM FILTER
        // -------------------------

        const selectedPlatforms =
            getSelectedPlatforms();


        if (
            selectedPlatforms.length > 0
        ) {

            const firstAvailable =
                await movieMatchesStreamingFilter(
                    firstMovie.id
                );

            const secondAvailable =
                await movieMatchesStreamingFilter(
                    secondMovie.id
                );


            if (
                !firstAvailable ||
                !secondAvailable
            ) {

                setStatus(
                    "One or both movies aren't available on your selected platform(s)."
                );

                return;

            }

        }


        // -------------------------
        // DETERMINE WINNER
        // -------------------------

        const firstRating =
            Number(
                firstMovie.vote_average || 0
            );

        const secondRating =
            Number(
                secondMovie.vote_average || 0
            );


        let firstWinner = false;
        let secondWinner = false;


        if (
            firstRating > secondRating
        ) {

            firstWinner = true;

        } else if (
            secondRating > firstRating
        ) {

            secondWinner = true;

        }


        // -------------------------
        // CREATE RESULT CONTAINER
        // -------------------------

        const container =
            document.createElement("div");

        container.className =
            "movie-container";


        // -------------------------
        // FIRST MOVIE
        // -------------------------

        const firstCard =
            await createMovieCard(
                firstMovie,
                {
                    winner: firstWinner
                }
            );

        container.appendChild(
            firstCard
        );


        // -------------------------
        // VS
        // -------------------------

        const vs =
            document.createElement("div");

        vs.className =
            "comparison-result-vs";

        vs.textContent =
            firstRating === secondRating
                ? "TIE"
                : "VS";

        container.appendChild(
            vs
        );


        // -------------------------
        // SECOND MOVIE
        // -------------------------

        const secondCard =
            await createMovieCard(
                secondMovie,
                {
                    winner: secondWinner
                }
            );

        container.appendChild(
            secondCard
        );


        // -------------------------
        // DISPLAY
        // -------------------------

        result.appendChild(
            container
        );

        setStatus("");


    } catch (error) {

        console.error(
            "Compare error:",
            error
        );

        setStatus(
            "Something went wrong while comparing the movies."
        );

    }

}


// =========================
// COMPARE BUTTON
// =========================

searchBtn.addEventListener(
    "click",
    async function () {

        const movie1 =
            document
                .getElementById("movie1")
                .value
                .trim();

        const movie2 =
            document
                .getElementById("movie2")
                .value
                .trim();


        if (
            !movie1 ||
            !movie2
        ) {

            setStatus(
                "Enter two movies to compare."
            );

            return;

        }


        await compareMovies(
            movie1,
            movie2
        );

    }
);


// =========================
// WATCH-OFF
// =========================

randomBattleBtn.addEventListener(
    "click",
    async function () {

        setStatus(
            "Finding two movies..."
        );

        result.innerHTML = "";


        try {

            const firstMovie =
                await getRandomMovie({

                    genre:
                        genreSelect.value

                });


            if (!firstMovie) {

                setStatus(
                    "I couldn't find a movie matching those filters."
                );

                return;

            }


            let secondMovie = null;

            let attempts = 0;


            while (
                !secondMovie &&
                attempts < 10
            ) {

                const candidate =
                    await getRandomMovie({

                        genre:
                            genreSelect.value

                    });


                if (
                    candidate &&
                    candidate.id !== firstMovie.id
                ) {

                    secondMovie =
                        candidate;

                }


                attempts++;

            }


            if (!secondMovie) {

                setStatus(
                    "I couldn't find two suitable movies. Try changing the filters."
                );

                return;

            }


            setStatus("");


            const firstRating =
                Number(
                    firstMovie.vote_average || 0
                );

            const secondRating =
                Number(
                    secondMovie.vote_average || 0
                );


            let firstWinner = false;

            let secondWinner = false;


            if (
                firstRating > secondRating
            ) {

                firstWinner = true;

            } else if (
                secondRating > firstRating
            ) {

                secondWinner = true;

            }


            const container =
                document.createElement("div");

            container.className =
                "movie-container";


            const firstCard =
                await createMovieCard(
                    firstMovie,
                    {
                        winner: firstWinner
                    }
                );


            const secondCard =
                await createMovieCard(
                    secondMovie,
                    {
                        winner: secondWinner
                    }
                );


            console.log(
                "SECOND CARD CREATED"
            );


            container.appendChild(
                firstCard
            );


            const vs =
                document.createElement("div");

            vs.className =
                "comparison-result-vs";

            vs.textContent =
                firstRating === secondRating
                    ? "TIE"
                    : "VS";


            container.appendChild(
                vs
            );

            container.appendChild(
                secondCard
            );


            result.appendChild(
                container
            );


        } catch (error) {

            console.error(error);

            setStatus(
                "Something went wrong while creating the Watch-Off."
            );

        }

    }
);


// =========================
// WATCH NEXT
// CAROUSEL LOGIC
// =========================

let watchNextMovies = [];

let watchNextIndex = 0;


// =========================
// GET WATCH NEXT MOVIES
// =========================

async function getWatchNextMovies() {

    setStatus(
        "Finding some movies for you..."
    );

    result.innerHTML = "";

    watchNextMovies = [];

    watchNextIndex = 0;


    const genre =
        genreSelect.value;


    try {

        for (
            let i = 0;
            i < 5;
            i++
        ) {

            const movie =
                await getRandomMovie({
                    genre: genre
                });


            if (!movie) {
                continue;
            }


            // Avoid showing the same movie twice

            const alreadyAdded =
                watchNextMovies.some(
                    existingMovie =>
                        existingMovie.id === movie.id
                );


            if (!alreadyAdded) {

                watchNextMovies.push(
                    movie
                );

            }

        }


        if (
            watchNextMovies.length === 0
        ) {

            setStatus(
                "I couldn't find any movies matching those filters."
            );

            return;

        }


        setStatus("");

        await displayWatchNextMovie();


    } catch (error) {

        console.error(error);

        setStatus(
            "Something went wrong while finding your next movies."
        );

    }

}


// =========================
// DISPLAY WATCH NEXT MOVIE
// =========================

async function displayWatchNextMovie() {

    result.innerHTML = "";


    const container =
        document.createElement("div");

    container.className =
        "watch-next-carousel";


    // -------------------------
    // CURRENT MOVIE
    // -------------------------

    const cardWrapper =
        document.createElement("div");

    cardWrapper.className =
        "watch-next-card-wrapper";


    const card =
        await createMovieCard(
            watchNextMovies[
                watchNextIndex
            ]
        );


    cardWrapper.appendChild(
        card
    );

    container.appendChild(
        cardWrapper
    );


    // =========================
    // MOBILE SWIPE
    // =========================

    let startX = 0;

    let startY = 0;

    let isDragging = false;


    // -------------------------
    // TOUCH START
    // -------------------------

    cardWrapper.addEventListener(
        "touchstart",
        function (event) {

            if (
                event.touches.length !== 1
            ) {

                return;

            }


            startX =
                event.touches[0].clientX;

            startY =
                event.touches[0].clientY;

            isDragging = true;


            cardWrapper.classList.add(
                "swiping"
            );

        },
        {
            passive: true
        }
    );


    // -------------------------
    // TOUCH END
    // -------------------------

    cardWrapper.addEventListener(
        "touchend",
        async function (event) {

            if (!isDragging) {
                return;
            }


            isDragging = false;


            cardWrapper.classList.remove(
                "swiping"
            );


            const endX =
                event.changedTouches[0].clientX;

            const endY =
                event.changedTouches[0].clientY;


            const differenceX =
                endX - startX;

            const differenceY =
                endY - startY;


            // Ignore vertical scrolling

            if (
                Math.abs(differenceY) >
                Math.abs(differenceX)
            ) {

                return;

            }


            // Require a meaningful horizontal swipe

            if (
                Math.abs(differenceX) < 60
            ) {

                return;

            }


            // -------------------------
            // SWIPE LEFT
            // -------------------------

            if (
                differenceX < 0
            ) {

                cardWrapper.classList.add(
                    "swipe-out-left"
                );


                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            250
                        )
                );


                watchNextIndex++;


                if (
                    watchNextIndex >=
                    watchNextMovies.length
                ) {

                    watchNextIndex = 0;

                }


                await displayWatchNextMovie();

            }


            // -------------------------
            // SWIPE RIGHT
            // -------------------------

            else {

                cardWrapper.classList.add(
                    "swipe-out-right"
                );


                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            250
                        )
                );


                watchNextIndex--;


                if (
                    watchNextIndex < 0
                ) {

                    watchNextIndex =
                        watchNextMovies.length - 1;

                }


                await displayWatchNextMovie();

            }

        }
    );


    // =========================
    // ANOTHER MOVIE BUTTON
    // =========================

    const nextButton =
        document.createElement("button");

    nextButton.className =
        "watch-next-cue";

    nextButton.textContent =
        "Another movie →";


    nextButton.addEventListener(
        "click",
        async function () {

            watchNextIndex++;


            if (
                watchNextIndex >=
                watchNextMovies.length
            ) {

                watchNextIndex = 0;

            }


            await displayWatchNextMovie();

        }
    );


    container.appendChild(
        nextButton
    );


    // =========================
    // POSITION DOTS
    // =========================

    const dots =
        document.createElement("div");

    dots.className =
        "watch-next-dots";


    watchNextMovies.forEach(
        function (movie, index) {

            const dot =
                document.createElement("span");

            dot.className =
                "watch-next-dot";


            if (
                index === watchNextIndex
            ) {

                dot.classList.add(
                    "active"
                );

            }


            dots.appendChild(
                dot
            );

        }
    );


    container.appendChild(
        dots
    );


    result.appendChild(
        container
    );

}


// =========================
// WATCH NEXT BUTTON
// =========================

randomMovieBtn.addEventListener(
    "click",
    async function () {

        await getWatchNextMovies();

    }
);