Have a list of films or tv series you want to stream, but don't know where to start?

Simply place your cursor in a block containing the name of the film, trigger this extension via Command Palette - Get Streaming Availability (Current block).

![streaming-availability](https://user-images.githubusercontent.com/6857790/191479333-b68b09b7-7338-452c-8b2c-cc160d6bad72.gif)

**New:**
- Option to check for multiple titles in one command - place cursor in the parent block for a list of films/series you want to stream. Then open Command Palette and use Get Streaming Availability (All Child blocks).
- Fallback to IMDb search results modal if title search fails.

![streaming-availability-multi](https://user-images.githubusercontent.com/6857790/192084925-b045213d-b2cb-4a26-9e79-16be83a4d264.gif)

This extension will find the IMDb id for the film or series, then search for streaming services using the https://rapidapi.com/movie-of-the-night-movie-of-the-night-default/api/streaming-availability/ API.

To configure, you need an API key for two services:
1. https://rapidapi.com/movie-of-the-night-movie-of-the-night-default/api/streaming-availability/
2. http://www.omdbapi.com/apikey.aspx

Enter each of those keys in the Roam Depot config settings. Then, choose the two-letter country code for your country.
