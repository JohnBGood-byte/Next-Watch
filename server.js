const express = require("express");
require("dotenv").config({ path: ".env.local" });

const { tmdbFetch } = require("./API/tmdb");

const app = express();
const PORT = process.env.PORT || 3000;


// Serve the website
app.use(express.static(__dirname));


// TMDB API endpoint
app.get("/api/tmdb", async (req, res) => {

    try {

        const endpoint = req.query.endpoint;

        if (!endpoint) {

            return res.status(400).json({
                error: "Missing TMDB endpoint"
            });

        }

        const data = await tmdbFetch(endpoint);

        res.json(data);

    } catch (error) {

        console.error("TMDB error:", error);

        res.status(500).json({
            error: "TMDB request failed"
        });

    }

});


app.listen(PORT, () => {

    console.log(
        `Next Watch running at http://localhost:${PORT}`
    );

});